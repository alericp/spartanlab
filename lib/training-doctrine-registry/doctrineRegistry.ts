/**
 * Training Doctrine Registry
 * 
 * PURPOSE:
 * Stores structured training philosophies and methodology principles for calisthenics.
 * These doctrine profiles inform AI decisions across multiple engines without replacing them.
 * 
 * HOW TO ADD NEW DOCTRINES:
 * 1. Add a new entry to the DOCTRINE_REGISTRY object
 * 2. Use a unique doctrineId (lowercase, underscores)
 * 3. Fill all required TrainingDoctrine fields
 * 4. Keep descriptions short and structured
 * 5. Ensure compatibleFrameworks references valid CoachingFrameworkId values
 * 
 * HOW ENGINES REFERENCE DOCTRINES:
 * - Import getDoctrineById() or getDoctrineAttributes() from doctrineService
 * - Use attributes to inform decisions, not override existing logic
 * - Doctrines complement frameworks, they don't replace them
 */

import type { TrainingDoctrine } from './doctrineTypes'

// =============================================================================
// DOCTRINE REGISTRY
// =============================================================================

export const DOCTRINE_REGISTRY: Record<string, TrainingDoctrine> = {
  // ---------------------------------------------------------------------------
  // STATIC SKILL FREQUENCY DOCTRINE
  // ---------------------------------------------------------------------------
  static_skill_frequency: {
    doctrineId: 'static_skill_frequency',
    name: 'Static Skill Frequency',
    description: 'High-frequency exposure to static holds with submaximal intensity for motor learning.',
    category: 'static_strength',
    primaryFocus: ['planche_development', 'front_lever_development', 'handstand_mastery'],
    trainingStyleBias: 'static_emphasis',
    skillFrequencyProfile: 'high_frequency',
    volumeProfile: 'moderate_volume',
    intensityProfile: 'submaximal',
    progressionPhilosophy: 'autoregulated',
    safetyNotes: [
      'Prioritize tendon recovery between sessions',
      'Reduce volume if joint discomfort appears',
      'Quality over duration in holds'
    ],
    movementBiasTendency: 'skill_specific',
    compatibleFrameworks: ['skill_frequency', 'tendon_conservative', 'balanced_hybrid'],
    bestFor: [
      'Athletes prioritizing static skills',
      'Those with good recovery capacity',
      'Motor learning phases'
    ],
    notRecommendedFor: [
      'Athletes with active tendon issues',
      'Those with limited training time',
      'Pure strength seekers'
    ],
    keyPrinciples: [
      'Frequent submaximal exposure builds neural pathways',
      'Static positions require consistent practice',
      'Volume is distributed across sessions, not concentrated'
    ]
  },

  // ---------------------------------------------------------------------------
  // WEIGHTED STRENGTH CONVERSION DOCTRINE
  // ---------------------------------------------------------------------------
  weighted_strength_conversion: {
    doctrineId: 'weighted_strength_conversion',
    name: 'Weighted Strength Conversion',
    description: 'Heavy weighted basics to build raw strength that transfers to advanced skills.',
    category: 'strength_conversion',
    primaryFocus: ['weighted_calisthenics', 'muscle_up_progression', 'general_strength'],
    trainingStyleBias: 'dynamic_emphasis',
    skillFrequencyProfile: 'low_frequency',
    volumeProfile: 'low_volume_high_intensity',
    intensityProfile: 'high',
    progressionPhilosophy: 'linear',
    safetyNotes: [
      'Adequate warm-up for heavy loads',
      'Progressive overload in small increments',
      'Full recovery between heavy sessions'
    ],
    movementBiasTendency: 'balanced',
    compatibleFrameworks: ['barseagle_strength', 'strength_conversion'],
    bestFor: [
      'Athletes building base strength',
      'Those plateaued on bodyweight progressions',
      'Weighted calisthenics enthusiasts'
    ],
    notRecommendedFor: [
      'Beginners without movement mastery',
      'Those recovering from injury',
      'Pure skill-focused athletes'
    ],
    keyPrinciples: [
      'Strength is the foundation for advanced skills',
      'Heavy weighted basics transfer to static positions',
      'Quality reps at challenging loads'
    ]
  },

  // ---------------------------------------------------------------------------
  // ENDURANCE DENSITY DOCTRINE
  // ---------------------------------------------------------------------------
  endurance_density: {
    doctrineId: 'endurance_density',
    name: 'Endurance Density Training',
    description: 'High-volume work with compressed rest for conditioning and work capacity.',
    category: 'endurance_density',
    primaryFocus: ['full_body_calisthenics', 'muscle_up_progression', 'general_strength'],
    trainingStyleBias: 'dynamic_emphasis',
    skillFrequencyProfile: 'moderate_frequency',
    volumeProfile: 'density_training',
    intensityProfile: 'moderate',
    progressionPhilosophy: 'undulating',
    safetyNotes: [
      'Monitor form degradation under fatigue',
      'Adequate nutrition for high volume',
      'Deload when performance drops'
    ],
    movementBiasTendency: 'balanced',
    compatibleFrameworks: ['density_endurance', 'balanced_hybrid'],
    bestFor: [
      'Athletes building work capacity',
      'Those seeking conditioning benefits',
      'Circuit-style training preference'
    ],
    notRecommendedFor: [
      'Pure strength or skill focus',
      'Athletes with recovery limitations',
      'Those new to high-volume training'
    ],
    keyPrinciples: [
      'Work capacity enables more quality practice',
      'Density blocks improve conditioning efficiently',
      'Volume tolerance builds over time'
    ]
  },

  // ---------------------------------------------------------------------------
  // TENDON CONSERVATIVE DOCTRINE
  // ---------------------------------------------------------------------------
  tendon_conservative: {
    doctrineId: 'tendon_conservative',
    name: 'Tendon Conservative',
    description: 'Slower progression with emphasis on joint health and connective tissue adaptation.',
    category: 'static_strength',
    primaryFocus: ['planche_development', 'front_lever_development', 'ring_strength'],
    trainingStyleBias: 'static_emphasis',
    skillFrequencyProfile: 'moderate_frequency',
    volumeProfile: 'moderate_volume',
    intensityProfile: 'submaximal',
    progressionPhilosophy: 'step_loading',
    safetyNotes: [
      'Tendons adapt slower than muscles',
      'Prioritize prep work and warm-ups',
      'Progress intensity conservatively'
    ],
    movementBiasTendency: 'skill_specific',
    compatibleFrameworks: ['tendon_conservative', 'skill_frequency'],
    bestFor: [
      'Athletes with tendon sensitivity',
      'Long-term skill development',
      'Older athletes or those with injury history'
    ],
    notRecommendedFor: [
      'Impatient progression seekers',
      'Those with aggressive timelines',
      'Athletes without tendon concerns'
    ],
    keyPrinciples: [
      'Connective tissue needs time to strengthen',
      'Prevention is better than rehabilitation',
      'Sustainable progress over rapid gains'
    ]
  },

  // ---------------------------------------------------------------------------
  // HYBRID STRENGTH SKILL DOCTRINE
  // ---------------------------------------------------------------------------
  hybrid_strength_skill: {
    doctrineId: 'hybrid_strength_skill',
    name: 'Hybrid Strength-Skill',
    description: 'Balanced approach combining strength work with skill practice in each session.',
    category: 'hybrid_strength',
    primaryFocus: ['skill_variety', 'full_body_calisthenics', 'general_strength'],
    trainingStyleBias: 'hybrid_emphasis',
    skillFrequencyProfile: 'moderate_frequency',
    volumeProfile: 'moderate_volume',
    intensityProfile: 'moderate',
    progressionPhilosophy: 'undulating',
    safetyNotes: [
      'Balance skill fatigue with strength demands',
      'Prioritize skill work when fresh',
      'Monitor total weekly stress'
    ],
    movementBiasTendency: 'balanced',
    compatibleFrameworks: ['balanced_hybrid', 'skill_frequency', 'hypertrophy_supported'],
    bestFor: [
      'Well-rounded calisthenics athletes',
      'Those with multiple goals',
      'Sustainable long-term training'
    ],
    notRecommendedFor: [
      'Single-skill specialists',
      'Competition preparation phases',
      'Those with limited recovery capacity'
    ],
    keyPrinciples: [
      'Strength and skill development can coexist',
      'Variety prevents overuse patterns',
      'Balance creates sustainable progress'
    ]
  },

  // ---------------------------------------------------------------------------
  // RING SPECIALIST DOCTRINE
  // ---------------------------------------------------------------------------
  ring_specialist: {
    doctrineId: 'ring_specialist',
    name: 'Ring Specialist',
    description: 'Focused development of ring strength and stability for advanced positions.',
    category: 'static_strength',
    primaryFocus: ['ring_strength', 'muscle_up_progression'],
    trainingStyleBias: 'static_emphasis',
    skillFrequencyProfile: 'moderate_frequency',
    volumeProfile: 'low_volume_high_intensity',
    intensityProfile: 'high',
    progressionPhilosophy: 'block_periodization',
    safetyNotes: [
      'Ring instability increases joint stress',
      'Build support strength progressively',
      'Monitor shoulder and elbow health carefully'
    ],
    movementBiasTendency: 'push_emphasis',
    compatibleFrameworks: ['tendon_conservative', 'skill_frequency'],
    bestFor: [
      'Athletes pursuing ring skills',
      'Iron cross or maltese development',
      'Gymnastics-style strength'
    ],
    notRecommendedFor: [
      'Beginners without ring experience',
      'Those with shoulder instability',
      'Athletes without ring access'
    ],
    keyPrinciples: [
      'Ring stability precedes ring strength',
      'Support positions build foundation',
      'Straight-arm strength requires patience'
    ]
  },

  // ---------------------------------------------------------------------------
  // EXPLOSIVE POWER DOCTRINE
  // ---------------------------------------------------------------------------
  explosive_power: {
    doctrineId: 'explosive_power',
    name: 'Explosive Power Development',
    description: 'Focus on explosive movements and power output for dynamic skills.',
    category: 'dynamic_strength',
    primaryFocus: ['muscle_up_progression', 'full_body_calisthenics'],
    trainingStyleBias: 'explosive_emphasis',
    skillFrequencyProfile: 'moderate_frequency',
    volumeProfile: 'low_volume_high_intensity',
    intensityProfile: 'maximal',
    progressionPhilosophy: 'undulating',
    safetyNotes: [
      'Full recovery between explosive sets',
      'Technique must be solid before adding power',
      'Warm-up thoroughly for explosive work'
    ],
    movementBiasTendency: 'pull_emphasis',
    compatibleFrameworks: ['strength_conversion', 'barseagle_strength'],
    bestFor: [
      'Muscle-up development',
      'Dynamic pulling power',
      'Athletes with solid strength base'
    ],
    notRecommendedFor: [
      'Beginners without movement mastery',
      'Static skill specialists',
      'Those with joint sensitivity'
    ],
    keyPrinciples: [
      'Power is strength applied quickly',
      'Explosive work requires full recovery',
      'Quality over quantity for power development'
    ]
  }
}

// =============================================================================
// DOCTRINE REGISTRY HELPERS
// =============================================================================

/** Get all doctrine IDs */
export function getAllDoctrineIds(): string[] {
  return Object.keys(DOCTRINE_REGISTRY)
}

/** Check if a doctrine ID exists */
export function doctrineExists(doctrineId: string): boolean {
  return doctrineId in DOCTRINE_REGISTRY
}

/** Get doctrine count */
export function getDoctrineCount(): number {
  return Object.keys(DOCTRINE_REGISTRY).length
}
