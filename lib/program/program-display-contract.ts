/**
 * PROGRAM DISPLAY CONTRACT
 * 
 * =============================================================================
 * CANONICAL READ-ONLY VIEW MODEL FOR PROGRAM PAGE INTELLIGENCE SURFACES
 * =============================================================================
 * 
 * This module assembles display-ready intelligence from existing program truth
 * sources WITHOUT modifying builder logic or creating parallel truth paths.
 * 
 * SOURCES:
 * - program.dominantSpineResolution (training spine, style mode, density rules)
 * - program.summaryTruth (headline skills, hybrid summary)
 * - program.weeklyRepresentation (skill exposure policies)
 * - program.flexibleFrequencyRootCause (schedule decision rationale)
 * - program.plannerTruthAudit (generation truth audit)
 * - program.constraintInsight (protected constraints)
 * 
 * RULE: Read-only extraction, no fabrication. If truth is missing, say so.
 */

import type { AdaptiveProgram } from '@/lib/adaptive-program-builder'

// =============================================================================
// TYPES
// =============================================================================

export interface TrainingSpineDisplay {
  /** Primary training spine label e.g. "Skill-Strength Spine" */
  label: string
  /** Primary style mode e.g. "skill_first", "strength_first", "hybrid" */
  styleMode: string
  /** Secondary influences present */
  secondaryInfluences: string[]
  /** Whether density work is allowed */
  densityAllowed: boolean
  /** Short rationale for spine selection */
  rationale: string | null
  /** Source: 'dominantSpineResolution' | 'inferred' | 'unavailable' */
  source: string
}

export interface PlanEmphasisDisplay {
  /** Primary emphasis items e.g. ["straight-arm pushing priority", "front lever maintenance"] */
  items: string[]
  /** Source of emphasis data */
  source: string
}

export interface ProtectedConstraintDisplay {
  /** Constraint label e.g. "Recovery-protected straight-arm load" */
  label: string
  /** Why this constraint matters */
  reason: string
  /** Severity: 'protective' | 'limiting' | 'structural' */
  type: 'protective' | 'limiting' | 'structural'
}

export interface TradeoffDisplay {
  /** What was prioritized */
  prioritized: string
  /** What was limited/reduced */
  limited: string
  /** Brief explanation */
  reason: string
}

export interface WeekDriverDisplay {
  /** Main driver label e.g. "6-session flexible week" */
  label: string
  /** Why this schedule was chosen */
  reason: string
  /** Source of schedule decision */
  source: string
}

export interface SecondarySkillHandlingDisplay {
  /** How secondary skills are being handled */
  strategy: string
  /** Which skills are secondary */
  skills: string[]
  /** Exposure level: 'support_rotation' | 'direct_secondary' | 'deferred' */
  exposureLevel: string
}

export interface ProgramIntelligenceContract {
  /** Program ID for verification */
  programId: string
  
  /** Primary training spine */
  trainingSpine: TrainingSpineDisplay
  
  /** Plan emphasis items */
  planEmphasis: PlanEmphasisDisplay
  
  /** Protected constraints */
  protectedConstraints: ProtectedConstraintDisplay[]
  
  /** Tradeoffs made */
  tradeoffs: TradeoffDisplay[]
  
  /** This week's driver */
  weekDriver: WeekDriverDisplay
  
  /** Secondary skill handling */
  secondarySkillHandling: SecondarySkillHandlingDisplay
  
  /** Enhanced plan explanation (specific, not generic) */
  planExplanation: {
    headline: string
    details: string[]
    source: string
  }
  
  /** Contract quality */
  quality: {
    truthFieldsAvailable: number
    truthFieldsTotal: number
    confidence: 'high' | 'moderate' | 'low'
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function formatSkillName(skill: string): string {
  return skill
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

function inferSpineLabelFromGoals(primary: string, secondary: string | null, styleMode: string): string {
  const primaryFormatted = formatSkillName(primary)
  
  if (styleMode === 'skill_first' || styleMode === 'skill_progression') {
    return `${primaryFormatted}-First Skill Spine`
  }
  if (styleMode === 'strength_first' || styleMode === 'strength_endurance') {
    return `Strength-Support ${primaryFormatted} Spine`
  }
  if (styleMode === 'hybrid') {
    return `Hybrid ${primaryFormatted} Spine`
  }
  return `${primaryFormatted} Training Spine`
}

// =============================================================================
// MAIN EXTRACTION FUNCTION
// =============================================================================

export function buildProgramIntelligenceContract(
  program: AdaptiveProgram
): ProgramIntelligenceContract {
  // Type assertions for optional fields
  const dominantSpine = (program as unknown as { dominantSpineResolution?: {
    primarySpine: string
    primaryStyleMode: string
    secondaryInfluences?: Array<{ influence: string }>
    densityIntegration?: { allowed: boolean; maxSessionsPerWeek?: number }
    spineRationale?: string
    hasAllStylesSelected?: boolean
  } }).dominantSpineResolution
  
  const summaryTruth = (program as unknown as { summaryTruth?: {
    truthfulHybridSummary?: string
    headlineFocusSkills?: string[]
    weekRepresentedSkills?: string[]
    weekSupportSkills?: string[]
  } }).summaryTruth
  
  const weeklyRep = (program as unknown as { weeklyRepresentation?: {
    policies?: Array<{
      skill: string
      representationVerdict: string
      actualExposure?: { direct: number; support: number; total: number }
    }>
    coverageRatio?: number
  } }).weeklyRepresentation
  
  const flexibleRootCause = (program as unknown as { flexibleFrequencyRootCause?: {
    finalReasonCategory?: string
    humanReadableReason?: string
    staticDaysSelected?: number
  } }).flexibleFrequencyRootCause
  
  const constraintInsight = program.constraintInsight || { hasInsight: false, label: '' }
  const trainingPathType = (program as unknown as { trainingPathType?: string }).trainingPathType
  const scheduleMode = program.scheduleMode
  const trainingDaysPerWeek = (program as unknown as { trainingDaysPerWeek?: number }).trainingDaysPerWeek
  const sessionCount = program.sessions?.length || 0
  
  let truthFieldsAvailable = 0
  const truthFieldsTotal = 6
  
  // ==========================================================================
  // 1. TRAINING SPINE
  // ==========================================================================
  let trainingSpine: TrainingSpineDisplay
  
  if (dominantSpine?.primarySpine) {
    truthFieldsAvailable++
    trainingSpine = {
      label: dominantSpine.primarySpine
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase()) + ' Spine',
      styleMode: dominantSpine.primaryStyleMode || 'balanced',
      secondaryInfluences: dominantSpine.secondaryInfluences?.map(s => s.influence) || [],
      densityAllowed: dominantSpine.densityIntegration?.allowed ?? true,
      rationale: dominantSpine.spineRationale || null,
      source: 'dominantSpineResolution',
    }
  } else {
    // Infer from goals
    trainingSpine = {
      label: inferSpineLabelFromGoals(
        program.primaryGoal,
        program.secondaryGoal || null,
        trainingPathType || 'balanced'
      ),
      styleMode: trainingPathType || 'balanced',
      secondaryInfluences: [],
      densityAllowed: true,
      rationale: null,
      source: 'inferred',
    }
  }
  
  // ==========================================================================
  // 2. PLAN EMPHASIS
  // ==========================================================================
  const emphasisItems: string[] = []
  
  // Add primary goal emphasis
  if (program.primaryGoal) {
    emphasisItems.push(`${formatSkillName(program.primaryGoal)} priority`)
  }
  
  // Add secondary goal if present
  if (program.secondaryGoal) {
    emphasisItems.push(`${formatSkillName(program.secondaryGoal)} maintenance`)
  }
  
  // Add density info if limited
  if (dominantSpine?.densityIntegration && !dominantSpine.densityIntegration.allowed) {
    emphasisItems.push('Quality-first (density limited)')
  }
  
  // Add style mode insight
  if (trainingPathType === 'skill_progression') {
    emphasisItems.push('Skill-acquisition focused')
  } else if (trainingPathType === 'strength_endurance') {
    emphasisItems.push('Strength-building focused')
  } else if (trainingPathType === 'hybrid') {
    emphasisItems.push('Hybrid skill-strength balance')
  }
  
  // Add recovery insight if available
  const recoveryLevel = (program as unknown as { recoveryQuality?: string }).recoveryQuality
  if (recoveryLevel === 'low') {
    emphasisItems.push('Recovery-protected volume')
  }
  
  if (emphasisItems.length > 0) truthFieldsAvailable++
  
  const planEmphasis: PlanEmphasisDisplay = {
    items: emphasisItems.length > 0 ? emphasisItems : ['Balanced training emphasis'],
    source: emphasisItems.length > 0 ? 'program_fields' : 'default',
  }
  
  // ==========================================================================
  // 3. PROTECTED CONSTRAINTS
  // ==========================================================================
  const protectedConstraints: ProtectedConstraintDisplay[] = []
  
  // Constraint insight
  if (constraintInsight.hasInsight && constraintInsight.label) {
    protectedConstraints.push({
      label: constraintInsight.label,
      reason: 'Profile-based constraint',
      type: 'protective',
    })
  }
  
  // Joint cautions
  const jointCautions = (program as unknown as { jointCautions?: string[] }).jointCautions
  if (jointCautions && jointCautions.length > 0) {
    protectedConstraints.push({
      label: `Joint protection: ${jointCautions.join(', ')}`,
      reason: 'Exercise selection adjusted for joint health',
      type: 'protective',
    })
  }
  
  // Straight-arm protection (inferred from skills)
  const hasStraightArmSkill = [program.primaryGoal, program.secondaryGoal]
    .filter(Boolean)
    .some(s => ['planche', 'front_lever', 'back_lever', 'iron_cross'].includes(s || ''))
  
  if (hasStraightArmSkill) {
    protectedConstraints.push({
      label: 'Straight-arm tissue protection',
      reason: 'Connective tissue recovery prioritized',
      type: 'protective',
    })
  }
  
  // Schedule constraint
  if (scheduleMode === 'static' && trainingDaysPerWeek) {
    protectedConstraints.push({
      label: `Fixed ${trainingDaysPerWeek}-day schedule`,
      reason: 'Consistent weekly structure maintained',
      type: 'structural',
    })
  }
  
  if (protectedConstraints.length > 0) truthFieldsAvailable++
  
  // ==========================================================================
  // 4. TRADEOFFS
  // ==========================================================================
  const tradeoffs: TradeoffDisplay[] = []
  
  // Skill prioritization tradeoff
  const selectedSkills = (program as unknown as { selectedSkills?: string[] }).selectedSkills || []
  const representedSkills = (program as unknown as { representedSkills?: string[] }).representedSkills || []
  const deferredSkills = selectedSkills.filter(s => !representedSkills.includes(s))
  
  if (deferredSkills.length > 0 && selectedSkills.length > 2) {
    tradeoffs.push({
      prioritized: `${formatSkillName(program.primaryGoal)} frequency`,
      limited: `${deferredSkills.map(formatSkillName).join(', ')} exposure`,
      reason: 'Concentrated primary skill work for faster progress',
    })
  }
  
  // Density tradeoff
  if (dominantSpine?.densityIntegration && !dominantSpine.densityIntegration.allowed) {
    tradeoffs.push({
      prioritized: 'Skill quality and technique',
      limited: 'Density/conditioning volume',
      reason: 'Technical precision requires fresh nervous system',
    })
  }
  
  // Session count tradeoff
  if (scheduleMode === 'flexible' && sessionCount > 4) {
    tradeoffs.push({
      prioritized: 'Higher training frequency',
      limited: 'Per-session volume',
      reason: 'More frequent practice with manageable session load',
    })
  }
  
  if (tradeoffs.length > 0) truthFieldsAvailable++
  
  // ==========================================================================
  // 5. WEEK DRIVER
  // ==========================================================================
  let weekDriver: WeekDriverDisplay
  
  if (flexibleRootCause?.humanReadableReason) {
    truthFieldsAvailable++
    weekDriver = {
      label: scheduleMode === 'flexible' 
        ? `Adaptive ${sessionCount}-session week`
        : `Fixed ${trainingDaysPerWeek}-day week`,
      reason: flexibleRootCause.humanReadableReason,
      source: 'flexibleFrequencyRootCause',
    }
  } else {
    weekDriver = {
      label: scheduleMode === 'flexible'
        ? `Adaptive ${sessionCount}-session week`
        : `${trainingDaysPerWeek || sessionCount} days/week`,
      reason: scheduleMode === 'flexible'
        ? 'Flexible scheduling based on recovery and goals'
        : 'Consistent weekly training structure',
      source: 'inferred',
    }
  }
  
  // ==========================================================================
  // 6. SECONDARY SKILL HANDLING
  // ==========================================================================
  const supportSkills = summaryTruth?.weekSupportSkills || []
  const secondaryGoal = program.secondaryGoal
  
  let secondarySkillHandling: SecondarySkillHandlingDisplay
  
  if (weeklyRep?.policies) {
    truthFieldsAvailable++
    const secondaryPolicies = weeklyRep.policies.filter(p => 
      p.skill !== program.primaryGoal && 
      (p.representationVerdict === 'broadly_represented' || p.representationVerdict === 'support_only')
    )
    
    if (secondaryPolicies.length > 0) {
      const hasDirectSecondary = secondaryPolicies.some(p => 
        p.representationVerdict === 'broadly_represented' && 
        (p.actualExposure?.direct || 0) >= 2
      )
      
      secondarySkillHandling = {
        strategy: hasDirectSecondary
          ? 'Direct secondary exposure with dedicated blocks'
          : 'Support-integrated exposure through accessory work',
        skills: secondaryPolicies.map(p => p.skill),
        exposureLevel: hasDirectSecondary ? 'direct_secondary' : 'support_rotation',
      }
    } else {
      secondarySkillHandling = {
        strategy: 'Focused primary skill concentration',
        skills: [],
        exposureLevel: 'deferred',
      }
    }
  } else {
    secondarySkillHandling = {
      strategy: secondaryGoal 
        ? `${formatSkillName(secondaryGoal)} maintained as secondary focus`
        : 'Single-skill concentration',
      skills: secondaryGoal ? [secondaryGoal] : [],
      exposureLevel: secondaryGoal ? 'direct_secondary' : 'deferred',
    }
  }
  
  // ==========================================================================
  // 7. ENHANCED PLAN EXPLANATION
  // ==========================================================================
  const explanationDetails: string[] = []
  
  // Add spine context
  explanationDetails.push(
    `Built on a ${trainingSpine.label.toLowerCase()} prioritizing ${formatSkillName(program.primaryGoal)}.`
  )
  
  // Add schedule context
  if (scheduleMode === 'flexible') {
    explanationDetails.push(
      `Adaptive ${sessionCount}-session week allows progress optimization based on recovery.`
    )
  } else {
    explanationDetails.push(
      `Fixed ${trainingDaysPerWeek}-day structure provides consistent training rhythm.`
    )
  }
  
  // Add constraint context
  if (protectedConstraints.length > 0) {
    explanationDetails.push(
      `Protected: ${protectedConstraints.slice(0, 2).map(c => c.label.toLowerCase()).join(', ')}.`
    )
  }
  
  // Add tradeoff context
  if (tradeoffs.length > 0) {
    explanationDetails.push(
      `Tradeoff: ${tradeoffs[0].prioritized.toLowerCase()} over ${tradeoffs[0].limited.toLowerCase()}.`
    )
  }
  
  const planExplanation = {
    headline: summaryTruth?.truthfulHybridSummary?.split('.')[0] || 
      `${formatSkillName(program.primaryGoal)}-focused ${trainingPathType || 'balanced'} program`,
    details: explanationDetails,
    source: summaryTruth?.truthfulHybridSummary ? 'summaryTruth' : 'constructed',
  }
  
  // ==========================================================================
  // BUILD CONTRACT
  // ==========================================================================
  const confidence: 'high' | 'moderate' | 'low' = 
    truthFieldsAvailable >= 5 ? 'high' :
    truthFieldsAvailable >= 3 ? 'moderate' : 'low'
  
  return {
    programId: program.id,
    trainingSpine,
    planEmphasis,
    protectedConstraints,
    tradeoffs,
    weekDriver,
    secondarySkillHandling,
    planExplanation,
    quality: {
      truthFieldsAvailable,
      truthFieldsTotal,
      confidence,
    },
  }
}
