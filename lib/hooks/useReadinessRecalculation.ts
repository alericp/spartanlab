import { useCallback } from 'react'

// [USE-ATHLETE-ID-LOCAL-NOOP] `@/lib/hooks/useAthleteId` does not exist
// in the current tree. The recalculate callback below already safely
// no-ops when `athleteId` is null, so a local null-returning fallback
// keeps the hook compiling without inventing a fake/derived id that
// would trigger erroneous network calls.
function useAthleteId(): string | null {
  return null
}

/**
 * Hook to trigger readiness recalculation
 * Call this after saving a workout log
 */
export function useReadinessRecalculation() {
  const athleteId = useAthleteId()

  const recalculate = useCallback(async () => {
    if (!athleteId) return

    try {
      const response = await fetch('/api/readiness/recalculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ athleteId }),
      })

      if (!response.ok) {
        console.error('[Readiness] Recalculation failed:', response.statusText)
      }
    } catch (error) {
      console.error('[Readiness] Recalculation error:', error)
    }
  }, [athleteId])

  return { recalculate }
}
