/**
 * =============================================================================
 * ADAPTIVE FOUNDATION MODEL
 * =============================================================================
 *
 * MASTER-3 + MASTER-4 — Athlete Model + Skill State Model + Constraint Detection
 *
 * This module defines the typed, JSON-safe foundation layer that future adaptive
 * intelligence can consume. It synthesizes existing constraint/readiness/skill
 * engines into ONE stable model without duplicating their business logic.
 *
 * ARCHITECTURE RULES:
 * - Pure, typed, JSON-safe
 * - Does NOT mutate sessions/exercises/workouts
 * - Does NOT read localStorage directly
 * - Does NOT throw on missing data — returns honest low-confidence states
 * - REUSES existing engine outputs, does NOT duplicate scoring rules
 *
 * CONSUMPTION:
 * - Attached to AdaptiveProgram as optional `adaptiveFoundationModel` field
 * - Preserved through save/load/normalize
 * - Rendered in Program UI as compact coach intelligence proof
 */

import type { ConstraintResult, ConstraintType, ConstraintCategory, ConfidenceLevel } from '@/types/constraint-engine'

// =============================================================================
// TYPES
// =============================================================================

export type DataQualityLevel = 'insufficient' | 'partial' | 'usable' | 'strong'

export type SkillExpressionStatus =
  | 'direct_priority'
  | 'support'
  | 'carryover'
  | 'deferred'
  | 'unknown'

export type SafeActionBias =
  | 'progress'
  | 'hold'
  | 'reduce'
  | 'prep_first'
  | 'needs_data'

export type ConstraintSeverity = 'none' | 'minor' | 'moderate' | 'major' | 'unknown'

export type SuggestedConstraintAction =
  | 'none'
  | 'progress'
  | 'hold'
  | 'reduce'
  | 'substitute'
  | 'prep'
  | 'defer'
  | 'deload'

// =============================================================================
// [MASTER-5/6] MOVEMENT FAMILY + TISSUE STRESS + SAFEGUARD TYPES
// =============================================================================
// This is display-first safeguard intelligence. It is non-mutating and intended
// for MASTER-5/6 visibility. Future adaptation gates may consume it, but this
// step must not change program prescriptions.

export type MovementFamilyKey =
  | 'straight_arm_push'
  | 'straight_arm_pull'
  | 'bent_arm_push'
  | 'bent_arm_pull'
  | 'vertical_push'
  | 'vertical_pull'
  | 'horizontal_push'
  | 'horizontal_pull'
  | 'core_compression'
  | 'core_bracing'
  | 'explosive_pull'
  | 'weighted_strength'
  | 'rings_support'
  | 'mobility_flexibility'
  | 'lower_body_chain'
  | 'unknown'

export type TissueAreaKey =
  | 'shoulders'
  | 'elbows'
  | 'wrists'
  | 'biceps_tendon'
  | 'forearms'
  | 'lats'
  | 'scapula'
  | 'core'
  | 'lower_back'
  | 'hips'
  | 'hamstrings'
  | 'knees'
  | 'ankles'
  | 'unknown'

export type SafeguardRiskLevel = 'low' | 'moderate' | 'elevated' | 'high' | 'unknown'

export type SafeguardPosture = 'monitor' | 'hold_steady' | 'prep_first' | 'reduce_next' | 'needs_data'

export interface AdaptiveMovementFamilyExposure {
  family: MovementFamilyKey
  label: string
  exposureCount: number
  sessionCount: number
  estimatedStress: SafeguardRiskLevel
  linkedSkills: string[]
  whyItMatters: string
}

export interface AdaptiveTissueStressSignal {
  area: TissueAreaKey
  label: string
  riskLevel: SafeguardRiskLevel
  drivers: string[]
  linkedMovementFamilies: MovementFamilyKey[]
  suggestedPosture: SafeguardPosture
  explanation: string
}

export interface AdaptiveSafeguardIntelligence {
  overallRiskLevel: SafeguardRiskLevel
  currentPosture: SafeguardPosture
  headline: string
  summary: string
  movementFamilies: AdaptiveMovementFamilyExposure[]
  tissueSignals: AdaptiveTissueStressSignal[]
  safeguardNotes: string[]
  dataGaps: string[]
  mutationApplied: false // Always false — this is visibility-only
}

// =============================================================================
// [MASTER-7] GUARDED ADAPTATION PREVIEW TYPES
// =============================================================================
// This is a non-mutating preview of what the AI would consider doing if
// adaptation was allowed. It is derived from safeguardIntelligence and
// cannot apply changes to the saved program.

export type GuardedAdaptationActionType =
  | 'add_prep'
  | 'hold_progression'
  | 'cap_exposure'
  | 'reduce_next_exposure'
  | 'rotate_skill_stress'
  | 'monitor_only'
  | 'needs_data'

export type GuardedAdaptationApplyStatus =
  | 'preview_only'
  | 'blocked_needs_evidence'
  | 'blocked_requires_user_confirmation'
  | 'blocked_no_writer_yet'

export interface GuardedAdaptationCandidate {
  id: string
  actionType: GuardedAdaptationActionType
  label: string
  target: string
  trigger: string
  reason: string
  expectedEffect: string
  applyStatus: GuardedAdaptationApplyStatus
  blockedReason: string
  confidence: DataQualityLevel
}

export interface GuardedAdaptationPreview {
  status: 'preview_ready' | 'needs_data' | 'no_action_needed'
  headline: string
  summary: string
  candidates: GuardedAdaptationCandidate[]
  nonMutationNote: string
}

// =============================================================================
// SOURCE STATUS — tracks what data was available for model building
// =============================================================================

export interface AdaptiveFoundationSourceStatus {
  hasProfileTruth: boolean
  hasSelectedSkills: boolean
  hasWorkoutEvidence: boolean
  hasSkillEvidence: boolean
  hasReadinessEvidence: boolean
  hasConstraintEvidence: boolean
  dataQuality: DataQualityLevel
}

// =============================================================================
// ATHLETE CONTEXT — summarized from profile/settings
// =============================================================================

export interface AdaptiveAthleteContext {
  experienceLevel: string | null
  trainingStyle: string | null
  trainingDays: number | null
  equipmentSummary: string | null
  primaryGoal: string | null
  selectedGoals: string[]
}

// =============================================================================
// SKILL STATE — per-skill adaptive status
// =============================================================================

export interface AdaptiveSkillState {
  skillKey: string
  label: string
  selected: boolean
  priorityRank: number | null
  expressionStatus: SkillExpressionStatus
  readinessStatus: string | null
  limiterCodes: string[]
  evidenceQuality: DataQualityLevel
  nextSafeBias: SafeActionBias
}

// =============================================================================
// CONSTRAINT SUMMARY — normalized from existing constraint engine
// =============================================================================

export interface AdaptiveConstraintSummary {
  code: string
  label: string
  category: ConstraintCategory | string
  severity: ConstraintSeverity
  confidence: ConfidenceLevel | 'unknown'
  affectedSkills: string[]
  affectedMovementFamilies: string[]
  suggestedAction: SuggestedConstraintAction
  explanation: string
}

// =============================================================================
// ALLOWED ACTIONS — what the model permits for downstream layers
// =============================================================================

export interface AdaptiveAllowedActions {
  canProgress: boolean
  shouldHold: boolean
  shouldReduce: boolean
  shouldSubstitute: boolean
  shouldAddPrep: boolean
  shouldDeload: boolean
  shouldDeferSkill: boolean
}

// =============================================================================
// DISPLAY CONTRACT — human-readable summary for UI
// =============================================================================

export interface AdaptiveFoundationDisplay {
  headline: string
  summary: string
  confidenceLabel: string
  actionabilityLabel: string
  noMutationNote: string
  limiterSummary: string | null
  skillSummary: string | null
}

// =============================================================================
// MAIN MODEL
// =============================================================================

export interface AdaptiveFoundationModel {
  version: 'adaptive-foundation-v1'
  generatedAt: string
  sourceStatus: AdaptiveFoundationSourceStatus
  athlete: AdaptiveAthleteContext
  skillStates: AdaptiveSkillState[]
  constraints: AdaptiveConstraintSummary[]
  dominantLimiters: string[]
  allowedActions: AdaptiveAllowedActions
  display: AdaptiveFoundationDisplay
  // [MASTER-5/6] Optional safeguard intelligence — movement-family / tissue-stress / tendon-joint visibility
  safeguardIntelligence?: AdaptiveSafeguardIntelligence
  // [MASTER-7] Optional guarded adaptation preview — non-mutating preview of what AI would consider doing
  guardedAdaptationPreview?: GuardedAdaptationPreview
}

// =============================================================================
// BUILDER INPUT — what the resolver accepts
// =============================================================================

export interface AdaptiveFoundationInput {
  // Profile context
  experienceLevel?: string | null
  trainingStyle?: string | null
  trainingDaysPerWeek?: number | null
  equipment?: string[] | null
  primaryGoal?: string | null
  selectedGoals?: string[] | null
  selectedSkills?: string[] | null

  // Existing engine outputs (reuse, don't rebuild)
  constraintResult?: ConstraintResult | null
  constraintInsight?: { hasInsight: boolean; label: string } | null

  // [MASTER-3/4] Authoritative skill intent from program builder
  authoritativeMultiSkillIntentContract?: {
    selectedSkills?: string[]
    primarySkill?: string | null
    secondarySkill?: string | null
    supportSkills?: string[]
    deferredSkills?: Array<{
      skill: string
      reasonCode: string
      reasonLabel: string
      details?: string
    }>
    materiallyExpressedSkills?: string[]
    skillPriorityOrder?: Array<{
      skill: string
      role: 'primary' | 'secondary' | 'tertiary' | 'support' | 'deferred'
      priorityScore: number
      exposureSessions: number
    }>
    coverageVerdict?: 'strong' | 'adequate' | 'weak'
  } | null

  // Evidence flags
  hasWorkoutHistory?: boolean
  hasSkillLogs?: boolean
  hasReadinessData?: boolean

  // [MASTER-5/6] Program session/exercise data for safeguard analysis
  programSessions?: unknown[] | null
  jointCautions?: string[] | null
}

// =============================================================================
// PURE RESOLVER
// =============================================================================

// =============================================================================
// [MASTER-5/6] SAFEGUARD INTELLIGENCE HELPERS
// =============================================================================

const MOVEMENT_FAMILY_LABELS: Record<MovementFamilyKey, string> = {
  straight_arm_push: 'Straight-arm push',
  straight_arm_pull: 'Straight-arm pull',
  bent_arm_push: 'Bent-arm push',
  bent_arm_pull: 'Bent-arm pull',
  vertical_push: 'Vertical push',
  vertical_pull: 'Vertical pull',
  horizontal_push: 'Horizontal push',
  horizontal_pull: 'Horizontal pull',
  core_compression: 'Core compression',
  core_bracing: 'Core bracing',
  explosive_pull: 'Explosive pull',
  weighted_strength: 'Weighted strength',
  rings_support: 'Rings support',
  mobility_flexibility: 'Mobility / flexibility',
  lower_body_chain: 'Lower body',
  unknown: 'Unknown',
}

const TISSUE_AREA_LABELS: Record<TissueAreaKey, string> = {
  shoulders: 'Shoulders',
  elbows: 'Elbows',
  wrists: 'Wrists',
  biceps_tendon: 'Biceps tendon',
  forearms: 'Forearms',
  lats: 'Lats',
  scapula: 'Scapula',
  core: 'Core',
  lower_back: 'Lower back',
  hips: 'Hips',
  hamstrings: 'Hamstrings',
  knees: 'Knees',
  ankles: 'Ankles',
  unknown: 'Unknown',
}

const MOVEMENT_FAMILY_TISSUE_MAP: Record<MovementFamilyKey, TissueAreaKey[]> = {
  straight_arm_push: ['shoulders', 'wrists', 'elbows'],
  straight_arm_pull: ['biceps_tendon', 'shoulders', 'lats'],
  bent_arm_push: ['shoulders', 'elbows'],
  bent_arm_pull: ['biceps_tendon', 'elbows', 'forearms'],
  vertical_push: ['shoulders', 'wrists'],
  vertical_pull: ['biceps_tendon', 'elbows', 'lats'],
  horizontal_push: ['shoulders', 'elbows'],
  horizontal_pull: ['biceps_tendon', 'elbows', 'lats'],
  core_compression: ['hips', 'core'],
  core_bracing: ['core', 'lower_back'],
  explosive_pull: ['biceps_tendon', 'shoulders', 'elbows'],
  weighted_strength: ['shoulders', 'elbows', 'lower_back'],
  rings_support: ['shoulders', 'wrists', 'elbows'],
  mobility_flexibility: ['hips', 'hamstrings', 'shoulders'],
  lower_body_chain: ['knees', 'ankles', 'hips'],
  unknown: [],
}

const SKILL_MOVEMENT_FAMILY_MAP: Record<string, MovementFamilyKey[]> = {
  planche: ['straight_arm_push'],
  'pseudo_planche': ['straight_arm_push'],
  'planche_lean': ['straight_arm_push'],
  'front_lever': ['straight_arm_pull'],
  'back_lever': ['straight_arm_pull'],
  'muscle_up': ['explosive_pull', 'vertical_pull'],
  'bar_muscle_up': ['explosive_pull', 'vertical_pull'],
  'ring_muscle_up': ['explosive_pull', 'rings_support'],
  hspu: ['vertical_push'],
  'handstand_push_up': ['vertical_push'],
  'pike_push_up': ['vertical_push'],
  'one_arm_pull_up': ['vertical_pull', 'weighted_strength'],
  'one_arm_chin_up': ['vertical_pull', 'weighted_strength'],
  'l_sit': ['core_compression'],
  'v_sit': ['core_compression'],
  'straddle_l': ['core_compression'],
  'manna': ['core_compression', 'straight_arm_push'],
  'iron_cross': ['straight_arm_push', 'rings_support'],
  'maltese': ['straight_arm_push', 'rings_support'],
  'pull_up': ['vertical_pull'],
  'chin_up': ['vertical_pull'],
  'dip': ['vertical_push'],
  'ring_dip': ['vertical_push', 'rings_support'],
  'push_up': ['horizontal_push'],
  'row': ['horizontal_pull'],
  'dragon_flag': ['core_bracing'],
  'human_flag': ['straight_arm_push', 'core_bracing'],
}

const WHY_IT_MATTERS: Record<MovementFamilyKey, string> = {
  straight_arm_push: 'High shoulder/wrist connective tissue demand; requires careful volume management.',
  straight_arm_pull: 'High biceps tendon load; vulnerable to overuse if not managed.',
  bent_arm_push: 'Standard push volume; generally safe with progressive loading.',
  bent_arm_pull: 'Moderate biceps tendon exposure; manageable with balanced training.',
  vertical_push: 'Overhead position loads shoulders; benefits from prep and mobility.',
  vertical_pull: 'Moderate tendon demand; safer than straight-arm variants.',
  horizontal_push: 'Moderate shoulder/chest load; generally well-tolerated.',
  horizontal_pull: 'Moderate back load; supports balance with push movements.',
  core_compression: 'High hip flexor demand; can fatigue quickly if over-trained.',
  core_bracing: 'Lower back stabilization; important for heavier compound work.',
  explosive_pull: 'High-force tendon loading; requires adequate prep and recovery.',
  weighted_strength: 'Progressive overload pattern; connective tissue needs time to adapt.',
  rings_support: 'Demands shoulder stability under instability; careful progression needed.',
  mobility_flexibility: 'Generally restorative; supports tissue health when balanced.',
  lower_body_chain: 'Supports overall athleticism; low direct skill transfer for upper-body skills.',
  unknown: 'Movement pattern not classified.',
}

/** Safely read exercises from a session, handling different shapes */
function readSessionExercises(session: unknown): unknown[] {
  if (!session || typeof session !== 'object') return []
  const s = session as Record<string, unknown>
  if (Array.isArray(s.exercises)) return s.exercises
  if (Array.isArray(s.mainExercises)) return s.mainExercises
  if (Array.isArray(s.blocks)) {
    // Flatten block exercises
    const results: unknown[] = []
    for (const block of s.blocks) {
      if (block && typeof block === 'object') {
        const b = block as Record<string, unknown>
        if (Array.isArray(b.exercises)) results.push(...b.exercises)
      }
    }
    return results
  }
  return []
}

/** Safely read exercise name */
function readExerciseName(ex: unknown): string {
  if (!ex || typeof ex !== 'object') return ''
  const e = ex as Record<string, unknown>
  if (typeof e.name === 'string') return e.name
  if (e.exercise && typeof e.exercise === 'object') {
    const nested = e.exercise as Record<string, unknown>
    if (typeof nested.name === 'string') return nested.name
  }
  return ''
}

/** Safely read movement family from exercise */
function readExerciseMovementFamily(ex: unknown): string {
  if (!ex || typeof ex !== 'object') return ''
  const e = ex as Record<string, unknown>
  if (typeof e.movementFamily === 'string') return e.movementFamily
  if (typeof e.movementPattern === 'string') return e.movementPattern
  if (typeof e.category === 'string') return e.category
  if (e.exercise && typeof e.exercise === 'object') {
    const nested = e.exercise as Record<string, unknown>
    if (typeof nested.movementFamily === 'string') return nested.movementFamily
    if (typeof nested.movementPattern === 'string') return nested.movementPattern
    if (typeof nested.category === 'string') return nested.category
  }
  return ''
}

/** Infer movement family from exercise name */
function inferMovementFamilyFromName(name: string): MovementFamilyKey {
  const n = name.toLowerCase()
  
  // Straight-arm patterns
  if (n.includes('planche') || n.includes('lean') || n.includes('pseudo')) return 'straight_arm_push'
  if (n.includes('front lever') || n.includes('back lever')) return 'straight_arm_pull'
  if (n.includes('maltese') || n.includes('iron cross')) return 'straight_arm_push'
  if (n.includes('human flag')) return 'straight_arm_push'
  
  // Explosive
  if (n.includes('muscle up') || n.includes('muscle-up') || n.includes('high pull') || n.includes('explosive')) return 'explosive_pull'
  
  // Rings
  if (n.includes('ring support') || n.includes('support hold') || n.includes('rings')) return 'rings_support'
  
  // Vertical push
  if (n.includes('hspu') || n.includes('handstand push') || n.includes('pike push')) return 'vertical_push'
  if (n.includes('dip')) return 'vertical_push'
  
  // Vertical pull
  if (n.includes('pull up') || n.includes('pull-up') || n.includes('chin up') || n.includes('chin-up')) return 'vertical_pull'
  if (n.includes('one arm pull') || n.includes('one-arm pull')) return 'vertical_pull'
  
  // Horizontal
  if (n.includes('push up') || n.includes('push-up') || n.includes('pushup')) return 'horizontal_push'
  if (n.includes('row')) return 'horizontal_pull'
  
  // Core
  if (n.includes('l-sit') || n.includes('l sit') || n.includes('v-sit') || n.includes('v sit') || n.includes('manna') || n.includes('straddle')) return 'core_compression'
  if (n.includes('dragon flag') || n.includes('hollow') || n.includes('arch')) return 'core_bracing'
  if (n.includes('plank') || n.includes('dead bug')) return 'core_bracing'
  
  // Weighted
  if (n.includes('weighted')) return 'weighted_strength'
  
  // Mobility
  if (n.includes('stretch') || n.includes('pancake') || n.includes('split') || n.includes('mobility') || n.includes('flexibility')) return 'mobility_flexibility'
  
  // Lower body
  if (n.includes('squat') || n.includes('lunge') || n.includes('calf') || n.includes('tibialis') || n.includes('pistol')) return 'lower_body_chain'
  
  return 'unknown'
}

/** Build safeguard intelligence from program sessions and skills */
function buildSafeguardIntelligence(
  input: AdaptiveFoundationInput,
  skillStates: AdaptiveSkillState[]
): AdaptiveSafeguardIntelligence {
  const sessions = input.programSessions || []
  const jointCautions = input.jointCautions || []
  const selectedSkills = input.selectedSkills || []
  
  // Track movement family exposures
  const familyExposures = new Map<MovementFamilyKey, { count: number; sessions: Set<number>; skills: Set<string> }>()
  
  // Add skill-implied families
  for (const skill of selectedSkills) {
    const normalizedSkill = skill.toLowerCase().replace(/[- ]/g, '_')
    const families = SKILL_MOVEMENT_FAMILY_MAP[normalizedSkill] || []
    for (const family of families) {
      const existing = familyExposures.get(family) || { count: 0, sessions: new Set(), skills: new Set() }
      existing.skills.add(skill)
      familyExposures.set(family, existing)
    }
  }
  
  // Scan sessions for exercise families
  sessions.forEach((session, sessionIndex) => {
    const exercises = readSessionExercises(session)
    for (const ex of exercises) {
      const name = readExerciseName(ex)
      const explicitFamily = readExerciseMovementFamily(ex)
      let family: MovementFamilyKey = 'unknown'
      
      if (explicitFamily) {
        // Try to map explicit value to our keys
        const normalized = explicitFamily.toLowerCase().replace(/[- ]/g, '_') as MovementFamilyKey
        if (normalized in MOVEMENT_FAMILY_LABELS) {
          family = normalized
        } else {
          family = inferMovementFamilyFromName(name)
        }
      } else {
        family = inferMovementFamilyFromName(name)
      }
      
      if (family !== 'unknown') {
        const existing = familyExposures.get(family) || { count: 0, sessions: new Set(), skills: new Set() }
        existing.count++
        existing.sessions.add(sessionIndex)
        familyExposures.set(family, existing)
      }
    }
  })
  
  // Convert to sorted array
  const movementFamilies: AdaptiveMovementFamilyExposure[] = []
  for (const [family, data] of familyExposures.entries()) {
    // Calculate stress level
    let estimatedStress: SafeguardRiskLevel = 'low'
    const isHighRiskFamily = ['straight_arm_push', 'straight_arm_pull', 'explosive_pull', 'rings_support'].includes(family)
    
    if (isHighRiskFamily) {
      if (data.sessions.size >= 4 || data.count >= 8) estimatedStress = 'high'
      else if (data.sessions.size >= 3 || data.count >= 5) estimatedStress = 'elevated'
      else if (data.sessions.size >= 2 || data.count >= 3) estimatedStress = 'moderate'
    } else {
      if (data.sessions.size >= 5 || data.count >= 10) estimatedStress = 'elevated'
      else if (data.sessions.size >= 3 || data.count >= 6) estimatedStress = 'moderate'
    }
    
    movementFamilies.push({
      family,
      label: MOVEMENT_FAMILY_LABELS[family],
      exposureCount: data.count,
      sessionCount: data.sessions.size,
      estimatedStress,
      linkedSkills: Array.from(data.skills),
      whyItMatters: WHY_IT_MATTERS[family],
    })
  }
  
  // Sort by stress level and exposure
  const stressOrder: Record<SafeguardRiskLevel, number> = { high: 0, elevated: 1, moderate: 2, low: 3, unknown: 4 }
  movementFamilies.sort((a, b) => {
    const stressDiff = stressOrder[a.estimatedStress] - stressOrder[b.estimatedStress]
    if (stressDiff !== 0) return stressDiff
    return b.exposureCount - a.exposureCount
  })
  
  // Build tissue signals from movement families
  const tissueStressMap = new Map<TissueAreaKey, { 
    riskLevel: SafeguardRiskLevel
    drivers: string[]
    families: Set<MovementFamilyKey>
  }>()
  
  for (const mf of movementFamilies) {
    const tissues = MOVEMENT_FAMILY_TISSUE_MAP[mf.family]
    for (const tissue of tissues) {
      const existing = tissueStressMap.get(tissue) || { riskLevel: 'low', drivers: [], families: new Set() }
      
      // Escalate risk level
      if (stressOrder[mf.estimatedStress] < stressOrder[existing.riskLevel]) {
        existing.riskLevel = mf.estimatedStress
      }
      
      existing.drivers.push(mf.label)
      existing.families.add(mf.family)
      tissueStressMap.set(tissue, existing)
    }
  }
  
  // Check for joint cautions from profile
  for (const caution of jointCautions) {
    const normalizedCaution = caution.toLowerCase()
    let tissueArea: TissueAreaKey | null = null
    
    if (normalizedCaution.includes('shoulder')) tissueArea = 'shoulders'
    else if (normalizedCaution.includes('elbow')) tissueArea = 'elbows'
    else if (normalizedCaution.includes('wrist')) tissueArea = 'wrists'
    else if (normalizedCaution.includes('bicep') || normalizedCaution.includes('tendon')) tissueArea = 'biceps_tendon'
    else if (normalizedCaution.includes('back') || normalizedCaution.includes('spine')) tissueArea = 'lower_back'
    else if (normalizedCaution.includes('hip')) tissueArea = 'hips'
    else if (normalizedCaution.includes('knee')) tissueArea = 'knees'
    
    if (tissueArea) {
      const existing = tissueStressMap.get(tissueArea) || { riskLevel: 'low', drivers: [], families: new Set() }
      existing.riskLevel = 'elevated' // Joint caution elevates concern
      existing.drivers.push(`Profile caution: ${caution}`)
      tissueStressMap.set(tissueArea, existing)
    }
  }
  
  // Convert tissue signals to array
  const tissueSignals: AdaptiveTissueStressSignal[] = []
  for (const [area, data] of tissueStressMap.entries()) {
    if (data.riskLevel === 'low' && data.drivers.length <= 1) continue // Skip low-signal tissues
    
    let suggestedPosture: SafeguardPosture = 'monitor'
    if (data.riskLevel === 'high') suggestedPosture = 'prep_first'
    else if (data.riskLevel === 'elevated') suggestedPosture = 'hold_steady'
    
    const familiesArray = Array.from(data.families)
    const explanation = data.riskLevel === 'high' || data.riskLevel === 'elevated'
      ? `${TISSUE_AREA_LABELS[area]} under notable stress from ${data.drivers.slice(0, 3).join(', ')}. Safeguard posture: ${suggestedPosture.replace('_', '-')}.`
      : `${TISSUE_AREA_LABELS[area]} receiving moderate exposure. Monitor for fatigue signals.`
    
    tissueSignals.push({
      area,
      label: TISSUE_AREA_LABELS[area],
      riskLevel: data.riskLevel,
      drivers: data.drivers,
      linkedMovementFamilies: familiesArray,
      suggestedPosture,
      explanation,
    })
  }
  
  // Sort tissue signals by risk
  tissueSignals.sort((a, b) => stressOrder[a.riskLevel] - stressOrder[b.riskLevel])
  
  // Determine overall posture
  const hasHighRisk = movementFamilies.some(mf => mf.estimatedStress === 'high') || tissueSignals.some(ts => ts.riskLevel === 'high')
  const hasElevatedRisk = movementFamilies.some(mf => mf.estimatedStress === 'elevated') || tissueSignals.some(ts => ts.riskLevel === 'elevated')
  const hasAnySessions = sessions.length > 0
  
  let overallRiskLevel: SafeguardRiskLevel = 'low'
  let currentPosture: SafeguardPosture = 'needs_data'
  
  if (!hasAnySessions && selectedSkills.length === 0) {
    overallRiskLevel = 'unknown'
    currentPosture = 'needs_data'
  } else if (hasHighRisk) {
    overallRiskLevel = 'high'
    currentPosture = 'prep_first'
  } else if (hasElevatedRisk) {
    overallRiskLevel = 'elevated'
    currentPosture = 'hold_steady'
  } else if (movementFamilies.length > 0) {
    overallRiskLevel = 'moderate'
    currentPosture = 'monitor'
  } else {
    overallRiskLevel = 'low'
    currentPosture = 'monitor'
  }
  
  // Build headline and summary
  const headline = currentPosture === 'needs_data'
    ? 'Building safeguard baseline'
    : currentPosture === 'prep_first'
    ? 'Prep-first safeguard recommended'
    : currentPosture === 'hold_steady'
    ? 'Hold-steady monitoring active'
    : 'Standard monitoring active'
  
  const highRiskFamilies = movementFamilies.filter(mf => mf.estimatedStress === 'high' || mf.estimatedStress === 'elevated')
  const summary = highRiskFamilies.length > 0
    ? `Monitoring ${highRiskFamilies.map(mf => mf.label.toLowerCase()).slice(0, 2).join(', ')} exposure for tissue safety.`
    : sessions.length > 0
    ? 'Movement stress patterns analyzed; no elevated concerns detected.'
    : 'Awaiting session data for movement stress analysis.'
  
  // Build notes and gaps
  const safeguardNotes: string[] = []
  const dataGaps: string[] = []
  
  if (currentPosture === 'prep_first') {
    safeguardNotes.push('Prep-first safeguard recommended for future adaptation; no automatic program changes applied yet.')
  }
  if (hasElevatedRisk || hasHighRisk) {
    safeguardNotes.push('Consider adequate warm-up and prehab for high-stress movement patterns.')
  }
  safeguardNotes.push('This is visibility-only analysis; program structure is unchanged.')
  
  if (!input.hasWorkoutHistory) dataGaps.push('Logged workout performance')
  if (!input.hasSkillLogs) dataGaps.push('Skill session evidence')
  dataGaps.push('RPE and set completion quality')
  dataGaps.push('Discomfort/tension notes')
  
  return {
    overallRiskLevel,
    currentPosture,
    headline,
    summary,
    movementFamilies: movementFamilies.slice(0, 8), // Cap at 8 for display
    tissueSignals: tissueSignals.slice(0, 6), // Cap at 6 for display
    safeguardNotes,
    dataGaps,
    mutationApplied: false,
  }
}

// =============================================================================
// [MASTER-7] GUARDED ADAPTATION PREVIEW BUILDER
// =============================================================================
// This builds a non-mutating preview of what the AI would consider doing
// if adaptation was allowed. It derives candidates from safeguard intelligence.

function buildGuardedAdaptationPreview(
  input: AdaptiveFoundationInput,
  sourceStatus: AdaptiveFoundationSourceStatus,
  safeguard: AdaptiveSafeguardIntelligence
): GuardedAdaptationPreview {
  const candidates: GuardedAdaptationCandidate[] = []
  let candidateIndex = 0
  
  // Helper to create stable IDs
  const makeId = (prefix: string) => `gac_${prefix}_${candidateIndex++}`
  
  // 1. Check for prep-first tissue signals
  const prepFirstSignals = safeguard.tissueSignals.filter(ts => ts.suggestedPosture === 'prep_first')
  if (prepFirstSignals.length > 0) {
    const targetAreas = prepFirstSignals.map(ts => ts.label).slice(0, 3).join(', ')
    candidates.push({
      id: makeId('prep'),
      actionType: 'add_prep',
      label: 'Add prep-first safeguard',
      target: targetAreas,
      trigger: `Prep-first posture on ${prepFirstSignals.length} tissue area(s)`,
      reason: 'High/elevated tissue exposure needs preparation before progression.',
      expectedEffect: 'Future adaptation could add or emphasize warm-up/prehab work before increasing load.',
      applyStatus: 'blocked_no_writer_yet',
      blockedReason: 'MASTER-7 is preview-only; no program writer is allowed yet.',
      confidence: sourceStatus.dataQuality,
    })
  }
  
  // 2. Check for high-stress movement families
  const highStressFamilies = safeguard.movementFamilies.filter(mf => mf.estimatedStress === 'high')
  if (highStressFamilies.length > 0) {
    const targetFamilies = highStressFamilies.map(mf => mf.label).slice(0, 2).join(', ')
    const totalExposure = highStressFamilies.reduce((sum, mf) => sum + mf.exposureCount, 0)
    candidates.push({
      id: makeId('cap'),
      actionType: 'cap_exposure',
      label: 'Cap high-stress exposure',
      target: targetFamilies,
      trigger: `High stress with ${totalExposure} exposures across ${highStressFamilies.length} family(ies)`,
      reason: 'Excessive high-force work can overwhelm connective tissue recovery.',
      expectedEffect: 'Future adaptation could hold or limit additional exposure instead of adding more work.',
      applyStatus: 'blocked_no_writer_yet',
      blockedReason: 'Requires future guarded writer.',
      confidence: sourceStatus.dataQuality,
    })
  }
  
  // 3. Check for elevated straight-arm families
  const straightArmFamilies = safeguard.movementFamilies.filter(
    mf => (mf.family === 'straight_arm_push' || mf.family === 'straight_arm_pull') &&
          (mf.estimatedStress === 'elevated' || mf.estimatedStress === 'high')
  )
  if (straightArmFamilies.length > 0) {
    const targetFamilies = straightArmFamilies.map(mf => mf.label).join(', ')
    candidates.push({
      id: makeId('hold_sa'),
      actionType: 'hold_progression',
      label: 'Hold straight-arm progression',
      target: targetFamilies,
      trigger: `Elevated/high straight-arm exposure`,
      reason: 'Straight-arm work places high demand on tendons; progression should be gradual.',
      expectedEffect: 'Future adaptation could hold progression level until completion/RPE/discomfort evidence supports progression.',
      applyStatus: 'blocked_no_writer_yet',
      blockedReason: 'Requires future guarded writer.',
      confidence: sourceStatus.dataQuality,
    })
  }
  
  // 4. Check for explosive pull stress
  const explosivePull = safeguard.movementFamilies.find(
    mf => mf.family === 'explosive_pull' && (mf.estimatedStress === 'elevated' || mf.estimatedStress === 'high')
  )
  if (explosivePull) {
    candidates.push({
      id: makeId('hold_exp'),
      actionType: 'hold_progression',
      label: 'Monitor explosive pull load',
      target: explosivePull.label,
      trigger: `${explosivePull.estimatedStress} stress with ${explosivePull.exposureCount} exposures`,
      reason: 'Explosive movements create high peak forces on biceps tendon and connective tissue.',
      expectedEffect: 'Future adaptation could pace explosive work progression based on logged performance.',
      applyStatus: 'blocked_no_writer_yet',
      blockedReason: 'Requires future guarded writer.',
      confidence: sourceStatus.dataQuality,
    })
  }
  
  // 5. Check if data is insufficient
  if (sourceStatus.dataQuality === 'insufficient' || sourceStatus.dataQuality === 'partial') {
    candidates.push({
      id: makeId('data'),
      actionType: 'needs_data',
      label: 'Collect evidence before applying',
      target: 'Workout/RPE/readiness data',
      trigger: `Data quality is ${sourceStatus.dataQuality}`,
      reason: 'Safe adaptation requires evidence from actual training.',
      expectedEffect: 'Logging sets, RPE, and discomfort notes unlocks safer application.',
      applyStatus: 'blocked_needs_evidence',
      blockedReason: 'Insufficient training history to safely apply changes.',
      confidence: sourceStatus.dataQuality,
    })
  }
  
  // Determine overall status
  let status: GuardedAdaptationPreview['status'] = 'no_action_needed'
  let headline = 'No guarded adaptation needed'
  let summary = 'Current safeguard map does not indicate any adaptation candidates.'
  
  if (candidates.length === 0) {
    status = 'no_action_needed'
    headline = 'No adaptation candidates'
    summary = 'Current training stress is within safe ranges; no changes would be considered.'
  } else if (sourceStatus.dataQuality === 'insufficient') {
    status = 'needs_data'
    headline = 'Preview blocked — needs evidence'
    summary = `${candidates.length} potential candidate(s) identified, but application is blocked until more training data is logged.`
  } else {
    status = 'preview_ready'
    headline = `${candidates.length} adaptation candidate(s) preview`
    summary = 'The following changes would be considered if adaptation was enabled. None are applied yet.'
  }
  
  return {
    status,
    headline,
    summary,
    candidates: candidates.slice(0, 6), // Cap at 6 for display
    nonMutationNote: 'This is a preview only. No automatic program changes have been applied.',
  }
}

function resolveDataQuality(input: AdaptiveFoundationInput): DataQualityLevel {
  let score = 0

  if (input.experienceLevel) score += 1
  if (input.selectedSkills && input.selectedSkills.length > 0) score += 1
  if (input.hasWorkoutHistory) score += 1
  if (input.hasSkillLogs) score += 1
  if (input.hasReadinessData) score += 1
  if (input.constraintResult && input.constraintResult.dataQuality !== 'insufficient') score += 1

  if (score >= 5) return 'strong'
  if (score >= 3) return 'usable'
  if (score >= 1) return 'partial'
  return 'insufficient'
}

function resolveSkillStates(input: AdaptiveFoundationInput): AdaptiveSkillState[] {
  const selectedSkills = input.selectedSkills || []
  const intentContract = input.authoritativeMultiSkillIntentContract
  const priorityOrder = intentContract?.skillPriorityOrder || []
  const deferredSkills = new Set((intentContract?.deferredSkills || []).map(d => d.skill))
  const supportSkills = new Set(intentContract?.supportSkills || [])
  const materialSkills = new Set(intentContract?.materiallyExpressedSkills || [])

  // Map priority order by skill for quick lookup
  const priorityMap = new Map(
    priorityOrder.map((p) => [p.skill, p])
  )

  return selectedSkills.map((skillKey, index) => {
    const priority = priorityMap.get(skillKey)
    const role = priority?.role || 'unknown'

    let expressionStatus: SkillExpressionStatus = 'unknown'
    if (role === 'primary' || role === 'secondary') {
      expressionStatus = 'direct_priority'
    } else if (role === 'support' || supportSkills.has(skillKey)) {
      expressionStatus = 'support'
    } else if (role === 'tertiary' || materialSkills.has(skillKey)) {
      expressionStatus = 'carryover'
    } else if (role === 'deferred' || deferredSkills.has(skillKey)) {
      expressionStatus = 'deferred'
    }

    return {
      skillKey,
      label: skillKey.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      selected: true,
      priorityRank: priority?.priorityScore ?? index + 1,
      expressionStatus,
      readinessStatus: null, // Future: consume readiness engine output
      limiterCodes: [],
      evidenceQuality: input.hasSkillLogs ? 'usable' : 'partial',
      nextSafeBias: input.hasWorkoutHistory ? 'hold' : 'needs_data',
    }
  })
}

function resolveConstraints(input: AdaptiveFoundationInput): AdaptiveConstraintSummary[] {
  const result = input.constraintResult
  if (!result) return []

  const constraints: AdaptiveConstraintSummary[] = []

  // Primary constraint
  if (result.primaryConstraint && result.primaryConstraint !== 'no_primary_constraint') {
    constraints.push({
      code: result.primaryConstraint,
      label: result.constraintLabel || result.primaryConstraint.replace(/_/g, ' '),
      category: result.category || 'none',
      severity: result.score >= 7 ? 'major' : result.score >= 4 ? 'moderate' : 'minor',
      confidence: result.confidence || 'low',
      affectedSkills: [],
      affectedMovementFamilies: [],
      suggestedAction: mapConstraintToAction(result.primaryConstraint),
      explanation: result.explanation || '',
    })
  }

  // Secondary constraint if present
  if (result.secondarySignal && result.secondarySignal !== 'no_primary_constraint') {
    constraints.push({
      code: result.secondarySignal,
      label: result.secondaryLabel || result.secondarySignal.replace(/_/g, ' '),
      category: 'none',
      severity: 'minor',
      confidence: 'low',
      affectedSkills: [],
      affectedMovementFamilies: [],
      suggestedAction: 'hold',
      explanation: '',
    })
  }

  return constraints
}

function mapConstraintToAction(constraintType: ConstraintType | string): SuggestedConstraintAction {
  switch (constraintType) {
    case 'fatigue_accumulation':
    case 'recovery_deficit':
      return 'deload'
    case 'progression_jump_too_large':
      return 'reduce'
    case 'skill_density_deficit':
    case 'inconsistent_skill_exposure':
      return 'hold'
    case 'pull_strength_deficit':
    case 'push_strength_deficit':
    case 'core_tension_deficit':
      return 'prep'
    case 'early_calibration':
    case 'building_consistency':
    case 'insufficient_data':
      return 'hold'
    default:
      return 'none'
  }
}

function resolveAllowedActions(
  dataQuality: DataQualityLevel,
  constraints: AdaptiveConstraintSummary[]
): AdaptiveAllowedActions {
  const majorConstraint = constraints.find((c) => c.severity === 'major')
  const needsRecovery = constraints.some(
    (c) => c.code === 'fatigue_accumulation' || c.code === 'recovery_deficit'
  )

  return {
    canProgress: dataQuality === 'strong' && !majorConstraint,
    shouldHold: dataQuality === 'partial' || dataQuality === 'usable',
    shouldReduce: !!majorConstraint,
    shouldSubstitute: false, // Future: injury/substitution layer
    shouldAddPrep: constraints.some((c) => c.suggestedAction === 'prep'),
    shouldDeload: needsRecovery,
    shouldDeferSkill: false, // Future: skill deferral layer
  }
}

function resolveDisplay(
  sourceStatus: AdaptiveFoundationSourceStatus,
  constraints: AdaptiveConstraintSummary[],
  skillStates: AdaptiveSkillState[],
  allowedActions: AdaptiveAllowedActions
): AdaptiveFoundationDisplay {
  // Headline based on data quality
  const qualityLabels: Record<DataQualityLevel, string> = {
    insufficient: 'Building baseline',
    partial: 'Partial evidence',
    usable: 'Usable foundation',
    strong: 'Strong foundation',
  }

  // Limiter summary
  let limiterSummary: string | null = null
  if (constraints.length > 0) {
    const primary = constraints[0]
    limiterSummary = `Primary limiter: ${primary.label}`
  } else if (sourceStatus.dataQuality === 'insufficient') {
    limiterSummary = 'More training data needed to identify limiters'
  }

  // Skill summary
  let skillSummary: string | null = null
  if (skillStates.length > 0) {
    const direct = skillStates.filter((s) => s.expressionStatus === 'direct_priority').length
    const support = skillStates.filter((s) => s.expressionStatus === 'support').length
    const other = skillStates.length - direct - support
    const parts: string[] = []
    if (direct > 0) parts.push(`${direct} direct`)
    if (support > 0) parts.push(`${support} support`)
    if (other > 0) parts.push(`${other} rotating`)
    skillSummary = parts.join(' · ')
  }

  // Actionability
  let actionabilityLabel = 'Monitor only'
  if (allowedActions.shouldDeload) {
    actionabilityLabel = 'Recovery priority'
  } else if (allowedActions.shouldReduce) {
    actionabilityLabel = 'Reduce load'
  } else if (allowedActions.shouldAddPrep) {
    actionabilityLabel = 'Prep-first'
  } else if (allowedActions.canProgress) {
    actionabilityLabel = 'Ready to progress'
  } else if (allowedActions.shouldHold) {
    actionabilityLabel = 'Hold steady'
  }

  return {
    headline: `Adaptive foundation: ${qualityLabels[sourceStatus.dataQuality]}`,
    summary: 'Skill priorities, constraints, and readiness mapped for future adjustments.',
    confidenceLabel: qualityLabels[sourceStatus.dataQuality],
    actionabilityLabel,
    noMutationNote: 'Foundation only — no automatic program changes applied by this layer yet.',
    limiterSummary,
    skillSummary,
  }
}

// =============================================================================
// MAIN BUILDER FUNCTION
// =============================================================================

export function buildAdaptiveFoundationModel(
  input: AdaptiveFoundationInput
): AdaptiveFoundationModel {
  // Source status
  const sourceStatus: AdaptiveFoundationSourceStatus = {
    hasProfileTruth: !!(input.experienceLevel || input.primaryGoal),
    hasSelectedSkills: !!(input.selectedSkills && input.selectedSkills.length > 0),
    hasWorkoutEvidence: !!input.hasWorkoutHistory,
    hasSkillEvidence: !!input.hasSkillLogs,
    hasReadinessEvidence: !!input.hasReadinessData,
    hasConstraintEvidence: !!(input.constraintResult || input.constraintInsight?.hasInsight),
    dataQuality: resolveDataQuality(input),
  }

  // Athlete context
  const athlete: AdaptiveAthleteContext = {
    experienceLevel: input.experienceLevel || null,
    trainingStyle: input.trainingStyle || null,
    trainingDays: input.trainingDaysPerWeek || null,
    equipmentSummary: input.equipment?.join(', ') || null,
    primaryGoal: input.primaryGoal || null,
    selectedGoals: input.selectedGoals || [],
  }

  // Skill states
  const skillStates = resolveSkillStates(input)

  // Constraints
  const constraints = resolveConstraints(input)

  // Dominant limiters
  const dominantLimiters = constraints.slice(0, 2).map((c) => c.label)

  // Allowed actions
  const allowedActions = resolveAllowedActions(sourceStatus.dataQuality, constraints)

  // Display
  const display = resolveDisplay(sourceStatus, constraints, skillStates, allowedActions)

  // [MASTER-5/6] Safeguard intelligence — movement family / tissue stress / tendon-joint visibility
  const safeguardIntelligence = buildSafeguardIntelligence(input, skillStates)

  // [MASTER-7] Guarded adaptation preview — non-mutating preview of what AI would consider
  const guardedAdaptationPreview = buildGuardedAdaptationPreview(input, sourceStatus, safeguardIntelligence)

  return {
    version: 'adaptive-foundation-v1',
    generatedAt: new Date().toISOString(),
    sourceStatus,
    athlete,
    skillStates,
    constraints,
    dominantLimiters,
    allowedActions,
    display,
    safeguardIntelligence,
    guardedAdaptationPreview,
  }
}

// =============================================================================
// EMPTY/DEFAULT MODEL FOR MISSING DATA
// =============================================================================

export function buildEmptyAdaptiveFoundationModel(): AdaptiveFoundationModel {
  return buildAdaptiveFoundationModel({})
}
