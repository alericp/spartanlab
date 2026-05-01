import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { generateFirstProgram, getProgramReasoning } from '@/lib/onboarding-service'
import { getLatestAdaptiveProgram } from '@/lib/adaptive-program-builder'
import { getOnboardingProfile, calculateReadinessScores } from '@/lib/athlete-profile'
import { getConstraintInsight } from '@/lib/constraint-engine'
import { calculateSpartanScore } from '@/lib/strength-score-engine'

export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get or generate program
    let program = getLatestAdaptiveProgram()
    let reasoning = null
    
    if (!program) {
      const result = await generateFirstProgram()
      if (result.success && result.program) {
        program = result.program
        reasoning = getProgramReasoning(result.program)
      }
    } else {
      reasoning = getProgramReasoning(program)
    }

    if (!program || !program.sessions?.[0]) {
      return NextResponse.json(
        { error: 'No session available', ready: false },
        { status: 200 }
      )
    }

    const firstSession = program.sessions[0]
    const profile = getOnboardingProfile()
    
    // Get constraint insight
    // [PRE-AB6 BUILD GREEN GATE / HELPER SIGNATURE]
    // getConstraintInsight (lib/constraint-engine.ts:539) takes zero
    // arguments and derives the canonical limiter internally; the
    // previous call passed `profile.primaryGoal` which TypeScript
    // rejected. Its return shape is { hasInsight, label, category,
    // focus, explanation, confidence } — there is no `coachingCue`
    // field, so the route now reads `explanation` (the only string
    // field that semantically maps to a coaching cue) gated on
    // `hasInsight` to preserve the original "only surface real
    // insights" intent of the route. The outer `profile?.primaryGoal`
    // guard is preserved so the dashboard does not surface constraint
    // copy before the user has set a goal.
    let constraintInsight: string | null = null
    try {
      if (profile?.primaryGoal) {
        const insight = getConstraintInsight()
        constraintInsight = insight?.hasInsight ? insight.explanation : null
      }
    } catch {
      // Non-critical
    }

    // Calculate readiness context
    let readinessContext = null
    if (profile) {
      const readiness = calculateReadinessScores(profile)
      const scores = [
        { key: 'Pull Strength', value: readiness.pullStrength },
        { key: 'Push Strength', value: readiness.pushStrength },
        { key: 'Compression', value: readiness.compression },
        { key: 'Straight-Arm', value: readiness.straightArmStrength },
      ].filter(s => s.value > 0)
      
      const sorted = [...scores].sort((a, b) => b.value - a.value)
      
      readinessContext = {
        primaryStrength: sorted[0]?.value >= 70 ? sorted[0].key : null,
        primaryLimiter: sorted[sorted.length - 1]?.value < 50 ? sorted[sorted.length - 1].key : null,
        readinessScore: readiness.overall,
      }
    }

    // Get Spartan Score
    let spartanScore: number | null = null
    try {
      const score = calculateSpartanScore()
      spartanScore = score.totalScore
    } catch {
      // Non-critical
    }

    return NextResponse.json({
      ready: true,
      session: {
        dayNumber: firstSession.dayNumber,
        dayLabel: firstSession.dayLabel,
        focus: firstSession.focus,
        focusLabel: firstSession.focusLabel,
        estimatedMinutes: firstSession.estimatedMinutes,
        exerciseCount: firstSession.exercises?.length || 0,
      },
      program: {
        goalLabel: program.goalLabel,
        trainingDaysPerWeek: program.trainingDaysPerWeek,
        sessionCount: program.sessions.length,
      },
      reasoning: reasoning ? {
        strategyFocus: reasoning.strategyFocus,
        primaryFocusReason: reasoning.weakPointSummary?.primaryFocusReason,
        firstSession: reasoning.firstSession,
      } : null,
      constraintInsight,
      readinessContext,
      spartanScore,
    })
  } catch (error) {
    console.error('Error fetching first session:', error)
    return NextResponse.json(
      { error: 'Internal server error', ready: false },
      { status: 500 }
    )
  }
}
