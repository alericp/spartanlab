import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

/**
 * Route-file checks. Importing the Next route modules pulls in server-only
 * and Clerk, so these tests read the route source and require the ownership
 * call to appear before any athlete or diagnostic loader.
 */
const routes: Array<{
  file: string
  helper: string
  auth: string
  loader: string
}> = [
  {
    file: 'app/api/history/route.ts',
    helper: 'readOwnedAthleteResource',
    auth: 'getSession',
    loader: 'getWorkoutHistoryForUser',
  },
  {
    file: 'app/api/history/workouts/route.ts',
    helper: 'readOwnedAthleteResource',
    auth: 'getSession',
    loader: 'getWorkoutHistoryForUser',
  },
  {
    file: 'app/api/history/programs/route.ts',
    helper: 'readOwnedAthleteResource',
    auth: 'getSession',
    loader: 'getProgramHistoryForUser',
  },
  {
    file: 'app/api/history/prs/route.ts',
    helper: 'readOwnedAthleteResource',
    auth: 'getSession',
    loader: 'getPersonalRecordHistoryForUser',
  },
  {
    file: 'app/api/history/sessions/[id]/route.ts',
    helper: 'readOwnedRecord',
    auth: 'getSession',
    loader: 'getWorkoutSessionHistoryById',
  },
  {
    file: 'app/api/history/program/[id]/route.ts',
    helper: 'readOwnedRecord',
    auth: 'getSession',
    loader: 'getProgramHistoryById',
  },
  {
    file: 'app/api/readiness/route.ts',
    helper: 'readOwnedAthleteResource',
    auth: 'getSession',
    loader: 'getAthleteSkillReadiness',
  },
  {
    file: 'app/api/readiness/recalculate/route.ts',
    helper: 'decideRequestedAthleteAccess',
    auth: 'getSession',
    loader: 'recalculateAthleteReadiness',
  },
  {
    file: 'app/api/short-session/route.ts',
    helper: 'decideRequestedAthleteAccess',
    auth: 'getSession',
    loader: 'generateShortSession',
  },
  {
    file: 'app/api/audit/route.ts',
    helper: 'decideOwnerAccess',
    auth: 'getCurrentUserServer',
    loader: 'runFullAudit',
  },
  {
    file: 'app/api/audit/doctrine-corridor/route.ts',
    helper: 'decideOwnerAccess',
    auth: 'getCurrentUserServer',
    loader: 'buildDoctrineCorridorReport',
  },
  {
    file: 'app/api/audit/doctrine-db/route.ts',
    helper: 'decideOwnerAccess',
    auth: 'getCurrentUserServer',
    loader: 'checkDoctrineRuntimeReadiness',
  },
]

describe('modified HTTP routes call the ownership helper before loading data', () => {
  for (const route of routes) {
    it(route.file, () => {
      const source = readFileSync(route.file, 'utf8')
      const callAt = (name: string) => source.search(new RegExp(`\\b${name}\\(`))
      const helperAt = callAt(route.helper)
      const authAt = callAt(route.auth)
      const loaderAt = callAt(route.loader)
      assert.ok(helperAt >= 0, `${route.file} does not call ${route.helper}`)
      assert.ok(authAt >= 0, `${route.file} does not read ${route.auth}`)
      assert.ok(loaderAt >= 0, `${route.file} does not call ${route.loader}`)
      assert.ok(helperAt < loaderAt, `${route.file} loads data before ${route.helper}`)
    })
  }

  it('history and readiness loaders receive the authorized id, not the raw query', () => {
    const history = readFileSync('app/api/history/route.ts', 'utf8')
    const workouts = readFileSync('app/api/history/workouts/route.ts', 'utf8')
    const readiness = readFileSync('app/api/readiness/route.ts', 'utf8')
    const recalc = readFileSync('app/api/readiness/recalculate/route.ts', 'utf8')
    const session = readFileSync('app/api/short-session/route.ts', 'utf8')

    assert.match(history, /getWorkoutHistoryForUser\(athleteId/)
    assert.match(workouts, /getWorkoutHistoryForUser\(athleteId/)
    assert.match(readiness, /getAthleteSkillReadiness\(athleteId\)/)
    assert.match(recalc, /recalculateAthleteReadiness\(decision\.athleteId\)/)
    assert.match(session, /userId: decision\.athleteId/)
    assert.doesNotMatch(session, /userId: body\.userId/)
    assert.doesNotMatch(recalc, /recalculateAthleteReadiness\(athleteId\)/)
    assert.doesNotMatch(recalc, /recalculateAthleteReadiness\(body/)
  })
})
