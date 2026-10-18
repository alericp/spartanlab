import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  decideAuthenticatedAccess,
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
