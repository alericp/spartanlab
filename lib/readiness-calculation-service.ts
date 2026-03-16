import { getAthleteProfile } from '@/lib/data-service'
import { calculateSkillReadiness } from '@/lib/readiness/skill-readiness'
import { saveSkillReadiness } from '@/lib/readiness-service'
import type { WorkoutLog } from '@/lib/workout-log-service'

/**
 * Recalculate readiness for all skills after a workout is logged
 *
 * This is called when:
 * - New workout is logged
 * - Strength benchmarks update
 * - Skill progression changes
 * - AthleteProfile updates
 */
export async function recalculateAthleteReadiness(athleteId: string) {
  try {
    const profile = getAthleteProfile()
    if (!profile || profile.id !== athleteId) {
      console.error('[ReadinessRecalc] Profile mismatch or not found')
      return
    }

    const skills = ['front_lever', 'planche', 'hspu', 'muscle_up', 'l_sit'] as const

    for (const skill of skills) {
      const readiness = calculateSkillReadiness(skill, profile)

      if (readiness) {
        await saveSkillReadiness(athleteId, skill, {
          readinessScore: readiness.overallScore,
          pullStrengthScore: readiness.pullStrengthScore,
          compressionScore: readiness.compressionScore,
          scapularControlScore: readiness.scapularControlScore,
          straightArmScore: readiness.straightArmScore,
          mobilityScore: readiness.mobilityScore,
          limitingFactor: readiness.limitingFactor,
        })
      }
    }

    console.log('[ReadinessRecalc] Readiness recalculated for athlete:', athleteId)
  } catch (error) {
    console.error('[ReadinessRecalc] Error recalculating readiness:', error)
  }
}

/**
 * Trigger readiness recalculation after workout logged
 *
 * Call this in the workout logging service
 */
export async function onWorkoutLogged(athleteId: string, workoutLog: WorkoutLog) {
  // Only recalculate if workout included relevant strength exercises
  const hasStrengthWork = workoutLog.exercises.some(
    (ex) =>
      ex.name?.toLowerCase().includes('pull-up') ||
      ex.name?.toLowerCase().includes('dip') ||
      ex.name?.toLowerCase().includes('lever') ||
      ex.name?.toLowerCase().includes('planche') ||
      ex.name?.toLowerCase().includes('handstand')
  )

  if (hasStrengthWork) {
    await recalculateAthleteReadiness(athleteId)
  }
}

/**
 * Trigger readiness recalculation on profile update
 */
export async function onProfileUpdated(athleteId: string) {
  await recalculateAthleteReadiness(athleteId)
}
