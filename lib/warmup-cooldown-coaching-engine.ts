/**
 * Warm-Up / Cool-Down Elite Coaching Engine
 * 
 * PPX-R7.7: Generates elite AI-coach-style visible coaching context for
 * warm-up and cool-down phases. This module derives session-specific
 * coaching depth from real session truth.
 * 
 * DESIGN PRINCIPLES:
 * 1. All coaching must be derived from actual session data (no fake/generic copy)
 * 2. Coaching should feel specific to today's workout
 * 3. Joint/skill demands must reflect what the athlete is actually training
 * 4. "If short on time" guidance must preserve highest-risk prep first
 * 5. Internal math stays raw; user-facing display uses integer RPE
 */

import type { WorkoutExerciseContract } from './contracts/workout-session-contract'

// =============================================================================
// TYPES
// =============================================================================

/** Session demand category for coaching analysis */
export type SessionDemandCategory =
  | 'straight_arm_push'    // planche, planche lean, pseudo planche
  | 'straight_arm_pull'    // front lever, back lever
  | 'handstand'            // handstand, HSPU
  | 'weighted_pull'        // weighted pull-ups, weighted chin-ups
  | 'weighted_push'        // weighted dips, weighted push-ups
  | 'explosive_pull'       // explosive pull-ups, muscle-up power work
  | 'muscle_up'            // muscle-up, ring muscle-up
  | 'ring_work'            // ring support, ring dips, RTO work
  | 'compression_core'     // L-sit, V-sit, dragon flag
  | 'flexibility'          // pike, pancake, splits work
  | 'pulling_general'      // pull-ups, rows
  | 'pushing_general'      // push-ups, dips

/** Joint focus area */
export type JointFocusArea =
  | 'wrists'
  | 'elbows'
  | 'shoulders'
  | 'scapula'
  | 'thoracic_spine'
  | 'hip_flexors'
  | 'hamstrings'
  | 'lower_back'
  | 'forearms'

/** Session demand analysis result */
export interface SessionDemandAnalysis {
  /** Primary demand categories detected */
  primaryDemands: SessionDemandCategory[]
  /** Joint areas under significant load */
  jointFocusAreas: JointFocusArea[]
  /** Whether session has high tendon stress */
  hasTendonStress: boolean
  /** Whether session has weighted work requiring ramp-up */
  hasWeightedWork: boolean
  /** Whether session has skill work requiring neural prep */
  hasSkillWork: boolean
  /** Highest-risk movements that need priority prep */
  highRiskMovements: string[]
  /** Summary label for the session demands */
  demandSummaryLabel: string
}

/** Per-item coaching context */
export interface WarmUpItemCoaching {
  /** Why this item matters for today's session */
  sessionReason: string
  /** Which joints/areas it prepares */
  prepares: string
  /** Brief coaching cue */
  coachingCue?: string
  /** Priority level (1=essential, 2=important, 3=optional) */
  priority: 1 | 2 | 3
}

/** Per-item coaching context for cool-down */
export interface CoolDownItemCoaching {
  /** Why this item helps recovery from today's session */
  recoveryReason: string
  /** What it helps recover from */
  recoversFrom: string
  /** Brief coaching cue */
  coachingCue?: string
  /** Priority level (1=essential, 2=important, 3=optional) */
  priority: 1 | 2 | 3
}

/** Overall warm-up coaching context */
export interface WarmUpCoachingContext {
  /** Session-specific focus header */
  focusHeader: string
  /** AI coach focus summary */
  coachFocusSummary: string
  /** Joint areas being prepared */
  jointPrepSummary: string[]
  /** "If short on time" guidance */
  shortTimeGuidance: string
  /** Ramp-up advisory for weighted/skill work */
  rampUpAdvisory?: string
  /** Per-item coaching */
  itemCoaching: Map<string, WarmUpItemCoaching>
}

/** Overall cool-down coaching context */
export interface CoolDownCoachingContext {
  /** Session-specific focus header */
  focusHeader: string
  /** AI coach recovery summary */
  coachRecoverySummary: string
  /** Body regions being addressed */
  regionSummary: string[]
  /** "If short on time" guidance */
  shortTimeGuidance: string
  /** Per-item coaching */
  itemCoaching: Map<string, CoolDownItemCoaching>
}

// =============================================================================
// SESSION DEMAND DETECTION
// =============================================================================

/** Keyword patterns for demand detection */
const DEMAND_PATTERNS: Record<SessionDemandCategory, RegExp[]> = {
  straight_arm_push: [
    /planche/i, /pseudo.*planche/i, /lean.*push/i, /maltese/i,
  ],
  straight_arm_pull: [
    /front.*lever/i, /back.*lever/i, /fl_/i, /bl_/i,
  ],
  handstand: [
    /handstand/i, /hspu/i, /pike.*push/i, /wall.*walk/i,
  ],
  weighted_pull: [
    /weighted.*pull/i, /weighted.*chin/i, /\+.*kg.*pull/i, /\+.*lb.*pull/i,
  ],
  weighted_push: [
    /weighted.*dip/i, /weighted.*push/i, /\+.*kg.*dip/i, /\+.*lb.*dip/i,
  ],
  explosive_pull: [
    /explosive.*pull/i, /power.*pull/i, /high.*pull/i, /clapping.*pull/i,
  ],
  muscle_up: [
    /muscle.*up/i, /mu_/i, /transition/i,
  ],
  ring_work: [
    /ring.*support/i, /ring.*dip/i, /rto/i, /rings.*turned/i, /ring.*push/i,
  ],
  compression_core: [
    /l.*sit/i, /v.*sit/i, /dragon.*flag/i, /compression/i, /pike.*compression/i,
  ],
  flexibility: [
    /pancake/i, /pike.*stretch/i, /split/i, /straddle.*stretch/i,
  ],
  pulling_general: [
    /pull.*up/i, /chin.*up/i, /row/i, /horizontal.*pull/i,
  ],
  pushing_general: [
    /push.*up/i, /dip(?!.*weighted)/i, /horizontal.*push/i,
  ],
}

/** Joint demands by category */
const CATEGORY_JOINT_DEMANDS: Record<SessionDemandCategory, JointFocusArea[]> = {
  straight_arm_push: ['wrists', 'shoulders', 'scapula', 'elbows', 'forearms'],
  straight_arm_pull: ['elbows', 'shoulders', 'scapula', 'forearms'],
  handstand: ['wrists', 'shoulders', 'scapula'],
  weighted_pull: ['elbows', 'shoulders', 'forearms'],
  weighted_push: ['shoulders', 'elbows'],
  explosive_pull: ['elbows', 'shoulders', 'forearms'],
  muscle_up: ['elbows', 'shoulders', 'wrists'],
  ring_work: ['shoulders', 'elbows', 'scapula'],
  compression_core: ['hip_flexors', 'hamstrings', 'lower_back'],
  flexibility: ['hip_flexors', 'hamstrings', 'lower_back'],
  pulling_general: ['shoulders', 'elbows'],
  pushing_general: ['shoulders', 'elbows', 'wrists'],
}

/** Categories with high tendon stress */
const HIGH_TENDON_STRESS_CATEGORIES: SessionDemandCategory[] = [
  'straight_arm_push',
  'straight_arm_pull',
  'weighted_pull',
  'weighted_push',
  'ring_work',
  'explosive_pull',
]

/**
 * Analyze session demands from exercises
 */
export function analyzeSessionDemands(
  exercises: Array<{ id?: string; name?: string; category?: string }>
): SessionDemandAnalysis {
  const detectedDemands = new Set<SessionDemandCategory>()
  const jointFocusAreas = new Set<JointFocusArea>()
  const highRiskMovements: string[] = []
  
  for (const ex of exercises) {
    const name = ex.name || ''
    const id = ex.id || ''
    const searchString = `${name} ${id}`.toLowerCase()
    
    // Check each demand pattern
    for (const [category, patterns] of Object.entries(DEMAND_PATTERNS) as [SessionDemandCategory, RegExp[]][]) {
      if (patterns.some(p => p.test(searchString))) {
        detectedDemands.add(category)
        
        // Add joint demands
        const joints = CATEGORY_JOINT_DEMANDS[category] || []
        joints.forEach(j => jointFocusAreas.add(j))
        
        // Track high-risk movements
        if (['straight_arm_push', 'straight_arm_pull', 'weighted_pull', 'weighted_push'].includes(category)) {
          if (!highRiskMovements.includes(name)) {
            highRiskMovements.push(name)
          }
        }
      }
    }
  }
  
  const primaryDemands = Array.from(detectedDemands)
  const hasTendonStress = primaryDemands.some(d => HIGH_TENDON_STRESS_CATEGORIES.includes(d))
  const hasWeightedWork = primaryDemands.some(d => d.includes('weighted'))
  const hasSkillWork = primaryDemands.some(d => 
    ['straight_arm_push', 'straight_arm_pull', 'handstand', 'muscle_up', 'ring_work'].includes(d)
  )
  
  // Build summary label
  const demandSummaryLabel = buildDemandSummaryLabel(primaryDemands)
  
  return {
    primaryDemands,
    jointFocusAreas: Array.from(jointFocusAreas),
    hasTendonStress,
    hasWeightedWork,
    hasSkillWork,
    highRiskMovements: highRiskMovements.slice(0, 3),
    demandSummaryLabel,
  }
}

function buildDemandSummaryLabel(demands: SessionDemandCategory[]): string {
  if (demands.length === 0) return 'General Strength'
  
  // Priority order for labeling
  if (demands.includes('straight_arm_push')) {
    if (demands.includes('straight_arm_pull')) return 'Planche + Lever'
    if (demands.includes('handstand')) return 'Planche + Handstand'
    return 'Planche'
  }
  if (demands.includes('straight_arm_pull')) {
    if (demands.includes('pulling_general')) return 'Front Lever + Pull'
    return 'Front Lever'
  }
  if (demands.includes('handstand')) return 'Handstand'
  if (demands.includes('muscle_up')) return 'Muscle-Up'
  if (demands.includes('weighted_pull') && demands.includes('weighted_push')) return 'Weighted Strength'
  if (demands.includes('weighted_pull')) return 'Weighted Pull'
  if (demands.includes('weighted_push')) return 'Weighted Push'
  if (demands.includes('ring_work')) return 'Ring Strength'
  if (demands.includes('compression_core')) return 'Compression'
  if (demands.includes('explosive_pull')) return 'Explosive Pull'
  if (demands.includes('pulling_general') && demands.includes('pushing_general')) return 'Push + Pull'
  if (demands.includes('pulling_general')) return 'Pull Strength'
  if (demands.includes('pushing_general')) return 'Push Strength'
  
  return 'Calisthenics'
}

// =============================================================================
// WARM-UP COACHING GENERATION
// =============================================================================

/** Joint prep reasons by joint area */
const JOINT_PREP_REASONS: Record<JointFocusArea, string> = {
  wrists: 'Wrist extension and stability for loaded hand positions',
  elbows: 'Elbow tendon prep for straight-arm and pulling stress',
  shoulders: 'Shoulder joint mobility and rotator cuff activation',
  scapula: 'Scapular control for pressing and pulling patterns',
  thoracic_spine: 'Thoracic mobility for overhead and pulling positions',
  hip_flexors: 'Hip flexor activation for compression and lever work',
  hamstrings: 'Hamstring length for compression and flexibility',
  lower_back: 'Spine stability and extension tolerance',
  forearms: 'Grip and forearm tendon preparation',
}

/** Short time guidance by demand category */
const SHORT_TIME_GUIDANCE: Record<SessionDemandCategory, string> = {
  straight_arm_push: 'Keep wrist prep + scapular activation; skip general mobility.',
  straight_arm_pull: 'Keep elbow prep + scapular pulls; skip general stretching.',
  handstand: 'Keep wrist prep + shoulder activation; skip thoracic work.',
  weighted_pull: 'Keep light warm-up sets + elbow prep; skip accessory activation.',
  weighted_push: 'Keep light warm-up sets + shoulder activation; skip general mobility.',
  explosive_pull: 'Keep shoulder/elbow prep + 2-3 explosive primers; skip stretching.',
  muscle_up: 'Keep transition drills + shoulder prep; skip general mobility.',
  ring_work: 'Keep ring support hold + shoulder prep; skip floor work.',
  compression_core: 'Keep hip flexor activation + hollow hold; skip stretching.',
  flexibility: 'Keep active stretches; skip passive holds if rushed.',
  pulling_general: 'Keep scapular pulls + light row reps; skip activation drills.',
  pushing_general: 'Keep scapular push-ups + light pressing; skip stretching.',
}

/**
 * Generate elite warm-up coaching context
 */
export function generateWarmUpCoaching(
  exercises: Array<{ id?: string; name?: string; category?: string }>,
  warmupItems: Array<{ name?: string; id?: string }>
): WarmUpCoachingContext {
  const demands = analyzeSessionDemands(exercises)
  
  // Build focus header
  const focusHeader = demands.demandSummaryLabel
    ? `Warm-Up for ${demands.demandSummaryLabel}`
    : 'General Warm-Up'
  
  // Build coach focus summary
  const coachFocusSummary = buildCoachFocusSummary(demands)
  
  // Build joint prep summary
  const jointPrepSummary = demands.jointFocusAreas
    .slice(0, 4)
    .map(j => JOINT_PREP_REASONS[j] || formatJointName(j))
  
  // Build short time guidance
  const shortTimeGuidance = buildShortTimeGuidance(demands)
  
  // Build ramp-up advisory
  const rampUpAdvisory = buildRampUpAdvisory(demands)
  
  // Build per-item coaching
  const itemCoaching = new Map<string, WarmUpItemCoaching>()
  for (const item of warmupItems) {
    const itemName = item.name || item.id || ''
    const coaching = generateItemWarmUpCoaching(itemName, demands)
    itemCoaching.set(itemName, coaching)
  }
  
  return {
    focusHeader,
    coachFocusSummary,
    jointPrepSummary,
    shortTimeGuidance,
    rampUpAdvisory,
    itemCoaching,
  }
}

function buildCoachFocusSummary(demands: SessionDemandAnalysis): string {
  const parts: string[] = []
  
  if (demands.jointFocusAreas.includes('wrists')) {
    parts.push('wrist prep')
  }
  if (demands.jointFocusAreas.includes('elbows') && demands.hasTendonStress) {
    parts.push('elbow tendon warm-up')
  }
  if (demands.jointFocusAreas.includes('shoulders')) {
    parts.push('shoulder activation')
  }
  if (demands.jointFocusAreas.includes('scapula')) {
    parts.push('scapular control')
  }
  if (demands.jointFocusAreas.includes('hip_flexors')) {
    parts.push('hip flexor activation')
  }
  
  if (parts.length === 0) {
    return 'General joint prep and movement activation'
  }
  
  // Format: "Focused on wrist prep, shoulder activation, and scapular control"
  if (parts.length === 1) return `Focused on ${parts[0]}`
  if (parts.length === 2) return `Focused on ${parts[0]} and ${parts[1]}`
  const last = parts.pop()
  return `Focused on ${parts.join(', ')}, and ${last}`
}

function buildShortTimeGuidance(demands: SessionDemandAnalysis): string {
  // Use the highest-priority demand for guidance
  for (const category of demands.primaryDemands) {
    if (SHORT_TIME_GUIDANCE[category]) {
      return SHORT_TIME_GUIDANCE[category]
    }
  }
  return 'Keep joint prep for highest-stress movements; skip general stretching.'
}

function buildRampUpAdvisory(demands: SessionDemandAnalysis): string | undefined {
  if (demands.hasWeightedWork) {
    return 'Do 1-2 lighter warm-up sets before your working weight. Skip straight to working load only if time-critical and you feel fully ready.'
  }
  if (demands.hasSkillWork && demands.hasTendonStress) {
    return 'Progress through easier shapes before your target progression. Do not start at your hardest variation cold.'
  }
  return undefined
}

function generateItemWarmUpCoaching(
  itemName: string,
  demands: SessionDemandAnalysis
): WarmUpItemCoaching {
  const nameLower = itemName.toLowerCase()
  
  // [AB15.6] Arm swings / circles / crosses - specific shoulder temperature reason
  if (nameLower.includes('arm') && (nameLower.includes('swing') || nameLower.includes('circle') || nameLower.includes('cross'))) {
    return {
      sessionReason: 'Raises shoulder temperature and opens range before loaded upper-body work.',
      prepares: 'shoulders and upper-back rhythm',
      coachingCue: 'Controlled circles, gradually increase range.',
      priority: 2,
    }
  }
  
  // Wrist work
  if (nameLower.includes('wrist')) {
    const prepares = demands.primaryDemands.includes('straight_arm_push')
      ? 'wrists for planche/straight-arm loading'
      : demands.primaryDemands.includes('handstand')
        ? 'wrists for handstand positions'
        : 'wrist extension and flexion'
    return {
      sessionReason: 'Essential prep for loaded hand positions.',
      prepares,
      coachingCue: 'Slow, controlled movements. Feel the wrists warm before loading.',
      priority: demands.jointFocusAreas.includes('wrists') ? 1 : 2,
    }
  }
  
  // Shoulder/dislocates
  if (nameLower.includes('shoulder') || nameLower.includes('dislocate')) {
    return {
      sessionReason: 'Shoulder mobility and rotator cuff prep.',
      prepares: 'shoulder joint and rotator cuff',
      coachingCue: 'Wide grip, controlled tempo. Feel the stretch, no forcing.',
      priority: demands.jointFocusAreas.includes('shoulders') ? 1 : 2,
    }
  }
  
  // [AB15.6] Scapular work - improved reasons
  if (nameLower.includes('scap')) {
    const isPull = demands.primaryDemands.some(d => d.includes('pull') || d.includes('lever'))
    const isPush = demands.primaryDemands.some(d => d.includes('push') || d.includes('planche'))
    return {
      sessionReason: isPull
        ? 'Scapular control for pulling and straight-arm work.'
        : isPush
          ? 'Primes scapular protraction for planche and push-up mechanics.'
          : 'Builds scapular control before upper-body loading.',
      prepares: isPull ? 'scapula for depression and retraction' : 'serratus and scapular protraction',
      coachingCue: 'Full range. Feel the shoulder blades move.',
      priority: demands.jointFocusAreas.includes('scapula') ? 1 : 2,
    }
  }
  
  // Hollow/arch body
  if (nameLower.includes('hollow') || nameLower.includes('arch')) {
    return {
      sessionReason: 'Core activation for skill work and body tension.',
      prepares: 'core engagement pattern for levers and holds',
      coachingCue: 'Posterior pelvic tilt, ribs down, squeeze everything.',
      priority: demands.hasSkillWork ? 1 : 2,
    }
  }
  
  // [AB15.6] Band work - specific to pull aparts vs general band
  if (nameLower.includes('band')) {
    if (nameLower.includes('pull') || nameLower.includes('apart')) {
      return {
        sessionReason: 'Activates upper back and lightly warms elbows before pull strength.',
        prepares: 'rear delts, scapular retraction, elbow tendons',
        coachingCue: 'Light resistance, squeeze at end range.',
        priority: demands.hasTendonStress ? 1 : 2,
      }
    }
    return {
      sessionReason: 'Light tendon prep and muscle activation.',
      prepares: 'tendons and small stabilizers',
      coachingCue: 'Light resistance, high reps. Feel the blood flow.',
      priority: demands.hasTendonStress ? 2 : 3,
    }
  }
  
  // Hip flexor work
  if (nameLower.includes('hip') || nameLower.includes('lunge')) {
    return {
      sessionReason: 'Opens hip flexors for compression and lever work.',
      prepares: 'hip flexors and hip mobility',
      coachingCue: 'Squeeze the back glute, sink gently.',
      priority: demands.jointFocusAreas.includes('hip_flexors') ? 1 : 3,
    }
  }
  
  // Cat-cow / thoracic
  if (nameLower.includes('cat') || nameLower.includes('cow') || nameLower.includes('thoracic')) {
    return {
      sessionReason: 'Spine mobility for better positions.',
      prepares: 'thoracic spine and spinal mobility',
      coachingCue: 'Slow, feel each segment of the spine move.',
      priority: 3,
    }
  }
  
  // [AB15.6] Tuck FL raises / light lever activation
  if (nameLower.includes('tuck') && (nameLower.includes('lever') || nameLower.includes('raise') || nameLower.includes('fl'))) {
    return {
      sessionReason: 'Lat and scapular depression activation for lever work.',
      prepares: 'lats and scap depression for front lever shapes',
      coachingCue: 'Drive shoulders down, squeeze lats.',
      priority: 1,
    }
  }
  
  // [AB15.6] Explosive pull primer
  if (nameLower.includes('explosive') && nameLower.includes('pull')) {
    return {
      sessionReason: 'Power output primer without accumulating fatigue.',
      prepares: 'nervous system for explosive pulling',
      coachingCue: 'Crisp, powerful reps only. Stop before any grind.',
      priority: 2,
    }
  }
  
  // Default - short and honest
  return {
    sessionReason: `Preparation for today's ${demands.demandSummaryLabel || 'training'}.`,
    prepares: 'general mobility and activation',
    priority: 3,
  }
}

// =============================================================================
// COOL-DOWN COACHING GENERATION
// =============================================================================

/** Recovery reasons by joint area */
const JOINT_RECOVERY_REASONS: Record<JointFocusArea, string> = {
  wrists: 'Wrist decompression after loaded positions',
  elbows: 'Elbow and forearm tendon recovery',
  shoulders: 'Shoulder joint decompression and mobility restoration',
  scapula: 'Scapular reset after pressing/pulling work',
  thoracic_spine: 'Thoracic extension restoration',
  hip_flexors: 'Hip flexor release after compression work',
  hamstrings: 'Hamstring length restoration',
  lower_back: 'Lower back decompression',
  forearms: 'Forearm and grip recovery',
}

/**
 * Generate elite cool-down coaching context
 */
export function generateCoolDownCoaching(
  exercises: Array<{ id?: string; name?: string; category?: string }>,
  cooldownItems: Array<{ name?: string; id?: string }>
): CoolDownCoachingContext {
  const demands = analyzeSessionDemands(exercises)
  
  // Build focus header
  const focusHeader = demands.demandSummaryLabel
    ? `Recovery for ${demands.demandSummaryLabel}`
    : 'General Recovery'
  
  // Build coach recovery summary
  const coachRecoverySummary = buildCoachRecoverySummary(demands)
  
  // Build region summary
  const regionSummary = demands.jointFocusAreas
    .slice(0, 4)
    .map(j => JOINT_RECOVERY_REASONS[j] || formatJointName(j))
  
  // Build short time guidance
  const shortTimeGuidance = buildCoolDownShortTimeGuidance(demands)
  
  // Build per-item coaching
  const itemCoaching = new Map<string, CoolDownItemCoaching>()
  for (const item of cooldownItems) {
    const itemName = item.name || item.id || ''
    const coaching = generateItemCoolDownCoaching(itemName, demands)
    itemCoaching.set(itemName, coaching)
  }
  
  return {
    focusHeader,
    coachRecoverySummary,
    regionSummary,
    shortTimeGuidance,
    itemCoaching,
  }
}

function buildCoachRecoverySummary(demands: SessionDemandAnalysis): string {
  const parts: string[] = []
  
  if (demands.jointFocusAreas.includes('wrists') && demands.hasTendonStress) {
    parts.push('wrist/forearm decompression')
  }
  if (demands.jointFocusAreas.includes('elbows') && demands.hasTendonStress) {
    parts.push('elbow tendon recovery')
  }
  if (demands.jointFocusAreas.includes('shoulders')) {
    parts.push('shoulder restoration')
  }
  if (demands.jointFocusAreas.includes('hip_flexors')) {
    parts.push('hip flexor release')
  }
  
  if (parts.length === 0) {
    return 'General recovery and nervous system downshift'
  }
  
  if (parts.length === 1) return `Focused on ${parts[0]}`
  if (parts.length === 2) return `Focused on ${parts[0]} and ${parts[1]}`
  const last = parts.pop()
  return `Focused on ${parts.join(', ')}, and ${last}`
}

function buildCoolDownShortTimeGuidance(demands: SessionDemandAnalysis): string {
  if (demands.hasTendonStress) {
    return 'Keep tendon-area stretches (wrists, forearms, shoulders). Skip general flexibility.'
  }
  if (demands.primaryDemands.includes('compression_core')) {
    return 'Keep hip flexor release. Skip upper body stretches.'
  }
  return 'Keep 60s deep breathing at minimum. Skip stretches if needed.'
}

function generateItemCoolDownCoaching(
  itemName: string,
  demands: SessionDemandAnalysis
): CoolDownItemCoaching {
  const nameLower = itemName.toLowerCase()
  
  // Wrist work
  if (nameLower.includes('wrist')) {
    return {
      recoveryReason: 'Reduces wrist and forearm tone after loading.',
      recoversFrom: demands.primaryDemands.includes('straight_arm_push')
        ? 'Planche/straight-arm wrist stress'
        : 'Hand-supported positions',
      coachingCue: 'Gentle, no forcing. Let tension release.',
      priority: demands.jointFocusAreas.includes('wrists') ? 1 : 2,
    }
  }
  
  // Shoulder work
  if (nameLower.includes('shoulder') || nameLower.includes('chest')) {
    return {
      recoveryReason: 'Opens anterior shoulder after pressing/pulling work.',
      recoversFrom: 'Shoulder loading',
      coachingCue: 'Breathe into the stretch. 30-45 seconds each side.',
      priority: demands.jointFocusAreas.includes('shoulders') ? 1 : 2,
    }
  }
  
  // Lat/back work
  if (nameLower.includes('lat') || nameLower.includes('child')) {
    return {
      recoveryReason: 'Releases lat tension after pulling work.',
      recoversFrom: demands.primaryDemands.includes('straight_arm_pull')
        ? 'Front lever/straight-arm pull stress'
        : 'Pulling movements',
      coachingCue: 'Walk hands to each side for deeper lat stretch.',
      priority: demands.primaryDemands.some(d => d.includes('pull')) ? 1 : 2,
    }
  }
  
  // Hip flexor work
  if (nameLower.includes('hip') || nameLower.includes('lunge') || nameLower.includes('psoas')) {
    return {
      recoveryReason: 'Releases hip flexor tension after compression work.',
      recoversFrom: 'L-sit/compression hip flexor demand',
      coachingCue: 'Squeeze back glute, sink gently, breathe.',
      priority: demands.jointFocusAreas.includes('hip_flexors') ? 1 : 2,
    }
  }
  
  // Breathing work
  if (nameLower.includes('breath')) {
    return {
      recoveryReason: 'Activates parasympathetic recovery mode.',
      recoversFrom: 'Overall training stress',
      coachingCue: '4s inhale, 4s hold, 6s exhale. Relax completely.',
      priority: 1,
    }
  }
  
  // Cat-cow / spine
  if (nameLower.includes('cat') || nameLower.includes('cow') || nameLower.includes('spinal')) {
    return {
      recoveryReason: 'Restores spinal mobility after training.',
      recoversFrom: 'Spinal loading and bracing',
      coachingCue: 'Slow, feel each segment of the spine.',
      priority: 2,
    }
  }
  
  // Hang
  if (nameLower.includes('hang')) {
    return {
      recoveryReason: 'Decompresses spine and shoulders after pulling.',
      recoversFrom: 'Spinal compression and shoulder loading',
      coachingCue: 'Relax completely. Let gravity do the work.',
      priority: demands.primaryDemands.some(d => d.includes('pull')) ? 1 : 2,
    }
  }
  
  // Default
  return {
    recoveryReason: `Recovery from today's ${demands.demandSummaryLabel || 'training'}.`,
    recoversFrom: 'Training stress',
    priority: 3,
  }
}

// =============================================================================
// HELPERS
// =============================================================================

function formatJointName(joint: JointFocusArea): string {
  return joint
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

/**
 * Check if an exercise contract array contains specific demands
 */
export function hasSessionDemand(
  exercises: WorkoutExerciseContract[],
  demand: SessionDemandCategory
): boolean {
  const analysis = analyzeSessionDemands(exercises)
  return analysis.primaryDemands.includes(demand)
}
