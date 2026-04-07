/**
 * SKILL MATERIALITY SCORE
 * 
 * PURPOSE:
 * Single canonical scoring system for skill materiality ranking.
 * This consumes the doctrine influence contract to make materiality decisions
 * grounded in real truth rather than generic defaults.
 * 
 * OWNERSHIP RULES:
 * - This is the SINGLE owner of materiality scoring
 * - It consumes doctrine influence contract for DB-backed influence
 * - It enforces progression realism gating
 * - It produces deterministic ranked outputs with role labels
 * 
 * PHASE: Active Generation Consumption
 * - No longer shadow mode
 * - Actually drives generation decisions
 * - Outputs are consumed by buildMaterialityContract
 */

import type { DoctrineInfluenceContract } from '../doctrine/doctrine-influence-contract'

// =============================================================================
// TYPES
// =============================================================================

export type MaterialityRole = 
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'support'
  | 'optional_exposure'
  | 'suppressed'

export type SupportCategory =
  | 'direct_support'       // Directly supports primary/secondary skill
  | 'structural_support'   // Provides structural base (e.g., core for handstands)
  | 'rotational_support'   // Rotated through sessions for maintenance
  | 'exposure_only'        // Minimal exposure, no dedicated time

export interface MaterialityScoreInput {
  skill: string
  primaryGoal: string | null
  secondaryGoal: string | null
  selectedSkills: string[]
  currentWorkingProgression: string | null
  historicalCeiling: string | null
  progressionTruthSource: string | null
  allocatedSessions: number
  jointCautions: string[]
  equipmentAvailable: string[]
  experienceLevel: string | null
  targetFrequency: number
  doctrineInfluence: DoctrineInfluenceContract | null
}

export interface MaterialityScoreResult {
  skill: string
  finalMaterialityScore: number
  role: MaterialityRole
  supportCategory: SupportCategory | null
  explanationTags: string[]
  realismAdjustments: RealismAdjustment[]
  dbInfluenceApplied: boolean
  fallbackUsed: boolean
  scoreBreakdown: {
    primaryGoalWeight: number
    secondaryGoalWeight: number
    selectedSkillRelevance: number
    carryoverValue: number
    supportValue: number
    progressionRealism: number
    currentAbilityAlignment: number
    jointCautionRisk: number
    scheduleRealism: number
    doctrineInfluence: number
    complexityBudget: number
  }
}

export interface RealismAdjustment {
  type: 'progression_ceiling' | 'current_ability_gap' | 'joint_caution' | 'schedule_constraint' | 'experience_mismatch'
  reduction: number
  reason: string
}

export interface MaterialityRankingResult {
  rankedSkills: MaterialityScoreResult[]
  primarySkill: string | null
  secondarySkill: string | null
  supportSkills: string[]
  suppressedSkills: string[]
  auditSummary: MaterialityRankingAudit
}

export interface MaterialityRankingAudit {
  totalSkillsScored: number
  dbInfluenceUsed: boolean
  fallbackDomainsUsed: string[]
  realismGatingApplied: number
  topThreeByScore: Array<{ skill: string; score: number; role: MaterialityRole }>
  suppressedAndWhy: Array<{ skill: string; reason: string }>
  timestamp: string
}

// =============================================================================
// PROGRESSION REALISM CONSTANTS
// =============================================================================

/**
 * Progression difficulty tiers for realism gating.
 * Lower tier = more beginner-friendly, higher tier = more advanced.
 */
const PROGRESSION_DIFFICULTY_TIERS: Record<string, number> = {
  // Handstand progressions
  'wall_handstand': 1,
  'chest_to_wall': 2,
  'back_to_wall': 3,
  'freestanding_hold': 5,
  'handstand_walk': 6,
  'press_to_handstand': 8,
  'one_arm_handstand': 10,
  
  // Pull-up progressions
  'dead_hang': 1,
  'active_hang': 2,
  'scapular_pulls': 2,
  'australian_rows': 3,
  'negative_pullups': 4,
  'pullup': 5,
  'weighted_pullup': 7,
  'muscle_up': 8,
  'one_arm_pullup': 10,
  
  // Push-up progressions
  'wall_pushup': 1,
  'incline_pushup': 2,
  'knee_pushup': 2,
  'pushup': 3,
  'diamond_pushup': 4,
  'archer_pushup': 5,
  'pseudo_planche_pushup': 6,
  'one_arm_pushup': 8,
  
  // Dip progressions
  'bench_dips': 2,
  'parallel_bar_support': 3,
  'negative_dips': 4,
  'dips': 5,
  'weighted_dips': 7,
  'ring_dips': 7,
  
  // Front lever progressions
  'dead_hang': 1,
  'tuck_front_lever': 4,
  'advanced_tuck_front_lever': 5,
  'straddle_front_lever': 7,
  'full_front_lever': 9,
  
  // Back lever progressions
  'skin_the_cat': 3,
  'german_hang': 4,
  'tuck_back_lever': 5,
  'straddle_back_lever': 7,
  'full_back_lever': 8,
  
  // Planche progressions
  'plank': 2,
  'pseudo_planche_lean': 4,
  'tuck_planche': 6,
  'advanced_tuck_planche': 7,
  'straddle_planche': 9,
  'full_planche': 10,
  
  // L-sit progressions
  'tucked_l_sit': 3,
  'one_leg_l_sit': 4,
  'l_sit': 5,
  'v_sit': 7,
  'manna': 10,
}

/**
 * Experience level multipliers for progression realism.
 */
const EXPERIENCE_REALISM_MULTIPLIERS: Record<string, { maxTier: number; progressionPenalty: number }> = {
  'beginner': { maxTier: 4, progressionPenalty: 0.3 },
  'intermediate': { maxTier: 7, progressionPenalty: 0.15 },
  'advanced': { maxTier: 9, progressionPenalty: 0.05 },
  'elite': { maxTier: 10, progressionPenalty: 0 },
}

// =============================================================================
// SUPPORT SKILL CARRYOVER MAPPINGS
// =============================================================================

const SKILL_CARRYOVER_MAP: Record<string, { supports: string[]; carryoverStrength: number }> = {
  'pullup': { supports: ['front_lever', 'muscle_up', 'one_arm_pullup'], carryoverStrength: 0.7 },
  'dip': { supports: ['muscle_up', 'planche', 'ring_dips'], carryoverStrength: 0.6 },
  'pushup': { supports: ['planche', 'handstand_pushup', 'dip'], carryoverStrength: 0.5 },
  'handstand': { supports: ['handstand_pushup', 'press_to_handstand', 'one_arm_handstand'], carryoverStrength: 0.8 },
  'l_sit': { supports: ['v_sit', 'manna', 'press_to_handstand'], carryoverStrength: 0.6 },
  'front_lever': { supports: ['back_lever', 'muscle_up'], carryoverStrength: 0.4 },
  'back_lever': { supports: ['front_lever', 'iron_cross'], carryoverStrength: 0.4 },
  'core': { supports: ['handstand', 'front_lever', 'back_lever', 'l_sit', 'planche'], carryoverStrength: 0.5 },
  'shoulder_mobility': { supports: ['handstand', 'back_lever', 'german_hang'], carryoverStrength: 0.4 },
  'hip_mobility': { supports: ['l_sit', 'front_lever', 'press_to_handstand'], carryoverStrength: 0.3 },
}

// =============================================================================
// SCORING FUNCTIONS
// =============================================================================

/**
 * Computes the materiality score for a single skill.
 * This is the SINGLE authoritative scoring function.
 */
export function computeSkillMaterialityScore(input: MaterialityScoreInput): MaterialityScoreResult {
  const {
    skill,
    primaryGoal,
    secondaryGoal,
    selectedSkills,
    currentWorkingProgression,
    historicalCeiling,
    progressionTruthSource,
    allocatedSessions,
    jointCautions,
    equipmentAvailable,
    experienceLevel,
    targetFrequency,
    doctrineInfluence,
  } = input

  const explanationTags: string[] = []
  const realismAdjustments: RealismAdjustment[] = []
  let dbInfluenceApplied = false
  let fallbackUsed = false

  // ==========================================================================
  // SCORE BREAKDOWN COMPUTATION
  // ==========================================================================

  // 1. Primary goal weight (0-30 points)
  let primaryGoalWeight = 0
  if (skill === primaryGoal) {
    primaryGoalWeight = 30
    explanationTags.push('primary_goal_match')
  } else if (primaryGoal && SKILL_CARRYOVER_MAP[skill]?.supports.includes(primaryGoal)) {
    primaryGoalWeight = 10
    explanationTags.push('supports_primary_goal')
  }

  // 2. Secondary goal weight (0-20 points)
  let secondaryGoalWeight = 0
  if (skill === secondaryGoal) {
    secondaryGoalWeight = 20
    explanationTags.push('secondary_goal_match')
  } else if (secondaryGoal && SKILL_CARRYOVER_MAP[skill]?.supports.includes(secondaryGoal)) {
    secondaryGoalWeight = 8
    explanationTags.push('supports_secondary_goal')
  }

  // 3. Selected skill relevance (0-10 points)
  let selectedSkillRelevance = 0
  if (selectedSkills.includes(skill)) {
    selectedSkillRelevance = 10
    explanationTags.push('user_selected')
  }

  // 4. Carryover value (0-15 points)
  let carryoverValue = 0
  const carryoverInfo = SKILL_CARRYOVER_MAP[skill]
  if (carryoverInfo) {
    const supportedCount = carryoverInfo.supports.filter(s => 
      selectedSkills.includes(s) || s === primaryGoal || s === secondaryGoal
    ).length
    carryoverValue = Math.min(15, supportedCount * 5 * carryoverInfo.carryoverStrength)
    if (carryoverValue > 0) {
      explanationTags.push(`carryover_to_${supportedCount}_skills`)
    }
  }

  // 5. Support value from other skills (0-10 points)
  let supportValue = 0
  for (const otherSkill of selectedSkills) {
    const otherCarryover = SKILL_CARRYOVER_MAP[otherSkill]
    if (otherCarryover?.supports.includes(skill)) {
      supportValue += 3 * otherCarryover.carryoverStrength
    }
  }
  supportValue = Math.min(10, supportValue)
  if (supportValue > 0) {
    explanationTags.push('receives_carryover_support')
  }

  // ==========================================================================
  // PROGRESSION REALISM GATING
  // ==========================================================================

  // 6. Progression realism (0-15 points, can go negative for penalties)
  let progressionRealism = 10 // Base score

  // Use CURRENT working progression, not historical ceiling
  const currentTier = currentWorkingProgression 
    ? PROGRESSION_DIFFICULTY_TIERS[currentWorkingProgression.toLowerCase().replace(/\s+/g, '_')] || 5
    : 3 // Default to intermediate if unknown

  const historicalTier = historicalCeiling
    ? PROGRESSION_DIFFICULTY_TIERS[historicalCeiling.toLowerCase().replace(/\s+/g, '_')] || 5
    : currentTier

  // Check if there's a significant gap between current and historical
  const progressionGap = historicalTier - currentTier
  if (progressionGap >= 3) {
    // Significant detraining detected - apply realism penalty
    const gapPenalty = Math.min(8, progressionGap * 2)
    progressionRealism -= gapPenalty
    realismAdjustments.push({
      type: 'current_ability_gap',
      reduction: gapPenalty,
      reason: `Current ability (tier ${currentTier}) significantly below historical (tier ${historicalTier})`,
    })
    explanationTags.push('realism_gap_penalty')
  }

  // Experience level realism check
  const expRealism = EXPERIENCE_REALISM_MULTIPLIERS[experienceLevel || 'intermediate']
  if (currentTier > expRealism.maxTier) {
    const tierPenalty = (currentTier - expRealism.maxTier) * 3
    progressionRealism -= tierPenalty
    realismAdjustments.push({
      type: 'experience_mismatch',
      reduction: tierPenalty,
      reason: `Progression tier ${currentTier} exceeds ${experienceLevel} max tier ${expRealism.maxTier}`,
    })
    explanationTags.push('experience_mismatch_penalty')
  }

  progressionRealism = Math.max(-5, Math.min(15, progressionRealism))

  // 7. Current ability alignment (0-10 points)
  let currentAbilityAlignment = 5 // Base
  if (progressionTruthSource === 'workout_history') {
    currentAbilityAlignment = 10
    explanationTags.push('verified_progression_history')
  } else if (progressionTruthSource === 'onboarding_assessment') {
    currentAbilityAlignment = 7
    explanationTags.push('onboarding_assessed')
  } else if (!currentWorkingProgression) {
    currentAbilityAlignment = 3
    explanationTags.push('no_progression_truth')
    fallbackUsed = true
  }

  // ==========================================================================
  // JOINT CAUTION RISK
  // ==========================================================================

  // 8. Joint caution risk (0 to -10 points)
  let jointCautionRisk = 0
  const skillJointRisks: Record<string, string[]> = {
    'planche': ['wrist', 'shoulder', 'elbow'],
    'front_lever': ['shoulder', 'elbow'],
    'back_lever': ['shoulder', 'elbow'],
    'handstand': ['wrist', 'shoulder'],
    'muscle_up': ['shoulder', 'elbow', 'wrist'],
    'one_arm_pullup': ['shoulder', 'elbow'],
    'iron_cross': ['shoulder', 'elbow'],
  }

  const skillRisks = skillJointRisks[skill] || []
  const overlappingCautions = skillRisks.filter(r => jointCautions.includes(r))
  if (overlappingCautions.length > 0) {
    jointCautionRisk = -overlappingCautions.length * 4
    realismAdjustments.push({
      type: 'joint_caution',
      reduction: Math.abs(jointCautionRisk),
      reason: `Joint cautions for ${overlappingCautions.join(', ')} affect this skill`,
    })
    explanationTags.push(`joint_caution_${overlappingCautions.join('_')}`)
  }

  // ==========================================================================
  // SCHEDULE REALISM
  // ==========================================================================

  // 9. Schedule realism (0-5 points)
  let scheduleRealism = 3 // Base
  if (allocatedSessions >= 2 && targetFrequency >= 4) {
    scheduleRealism = 5
    explanationTags.push('good_session_budget')
  } else if (allocatedSessions < 1) {
    scheduleRealism = 0
    realismAdjustments.push({
      type: 'schedule_constraint',
      reduction: 3,
      reason: 'No sessions allocated for this skill',
    })
    explanationTags.push('no_session_allocation')
  }

  // ==========================================================================
  // DOCTRINE INFLUENCE (DB FIRST, FALLBACK SECOND)
  // ==========================================================================

  // 10. Doctrine influence (0-10 points)
  let doctrineInfluenceScore = 0
  
  if (doctrineInfluence && !doctrineInfluence.safetyFlags.shadowModeOnly) {
    // Check if DB influenced this domain
    const progressionSource = doctrineInfluence.sourceAttribution.progression
    const methodSource = doctrineInfluence.sourceAttribution.methodSelection
    
    if (progressionSource === 'db' || methodSource === 'db') {
      dbInfluenceApplied = true
      
      // Apply DB-backed doctrine influence
      const mergedInfluence = doctrineInfluence.mergedInfluence
      
      // Check if this skill is emphasized by doctrine
      if (mergedInfluence.movementEmphasis.primarySkillEmphasis.includes(skill)) {
        doctrineInfluenceScore = 10
        explanationTags.push('doctrine_db_primary_emphasis')
      } else if (mergedInfluence.movementEmphasis.secondarySkillEmphasis.includes(skill)) {
        doctrineInfluenceScore = 7
        explanationTags.push('doctrine_db_secondary_emphasis')
      } else if (mergedInfluence.movementEmphasis.carryoverSkills.includes(skill)) {
        doctrineInfluenceScore = 4
        explanationTags.push('doctrine_db_carryover')
      }
      
      // Apply conservative bias if doctrine recommends it
      if (mergedInfluence.progressionPacing.conservativeBias && progressionRealism > 5) {
        progressionRealism -= 2
        explanationTags.push('doctrine_conservative_bias')
      }
    } else {
      // Fallback to code doctrine
      fallbackUsed = true
      doctrineInfluenceScore = 3 // Small base score from code registries
      explanationTags.push('doctrine_code_fallback')
    }
  } else {
    fallbackUsed = true
    doctrineInfluenceScore = 2
    explanationTags.push('doctrine_shadow_mode')
  }

  // ==========================================================================
  // COMPLEXITY BUDGET
  // ==========================================================================

  // 11. Complexity budget (0-5 points based on schedule fit)
  let complexityBudget = 3
  const isHighComplexity = currentTier >= 6
  if (isHighComplexity && targetFrequency < 4) {
    complexityBudget = 1
    explanationTags.push('complexity_budget_constrained')
  } else if (!isHighComplexity && targetFrequency >= 3) {
    complexityBudget = 5
    explanationTags.push('good_complexity_fit')
  }

  // ==========================================================================
  // FINAL SCORE COMPUTATION
  // ==========================================================================

  const scoreBreakdown = {
    primaryGoalWeight,
    secondaryGoalWeight,
    selectedSkillRelevance,
    carryoverValue,
    supportValue,
    progressionRealism,
    currentAbilityAlignment,
    jointCautionRisk,
    scheduleRealism,
    doctrineInfluence: doctrineInfluenceScore,
    complexityBudget,
  }

  const finalMaterialityScore = 
    primaryGoalWeight +
    secondaryGoalWeight +
    selectedSkillRelevance +
    carryoverValue +
    supportValue +
    progressionRealism +
    currentAbilityAlignment +
    jointCautionRisk +
    scheduleRealism +
    doctrineInfluenceScore +
    complexityBudget

  // ==========================================================================
  // ROLE DETERMINATION
  // ==========================================================================

  let role: MaterialityRole
  let supportCategory: SupportCategory | null = null

  if (finalMaterialityScore >= 50 && skill === primaryGoal) {
    role = 'primary'
  } else if (finalMaterialityScore >= 40 && skill === secondaryGoal) {
    role = 'secondary'
  } else if (finalMaterialityScore >= 35 && allocatedSessions >= 2) {
    role = 'tertiary'
  } else if (finalMaterialityScore >= 25 && allocatedSessions >= 1) {
    role = 'support'
    // Determine support category
    if (carryoverValue >= 8) {
      supportCategory = 'direct_support'
      explanationTags.push('direct_support_for_goals')
    } else if (supportValue >= 5) {
      supportCategory = 'structural_support'
      explanationTags.push('structural_base_work')
    } else if (allocatedSessions >= 1) {
      supportCategory = 'rotational_support'
      explanationTags.push('rotational_maintenance')
    } else {
      supportCategory = 'exposure_only'
      explanationTags.push('minimal_exposure')
    }
  } else if (finalMaterialityScore >= 15) {
    role = 'optional_exposure'
    supportCategory = 'exposure_only'
    explanationTags.push('optional_exposure_only')
  } else {
    role = 'suppressed'
    explanationTags.push('suppressed_low_score')
  }

  // Apply realism suppression if too many adjustments
  const totalRealismReduction = realismAdjustments.reduce((sum, adj) => sum + adj.reduction, 0)
  if (totalRealismReduction >= 10 && role !== 'suppressed') {
    role = 'suppressed'
    explanationTags.push('suppressed_realism_gating')
  }

  return {
    skill,
    finalMaterialityScore,
    role,
    supportCategory,
    explanationTags,
    realismAdjustments,
    dbInfluenceApplied,
    fallbackUsed,
    scoreBreakdown,
  }
}

// =============================================================================
// RANKING FUNCTION
// =============================================================================

/**
 * Ranks all candidate skills and produces the canonical materiality ranking.
 * This is the SINGLE owner of materiality ranking in the system.
 */
export function computeCanonicalMaterialityRanking(
  selectedSkills: string[],
  primaryGoal: string | null,
  secondaryGoal: string | null,
  currentWorkingProgressions: Record<string, { currentWorkingProgression: string | null; historicalCeiling: string | null; truthSource?: string }> | null,
  weightedSkillAllocation: Array<{ skill: string; exposureSessions: number }>,
  jointCautions: string[],
  equipmentAvailable: string[],
  experienceLevel: string | null,
  targetFrequency: number,
  doctrineInfluence: DoctrineInfluenceContract | null
): MaterialityRankingResult {
  
  const rankedSkills: MaterialityScoreResult[] = []
  const fallbackDomainsUsed: string[] = []
  let dbInfluenceUsed = false
  let realismGatingApplied = 0

  for (const skill of selectedSkills) {
    const allocation = weightedSkillAllocation.find(a => a.skill === skill)
    const progressionData = currentWorkingProgressions?.[skill.replace(/_/g, '')] ||
                            currentWorkingProgressions?.[skill] || null

    const result = computeSkillMaterialityScore({
      skill,
      primaryGoal,
      secondaryGoal,
      selectedSkills,
      currentWorkingProgression: progressionData?.currentWorkingProgression || null,
      historicalCeiling: progressionData?.historicalCeiling || null,
      progressionTruthSource: (progressionData as { truthSource?: string })?.truthSource || null,
      allocatedSessions: allocation?.exposureSessions || 0,
      jointCautions,
      equipmentAvailable,
      experienceLevel,
      targetFrequency,
      doctrineInfluence,
    })

    rankedSkills.push(result)

    if (result.dbInfluenceApplied) {
      dbInfluenceUsed = true
    }
    if (result.fallbackUsed && !fallbackDomainsUsed.includes('progression')) {
      fallbackDomainsUsed.push('progression')
    }
    if (result.realismAdjustments.length > 0) {
      realismGatingApplied++
    }
  }

  // Sort by score descending
  rankedSkills.sort((a, b) => b.finalMaterialityScore - a.finalMaterialityScore)

  // Extract role assignments
  const primarySkill = rankedSkills.find(r => r.role === 'primary')?.skill || null
  const secondarySkill = rankedSkills.find(r => r.role === 'secondary')?.skill || null
  const supportSkills = rankedSkills
    .filter(r => r.role === 'support' || r.role === 'tertiary')
    .map(r => r.skill)
  const suppressedSkills = rankedSkills
    .filter(r => r.role === 'suppressed' || r.role === 'optional_exposure')
    .map(r => r.skill)

  // Build audit summary
  const auditSummary: MaterialityRankingAudit = {
    totalSkillsScored: rankedSkills.length,
    dbInfluenceUsed,
    fallbackDomainsUsed,
    realismGatingApplied,
    topThreeByScore: rankedSkills.slice(0, 3).map(r => ({
      skill: r.skill,
      score: r.finalMaterialityScore,
      role: r.role,
    })),
    suppressedAndWhy: rankedSkills
      .filter(r => r.role === 'suppressed')
      .map(r => ({
        skill: r.skill,
        reason: r.explanationTags.filter(t => t.includes('suppressed') || t.includes('penalty')).join(', ') || 'low_score',
      })),
    timestamp: new Date().toISOString(),
  }

  console.log('[CANONICAL-MATERIALITY-RANKING]', {
    totalSkills: selectedSkills.length,
    primarySkill,
    secondarySkill,
    supportCount: supportSkills.length,
    suppressedCount: suppressedSkills.length,
    dbInfluenceUsed,
    realismGatingApplied,
    topThree: auditSummary.topThreeByScore,
  })

  return {
    rankedSkills,
    primarySkill,
    secondarySkill,
    supportSkills,
    suppressedSkills,
    auditSummary,
  }
}

/**
 * Maps MaterialityRole to the existing MaterialSkillRole type.
 */
export function mapMaterialityRoleToSkillRole(role: MaterialityRole): 'primary_spine' | 'secondary_anchor' | 'tertiary' | 'support' | 'deferred' {
  switch (role) {
    case 'primary':
      return 'primary_spine'
    case 'secondary':
      return 'secondary_anchor'
    case 'tertiary':
      return 'tertiary'
    case 'support':
      return 'support'
    case 'optional_exposure':
    case 'suppressed':
    default:
      return 'deferred'
  }
}
