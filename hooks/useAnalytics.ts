'use client'

import { useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import {
  trackEvent,
  trackSignUpStarted,
  trackAccountCreated,
  trackSignInCompleted,
  trackOnboardingCompleted,
  trackUpgradeStarted,
  trackUpgradeCompleted,
  trackToolUsed,
  trackWorkoutStarted,
  trackWorkoutCompleted,
  trackProgramCreated,
  trackSkillTracked,
  trackStrengthLogged,
  identifyUser,
  AnalyticsEvents,
} from '@/lib/analytics'

/**
 * Hook for analytics tracking with user context
 * Automatically includes user ID when available
 */
export function useAnalytics() {
  const { user, isSignedIn } = useUser()
  
  const identify = useCallback(() => {
    if (user?.id) {
      identifyUser(user.id, { email: user.emailAddresses?.[0]?.emailAddress })
    }
  }, [user])
  
  const trackSignUp = useCallback((source?: string) => {
    trackSignUpStarted(source)
  }, [])
  
  const trackAccountCreate = useCallback(() => {
    if (user?.id) {
      trackAccountCreated(user.id, user.emailAddresses?.[0]?.emailAddress)
    }
  }, [user])
  
  const trackSignIn = useCallback(() => {
    if (user?.id) {
      trackSignInCompleted(user.id)
    }
  }, [user])
  
  const trackOnboarding = useCallback(() => {
    if (user?.id) {
      trackOnboardingCompleted(user.id)
    }
  }, [user])
  
  const trackUpgradeStart = useCallback((source?: string) => {
    trackUpgradeStarted(source, 'pro')
  }, [])
  
  const trackUpgradeComplete = useCallback(() => {
    if (user?.id) {
      trackUpgradeCompleted(user.id, 'pro')
    }
  }, [user])
  
  const trackTool = useCallback((toolName: string, result?: Record<string, unknown>) => {
    trackToolUsed(toolName, result)
  }, [])
  
  const trackWorkoutStart = useCallback((workoutType?: string) => {
    trackWorkoutStarted(workoutType)
  }, [])
  
  const trackWorkoutComplete = useCallback((
    workoutType?: string, 
    durationMinutes?: number,
    exerciseCount?: number
  ) => {
    trackWorkoutCompleted(workoutType, durationMinutes, exerciseCount)
  }, [])
  
  const trackProgram = useCallback((programType?: string) => {
    trackProgramCreated(programType)
  }, [])
  
  const trackSkill = useCallback((skillName: string) => {
    trackSkillTracked(skillName)
  }, [])
  
  const trackStrength = useCallback((exerciseType: string) => {
    trackStrengthLogged(exerciseType)
  }, [])
  
  const track = useCallback((event: string, properties?: Record<string, unknown>) => {
    trackEvent(event, {
      ...properties,
      user_id: user?.id,
      is_signed_in: isSignedIn,
    })
  }, [user, isSignedIn])
  
  return {
    identify,
    trackSignUp,
    trackAccountCreate,
    trackSignIn,
    trackOnboarding,
    trackUpgradeStart,
    trackUpgradeComplete,
    trackTool,
    trackWorkoutStart,
    trackWorkoutComplete,
    trackProgram,
    trackSkill,
    trackStrength,
    track,
    events: AnalyticsEvents,
  }
}
