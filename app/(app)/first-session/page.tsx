'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Play,
  Target,
  Clock,
  Dumbbell,
  ArrowRight,
  CheckCircle2,
  Zap,
  Shield,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react'
import { SpartanIcon } from '@/components/brand/SpartanLogo'
import { getOnboardingProfile, calculateReadinessScores } from '@/lib/athlete-profile'
import { generateFirstProgram, getProgramReasoning, type FirstRunResult, type ProgramReasoning } from '@/lib/onboarding-service'
import { getLatestAdaptiveProgram, type AdaptiveProgram, type AdaptiveSession } from '@/lib/adaptive-program-builder'
import { getConstraintInsight } from '@/lib/constraint-engine'
import { calculateSpartanScore } from '@/lib/strength-score-engine'
import { getWorkoutLogs } from '@/lib/workout-log-service'

// =============================================================================
// TYPES
// =============================================================================

interface FirstSessionContext {
  session: AdaptiveSession | null
  program: AdaptiveProgram | null
  reasoning: ProgramReasoning | null
  constraintInsight: string | null
  readinessContext: {
    primaryStrength: string | null
    primaryLimiter: string | null
    readinessScore: number
  } | null
  spartanScore: number | null
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generatePersonalizedReasoning(
  session: AdaptiveSession | null,
  program: AdaptiveProgram | null,
  reasoning: ProgramReasoning | null,
  constraintInsight: string | null,
  profile: ReturnType<typeof getOnboardingProfile>
): string {
  if (!session || !program) {
    return 'Your personalized training session is ready.'
  }

  const parts: string[] = []

  // Priority 1: Use the session's rationale if available (most specific)
  if (session.rationale) {
    return session.rationale
  }

  // Priority 2: Use program reasoning's primary focus reason
  if (reasoning?.weakPointSummary?.primaryFocusReason && 
      reasoning.weakPointSummary.primaryFocus !== 'balanced_development') {
    parts.push(reasoning.weakPointSummary.primaryFocusReason)
  }

  // Priority 3: Add constraint-based reasoning
  if (constraintInsight && parts.length === 0) {
    parts.push(constraintInsight)
  }

  // Priority 4: Add session focus reasoning based on detected limiters
  if (parts.length === 0) {
    if (reasoning?.primaryLimitation) {
      const limiterMap: Record<string, string> = {
        'pulling': 'This session builds pulling strength as your primary development area.',
        'pushing': 'This session focuses on pushing strength to accelerate your progress.',
        'compression': 'Compression strength is prioritized to unlock skill progressions.',
        'straight_arm': 'Straight-arm strength work is emphasized for skill development.',
        'mobility': 'Mobility and joint preparation are integrated throughout.',
      }
      if (limiterMap[reasoning.primaryLimitation]) {
        parts.push(limiterMap[reasoning.primaryLimitation])
      }
    }
  }

  // Priority 5: Generic session focus reasoning
  if (parts.length === 0) {
    if (session.focus === 'skill' && session.focusLabel) {
      parts.push(`This session prioritizes ${session.focusLabel.toLowerCase()} work to build toward your primary goal.`)
    } else if (session.focus === 'strength') {
      parts.push('This session builds foundational strength required for advanced skill progressions.')
    } else if (session.focus === 'pull') {
      parts.push('Pulling strength is the foundation for many calisthenics skills. This session builds that base.')
    } else if (session.focus === 'push') {
      parts.push('Pushing strength and shoulder stability are developed in this session.')
    }
  }

  // Add time context if not too long already
  if (parts.length < 2 && profile?.trainingTime) {
    const timeMap: Record<string, string> = {
      '30_min': 'Optimized for your 30-minute training window.',
      '45_min': 'Designed for your 45-minute sessions.',
      '60_min': 'Full development session for your 60-minute availability.',
      '90_min': 'Comprehensive session for your extended training time.',
    }
    if (timeMap[profile.trainingTime]) {
      parts.push(timeMap[profile.trainingTime])
    }
  }

  return parts.length > 0 
    ? parts.slice(0, 2).join(' ') 
    : 'Your first Spartan session is calibrated to your current level and goals.'
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

function FirstSessionContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fromOnboarding = searchParams.get('from') === 'onboarding'
  
  const [context, setContext] = useState<FirstSessionContext | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadFirstSession = async () => {
      try {
        // Check if user has already completed workouts - redirect to dashboard
        const workoutLogs = getWorkoutLogs()
        if (workoutLogs.length > 0) {
          router.replace('/dashboard')
          return
        }
        
        const profile = getOnboardingProfile()
        
        // Try to get existing program first
        let program = getLatestAdaptiveProgram()
        let reasoning: ProgramReasoning | null = null
        
        // If no program exists, generate one
        if (!program) {
          const result = generateFirstProgram()
          if (result.success && result.program) {
            program = result.program
            reasoning = getProgramReasoning(result.program)
          } else {
            throw new Error('Failed to generate first program')
          }
        } else {
          reasoning = getProgramReasoning(program)
        }

        // Get the first session
        const firstSession = program?.sessions?.[0] || null

        // Get constraint insight
        let constraintInsight: string | null = null
        try {
          const insight = getConstraintInsight()
          if (insight?.hasInsight && insight.explanation) {
            constraintInsight = insight.explanation
          }
        } catch {
          // Non-critical
        }

        // Calculate readiness context
        let readinessContext = null
        if (profile) {
          const readiness = calculateReadinessScores(profile)
          
          // Find primary strength and limiter
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

        setContext({
          session: firstSession,
          program,
          reasoning,
          constraintInsight,
          readinessContext,
          spartanScore,
        })
      } catch (err) {
        console.error('Error loading first session:', err)
        setError('Unable to load your first session. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    loadFirstSession()
  }, [router])

  const handleStartSession = () => {
    // Route directly to session with day=1
    router.push('/workout/session?day=1&first=true')
  }

  const handleGoToDashboard = () => {
    router.push('/dashboard')
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="bg-card border-border p-8 max-w-md w-full text-center">
          <div className="animate-pulse mb-6">
            <SpartanIcon size={56} className="mx-auto" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">
            Preparing Your First Session
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Analyzing your profile and building your workout...
          </p>
          <div className="flex justify-center gap-1">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-primary animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </Card>
      </div>
    )
  }

  // Error state
  if (error || !context?.session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="bg-card border-border p-6 max-w-md w-full text-center">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          <h2 className="text-lg font-bold text-foreground mb-2">
            Session Not Ready
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            {error || 'Your training plan is still being prepared.'}
          </p>
          <Button onClick={handleGoToDashboard} variant="outline" className="w-full">
            Go to Dashboard
          </Button>
        </Card>
      </div>
    )
  }

  const { session, program, reasoning, constraintInsight, readinessContext, spartanScore } = context
  const profile = getOnboardingProfile()
  const personalizedReasoning = generatePersonalizedReasoning(
    session,
    program,
    reasoning,
    constraintInsight,
    profile
  )

  // Get goal display name
  const goalDisplayMap: Record<string, string> = {
    front_lever: 'Front Lever',
    planche: 'Planche',
    muscle_up: 'Muscle-Up',
    handstand_pushup: 'Handstand Push-Up',
    weighted_strength: 'Weighted Strength',
    general_strength: 'General Strength',
  }
  const goalDisplay = program?.goalLabel || goalDisplayMap[profile?.primaryGoal || ''] || 'Calisthenics Training'

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="bg-card border-border p-6 max-w-lg w-full">
        {/* Success Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              Your First Spartan Session Is Ready
            </h1>
            <p className="text-sm text-muted-foreground">
              Personalized for your goals and current level
            </p>
          </div>
        </div>

        {/* Session Focus Card */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
              Session Focus
            </span>
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-1">
            {session.dayLabel || `Day 1: ${session.focusLabel || goalDisplay}`}
          </h2>
          <p className="text-sm text-muted-foreground mb-3">
            {session.focusLabel || `${goalDisplay} Development`}
          </p>
          
          {/* Coaching Insight */}
          <div className="bg-muted/30 rounded-md p-3 border-l-2 border-primary">
            <p className="text-xs text-muted-foreground mb-1">Coaching Insight</p>
            <p className="text-sm text-foreground">
              Your program is calibrated to your current strength levels. Log your performance to unlock adaptive adjustments.
            </p>
          </div>
        </div>

        {/* Session Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <Clock className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
            <p className="text-base font-bold text-foreground">
              {session.estimatedMinutes || 45}
            </p>
            <p className="text-[10px] text-muted-foreground">Minutes</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <Dumbbell className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
            <p className="text-base font-bold text-foreground">
              {session.exercises?.length || 0}
            </p>
            <p className="text-[10px] text-muted-foreground">Exercises</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <TrendingUp className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
            <p className="text-base font-bold text-foreground capitalize">
              {session.focus || 'Skill'}
            </p>
            <p className="text-[10px] text-muted-foreground">Type</p>
          </div>
        </div>

        {/* Why This Session - Personalized Reasoning */}
        <div className="bg-muted/30 border border-border rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
              Why This Session
            </span>
          </div>
          <p className="text-sm text-foreground leading-relaxed">
            {personalizedReasoning}
          </p>
          
          {/* Show readiness context if available */}
          {readinessContext && (readinessContext.primaryStrength || readinessContext.primaryLimiter) && (
            <div className="flex flex-wrap gap-2 mt-3">
              {readinessContext.primaryStrength && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded text-xs">
                  <CheckCircle2 className="w-3 h-3" />
                  {readinessContext.primaryStrength}
                </span>
              )}
              {readinessContext.primaryLimiter && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                  <Target className="w-3 h-3" />
                  Focus: {readinessContext.primaryLimiter}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Spartan Score Preview */}
        {spartanScore !== null && (
          <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3 mb-6">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">Starting Spartan Score</span>
            </div>
            <span className="text-lg font-bold text-primary">{spartanScore}</span>
          </div>
        )}

        {/* Primary CTA - Start Session */}
        <Button
          onClick={handleStartSession}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-base font-semibold"
          size="lg"
        >
          <Play className="w-5 h-5 mr-2" />
          Start Session
        </Button>

        {/* Secondary action */}
        <button
          onClick={handleGoToDashboard}
          className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-3 mt-2"
        >
          View Dashboard First
          <ArrowRight className="w-4 h-4 inline ml-1" />
        </button>
      </Card>
    </div>
  )
}

// =============================================================================
// PAGE EXPORT
// =============================================================================

export default function FirstSessionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <FirstSessionContent />
    </Suspense>
  )
}
