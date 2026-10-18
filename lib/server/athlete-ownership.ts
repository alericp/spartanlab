/**
 * Server-side athlete ownership decisions.
 *
 * Clerk is the identity authority. Callers pass the authenticated user id
 * from auth() and the athlete id supplied by the request. This module does
 * not read the database and does not trust a client-supplied id on its own.
 */

export type OwnershipDenialStatus = 400 | 401 | 403 | 404

export type OwnershipDecision =
  | { allowed: true; athleteId: string }
  | { allowed: false; status: OwnershipDenialStatus; error: string }

export function decideAuthenticatedAccess(
  authenticatedUserId: string | null | undefined,
): OwnershipDecision {
  if (!authenticatedUserId) {
    return { allowed: false, status: 401, error: 'Authentication required' }
  }
  return { allowed: true, athleteId: authenticatedUserId }
}

export function decideRequestedAthleteAccess(
  authenticatedUserId: string | null | undefined,
  requestedAthleteId: string | null | undefined,
  missingIdError = 'Athlete ID required',
): OwnershipDecision {
  const authenticated = decideAuthenticatedAccess(authenticatedUserId)
  if (!authenticated.allowed) return authenticated
  if (!requestedAthleteId) {
    return { allowed: false, status: 400, error: missingIdError }
  }
  if (requestedAthleteId !== authenticated.athleteId) {
    return { allowed: false, status: 403, error: 'Forbidden' }
  }
  return { allowed: true, athleteId: authenticated.athleteId }
}

export function decideRecordAccess(
  authenticatedUserId: string | null | undefined,
  recordOwnerId: string | null | undefined,
  notFoundError = 'Not found',
): OwnershipDecision {
  const authenticated = decideAuthenticatedAccess(authenticatedUserId)
  if (!authenticated.allowed) return authenticated
  if (!recordOwnerId || recordOwnerId !== authenticated.athleteId) {
    return { allowed: false, status: 404, error: notFoundError }
  }
  return { allowed: true, athleteId: authenticated.athleteId }
}

export interface OwnedReadResult<T> {
  status: number
  body: T | { error: string }
}

export async function readOwnedAthleteResource<T>(input: {
  authenticatedUserId: string | null
  requestedAthleteId: string | null
  missingIdError?: string
  load: (athleteId: string) => Promise<T>
}): Promise<OwnedReadResult<T>> {
  const decision = decideRequestedAthleteAccess(
    input.authenticatedUserId,
    input.requestedAthleteId,
    input.missingIdError,
  )
  if (!decision.allowed) {
    return { status: decision.status, body: { error: decision.error } }
  }
  const body = await input.load(decision.athleteId)
  return { status: 200, body }
}

export async function readOwnedRecord<T extends { userId: string }>(input: {
  authenticatedUserId: string | null
  notFoundError: string
  load: () => Promise<T | null>
}): Promise<OwnedReadResult<T>> {
  const authenticated = decideAuthenticatedAccess(input.authenticatedUserId)
  if (!authenticated.allowed) {
    return { status: authenticated.status, body: { error: authenticated.error } }
  }
  const record = await input.load()
  const decision = decideRecordAccess(
    input.authenticatedUserId,
    record?.userId ?? null,
    input.notFoundError,
  )
  if (!decision.allowed || !record) {
    return { status: 404, body: { error: input.notFoundError } }
  }
  return { status: 200, body: record }
}

export async function runWhenAuthenticated<T>(input: {
  authenticatedUserId: string | null
  load: () => Promise<T>
}): Promise<OwnedReadResult<T>> {
  const decision = decideAuthenticatedAccess(input.authenticatedUserId)
  if (!decision.allowed) {
    return { status: decision.status, body: { error: decision.error } }
  }
  const body = await input.load()
  return { status: 200, body }
}
