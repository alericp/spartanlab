import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  canonicalStoredUserId,
  decideAuthenticatedAccess,
  decideOwnerAccess,
  decideRecordAccess,
  decideRequestedAthleteAccess,
  readOwnedAthleteResource,
  readOwnedRecord,
  runWhenAuthenticated,
} from './athlete-ownership.ts'

const OWNER = 'user_owner_synthetic'
const OTHER = 'user_other_synthetic'

describe('requested athlete access', () => {
  it('allows an authenticated athlete to read their own id', () => {
    const decision = decideRequestedAthleteAccess(OWNER, OWNER, 'User ID required')
    assert.deepEqual(decision, { allowed: true, athleteId: OWNER })
  })

  it('denies a request for a different athlete', () => {
    const decision = decideRequestedAthleteAccess(OWNER, OTHER, 'User ID required')
    assert.deepEqual(decision, { allowed: false, status: 403, error: 'Forbidden' })
  })

  it('denies an unauthenticated request before honoring a supplied id', () => {
    const decision = decideRequestedAthleteAccess(null, OWNER, 'User ID required')
    assert.deepEqual(decision, {
      allowed: false,
      status: 401,
      error: 'Authentication required',
    })
  })

  it('keeps the route-specific missing-id error after authentication', () => {
    const decision = decideRequestedAthleteAccess(OWNER, '', 'userId is required')
    assert.equal(decision.allowed, false)
    if (!decision.allowed) {
      assert.equal(decision.status, 400)
      assert.equal(decision.error, 'userId is required')
    }
  })

  it('does not load records when the caller is unauthorized or unauthenticated', async () => {
    let loads = 0
    const load = async (athleteId: string) => {
      loads += 1
      return { athleteId, workouts: [{ id: 'synthetic-session' }] }
    }

    const foreign = await readOwnedAthleteResource({
      authenticatedUserId: OWNER,
      requestedAthleteId: OTHER,
      missingIdError: 'User ID required',
      load,
    })
    const anonymous = await readOwnedAthleteResource({
      authenticatedUserId: null,
      requestedAthleteId: OWNER,
      missingIdError: 'User ID required',
      load,
    })
    const own = await readOwnedAthleteResource({
      authenticatedUserId: OWNER,
      requestedAthleteId: OWNER,
      missingIdError: 'User ID required',
      load,
    })

    assert.equal(foreign.status, 403)
    assert.equal(anonymous.status, 401)
    assert.equal(own.status, 200)
    assert.equal(loads, 1)
    assert.deepEqual(own.body, { athleteId: OWNER, workouts: [{ id: 'synthetic-session' }] })
  })
})

describe('record ownership', () => {
  it('returns the caller’s own session and hides another athlete’s session', async () => {
    const own = await readOwnedRecord({
      authenticatedUserId: OWNER,
      notFoundError: 'Session not found',
      load: async () => ({ userId: OWNER, id: 'session-own' }),
    })
    const foreign = await readOwnedRecord({
      authenticatedUserId: OWNER,
      notFoundError: 'Session not found',
      load: async () => ({ userId: OTHER, id: 'session-foreign' }),
    })
    const missing = await readOwnedRecord({
      authenticatedUserId: OWNER,
      notFoundError: 'Session not found',
      load: async () => null,
    })

    assert.equal(own.status, 200)
    assert.deepEqual(own.body, { userId: OWNER, id: 'session-own' })
    assert.equal(foreign.status, 404)
    assert.deepEqual(foreign.body, { error: 'Session not found' })
    assert.equal(missing.status, 404)
    assert.deepEqual(decideRecordAccess(OWNER, OTHER, 'Program not found'), {
      allowed: false,
      status: 404,
      error: 'Program not found',
    })
  })

  it('does not load a record for an unauthenticated caller', async () => {
    let loads = 0
    const result = await readOwnedRecord({
      authenticatedUserId: null,
      notFoundError: 'Session not found',
      load: async () => {
        loads += 1
        return { userId: OWNER, id: 'session-own' }
      },
    })
    assert.equal(result.status, 401)
    assert.equal(loads, 0)
  })
})

describe('clerk id and canonical profile id', () => {
  it('lets the Clerk user read history stored under either of their ids', async () => {
    const storedId = canonicalStoredUserId(OWNER)
    let loaded: string | null = null
    const byClerk = await readOwnedAthleteResource({
      authenticatedUserId: OWNER,
      requestedAthleteId: OWNER,
      missingIdError: 'User ID required',
      load: async (athleteId) => {
        loaded = athleteId
        return { workouts: [] }
      },
    })
    const byStored = await readOwnedAthleteResource({
      authenticatedUserId: OWNER,
      requestedAthleteId: storedId,
      missingIdError: 'User ID required',
      load: async (athleteId) => ({ athleteId, workouts: [] }),
    })
    const foreignStored = await readOwnedAthleteResource({
      authenticatedUserId: OWNER,
      requestedAthleteId: canonicalStoredUserId(OTHER),
      missingIdError: 'User ID required',
      load: async () => ({ workouts: ['hidden'] }),
    })

    assert.equal(byClerk.status, 200)
    assert.equal(loaded, OWNER)
    assert.equal(byStored.status, 200)
    assert.deepEqual(byStored.body, { athleteId: storedId, workouts: [] })
    assert.equal(foreignStored.status, 403)
  })

  it('returns a session stored under the canonical profile id to that Clerk user', async () => {
    const own = await readOwnedRecord({
      authenticatedUserId: OWNER,
      notFoundError: 'Session not found',
      load: async () => ({ userId: canonicalStoredUserId(OWNER), id: 'session-stored' }),
    })
    const foreign = await readOwnedRecord({
      authenticatedUserId: OWNER,
      notFoundError: 'Session not found',
      load: async () => ({ userId: canonicalStoredUserId(OTHER), id: 'session-other' }),
    })
    assert.equal(own.status, 200)
    assert.equal(foreign.status, 404)
    assert.deepEqual(foreign.body, { error: 'Session not found' })
  })
})

describe('owner-only diagnostic routes', () => {
  const ownerEmail = 'owner@example.test'
  const isOwnerEmail = (email: string | null | undefined) => email === ownerEmail

  it('denies anonymous and signed-in non-owners before the diagnostic runs', () => {
    let runs = 0
    const run = () => {
      runs += 1
      return { verdict: 'PASS' }
    }
    const anonymous = decideOwnerAccess(null, ownerEmail, isOwnerEmail)
    const member = decideOwnerAccess(OWNER, 'athlete@example.test', isOwnerEmail)
    const missingEmail = decideOwnerAccess(OWNER, null, isOwnerEmail)
    const owner = decideOwnerAccess(OWNER, ownerEmail, isOwnerEmail)

    assert.equal(anonymous.allowed, false)
    if (!anonymous.allowed) assert.equal(anonymous.status, 401)
    assert.equal(member.allowed, false)
    if (!member.allowed) assert.equal(member.status, 403)
    assert.equal(missingEmail.allowed, false)
    assert.equal(owner.allowed, true)
    assert.equal(runs, 0)
    run()
    assert.equal(runs, 1)
  })
})

describe('authenticated diagnostic routes', () => {
  it('denies anonymous audit execution and allows the signed-in caller', async () => {
    let runs = 0
    const denied = await runWhenAuthenticated({
      authenticatedUserId: null,
      load: async () => {
        runs += 1
        return { verdict: 'PASS' }
      },
    })
    const allowed = await runWhenAuthenticated({
      authenticatedUserId: OWNER,
      load: async () => {
        runs += 1
        return { verdict: 'PASS' }
      },
    })
    assert.equal(denied.status, 401)
    assert.equal(allowed.status, 200)
    assert.equal(runs, 1)
    assert.deepEqual(decideAuthenticatedAccess(undefined), {
      allowed: false,
      status: 401,
      error: 'Authentication required',
    })
  })
})
