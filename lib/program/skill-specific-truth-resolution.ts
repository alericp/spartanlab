/**
 * SKILL-SPECIFIC TRUTH RESOLUTION
 * 
 * Resolves skill-family earned state from bundle truth with strict precedence:
 * CURRENT WORKING STATE > RECENT RESPONSE TREND > HISTORICAL CEILING > GENERIC DEFAULTS
 * 
 * This layer sharpens DB truth from broad/global to skill-family-specific
 * before existing owners consume it.
 */

import type { ProgrammingTruthBundle, TruthConfidence } from './programming-truth-bundle-contract'

// =============================================================================
// TYPES
// =============================================================================

/**
 * Skill family categories that share training patterns
 */
export type SkillFamily = 
  | 'front_lever'
  | 'back_lever'
  | 'planche'
  | 'handstand'
  | 'hspu'
  | 'muscle_up'
  | 'weighted_pull'
  | 'weighted_dip'
  | 'l_sit'
  | 'v_sit'
  | 'compression'
  | 'rings_strength'
  | 'general_pull'
  | 'general_push'
  | 'unknown'

/**
 * Resolved skill-family truth with precedence applied
 */
export interface SkillFamilyTruth {
  family: SkillFamily
  
  // Current earned state (highest precedence)
  currentEarnedState: {
    progressScore: number | null
    currentLevel: number | null
    lastUpdated: string | null
    confidence: TruthConfidence
  }
  
  // Recent response (second precedence)
  recentResponse: {
    toleranceSignal: 'good' | 'moderate' | 'poor' | 'unknown'
    adherencePattern: 'consistent' | 'improving' | 'declining' | 'sporadic' | 'unknown'
    completionRate: number | null
    painMarkers: boolean
    confidence: TruthConfidence
  }
  
  // Historical context (lowest precedence - informational only)
  historicalContext: {
    historicalCeiling: number | null
    priorBestLevel: number | null
    monthsAtCeiling: number | null
    confidence: TruthConfidence
  }
  
  // Resolved decisions
  resolved: {
    rankingModifier: number  // -25 to +25 for this specific family
    progressionDepth: 'conservative' | 'moderate' | 'progressive'
    prescriptionBias: 'soften' | 'maintain' | 'push'
    substitutePreference: 'prefer_safer' | 'normal' | 'allow_challenging'
    precedenceUsed: 'current' | 'response' | 'historical' | 'default'
    resolutionReason: string
  }
  
  // Meta
  dataAvailable: boolean
  overallConfidence: TruthConfidence
}

/**
 * Pattern-specific response data
 */
export interface PatternResponse {
  pattern: string  // e.g., 'vertical_push', 'horizontal_pull', 'straight_arm_press'
  
  recentTolerance: 'good' | 'moderate' | 'poor' | 'unknown'
  volumeTolerance: number | null  // 0-1 scale
  intensityTolerance: number | null  // 0-1 scale
  completionRate: number | null
  
  // Specific signals
  lastSessionQuality: 'completed' | 'partial' | 'failed' | 'unknown'
  painOrDiscomfortReported: boolean
  recoveryAdequate: boolean
  
  // Recommendations
  recommendedAction: 'push' | 'maintain' | 'soften' | 'substitute'
  dosageModifier: number  // -2 to +2 for sets
  intensityModifier: number  // -1 to +1 for RPE
  restModifier: number  // seconds adjustment
  
  confidence: TruthConfidence
}

/**
 * Smart substitution recommendation
 */
export interface SubstitutionRecommendation {
  originalPattern: string
  reason: 'constraint' | 'poor_response' | 'fatigue' | 'recovery'
  shouldSubstitute: boolean
  substitutePreference: string[]  // Ordered list of safer alternatives
  intensityReduction: number  // 0-30% recommended reduction
  leverageReduction: 'none' | 'slight' | 'significant'
  confidence: TruthConfidence
}

// =============================================================================
// SKILL FAMILY MAPPING
// =============================================================================

const SKILL_TO_FAMILY: Record<string, SkillFamily> = {
  // Front lever family
  'front_lever': 'front_lever',
  'frontlever': 'front_lever',
  'fl': 'front_lever',
  'front_lever_row': 'front_lever',
  'ice_cream_maker': 'front_lever',
  
  // Back lever family
  'back_lever': 'back_lever',
  'backlever': 'back_lever',
  'bl': 'back_lever',
  'german_hang': 'back_lever',
  
  // Planche family
  'planche': 'planche',
  'planche_lean': 'planche',
  'pseudo_planche_pushup': 'planche',
  'tuck_planche': 'planche',
  'straddle_planche': 'planche',
  
  // Handstand family
  'handstand': 'handstand',
  'hs': 'handstand',
  'handstand_hold': 'handstand',
  'press_to_handstand': 'handstand',
  
  // HSPU family
  'hspu': 'hspu',
  'handstand_pushup': 'hspu',
  'pike_pushup': 'hspu',
  'wall_hspu': 'hspu',
  
  // Muscle up family
  'muscle_up': 'muscle_up',
  'muscleup': 'muscle_up',
  'bar_muscle_up': 'muscle_up',
  'ring_muscle_up': 'muscle_up',
  
  // Weighted pull family
  'weighted_pull': 'weighted_pull',
  'weighted_pullup': 'weighted_pull',
  'pull_up': 'weighted_pull',
  'chin_up': 'weighted_pull',
  
  // Weighted dip family
  'weighted_dip': 'weighted_dip',
  'dip': 'weighted_dip',
  'ring_dip': 'weighted_dip',
  'bar_dip': 'weighted_dip',
  
  // L-sit family
  'l_sit': 'l_sit',
  'lsit': 'l_sit',
  'l_sit_hold': 'l_sit',
  
  // V-sit family
  'v_sit': 'v_sit',
  'vsit': 'v_sit',
  'manna': 'v_sit',
  
  // Compression family
  'compression': 'compression',
  'pike_compression': 'compression',
  'straddle_compression': 'compression',
  
  // Rings strength
  'iron_cross': 'rings_strength',
  'maltese': 'rings_strength',
  'rings_support': 'rings_strength',
}

const PATTERN_TO_FAMILIES: Record<string, SkillFamily[]> = {
  'vertical_push': ['hspu', 'handstand'],
  'horizontal_push': ['planche', 'weighted_dip'],
  'vertical_pull': ['weighted_pull', 'muscle_up'],
  'horizontal_pull': ['front_lever'],
  'straight_arm_press': ['planche', 'front_lever', 'back_lever'],
  'straight_arm_pull': ['front_lever', 'back_lever'],
  'compression': ['l_sit', 'v_sit', 'compression'],
  'balance': ['handstand'],
}

// =============================================================================
// MAIN RESOLUTION FUNCTIONS
// =============================================================================

/**
 * Resolve skill-family truth with strict precedence
 * [RUNTIME-HARDENING] Accepts unknown skill type and normalizes safely
 */
export function resolveSkillFamilyTruth(
  bundle: ProgrammingTruthBundle | null,
  skill: unknown,
  canonicalHistoricalCeiling?: number | null
): SkillFamilyTruth {
  // [RUNTIME-HARDENING] Normalize skill to safe string before any operations
  const safeSkill = typeof skill === 'string' && skill.trim() !== '' ? skill : ''
  const family = mapSkillToFamily(safeSkill)
  const normalizedSkill = safeSkill.replace(/_/g, '').toLowerCase()
  
  // Default empty truth
  const defaultTruth: SkillFamilyTruth = {
    family,
    currentEarnedState: {
      progressScore: null,
      currentLevel: null,
      lastUpdated: null,
      confidence: 'none',
    },
    recentResponse: {
      toleranceSignal: 'unknown',
      adherencePattern: 'unknown',
      completionRate: null,
      painMarkers: false,
      confidence: 'none',
    },
    historicalContext: {
      historicalCeiling: canonicalHistoricalCeiling ?? null,
      priorBestLevel: null,
      monthsAtCeiling: null,
      confidence: canonicalHistoricalCeiling !== null ? 'low' : 'none',
    },
    resolved: {
      rankingModifier: 0,
      progressionDepth: 'moderate',
      prescriptionBias: 'maintain',
      substitutePreference: 'normal',
      precedenceUsed: 'default',
      resolutionReason: 'no_db_truth_available',
    },
    dataAvailable: false,
    overallConfidence: 'none',
  }
  
  if (!bundle) {
    return defaultTruth
  }
  
  const truth = { ...defaultTruth }
  
  // 1. EXTRACT CURRENT EARNED STATE (highest precedence)
  if (bundle.skillProgressions?.meta?.available) {
    const progressionData = bundle.skillProgressions.bySkill[normalizedSkill] ||
                            bundle.skillProgressions.bySkill[skill] ||
                            bundle.skillProgressions.bySkill[family]
    
    if (progressionData) {
      truth.currentEarnedState = {
        progressScore: progressionData.progressScore ?? null,
        currentLevel: progressionData.currentLevel ?? null,
        lastUpdated: progressionData.lastUpdated ?? null,
        confidence: bundle.skillProgressions.meta.confidence,
      }
      truth.dataAvailable = true
    }
  }
  
  // 2. EXTRACT RECENT RESPONSE (second precedence)
  if (bundle.trainingResponse?.meta?.available && bundle.trainingResponse.hasEarnedHistory) {
    truth.recentResponse = {
      toleranceSignal: inferToleranceSignal(bundle, family),
      adherencePattern: (bundle.trainingResponse.recentAdherencePattern as any) || 'unknown',
      completionRate: inferCompletionRate(bundle),
      painMarkers: hasRecentPainMarkers(bundle, family),
      confidence: bundle.trainingResponse.meta.confidence,
    }
  }
  
  // 3. EXTRACT HISTORICAL CONTEXT (informational)
  if (bundle.benchmarks?.meta?.available) {
    const historicalLevel = extractHistoricalLevel(bundle, family)
    if (historicalLevel !== null) {
      truth.historicalContext = {
        ...truth.historicalContext,
        priorBestLevel: historicalLevel,
        confidence: bundle.benchmarks.meta.confidence,
      }
    }
  }
  
  // 4. RESOLVE WITH STRICT PRECEDENCE
  truth.resolved = resolveWithPrecedence(truth)
  truth.overallConfidence = computeOverallConfidence(truth)
  
  return truth
}

/**
 * Resolve pattern-specific response data
 */
export function resolvePatternResponse(
  bundle: ProgrammingTruthBundle | null,
  pattern: string
): PatternResponse {
  const defaultResponse: PatternResponse = {
    pattern,
    recentTolerance: 'unknown',
    volumeTolerance: null,
    intensityTolerance: null,
    completionRate: null,
    lastSessionQuality: 'unknown',
    painOrDiscomfortReported: false,
    recoveryAdequate: true,
    recommendedAction: 'maintain',
    dosageModifier: 0,
    intensityModifier: 0,
    restModifier: 0,
    confidence: 'none',
  }
  
  if (!bundle) {
    return defaultResponse
  }
  
  const response = { ...defaultResponse }
  const affectedFamilies = PATTERN_TO_FAMILIES[pattern] || []
  
  // Check envelope data for pattern-specific tolerance
  if (bundle.performanceEnvelopes?.meta?.available) {
    const envelope = bundle.performanceEnvelopes.byMovementFamily[pattern]
    if (envelope) {
      response.volumeTolerance = envelope.confidenceScore
      response.intensityTolerance = envelope.confidenceScore
      
      // Determine tolerance signal from envelope
      if (envelope.performanceTrend === 'declining') {
        response.recentTolerance = 'poor'
      } else if (envelope.performanceTrend === 'improving') {
        response.recentTolerance = 'good'
      } else if (envelope.confidenceScore && envelope.confidenceScore > 0.6) {
        response.recentTolerance = 'moderate'
      }
      
      response.confidence = bundle.performanceEnvelopes.meta.confidence
    }
  }
  
  // Check constraint history for pattern-specific issues
  if (bundle.constraintHistory?.meta?.available) {
    const constraints = bundle.constraintHistory.recentConstraintPatterns || []
    const hasPatternConstraint = constraints.some(c => 
      c.toLowerCase().includes(pattern.replace(/_/g, ' ')) ||
      affectedFamilies.some(f => c.toLowerCase().includes(f.replace(/_/g, ' ')))
    )
    
    if (hasPatternConstraint) {
      response.painOrDiscomfortReported = true
      response.recentTolerance = 'poor'
    }
  }
  
  // Check training response for completion/adherence signals
  if (bundle.trainingResponse?.meta?.available) {
    const adherence = bundle.trainingResponse.recentAdherencePattern
    if (adherence === 'declining' || adherence === 'sporadic') {
      response.lastSessionQuality = 'partial'
      response.recoveryAdequate = false
    } else if (adherence === 'consistent') {
      response.lastSessionQuality = 'completed'
    }
  }
  
  // Determine recommended action based on signals
  response.recommendedAction = determinePatternAction(response)
  
  // Set prescription modifiers based on action
  switch (response.recommendedAction) {
    case 'soften':
      response.dosageModifier = -1
      response.intensityModifier = -0.5
      response.restModifier = 15
      break
    case 'substitute':
      response.dosageModifier = -2
      response.intensityModifier = -1
      response.restModifier = 30
      break
    case 'push':
      response.dosageModifier = 1
      response.intensityModifier = 0.5
      response.restModifier = -15
      break
    default:
      // maintain - no changes
      break
  }
  
  return response
}

/**
 * Get smart substitution recommendation
 */
export function getSubstitutionRecommendation(
  bundle: ProgrammingTruthBundle | null,
  originalPattern: string,
  skillFamily: SkillFamily
): SubstitutionRecommendation {
  const defaultRec: SubstitutionRecommendation = {
    originalPattern,
    reason: 'poor_response',
    shouldSubstitute: false,
    substitutePreference: [],
    intensityReduction: 0,
    leverageReduction: 'none',
    confidence: 'none',
  }
  
  if (!bundle) {
    return defaultRec
  }
  
  const rec = { ...defaultRec }
  
  // Check constraint history
  const hasConstraint = bundle.constraintHistory?.activeJointRiskFlags?.some(flag => {
    const affectedPatterns = getConstraintAffectedPatterns(flag)
    return affectedPatterns.includes(originalPattern) || 
           affectedPatterns.includes(skillFamily)
  }) || false
  
  if (hasConstraint) {
    rec.reason = 'constraint'
    rec.shouldSubstitute = true
    rec.leverageReduction = 'significant'
    rec.intensityReduction = 20
    rec.confidence = bundle.constraintHistory?.meta?.confidence || 'low'
  }
  
  // Check recent response
  const patternResponse = resolvePatternResponse(bundle, originalPattern)
  if (patternResponse.recentTolerance === 'poor' || patternResponse.painOrDiscomfortReported) {
    rec.reason = rec.shouldSubstitute ? rec.reason : 'poor_response'
    rec.shouldSubstitute = true
    rec.leverageReduction = rec.leverageReduction === 'significant' ? 'significant' : 'slight'
    rec.intensityReduction = Math.max(rec.intensityReduction, 15)
    rec.confidence = patternResponse.confidence
  }
  
  // Build substitute preferences based on family
  if (rec.shouldSubstitute) {
    rec.substitutePreference = getSaferAlternatives(skillFamily, rec.leverageReduction)
  }
  
  return rec
}

/**
 * Build skill-family-specific ranking modifiers
 */
export function buildSkillFamilyRankingModifiers(
  bundle: ProgrammingTruthBundle | null,
  targetSkills: string[]
): Map<SkillFamily, number> {
  const modifiers = new Map<SkillFamily, number>()
  
  if (!bundle) {
    return modifiers
  }
  
  for (const skill of targetSkills) {
    const truth = resolveSkillFamilyTruth(bundle, skill)
    if (truth.dataAvailable) {
      modifiers.set(truth.family, truth.resolved.rankingModifier)
    }
  }
  
  return modifiers
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * [RUNTIME-HARDENING] Maps a skill to its family with safe input handling
 * Accepts unknown input types and returns 'unknown' for malformed/missing values
 */
function mapSkillToFamily(skill: unknown): SkillFamily {
  // [RUNTIME-HARDENING] Guard against null, undefined, non-string, empty string
  if (skill === null || skill === undefined) {
    return 'unknown'
  }
  
  if (typeof skill !== 'string') {
    // Log malformed input for debugging (but don't throw)
    console.log('[effective-selection-shape-audit]', {
      exerciseName: 'unknown',
      rawSkillType: typeof skill,
      isArray: Array.isArray(skill),
      constructorName: skill?.constructor?.name || 'unknown',
      fallbackApplied: true,
      verdict: 'MALFORMED_SKILL_INPUT_SAFE_FALLBACK',
    })
    return 'unknown'
  }
  
  if (skill.trim() === '') {
    return 'unknown'
  }
  
  const normalized = skill.toLowerCase().replace(/[-\s]/g, '_')
  return SKILL_TO_FAMILY[normalized] || SKILL_TO_FAMILY[skill] || 'unknown'
}

function inferToleranceSignal(
  bundle: ProgrammingTruthBundle,
  family: SkillFamily
): 'good' | 'moderate' | 'poor' | 'unknown' {
  // Check envelope for family-related patterns
  const envelopes = bundle.performanceEnvelopes?.byMovementFamily || {}
  const relatedPatterns = Object.entries(PATTERN_TO_FAMILIES)
    .filter(([_, families]) => families.includes(family))
    .map(([pattern]) => pattern)
  
  for (const pattern of relatedPatterns) {
    const envelope = envelopes[pattern]
    if (envelope?.performanceTrend) {
      if (envelope.performanceTrend === 'declining') return 'poor'
      if (envelope.performanceTrend === 'improving') return 'good'
      if (envelope.performanceTrend === 'stable') return 'moderate'
    }
  }
  
  // Fall back to adherence pattern
  const adherence = bundle.trainingResponse?.recentAdherencePattern
  if (adherence === 'declining' || adherence === 'sporadic') return 'poor'
  if (adherence === 'consistent') return 'good'
  if (adherence === 'improving') return 'moderate'
  
  return 'unknown'
}

function inferCompletionRate(bundle: ProgrammingTruthBundle): number | null {
  // Infer from consistency signal
  const consistency = bundle.trainingResponse?.consistencySignal
  if (consistency === 'high') return 0.9
  if (consistency === 'medium') return 0.7
  if (consistency === 'low') return 0.5
  return null
}

function hasRecentPainMarkers(bundle: ProgrammingTruthBundle, family: SkillFamily): boolean {
  const constraints = bundle.constraintHistory?.recentConstraintPatterns || []
  const familyStr = family.replace(/_/g, ' ')
  return constraints.some(c => c.toLowerCase().includes(familyStr) || c.toLowerCase().includes('pain'))
}

function extractHistoricalLevel(bundle: ProgrammingTruthBundle, family: SkillFamily): number | null {
  const benchmarks = bundle.benchmarks
  if (!benchmarks?.meta?.available) return null
  
  // Map family to benchmark field
  switch (family) {
    case 'front_lever':
      return benchmarks.skills.frontLeverHoldSeconds
    case 'planche':
      return benchmarks.skills.plancheHoldSeconds
    case 'l_sit':
      return benchmarks.skills.lSitHoldSeconds
    case 'v_sit':
      return benchmarks.skills.vSitHoldSeconds
    case 'weighted_pull':
      return benchmarks.strength.weightedPullUpLoad
    case 'weighted_dip':
      return benchmarks.strength.weightedDipLoad
    default:
      return null
  }
}

function resolveWithPrecedence(truth: SkillFamilyTruth): SkillFamilyTruth['resolved'] {
  // PRECEDENCE: CURRENT > RESPONSE > HISTORICAL > DEFAULT
  
  // Check current earned state first (highest precedence)
  if (truth.currentEarnedState.progressScore !== null) {
    const score = truth.currentEarnedState.progressScore
    
    // Strong current state signals
    if (score < 0.25) {
      return {
        rankingModifier: -20,
        progressionDepth: 'conservative',
        prescriptionBias: 'soften',
        substitutePreference: 'prefer_safer',
        precedenceUsed: 'current',
        resolutionReason: `low_current_progress_score_${score.toFixed(2)}`,
      }
    }
    if (score < 0.4) {
      return {
        rankingModifier: -10,
        progressionDepth: 'conservative',
        prescriptionBias: 'maintain',
        substitutePreference: 'prefer_safer',
        precedenceUsed: 'current',
        resolutionReason: `moderate_low_progress_score_${score.toFixed(2)}`,
      }
    }
    if (score > 0.8) {
      return {
        rankingModifier: 15,
        progressionDepth: 'progressive',
        prescriptionBias: 'push',
        substitutePreference: 'allow_challenging',
        precedenceUsed: 'current',
        resolutionReason: `high_current_progress_score_${score.toFixed(2)}`,
      }
    }
    if (score > 0.6) {
      return {
        rankingModifier: 5,
        progressionDepth: 'moderate',
        prescriptionBias: 'maintain',
        substitutePreference: 'normal',
        precedenceUsed: 'current',
        resolutionReason: `good_current_progress_score_${score.toFixed(2)}`,
      }
    }
    
    // Mid-range current state
    return {
      rankingModifier: 0,
      progressionDepth: 'moderate',
      prescriptionBias: 'maintain',
      substitutePreference: 'normal',
      precedenceUsed: 'current',
      resolutionReason: `mid_range_progress_score_${score.toFixed(2)}`,
    }
  }
  
  // Check recent response (second precedence)
  if (truth.recentResponse.toleranceSignal !== 'unknown') {
    if (truth.recentResponse.toleranceSignal === 'poor' || truth.recentResponse.painMarkers) {
      return {
        rankingModifier: -15,
        progressionDepth: 'conservative',
        prescriptionBias: 'soften',
        substitutePreference: 'prefer_safer',
        precedenceUsed: 'response',
        resolutionReason: `poor_recent_response_or_pain_markers`,
      }
    }
    if (truth.recentResponse.toleranceSignal === 'good' && 
        truth.recentResponse.adherencePattern === 'consistent') {
      return {
        rankingModifier: 10,
        progressionDepth: 'moderate',
        prescriptionBias: 'maintain',
        substitutePreference: 'normal',
        precedenceUsed: 'response',
        resolutionReason: `good_tolerance_consistent_adherence`,
      }
    }
  }
  
  // Historical context (informational only - don't let it override current/response)
  // We explicitly DO NOT let historical ceiling drive aggressive selection
  // if current state is unknown
  
  return {
    rankingModifier: 0,
    progressionDepth: 'moderate',
    prescriptionBias: 'maintain',
    substitutePreference: 'normal',
    precedenceUsed: 'default',
    resolutionReason: 'no_current_or_response_data_using_defaults',
  }
}

function computeOverallConfidence(truth: SkillFamilyTruth): TruthConfidence {
  const confidences = [
    truth.currentEarnedState.confidence,
    truth.recentResponse.confidence,
    truth.historicalContext.confidence,
  ].filter(c => c !== 'none')
  
  if (confidences.length === 0) return 'none'
  if (confidences.includes('high')) return 'high'
  if (confidences.includes('medium')) return 'medium'
  return 'low'
}

function determinePatternAction(response: PatternResponse): 'push' | 'maintain' | 'soften' | 'substitute' {
  if (response.painOrDiscomfortReported) return 'substitute'
  if (response.recentTolerance === 'poor') return 'soften'
  if (response.recentTolerance === 'good' && 
      response.recoveryAdequate && 
      response.lastSessionQuality === 'completed') {
    return 'push'
  }
  return 'maintain'
}

function getConstraintAffectedPatterns(constraintFlag: string): string[] {
  const flag = constraintFlag.toLowerCase()
  
  if (flag.includes('shoulder')) {
    return ['vertical_push', 'horizontal_push', 'front_lever', 'planche', 'handstand', 'hspu']
  }
  if (flag.includes('wrist')) {
    return ['handstand', 'planche', 'hspu', 'front_support']
  }
  if (flag.includes('elbow')) {
    return ['straight_arm_press', 'planche', 'front_lever', 'back_lever']
  }
  if (flag.includes('lower_back') || flag.includes('spine')) {
    return ['back_lever', 'compression', 'l_sit', 'v_sit']
  }
  
  return []
}

function getSaferAlternatives(family: SkillFamily, leverageReduction: 'none' | 'slight' | 'significant'): string[] {
  const alternatives: Record<SkillFamily, { slight: string[]; significant: string[] }> = {
    'front_lever': {
      slight: ['tuck_front_lever_hold', 'front_lever_row_tuck', 'inverted_row'],
      significant: ['inverted_row', 'ring_row', 'horizontal_pull'],
    },
    'planche': {
      slight: ['tuck_planche_hold', 'planche_lean', 'pseudo_planche_pushup'],
      significant: ['planche_lean', 'pike_pushup', 'elevated_pushup'],
    },
    'hspu': {
      slight: ['pike_pushup', 'wall_hspu_negative', 'box_pike_pushup'],
      significant: ['pike_pushup', 'decline_pushup', 'overhead_press'],
    },
    'handstand': {
      slight: ['wall_handstand', 'chest_to_wall_hold', 'pike_hold'],
      significant: ['pike_hold', 'elevated_pike', 'shoulder_tap_plank'],
    },
    'muscle_up': {
      slight: ['high_pull', 'chest_to_bar', 'transition_negative'],
      significant: ['pull_up', 'straight_bar_dip', 'jumping_muscle_up'],
    },
    'weighted_pull': {
      slight: ['bodyweight_pull', 'reduced_weight_pull', 'band_assisted'],
      significant: ['band_assisted_pull', 'inverted_row', 'lat_pulldown'],
    },
    'weighted_dip': {
      slight: ['bodyweight_dip', 'reduced_weight_dip', 'bench_dip'],
      significant: ['bench_dip', 'pushup', 'close_grip_pushup'],
    },
    'l_sit': {
      slight: ['tuck_l_sit', 'one_leg_l_sit', 'supported_l_sit'],
      significant: ['supported_l_sit', 'knee_raise_hold', 'plank'],
    },
    'v_sit': {
      slight: ['l_sit', 'straddle_l_sit', 'pike_compression'],
      significant: ['l_sit', 'tuck_l_sit', 'compression_hold'],
    },
    'back_lever': {
      slight: ['tuck_back_lever', 'german_hang', 'skin_the_cat'],
      significant: ['german_hang', 'support_hold', 'ring_row'],
    },
    'compression': {
      slight: ['seated_pike', 'standing_pike', 'pancake_stretch'],
      significant: ['seated_pike', 'forward_fold', 'pigeon'],
    },
    'rings_strength': {
      slight: ['ring_support', 'ring_turn_out', 'false_grip_hang'],
      significant: ['ring_support', 'ring_row', 'ring_pushup'],
    },
    'general_pull': {
      slight: ['pull_up', 'chin_up', 'inverted_row'],
      significant: ['inverted_row', 'band_assisted', 'lat_pulldown'],
    },
    'general_push': {
      slight: ['pushup', 'dip', 'pike_pushup'],
      significant: ['incline_pushup', 'wall_pushup', 'knee_pushup'],
    },
    'unknown': {
      slight: [],
      significant: [],
    },
  }
  
  const familyAlts = alternatives[family] || alternatives['unknown']
  return leverageReduction === 'significant' ? familyAlts.significant : familyAlts.slight
}

// =============================================================================
// EXPORTS FOR BRIDGE INTEGRATION
// =============================================================================

export { mapSkillToFamily, SKILL_TO_FAMILY, PATTERN_TO_FAMILIES }
