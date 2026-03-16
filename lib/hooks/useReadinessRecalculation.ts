import { useCallback } from 'react'
import { useAthleteId } from '@/lib/hooks/useAthleteId'

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
