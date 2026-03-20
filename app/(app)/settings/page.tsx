// AUTH_PROD_UNBLOCK_V1
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PageContainer } from '@/components/layout'
import { PageHeader } from '@/components/shared/PageHeader'
import { Settings, Crown, Shield, Target, Sparkles, AlertTriangle, Dumbbell } from 'lucide-react'
import { SKILL_DEFINITIONS } from '@/lib/skills'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  JOINT_CAUTION_LABELS, 
  type JointCaution,
  type EquipmentType,
  WEAKEST_AREA_LABELS,
  type WeakestArea,
} from '@/lib/athlete-profile'
import { 
  STYLE_MODE_DEFINITIONS,
  type TrainingStyleMode,
} from '@/lib/training-style-service'
import { useOwnerInit } from '@/hooks/useOwnerInit'
import { PRICING, TRIAL } from '@/lib/billing/pricing'
import { useEntitlement, setSimulationMode, type SimulationMode } from '@/hooks/useEntitlement'
import { Beaker } from 'lucide-react'
import Link from 'next/link'
import {
  getAthleteProfile,
  saveAthleteProfile,
  type AthleteProfile,
} from '@/lib/data-service'
import { saveCanonicalProfile, logCanonicalProfileState } from '@/lib/canonical-profile-service'
import { DURATION_PREFERENCE_LABELS, type SessionDurationMinutes, logDurationTruth } from '@/lib/duration-contract'
import { logProfileTruthState, diagnoseProfileData } from '@/lib/profile-truth-contract'
import { getActiveProgram, clearActiveProgram } from '@/lib/program-service'
import { 
  analyzeSettingsChanges, 
  canRegenerate,
  markRegeneration,
  getSessionAdaptations,
  type SettingsChangeAnalysis,
} from '@/lib/settings-regeneration-service'
import { UpdateMetricsCard } from '@/components/dashboard/UpdateMetricsCard'
import { useToast } from '@/hooks/use-toast'

// Subscription Billing Card - handles Pro, Trial, and Free states with graceful error handling
// Uses useEntitlement() hook (database-backed) instead of localStorage
function SubscriptionBillingCard() {
  const entitlement = useEntitlement()
  const [billingStatus, setBillingStatus] = useState<'idle' | 'loading' | 'error' | 'no-account'>('idle')
  const [billingMessage, setBillingMessage] = useState('')
  
  // Loading state
  if (entitlement.isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-4 rounded-lg bg-[#1A1A1A] border border-[#3A3A3A] animate-pulse">
          <div className="w-10 h-10 rounded-lg bg-[#3A3A3A]" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-24 bg-[#3A3A3A] rounded" />
            <div className="h-3 w-48 bg-[#3A3A3A] rounded" />
          </div>
        </div>
      </div>
    )
  }
  
  // Free user - show upgrade CTA instead of billing management
  if (!entitlement.hasProAccess && !entitlement.isOwner) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-4 rounded-lg bg-[#1A1A1A] border border-[#3A3A3A]">
          <div className="w-10 h-10 rounded-lg bg-[#3A3A3A] flex items-center justify-center">
            <Shield className="w-5 h-5 text-[#6B7280]" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[#F5F5F5] font-medium">Free Plan</span>
            </div>
            <p className="text-sm text-[#A5A5A5]">
              Basic features for getting started with your training.
            </p>
          </div>
        </div>
        <Link href="/pricing">
          <Button className="w-full bg-[#E63946] hover:bg-[#D62828] text-white">
            <Sparkles className="w-4 h-4 mr-2" />
            Upgrade to Pro
          </Button>
        </Link>
      </div>
    )
  }
  
  const statusLabel = entitlement.isTrialing ? 'Trial Active' : 'Active'
  const statusDescription = entitlement.isTrialing 
    ? 'Your trial is active. You won\'t be charged until it ends.'
    : 'Full access to all training intelligence features.'
  
  const handleManageBilling = async () => {
    setBillingStatus('loading')
    setBillingMessage('')
    
    try {
      const res = await fetch('/api/stripe/create-portal-session', { method: 'POST' })
      const data = await res.json()
      
      if (res.ok && data.url) {
        window.location.href = data.url
        return
      }
      
      // Handle specific error cases gracefully
      if (res.status === 404 || data.error?.includes('No billing account')) {
        setBillingStatus('no-account')
        setBillingMessage('Your billing account is being set up. This usually happens automatically after your first payment.')
      } else {
        setBillingStatus('error')
        setBillingMessage('Unable to open billing portal. Please try again or contact support.')
      }
    } catch (error) {
      console.error('Portal error:', error)
      setBillingStatus('error')
      setBillingMessage('Connection error. Please check your internet and try again.')
    }
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-4 rounded-lg bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20">
        <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
          {entitlement.isTrialing ? (
            <Sparkles className="w-5 h-5 text-amber-400" />
          ) : (
            <Crown className="w-5 h-5 text-amber-400" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[#F5F5F5] font-medium">SpartanLab Pro</span>
            <span className="px-2 py-0.5 text-xs rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
              {statusLabel}
            </span>
          </div>
          <p className="text-sm text-[#A5A5A5]">
            {statusDescription}
          </p>
        </div>
      </div>
      
      {/* Billing status message */}
      {billingStatus === 'no-account' && (
        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <p className="text-sm text-blue-400">{billingMessage}</p>
        </div>
      )}
      {billingStatus === 'error' && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-sm text-red-400">{billingMessage}</p>
        </div>
      )}
      
      {/* 
        Manage Billing button - enabled for all Pro/Trial users
        Trial users started via Stripe Checkout have billing portal access (card collected upfront)
        The API will gracefully return 404 if no Stripe customer exists, which is handled above
      */}
      <Button 
        variant="outline" 
        className="w-full border-[#3A3A3A] text-[#A5A5A5] hover:bg-[#2A2A2A]"
        onClick={handleManageBilling}
        disabled={billingStatus === 'loading'}
      >
        {billingStatus === 'loading' ? 'Opening Billing...' : 'Manage Billing'}
      </Button>
      <p className="text-xs text-[#6B7280]">
        {entitlement.isTrialing ? (
          <>
            View or update payment method. You won&apos;t be charged until your trial ends.{' '}
            <a href="mailto:billing@spartanlab.app" className="text-[#A5A5A5] hover:text-[#F5F5F5] transition-colors">
              billing@spartanlab.app
            </a>
          </>
        ) : (
          <>
            Billing questions?{' '}
            <a href="mailto:billing@spartanlab.app" className="text-[#A5A5A5] hover:text-[#F5F5F5] transition-colors">
              billing@spartanlab.app
            </a>
          </>
        )}
      </p>
    </div>
  )
}

// =============================================================================
// OWNER-ONLY INLINE SIMULATION CONTROL
// Visible only to the platform owner in the Settings Subscription section
// =============================================================================
function OwnerInlineSimulationControl() {
  const entitlement = useEntitlement()
  const { userEmail } = useOwnerInit()
  const mode = entitlement?.simulationMode || 'off'
  const realStatus = entitlement?.plan || 'unknown'
  // Client-side can only access NEXT_PUBLIC_ prefixed env vars
  const ownerEmailConfigured = !!process.env.NEXT_PUBLIC_OWNER_EMAIL
  
  const handleModeChange = (newMode: SimulationMode) => {
    try {
      setSimulationMode(newMode)
      entitlement?.mutate?.()
      window.location.reload()
    } catch {
      // Silent fail - simulation mode change is non-critical
    }
  }
  
  const isActive = mode !== 'off'
  
  return (
    <div className="mt-6 pt-6 border-t border-dashed border-[#3A3A3A]">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Beaker className="w-4 h-4 text-amber-400" />
        <span className="text-sm font-semibold text-amber-400">Owner Simulation</span>
        <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
          Testing Only
        </span>
      </div>
      
      {/* Current status */}
      {isActive && (
        <div className="text-xs text-amber-300/80 bg-amber-900/20 px-3 py-2 rounded mb-3 border border-amber-500/20">
          Simulating: <strong className="text-amber-200">{mode.toUpperCase()}</strong>
          <span className="text-amber-400/60 ml-2">(real: {realStatus})</span>
        </div>
      )}
      
      {/* Mode buttons */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleModeChange('off')}
          className={mode === 'off' 
            ? "bg-[#3A3A3A] text-[#F5F5F5] border-[#4A4A4A]" 
            : "border-[#3A3A3A] text-[#6B7280] hover:bg-[#2A2A2A]"
          }
        >
          Off
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleModeChange('free')}
          className={mode === 'free' 
            ? "bg-[#3A3A3A] text-[#F5F5F5] border-[#4A4A4A]" 
            : "border-[#3A3A3A] text-[#6B7280] hover:bg-[#2A2A2A]"
          }
        >
          Free
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleModeChange('pro')}
          className={mode === 'pro' 
            ? "bg-amber-600 text-white border-amber-500" 
            : "border-[#3A3A3A] text-[#6B7280] hover:bg-[#2A2A2A]"
          }
        >
          Pro
        </Button>
      </div>
      
      {/* Owner diagnostic info */}
      <div className="mt-4 text-xs text-[#4A4A4A] space-y-1 font-mono">
        <p>owner detection: <span className="text-green-500">active</span></p>
        <p>owner email configured: <span className={ownerEmailConfigured ? "text-green-500" : "text-red-400"}>{ownerEmailConfigured ? 'yes' : 'no'}</span></p>
        <p>signed in as: <span className="text-[#6B7280]">{userEmail || 'unknown'}</span></p>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  // Initialize owner detection from Clerk auth
  const { isOwner } = useOwnerInit()
  const { toast } = useToast()
  
  const [profile, setProfile] = useState<AthleteProfile | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [mounted, setMounted] = useState(false)

  const [bodyweight, setBodyweight] = useState('')
  const [experienceLevel, setExperienceLevel] = useState('beginner')
  const [scheduleMode, setScheduleMode] = useState<'static' | 'flexible'>('static')
  const [trainingDays, setTrainingDays] = useState('3')
  // TASK 3: Add sessionDurationMode state - 'static' = fixed duration, 'adaptive' = engine adapts
  const [sessionDurationMode, setSessionDurationMode] = useState<'static' | 'adaptive'>('static')
  const [sessionLength, setSessionLength] = useState('60')
  const [primaryGoal, setPrimaryGoal] = useState('none')
  const [equipment, setEquipment] = useState<EquipmentType[]>([])
  const [jointCautions, setJointCautions] = useState<JointCaution[]>([])
  const [weakestArea, setWeakestArea] = useState<WeakestArea | 'none'>('none')
  const [trainingStyle, setTrainingStyle] = useState<TrainingStyleMode>('balanced_hybrid')
  const [lastChangeResult, setLastChangeResult] = useState<{
    regenerated: boolean
    message: string
    affectedSystems: string[]
  } | null>(null)

  useEffect(() => {
    setMounted(true)
    loadProfile()
  }, [])

  // TASK 3: API-first hydration with localStorage fallback and canonical sync
  const loadProfile = async () => {
    // Log canonical profile diagnostic state at load time
    const diagnostics = diagnoseProfileData()
    console.log('[Settings] Profile diagnostics:', diagnostics)
    logProfileTruthState('Settings page load')
    
    // Step 1: Try API first (canonical truth for authenticated users)
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.profile) {
          // Sync API response to localStorage for offline fallback
          saveAthleteProfile(result.profile)
          applyProfileToState(result.profile)
          console.log('[Settings] Loaded from API and synced to localStorage')
          return
        }
      }
    } catch (err) {
      console.warn('[Settings] API fetch failed, falling back to localStorage:', err)
    }
    
    // Step 2: Fall back to localStorage
    const data = getAthleteProfile()
    if (!data) {
      console.log('[TruthState] No profile found in settings, using defaults')
      return
    }
    applyProfileToState(data)
    console.log('[Settings] Loaded from localStorage fallback')
  }
  
  // Helper to apply profile data to React state
  // ISSUE E FIX: Real round-trip validation - this function hydrates UI from canonical truth
  const applyProfileToState = (data: AthleteProfile & { scheduleMode?: string; sessionDurationMode?: 'static' | 'adaptive'; trainingStyle?: TrainingStyleMode }) => {
    // TASK 7: Dev logging for hydration verification
    console.log('[Settings] applyProfileToState hydrating from canonical truth:', {
      scheduleMode: data.scheduleMode,
      sessionDurationMode: data.sessionDurationMode,
      trainingDaysPerWeek: data.trainingDaysPerWeek,
      sessionLengthMinutes: data.sessionLengthMinutes,
      primaryGoal: data.primaryGoal,
      equipmentCount: data.equipmentAvailable?.length || 0,
    })
    
    setProfile(data as AthleteProfile)
    setBodyweight(data.bodyweight?.toString() || '')
    setExperienceLevel(data.experienceLevel || 'beginner')
    
    // TASK 3: Handle flexible schedule mode correctly - do NOT show "4 days" for flexible users
    const profileScheduleMode = data.scheduleMode
    if (profileScheduleMode === 'flexible') {
      setScheduleMode('flexible')
      // TASK 3 FIX: Do NOT set trainingDays to a fake placeholder
      // The UI will hide the day selector and show flexible mode explanation instead
      setTrainingDays('') // Empty - UI handles flexible mode separately
    } else {
      setScheduleMode('static')
      const profileDays = data.trainingDaysPerWeek
      setTrainingDays(typeof profileDays === 'number' ? profileDays.toString() : '3')
    }
    
    // TASK 3D: Handle adaptive session duration mode - do NOT flatten to fixed 60
    const profileDurationMode = data.sessionDurationMode
    setSessionDurationMode(profileDurationMode === 'adaptive' ? 'adaptive' : 'static')
    
    setSessionLength(data.sessionLengthMinutes?.toString() || '60')
    setPrimaryGoal(data.primaryGoal || 'none')
    setEquipment(data.equipmentAvailable || [])
    setJointCautions(data.jointCautions || [])
    setWeakestArea(data.weakestArea || 'none')
    setTrainingStyle(data.trainingStyle || 'balanced_hybrid')
  }

  // =============================================================================
  // REGRESSION GUARD: SETTINGS MUST WRITE-THROUGH TO CANONICAL PROFILE
  // =============================================================================
  // 
  // This save function MUST call saveCanonicalProfile() to maintain
  // write-through consistency. All profile-editing surfaces must:
  // 1. Call saveCanonicalProfile() with the updated fields
  // 2. Also call saveAthleteProfile() for backward compatibility
  // 3. Log the canonical state after save for debugging
  // 
  // If this write-through breaks:
  // - Settings changes won't reflect in program generation
  // - Onboarding and settings will diverge
  // - The canonical truth contract will be violated
  // =============================================================================
  const handleSave = async () => {
    console.log('[Settings] handleSave started - REGRESSION GUARD: must call saveCanonicalProfile')
    setSaving(true)
    setSaved(false)
    
    try {
      // Prepare update payload - preserve flexible mode semantics
      // TASK 2: For flexible mode, do NOT store a fake numeric default
      // The API will store NULL for trainingDaysPerWeek when scheduleMode='flexible'
      console.log('[Settings] Preparing save payload, scheduleMode:', scheduleMode)
      const updates = {
        bodyweight: bodyweight ? parseFloat(bodyweight) : null,
        experienceLevel: experienceLevel as 'beginner' | 'intermediate' | 'advanced',
        // For flexible mode, send null - API will store it correctly
        // The scheduleMode field is the canonical preference indicator
        trainingDaysPerWeek: scheduleMode === 'flexible' 
          ? null  // TASK 2: NULL = truly flexible, engine derives at runtime
          : parseInt(trainingDays || '3'),
        scheduleMode: scheduleMode,
        // TASK 3D: Preserve sessionDurationMode - 'adaptive' means engine adapts session length
        sessionDurationMode: sessionDurationMode,
        sessionLengthMinutes: parseInt(sessionLength) as 30 | 45 | 60 | 90,
        primaryGoal: primaryGoal === 'none' ? null : primaryGoal,
        equipmentAvailable: equipment,
        jointCautions: jointCautions,
        weakestArea: weakestArea === 'none' ? null : weakestArea,
        trainingStyle: trainingStyle,
      }
      
      try {
        // Try API-based save first (for authenticated users)
        const response = await fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        })
        
        console.log('[Settings] API response status:', response.status)
        if (response.ok) {
          const result = await response.json()
          console.log('[Settings] API save successful, profile returned:', !!result.profile)
          
          // CANONICAL FIX: Sync API response to BOTH localStorage and canonical profile
          // ISSUE A/B FIX: Pass ALL profile fields to preserve full canonical truth
          if (result.profile) {
            saveAthleteProfile(result.profile)
            // Also sync to canonical profile for generation consumption
            // CRITICAL: Must include ALL benchmark fields to prevent drift
            saveCanonicalProfile({
              // Goals & Skills
              primaryGoal: result.profile.primaryGoal,
              secondaryGoal: result.profile.secondaryGoal,
              selectedSkills: result.profile.selectedSkills,
              selectedFlexibility: result.profile.selectedFlexibility,
              selectedStrength: result.profile.selectedStrength,
              goalCategory: result.profile.goalCategory,
              
              // Schedule & Session
              experienceLevel: result.profile.experienceLevel,
              trainingDaysPerWeek: result.profile.trainingDaysPerWeek,
              scheduleMode: result.profile.scheduleMode,
              // TASK 3D: Preserve sessionDurationMode for canonical profile
              sessionDurationMode: result.profile.sessionDurationMode || sessionDurationMode,
              sessionLengthMinutes: result.profile.sessionLengthMinutes,
              
              // Equipment & Diagnostics
              equipmentAvailable: result.profile.equipmentAvailable,
              jointCautions: result.profile.jointCautions,
              weakestArea: result.profile.weakestArea,
              trainingStyle: result.profile.trainingStyle,
              
              // ISSUE B FIX: Sync ALL strength benchmarks to prevent drift
              pullUpMax: result.profile.pullUpMax,
              dipMax: result.profile.dipMax,
              pushUpMax: result.profile.pushUpMax,
              wallHSPUReps: result.profile.wallHSPUReps,
              weightedPullUp: result.profile.weightedPullUp,
              weightedDip: result.profile.weightedDip,
              allTimePRPullUp: result.profile.allTimePRPullUp,
              allTimePRDip: result.profile.allTimePRDip,
              
              // ISSUE B FIX: Sync ALL skill benchmarks
              frontLeverProgression: result.profile.frontLever?.progression,
              frontLeverHoldSeconds: result.profile.frontLever?.holdSeconds,
              frontLeverIsAssisted: result.profile.frontLever?.isAssisted,
              frontLeverBandLevel: result.profile.frontLever?.bandLevel,
              frontLeverHighestEver: result.profile.frontLever?.highestLevelEverReached,
              plancheProgression: result.profile.planche?.progression,
              plancheHoldSeconds: result.profile.planche?.holdSeconds,
              plancheIsAssisted: result.profile.planche?.isAssisted,
              plancheBandLevel: result.profile.planche?.bandLevel,
              plancheHighestEver: result.profile.planche?.highestLevelEverReached,
              muscleUpReadiness: result.profile.muscleUp,
              hspuProgression: result.profile.hspu?.progression,
              lSitHoldSeconds: result.profile.lSitHold,
              vSitHoldSeconds: result.profile.vSitHold,
              
              // ISSUE B FIX: Sync ALL flexibility benchmarks
              pancakeLevel: result.profile.pancake?.level,
              pancakeRangeIntent: result.profile.pancake?.rangeIntent,
              toeTouchLevel: result.profile.toeTouch?.level,
              toeTouchRangeIntent: result.profile.toeTouch?.rangeIntent,
              frontSplitsLevel: result.profile.frontSplits?.level,
              frontSplitsRangeIntent: result.profile.frontSplits?.rangeIntent,
              sideSplitsLevel: result.profile.sideSplits?.level,
              sideSplitsRangeIntent: result.profile.sideSplits?.rangeIntent,
            })
            
            // TASK 3: Log settings saved schedule/duration
            console.log('[Settings] TASK 3: Saved schedule/duration identity:', {
              scheduleMode: scheduleMode,
              trainingDaysPerWeek: scheduleMode === 'flexible' ? null : parseInt(trainingDays || '3'),
              sessionDurationMode: sessionDurationMode,
              sessionLengthMinutes: parseInt(sessionLength),
            })
            
            logCanonicalProfileState('After settings save')
            setProfile(result.profile)
            // Re-apply profile to UI state to ensure consistency
            applyProfileToState(result.profile)
          }
          
          setSaved(true)
          console.log('[Settings] Save complete, setSaved(true)')
          
          // Handle regeneration feedback with coaching explanation
          if (result.regenerated) {
            // Record timestamp for NextWorkoutCard to show update notice
            try {
              localStorage.setItem('spartanlab_program_version_timestamp', new Date().toISOString())
            } catch {
              // localStorage unavailable
            }
            
            setLastChangeResult({
              regenerated: true,
              message: result.analysis?.coachingMessage || 'Your program has been regenerated.',
              affectedSystems: result.analysis?.affectedSystems || [],
            })
            toast({
              title: 'Program Regenerated',
              description: result.analysis?.coachingMessage || 'Your program has been regenerated to match your new settings.',
              duration: 5000,
            })
          } else if (result.adaptations && result.adaptations.length > 0) {
            setLastChangeResult({
              regenerated: false,
              message: result.analysis?.coachingMessage || 'Future sessions will reflect these changes.',
              affectedSystems: result.analysis?.affectedSystems || [],
            })
            toast({
              title: 'Settings Adjusted',
              description: result.analysis?.coachingMessage || 'Future sessions will reflect these changes.',
              duration: 4000,
            })
          } else if (result.analysis?.changes?.length > 0) {
            setLastChangeResult(null)
            toast({
              title: 'Settings Saved',
              description: 'Your preferences have been updated.',
              duration: 3000,
            })
          } else {
            // TASK 6: No changes detected - still show a confirmation
            toast({
              title: 'Settings Saved',
              description: 'No changes detected.',
              duration: 2000,
            })
          }
          
          console.log('[Settings] API save path complete')
          return
        }
        
        // API failed - fall back to localStorage
        console.warn('[Settings] API save failed with status:', response.status, 'using localStorage fallback')
      } catch (error) {
        console.warn('[Settings] API error, using localStorage fallback:', error)
      }
      
      console.log('[Settings] Falling back to localStorage save')
      
      // FALLBACK: localStorage-based save (for preview/development mode)
      const previousProfile = profile
      
      const updated = saveAthleteProfile({
        ...updates,
      } as Parameters<typeof saveAthleteProfile>[0])
      
      setProfile(updated)
      setSaved(true)
      console.log('[Settings] localStorage save complete')
      
      // Analyze settings changes using intelligent classification
      if (previousProfile) {
        const analysis = analyzeSettingsChanges(
          previousProfile, 
          updated as AthleteProfile & { trainingStyle?: string }
        )
        
        if (analysis.changes.length > 0) {
          const activeProgram = getActiveProgram()
          
          if (analysis.requiresRegeneration && activeProgram) {
            // STRUCTURAL CHANGE: Clear active program to trigger new version
            // Check debounce to prevent rapid regenerations
            if (canRegenerate('current-user')) {
              clearActiveProgram()
              markRegeneration('current-user')
              
              // Record timestamp for NextWorkoutCard to show update notice
              try {
                localStorage.setItem('spartanlab_program_version_timestamp', new Date().toISOString())
              } catch {
                // localStorage unavailable
              }
              
              setLastChangeResult({
                regenerated: true,
                message: analysis.coachingMessage,
                affectedSystems: analysis.affectedSystems,
              })
              
              toast({
                title: 'Program Regenerated',
                description: analysis.coachingMessage,
                duration: 5000,
              })
            }
          } else if (analysis.changes.some(c => c.affectsFutureSessions)) {
            // MINOR CHANGE: Apply session adaptations without new version
            const adaptations = getSessionAdaptations(analysis)
            
            if (adaptations.length > 0) {
              setLastChangeResult({
                regenerated: false,
                message: analysis.coachingMessage,
                affectedSystems: analysis.affectedSystems,
              })
              
              toast({
                title: 'Settings Adjusted',
                description: analysis.coachingMessage,
                duration: 4000,
              })
            } else {
              // TASK 6: Show toast even when no structural changes
              toast({
                title: 'Settings Saved',
                description: 'Your preferences have been updated.',
                duration: 3000,
              })
            }
          } else {
            // TASK 6: Show toast when no changes at all
            toast({
              title: 'Settings Saved',
              description: 'Your preferences have been updated.',
              duration: 3000,
            })
          }
        }
      } else {
        // TASK 6: No previous profile - just show basic success
        toast({
          title: 'Settings Saved',
          description: 'Your preferences have been saved.',
          duration: 3000,
        })
      }
    } finally {
      // TASK 8: GUARANTEE saving state is cleared in ALL exit paths
      setSaving(false)
      setTimeout(() => setSaved(false), 2000)
    }
  }
  
  // TASK 3: Wrap handleSave in try-finally to ensure saving state is always cleared
  const handleSaveWithGuaranteedReset = async () => {
    try {
      await handleSave()
    } finally {
      // TASK 3: Guarantee saving state is cleared in ALL exit paths
      setSaving(false)
    }
  }

  // Loading state during hydration
  if (!mounted) {
    return (
      <PageContainer maxWidth="md">
        <div className="animate-pulse">
          <div className="h-96 bg-[#2A2A2A] rounded"></div>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer maxWidth="md">
      <PageHeader 
        title="Settings"
        description="Configure your training profile for accurate progress estimates"
        backHref="/dashboard"
        backLabel="Back to Dashboard"
        icon={<Settings className="w-5 h-5" />}
      />
        
        <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-8 space-y-8">
          <div>
            <h2 className="text-xl font-bold mb-2">Athlete Profile</h2>
          </div>

          {/* Bodyweight */}
          <div className="space-y-2">
            <Label className="text-[#F5F5F5]">Bodyweight (lbs)</Label>
            <Input
              type="number"
              placeholder="Enter your bodyweight"
              value={bodyweight}
              onChange={(e) => setBodyweight(e.target.value)}
              className="bg-[#1A1A1A] border-[#3A3A3A] text-[#F5F5F5] focus:border-[#E63946]"
            />
          </div>

          {/* Experience Level */}
          <div className="space-y-2">
            <Label className="text-[#F5F5F5]">Experience Level</Label>
            <Select value={experienceLevel} onValueChange={setExperienceLevel}>
              <SelectTrigger className="bg-[#1A1A1A] border-[#3A3A3A] text-[#F5F5F5]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#2A2A2A] border-[#3A3A3A]">
                <SelectItem value="beginner" className="text-[#F5F5F5] focus:bg-[#3A3A3A]">
                  Beginner (8-12 weeks per level)
                </SelectItem>
                <SelectItem value="intermediate" className="text-[#F5F5F5] focus:bg-[#3A3A3A]">
                  Intermediate (6-10 weeks per level)
                </SelectItem>
                <SelectItem value="advanced" className="text-[#F5F5F5] focus:bg-[#3A3A3A]">
                  Advanced (4-8 weeks per level)
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-[#A5A5A5] mt-1">
              This affects estimated time to reach your target levels
            </p>
          </div>

          {/* Schedule Mode */}
          <div className="space-y-2">
            <Label className="text-[#F5F5F5]">Schedule Type</Label>
            <Select 
              value={scheduleMode} 
              onValueChange={(v) => setScheduleMode(v as 'static' | 'flexible')}
            >
              <SelectTrigger className="bg-[#1A1A1A] border-[#3A3A3A] text-[#F5F5F5]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#2A2A2A] border-[#3A3A3A]">
                <SelectItem value="static" className="text-[#F5F5F5] focus:bg-[#3A3A3A]">
                  Fixed Schedule
                </SelectItem>
                <SelectItem value="flexible" className="text-[#F5F5F5] focus:bg-[#3A3A3A]">
                  Flexible / Adaptive
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-[#A5A5A5] mt-1">
              {scheduleMode === 'flexible' 
                ? 'AI adapts your weekly frequency based on recovery and goals'
                : 'Train on a fixed number of days each week'}
            </p>
          </div>

          {/* Training Days - Only show for static mode */}
          {scheduleMode === 'static' && (
            <div className="space-y-2">
              <Label className="text-[#F5F5F5]">Training Days Per Week</Label>
              <Select value={trainingDays} onValueChange={setTrainingDays}>
                <SelectTrigger className="bg-[#1A1A1A] border-[#3A3A3A] text-[#F5F5F5]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#2A2A2A] border-[#3A3A3A]">
                  {[2, 3, 4, 5, 6].map((day) => (
                    <SelectItem key={day} value={day.toString()} className="text-[#F5F5F5] focus:bg-[#3A3A3A]">
                      {day} days
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {/* Flexible Mode Info - Show clear adaptive semantics */}
          {scheduleMode === 'flexible' && (
            <div className="p-3 rounded-lg bg-[#1A1A1A] border border-[#3A3A3A] space-y-2">
              <p className="text-sm text-[#F5F5F5] font-medium">
                Flexible / Adaptive Schedule
              </p>
              <p className="text-xs text-[#A5A5A5]">
                Your weekly training frequency is adjusted by the engine based on recovery, readiness, goals, and recent training load. 
                This is not a fixed preference — it adapts week-to-week.
              </p>
            </div>
          )}

          {/* Session Duration Mode - TASK C FIX: Expose adaptive vs fixed toggle */}
          <div className="space-y-2">
            <Label className="text-[#F5F5F5]">Session Duration Type</Label>
            <Select 
              value={sessionDurationMode} 
              onValueChange={(v) => {
                setSessionDurationMode(v as 'static' | 'adaptive')
                logDurationTruth('Settings duration mode changed', {
                  canonicalPreference: parseInt(sessionLength),
                  source: 'settings-duration-mode-dropdown',
                })
              }}
            >
              <SelectTrigger className="bg-[#1A1A1A] border-[#3A3A3A] text-[#F5F5F5]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#2A2A2A] border-[#3A3A3A]">
                <SelectItem value="static" className="text-[#F5F5F5] focus:bg-[#3A3A3A]">
                  Fixed Duration
                </SelectItem>
                <SelectItem value="adaptive" className="text-[#F5F5F5] focus:bg-[#3A3A3A]">
                  Adaptive / Flexible
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-[#A5A5A5] mt-1">
              {sessionDurationMode === 'adaptive' 
                ? 'Session length varies based on recovery, day focus, and training priority'
                : 'Train with a consistent target session length'}
            </p>
          </div>
          
          {/* Adaptive Mode Info - Show clear adaptive semantics */}
          {sessionDurationMode === 'adaptive' && (
            <div className="p-3 rounded-lg bg-[#1A1A1A] border border-[#3A3A3A] space-y-2">
              <p className="text-sm text-[#F5F5F5] font-medium">
                Adaptive Session Duration
              </p>
              <p className="text-xs text-[#A5A5A5]">
                Your session length is adjusted by the engine based on recovery, readiness, and training focus for each day. 
                The target below is used as a baseline when planning, but actual sessions may be shorter or longer.
              </p>
            </div>
          )}

          {/* Session Length - Target duration (applies to both modes) */}
          <div className="space-y-2">
            <Label className="text-[#F5F5F5]">
              {sessionDurationMode === 'adaptive' ? 'Target Session Duration (baseline)' : 'Target Session Duration'}
            </Label>
            <Select value={sessionLength} onValueChange={(v) => {
              setSessionLength(v)
              logDurationTruth('Settings duration changed', {
                canonicalPreference: parseInt(v),
                source: 'settings-dropdown',
              })
            }}>
              <SelectTrigger className="bg-[#1A1A1A] border-[#3A3A3A] text-[#F5F5F5]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#2A2A2A] border-[#3A3A3A]">
                {([30, 45, 60, 90] as SessionDurationMinutes[]).map((minutes) => (
                  <SelectItem 
                    key={minutes} 
                    value={String(minutes)} 
                    className="text-[#F5F5F5] focus:bg-[#3A3A3A]"
                  >
                    {DURATION_PREFERENCE_LABELS[minutes].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-[#A5A5A5] mt-1">
              {sessionDurationMode === 'adaptive'
                ? 'This is your baseline target. Actual session times adapt based on day focus and recovery.'
                : 'This is your target preference. Actual session times may vary slightly based on day focus.'}
            </p>
          </div>

          {/* Primary Goal */}
          <div className="space-y-2">
            <Label className="text-[#F5F5F5]">Primary Goal (Optional)</Label>
            <Select value={primaryGoal} onValueChange={setPrimaryGoal}>
              <SelectTrigger className="bg-[#1A1A1A] border-[#3A3A3A] text-[#F5F5F5]">
                <SelectValue placeholder="Select a goal" />
              </SelectTrigger>
              <SelectContent className="bg-[#2A2A2A] border-[#3A3A3A]">
                <SelectItem value="none" className="text-[#A5A5A5] focus:bg-[#3A3A3A]">
                  None
                </SelectItem>
                {Object.entries(SKILL_DEFINITIONS).map(([key, def]) => (
                  <SelectItem key={key} value={key} className="text-[#F5F5F5] focus:bg-[#3A3A3A]">
                    {def.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Training Style */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-[#A5A5A5]" />
              <Label className="text-[#F5F5F5]">Training Style</Label>
            </div>
            <Select value={trainingStyle} onValueChange={(v) => setTrainingStyle(v as TrainingStyleMode)}>
              <SelectTrigger className="bg-[#1A1A1A] border-[#3A3A3A] text-[#F5F5F5]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#2A2A2A] border-[#3A3A3A]">
                {Object.entries(STYLE_MODE_DEFINITIONS).map(([key, def]) => (
                  <SelectItem key={key} value={key} className="text-[#F5F5F5] focus:bg-[#3A3A3A]">
                    <div className="flex flex-col">
                      <span>{def.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-[#A5A5A5] mt-1">
              {STYLE_MODE_DEFINITIONS[trainingStyle].description}
            </p>
          </div>

          {/* Equipment Available */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-[#A5A5A5]" />
              <Label className="text-[#F5F5F5]">Equipment Available</Label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'pullup_bar' as const, label: 'Pull-up Bar' },
                { key: 'dip_bars' as const, label: 'Dip Bars' },
                { key: 'rings' as const, label: 'Rings' },
                { key: 'parallettes' as const, label: 'Parallettes' },
                { key: 'resistance_bands' as const, label: 'Resistance Bands' },
                { key: 'weights' as const, label: 'Weights (for loading)' },
              ].map((item) => (
                <div 
                  key={item.key}
                  className="flex items-center gap-2 p-3 rounded-lg bg-[#1A1A1A] border border-[#3A3A3A]"
                >
                  <Checkbox
                    id={`equip-${item.key}`}
                    checked={equipment.includes(item.key)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setEquipment([...equipment, item.key])
                      } else {
                        setEquipment(equipment.filter(e => e !== item.key))
                      }
                    }}
                    className="border-[#3A3A3A] data-[state=checked]:bg-[#E63946] data-[state=checked]:border-[#E63946]"
                  />
                  <label 
                    htmlFor={`equip-${item.key}`}
                    className="text-sm text-[#A5A5A5] cursor-pointer"
                  >
                    {item.label}
                  </label>
                </div>
              ))}
            </div>
            <p className="text-xs text-[#6B7280]">
              Your program will be adjusted based on available equipment.
            </p>
          </div>

          {/* Joint Cautions */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <Label className="text-[#F5F5F5]">Joint Cautions (Optional)</Label>
            </div>
            <p className="text-xs text-[#A5A5A5]">
              Flag any joints that need extra care. Your program will modify exercises accordingly.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(Object.keys(JOINT_CAUTION_LABELS) as JointCaution[]).map((joint) => (
                <div 
                  key={joint}
                  className="flex items-center gap-2 p-3 rounded-lg bg-[#1A1A1A] border border-[#3A3A3A]"
                >
                  <Checkbox
                    id={`joint-${joint}`}
                    checked={jointCautions.includes(joint)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setJointCautions([...jointCautions, joint])
                      } else {
                        setJointCautions(jointCautions.filter(j => j !== joint))
                      }
                    }}
                    className="border-[#3A3A3A] data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                  />
                  <label 
                    htmlFor={`joint-${joint}`}
                    className="text-sm text-[#A5A5A5] cursor-pointer"
                  >
                    {JOINT_CAUTION_LABELS[joint]}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Weakest Area */}
          <div className="space-y-2">
            <Label className="text-[#F5F5F5]">Weakest Area (Optional)</Label>
            <Select value={weakestArea} onValueChange={(v) => setWeakestArea(v as WeakestArea | 'none')}>
              <SelectTrigger className="bg-[#1A1A1A] border-[#3A3A3A] text-[#F5F5F5]">
                <SelectValue placeholder="Select your weakest area" />
              </SelectTrigger>
              <SelectContent className="bg-[#2A2A2A] border-[#3A3A3A]">
                <SelectItem value="none" className="text-[#A5A5A5] focus:bg-[#3A3A3A]">
                  None / Not sure
                </SelectItem>
                {(Object.keys(WEAKEST_AREA_LABELS) as WeakestArea[]).map((area) => (
                  <SelectItem key={area} value={area} className="text-[#F5F5F5] focus:bg-[#3A3A3A]">
                    {WEAKEST_AREA_LABELS[area]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-[#A5A5A5]">
              Your training will emphasize work on your identified weakness.
            </p>
          </div>

          {/* Save Button */}
          <div className="pt-6 border-t border-[#3A3A3A]">
            <Button
              size="lg"
              className="w-full bg-[#E63946] hover:bg-[#D62828] text-white font-semibold"
              onClick={handleSaveWithGuaranteedReset}
              disabled={saving}
            >
              {saving ? (
                'Saving...'
              ) : saved ? (
                'Profile Saved!'
              ) : (
                'Save Profile'
              )}
            </Button>
            
            {/* Coaching explanation for recent changes */}
            {lastChangeResult && (
              <div className={`mt-4 p-4 rounded-lg border ${
                lastChangeResult.regenerated 
                  ? 'bg-[#E63946]/10 border-[#E63946]/30' 
                  : 'bg-[#4F6D8A]/10 border-[#4F6D8A]/30'
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    lastChangeResult.regenerated 
                      ? 'bg-[#E63946]/20' 
                      : 'bg-[#4F6D8A]/20'
                  }`}>
                    {lastChangeResult.regenerated ? (
                      <Sparkles className="w-4 h-4 text-[#E63946]" />
                    ) : (
                      <Target className="w-4 h-4 text-[#4F6D8A]" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#F5F5F5] mb-1">
                      {lastChangeResult.regenerated ? 'Program Regenerated' : 'Settings Adjusted'}
                    </p>
                    <p className="text-xs text-[#A5A5A5]">{lastChangeResult.message}</p>
                    {lastChangeResult.affectedSystems.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {lastChangeResult.affectedSystems.slice(0, 3).map(system => (
                          <span 
                            key={system}
                            className="px-2 py-0.5 text-xs bg-[#1A1A1A] border border-[#3A3A3A] rounded-full text-[#6B7280]"
                          >
                            {system.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
        
        {/* Strength & Skill Metrics Update */}
        <div className="mt-6">
          <UpdateMetricsCard onUpdate={loadProfile} />
        </div>
        
        {/* Redo Onboarding Section */}
        <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-8 mt-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold mb-2">Training Profile</h2>
            <p className="text-sm text-[#A5A5A5]">
              Want to update your goals, skills, or training preferences? You can re-run the full onboarding process.
            </p>
          </div>
          
          <Link href="/onboarding">
            <Button 
              variant="outline" 
              className="w-full border-[#3A3A3A] text-[#A5A5A5] hover:bg-[#2A2A2A] hover:text-[#F5F5F5]"
            >
              <Target className="w-4 h-4 mr-2" />
              Update Training Goals
            </Button>
          </Link>
          <p className="text-xs text-[#6B7280] mt-2">
            This will walk you through your goals, skill levels, and training schedule again.
          </p>
        </Card>
        
        {/* Subscription & Billing Section */}
        <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-8 mt-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold mb-2">Subscription & Billing</h2>
            <p className="text-sm text-[#A5A5A5]">
              Manage your SpartanLab subscription and billing details.
            </p>
          </div>
          <SubscriptionBillingCard />
          
          {/* OWNER ONLY: Inline Simulation Control */}
          {isOwner && <OwnerInlineSimulationControl />}
        </Card>
    </PageContainer>
  )
}
