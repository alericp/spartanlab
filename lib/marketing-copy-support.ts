/**
 * Marketing Copy Support
 * 
 * This module provides truthful, verifiable marketing copy based on
 * ACTUAL engine capabilities. Every claim made here is backed by
 * real code implementations in the coaching intelligence system.
 * 
 * IMPORTANT GUIDELINES:
 * - NO specific athlete names
 * - NO specific coach names
 * - NO branded methodology names
 * - NO unverifiable claims
 * - All claims must map to actual engine features
 */

// =============================================================================
// FEATURE CAPABILITY MAPPING
// =============================================================================

export interface FeatureCapability {
  id: string
  internalName: string
  marketingName: string
  shortDescription: string
  longDescription: string
  // Files that implement this feature (proof of capability)
  implementationEvidence: string[]
  // Key functions or modules
  keyFunctions: string[]
  // When to highlight this feature
  relevantFor: string[]
}

export const FEATURE_CAPABILITIES: FeatureCapability[] = [
  {
    id: 'adaptive_skill_coaching',
    internalName: 'Skill Progression Rules + Coaching Intelligence',
    marketingName: 'Adaptive Skill Coaching',
    shortDescription: 'Intelligent skill progression based on your readiness',
    longDescription: 'SpartanLab analyzes your current abilities and training history to select appropriate progressions. The engine considers factors like pulling strength, pushing strength, straight-arm experience, and recovery capacity to ensure you train at the right level.',
    implementationEvidence: [
      'lib/coaching-intelligence-engine.ts',
      'lib/skill-progression-rules.ts',
      'lib/weak-point-priority-engine.ts',
    ],
    keyFunctions: ['analyzeReadinessProfile', 'selectProgressionLevel', 'getSkillSpecificRecommendations'],
    relevantFor: ['skills', 'planche', 'front_lever', 'muscle_up', 'iron_cross'],
  },
  {
    id: 'weighted_calisthenics_intelligence',
    internalName: 'Weighted Strength Progression + Streetlifting Logic',
    marketingName: 'Weighted Calisthenics Programming',
    shortDescription: 'Smart programming for weighted pull-ups, dips, and strength work',
    longDescription: 'Purpose-built logic for weighted calisthenics and streetlifting. The engine understands the unique demands of weighted bodyweight training - lower rep ranges, longer rest periods, and progressive overload cycles that build real strength.',
    implementationEvidence: [
      'lib/coaching-intelligence-engine.ts',
      'lib/training-session-config.ts',
    ],
    keyFunctions: ['weighted_strength_progression', 'streetlifting_blocks', 'neural_output_strength'],
    relevantFor: ['strength', 'weighted_strength'],
  },
  {
    id: 'tendon_safety_system',
    internalName: 'Tendon Adaptation Protocol + Iron Cross Safety',
    marketingName: 'Connective Tissue Protection',
    shortDescription: 'Conservative progression gates for high-stress movements',
    longDescription: 'Advanced calisthenics skills stress tendons and connective tissue. SpartanLab includes built-in safety gates that ensure adequate foundation before progressing to high-risk movements like iron cross, advanced planche, and front lever work.',
    implementationEvidence: [
      'lib/coaching-intelligence-engine.ts',
      'lib/training-session-config.ts',
      'lib/weak-point-priority-engine.ts',
    ],
    keyFunctions: ['tendon_adaptation_protocol', 'checkIronCrossReadiness', 'analyzeTendonConditioning'],
    relevantFor: ['skills', 'planche', 'front_lever', 'iron_cross'],
  },
  {
    id: 'fatigue_aware_programming',
    internalName: 'Fatigue Budgeting + Recovery-Aware Programming',
    marketingName: 'Recovery-Smart Training',
    shortDescription: 'Automatic adjustment based on fatigue and recovery',
    longDescription: 'Training stress is carefully balanced against recovery capacity. The engine prevents overstuffed sessions, avoids combining too many high-neural movements, and adjusts volume when fatigue signals are high.',
    implementationEvidence: [
      'lib/coaching-intelligence-engine.ts',
      'lib/fatigue-engine.ts',
      'lib/daily-adjustment-engine.ts',
    ],
    keyFunctions: ['fatigue_budgeting', 'recovery_aware_programming', 'analyzeRecoveryCapacity'],
    relevantFor: ['all'],
  },
  {
    id: 'military_preparation',
    internalName: 'Military Test Config + Endurance Density Config',
    marketingName: 'Military & Tactical Preparation',
    shortDescription: 'Branch-specific fitness test preparation',
    longDescription: 'Targeted training for Marine Corps PFT/CFT, Army ACFT, Navy PRT, and other military fitness tests. Includes event-specific conditioning, test simulations, and pacing strategy development.',
    implementationEvidence: [
      'lib/military-test-config.ts',
      'lib/military-program-builder.ts',
      'lib/endurance-density-config.ts',
    ],
    keyFunctions: ['MILITARY_CONDITIONING_BLOCKS', 'generateMaxRepPlan', 'getMilitaryConditioningPlan'],
    relevantFor: ['military', 'max_reps', 'endurance'],
  },
  {
    id: 'pulling_strength_system',
    internalName: 'Pulling Strength Engine + One-Arm Pull-Up System',
    marketingName: 'Advanced Pulling Development',
    shortDescription: 'From pull-up basics to one-arm mastery',
    longDescription: 'Comprehensive pulling progression systems covering bodyweight strength, weighted pull-ups, one-arm pull-up progressions, and pull-up endurance development. Includes intelligent weak point detection for grip, scapular control, and bilateral balance.',
    implementationEvidence: [
      'lib/pulling-strength-engine.ts',
      'lib/weak-point-priority-engine.ts',
    ],
    keyFunctions: ['ONE_ARM_PULL_UP_SYSTEM', 'WEIGHTED_PULL_UP_LEVELS', 'analyzeFullPullProfile', 'getPullPriorityExercises'],
    relevantFor: ['strength', 'skills', 'one_arm_pull_up', 'front_lever', 'muscle_up'],
  },
  {
    id: 'session_optimization',
    internalName: 'Session Assembly Engine + Sequencing Rules',
    marketingName: 'Intelligent Session Structure',
    shortDescription: 'Optimal exercise ordering for your goals',
    longDescription: 'Sessions are structured following proven principles: skill work when fresh, strength work with proper rest, conditioning placed appropriately. No random exercise selection - every placement has purpose.',
    implementationEvidence: [
      'lib/coaching-intelligence-engine.ts',
      'lib/training-session-config.ts',
    ],
    keyFunctions: ['determineSessionStructure', 'getSessionStructure', 'skill_first_sequencing'],
    relevantFor: ['all'],
  },
  {
    id: 'endurance_conditioning',
    internalName: 'Endurance Density Config',
    marketingName: 'Conditioning & Work Capacity',
    shortDescription: 'Structured endurance and density training',
    longDescription: 'Multiple conditioning approaches including density circuits, repeat effort training, interval work, and fatigue tolerance blocks. The engine selects appropriate protocols based on your goals.',
    implementationEvidence: [
      'lib/endurance-density-config.ts',
      'lib/coaching-intelligence-engine.ts',
    ],
    keyFunctions: ['selectEnduranceProtocol', 'ENDURANCE_PROTOCOLS', 'endurance_density_training'],
    relevantFor: ['endurance', 'military', 'max_reps', 'general_fitness'],
  },
  {
    id: 'skill_frequency_training',
    internalName: 'Handstand Training Config + Skill Frequency',
    marketingName: 'Skill Practice Optimization',
    shortDescription: 'High-frequency, low-fatigue skill development',
    longDescription: 'Balance skills like handstands benefit from frequent short practice. SpartanLab programs appropriate skill exposure - quality over quantity, fresh CNS, and optimal session placement.',
    implementationEvidence: [
      'lib/training-session-config.ts',
      'lib/coaching-intelligence-engine.ts',
    ],
    keyFunctions: ['HANDSTAND_TRAINING_CONFIG', 'skill_frequency_training', 'shouldIncludeHandstandStrength'],
    relevantFor: ['skills', 'handstand_pushup'],
  },
  {
    id: 'training_cycle_engine',
    internalName: 'Training Cycle Engine + Periodization',
    marketingName: 'Periodized Training Cycles',
    shortDescription: 'Structured training phases for real progress',
    longDescription: 'Move beyond random workouts with periodized training. Skill cycles for technique, strength cycles for max output, hypertrophy cycles for muscle building, and intelligent transitions between phases. Each cycle has specific volume, intensity, and exercise prescriptions.',
    implementationEvidence: [
      'lib/training-cycle-engine.ts',
      'lib/coaching-engine-index.ts',
    ],
    keyFunctions: ['ALL_TRAINING_CYCLES', 'selectRecommendedCycle', 'getTransitionRecommendation', 'CYCLE_GUIDE_STRUCTURES'],
    relevantFor: ['all'],
  },
]

// =============================================================================
// MARKETING COPY GENERATORS
// =============================================================================

export interface MarketingCopyBlock {
  section: string
  headline: string
  subheadline?: string
  body: string
  bulletPoints?: string[]
  ctaText?: string
}

/**
 * Generate homepage hero copy
 */
export function generateHeroSection(): MarketingCopyBlock {
  return {
    section: 'hero',
    headline: 'Your Adaptive Calisthenics Coach',
    subheadline: 'Intelligent programming that adapts to you',
    body: 'SpartanLab combines proven training principles with smart technology. Get personalized programs that progress with your abilities, protect your joints, and actually work.',
    ctaText: 'Start Your Program',
  }
}

/**
 * Generate feature section copy
 */
export function generateFeatureSection(): MarketingCopyBlock[] {
  return [
    {
      section: 'feature_skills',
      headline: 'Master Advanced Skills',
      body: 'From your first muscle-up to planche and front lever, SpartanLab builds the foundation you need and progresses you safely.',
      bulletPoints: [
        'Structured progressions for planche, front lever, muscle-up, and more',
        'Support exercises selected based on your weak points',
        'Conservative tendon protection for straight-arm skills',
      ],
    },
    {
      section: 'feature_strength',
      headline: 'Build Real Strength',
      body: 'Weighted calisthenics programming that understands the unique demands of bodyweight strength training.',
      bulletPoints: [
        'Intelligent weighted pull-up and dip progressions',
        'Long rest protocols for maximum strength output',
        'Progressive overload cycles that drive results',
      ],
    },
    {
      section: 'feature_military',
      headline: 'Military Test Preparation',
      body: 'Targeted preparation for Marine Corps PFT/CFT, Army ACFT, Navy PRT, and other fitness tests.',
      bulletPoints: [
        'Event-specific conditioning blocks',
        'Max rep development protocols',
        'Test simulations and pacing practice',
      ],
    },
    {
      section: 'feature_conditioning',
      headline: 'Smart Conditioning',
      body: 'Endurance training that supports your goals without destroying your skill work.',
      bulletPoints: [
        'Density circuits and interval training',
        'Work capacity development',
        'Conditioning placed appropriately in sessions',
      ],
    },
  ]
}

/**
 * Generate AI coach explainer copy
 */
export function generateCoachExplainer(): MarketingCopyBlock {
  return {
    section: 'coach_explainer',
    headline: 'How SpartanLab Works',
    subheadline: 'Coaching intelligence, not random workouts',
    body: 'SpartanLab analyzes your goals, abilities, and recovery to create programs that adapt as you progress. The engine applies training principles used across elite calisthenics, weighted training, and performance development.',
    bulletPoints: [
      'Readiness assessment guides progression selection',
      'Weak point detection prioritizes support work',
      'Fatigue management prevents overtraining',
      'Session structure follows proven sequencing principles',
      'Conservative safety gates protect connective tissue',
    ],
  }
}

/**
 * Generate social proof copy (capability-based, not testimonial-based)
 */
export function generateCapabilityProof(): MarketingCopyBlock {
  return {
    section: 'capability_proof',
    headline: 'Built on Proven Principles',
    body: 'SpartanLab incorporates training principles from modern calisthenics coaching, weighted bodyweight training, and tactical fitness preparation. No gimmicks, no fads - just intelligent programming based on what actually works.',
    bulletPoints: [
      'Skill-first sequencing for optimal neural output',
      'Straight-arm strength development protocols',
      'Tendon adaptation and injury prevention logic',
      'Density and repeat-effort conditioning methods',
      'Recovery-aware volume management',
    ],
  }
}

// =============================================================================
// SEO CONTENT STRUCTURES
// =============================================================================

export interface SEOContentStructure {
  pageType: string
  primaryKeyword: string
  secondaryKeywords: string[]
  suggestedTitle: string
  metaDescription: string
  h1: string
  contentOutline: string[]
}

export const SEO_CONTENT_STRUCTURES: SEOContentStructure[] = [
  {
    pageType: 'skill_guide',
    primaryKeyword: 'planche tutorial',
    secondaryKeywords: ['planche progression', 'learn planche', 'planche training'],
    suggestedTitle: 'Planche Progression Guide | SpartanLab',
    metaDescription: 'Complete guide to planche progressions from tuck to full planche. Learn the prerequisites, progressions, and support exercises for safe skill development.',
    h1: 'How to Progress Your Planche',
    contentOutline: [
      'Prerequisites and readiness checklist',
      'Planche progression ladder',
      'Support strength requirements',
      'Common mistakes and corrections',
      'Sample training structure',
    ],
  },
  {
    pageType: 'military_guide',
    primaryKeyword: 'marine corps pft training',
    secondaryKeywords: ['pft workout', 'marine pft prep', 'pft training program'],
    suggestedTitle: 'Marine Corps PFT Training Program | SpartanLab',
    metaDescription: 'Prepare for the Marine Corps PFT with targeted training for pull-ups, plank, and 3-mile run. Get a structured program that builds the fitness you need.',
    h1: 'Marine Corps PFT Preparation',
    contentOutline: [
      'PFT scoring breakdown',
      'Pull-up max development',
      'Plank endurance training',
      '3-mile run improvement',
      'Training schedule and periodization',
    ],
  },
  {
    pageType: 'military_guide',
    primaryKeyword: 'army acft training',
    secondaryKeywords: ['acft workout', 'acft prep program', 'acft training plan'],
    suggestedTitle: 'Army ACFT Training Program | SpartanLab',
    metaDescription: 'Targeted Army ACFT preparation covering all six events. Build the strength, power, and endurance needed to score well.',
    h1: 'Army ACFT Preparation',
    contentOutline: [
      'ACFT event breakdown',
      'Deadlift and power training',
      'Push-up and plank development',
      'Sprint-drag-carry conditioning',
      '2-mile run improvement',
    ],
  },
  {
    pageType: 'skill_guide',
    primaryKeyword: 'front lever tutorial',
    secondaryKeywords: ['front lever progression', 'learn front lever', 'front lever training'],
    suggestedTitle: 'Front Lever Progression Guide | SpartanLab',
    metaDescription: 'Complete front lever progression guide from tuck to full. Learn the pulling strength requirements and support exercises for safe development.',
    h1: 'How to Progress Your Front Lever',
    contentOutline: [
      'Prerequisites and strength benchmarks',
      'Front lever progression ladder',
      'Pulling strength requirements',
      'Scapular strength development',
      'Sample training structure',
    ],
  },
  {
    pageType: 'skill_guide',
    primaryKeyword: 'muscle up tutorial',
    secondaryKeywords: ['muscle up progression', 'learn muscle up', 'bar muscle up'],
    suggestedTitle: 'Muscle Up Progression Guide | SpartanLab',
    metaDescription: 'Learn the muscle up with structured progressions. Build the pulling power, transition strength, and technique for your first strict muscle up.',
    h1: 'How to Get Your First Muscle Up',
    contentOutline: [
      'Strength prerequisites',
      'Pulling power development',
      'Transition technique',
      'Common mistakes',
      'Sample training program',
    ],
  },
]

// =============================================================================
// COPY VALIDATION
// =============================================================================

/**
 * Validate that marketing copy is backed by actual features
 */
export function validateMarketingClaim(claim: string): {
  isValid: boolean
  supportingFeatures: string[]
  concerns: string[]
} {
  const supportingFeatures: string[] = []
  const concerns: string[] = []
  
  const claimLower = claim.toLowerCase()
  
  // Check for prohibited terms
  const prohibitedTerms = ['guaranteed', 'fastest', 'only', 'best in the world', 'revolutionary']
  for (const term of prohibitedTerms) {
    if (claimLower.includes(term)) {
      concerns.push(`Claim contains potentially problematic term: "${term}"`)
    }
  }
  
  // Find supporting features
  for (const feature of FEATURE_CAPABILITIES) {
    const featureTerms = [
      feature.marketingName.toLowerCase(),
      ...feature.relevantFor.map(r => r.toLowerCase()),
    ]
    
    for (const term of featureTerms) {
      if (claimLower.includes(term)) {
        supportingFeatures.push(feature.id)
        break
      }
    }
  }
  
  const isValid = supportingFeatures.length > 0 && concerns.length === 0
  
  return {
    isValid,
    supportingFeatures: [...new Set(supportingFeatures)],
    concerns,
  }
}

/**
 * Generate safe marketing tagline
 */
export function generateTagline(): string {
  const taglines = [
    'Your adaptive calisthenics coach',
    'Intelligent programming that adapts to you',
    'Train smarter, progress safely',
    'Personalized calisthenics programming',
    'Built on proven training principles',
  ]
  
  return taglines[0] // Default to first
}

/**
 * Generate safe capability description
 */
export function generateCapabilityDescription(): string {
  return `SpartanLab's adaptive coaching engine combines modern calisthenics training principles across skill work, strength development, weighted calisthenics, and conditioning. Built to adapt like a real coach - not just generate random workouts.`
}
