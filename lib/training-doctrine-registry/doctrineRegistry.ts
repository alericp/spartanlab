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
    displayName: 'High-Frequency Skill Method',
    description: 'High-frequency exposure to static holds with submaximal intensity for motor learning.',
    summary: 'Frequent submaximal skill exposure for accelerated motor learning.',
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
    ],
    bestUseCases: [
      'Planche skill acquisition',
      'Front lever motor pattern development',
      'Handstand balance refinement',
      'Athletes with 4+ training days available'
    ],
    avoidWhen: [
      'Active elbow or shoulder tendinopathy',
      'Less than 3 training days per week available',
      'Primary goal is maximal strength, not skill'
    ],
    preferredStructures: ['static_hold_blocks', 'skill_specific_blocks', 'superset_pairings'],
    advancedApplicability: 'all_levels'
  },

  // ---------------------------------------------------------------------------
  // WEIGHTED STRENGTH CONVERSION DOCTRINE
  // ---------------------------------------------------------------------------
  weighted_strength_conversion: {
    doctrineId: 'weighted_strength_conversion',
    name: 'Weighted Strength Conversion',
    displayName: 'Weighted Strength Method',
    description: 'Heavy weighted basics to build raw strength that transfers to advanced skills.',
    summary: 'Build raw pulling/pushing strength with weighted basics for skill transfer.',
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
    ],
    bestUseCases: [
      'Weighted pull-up development to support front lever',
      'Weighted dip strength for planche transfer',
      'Breaking through bodyweight plateaus',
      'Building base for muscle-up progression'
    ],
    avoidWhen: [
      'Beginner lacking strict pull-up/dip form',
      'Active shoulder or elbow injury',
      'Goal is purely static skill with no strength deficit'
    ],
    preferredStructures: ['weighted_strength_sets', 'wave_loading', 'bent_arm_blocks'],
    advancedApplicability: 'intermediate_advanced'
  },

  // ---------------------------------------------------------------------------
  // ENDURANCE DENSITY DOCTRINE
  // ---------------------------------------------------------------------------
  endurance_density: {
    doctrineId: 'endurance_density',
    name: 'Endurance Density Training',
    displayName: 'Density Conditioning Method',
    description: 'High-volume work with compressed rest for conditioning and work capacity.',
    summary: 'Circuit and density training for conditioning and work capacity.',
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
    ],
    bestUseCases: [
      'Building muscular endurance for rep-based skills',
      'Conditioning for obstacle course or functional fitness',
      'Time-efficient high-volume training',
      'Developing fatigue resistance'
    ],
    avoidWhen: [
      'Training advanced straight-arm static skills',
      'High tendon stress phases',
      'Primary goal is maximal strength or power'
    ],
    preferredStructures: ['density_blocks', 'emom_blocks', 'pyramid_ladders', 'superset_pairings'],
    advancedApplicability: 'all_levels'
  },

  // ---------------------------------------------------------------------------
  // TENDON CONSERVATIVE DOCTRINE
  // ---------------------------------------------------------------------------
  tendon_conservative: {
    doctrineId: 'tendon_conservative',
    name: 'Tendon Conservative',
    displayName: 'Joint-Protective Method',
    description: 'Slower progression with emphasis on joint health and connective tissue adaptation.',
    summary: 'Conservative loading for sustainable long-term joint and tendon health.',
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
    ],
    bestUseCases: [
      'Iron cross or maltese development',
      'Planche training for athletes over 30',
      'Return from elbow or shoulder tendinopathy',
      'Long-term advanced rings progression'
    ],
    avoidWhen: [
      'Goal is rapid skill acquisition with no injury history',
      'Broad conditioning focus with no straight-arm emphasis',
      'Athlete has excellent tendon tolerance and recovery'
    ],
    preferredStructures: ['static_hold_blocks', 'prehab_mobility_blocks', 'straight_arm_blocks'],
    advancedApplicability: 'intermediate_advanced'
  },

  // ---------------------------------------------------------------------------
  // HYBRID STRENGTH SKILL DOCTRINE
  // ---------------------------------------------------------------------------
  hybrid_strength_skill: {
    doctrineId: 'hybrid_strength_skill',
    name: 'Hybrid Strength-Skill',
    displayName: 'Balanced Development Method',
    description: 'Balanced approach combining strength work with skill practice in each session.',
    summary: 'Concurrent strength and skill development for well-rounded progress.',
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
    ],
    bestUseCases: [
      'General calisthenics development',
      'Athletes pursuing multiple skills simultaneously',
      'Long-term sustainable training approach',
      'Maintenance phases between specialization blocks'
    ],
    avoidWhen: [
      'Preparing for specific skill competition',
      'Single-skill breakthrough required',
      'Very limited weekly training time (under 3 sessions)'
    ],
    preferredStructures: ['full_body_sessions', 'superset_pairings', 'skill_specific_blocks'],
    advancedApplicability: 'all_levels'
  },

  // ---------------------------------------------------------------------------
  // RING SPECIALIST DOCTRINE
  // ---------------------------------------------------------------------------
  ring_specialist: {
    doctrineId: 'ring_specialist',
    name: 'Ring Specialist',
    displayName: 'Rings Mastery Method',
    description: 'Focused development of ring strength and stability for advanced positions.',
    summary: 'Specialized ring strength and stability development for advanced positions.',
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
    ],
    bestUseCases: [
      'Iron cross development',
      'Maltese progression',
      'Ring muscle-up refinement',
      'Gymnastics-style static strength'
    ],
    avoidWhen: [
      'No ring access or training environment',
      'Active shoulder instability or impingement',
      'Beginner without basic ring support competency'
    ],
    preferredStructures: ['ring_support_progressions', 'straight_arm_blocks', 'static_hold_blocks'],
    advancedApplicability: 'intermediate_advanced'
  },

  // ---------------------------------------------------------------------------
  // EXPLOSIVE POWER DOCTRINE
  // ---------------------------------------------------------------------------
  explosive_power: {
    doctrineId: 'explosive_power',
    name: 'Explosive Power Development',
    displayName: 'Power Development Method',
    description: 'Focus on explosive movements and power output for dynamic skills.',
    summary: 'Dynamic power training for explosive pulling and muscle-up development.',
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
    ],
    bestUseCases: [
      'Muscle-up breakthrough training',
      'Explosive pull-up development',
      'Dynamic skill acquisition',
      'Power phase within periodized program'
    ],
    avoidWhen: [
      'Beginner lacking strict pull-up strength',
      'Active joint or tendon inflammation',
      'Static skill specialization phase'
    ],
    preferredStructures: ['weighted_strength_sets', 'bent_arm_blocks', 'wave_loading'],
    advancedApplicability: 'intermediate_advanced'
  },

  // ===========================================================================
  // ELITE ATHLETE METHOD PROFILES
  // ===========================================================================

  // ---------------------------------------------------------------------------
  // BARSEAGLE MINIMAL VOLUME METHOD
  // Inspired by Ian Barseagle's public weighted calisthenics methodology
  // ---------------------------------------------------------------------------
  barseagle_minimal_volume: {
    doctrineId: 'barseagle_minimal_volume',
    name: 'Barseagle Minimal Volume',
    displayName: 'Minimal Volume Strength Method',
    description: '2 warm-up sets + 2 working sets with heavy first set and higher-rep back-off. Long rest periods for neural strength focus.',
    summary: 'Ultra-low volume, high-intensity weighted basics for neural strength.',
    category: 'strength_conversion',
    primaryFocus: ['weighted_calisthenics', 'general_strength'],
    trainingStyleBias: 'dynamic_emphasis',
    skillFrequencyProfile: 'low_frequency',
    volumeProfile: 'low_volume_high_intensity',
    intensityProfile: 'maximal',
    progressionPhilosophy: 'linear',
    safetyNotes: [
      'Heavy loads require thorough warm-up',
      '3-5 minute rest between working sets',
      'Form must remain strict under heavy load',
      'Progress weight in small increments (2.5-5kg)'
    ],
    movementBiasTendency: 'balanced',
    compatibleFrameworks: ['barseagle_strength', 'strength_conversion'],
    bestFor: [
      'Intermediate athletes building weighted strength',
      'Those who respond well to low volume',
      'Weighted pull-up and dip specialists',
      'Athletes transferring strength to skills'
    ],
    notRecommendedFor: [
      'Beginners lacking strict form',
      'Athletes who need high volume for progress',
      'Those without equipment for progressive loading'
    ],
    keyPrinciples: [
      '2 warm-up sets to prepare nervous system',
      'Heavy first working set (3-5 reps near max)',
      'Back-off set with reduced weight (6-8 reps)',
      'Long rest periods (3-5 minutes) for neural recovery',
      'Strength transfers to calisthenics skill support'
    ],
    bestUseCases: [
      'Weighted pull-up development',
      'Weighted dip strength building',
      'Breaking through pulling or pushing plateaus',
      'Building base for front lever or planche'
    ],
    avoidWhen: [
      'Beginner cannot perform 10+ strict pull-ups',
      'No access to weight belt or loading equipment',
      'Primary goal is endurance or high-rep capacity',
      'Active joint or tendon issues'
    ],
    preferredStructures: ['weighted_strength_sets', 'bent_arm_blocks'],
    advancedApplicability: 'intermediate_advanced'
  },

  // ---------------------------------------------------------------------------
  // FULL-BODY RINGS INTEGRATION METHOD
  // Inspired by Andrea Larosa's public training principles
  // ---------------------------------------------------------------------------
  full_body_rings_integration: {
    doctrineId: 'full_body_rings_integration',
    name: 'Full-Body Rings Integration',
    displayName: 'Integrated Rings Strength Method',
    description: 'Advanced full-body integration emphasizing rings, body control, and athletic carryover with conservative respect for leverage work.',
    summary: 'Elite rings and body control integration with full-body athletic emphasis.',
    category: 'hybrid_strength',
    primaryFocus: ['ring_strength', 'full_body_calisthenics', 'skill_variety'],
    trainingStyleBias: 'hybrid_emphasis',
    skillFrequencyProfile: 'moderate_frequency',
    volumeProfile: 'moderate_volume',
    intensityProfile: 'autoregulated',
    progressionPhilosophy: 'autoregulated',
    safetyNotes: [
      'High technical quality required at all times',
      'Conservative approach to advanced leverage positions',
      'Full-body integration prevents overuse',
      'Ring instability demands respect'
    ],
    movementBiasTendency: 'balanced',
    compatibleFrameworks: ['balanced_hybrid', 'skill_frequency', 'tendon_conservative'],
    bestFor: [
      'Advanced athletes seeking elite body control',
      'Those with solid ring foundation',
      'Athletes valuing broad athletic development',
      'Long-term sustainable high-level training'
    ],
    notRecommendedFor: [
      'Beginners without ring competency',
      'Single-skill specialists',
      'Those seeking rapid isolated gains'
    ],
    keyPrinciples: [
      'Full-body integration prevents imbalances',
      'Technical quality never sacrificed for volume',
      'Rings and body control are central',
      'Broad athletic strength carryover',
      'Conservative respect for advanced leverage work'
    ],
    bestUseCases: [
      'Elite-level calisthenics development',
      'Competitive calisthenics preparation',
      'Long-term mastery-focused training',
      'Athletes with 5+ years experience'
    ],
    avoidWhen: [
      'Beginner or early intermediate level',
      'No ring training experience',
      'Seeking rapid single-skill progress',
      'Limited training environment'
    ],
    preferredStructures: ['ring_support_progressions', 'full_body_sessions', 'skill_specific_blocks', 'straight_arm_blocks'],
    advancedApplicability: 'advanced_only'
  },

  // ---------------------------------------------------------------------------
  // STREET WORKOUT STATIC STRENGTH METHOD
  // Inspired by Erik Barsi's public street workout principles
  // ---------------------------------------------------------------------------
  street_workout_static: {
    doctrineId: 'street_workout_static',
    name: 'Street Workout Static Strength',
    displayName: 'Street Static Strength Method',
    description: 'Advanced static strength bias with planche and street workout emphasis. Basics remain foundational, performance standards matter.',
    summary: 'Street workout static strength with planche emphasis and visual standards.',
    category: 'static_strength',
    primaryFocus: ['planche_development', 'front_lever_development', 'skill_variety'],
    trainingStyleBias: 'static_emphasis',
    skillFrequencyProfile: 'high_frequency',
    volumeProfile: 'moderate_volume',
    intensityProfile: 'high',
    progressionPhilosophy: 'autoregulated',
    safetyNotes: [
      'High straight-arm stress requires careful monitoring',
      'Basics support advanced static positions',
      'Quality of position matters for performance',
      'Wrist and elbow health are critical'
    ],
    movementBiasTendency: 'push_emphasis',
    compatibleFrameworks: ['skill_frequency', 'tendon_conservative'],
    bestFor: [
      'Street workout competitors',
      'Planche-focused athletes',
      'Those with solid basics foundation',
      'Athletes motivated by visual performance'
    ],
    notRecommendedFor: [
      'Beginners without push-up mastery',
      'Those with wrist or elbow issues',
      'Athletes not interested in static skills'
    ],
    keyPrinciples: [
      'Advanced statics require strong basics',
      'Position quality defines performance',
      'High bodyweight control is essential',
      'Visible standards drive motivation',
      'Straight-arm stress requires respect'
    ],
    bestUseCases: [
      'Planche progression',
      'Street workout competition prep',
      'Advanced static skill development',
      'Visual performance training'
    ],
    avoidWhen: [
      'Weak push-up foundation (under 20 strict)',
      'Active wrist or elbow pain',
      'Goal is purely functional strength',
      'No interest in static positions'
    ],
    preferredStructures: ['static_hold_blocks', 'straight_arm_blocks', 'skill_specific_blocks'],
    advancedApplicability: 'intermediate_advanced'
  },

  // ---------------------------------------------------------------------------
  // TIERED PROGRESSION ROADMAP METHOD
  // Inspired by Simonster / Project Calisthenics public methodology
  // ---------------------------------------------------------------------------
  tiered_progression_roadmap: {
    doctrineId: 'tiered_progression_roadmap',
    name: 'Tiered Progression Roadmap',
    displayName: 'Structured Roadmap Method',
    description: 'Clear beginner-to-advanced roadmap with tiered progressions, baseline testing, and prerequisite gating. Prehab and mobility integrated.',
    summary: 'Structured progression roadmap from beginner to advanced with clear prerequisites.',
    category: 'skill_acquisition',
    primaryFocus: ['skill_variety', 'full_body_calisthenics', 'general_strength'],
    trainingStyleBias: 'hybrid_emphasis',
    skillFrequencyProfile: 'moderate_frequency',
    volumeProfile: 'moderate_volume',
    intensityProfile: 'moderate',
    progressionPhilosophy: 'step_loading',
    safetyNotes: [
      'Prerequisites must be met before advancing',
      'Testing validates readiness for next tier',
      'Mobility and prehab prevent injuries',
      'Patience with the progression system'
    ],
    movementBiasTendency: 'balanced',
    compatibleFrameworks: ['balanced_hybrid', 'skill_frequency', 'tendon_conservative'],
    bestFor: [
      'Beginners needing structure',
      'Self-coached athletes',
      'Those who value clear progression paths',
      'Athletes with minimal equipment'
    ],
    notRecommendedFor: [
      'Advanced athletes needing specialization',
      'Those seeking rapid progress without structure',
      'Athletes who dislike testing protocols'
    ],
    keyPrinciples: [
      'Strong foundations before advanced skills',
      'Clear tiered progressions with testing',
      'Prerequisites gate advancement',
      'Mobility and prehab are essential',
      'Minimal equipment scalability'
    ],
    bestUseCases: [
      'Complete beginner starting calisthenics',
      'Self-coached athlete needing structure',
      'Long-term skill development planning',
      'Athletes with home gym or park training'
    ],
    avoidWhen: [
      'Advanced athlete needing specialization',
      'Competition preparation requiring specificity',
      'Athlete dislikes structured testing',
      'Very limited training time (under 2x/week)'
    ],
    preferredStructures: ['full_body_sessions', 'prehab_mobility_blocks', 'skill_specific_blocks'],
    advancedApplicability: 'beginner_intermediate'
  },

  // ---------------------------------------------------------------------------
  // BLOCK PERIODIZATION PROGRESSION METHOD
  // Inspired by Andry Strong's public 12-week block methodology
  // ---------------------------------------------------------------------------
  block_periodization_progression: {
    doctrineId: 'block_periodization_progression',
    name: 'Block Periodization Progression',
    displayName: 'Block Cycle Method',
    description: '12-week block style training with tiered progressions, progress testing, and mobility/recovery inclusion. Level-based athlete development.',
    summary: 'Structured 12-week blocks with testing, mobility, and level-based progression.',
    category: 'skill_acquisition',
    primaryFocus: ['skill_variety', 'full_body_calisthenics', 'general_strength'],
    trainingStyleBias: 'hybrid_emphasis',
    skillFrequencyProfile: 'moderate_frequency',
    volumeProfile: 'moderate_volume',
    intensityProfile: 'autoregulated',
    progressionPhilosophy: 'block_periodization',
    safetyNotes: [
      'Progress testing validates advancement',
      'Mobility work prevents injury accumulation',
      'Deload weeks are built into blocks',
      'Level must match training intensity'
    ],
    movementBiasTendency: 'balanced',
    compatibleFrameworks: ['balanced_hybrid', 'skill_frequency'],
    bestFor: [
      'Athletes who thrive with structure',
      'Those who enjoy testing progress',
      'Long-term development focused athletes',
      'Intermediate athletes building toward advanced'
    ],
    notRecommendedFor: [
      'Those who dislike rigid structures',
      'Athletes needing rapid adaptation',
      'Advanced specialists requiring custom programming'
    ],
    keyPrinciples: [
      '12-week blocks provide structure and recovery',
      'Progress testing validates readiness',
      'Mobility and recovery are programmed',
      'Strong basics before advanced skills',
      'Level-based progression prevents injury'
    ],
    bestUseCases: [
      'Intermediate athlete development',
      'Structured long-term planning',
      'Athletes returning from layoff',
      'Building toward specific skill goals'
    ],
    avoidWhen: [
      'Advanced athlete with custom needs',
      'Athlete dislikes structured testing cycles',
      'Very limited weekly training availability',
      'Seeking rapid short-term gains'
    ],
    preferredStructures: ['full_body_sessions', 'prehab_mobility_blocks', 'skill_specific_blocks', 'superset_pairings'],
    advancedApplicability: 'beginner_intermediate'
  },

  // ---------------------------------------------------------------------------
  // OTZ DENSITY CONDITIONING METHOD
  // Inspired by density-style calisthenics methodology
  // ---------------------------------------------------------------------------
  otz_density_conditioning: {
    doctrineId: 'otz_density_conditioning',
    name: 'OTZ Density Conditioning',
    displayName: 'Density Conditioning Method',
    description: 'Circuit and density-focused training with shorter rests, EMOM blocks, and repeat-effort tolerance development. Conditioning emphasis.',
    summary: 'High-density circuit training for conditioning and fatigue resistance.',
    category: 'endurance_density',
    primaryFocus: ['full_body_calisthenics', 'general_strength'],
    trainingStyleBias: 'dynamic_emphasis',
    skillFrequencyProfile: 'high_frequency',
    volumeProfile: 'density_training',
    intensityProfile: 'moderate',
    progressionPhilosophy: 'undulating',
    safetyNotes: [
      'Form degrades under fatigue - monitor closely',
      'Not ideal for tendon-heavy advanced statics',
      'Recovery between density sessions is important',
      'Nutrition must support high volume'
    ],
    movementBiasTendency: 'balanced',
    compatibleFrameworks: ['density_endurance', 'balanced_hybrid'],
    bestFor: [
      'Athletes building work capacity',
      'Those who enjoy circuit-style training',
      'Conditioning-focused athletes',
      'Time-efficient trainers'
    ],
    notRecommendedFor: [
      'Advanced static skill specialists',
      'Those with recovery limitations',
      'Athletes pursuing maximal strength'
    ],
    keyPrinciples: [
      'Density blocks improve conditioning efficiently',
      'Shorter rests build fatigue tolerance',
      'EMOM and circuits are primary structures',
      'Repeat-effort capacity transfers to skills',
      'Not suited for high tendon-stress work'
    ],
    bestUseCases: [
      'Building general work capacity',
      'Time-efficient high-volume training',
      'Muscular endurance development',
      'Conditioning for sport crossover'
    ],
    avoidWhen: [
      'Training iron cross or maltese',
      'High straight-arm stress phases',
      'Goal is maximal strength or power',
      'Active fatigue or overreaching'
    ],
    preferredStructures: ['density_blocks', 'emom_blocks', 'pyramid_ladders', 'superset_pairings'],
    advancedApplicability: 'all_levels'
  },

  // ---------------------------------------------------------------------------
  // ADVANCED RINGS TENDON CONSERVATIVE METHOD
  // For iron cross, maltese, and advanced straight-arm ring work
  // ---------------------------------------------------------------------------
  advanced_rings_conservative: {
    doctrineId: 'advanced_rings_conservative',
    name: 'Advanced Rings Tendon Conservative',
    displayName: 'Elite Rings Conservative Method',
    description: 'Ultra-conservative approach for iron cross, maltese, and advanced rings. Slow progression, mandatory prep work, frequent submaximal exposures.',
    summary: 'Conservative loading for elite-level rings and straight-arm strength.',
    category: 'static_strength',
    primaryFocus: ['ring_strength', 'planche_development'],
    trainingStyleBias: 'static_emphasis',
    skillFrequencyProfile: 'greasing_groove',
    volumeProfile: 'low_volume_high_intensity',
    intensityProfile: 'submaximal',
    progressionPhilosophy: 'step_loading',
    safetyNotes: [
      'Tendon adaptation takes months, not weeks',
      'Joint prep is mandatory before every session',
      'Never grind through pain or discomfort',
      'Prerequisites must be rock solid',
      'Progress intensity by 5% increments maximum'
    ],
    movementBiasTendency: 'push_emphasis',
    compatibleFrameworks: ['tendon_conservative'],
    bestFor: [
      'Athletes pursuing iron cross or maltese',
      'Those with years of ring experience',
      'Athletes who prioritize longevity',
      'Older athletes or those with injury history'
    ],
    notRecommendedFor: [
      'Beginners or early intermediates',
      'Those seeking rapid progress',
      'Athletes without ring competency',
      'Those unwilling to invest years'
    ],
    keyPrinciples: [
      'Slow progression protects tendons',
      'Lower straight-arm volume prevents overuse',
      'Strong prerequisites before attempting',
      'Mandatory joint prep every session',
      'Frequent submaximal exposure over reckless overload'
    ],
    bestUseCases: [
      'Iron cross long-term development',
      'Maltese progression',
      'Advanced planche on rings',
      'Sustainable elite rings training'
    ],
    avoidWhen: [
      'Beginner or intermediate level',
      'Seeking rapid gains',
      'No ring training background',
      'Impatient with slow progression'
    ],
    preferredStructures: ['ring_support_progressions', 'straight_arm_blocks', 'prehab_mobility_blocks', 'static_hold_blocks'],
    advancedApplicability: 'advanced_only'
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
