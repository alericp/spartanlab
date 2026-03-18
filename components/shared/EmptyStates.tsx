'use client'

import { useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Brain,
  Activity,
  Target,
  Dumbbell,
  Calendar,
  TrendingUp,
  Database,
  Zap,
  Timer,
  ArrowRight,
  Sparkles,
  BarChart3,
  Heart,
  ClipboardList,
} from 'lucide-react'

// ============================================================================
// BASE EMPTY STATE COMPONENT
// ============================================================================

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
  primaryAction?: {
    label: string
    href: string
  }
  secondaryAction?: {
    label: string
    href: string
  }
  variant?: 'default' | 'card' | 'inline'
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  variant = 'default',
  className = '',
}: EmptyStateProps) {
  const content = (
    <div className={`text-center py-8 px-4 ${className}`}>
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2A2A2A] to-[#1A1A1A] border border-[#3A3A3A] text-[#E63946] mb-5">
        {icon}
      </div>
      
      <h3 className="text-lg font-semibold text-[#F5F5F5] mb-2">
        {title}
      </h3>
      
      <p className="text-sm text-[#A5A5A5] max-w-sm mx-auto mb-6 leading-relaxed">
        {description}
      </p>

      {(primaryAction || secondaryAction) && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {primaryAction && (
            <Link href={primaryAction.href}>
              <Button className="bg-[#E63946] hover:bg-[#D62828] text-white gap-2 min-w-[160px]">
                {primaryAction.label}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          )}
          {secondaryAction && (
            <Link href={secondaryAction.href}>
              <Button 
                variant="outline" 
                className="border-[#3A3A3A] text-[#A5A5A5] hover:text-[#F5F5F5] hover:border-[#4A4A4A] gap-2 min-w-[160px]"
              >
                {secondaryAction.label}
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  )

  if (variant === 'card') {
    return (
      <Card className="bg-[#1A1A1A] border-[#2A2A2A]">
        {content}
      </Card>
    )
  }

  if (variant === 'inline') {
    return (
      <div className="bg-[#1A1A1A]/50 rounded-xl border border-dashed border-[#2A2A2A]">
        {content}
      </div>
    )
  }

  return content
}

// ============================================================================
// DASHBOARD EMPTY STATE
// ============================================================================

export function DashboardEmptyState() {
  const router = useRouter()
  const isNavigatingRef = useRef(false)
  
  // Hardened mobile-safe navigation with double-tap protection and fallback
  const handleStartWorkout = useCallback(() => {
    // Prevent double-triggering from rapid taps
    if (isNavigatingRef.current) return
    isNavigatingRef.current = true
    
    const targetPath = '/first-session'
    
    // Attempt client-side navigation
    router.push(targetPath)
    
    // Fallback: if pathname hasn't changed after 200ms, force full navigation
    setTimeout(() => {
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith(targetPath)) {
        window.location.assign(targetPath)
      }
    }, 200)
    
    // Reset lock after navigation attempt window
    setTimeout(() => {
      isNavigatingRef.current = false
    }, 1000)
  }, [router])
  
  return (
    <div className="space-y-6">
      {/* Hero Empty State - One Dominant CTA */}
      <Card className="bg-gradient-to-br from-[#1A1A1A] via-[#2A2A2A] to-[#1A1A1A] border-[#3A3A3A] p-8 sm:p-12 relative overflow-hidden">
        {/* Decorative glow - non-interactive */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#E63946]/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        
        {/* Content wrapper - above decorative layers */}
        <div className="relative z-10 text-center max-w-xl mx-auto">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[#E63946]/20 to-[#E63946]/5 border border-[#E63946]/20 mb-6">
            <Zap className="w-10 h-10 text-[#E63946]" />
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-bold text-[#F5F5F5] mb-3">
            Start Your First Workout
          </h2>
          
          <p className="text-[#A5A5A5] mb-2 leading-relaxed">
            Your personalized training program is ready. Begin your first session 
            and SpartanLab will adapt to your performance.
          </p>
          
          <p className="text-sm text-[#6A6A6A] mb-8">
            Each workout builds your training intelligence for smarter recommendations.
          </p>

          {/* Single dominant CTA - hardened mobile navigation with fallback */}
          <Button 
            type="button"
            size="lg" 
            className="bg-[#E63946] hover:bg-[#D62828] text-white gap-2 px-8 py-6 text-lg font-semibold relative z-20 pointer-events-auto touch-manipulation"
            onClick={handleStartWorkout}
          >
            <Dumbbell className="w-5 h-5" />
            Start First Workout
            <ArrowRight className="w-5 h-5" />
          </Button>
          
          {/* Secondary option - subtle */}
          <p className="mt-4 text-sm text-[#6A6A6A]">
            Or <Link href="/my-programs" className="text-[#E63946] hover:underline">view your program</Link> first
          </p>
        </div>
      </Card>

      {/* What happens next - Intelligence preview */}
      <Card className="bg-[#1A1A1A] border-[#2A2A2A] p-6">
        <h3 className="text-sm font-semibold text-[#6A6A6A] uppercase tracking-wider mb-4">
          After your first workout
        </h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#E63946]/10 flex items-center justify-center shrink-0">
              <Brain className="w-4 h-4 text-[#E63946]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#F5F5F5]">Personalized Insights</p>
              <p className="text-xs text-[#6A6A6A]">See your strength profile and limiters</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#E63946]/10 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4 text-[#E63946]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#F5F5F5]">Progress Tracking</p>
              <p className="text-xs text-[#6A6A6A]">Watch your Spartan Score grow</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#E63946]/10 flex items-center justify-center shrink-0">
              <Target className="w-4 h-4 text-[#E63946]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#F5F5F5]">Adaptive Programming</p>
              <p className="text-xs text-[#6A6A6A]">Your next session adjusts to you</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}



// ============================================================================
// SKILL TRACKER EMPTY STATE
// ============================================================================

export function SkillTrackerEmptyState() {
  return (
    <EmptyState
      icon={<Target className="w-8 h-8" />}
      title="No skill data yet"
      description="Track your current level and hold times to unlock readiness analysis and progression guidance."
      primaryAction={{
        label: 'Log Skill Session',
        href: '/skills',
      }}
      variant="card"
    />
  )
}

// ============================================================================
// STRENGTH TRACKER EMPTY STATE
// ============================================================================

export function StrengthTrackerEmptyState() {
  return (
    <EmptyState
      icon={<Dumbbell className="w-8 h-8" />}
      title="No strength records yet"
      description="Log weighted pull-ups, dips, or muscle-up strength to unlock support-strength analysis."
      primaryAction={{
        label: 'Log Strength Record',
        href: '/strength',
      }}
      variant="card"
    />
  )
}

// ============================================================================
// PROGRAM BUILDER EMPTY STATE
// ============================================================================

export function ProgramBuilderEmptyState() {
  return (
    <EmptyState
      icon={<Calendar className="w-8 h-8" />}
      title="Build your first adaptive program"
      description="Complete your athlete profile and goals to generate a program that matches your training level, recovery, and equipment."
      primaryAction={{
        label: 'Complete Profile',
        href: '/settings',
      }}
      secondaryAction={{
        label: 'Open Program Builder',
        href: '/programs',
      }}
      variant="card"
    />
  )
}

// ============================================================================
// WORKOUT HISTORY EMPTY STATE
// ============================================================================

export function WorkoutHistoryEmptyState() {
  return (
    <EmptyState
      icon={<ClipboardList className="w-8 h-8" />}
      title="No workouts logged yet"
      description="Start a workout to build training history, fatigue tracking, and progress intelligence."
      primaryAction={{
        label: 'Start Workout',
        href: '/programs',
      }}
      variant="card"
    />
  )
}

// ============================================================================
// RECOVERY / FATIGUE EMPTY STATE
// ============================================================================

export function RecoveryEmptyState() {
  return (
    <EmptyState
      icon={<Heart className="w-8 h-8" />}
      title="Recovery insights will improve as you train"
      description="SpartanLab needs more workout and effort data to detect fatigue patterns and recovery trends."
      primaryAction={{
        label: 'Log Workout Data',
        href: '/workouts',
      }}
      variant="card"
    />
  )
}

// ============================================================================
// PERFORMANCE DATABASE EMPTY STATE
// ============================================================================

export function PerformanceVaultEmptyState() {
  return (
    <EmptyState
      icon={<Database className="w-8 h-8" />}
      title="Your performance vault is still empty"
      description="As you log workouts, skill progress, and strength PRs, SpartanLab will build your long-term performance history."
      primaryAction={{
        label: 'Log Workout',
        href: '/workouts',
      }}
      secondaryAction={{
        label: 'Track Strength',
        href: '/strength',
      }}
      variant="card"
    />
  )
}

// ============================================================================
// GOAL PROJECTION EMPTY STATE
// ============================================================================

export function GoalProjectionEmptyState() {
  return (
    <EmptyState
      icon={<TrendingUp className="w-8 h-8" />}
      title="More data needed for projections"
      description="Track your skills, strength, and consistency to estimate realistic timelines for your next milestone."
      primaryAction={{
        label: 'Track Skills',
        href: '/skills',
      }}
      secondaryAction={{
        label: 'Log Strength',
        href: '/strength',
      }}
      variant="card"
    />
  )
}

// ============================================================================
// TOOL PAGE PRE-INPUT EMPTY STATE
// ============================================================================

export function ToolPreInputEmptyState({ onAnalyze }: { onAnalyze?: () => void }) {
  return (
    <div className="text-center py-8 px-4">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2A2A2A] to-[#1A1A1A] border border-[#3A3A3A] text-[#E63946] mb-5">
        <BarChart3 className="w-8 h-8" />
      </div>
      
      <h3 className="text-lg font-semibold text-[#F5F5F5] mb-2">
        Analyze your current training level
      </h3>
      
      <p className="text-sm text-[#A5A5A5] max-w-sm mx-auto mb-6 leading-relaxed">
        Enter your current data to get a quick insight and see how SpartanLab can guide your next step.
      </p>

      {onAnalyze && (
        <Button 
          onClick={onAnalyze}
          className="bg-[#E63946] hover:bg-[#D62828] text-white gap-2"
        >
          <Zap className="w-4 h-4" />
          Run Analysis
        </Button>
      )}
    </div>
  )
}

// ============================================================================
// INLINE MINI EMPTY STATE (for cards within pages)
// ============================================================================

export function MiniEmptyState({ 
  icon, 
  message, 
  actionLabel, 
  actionHref 
}: { 
  icon: React.ReactNode
  message: string
  actionLabel?: string
  actionHref?: string
}) {
  return (
    <div className="flex items-center gap-3 p-4 bg-[#1A1A1A]/50 rounded-lg border border-dashed border-[#2A2A2A]">
      <div className="text-[#3A3A3A]">{icon}</div>
      <p className="text-sm text-[#6A6A6A] flex-1">{message}</p>
      {actionLabel && actionHref && (
        <Link href={actionHref}>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-[#E63946] hover:text-[#E63946] hover:bg-[#E63946]/10"
          >
            {actionLabel}
          </Button>
        </Link>
      )}
    </div>
  )
}

// ============================================================================
// SESSION EMPTY STATE (within workout execution)
// ============================================================================

export function SessionEmptyState() {
  return (
    <EmptyState
      icon={<Timer className="w-8 h-8" />}
      title="No active session"
      description="Start a workout from your program to begin tracking sets, rest times, and RPE."
      primaryAction={{
        label: 'View Programs',
        href: '/programs',
      }}
      variant="inline"
    />
  )
}

// ============================================================================
// FATIGUE INTELLIGENCE EMPTY STATE
// ============================================================================

export function FatigueIntelligenceEmptyState() {
  return (
    <div className="text-center py-6">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] text-[#3A3A3A] mb-4">
        <Sparkles className="w-7 h-7" />
      </div>
      <h4 className="font-medium text-[#A5A5A5] mb-1">Fatigue Intelligence Loading</h4>
      <p className="text-sm text-[#6A6A6A] max-w-xs mx-auto">
        Log more workouts with RPE data to unlock adaptive fatigue tracking.
      </p>
    </div>
  )
}

// ============================================================================
// TRAINING MOMENTUM EMPTY STATE
// ============================================================================

export function TrainingMomentumEmptyState() {
  return (
    <MiniEmptyState
      icon={<Activity className="w-5 h-5" />}
      message="Log workouts consistently to track your training momentum."
      actionLabel="Log Workout"
      actionHref="/workouts"
    />
  )
}

// ============================================================================
// PROGRESS FORECAST EMPTY STATE
// ============================================================================

export function ProgressForecastEmptyState() {
  return (
    <MiniEmptyState
      icon={<TrendingUp className="w-5 h-5" />}
      message="More training data needed to generate progress forecasts."
      actionLabel="Track Progress"
      actionHref="/skills"
    />
  )
}
