/**
 * Live Set Coaching Engine
 * 
 * PPX-R7.8A: Generates intelligent, coach-like explanations for the active set
 * during a live workout. Derives all coaching from actual session/exercise/set
 * truth without fake claims.
 * 
 * DESIGN PRINCIPLES:
 * 1. All coaching derived from actual available data
 * 2. No fake specificity (don't claim planche prep for pull-only session)
 * 3. Integer-only RPE in all user-facing text
 * 4. Compact, useful explanations that feel like a real coach
 * 5. Honest fallbacks when data is missing
 */

// =============================================================================
// TYPES
// =============================================================================

export type ExerciseIntentCategory =
  | 'front_lever'
  | 'back_lever'
  | 'planche'
  | 'handstand'
  | 'muscle_up'
  | 'weighted_pull'
  | 'weighted_push'
  | 'explosive_pull'
  | 'ring_work'
  | 'compression_core'
  | 'pulling_general'
  | 'pushing_general'
  | 'hold_isometric'
  | 'mobility_flexibility'
  | 'generic'

export type ConfidenceLevel = 'baseline' | 'session_evidence' | 'historical_evidence' | 'strong_evidence'
export type SourceLabel = 'current session' | 'historical logs' | 'session prescription' | 'mixed evidence' | 'baseline fallback'

export interface LiveSetCoachingInput {
  exerciseName: string
  exerciseId: string
  exerciseCategory?: string
  exerciseMethod?: string
  currentSetNumber: number
  totalSets: number
  targetRepsOrTime: string
  targetRPE: number | null // Integer for display
  prescribedLoad?: { load?: number; unit?: string } | string | null
  selectedBands: string[]
  recommendedBand: string | null | undefined
  // Current session data
  currentSessionSetsCompleted: number
  currentSessionAvgRPE: number | null // Integer for display
  lastSetRPE: number | null // Integer for display
  // Historical data
  historicalSetsCount: number
  historicalAvgRPE: number | null // Integer for display
  cleanPercent: number
  bandStability: string
  // Session context
  focusLabel?: string
}

export interface LiveSetCoachingViewModel {
  // Exercise intent
  exerciseIntentHeadline: string
  exerciseIntentExplanation: string
  // Set purpose
  setPurposeHeadline: string
  setPurposeExplanation: string
  // Execution cues
  executionCues: string[]
  // Dosage/band rationale
  dosageRationale: string
  bandOrLoadRationale: string
  // Evidence summary
  currentEvidenceSummary: string
  // Adjustment rules
  nextSetAdjustmentRules: string[]
  // Safety
  safetyStopRule: string
  // Confidence
  confidenceLabel: ConfidenceLevel
  sourceLabel: SourceLabel
}

// =============================================================================
// EXERCISE INTENT DETECTION
// =============================================================================

function detectExerciseCategory(name: string, category?: string, method?: string): ExerciseIntentCategory {
  const lower = name.toLowerCase()
  const catLower = (category || '').toLowerCase()
  const methodLower = (method || '').toLowerCase()
  
  // Straight-arm pulling
  if (lower.includes('front lever') || lower.includes('fl ') || lower === 'fl') return 'front_lever'
  if (lower.includes('back lever') || lower.includes('bl ') || lower === 'bl') return 'back_lever'
  
  // Straight-arm pushing
  if (lower.includes('planche') || lower.includes('pseudo planche') || lower.includes('lean')) return 'planche'
  
  // Overhead/handstand
  if (lower.includes('handstand') || lower.includes('hspu') || lower.includes('pike push')) return 'handstand'
  
  // Muscle-up
  if (lower.includes('muscle up') || lower.includes('muscle-up')) return 'muscle_up'
  
  // Weighted work
  if (lower.includes('weighted pull') || lower.includes('weighted chin') || catLower.includes('weighted') && lower.includes('pull')) return 'weighted_pull'
  if (lower.includes('weighted dip') || lower.includes('weighted push') || catLower.includes('weighted') && (lower.includes('dip') || lower.includes('push'))) return 'weighted_push'
  
  // Explosive
  if (lower.includes('explosive') || lower.includes('power') || methodLower.includes('explosive')) return 'explosive_pull'
  
  // Ring work
  if (lower.includes('ring') || lower.includes('rto') || lower.includes('support hold')) return 'ring_work'
  
  // Core/compression
  if (lower.includes('l-sit') || lower.includes('l sit') || lower.includes('v-sit') || lower.includes('dragon') || lower.includes('compression') || lower.includes('hollow')) return 'compression_core'
  
  // Holds/isometrics
  if (lower.includes('hold') || lower.includes('iso') || methodLower.includes('isometric')) return 'hold_isometric'
  
  // Mobility
  if (lower.includes('stretch') || lower.includes('mobility') || lower.includes('pike') || lower.includes('pancake')) return 'mobility_flexibility'
  
  // General pulling
  if (lower.includes('pull') || lower.includes('row') || lower.includes('chin') || catLower.includes('pull')) return 'pulling_general'
  
  // General pushing
  if (lower.includes('push') || lower.includes('dip') || lower.includes('press') || catLower.includes('push')) return 'pushing_general'
  
  return 'generic'
}

function getExerciseIntentCopy(category: ExerciseIntentCategory, exerciseName: string): { headline: string; explanation: string } {
  switch (category) {
    case 'front_lever':
      return {
        headline: 'Scapular Depression + Lever Control',
        explanation: 'This is front-lever skill-strength work: training scapular depression, trunk tension, and straight-arm pulling control under low fatigue.'
      }
    case 'back_lever':
      return {
        headline: 'Shoulder Extension + Lever Line',
        explanation: 'Back lever trains shoulder extension strength, anterior chain tension, and body-line control in a demanding position.'
      }
    case 'planche':
      return {
        headline: 'Scapular Protraction + Lean Control',
        explanation: 'Planche work builds straight-arm pressing strength, scapular protraction endurance, and wrist/shoulder tendon tolerance.'
      }
    case 'handstand':
      return {
        headline: 'Overhead Pressing + Balance',
        explanation: 'Handstand training develops vertical pressing strength, shoulder stability, and line control overhead.'
      }
    case 'muscle_up':
      return {
        headline: 'Transition Power + Pulling Strength',
        explanation: 'Muscle-up work trains explosive pulling, the transition through the rings/bar, and pressing lockout coordination.'
      }
    case 'weighted_pull':
      return {
        headline: 'Max Pulling Strength',
        explanation: 'Weighted pulling builds peak pulling force under load. Focus on clean reps at target effort, not grinding to failure.'
      }
    case 'weighted_push':
      return {
        headline: 'Max Pressing Strength',
        explanation: 'Weighted pressing builds peak pushing force under load. Quality reps at controlled effort build strength safely.'
      }
    case 'explosive_pull':
      return {
        headline: 'Speed + Power Output',
        explanation: 'Explosive work trains rate of force development. Stop when speed drops or form degrades to avoid training slop.'
      }
    case 'ring_work':
      return {
        headline: 'Ring Stability + Control',
        explanation: 'Ring work challenges stabilizer strength and proprioception. Prioritize locked positions over rushed reps.'
      }
    case 'compression_core':
      return {
        headline: 'Trunk Compression + Hip Flexor Strength',
        explanation: 'Compression training builds hip flexor endurance and hollow-body tension needed for advanced skills.'
      }
    case 'hold_isometric':
      return {
        headline: 'Position Strength + Time Under Tension',
        explanation: `Isometric holds build strength at specific joint angles. Quality position matters more than max duration.`
      }
    case 'mobility_flexibility':
      return {
        headline: 'Range of Motion + Tissue Prep',
        explanation: 'Mobility work restores range and prepares tissues. Breathe through positions without forcing end-range.'
      }
    case 'pulling_general':
      return {
        headline: 'Pulling Volume + Back Development',
        explanation: `${exerciseName} builds pulling strength and scapular control. Focus on full range and controlled eccentrics.`
      }
    case 'pushing_general':
      return {
        headline: 'Pressing Volume + Upper Push Development',
        explanation: `${exerciseName} develops pressing strength and shoulder stability. Quality reps build safe strength.`
      }
    default:
      return {
        headline: 'Session Support',
        explanation: `This exercise supports today's session goals. Focus on quality execution at the prescribed effort.`
      }
  }
}

// =============================================================================
// EXECUTION CUES
// =============================================================================

function getExecutionCues(category: ExerciseIntentCategory): string[] {
  switch (category) {
    case 'front_lever':
      return [
        'Keep arms straight and pull the bar/rings down',
        'Depress scapula hard (shoulders away from ears)',
        'Ribs down, posterior pelvic tilt, squeeze glutes',
        'Do not let shoulders shrug or hips pike'
      ]
    case 'back_lever':
      return [
        'Squeeze shoulder blades together',
        'Maintain straight arm position',
        'Keep body in a straight line from head to toes',
        'Breathe shallow; do not collapse ribcage'
      ]
    case 'planche':
      return [
        'Protract scapula (push shoulders forward)',
        'Lean forward gradually, wrists under hips',
        'Keep arms locked and core tight',
        'Breathe shallow; maintain hollow body'
      ]
    case 'handstand':
      return [
        'Stack shoulders over wrists',
        'Push through shoulders, shrug up',
        'Squeeze glutes and point toes',
        'Look at a spot between hands'
      ]
    case 'muscle_up':
      return [
        'Pull explosively, chest to bar/rings',
        'Lean forward at transition',
        'Drive elbows back and press out',
        'Control the negative on descent'
      ]
    case 'weighted_pull':
    case 'pulling_general':
      return [
        'Initiate with scapular depression',
        'Pull elbows down and back',
        'Control the descent (2-3 seconds)',
        'Full extension at bottom, chin over bar at top'
      ]
    case 'weighted_push':
    case 'pushing_general':
      return [
        'Keep shoulders retracted and stable',
        'Control the descent to target depth',
        'Press explosively but not to lockout failure',
        'Breathe at the top of each rep'
      ]
    case 'explosive_pull':
      return [
        'Generate maximum speed on the pull',
        'Stop when bar speed drops noticeably',
        'Full reset between reps',
        'Quality over quantity'
      ]
    case 'ring_work':
      return [
        'Lock out elbows fully in support',
        'Turn rings out (RTO) if prescribed',
        'Keep shoulders depressed and stable',
        'Do not let rings wobble or drift'
      ]
    case 'compression_core':
      return [
        'Squeeze hip flexors hard',
        'Round lower back slightly (posterior tilt)',
        'Push hands into floor or bar',
        'Keep legs together and toes pointed'
      ]
    case 'hold_isometric':
      return [
        'Find and lock the target position',
        'Breathe shallowly; do not relax tension',
        'Count time honestly',
        'Exit cleanly before form breaks'
      ]
    case 'mobility_flexibility':
      return [
        'Breathe into the stretch',
        'Do not bounce or force',
        'Hold at mild discomfort, not pain',
        'Relax opposing muscles'
      ]
    default:
      return [
        'Focus on controlled movement quality',
        'Breathe consistently throughout',
        'Stop if pain or unsafe form appears'
      ]
  }
}

// =============================================================================
// SET PURPOSE LOGIC
// =============================================================================

function getSetPurpose(
  currentSet: number,
  totalSets: number,
  lastSetRPE: number | null,
  targetRPE: number | null,
  category: ExerciseIntentCategory,
  setsCompletedThisSession: number
): { headline: string; explanation: string } {
  const isFirstSet = currentSet === 1 && setsCompletedThisSession === 0
  const isFinalSet = currentSet === totalSets
  const isSkillWork = ['front_lever', 'back_lever', 'planche', 'handstand', 'muscle_up', 'ring_work', 'hold_isometric'].includes(category)
  const isExplosive = category === 'explosive_pull'
  
  if (isFirstSet) {
    return {
      headline: 'Baseline / Calibration Set',
      explanation: isSkillWork
        ? 'First set establishes today\'s position quality and effort baseline. Focus on clean technique, not max output.'
        : 'First set calibrates today\'s working capacity. Hit target effort without overreaching.'
    }
  }
  
  if (lastSetRPE !== null && targetRPE !== null) {
    const diff = lastSetRPE - targetRPE
    if (diff >= 2) {
      return {
        headline: 'Control / Recover Quality',
        explanation: `Last set was ${lastSetRPE} RPE (${diff} above target). This set should restore quality. Reduce intensity slightly or add assistance if needed.`
      }
    }
    if (diff <= -2 && lastSetRPE > 0) {
      return {
        headline: 'Confirm Easy Effort',
        explanation: `Last set was ${lastSetRPE} RPE (below target). If this persists, future sessions may reduce assistance or increase difficulty.`
      }
    }
  }
  
  if (isFinalSet) {
    return {
      headline: 'Final Set — Finish Clean',
      explanation: isExplosive
        ? 'Last set of the exercise. Maintain speed and crispness. Do not grind sloppy reps.'
        : isSkillWork
        ? 'Last set of the exercise. Finish with quality position and clean exit.'
        : 'Last set of the exercise. Complete at target effort without chasing failure.'
    }
  }
  
  return {
    headline: 'Repeat Quality',
    explanation: 'Performance is near target. Maintain the same quality and effort this set.'
  }
}

// =============================================================================
// SAFETY RULES
// =============================================================================

function getSafetyRule(category: ExerciseIntentCategory): string {
  switch (category) {
    case 'front_lever':
    case 'back_lever':
      return 'Stop if shoulder, elbow, or bicep tendon pain appears. Log feedback so the session can protect the joint.'
    case 'planche':
      return 'Stop if wrist, elbow, or shoulder pain appears. Straight-arm work stresses connective tissue — respect early warning signs.'
    case 'handstand':
      return 'Stop if wrist pain or shoulder impingement appears. Exit safely rather than collapsing.'
    case 'muscle_up':
      return 'Stop if shoulder or elbow pain appears at transition. Do not force ugly reps through pain.'
    case 'weighted_pull':
    case 'weighted_push':
      return 'Stop if joint pain appears or reps grind beyond target effort. Strength builds through quality, not failure.'
    case 'explosive_pull':
      return 'Stop when speed drops or form degrades. Training slow reps defeats the purpose of power work.'
    case 'ring_work':
      return 'Stop if shoulder instability or elbow hyperextension discomfort appears. Rings demand control.'
    case 'compression_core':
      return 'Stop if hip flexor cramping becomes sharp or lower back rounds excessively. Compression builds gradually.'
    default:
      return 'Stop if pain or unsafe technique appears. Log feedback so the app can adapt future sessions.'
  }
}

// =============================================================================
// MAIN BUILDER
// =============================================================================

export function buildLiveSetCoaching(input: LiveSetCoachingInput): LiveSetCoachingViewModel {
  const category = detectExerciseCategory(input.exerciseName, input.exerciseCategory, input.exerciseMethod)
  const intentCopy = getExerciseIntentCopy(category, input.exerciseName)
  const setPurposeCopy = getSetPurpose(
    input.currentSetNumber,
    input.totalSets,
    input.lastSetRPE,
    input.targetRPE,
    category,
    input.currentSessionSetsCompleted
  )
  const executionCues = getExecutionCues(category)
  const safetyRule = getSafetyRule(category)
  
  // Dosage rationale
  let dosageRationale = ''
  if (input.targetRepsOrTime) {
    const isHold = input.targetRepsOrTime.toLowerCase().includes('s') || input.targetRepsOrTime.toLowerCase().includes('sec')
    if (isHold) {
      dosageRationale = `Target hold: ${input.targetRepsOrTime}. `
      if (['front_lever', 'back_lever', 'planche', 'hold_isometric'].includes(category)) {
        dosageRationale += 'Quality position trumps max duration. Exit cleanly before form breaks.'
      } else {
        dosageRationale += 'Maintain position for the full duration or log actual time achieved.'
      }
    } else {
      dosageRationale = `Target: ${input.targetRepsOrTime}. `
      if (input.targetRPE) {
        dosageRationale += `Aim for RPE ${input.targetRPE}. Stop if effort exceeds target by 2+ points.`
      }
    }
  }
  
  // Band/load rationale
  let bandOrLoadRationale = ''
  if (input.recommendedBand) {
    if (input.historicalSetsCount > 0 && input.historicalAvgRPE !== null) {
      bandOrLoadRationale = `Maintaining ${input.recommendedBand} because ${input.historicalSetsCount} prior sets show RPE ${input.historicalAvgRPE} with ${input.cleanPercent}% clean quality.`
    } else {
      bandOrLoadRationale = `${input.recommendedBand} is the current recommendation. Log sets to build evidence for progression decisions.`
    }
    if (input.selectedBands.length > 0 && !input.selectedBands.includes(input.recommendedBand)) {
      bandOrLoadRationale += ` You selected ${input.selectedBands.join(' + ')} (differs from recommendation). Your selection is logged so the app can compare actual effort.`
    }
  } else if (input.prescribedLoad) {
    const loadStr = typeof input.prescribedLoad === 'object' && input.prescribedLoad?.load
      ? `${input.prescribedLoad.load}${input.prescribedLoad.unit ? ` ${input.prescribedLoad.unit}` : ''}`
      : String(input.prescribedLoad)
    bandOrLoadRationale = `Prescribed load: ${loadStr}. Complete reps at target effort. If load feels too heavy or light, log feedback for future calibration.`
  } else {
    bandOrLoadRationale = 'No band or external load prescribed. Focus on bodyweight execution quality.'
  }
  
  // Current evidence summary
  let currentEvidenceSummary = ''
  if (input.currentSessionSetsCompleted === 0) {
    currentEvidenceSummary = 'No completed sets yet. This set establishes today\'s baseline.'
  } else {
    currentEvidenceSummary = `${input.currentSessionSetsCompleted} set${input.currentSessionSetsCompleted > 1 ? 's' : ''} completed this workout.`
    if (input.currentSessionAvgRPE !== null) {
      currentEvidenceSummary += ` Average RPE: ${input.currentSessionAvgRPE}.`
    }
    if (input.lastSetRPE !== null) {
      currentEvidenceSummary += ` Last set: RPE ${input.lastSetRPE}.`
    }
  }
  
  // Next-set adjustment rules
  const nextSetAdjustmentRules: string[] = []
  const targetRPEStr = input.targetRPE ? `${input.targetRPE}` : '7'
  nextSetAdjustmentRules.push(`If RPE is 2+ above ${targetRPEStr}: next set may reduce reps/hold or add assistance.`)
  nextSetAdjustmentRules.push(`If RPE stays 2+ below ${targetRPEStr} repeatedly: future sessions may reduce assistance or progress difficulty.`)
  nextSetAdjustmentRules.push('If pain/unsafe feedback is logged: substitute, stop, or reduce progression pressure.')
  nextSetAdjustmentRules.push('If effort is near target: continue with current prescription.')
  
  // Confidence and source
  let confidenceLabel: ConfidenceLevel = 'baseline'
  let sourceLabel: SourceLabel = 'baseline fallback'
  
  if (input.currentSessionSetsCompleted > 0 && input.historicalSetsCount > 3) {
    confidenceLabel = 'strong_evidence'
    sourceLabel = 'mixed evidence'
  } else if (input.historicalSetsCount > 3) {
    confidenceLabel = 'historical_evidence'
    sourceLabel = 'historical logs'
  } else if (input.currentSessionSetsCompleted > 0) {
    confidenceLabel = 'session_evidence'
    sourceLabel = 'current session'
  } else if (input.targetRPE !== null) {
    sourceLabel = 'session prescription'
  }
  
  return {
    exerciseIntentHeadline: intentCopy.headline,
    exerciseIntentExplanation: intentCopy.explanation,
    setPurposeHeadline: setPurposeCopy.headline,
    setPurposeExplanation: setPurposeCopy.explanation,
    executionCues: executionCues.slice(0, 4), // Max 4 cues
    dosageRationale,
    bandOrLoadRationale,
    currentEvidenceSummary,
    nextSetAdjustmentRules,
    safetyStopRule: safetyRule,
    confidenceLabel,
    sourceLabel,
  }
}
