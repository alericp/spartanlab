/**
 * Recovery & Fatigue Engine
 * 
 * Central unified engine for intelligent fatigue detection and recovery-aware training decisions.
 * Integrates with training principles, exercise intelligence, and progression systems.
 */

import { getWorkoutLogs, type WorkoutLog } from './workout-log-service'
import { getStoredRPESessions, type StoredRPESession } from './fatigue-score-calculator'
import { calculateRecoverySignal, type RecoverySignal } from './recovery-engine'
import { getFatigueTrainingDecision, type FatigueDecision, type TrainingDecision } from './fatigue-decision-engine'
import { calculateDailyReadiness, type DailyReadinessResult } from './daily-readiness'
import { type MethodProfileId, METHOD_PROFILES } from './training-principles-engine'
import { 
  computeFatigueStateFromFeedback, 
  getRecentSessionFeedback,
  type FatigueStateFromFeedback,
} from './session-feedback'

// =============================================================================
// TYPES
// =============================================================================

export type ReadinessState = 'ready_to_push' | 'train_normally' | 'keep_controlled' | 'recovery_focused'

export type FatigueType = 
  | 'nervous_system'      // Heavy strength, explosive, high-force statics
  | 'local_muscular'      // Hypertrophy, endurance density
  | 'connective_tissue'   // Straight-arm strain, deep mobility
  | 'soreness_based'      // DOMS from new exercises or excess density

export interface FatigueContribution {
  type: FatigueType
  level: number // 0-100
  source: string
  recoveryHours: number // estimated hours to recover
}

export interface ReadinessAssessment {
  state: ReadinessState
  score: number // 0-100
  confidence: 'low' | 'medium' | 'high'
  
  // Fatigue breakdown by type
  fatigueContributions: FatigueContribution[]
  dominantFatigueType: FatigueType | null
  
  // Training recommendations
  trainingDecision: TrainingDecision
  shouldProgress: boolean
  shouldDeload: boolean
  
  // Method-specific guidance
  methodRecommendations: MethodRecoveryGuidance[]
  
  // Simple coach message
  coachMessage: string
  shortLabel: string // For dashboard badge
  
  // Detailed factors
  factors: {
    recentVolume: 'low' | 'moderate' | 'high'
    recentIntensity: 'low' | 'moderate' | 'high'
    sleepQuality: 'poor' | 'moderate' | 'good' | 'unknown'
    soreness: 'none' | 'mild' | 'moderate' | 'severe' | 'unknown'
    motivation: 'low' | 'moderate' | 'high' | 'unknown'
    consecutiveHardDays: number
    daysSinceDeload: number
    failuresRecent: number
  }
}

export interface MethodRecoveryGuidance {
  methodId: MethodProfileId
  status: 'ready' | 'caution' | 'avoid'
  reason: string
  adjustments?: string[]
}

export interface FlexibilityRecoveryStatus {
  canTrainNormally: boolean
  shouldReduceRounds: boolean
  shouldReduceDepth: boolean
  currentSorenessLevel: 'none' | 'mild' | 'moderate' | 'high'
  message: string
}

export interface MobilityRecoveryStatus {
  canTrainNormally: boolean
  shouldReduceLoad: boolean
  shouldReduceRPE: boolean
  currentSorenessLevel: 'none' | 'mild' | 'moderate' | 'high'
  suggestedRPECap: number
  message: string
}

export interface DeloadTrigger {
  triggered: boolean
  reason: string
  urgency: 'suggested' | 'recommended' | 'required'
  suggestedDuration: number // days
  suggestedApproach: 'volume_reduction' | 'intensity_reduction' | 'full_rest' | 'active_recovery'
}

export interface SessionAdjustment {
  category: 'volume' | 'intensity' | 'exercise_swap' | 'rest_time' | 'skip_block'
  description: string
  originalValue?: string | number
  adjustedValue?: string | number
}

// =============================================================================
// STORAGE
// =============================================================================

const RECOVERY_INPUT_KEY = 'spartanlab_recovery_inputs'
const SORENESS_LOG_KEY = 'spartanlab_soreness_log'

interface UserRecoveryInput {
  date: string
  sleepQuality?: 'poor' | 'moderate' | 'good'
  soreness?: 'none' | 'mild' | 'moderate' | 'severe'
  motivation?: 'low' | 'moderate' | 'high'
  notes?: string
}

interface SorenessEntry {
  date: string
  area: 'upper_body' | 'lower_body' | 'core' | 'joints' | 'general'
  level: number // 1-10
  fromExercise?: string
}

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

export function saveRecoveryInput(input: Omit<UserRecoveryInput, 'date'>): void {
  if (!isBrowser()) return
  
  const today = new Date().toISOString().split('T')[0]
  const stored = localStorage.getItem(RECOVERY_INPUT_KEY)
  const inputs: UserRecoveryInput[] = stored ? JSON.parse(stored) : []
  
  // Remove existing entry for today
  const filtered = inputs.filter(i => i.date !== today)
  filtered.push({ ...input, date: today })
  
  // Keep last 30 days
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 30)
  const recent = filtered.filter(i => new Date(i.date) >= cutoff)
  
  localStorage.setItem(RECOVERY_INPUT_KEY, JSON.stringify(recent))
}

function getRecentRecoveryInputs(): UserRecoveryInput[] {
  if (!isBrowser()) return []
  const stored = localStorage.getItem(RECOVERY_INPUT_KEY)
  return stored ? JSON.parse(stored) : []
}

function getTodaysRecoveryInput(): UserRecoveryInput | null {
  const inputs = getRecentRecoveryInputs()
  const today = new Date().toISOString().split('T')[0]
  return inputs.find(i => i.date === today) || null
}

export function logSoreness(entry: Omit<SorenessEntry, 'date'>): void {
  if (!isBrowser()) return
  
  const today = new Date().toISOString().split('T')[0]
  const stored = localStorage.getItem(SORENESS_LOG_KEY)
  const entries: SorenessEntry[] = stored ? JSON.parse(stored) : []
  
  entries.push({ ...entry, date: today })
  
  // Keep last 14 days
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 14)
  const recent = entries.filter(e => new Date(e.date) >= cutoff)
  
  localStorage.setItem(SORENESS_LOG_KEY, JSON.stringify(recent))
}

function getRecentSoreness(): SorenessEntry[] {
  if (!isBrowser()) return []
  const stored = localStorage.getItem(SORENESS_LOG_KEY)
  return stored ? JSON.parse(stored) : []
}

// =============================================================================
// FATIGUE TYPE ANALYSIS
// =============================================================================

/**
 * Analyze recent training to determine fatigue contributions by type
 */
function analyzeFatigueContributions(): FatigueContribution[] {
  const contributions: FatigueContribution[] = []
  const logs = isBrowser() ? getWorkoutLogs() : []
  const recentLogs = logs.slice(0, 7) // Last 7 sessions
  const rpeSessions = isBrowser() ? getStoredRPESessions() : []
  
  // Track exercises by type
  let heavyStrengthSets = 0
  let explosiveSets = 0
  let straightArmSets = 0
  let hypertrophySets = 0
  let densitySets = 0
  let mobilityLoadedSets = 0
  
  for (const log of recentLogs) {
    for (const exercise of log.exercises) {
      const name = exercise.name.toLowerCase()
      
      // Categorize by exercise name patterns
      if (name.includes('weighted') || name.includes('dip') || name.includes('pull-up') || name.includes('pullup')) {
        heavyStrengthSets += exercise.sets
      }
      if (name.includes('explosive') || name.includes('muscle-up') || name.includes('muscle up') || name.includes('clap')) {
        explosiveSets += exercise.sets
      }
      if (name.includes('planche') || name.includes('lever') || name.includes('maltese') || name.includes('iron cross')) {
        straightArmSets += exercise.sets
      }
      if (name.includes('curl') || name.includes('extension') || name.includes('row') || name.includes('fly')) {
        hypertrophySets += exercise.sets
      }
      if (name.includes('superset') || name.includes('drop') || name.includes('amrap')) {
        densitySets += exercise.sets
      }
      if (name.includes('pancake') || name.includes('split') || name.includes('mobility') || name.includes('loaded')) {
        mobilityLoadedSets += exercise.sets
      }
    }
  }
  
  // Calculate nervous system fatigue (48-72hr recovery)
  const nsLevel = Math.min(100, (heavyStrengthSets + explosiveSets) * 4)
  if (nsLevel > 20) {
    contributions.push({
      type: 'nervous_system',
      level: nsLevel,
      source: 'Heavy strength and explosive work',
      recoveryHours: 48 + (nsLevel > 60 ? 24 : 0),
    })
  }
  
  // Calculate local muscular fatigue (24-48hr recovery)
  const localLevel = Math.min(100, (hypertrophySets + densitySets) * 3)
  if (localLevel > 20) {
    contributions.push({
      type: 'local_muscular',
      level: localLevel,
      source: 'Hypertrophy and density work',
      recoveryHours: 24 + (localLevel > 50 ? 24 : 0),
    })
  }
  
  // Calculate connective tissue stress (72-96hr recovery)
  const connectiveLevel = Math.min(100, (straightArmSets + mobilityLoadedSets) * 5)
  if (connectiveLevel > 20) {
    contributions.push({
      type: 'connective_tissue',
      level: connectiveLevel,
      source: 'Straight-arm and loaded mobility work',
      recoveryHours: 72 + (connectiveLevel > 60 ? 24 : 0),
    })
  }
  
  // Check for soreness-based fatigue
  const recentSoreness = getRecentSoreness()
  const todaysSoreness = recentSoreness.filter(s => {
    const entryDate = new Date(s.date)
    const now = new Date()
    const diffDays = (now.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24)
    return diffDays <= 2
  })
  
  if (todaysSoreness.length > 0) {
    const avgSoreness = todaysSoreness.reduce((sum, s) => sum + s.level, 0) / todaysSoreness.length
    const sorenessLevel = avgSoreness * 10
    contributions.push({
      type: 'soreness_based',
      level: sorenessLevel,
      source: 'Recent muscle soreness',
      recoveryHours: 24 + (sorenessLevel > 50 ? 24 : 0),
    })
  }
  
  return contributions
}

/**
 * Get the dominant fatigue type affecting the athlete
 */
function getDominantFatigueType(contributions: FatigueContribution[]): FatigueType | null {
  if (contributions.length === 0) return null
  
  const sorted = [...contributions].sort((a, b) => b.level - a.level)
  return sorted[0].level > 30 ? sorted[0].type : null
}

// =============================================================================
// METHOD-SPECIFIC RECOVERY
// =============================================================================

/**
 * Get recovery guidance for each training method
 */
function getMethodRecoveryGuidance(contributions: FatigueContribution[]): MethodRecoveryGuidance[] {
  const guidance: MethodRecoveryGuidance[] = []
  
  const nsLevel = contributions.find(c => c.type === 'nervous_system')?.level || 0
  const localLevel = contributions.find(c => c.type === 'local_muscular')?.level || 0
  const connectiveLevel = contributions.find(c => c.type === 'connective_tissue')?.level || 0
  const sorenessLevel = contributions.find(c => c.type === 'soreness_based')?.level || 0
  
  // Weighted Strength
  if (nsLevel > 70) {
    guidance.push({
      methodId: 'weighted_strength',
      status: 'avoid',
      reason: 'High nervous system fatigue from recent heavy work',
      adjustments: ['Reduce load by 10-15%', 'Cut volume in half'],
    })
  } else if (nsLevel > 40) {
    guidance.push({
      methodId: 'weighted_strength',
      status: 'caution',
      reason: 'Moderate nervous system fatigue',
      adjustments: ['Maintain intensity but reduce volume'],
    })
  } else {
    guidance.push({
      methodId: 'weighted_strength',
      status: 'ready',
      reason: 'NS fatigue is low - ready for heavy work',
    })
  }
  
  // Static Skill Density
  if (connectiveLevel > 60) {
    guidance.push({
      methodId: 'static_skill_density',
      status: 'caution',
      reason: 'Elevated connective tissue stress',
      adjustments: ['Focus on easier progressions', 'Keep holds short'],
    })
  } else {
    guidance.push({
      methodId: 'static_skill_density',
      status: 'ready',
      reason: 'Skill work is generally well-tolerated',
    })
  }
  
  // Hypertrophy Support
  if (localLevel > 60 || sorenessLevel > 60) {
    guidance.push({
      methodId: 'hypertrophy_support',
      status: 'avoid',
      reason: 'High local fatigue or soreness',
      adjustments: ['Skip or use very light weights'],
    })
  } else if (localLevel > 40) {
    guidance.push({
      methodId: 'hypertrophy_support',
      status: 'caution',
      reason: 'Moderate local fatigue',
      adjustments: ['Reduce sets by 30%'],
    })
  } else {
    guidance.push({
      methodId: 'hypertrophy_support',
      status: 'ready',
      reason: 'Local fatigue is manageable',
    })
  }
  
  // Explosive Power
  if (nsLevel > 50) {
    guidance.push({
      methodId: 'explosive_power',
      status: 'avoid',
      reason: 'Explosive work requires fresh nervous system',
      adjustments: ['Postpone explosive work'],
    })
  } else {
    guidance.push({
      methodId: 'explosive_power',
      status: 'ready',
      reason: 'Ready for explosive training',
    })
  }
  
  // Endurance Density
  if (localLevel > 50) {
    guidance.push({
      methodId: 'endurance_density',
      status: 'caution',
      reason: 'High local fatigue from recent volume',
      adjustments: ['Shorten density blocks', 'Increase rest'],
    })
  } else {
    guidance.push({
      methodId: 'endurance_density',
      status: 'ready',
      reason: 'Ready for density work',
    })
  }
  
  // Flexibility Exposure - almost always okay
  guidance.push({
    methodId: 'flexibility_exposure',
    status: 'ready',
    reason: 'Flexibility exposure has minimal fatigue cost',
  })
  
  // Mobility Strength
  if (connectiveLevel > 50 || sorenessLevel > 50) {
    guidance.push({
      methodId: 'mobility_strength',
      status: 'caution',
      reason: 'Loaded mobility requires recovered joints',
      adjustments: ['Reduce load', 'Lower RPE target'],
    })
  } else {
    guidance.push({
      methodId: 'mobility_strength',
      status: 'ready',
      reason: 'Ready for loaded mobility work',
    })
  }
  
  // Recovery Conservative
  guidance.push({
    methodId: 'recovery_conservative',
    status: 'ready',
    reason: 'Always appropriate when recovery is a concern',
  })
  
  return guidance
}

// =============================================================================
// FLEXIBILITY VS MOBILITY RECOVERY
// =============================================================================

/**
 * Get flexibility-specific recovery status
 * Flexibility uses low-soreness exposure model
 */
export function getFlexibilityRecoveryStatus(): FlexibilityRecoveryStatus {
  const sorenessEntries = getRecentSoreness()
  const input = getTodaysRecoveryInput()
  
  // Check for flexibility-related soreness
  const flexSoreness = sorenessEntries.filter(s => 
    s.area === 'lower_body' || s.area === 'core'
  )
  
  const recentFlexSoreness = flexSoreness.filter(s => {
    const diffDays = (Date.now() - new Date(s.date).getTime()) / (1000 * 60 * 60 * 24)
    return diffDays <= 1
  })
  
  const avgLevel = recentFlexSoreness.length > 0 
    ? recentFlexSoreness.reduce((sum, s) => sum + s.level, 0) / recentFlexSoreness.length
    : 0
  
  let sorenessLevel: FlexibilityRecoveryStatus['currentSorenessLevel'] = 'none'
  if (avgLevel > 7) sorenessLevel = 'high'
  else if (avgLevel > 4) sorenessLevel = 'moderate'
  else if (avgLevel > 2) sorenessLevel = 'mild'
  
  // Also consider user-reported soreness
  if (input?.soreness === 'severe') sorenessLevel = 'high'
  else if (input?.soreness === 'moderate' && sorenessLevel === 'none') sorenessLevel = 'moderate'
  
  // Flexibility decisions
  const canTrainNormally = sorenessLevel === 'none' || sorenessLevel === 'mild'
  const shouldReduceRounds = sorenessLevel === 'moderate'
  const shouldReduceDepth = sorenessLevel === 'high'
  
  let message: string
  if (canTrainNormally) {
    message = 'Flexibility training can proceed normally.'
  } else if (shouldReduceRounds) {
    message = 'Some soreness present. Consider 2 rounds instead of 3.'
  } else {
    message = 'High soreness. Use gentle movements only, reduced depth.'
  }
  
  return {
    canTrainNormally,
    shouldReduceRounds,
    shouldReduceDepth,
    currentSorenessLevel: sorenessLevel,
    message,
  }
}

/**
 * Get mobility-specific recovery status
 * Mobility is treated like strength work - needs proper recovery
 */
export function getMobilityRecoveryStatus(): MobilityRecoveryStatus {
  const sorenessEntries = getRecentSoreness()
  const input = getTodaysRecoveryInput()
  const contributions = analyzeFatigueContributions()
  
  const connectiveLevel = contributions.find(c => c.type === 'connective_tissue')?.level || 0
  
  // Check for mobility-related soreness
  const mobilitySoreness = sorenessEntries.filter(s => 
    s.area === 'lower_body' || s.area === 'joints'
  )
  
  const recentMobilitySoreness = mobilitySoreness.filter(s => {
    const diffDays = (Date.now() - new Date(s.date).getTime()) / (1000 * 60 * 60 * 24)
    return diffDays <= 2
  })
  
  const avgLevel = recentMobilitySoreness.length > 0
    ? recentMobilitySoreness.reduce((sum, s) => sum + s.level, 0) / recentMobilitySoreness.length
    : 0
  
  let sorenessLevel: MobilityRecoveryStatus['currentSorenessLevel'] = 'none'
  if (avgLevel > 6) sorenessLevel = 'high'
  else if (avgLevel > 3) sorenessLevel = 'moderate'
  else if (avgLevel > 1) sorenessLevel = 'mild'
  
  // Consider connective tissue fatigue
  if (connectiveLevel > 60) sorenessLevel = 'high'
  else if (connectiveLevel > 40 && sorenessLevel === 'none') sorenessLevel = 'mild'
  
  // Also consider user-reported soreness
  if (input?.soreness === 'severe') sorenessLevel = 'high'
  
  // Mobility decisions - more conservative than flexibility
  const canTrainNormally = sorenessLevel === 'none'
  const shouldReduceLoad = sorenessLevel === 'mild' || sorenessLevel === 'moderate'
  const shouldReduceRPE = sorenessLevel === 'high'
  
  // RPE cap based on recovery
  let suggestedRPECap = 8
  if (sorenessLevel === 'mild') suggestedRPECap = 7
  if (sorenessLevel === 'moderate') suggestedRPECap = 6
  if (sorenessLevel === 'high') suggestedRPECap = 5
  
  let message: string
  if (canTrainNormally) {
    message = 'Ready for normal mobility loading.'
  } else if (shouldReduceLoad) {
    message = `Some fatigue present. Cap RPE at ${suggestedRPECap}.`
  } else {
    message = 'High joint/connective stress. Use unloaded mobility only.'
  }
  
  return {
    canTrainNormally,
    shouldReduceLoad,
    shouldReduceRPE,
    currentSorenessLevel: sorenessLevel,
    suggestedRPECap,
    message,
  }
}

// =============================================================================
// DELOAD DETECTION
// =============================================================================

/**
 * Detect if a deload is needed based on multiple signals
 */
function detectDeloadNeed(
  contributions: FatigueContribution[],
  recoverySignal: RecoverySignal,
  fatigueDecision: FatigueDecision
): DeloadTrigger {
  const logs = isBrowser() ? getWorkoutLogs() : []
  const rpeSessions = isBrowser() ? getStoredRPESessions() : []
  
  // Count consecutive high-fatigue indicators
  let triggerScore = 0
  const reasons: string[] = []
  
  // 1. Check fatigue decision engine recommendation
  if (fatigueDecision.deloadRecommendation === 'DELOAD_RECOMMENDED') {
    triggerScore += 40
    reasons.push('Fatigue engine recommends deload')
  } else if (fatigueDecision.deloadRecommendation === 'LIGHTEN_NEXT_SESSION') {
    triggerScore += 20
    reasons.push('Elevated fatigue detected')
  }
  
  // 2. Check recovery signal
  if (recoverySignal.level === 'LOW') {
    triggerScore += 25
    reasons.push('Low recovery signal')
  }
  
  // 3. Check for repeated failures
  const recentLogs = logs.slice(0, 5)
  let failedSessions = 0
  for (const log of recentLogs) {
    const hasFailures = log.exercises.some(e => 
      e.notes?.toLowerCase().includes('fail') || 
      e.notes?.toLowerCase().includes('missed')
    )
    if (hasFailures) failedSessions++
  }
  if (failedSessions >= 2) {
    triggerScore += 20
    reasons.push('Multiple recent failed sessions')
  }
  
  // 4. Check RPE trend
  const recentRPE = rpeSessions.slice(0, 5)
  if (recentRPE.length >= 3) {
    const avgRPEs = recentRPE.map(session => {
      let total = 0
      let count = 0
      for (const ex of session.exercises) {
        for (const set of ex.sets) {
          total += set.actualRPE
          count++
        }
      }
      return count > 0 ? total / count : 0
    })
    
    // Check if RPE is consistently high
    const highRPECount = avgRPEs.filter(rpe => rpe >= 9).length
    if (highRPECount >= 3) {
      triggerScore += 20
      reasons.push('Consistently high RPE')
    }
  }
  
  // 5. Check user input (motivation + soreness)
  const input = getTodaysRecoveryInput()
  if (input?.motivation === 'low' && input?.soreness === 'severe') {
    triggerScore += 15
    reasons.push('Low motivation with high soreness')
  }
  
  // Determine trigger level
  let triggered = false
  let urgency: DeloadTrigger['urgency'] = 'suggested'
  
  if (triggerScore >= 60) {
    triggered = true
    urgency = 'required'
  } else if (triggerScore >= 40) {
    triggered = true
    urgency = 'recommended'
  } else if (triggerScore >= 25) {
    triggered = true
    urgency = 'suggested'
  }
  
  // Determine approach and duration
  let suggestedApproach: DeloadTrigger['suggestedApproach'] = 'volume_reduction'
  let suggestedDuration = 3
  
  const dominantFatigue = getDominantFatigueType(contributions)
  if (dominantFatigue === 'nervous_system') {
    suggestedApproach = 'intensity_reduction'
    suggestedDuration = 4
  } else if (dominantFatigue === 'local_muscular') {
    suggestedApproach = 'volume_reduction'
    suggestedDuration = 3
  } else if (dominantFatigue === 'connective_tissue') {
    suggestedApproach = 'active_recovery'
    suggestedDuration = 5
  } else if (dominantFatigue === 'soreness_based') {
    suggestedApproach = 'active_recovery'
    suggestedDuration = 3
  }
  
  return {
    triggered,
    reason: reasons.join('. ') || 'No deload needed',
    urgency,
    suggestedDuration,
    suggestedApproach,
  }
}

// =============================================================================
// MAIN ASSESSMENT FUNCTION
// =============================================================================

/**
 * Get comprehensive readiness assessment
 * This is the main entry point for the Recovery & Fatigue Engine
 */
export function getReadinessAssessment(): ReadinessAssessment {
  // Gather signals from existing systems
  const recoverySignal = isBrowser() ? calculateRecoverySignal() : {
    level: 'MODERATE' as const,
    score: 70,
    message: '',
    factors: { volumeLoad: 'moderate' as const, trainingFrequency: 'moderate' as const, recencyGap: 'optimal' as const }
  }
  
  let fatigueDecision: FatigueDecision
  try {
    fatigueDecision = getFatigueTrainingDecision()
  } catch {
    fatigueDecision = {
      decision: 'TRAIN_AS_PLANNED',
      deloadRecommendation: 'NO_DELOAD_NEEDED',
      confidence: 'low',
      shortGuidance: 'Train as planned',
      explanation: '',
      adjustments: {
        reduceAccessoryVolume: false,
        reduceAccessoryPercent: 0,
        preserveSkillWork: true,
        preserveMainStrength: true,
        reduceOverallSets: false,
        overallSetReduction: 0,
        suggestLowerRPE: false,
        rpeReduction: 0,
      },
      weeklyAdjustments: {
        compressWeek: false,
        dropLowPrioritySessions: false,
        sessionsToPreserve: 4,
        volumeReductionPercent: 0,
        preserveGoalRelevantOnly: false,
      },
    }
  }
  
  // Analyze fatigue contributions
  const contributions = analyzeFatigueContributions()
  const dominantFatigue = getDominantFatigueType(contributions)
  
  // Get session feedback state (integrates user-reported difficulty/soreness)
  const feedbackState = computeFatigueStateFromFeedback()
  
  // Get method-specific guidance
  const methodRecommendations = getMethodRecoveryGuidance(contributions)
  
  // Check deload need
  const deloadTrigger = detectDeloadNeed(contributions, recoverySignal, fatigueDecision)
  
  // Get user input
  const input = getTodaysRecoveryInput()
  const logs = isBrowser() ? getWorkoutLogs() : []
  
  // Calculate consecutive hard days
  let consecutiveHardDays = 0
  const sortedLogs = [...logs].sort((a, b) => 
    new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime()
  )
  for (const log of sortedLogs.slice(0, 7)) {
    if (log.durationMinutes > 45) consecutiveHardDays++
    else break
  }
  
  // Count recent failures
  let failuresRecent = 0
  for (const log of sortedLogs.slice(0, 5)) {
    if (log.exercises.some(e => e.notes?.toLowerCase().includes('fail'))) {
      failuresRecent++
    }
  }
  
  // Calculate overall score
  let score = recoverySignal.score
  
  // Adjust for fatigue contributions
  const totalFatigue = contributions.reduce((sum, c) => sum + c.level, 0) / Math.max(1, contributions.length)
  score = Math.round(score - (totalFatigue * 0.3))
  
  // Integrate session feedback fatigue score (0-10 scale, normalized to 0-30 impact)
  // Only apply if we have medium or high confidence from feedback
  if (feedbackState.confidence !== 'low') {
    const feedbackImpact = (feedbackState.fatigueScore - 5) * 3 // -15 to +15 adjustment
    score = Math.round(score - feedbackImpact)
  }
  
  // Adjust for user input
  if (input?.sleepQuality === 'poor') score -= 10
  if (input?.soreness === 'severe') score -= 15
  if (input?.motivation === 'low') score -= 5
  
  // Clamp score
  score = Math.max(0, Math.min(100, score))
  
  // Determine state and decisions
  let state: ReadinessState
  let shouldProgress = true
  let coachMessage: string
  let shortLabel: string
  
  if (score >= 75 || recoverySignal.level === 'HIGH') {
    state = 'ready_to_push'
    shortLabel = 'Ready to Push'
    coachMessage = 'Recovery signals are strong. Push for progress today.'
  } else if (score >= 50) {
    state = 'train_normally'
    shortLabel = 'Train Normally'
    coachMessage = 'Maintain your current level. Quality over intensity.'
    shouldProgress = false
  } else if (score >= 30) {
    state = 'keep_controlled'
    shortLabel = 'Keep It Controlled'
    coachMessage = 'Fatigue is elevated. Focus on technique, reduce volume.'
    shouldProgress = false
  } else {
    state = 'recovery_focused'
    shortLabel = 'Recovery Focused'
    coachMessage = 'Recovery is low. Light movement or rest recommended.'
    shouldProgress = false
  }
  
  // Override if deload is triggered (from traditional signals or session feedback)
  if (deloadTrigger.triggered && deloadTrigger.urgency === 'required') {
    state = 'recovery_focused'
    shortLabel = 'Deload Needed'
    coachMessage = 'Multiple fatigue indicators suggest a deload.'
    shouldProgress = false
  } else if (feedbackState.needsDeload && feedbackState.confidence !== 'low') {
    // Session feedback also indicates deload needed
    state = 'recovery_focused'
    shortLabel = 'Recovery Needed'
    coachMessage = feedbackState.summary
    shouldProgress = false
  }
  
  // Determine confidence
  let confidence: 'low' | 'medium' | 'high' = 'low'
  const rpeSessions = isBrowser() ? getStoredRPESessions() : []
  if (rpeSessions.length >= 5 && logs.length >= 5) {
    confidence = 'high'
  } else if (rpeSessions.length >= 2 || logs.length >= 3) {
    confidence = 'medium'
  }
  
  return {
    state,
    score,
    confidence,
    fatigueContributions: contributions,
    dominantFatigueType: dominantFatigue,
    trainingDecision: fatigueDecision.decision,
    shouldProgress,
    shouldDeload: deloadTrigger.triggered,
    methodRecommendations,
    coachMessage,
    shortLabel,
    factors: {
      recentVolume: recoverySignal.factors.volumeLoad,
      recentIntensity: totalFatigue > 60 ? 'high' : totalFatigue > 30 ? 'moderate' : 'low',
      sleepQuality: input?.sleepQuality || 'unknown',
      soreness: input?.soreness || 'unknown',
      motivation: input?.motivation || 'unknown',
      consecutiveHardDays,
      daysSinceDeload: 14, // Placeholder - would need deload history
      failuresRecent,
    },
  }
}

// =============================================================================
// SESSION ADJUSTMENTS
// =============================================================================

/**
 * Get recommended session adjustments based on readiness
 */
export function getSessionAdjustments(assessment: ReadinessAssessment): SessionAdjustment[] {
  const adjustments: SessionAdjustment[] = []
  
  if (assessment.state === 'recovery_focused') {
    adjustments.push({
      category: 'volume',
      description: 'Reduce overall volume by 50%',
      originalValue: '100%',
      adjustedValue: '50%',
    })
    adjustments.push({
      category: 'intensity',
      description: 'Cap RPE at 6',
      originalValue: 8,
      adjustedValue: 6,
    })
  } else if (assessment.state === 'keep_controlled') {
    adjustments.push({
      category: 'volume',
      description: 'Reduce accessory volume by 30%',
      originalValue: '100%',
      adjustedValue: '70%',
    })
    adjustments.push({
      category: 'intensity',
      description: 'Cap RPE at 7',
      originalValue: 8,
      adjustedValue: 7,
    })
  }
  
  // Add fatigue-specific adjustments
  if (assessment.dominantFatigueType === 'nervous_system') {
    adjustments.push({
      category: 'exercise_swap',
      description: 'Replace heavy compounds with moderate variations',
    })
    adjustments.push({
      category: 'rest_time',
      description: 'Increase rest periods by 30 seconds',
      originalValue: '90s',
      adjustedValue: '120s',
    })
  }
  
  if (assessment.dominantFatigueType === 'local_muscular') {
    adjustments.push({
      category: 'skip_block',
      description: 'Skip or shorten hypertrophy accessories',
    })
  }
  
  if (assessment.dominantFatigueType === 'connective_tissue') {
    adjustments.push({
      category: 'exercise_swap',
      description: 'Use easier static progressions',
    })
    adjustments.push({
      category: 'skip_block',
      description: 'Skip heavy loaded mobility',
    })
  }
  
  return adjustments
}

// =============================================================================
// DASHBOARD HELPERS
// =============================================================================

/**
 * Get simple readiness badge for dashboard
 */
export function getReadinessBadge(): {
  label: string
  color: 'green' | 'yellow' | 'orange' | 'red'
  icon: 'check' | 'minus' | 'alert' | 'x'
} {
  const assessment = getReadinessAssessment()
  
  switch (assessment.state) {
    case 'ready_to_push':
      return { label: 'Ready to Push', color: 'green', icon: 'check' }
    case 'train_normally':
      return { label: 'Train Normally', color: 'yellow', icon: 'minus' }
    case 'keep_controlled':
      return { label: 'Keep Controlled', color: 'orange', icon: 'alert' }
    case 'recovery_focused':
      return { label: 'Recovery Day', color: 'red', icon: 'x' }
  }
}

/**
 * Get short coach message for dashboard
 */
export function getRecoveryCoachMessage(): string {
  const assessment = getReadinessAssessment()
  return assessment.coachMessage
}

// =============================================================================
// EXPORTS FOR INTEGRATION
// =============================================================================

export {
  analyzeFatigueContributions,
  getDominantFatigueType,
  getMethodRecoveryGuidance,
  detectDeloadNeed,
}
