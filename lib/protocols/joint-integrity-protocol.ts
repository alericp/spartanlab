/**
 * Joint Integrity Protocol System
 * 
 * Modular injury prevention protocols for calisthenics training.
 * Integrates with warm-up generation, readiness engine, and skill roadmaps.
 * 
 * Design Principles:
 * - 3-5 exercises per protocol (focused, not fatiguing)
 * - 2-5 minute duration (efficient, not exhaustive)
 * - Prioritizes durability over conditioning
 * - Integrates seamlessly with adaptive training
 */

import type { JointCaution } from '../athlete-profile'

// =============================================================================
// TYPES
// =============================================================================

export type JointRegion = 
  | 'wrist'
  | 'elbow'
  | 'shoulder'
  | 'scapula'
  | 'hip'
  | 'knee'
  | 'ankle'
  | 'thoracic'  // Future extensibility
  | 'neck'      // Future extensibility
  | 'finger'    // Future extensibility

export type ActivationType = 
  | 'warmup'      // Pre-session prep
  | 'prehab'      // Injury prevention routine
  | 'recovery'    // Post-session or off-day work

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced'

export type SkillRelevance = 
  | 'planche'
  | 'front_lever'
  | 'back_lever'
  | 'muscle_up'
  | 'handstand_pushup'
  | 'handstand'
  | 'pistol_squat'
  | 'l_sit'
  | 'v_sit'
  | 'iron_cross'
  | 'general_pushing'
  | 'general_pulling'
  | 'general_compression'

export interface ProtocolExercise {
  name: string
  prescription: string // e.g., "10 each direction", "15s hold", "8 reps"
  notes?: string
  equipmentRequired?: string[]
}

export interface JointIntegrityProtocol {
  id: string
  jointRegion: JointRegion
  name: string
  exercises: ProtocolExercise[]
  recommendedFrequency: string
  durationMinutes: number
  purpose: string
  coachingNotes: string
  activationType: ActivationType
  difficultyLevel: DifficultyLevel
  skillRelevance: SkillRelevance[]
  // SEO fields
  seoSlug: string
  seoTitle: string
  seoDescription: string
}

// Map from AthleteProfile JointCaution to our JointRegion
export const JOINT_CAUTION_TO_REGION: Record<JointCaution, JointRegion> = {
  'shoulders': 'shoulder',
  'elbows': 'elbow',
  'wrists': 'wrist',
  'lower_back': 'thoracic', // Closest match
  'knees': 'knee',
}

export const JOINT_REGION_LABELS: Record<JointRegion, string> = {
  wrist: 'Wrist',
  elbow: 'Elbow',
  shoulder: 'Shoulder',
  scapula: 'Scapula',
  hip: 'Hip',
  knee: 'Knee',
  ankle: 'Ankle',
  thoracic: 'Thoracic Spine',
  neck: 'Neck',
  finger: 'Finger/Hand',
}

// =============================================================================
// PROTOCOL DEFINITIONS
// =============================================================================

export const JOINT_INTEGRITY_PROTOCOLS: JointIntegrityProtocol[] = [
  // ==========================================================================
  // WRIST PROTOCOLS
  // ==========================================================================
  {
    id: 'wrist_integrity_protocol',
    jointRegion: 'wrist',
    name: 'Wrist Integrity Protocol',
    exercises: [
      { name: 'Wrist Circles', prescription: '10 each direction', notes: 'Slow, controlled circles' },
      { name: 'Palm Pulses', prescription: '15 reps', notes: 'Fingers forward, then fingers back' },
      { name: 'Fingertip Push-Up Hold', prescription: '2 x 10s', notes: 'On knees if needed' },
      { name: 'Wrist Flexor Stretch', prescription: '30s each side', notes: 'Arm straight, gentle pressure' },
    ],
    recommendedFrequency: 'Before every pushing session',
    durationMinutes: 3,
    purpose: 'Improve wrist durability and extension tolerance for planche, handstand, and push-based training.',
    coachingNotes: 'Essential for anyone training push skills. Never skip wrist prep before straight-arm pushing work.',
    activationType: 'warmup',
    difficultyLevel: 'beginner',
    skillRelevance: ['planche', 'handstand_pushup', 'handstand', 'l_sit', 'general_pushing'],
    seoSlug: 'wrist-integrity-calisthenics',
    seoTitle: 'Wrist Integrity Protocol for Calisthenics | Planche & Handstand Prep',
    seoDescription: 'Protect your wrists for calisthenics training. Essential prep for planche, handstand push-ups, and pushing skills. 3-minute injury prevention routine.',
  },

  // ==========================================================================
  // ELBOW PROTOCOLS
  // ==========================================================================
  {
    id: 'elbow_tendon_health_protocol',
    jointRegion: 'elbow',
    name: 'Elbow Tendon Health Protocol',
    exercises: [
      { name: 'Bicep Curls (Light)', prescription: '15 reps', notes: 'Very light weight, full ROM' },
      { name: 'Tricep Extensions (Light)', prescription: '15 reps', notes: 'Band or light weight' },
      { name: 'Pronation/Supination', prescription: '10 each', notes: 'Rotate forearm slowly', equipmentRequired: ['light dumbbell'] },
      { name: 'Elbow Circles', prescription: '10 each direction', notes: 'Hands on shoulders' },
    ],
    recommendedFrequency: 'Before pulling sessions or 2-3x per week',
    durationMinutes: 4,
    purpose: 'Maintain elbow tendon health and prevent climber elbow / golfers elbow from high-volume pulling.',
    coachingNotes: 'Critical for anyone doing high volume pull-ups or muscle-up training. Blood flow promotes tendon recovery.',
    activationType: 'warmup',
    difficultyLevel: 'beginner',
    skillRelevance: ['muscle_up', 'front_lever', 'back_lever', 'iron_cross', 'general_pulling'],
    seoSlug: 'elbow-tendon-health-calisthenics',
    seoTitle: 'Elbow Tendon Health Protocol | Prevent Calisthenics Elbow Pain',
    seoDescription: 'Prevent elbow tendinitis from pull-ups, muscle-ups, and lever training. 4-minute protocol for long-term tendon health.',
  },

  // ==========================================================================
  // SHOULDER PROTOCOLS
  // ==========================================================================
  {
    id: 'shoulder_stability_protocol',
    jointRegion: 'shoulder',
    name: 'Shoulder Stability Protocol',
    exercises: [
      { name: 'Band Pull-Aparts', prescription: '15 reps', notes: 'Squeeze shoulder blades together' },
      { name: 'External Rotation', prescription: '10 each side', notes: 'Elbow at 90 degrees', equipmentRequired: ['resistance band'] },
      { name: 'Wall Slides', prescription: '10 reps', notes: 'Full range, controlled tempo' },
      { name: 'Shoulder Dislocates', prescription: '10 reps', notes: 'Wide grip band or stick', equipmentRequired: ['band', 'stick'] },
    ],
    recommendedFrequency: 'Before every upper body session',
    durationMinutes: 4,
    purpose: 'Build rotator cuff stability and shoulder health for overhead and horizontal movements.',
    coachingNotes: 'Shoulders take years to injure and years to heal. Invest 4 minutes now to save months of rehab later.',
    activationType: 'warmup',
    difficultyLevel: 'beginner',
    skillRelevance: ['planche', 'front_lever', 'back_lever', 'muscle_up', 'handstand_pushup', 'handstand', 'general_pushing', 'general_pulling'],
    seoSlug: 'shoulder-stability-calisthenics',
    seoTitle: 'Shoulder Stability Protocol for Calisthenics | Injury Prevention',
    seoDescription: 'Build bulletproof shoulders for advanced calisthenics. Rotator cuff and stability work for planche, levers, and muscle-ups.',
  },

  // ==========================================================================
  // SCAPULAR PROTOCOLS
  // ==========================================================================
  {
    id: 'scapular_control_protocol',
    jointRegion: 'scapula',
    name: 'Scapular Control Protocol',
    exercises: [
      { name: 'Scap Push-Ups', prescription: '10 reps', notes: 'Protract and retract only' },
      { name: 'Scap Pull-Ups', prescription: '8 reps', notes: 'Depress and elevate only', equipmentRequired: ['pull_bar'] },
      { name: 'Prone Y Raises', prescription: '10 reps', notes: 'Arms at 45 degrees, thumbs up' },
      { name: 'Wall Angels', prescription: '10 reps', notes: 'Back flat against wall' },
    ],
    recommendedFrequency: 'Before skill training sessions',
    durationMinutes: 4,
    purpose: 'Improve scapular awareness and control for front lever, back lever, and advanced pulling skills.',
    coachingNotes: 'Scapular control is the foundation of lever strength. Athletes plateau without proper scap awareness.',
    activationType: 'warmup',
    difficultyLevel: 'intermediate',
    skillRelevance: ['front_lever', 'back_lever', 'planche', 'muscle_up', 'general_pulling'],
    seoSlug: 'scapular-control-calisthenics',
    seoTitle: 'Scapular Control Protocol | Front Lever & Planche Prep',
    seoDescription: 'Master scapular control for front lever, back lever, and planche training. 4-minute activation routine.',
  },

  // ==========================================================================
  // HIP PROTOCOLS
  // ==========================================================================
  {
    id: 'hip_compression_protocol',
    jointRegion: 'hip',
    name: 'Hip Compression Mobility Protocol',
    exercises: [
      { name: 'Seated Pike Pulses', prescription: '20 reps', notes: 'Slight bounce at end range' },
      { name: 'Standing Pike Holds', prescription: '3 x 15s', notes: 'Actively pull torso to legs' },
      { name: 'Active Leg Raises', prescription: '10 each leg', notes: 'Control the negative' },
      { name: 'Frog Pose Hold', prescription: '30s', notes: 'Gentle hip opener' },
    ],
    recommendedFrequency: 'Before compression or L-sit training',
    durationMinutes: 4,
    purpose: 'Develop hip flexor strength and compression ability for L-sit, V-sit, and pike movements.',
    coachingNotes: 'Compression is a skill, not just flexibility. Active work builds both strength and range.',
    activationType: 'warmup',
    difficultyLevel: 'intermediate',
    skillRelevance: ['l_sit', 'v_sit', 'general_compression', 'planche'],
    seoSlug: 'hip-compression-mobility',
    seoTitle: 'Hip Compression Mobility Protocol | L-Sit & V-Sit Prep',
    seoDescription: 'Improve hip compression for L-sit, V-sit, and pike skills. 4-minute protocol for calisthenics athletes.',
  },

  // ==========================================================================
  // KNEE PROTOCOLS
  // ==========================================================================
  {
    id: 'knee_stability_protocol',
    jointRegion: 'knee',
    name: 'Knee Stability Protocol',
    exercises: [
      { name: 'Terminal Knee Extensions', prescription: '15 each leg', notes: 'Band around knee', equipmentRequired: ['resistance band'] },
      { name: 'Single Leg Balance', prescription: '30s each leg', notes: 'Eyes closed for challenge' },
      { name: 'Wall Sit Hold', prescription: '30s', notes: 'Thighs parallel' },
      { name: 'Step Downs', prescription: '8 each leg', notes: 'Slow, controlled descent' },
    ],
    recommendedFrequency: 'Before single-leg or squat-heavy sessions',
    durationMinutes: 4,
    purpose: 'Build knee stability and VMO strength for pistol squats and single-leg work.',
    coachingNotes: 'Knee health enables longevity in lower body training. Never rush single-leg progressions.',
    activationType: 'warmup',
    difficultyLevel: 'beginner',
    skillRelevance: ['pistol_squat'],
    seoSlug: 'knee-stability-calisthenics',
    seoTitle: 'Knee Stability Protocol for Calisthenics | Pistol Squat Prep',
    seoDescription: 'Build bulletproof knees for pistol squats and single-leg training. 4-minute knee stability routine.',
  },

  // ==========================================================================
  // ANKLE PROTOCOLS
  // ==========================================================================
  {
    id: 'ankle_mobility_protocol',
    jointRegion: 'ankle',
    name: 'Ankle Mobility Protocol',
    exercises: [
      { name: 'Ankle Circles', prescription: '10 each direction', notes: 'Full range circles' },
      { name: 'Wall Ankle Stretch', prescription: '30s each side', notes: 'Knee tracks over toe' },
      { name: 'Calf Raises', prescription: '15 reps', notes: 'Full ROM, slow negative' },
      { name: 'Toe Walks', prescription: '20 steps', notes: 'High on balls of feet' },
    ],
    recommendedFrequency: 'Before squat or pistol work',
    durationMinutes: 3,
    purpose: 'Improve ankle dorsiflexion and stability for deep squats and pistol squat training.',
    coachingNotes: 'Ankle mobility is often the limiting factor in pistol squats. Address it early.',
    activationType: 'warmup',
    difficultyLevel: 'beginner',
    skillRelevance: ['pistol_squat'],
    seoSlug: 'ankle-mobility-calisthenics',
    seoTitle: 'Ankle Mobility Protocol for Calisthenics | Squat & Pistol Prep',
    seoDescription: 'Improve ankle mobility for deep squats and pistol squats. 3-minute calisthenics ankle prep routine.',
  },
]

// =============================================================================
// PROTOCOL LOOKUP FUNCTIONS
// =============================================================================

/**
 * Get a protocol by ID
 */
export function getProtocolById(id: string): JointIntegrityProtocol | undefined {
  return JOINT_INTEGRITY_PROTOCOLS.find(p => p.id === id)
}

/**
 * Get a protocol by SEO slug
 */
export function getProtocolBySlug(slug: string): JointIntegrityProtocol | undefined {
  return JOINT_INTEGRITY_PROTOCOLS.find(p => p.seoSlug === slug)
}

/**
 * Get all protocols for a specific joint region
 */
export function getProtocolsForRegion(region: JointRegion): JointIntegrityProtocol[] {
  return JOINT_INTEGRITY_PROTOCOLS.filter(p => p.jointRegion === region)
}

/**
 * Get protocols relevant to a specific skill
 */
export function getProtocolsForSkill(skill: SkillRelevance): JointIntegrityProtocol[] {
  return JOINT_INTEGRITY_PROTOCOLS.filter(p => p.skillRelevance.includes(skill))
}

/**
 * Get protocols relevant to multiple skills (union)
 */
export function getProtocolsForSkills(skills: SkillRelevance[]): JointIntegrityProtocol[] {
  return JOINT_INTEGRITY_PROTOCOLS.filter(p => 
    skills.some(skill => p.skillRelevance.includes(skill))
  )
}

/**
 * Get protocols for athlete joint cautions
 */
export function getProtocolsForCautions(cautions: JointCaution[]): JointIntegrityProtocol[] {
  const regions = cautions.map(c => JOINT_CAUTION_TO_REGION[c])
  return JOINT_INTEGRITY_PROTOCOLS.filter(p => regions.includes(p.jointRegion))
}

/**
 * Get all protocol SEO slugs for static generation
 */
export function getAllProtocolSlugs(): string[] {
  return JOINT_INTEGRITY_PROTOCOLS.map(p => p.seoSlug)
}

// =============================================================================
// WARM-UP INTEGRATION
// =============================================================================

export interface ProtocolRecommendation {
  protocol: JointIntegrityProtocol
  reason: string
  priority: 'required' | 'recommended' | 'optional'
}

/**
 * Recommend protocols for a training session based on primary goal
 * Returns max 2 protocols to prevent warm-up overload
 */
export function recommendProtocolsForSession(
  primaryGoal: string | null,
  jointCautions?: JointCaution[]
): ProtocolRecommendation[] {
  const recommendations: ProtocolRecommendation[] = []
  
  // Map goal to skill relevance
  const goalToSkill: Record<string, SkillRelevance> = {
    'planche': 'planche',
    'front_lever': 'front_lever',
    'back_lever': 'back_lever',
    'muscle_up': 'muscle_up',
    'handstand_pushup': 'handstand_pushup',
    'handstand': 'handstand',
    'l_sit': 'l_sit',
    'v_sit': 'v_sit',
    'skill': 'general_pushing',
    'strength': 'general_pulling',
    'general': 'general_pushing',
  }
  
  const skill = primaryGoal ? goalToSkill[primaryGoal] : undefined
  
  // Add caution-based protocols first (required)
  if (jointCautions && jointCautions.length > 0) {
    const cautionProtocols = getProtocolsForCautions(jointCautions)
    cautionProtocols.slice(0, 1).forEach(protocol => {
      recommendations.push({
        protocol,
        reason: `Recommended for ${JOINT_REGION_LABELS[protocol.jointRegion].toLowerCase()} caution`,
        priority: 'required',
      })
    })
  }
  
  // Add skill-based protocols
  if (skill) {
    const skillProtocols = getProtocolsForSkill(skill)
    
    // For pushing skills, always recommend wrist
    if (['planche', 'handstand_pushup', 'handstand', 'l_sit', 'general_pushing'].includes(skill)) {
      const wristProtocol = getProtocolById('wrist_integrity_protocol')
      if (wristProtocol && !recommendations.some(r => r.protocol.id === wristProtocol.id)) {
        recommendations.push({
          protocol: wristProtocol,
          reason: 'Wrist prep recommended for pushing skills',
          priority: 'recommended',
        })
      }
    }
    
    // For pulling skills, recommend scapular and shoulder work
    if (['front_lever', 'back_lever', 'muscle_up', 'general_pulling'].includes(skill)) {
      const scapProtocol = getProtocolById('scapular_control_protocol')
      if (scapProtocol && !recommendations.some(r => r.protocol.id === scapProtocol.id)) {
        recommendations.push({
          protocol: scapProtocol,
          reason: 'Scapular control recommended for lever/pulling skills',
          priority: 'recommended',
        })
      }
    }
    
    // For compression work
    if (['l_sit', 'v_sit', 'general_compression'].includes(skill)) {
      const hipProtocol = getProtocolById('hip_compression_protocol')
      if (hipProtocol && !recommendations.some(r => r.protocol.id === hipProtocol.id)) {
        recommendations.push({
          protocol: hipProtocol,
          reason: 'Hip compression prep recommended for L-sit/V-sit work',
          priority: 'recommended',
        })
      }
    }
  }
  
  // Limit to max 2 protocols
  return recommendations.slice(0, 2)
}

/**
 * Generate coaching explanation for protocol inclusion
 */
export function generateProtocolExplanation(recommendation: ProtocolRecommendation): string {
  const { protocol, reason } = recommendation
  return `${protocol.name} added: ${reason}.`
}
