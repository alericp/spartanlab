import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import {
  clearCurrentUserEmail,
  clerkEmailsEligibleForOwnerMatch,
  isCurrentUserOwner,
  matchingOwnerEmail,
  resolveOwnerEntitlement,
  setCurrentUserEmail,
  setServerVerifiedOwner,
} from './owner-access.ts'

const OWNER_EMAIL = 'owner@example.test'
const ATHLETE_EMAIL = 'athlete@example.test'
const SUBSCRIBER_EMAIL = 'subscriber@example.test'

describe('owner entitlement', () => {
  it('grants the verified owner access on a free plan', () => {
    const decision = resolveOwnerEntitlement({
      authenticatedUserId: 'user_owner_synthetic',
      configuredOwnerEmail: `  ${OWNER_EMAIL.toUpperCase()}  `,
      verifiedEmails: [OWNER_EMAIL],
      subscriptionPlan: 'free',
      subscriptionStatus: 'none',
    })
    assert.deepEqual(decision, {
      isOwner: true,
      hasProAccess: true,
      reason: 'owner',
    })
  })

  it('keeps an ordinary free user restricted', () => {
    const decision = resolveOwnerEntitlement({
      authenticatedUserId: 'user_free_synthetic',
      configuredOwnerEmail: OWNER_EMAIL,
      verifiedEmails: [ATHLETE_EMAIL],
      subscriptionPlan: 'free',
      subscriptionStatus: 'none',
      clientClaimsOwner: true,
      clientSuppliedEmail: OWNER_EMAIL,
    })
    assert.deepEqual(decision, {
      isOwner: false,
      hasProAccess: false,
      reason: 'free',
    })
  })

  it('keeps a paying subscriber on the normal subscription path', () => {
    const active = resolveOwnerEntitlement({
      authenticatedUserId: 'user_pro_synthetic',
      configuredOwnerEmail: OWNER_EMAIL,
      verifiedEmails: [SUBSCRIBER_EMAIL],
      subscriptionPlan: 'pro',
      subscriptionStatus: 'active',
    })
    const trialing = resolveOwnerEntitlement({
      authenticatedUserId: 'user_trial_synthetic',
      configuredOwnerEmail: OWNER_EMAIL,
      verifiedEmails: [SUBSCRIBER_EMAIL],
      subscriptionPlan: 'pro',
      subscriptionStatus: 'trialing',
    })
    assert.equal(active.isOwner, false)
    assert.equal(active.hasProAccess, true)
    assert.equal(active.reason, 'pro')
    assert.equal(trialing.isOwner, false)
    assert.equal(trialing.hasProAccess, true)
    assert.equal(trialing.reason, 'trial')
  })

  it('does not treat a lapsed pro plan as access', () => {
    for (const status of ['past_due', 'canceled', 'none']) {
      const decision = resolveOwnerEntitlement({
        authenticatedUserId: 'user_lapsed_synthetic',
        configuredOwnerEmail: OWNER_EMAIL,
        verifiedEmails: [SUBSCRIBER_EMAIL],
        subscriptionPlan: 'pro',
        subscriptionStatus: status,
      })
      assert.equal(decision.hasProAccess, false, status)
      assert.equal(decision.reason, 'free')
    }
  })

  it('denies an anonymous visitor even when the client claims the owner email', () => {
    const decision = resolveOwnerEntitlement({
      authenticatedUserId: null,
      configuredOwnerEmail: OWNER_EMAIL,
      verifiedEmails: [OWNER_EMAIL],
      clientSuppliedEmail: OWNER_EMAIL,
      clientClaimsOwner: true,
      subscriptionPlan: 'pro',
      subscriptionStatus: 'active',
    })
    assert.deepEqual(decision, {
      isOwner: false,
      hasProAccess: false,
      reason: 'unauthenticated',
    })
  })

  it('matches the primary address and ignores an unverified extra address', () => {
    const emails = [
      {
        id: 'email_unverified',
        emailAddress: OWNER_EMAIL,
        verification: { status: 'unverified' },
      },
      {
        id: 'email_primary',
        emailAddress: ATHLETE_EMAIL,
        verification: { status: 'verified' },
      },
    ]
    assert.deepEqual(
      clerkEmailsEligibleForOwnerMatch('email_primary', emails),
      [ATHLETE_EMAIL],
    )
    assert.equal(matchingOwnerEmail(OWNER_EMAIL, 'email_primary', emails), null)

    const primaryIsOwner = [
      {
        id: 'email_other',
        emailAddress: ATHLETE_EMAIL,
        verification: { status: 'verified' },
      },
      {
        id: 'email_owner',
        emailAddress: ` ${OWNER_EMAIL} `,
        verification: { status: null },
      },
    ]
    assert.equal(
      matchingOwnerEmail(OWNER_EMAIL, 'email_owner', primaryIsOwner),
      OWNER_EMAIL,
    )
  })

  it('matches a verified secondary address that is not first in the list', () => {
    const emails = [
      {
        id: 'email_first',
        emailAddress: ATHLETE_EMAIL,
        verification: { status: 'unverified' },
      },
      {
        id: 'email_owner',
        emailAddress: OWNER_EMAIL,
        verification: { status: 'verified' },
      },
    ]
    assert.equal(matchingOwnerEmail(OWNER_EMAIL, 'email_missing', emails), OWNER_EMAIL)
  })

  it('does not grant owner access from the client email cache', () => {
    setServerVerifiedOwner(true)
    setCurrentUserEmail(OWNER_EMAIL)
    assert.equal(isCurrentUserOwner(), false)
    setServerVerifiedOwner(true)
    assert.equal(isCurrentUserOwner(), true)
    clearCurrentUserEmail()
    assert.equal(isCurrentUserOwner(), false)
  })
})

describe('preview and route owner gates', () => {
  it('does not treat a preview hostname as the owner', () => {
    const bootstrap = readFileSync('components/providers/OwnerBootstrapProvider.tsx', 'utf8')
    const legacyHook = readFileSync('hooks/useOwnerInit.ts', 'utf8')
    for (const source of [bootstrap, legacyHook]) {
      assert.equal(source.includes('preview-mode@spartanlab.app'), false)
      assert.equal(source.includes('owner_enabled_preview_mode'), false)
      assert.equal(source.includes('isPreviewEnvironment'), false)
      assert.equal(source.includes('vercel.app'), false)
    }
    assert.match(bootstrap, /fetch\('\/api\/auth\/owner-status'\)/)
    assert.match(bootstrap, /setServerVerifiedOwner\(isOwnerResult\)/)
  })

  it('resolves entitlement and owner status from eligible Clerk emails', () => {
    const entitlement = readFileSync('app/api/entitlement/route.ts', 'utf8')
    const ownerStatus = readFileSync('app/api/auth/owner-status/route.ts', 'utf8')
    const requirePro = readFileSync('lib/server/require-pro.ts', 'utf8')
    for (const source of [entitlement, ownerStatus, requirePro]) {
      assert.match(source, /clerkEmailsEligibleForOwnerMatch/)
      assert.match(source, /resolveOwnerEntitlement/)
      assert.doesNotMatch(source, /emailAddresses\[0\]/)
    }
    assert.match(entitlement, /const hasProAccess = decision\.hasProAccess/)
    assert.match(ownerStatus, /isOwner: decision\.isOwner/)
  })

  it('limits diagnostic owner routes to an eligible owner email', () => {
    for (const file of [
      'app/api/audit/route.ts',
      'app/api/audit/doctrine-corridor/route.ts',
      'app/api/audit/doctrine-db/route.ts',
    ]) {
      const source = readFileSync(file, 'utf8')
      const gate = source.indexOf('decideOwnerAccess(')
      const loader = source.search(/runFullAudit\(|buildDoctrineCorridorReport\(|checkDoctrineRuntimeReadiness\(/)
      assert.ok(gate >= 0, file)
      assert.ok(loader > gate, file)
      assert.match(source, /matchingOwnerEmail\(/)
      assert.doesNotMatch(source, /user\?\.email/)
    }
  })
})
