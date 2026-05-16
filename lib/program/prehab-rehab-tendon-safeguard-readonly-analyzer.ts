/**
 * =============================================================================
 * PREHAB / REHAB / TENDON / JOINT SAFEGUARD READ-ONLY ANALYZER
 * =============================================================================
 *
 * MASTER-8C.18 / AB20.4.11 — Read-only safeguard branch hardening
 *
 * This module provides a pure read-only analyzer that scores joint/tendon/prehab
 * stress from visible program structure and available exercise knowledge. It does
 * NOT mutate any exercises, sets, reps, warm-ups, cooldowns, or saved program fields.
 *
 * ARCHITECTURE RULES:
 * - Pure TypeScript, no React/DOM/localStorage
 * - No mutation functions
 * - No saveAdaptiveProgram calls
 * - No async unless absolutely necessary
 * - No DB calls
 * - No `as any`, `@ts-ignore`, `@ts-expect-error`
 * - Returns honest missing source context when data is unavailable
 *
 * CONSUMPTION:
 * - Plan Logic → AI Intelligence Foundation Map (branch status proof)
 * - Adaptive Foundation sheet (aligns with existing safeguardIntelligence)
 */

// =============================================================================
// TYPES
// =============================================================================

export type SafeguardBranchStatus =
  | 'not_available'
  | 'limited_sources'
  | 'read_only_active'
  | 'needs_more_data'

export type SafeguardMutationStatus = 'mutation_locked'

export type SafeguardRiskLevel = 'low' | 'moderate' | 'elevated' | 'high' | 'unknown'

export type SafeguardConfidence = 'low' | 'medium' | 'high'

export type JointOrTissueKey =
  | 'wrist'
  | 'elbow'
  | 'shoulder'
  | 'biceps_tendon'
  | 'triceps_tendon'
  | 'forearm_grip'
  | 'core_hip_flexor'
  | 'lower_back'
  | 'knee'
  | 'ankle'
  | 'general'
  | 'unknown'

export type StressType =
  | 'straight_arm'
  | 'bent_arm'
  | 'compression'
  | 'grip'
  | 'impact'
  | 'end_range'
  | 'volume_accumulation'
  | 'method_density'
  | 'skill_intensity'
  | 'unknown'

export type FutureMutationCandidate =
  | 'none'
  | 'warmup_bias'
  | 'cooldown_bias'
  | 'volume_watch'
  | 'method_suppression_candidate'
  | 'exercise_substitution_candidate'
  | 'future_session_adjustment_candidate'

/**
 * Individual safeguard signal detected from program structure.
 */
export interface PrehabRehabTendonSignal {
  id: string
  label: string
  jointOrTissue: JointOrTissueKey
  stressType: StressType
  riskLevel: SafeguardRiskLevel
  confidence: SafeguardConfidence
  affectedDays: string[]
  affectedExercises: string[]
  explanation: string
  readOnlyRecommendation: string
  futureMutationCandidate: FutureMutationCandidate
}

/**
 * Read-only output model for the safeguard branch analyzer.
 */
export interface PrehabRehabTendonSafeguardReadonlyModel {
  status: SafeguardBranchStatus
  mutationStatus: SafeguardMutationStatus
  summary: string
  headline: string
  riskLevel: SafeguardRiskLevel
  confidence: SafeguardConfidence
  detectedSignals: PrehabRehabTendonSignal[]
  blockedActions: string[]
  allowedReadOnlyActions: string[]
  sourceBasis: string[]
  missingSources: string[]
  nextSafeAction: string
}

// =============================================================================
// INPUT TYPES
// =============================================================================

export interface SafeguardExerciseRowInput {
  name: string
  id?: string
  sets?: number
  reps?: string | number
  holdDuration?: string | number
  targetRPE?: number
  restSeconds?: number
  role?: string
  category?: string
  methodContext?: string
  isHighSkill?: boolean
  isTendonHeavy?: boolean
  movementFamily?: string
  tissueStress?: string[]
}

export interface SafeguardSessionInput {
  dayLabel: string
  title?: string
  role?: string
  exercises: SafeguardExerciseRowInput[]
}

export interface PrehabRehabTendonSafeguardReadonlyInput {
  programId?: string
  programName?: string
  sessions: SafeguardSessionInput[]
  selectedSkills?: string[]
  trainingStyle?: string
  experienceLevel?: string
  equipment?: string[]
  existingConstraints?: string[]
  existingInjurySignals?: string[]
  existingSafeguardIntelligence?: {
    overallRiskLevel?: string
    tissueSignals?: Array<{
      area: string
      riskLevel: string
      drivers?: string[]
      explanation?: string
    }>
    movementFamilies?: Array<{
      family: string
      estimatedStress?: string
    }>
  }
}

// =============================================================================
// DETECTION PATTERNS
// =============================================================================

const WRIST_STRESS_PATTERNS = [
  'planche', 'pseudo planche', 'planche lean', 'handstand', 'hspu',
  'handstand push', 'frog stand', 'crow', 'wrist', 'floor push',
  'tuck planche', 'straddle planche', 'full planche'
]

const ELBOW_BICEPS_STRESS_PATTERNS = [
  'front lever', 'one arm pull', 'archer pull', 'muscle up', 'explosive pull',
  'false grip', 'iron cross', 'back lever', 'pelican', 'maltese',
  'victorian', 'typewriter', 'weighted pull'
]

const SHOULDER_STRAIGHT_ARM_PATTERNS = [
  'planche', 'front lever', 'back lever', 'iron cross', 'maltese',
  'rings support', 'straight arm', 'lever', 'skin the cat'
]

const TRICEPS_ANTERIOR_PATTERNS = [
  'dip', 'hspu', 'handstand push', 'straight bar dip', 'ring dip',
  'bench dip', 'korean dip', 'russian dip'
]

const GRIP_FOREARM_PATTERNS = [
  'dead hang', 'pull up', 'chin up', 'muscle up', 'front lever',
  'one arm hang', 'finger', 'grip', 'towel hang', 'rope climb'
]

const CORE_HIP_FLEXOR_PATTERNS = [
  'l-sit', 'l sit', 'v-sit', 'v sit', 'manna', 'hanging leg raise',
  'toes to bar', 'compression', 'straddle sit', 'pike sit',
  'hollow body', 'dragon flag'
]

const HIGH_SKILL_PATTERNS = [
  'planche', 'front lever', 'back lever', 'muscle up', 'handstand',
  'one arm', 'iron cross', 'maltese', 'victorian', 'manna',
  'human flag', 'press to handstand'
]

const TENDON_HEAVY_PATTERNS = [
  'planche', 'front lever', 'back lever', 'iron cross', 'maltese',
  'pelican', 'straight arm', 'false grip', 'one arm pull',
  'skin the cat', 'german hang'
]

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Creates a stable, deterministic slug for signal IDs.
 * Used to replace non-deterministic Date.now() in signal ID generation.
 */
function slugifySafeguardIdPart(value: string | undefined | null): string {
  if (!value) return 'unknown'
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'unknown'
}

function normalizeForMatching(str: string): string {
  return str.toLowerCase().replace(/[-_]/g, ' ')
}

function matchesAnyPattern(exerciseName: string, patterns: string[]): boolean {
  const normalized = normalizeForMatching(exerciseName)
  return patterns.some(p => normalized.includes(p))
}

function detectJointOrTissue(exercise: SafeguardExerciseRowInput): JointOrTissueKey {
  const name = exercise.name
  
  if (matchesAnyPattern(name, WRIST_STRESS_PATTERNS)) return 'wrist'
  if (matchesAnyPattern(name, ELBOW_BICEPS_STRESS_PATTERNS)) return 'biceps_tendon'
  if (matchesAnyPattern(name, SHOULDER_STRAIGHT_ARM_PATTERNS)) return 'shoulder'
  if (matchesAnyPattern(name, TRICEPS_ANTERIOR_PATTERNS)) return 'triceps_tendon'
  if (matchesAnyPattern(name, GRIP_FOREARM_PATTERNS)) return 'forearm_grip'
  if (matchesAnyPattern(name, CORE_HIP_FLEXOR_PATTERNS)) return 'core_hip_flexor'
  
  // Check explicit tissue stress from input
  if (exercise.tissueStress?.length) {
    const first = exercise.tissueStress[0].toLowerCase()
    if (first.includes('wrist')) return 'wrist'
    if (first.includes('elbow') || first.includes('bicep')) return 'biceps_tendon'
    if (first.includes('shoulder')) return 'shoulder'
    if (first.includes('tricep')) return 'triceps_tendon'
    if (first.includes('grip') || first.includes('forearm')) return 'forearm_grip'
    if (first.includes('core') || first.includes('hip')) return 'core_hip_flexor'
  }
  
  return 'unknown'
}

function detectStressType(exercise: SafeguardExerciseRowInput): StressType {
  const name = exercise.name
  
  if (matchesAnyPattern(name, SHOULDER_STRAIGHT_ARM_PATTERNS)) return 'straight_arm'
  if (matchesAnyPattern(name, TRICEPS_ANTERIOR_PATTERNS)) return 'bent_arm'
  if (matchesAnyPattern(name, CORE_HIP_FLEXOR_PATTERNS)) return 'compression'
  if (matchesAnyPattern(name, GRIP_FOREARM_PATTERNS)) return 'grip'
  if (matchesAnyPattern(name, HIGH_SKILL_PATTERNS)) return 'skill_intensity'
  
  // Check for high sets volume
  const sets = exercise.sets ?? 3
  if (sets >= 5) return 'volume_accumulation'
  
  return 'unknown'
}

function isHighSkillExercise(exercise: SafeguardExerciseRowInput): boolean {
  if (exercise.isHighSkill) return true
  return matchesAnyPattern(exercise.name, HIGH_SKILL_PATTERNS)
}

function isTendonHeavyExercise(exercise: SafeguardExerciseRowInput): boolean {
  if (exercise.isTendonHeavy) return true
  return matchesAnyPattern(exercise.name, TENDON_HEAVY_PATTERNS)
}

function assessRiskLevel(
  sets: number,
  isHighSkill: boolean,
  isTendonHeavy: boolean,
  methodContext?: string
): SafeguardRiskLevel {
  let risk: SafeguardRiskLevel = 'low'
  
  // High skill or tendon-heavy elevates baseline
  if (isHighSkill || isTendonHeavy) {
    risk = 'moderate'
  }
  
  // Both high skill AND tendon-heavy
  if (isHighSkill && isTendonHeavy) {
    risk = 'elevated'
  }
  
  // High volume compounds risk
  if (sets >= 5) {
    if (risk === 'low') risk = 'moderate'
    else if (risk === 'moderate') risk = 'elevated'
    else if (risk === 'elevated') risk = 'high'
  } else if (sets >= 4) {
    if (risk === 'elevated') risk = 'high'
  }
  
  // Method density check
  if (methodContext === 'superset' || methodContext === 'circuit' || methodContext === 'density') {
    if (risk === 'moderate') risk = 'elevated'
    else if (risk === 'elevated') risk = 'high'
  }
  
  return risk
}

function determineFutureMutationCandidate(
  signal: Partial<PrehabRehabTendonSignal>
): FutureMutationCandidate {
  const risk = signal.riskLevel ?? 'unknown'
  const stress = signal.stressType ?? 'unknown'
  
  if (risk === 'low' || risk === 'unknown') return 'none'
  
  if (stress === 'volume_accumulation') return 'volume_watch'
  if (stress === 'method_density') return 'method_suppression_candidate'
  if (stress === 'straight_arm' || stress === 'skill_intensity') {
    if (risk === 'high' || risk === 'elevated') return 'warmup_bias'
    return 'volume_watch'
  }
  
  if (risk === 'high') return 'exercise_substitution_candidate'
  if (risk === 'elevated') return 'future_session_adjustment_candidate'
  
  return 'volume_watch'
}

// =============================================================================
// MAIN ANALYZER
// =============================================================================

/**
 * Resolve a read-only safeguard model from program/session input.
 * This function NEVER mutates any program data.
 */
export function resolvePrehabRehabTendonSafeguardReadonly(
  input: PrehabRehabTendonSafeguardReadonlyInput
): PrehabRehabTendonSafeguardReadonlyModel {
  const sourceBasis: string[] = []
  const missingSources: string[] = []
  const detectedSignals: PrehabRehabTendonSignal[] = []
  
  // Check available sources
  if (input.sessions.length > 0) {
    sourceBasis.push('program_structure')
  } else {
    missingSources.push('program_sessions')
  }
  
  if (input.selectedSkills?.length) {
    sourceBasis.push('selected_skills')
  } else {
    missingSources.push('selected_skills')
  }
  
  if (input.existingInjurySignals?.length) {
    sourceBasis.push('injury_signals')
  } else {
    missingSources.push('injury_history')
  }
  
  if (input.existingSafeguardIntelligence) {
    sourceBasis.push('existing_safeguard_model')
  }
  
  if (input.existingConstraints?.length) {
    sourceBasis.push('constraint_context')
  }
  
  // Aggregate exposure counts per tissue
  const tissueExposure: Record<JointOrTissueKey, {
    count: number
    totalSets: number
    days: Set<string>
    exercises: Set<string>
    highSkillCount: number
    tendonHeavyCount: number
    highVolumeCount: number
  }> = {} as Record<JointOrTissueKey, typeof tissueExposure[JointOrTissueKey]>
  
  // Scan all sessions
  for (const session of input.sessions) {
    for (const exercise of session.exercises) {
      const jointOrTissue = detectJointOrTissue(exercise)
      if (jointOrTissue === 'unknown') continue
      
      if (!tissueExposure[jointOrTissue]) {
        tissueExposure[jointOrTissue] = {
          count: 0,
          totalSets: 0,
          days: new Set(),
          exercises: new Set(),
          highSkillCount: 0,
          tendonHeavyCount: 0,
          highVolumeCount: 0,
        }
      }
      
      const exp = tissueExposure[jointOrTissue]
      exp.count++
      exp.totalSets += exercise.sets ?? 3
      exp.days.add(session.dayLabel)
      exp.exercises.add(exercise.name)
      
      if (isHighSkillExercise(exercise)) exp.highSkillCount++
      if (isTendonHeavyExercise(exercise)) exp.tendonHeavyCount++
      if ((exercise.sets ?? 3) >= 5) exp.highVolumeCount++
    }
  }
  
  // Generate signals from aggregated exposure
  let signalIndex = 0
  for (const [tissue, exp] of Object.entries(tissueExposure)) {
    const jointOrTissue = tissue as JointOrTissueKey
    const hasHighSkill = exp.highSkillCount > 0
    const hasTendonHeavy = exp.tendonHeavyCount > 0
    const hasHighVolume = exp.highVolumeCount > 0
    
    // Determine stress type based on most significant factor
    let stressType: StressType = 'unknown'
    if (hasHighVolume && exp.count >= 3) stressType = 'volume_accumulation'
    else if (hasHighSkill) stressType = 'skill_intensity'
    else if (hasTendonHeavy) stressType = 'straight_arm'
    
    // Assess risk
    const avgSets = exp.totalSets / exp.count
    const riskLevel = assessRiskLevel(avgSets, hasHighSkill, hasTendonHeavy)
    
    // Only create signal if there's meaningful stress
    if (riskLevel === 'low' && !hasHighSkill && !hasTendonHeavy) continue
    
    const signal: PrehabRehabTendonSignal = {
      id: `safeguard-${jointOrTissue}-${stressType}-${slugifySafeguardIdPart(Array.from(exp.days).join('-'))}-${signalIndex++}`,
      label: getTissueLabel(jointOrTissue),
      jointOrTissue,
      stressType,
      riskLevel,
      confidence: sourceBasis.length >= 2 ? 'medium' : 'low',
      affectedDays: Array.from(exp.days),
      affectedExercises: Array.from(exp.exercises).slice(0, 5),
      explanation: buildExplanation(jointOrTissue, exp, hasHighSkill, hasTendonHeavy, hasHighVolume),
      readOnlyRecommendation: buildReadOnlyRecommendation(riskLevel, jointOrTissue),
      futureMutationCandidate: 'none', // Will be set below
    }
    
    signal.futureMutationCandidate = determineFutureMutationCandidate(signal)
    detectedSignals.push(signal)
  }
  
  // Integrate existing safeguard intelligence if available
  let existingIndex = 0
  if (input.existingSafeguardIntelligence?.tissueSignals) {
    for (const existing of input.existingSafeguardIntelligence.tissueSignals) {
      const alreadyDetected = detectedSignals.some(s => 
        s.jointOrTissue === existing.area || 
        s.label.toLowerCase().includes(existing.area.toLowerCase())
      )
      
      if (!alreadyDetected && existing.riskLevel && existing.riskLevel !== 'low') {
        detectedSignals.push({
          id: `existing-${slugifySafeguardIdPart(existing.area)}-${existingIndex++}`,
          label: existing.area,
          jointOrTissue: mapExistingAreaToKey(existing.area),
          stressType: 'unknown',
          riskLevel: mapRiskLevel(existing.riskLevel),
          confidence: 'medium',
          affectedDays: [],
          affectedExercises: existing.drivers?.slice(0, 3) ?? [],
          explanation: existing.explanation ?? `Existing safeguard signal for ${existing.area}`,
          readOnlyRecommendation: 'Monitor per existing safeguard intelligence',
          futureMutationCandidate: 'none',
        })
      }
    }
  }
  
  // Determine overall status and risk
  let status: SafeguardBranchStatus = 'not_available'
  let overallRiskLevel: SafeguardRiskLevel = 'low'
  let confidence: SafeguardConfidence = 'low'
  
  if (sourceBasis.length === 0) {
    status = 'not_available'
  } else if (sourceBasis.length === 1 && sourceBasis[0] === 'program_structure') {
    status = 'limited_sources'
    confidence = 'low'
  } else if (sourceBasis.length >= 2) {
    status = 'read_only_active'
    confidence = 'medium'
  } else {
    status = 'needs_more_data'
  }
  
  // Calculate overall risk from signals
  if (detectedSignals.some(s => s.riskLevel === 'high')) {
    overallRiskLevel = 'high'
  } else if (detectedSignals.some(s => s.riskLevel === 'elevated')) {
    overallRiskLevel = 'elevated'
  } else if (detectedSignals.some(s => s.riskLevel === 'moderate')) {
    overallRiskLevel = 'moderate'
  }
  
  // Build summary
  const headline = buildHeadline(overallRiskLevel, detectedSignals.length, status)
  const summary = buildSummary(overallRiskLevel, detectedSignals, sourceBasis, missingSources)
  
  return {
    status,
    mutationStatus: 'mutation_locked',
    summary,
    headline,
    riskLevel: overallRiskLevel,
    confidence,
    detectedSignals: detectedSignals.sort((a, b) => 
      riskOrder(b.riskLevel) - riskOrder(a.riskLevel)
    ).slice(0, 5), // Top 5 signals
    blockedActions: [
      'Exercise substitutions',
      'Warm-up/cooldown mutations',
      'Set/rep changes',
      'Method suppression',
    ],
    allowedReadOnlyActions: [
      'View safeguard signals',
      'Review tissue stress patterns',
      'Check movement family exposure',
    ],
    sourceBasis,
    missingSources,
    nextSafeAction: 'Expand evidence inputs (workout history, discomfort notes); mutation remains locked',
  }
}

// =============================================================================
// HELPER LABEL/TEXT BUILDERS
// =============================================================================

function getTissueLabel(tissue: JointOrTissueKey): string {
  const labels: Record<JointOrTissueKey, string> = {
    wrist: 'Wrist Stress',
    elbow: 'Elbow Stress',
    shoulder: 'Shoulder Stress',
    biceps_tendon: 'Biceps Tendon',
    triceps_tendon: 'Triceps/Anterior Shoulder',
    forearm_grip: 'Grip/Forearm',
    core_hip_flexor: 'Core/Hip Flexor',
    lower_back: 'Lower Back',
    knee: 'Knee',
    ankle: 'Ankle',
    general: 'General',
    unknown: 'Unknown Area',
  }
  return labels[tissue] ?? 'Unknown'
}

function buildExplanation(
  tissue: JointOrTissueKey,
  exp: { count: number; totalSets: number; days: Set<string> },
  hasHighSkill: boolean,
  hasTendonHeavy: boolean,
  hasHighVolume: boolean
): string {
  const parts: string[] = []
  
  parts.push(`${exp.count} exercise(s) across ${exp.days.size} day(s)`)
  
  if (hasTendonHeavy) {
    parts.push('includes tendon-heavy movements')
  }
  if (hasHighSkill) {
    parts.push('includes high-skill work')
  }
  if (hasHighVolume) {
    parts.push('some rows have 5+ sets')
  }
  
  return parts.join('; ')
}

function buildReadOnlyRecommendation(risk: SafeguardRiskLevel, tissue: JointOrTissueKey): string {
  if (risk === 'high') {
    return `High stress on ${getTissueLabel(tissue)}. Future mutation may add warm-up bias or reduce exposure.`
  }
  if (risk === 'elevated') {
    return `Elevated stress watch. Monitor fatigue and consider prep work.`
  }
  if (risk === 'moderate') {
    return `Moderate stress. Standard prep and recovery should suffice.`
  }
  return 'Low stress. Hold steady.'
}

function buildHeadline(
  risk: SafeguardRiskLevel,
  signalCount: number,
  status: SafeguardBranchStatus
): string {
  if (status === 'not_available') {
    return 'Safeguard data not available'
  }
  if (signalCount === 0) {
    return 'No significant stress signals detected'
  }
  
  const riskText = risk === 'high' ? 'High' : risk === 'elevated' ? 'Elevated' : risk === 'moderate' ? 'Moderate' : 'Low'
  return `${riskText} overall risk • ${signalCount} signal(s) detected`
}

function buildSummary(
  risk: SafeguardRiskLevel,
  signals: PrehabRehabTendonSignal[],
  sources: string[],
  missing: string[]
): string {
  if (signals.length === 0) {
    if (missing.length > 0) {
      return `Limited source coverage (${sources.join(', ')}). No significant stress patterns detected from available data.`
    }
    return 'No significant joint/tendon stress signals detected from current program structure.'
  }
  
  const topSignals = signals.slice(0, 2).map(s => s.label).join(', ')
  const sourceNote = sources.length > 1 
    ? `Based on ${sources.join(', ')}.` 
    : `Based on ${sources[0] ?? 'program structure'} only.`
  
  return `Top signals: ${topSignals}. ${sourceNote} No substitutions or changes applied.`
}

function riskOrder(risk: SafeguardRiskLevel): number {
  return { high: 4, elevated: 3, moderate: 2, low: 1, unknown: 0 }[risk] ?? 0
}

function mapExistingAreaToKey(area: string): JointOrTissueKey {
  const lower = area.toLowerCase()
  if (lower.includes('wrist')) return 'wrist'
  if (lower.includes('elbow')) return 'elbow'
  if (lower.includes('shoulder')) return 'shoulder'
  if (lower.includes('bicep')) return 'biceps_tendon'
  if (lower.includes('tricep')) return 'triceps_tendon'
  if (lower.includes('grip') || lower.includes('forearm')) return 'forearm_grip'
  if (lower.includes('core') || lower.includes('hip')) return 'core_hip_flexor'
  if (lower.includes('back')) return 'lower_back'
  if (lower.includes('knee')) return 'knee'
  if (lower.includes('ankle')) return 'ankle'
  return 'unknown'
}

function mapRiskLevel(level: string): SafeguardRiskLevel {
  const lower = level.toLowerCase()
  if (lower === 'high') return 'high'
  if (lower === 'elevated') return 'elevated'
  if (lower === 'moderate') return 'moderate'
  if (lower === 'low') return 'low'
  return 'unknown'
}

// =============================================================================
// EXPORTS FOR UI CONSUMPTION
// =============================================================================

/**
 * Get a compact summary for foundation map display.
 */
export function getSafeguardBranchSummary(
  model: PrehabRehabTendonSafeguardReadonlyModel
): {
  statusLabel: string
  riskLabel: string
  signalCount: number
  topSignals: string[]
  isReadOnly: true
  isMutationLocked: true
} {
  return {
    statusLabel: model.status === 'read_only_active' ? 'Read-only Active' 
      : model.status === 'limited_sources' ? 'Limited Sources'
      : model.status === 'needs_more_data' ? 'Needs More Data'
      : 'Not Available',
    riskLabel: model.riskLevel === 'high' ? 'High Risk'
      : model.riskLevel === 'elevated' ? 'Elevated Risk'
      : model.riskLevel === 'moderate' ? 'Moderate Risk'
      : model.riskLevel === 'low' ? 'Low Risk'
      : 'Unknown',
    signalCount: model.detectedSignals.length,
    topSignals: model.detectedSignals.slice(0, 3).map(s => s.label),
    isReadOnly: true,
    isMutationLocked: true,
  }
}
