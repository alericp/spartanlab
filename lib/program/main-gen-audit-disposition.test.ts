import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import {
  firstObservedSessionCount,
  resolveMainGenDisplayAudit,
  type MainGenDisplayInput,
} from './main-gen-audit-disposition.ts'

const builderAttempt: MainGenDisplayInput = {
  programLoaded: true,
  displayedProgramId: 'adaptive-builder',
  displayedSessionCount: 4,
  displayedCreatedAt: '2026-11-03T00:02:30.000Z',
  savedProgramId: 'adaptive-builder',
  savedSessionCount: 4,
  auditStartedAt: '2026-11-03T00:02:28.000Z',
  expectedSessionCount: null,
  submittedTrainingDays: 4,
  resolvedSessionCount: null,
  builtSessionCount: 4,
  savedProgramTrainingDays: 4,
  savedProgramDeleted: false,
  withinAttemptLock: false,
}

describe('main generation diagnostic disposition', () => {
  it('retires a stale builder audit when a later onboarding program is active', () => {
    const decision = resolveMainGenDisplayAudit({
      ...builderAttempt,
      displayedProgramId: 'adaptive-onboarding',
      displayedCreatedAt: '2026-11-03T00:20:22.906Z',
      savedProgramDeleted: true,
      withinAttemptLock: false,
    })
    assert.equal(decision.action, 'retire')

    const page = readFileSync(new URL('../../app/(app)/program/page.tsx', import.meta.url), 'utf8')
    const effect = page.indexOf('[MAIN-GEN-TRUTH step-8+9-display-and-rehydration]')
    const body = page.slice(effect, effect + 4500)
    assert.match(body, /if \(!program\) return/)
    assert.match(body, /sessionStorage\.removeItem\('mainGenTruthAudit'\)/)
    assert.match(body, /resolveMainGenDisplayAudit\(/)
  })

  it('keeps overwrite detection for the same generation attempt', () => {
    const replacedDuringLock = resolveMainGenDisplayAudit({
      ...builderAttempt,
      displayedProgramId: 'adaptive-older',
      displayedCreatedAt: '2026-11-03T00:01:00.000Z',
      withinAttemptLock: true,
    })
    assert.equal(replacedDuringLock.action, 'update')
    if (replacedDuringLock.action === 'update') {
      assert.equal(replacedDuringLock.finalVerdict, 'MAIN_TARGET_LOST_BY_POST_BUILD_OVERWRITE')
      assert.equal(replacedDuringLock.overwriteSource, 'program_id_mismatch')
    }

    const shrunk = resolveMainGenDisplayAudit({
      ...builderAttempt,
      displayedSessionCount: 2,
    })
    assert.equal(shrunk.action, 'update')
    if (shrunk.action === 'update') {
      assert.equal(shrunk.overwriteSource, 'session_count_mismatch_same_id')
    }
  })

  it('does not produce a failure verdict while no program is loaded', () => {
    const decision = resolveMainGenDisplayAudit({
      ...builderAttempt,
      programLoaded: false,
      displayedProgramId: null,
      displayedSessionCount: null,
      displayedCreatedAt: null,
    })
    assert.equal(decision.action, 'skip')
  })

  it('records a successful reload from observed day counts without inventing a target', () => {
    const decision = resolveMainGenDisplayAudit(builderAttempt)
    assert.equal(decision.action, 'update')
    if (decision.action === 'update') {
      assert.equal(decision.finalVerdict, 'MAIN_FULL_SUCCESS_MATCHED_EXPECTED')
      assert.equal(decision.expectedSessionCount, 4)
      assert.equal(decision.resolvedSessionCount, 4)
      assert.equal(decision.overwriteDetected, false)
    }
    assert.equal(firstObservedSessionCount([null, 'flexible', 0, 4]), 4)
    assert.equal(firstObservedSessionCount([null, undefined]), null)
  })
})
