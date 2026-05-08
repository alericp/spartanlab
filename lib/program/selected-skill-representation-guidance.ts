/**
 * SELECTED SKILL REPRESENTATION GUIDANCE
 * 
 * W.W8: Makes every selected skill visibly accounted for with honest representation labels.
 * 
 * Truth precedence:
 * 1. weeklyRepresentation.policies (strongest truth)
 * 2. summaryTruth (supporting truth)
 * 3. skill family / carryover logic (explanation support)
 * 
 * States: headline_priority | direct | support | accessory_carryover | underrepresented | unknown
 * 
 * This is display-only — no mutation, no generator changes.
 */

// =============================================================================
// TYPES
// =============================================================================

export type SkillRepresentationState = 
  | 'headline_priority'
  | 'direct'
  | 'support'
  | 'accessory_carryover'
  | 'underrepresented'
  | 'unknown'

export interface SelectedSkillRepresentationDisplay {
  /** The skill identifier */
  skill: string
  /** Human-readable display label */
  label: string
  /** Representation state */
  state: SkillRepresentationState
  /** Short visible badge text (e.g., "Primary", "Direct", "Support") */
  visibleBadge: string
  /** One-sentence explanation of why this skill has this representation */
  explanation: string
  /** Source of truth used for this determination */
  source: 'weekly_representation' | 'summary_truth' | 'headline_identity' | 'skill_family_truth' | 'fallback'
  /** Direct exercise exposure count if available */
  directExposure: number | null
  /** Total exposure count if available */
  totalExposure: number | null
  /** Machine-readable reason code */
  reasonCode: string
}

// =============================================================================
// SKILL FAMILY CARRYOVER EXPLANATIONS
// =============================================================================

/**
 * Maps skills to their carryover/support relationships for explanation generation.
 * These explain WHY a skill receives indirect training.
 */
const SKILL_CARRYOVER_EXPLANATIONS: Record<string, string> = {
  // Front lever receives carryover from horizontal pulling
  'front_lever': 'Horizontal pulling and straight-arm work build front lever foundations.',
  'frontlever': 'Horizontal pulling and straight-arm work build front lever foundations.',
  'fl': 'Horizontal pulling and straight-arm work build front lever foundations.',
  
  // Back lever receives carryover from shoulder extension work
  'back_lever': 'Shoulder extension and rings work support back lever positioning.',
  'backlever': 'Shoulder extension and rings work support back lever positioning.',
  
  // Planche receives carryover from pressing and straight-arm strength
  'planche': 'Straight-arm pressing and scapular strength support planche development.',
  
  // Handstand receives carryover from balance and vertical push
  'handstand': 'Vertical push work and balance drills support handstand practice.',
  'hs': 'Vertical push work and balance drills support handstand practice.',
  
  // HSPU receives carryover from vertical pushing
  'hspu': 'Vertical pressing and handstand work build HSPU capacity.',
  'handstand_pushup': 'Vertical pressing and handstand work build HSPU capacity.',
  
  // Muscle up receives carryover from pulling and dipping
  'muscle_up': 'Pulling strength and dip power combine for muscle-up preparation.',
  'muscleup': 'Pulling strength and dip power combine for muscle-up preparation.',
  
  // L-sit / V-sit receive carryover from compression work
  'l_sit': 'Compression and hip flexor work support L-sit holds.',
  'lsit': 'Compression and hip flexor work support L-sit holds.',
  'v_sit': 'Advanced compression builds toward V-sit positioning.',
  'vsit': 'Advanced compression builds toward V-sit positioning.',
  
  // Weighted movements
  'weighted_pull': 'Pulling volume and intensity build weighted capacity.',
  'weighted_pullup': 'Pulling volume and intensity build weighted capacity.',
  'weighted_dip': 'Pressing volume and intensity build weighted dip capacity.',
  
  // Compression
  'compression': 'Leg raise and pike work develop compression strength.',
  
  // Rings
  'rings_strength': 'Ring support and transition work build rings-specific strength.',
  'iron_cross': 'Straight-arm strength and rings support work toward iron cross.',
}

/**
 * Get carryover explanation for a skill, with fallback
 */
function getCarryoverExplanation(skill: string): string {
  const normalized = skill.toLowerCase().replace(/[-\s]/g, '_')
  return SKILL_CARRYOVER_EXPLANATIONS[normalized] || 
         SKILL_CARRYOVER_EXPLANATIONS[skill] || 
         'Maintained through related strength and movement work.'
}

// =============================================================================
// THRESHOLDS (centralized)
// =============================================================================

const DIRECT_EXPOSURE_THRESHOLD = 2
const TOTAL_EXPOSURE_MEANINGFUL_THRESHOLD = 3
const ACCESSORY_MIN_EXPOSURE = 1

// =============================================================================
// MAIN DERIVATION FUNCTION
// =============================================================================

export interface DeriveSkillRepresentationInput {
  /** All selected skills from program.selectedSkills */
  selectedSkills: string[]
  /** Headline skills (primary + secondary goals) */
  headlineSkills: string[]
  /** Weekly representation policies if available */
  weeklyRepresentationPolicies?: Array<{
    skill: string
    representationVerdict: string
    actualExposure?: {
      direct?: number
      total?: number
    }
  }> | null
  /** Summary truth week support skills if available */
  weekSupportSkills?: string[]
  /** Summary truth represented skills if available */
  weekRepresentedSkills?: string[]
}

/**
 * Derive display representation for all selected skills.
 * Every selected skill receives a display object — none are hidden.
 */
export function deriveAllSelectedSkillRepresentations(
  input: DeriveSkillRepresentationInput
): SelectedSkillRepresentationDisplay[] {
  const {
    selectedSkills,
    headlineSkills,
    weeklyRepresentationPolicies,
    weekSupportSkills = [],
    weekRepresentedSkills = [],
  } = input
  
  // Guard: no selected skills = no display
  if (!selectedSkills || selectedSkills.length === 0) {
    return []
  }
  
  const hasWeeklyRepPolicies = weeklyRepresentationPolicies && weeklyRepresentationPolicies.length > 0
  
  return selectedSkills.map(skill => {
    const displayLabel = formatSkillLabel(skill)
    const isHeadline = headlineSkills.includes(skill)
    
    // Find policy if available
    const policy = weeklyRepresentationPolicies?.find(p => p.skill === skill)
    const directExposure = policy?.actualExposure?.direct ?? null
    const totalExposure = policy?.actualExposure?.total ?? null
    
    // 1. HEADLINE PRIORITY — always wins
    if (isHeadline) {
      return {
        skill,
        label: displayLabel,
        state: 'headline_priority' as const,
        visibleBadge: 'Primary',
        explanation: 'Primary training focus this week.',
        source: 'headline_identity' as const,
        directExposure,
        totalExposure,
        reasonCode: 'headline_identity',
      }
    }
    
    // 2. WEEKLY REPRESENTATION POLICY — strongest non-headline truth
    if (hasWeeklyRepPolicies && policy) {
      const verdict = policy.representationVerdict
      const dExp = directExposure ?? 0
      const tExp = totalExposure ?? 0
      
      // headline_represented from policy
      if (verdict === 'headline_represented') {
        return {
          skill,
          label: displayLabel,
          state: 'headline_priority' as const,
          visibleBadge: 'Primary',
          explanation: 'Primary training focus this week.',
          source: 'weekly_representation' as const,
          directExposure,
          totalExposure,
          reasonCode: 'policy_headline_represented',
        }
      }
      
      // broadly_represented with meaningful direct exposure
      if (verdict === 'broadly_represented' && dExp >= DIRECT_EXPOSURE_THRESHOLD) {
        return {
          skill,
          label: displayLabel,
          state: 'direct' as const,
          visibleBadge: 'Direct',
          explanation: `Directly trained ${dExp}+ times this week.`,
          source: 'weekly_representation' as const,
          directExposure,
          totalExposure,
          reasonCode: 'policy_direct_exposure',
        }
      }
      
      // support_only OR broadly_represented with low direct but meaningful total
      if (verdict === 'support_only' || (verdict === 'broadly_represented' && tExp >= TOTAL_EXPOSURE_MEANINGFUL_THRESHOLD)) {
        return {
          skill,
          label: displayLabel,
          state: 'support' as const,
          visibleBadge: 'Support',
          explanation: 'Developed through related support work this week.',
          source: 'weekly_representation' as const,
          directExposure,
          totalExposure,
          reasonCode: verdict === 'support_only' ? 'policy_support_only' : 'policy_total_exposure',
        }
      }
      
      // Some exposure but below thresholds = accessory/carryover
      if (tExp >= ACCESSORY_MIN_EXPOSURE) {
        return {
          skill,
          label: displayLabel,
          state: 'accessory_carryover' as const,
          visibleBadge: 'Accessory',
          explanation: getCarryoverExplanation(skill),
          source: 'weekly_representation' as const,
          directExposure,
          totalExposure,
          reasonCode: 'policy_accessory_carryover',
        }
      }
      
      // selected_but_underexpressed or filtered_out_by_constraints or zero exposure
      if (verdict === 'selected_but_underexpressed' || verdict === 'filtered_out_by_constraints' || tExp === 0) {
        const isConstraint = verdict === 'filtered_out_by_constraints'
        return {
          skill,
          label: displayLabel,
          state: 'underrepresented' as const,
          visibleBadge: 'Underrepresented',
          explanation: isConstraint 
            ? 'Not represented this week due to schedule or recovery constraints.'
            : 'Selected but not meaningfully represented this week.',
          source: 'weekly_representation' as const,
          directExposure,
          totalExposure,
          reasonCode: isConstraint ? 'policy_constraint_filtered' : 'policy_underexpressed',
        }
      }
    }
    
    // 3. FALLBACK — no weekly representation policies available
    // Use summary truth as supporting evidence
    
    // Check if in week represented skills
    if (weekRepresentedSkills.includes(skill)) {
      return {
        skill,
        label: displayLabel,
        state: 'direct' as const,
        visibleBadge: 'Direct',
        explanation: 'Directly trained based on session content.',
        source: 'summary_truth' as const,
        directExposure: null,
        totalExposure: null,
        reasonCode: 'summary_week_represented',
      }
    }
    
    // Check if in week support skills
    if (weekSupportSkills.includes(skill)) {
      return {
        skill,
        label: displayLabel,
        state: 'support' as const,
        visibleBadge: 'Support',
        explanation: 'Developed through related support work.',
        source: 'summary_truth' as const,
        directExposure: null,
        totalExposure: null,
        reasonCode: 'summary_support_skill',
      }
    }
    
    // 4. NO PROOF AVAILABLE — honest fallback
    // Skill is selected but we can't prove representation
    return {
      skill,
      label: displayLabel,
      state: 'unknown' as const,
      visibleBadge: 'Selected',
      explanation: 'Selected skill; representation proof unavailable.',
      source: 'fallback' as const,
      directExposure: null,
      totalExposure: null,
      reasonCode: 'no_representation_proof',
    }
  })
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Format skill ID to human-readable label
 */
function formatSkillLabel(skill: string): string {
  return skill.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

/**
 * Get UI styling class for a representation state
 */
export function getRepresentationStateStyles(state: SkillRepresentationState): {
  chipClass: string
  badgeClass: string
} {
  switch (state) {
    case 'headline_priority':
      return {
        chipClass: 'bg-[#E63946]/15 text-[#E63946] border border-[#E63946]/25',
        badgeClass: 'text-[#E63946]',
      }
    case 'direct':
      return {
        chipClass: 'bg-[#1A1A1A] text-[#8A8A8A] border border-[#333]',
        badgeClass: 'text-[#8A8A8A]',
      }
    case 'support':
      return {
        chipClass: 'bg-amber-500/8 text-amber-400/80 border border-amber-500/15',
        badgeClass: 'text-amber-400/70',
      }
    case 'accessory_carryover':
      return {
        chipClass: 'bg-[#1A1A1A]/50 text-[#6A6A6A] border border-[#2A2A2A]',
        badgeClass: 'text-[#5A5A5A]',
      }
    case 'underrepresented':
      return {
        chipClass: 'bg-[#1A1A1A]/30 text-[#5A5A5A] border border-[#252525] border-dashed',
        badgeClass: 'text-[#4A4A4A]',
      }
    case 'unknown':
    default:
      return {
        chipClass: 'bg-[#1A1A1A]/20 text-[#5A5A5A] border border-[#222]',
        badgeClass: 'text-[#4A4A4A]',
      }
  }
}
