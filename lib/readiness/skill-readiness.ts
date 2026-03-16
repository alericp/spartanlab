/**
 * Skill Readiness Calculator Logic
 * 
 * Rule-based scoring system for evaluating readiness for advanced calisthenics skills.
 * Uses transparent, understandable thresholds - no AI/ML black box.
 * 
 * Designed to be extensible for future skills (HSPU, OAP, L-sit, V-sit, etc.)
 */

// =============================================================================
// COMMON TYPES
// =============================================================================

export type ReadinessLevel = 
  | 'not-ready'
  | 'foundation-phase'
  | 'early-progression'
  | 'intermediate-progression'
  | 'advanced-ready'

export interface ReadinessResult {
  score: number // 0-100
  level: ReadinessLevel
  label: string
  limitingFactor: string
  limitingFactorExplanation: string
  recommendation: string
  nextProgression: string
  breakdown: ScoreBreakdown[]
}

export interface ScoreBreakdown {
  factor: string
  score: number
  maxScore: number
  status: 'weak' | 'developing' | 'adequate' | 'strong'
}

// =============================================================================
// FRONT LEVER READINESS
// =============================================================================

export interface FrontLeverInputs {
  maxPullUps: number
  weightedPullUpLoad: number // lbs added
  hollowHoldTime: number // seconds
  tuckFrontLeverHold?: number // seconds, optional
  hasRings: boolean
  hasBar: boolean
  trainingAgeMonths?: number // optional
}

export function calculateFrontLeverReadiness(inputs: FrontLeverInputs): ReadinessResult {
  const breakdown: ScoreBreakdown[] = []
  
  // ===================
  // Factor 1: Pull-Up Strength (max 30 points)
  // ===================
  // Thresholds: <8 = weak, 8-12 = developing, 12-18 = adequate, 18+ = strong
  let pullUpScore = 0
  let pullUpStatus: ScoreBreakdown['status'] = 'weak'
  
  if (inputs.maxPullUps >= 20) {
    pullUpScore = 30
    pullUpStatus = 'strong'
  } else if (inputs.maxPullUps >= 15) {
    pullUpScore = 25
    pullUpStatus = 'strong'
  } else if (inputs.maxPullUps >= 12) {
    pullUpScore = 20
    pullUpStatus = 'adequate'
  } else if (inputs.maxPullUps >= 8) {
    pullUpScore = 12
    pullUpStatus = 'developing'
  } else if (inputs.maxPullUps >= 5) {
    pullUpScore = 6
    pullUpStatus = 'weak'
  } else {
    pullUpScore = Math.max(0, inputs.maxPullUps * 1)
    pullUpStatus = 'weak'
  }
  
  breakdown.push({
    factor: 'Pull-Up Strength',
    score: pullUpScore,
    maxScore: 30,
    status: pullUpStatus,
  })

  // ===================
  // Factor 2: Weighted Pull-Up (max 25 points)
  // ===================
  // Key correlation: +50lb strongly correlates with advanced tuck FL
  let weightedScore = 0
  let weightedStatus: ScoreBreakdown['status'] = 'weak'
  
  if (inputs.weightedPullUpLoad >= 70) {
    weightedScore = 25
    weightedStatus = 'strong'
  } else if (inputs.weightedPullUpLoad >= 50) {
    weightedScore = 20
    weightedStatus = 'strong'
  } else if (inputs.weightedPullUpLoad >= 35) {
    weightedScore = 15
    weightedStatus = 'adequate'
  } else if (inputs.weightedPullUpLoad >= 20) {
    weightedScore = 10
    weightedStatus = 'developing'
  } else if (inputs.weightedPullUpLoad >= 10) {
    weightedScore = 5
    weightedStatus = 'weak'
  } else {
    weightedScore = 0
    weightedStatus = 'weak'
  }
  
  breakdown.push({
    factor: 'Weighted Pull-Up',
    score: weightedScore,
    maxScore: 25,
    status: weightedStatus,
  })

  // ===================
  // Factor 3: Core Compression / Hollow Hold (max 20 points)
  // ===================
  let coreScore = 0
  let coreStatus: ScoreBreakdown['status'] = 'weak'
  
  if (inputs.hollowHoldTime >= 60) {
    coreScore = 20
    coreStatus = 'strong'
  } else if (inputs.hollowHoldTime >= 45) {
    coreScore = 16
    coreStatus = 'adequate'
  } else if (inputs.hollowHoldTime >= 30) {
    coreScore = 12
    coreStatus = 'developing'
  } else if (inputs.hollowHoldTime >= 15) {
    coreScore = 6
    coreStatus = 'weak'
  } else {
    coreScore = Math.max(0, Math.floor(inputs.hollowHoldTime / 3))
    coreStatus = 'weak'
  }
  
  breakdown.push({
    factor: 'Core Tension (Hollow Hold)',
    score: coreScore,
    maxScore: 20,
    status: coreStatus,
  })

  // ===================
  // Factor 4: Tuck Front Lever Experience (max 20 points)
  // ===================
  let tuckScore = 0
  let tuckStatus: ScoreBreakdown['status'] = 'weak'
  const tuckHold = inputs.tuckFrontLeverHold ?? 0
  
  if (tuckHold >= 20) {
    tuckScore = 20
    tuckStatus = 'strong'
  } else if (tuckHold >= 15) {
    tuckScore = 16
    tuckStatus = 'adequate'
  } else if (tuckHold >= 10) {
    tuckScore = 12
    tuckStatus = 'developing'
  } else if (tuckHold >= 5) {
    tuckScore = 6
    tuckStatus = 'weak'
  } else if (tuckHold > 0) {
    tuckScore = 3
    tuckStatus = 'weak'
  }
  
  breakdown.push({
    factor: 'Tuck Front Lever Hold',
    score: tuckScore,
    maxScore: 20,
    status: tuckStatus,
  })

  // ===================
  // Factor 5: Equipment Access (max 5 points)
  // ===================
  let equipScore = 0
  let equipStatus: ScoreBreakdown['status'] = 'developing'
  
  if (inputs.hasRings && inputs.hasBar) {
    equipScore = 5
    equipStatus = 'strong'
  } else if (inputs.hasBar || inputs.hasRings) {
    equipScore = 3
    equipStatus = 'adequate'
  }
  
  breakdown.push({
    factor: 'Equipment Access',
    score: equipScore,
    maxScore: 5,
    status: equipStatus,
  })

  // ===================
  // Calculate Total Score
  // ===================
  const totalScore = breakdown.reduce((sum, b) => sum + b.score, 0)
  
  // ===================
  // Determine Level & Labels
  // ===================
  let level: ReadinessLevel
  let label: string
  let nextProgression: string
  
  if (totalScore >= 85) {
    level = 'advanced-ready'
    label = 'Straddle Pathway Emerging'
    nextProgression = 'Straddle front lever negatives, one-leg front lever holds'
  } else if (totalScore >= 70) {
    level = 'intermediate-progression'
    label = 'Advanced Tuck Ready'
    nextProgression = 'Advanced tuck holds, front lever rows, slow negatives'
  } else if (totalScore >= 50) {
    level = 'early-progression'
    label = 'Tuck Front Lever Ready'
    nextProgression = 'Tuck front lever holds, inverted rows, core compression work'
  } else if (totalScore >= 30) {
    level = 'foundation-phase'
    label = 'Foundation Building'
    nextProgression = 'Build to 12+ pull-ups, weighted pull-ups, hollow holds'
  } else {
    level = 'not-ready'
    label = 'Not Ready Yet'
    nextProgression = 'Focus on strict pull-ups, basic core work, and general strength'
  }

  // ===================
  // Determine Limiting Factor
  // ===================
  const weakestFactor = [...breakdown]
    .filter(b => b.maxScore > 5) // Ignore equipment for limiting factor
    .sort((a, b) => (a.score / a.maxScore) - (b.score / b.maxScore))[0]
  
  const limitingFactorMap: Record<string, { factor: string; explanation: string }> = {
    'Pull-Up Strength': {
      factor: 'Pulling strength deficit',
      explanation: 'Your pull-up volume indicates you need more raw pulling strength. The front lever is fundamentally a pulling skill.'
    },
    'Weighted Pull-Up': {
      factor: 'Weighted pulling power',
      explanation: 'Heavy weighted pull-ups correlate strongly with front lever ability. Building +50lb weighted pull-ups significantly accelerates progress.'
    },
    'Core Tension (Hollow Hold)': {
      factor: 'Core compression weakness',
      explanation: 'The hollow body position is the foundation of front lever tension. Without strong core compression, maintaining the horizontal line is impossible.'
    },
    'Tuck Front Lever Hold': {
      factor: 'Specific skill experience',
      explanation: 'You have the base strength but lack specific front lever practice. Time to start building tuck hold endurance.'
    },
  }
  
  const limitingInfo = limitingFactorMap[weakestFactor?.factor] || {
    factor: 'General preparedness',
    explanation: 'Focus on building overall pulling strength and core stability.'
  }

  // ===================
  // Generate Recommendation
  // ===================
  let recommendation: string
  if (level === 'not-ready') {
    recommendation = 'Focus on building your foundation. Aim for 10+ strict pull-ups and 30+ second hollow holds before attempting front lever progressions.'
  } else if (level === 'foundation-phase') {
    recommendation = 'You are building a solid base. Continue developing pull-up strength (target 15+) and add weighted pull-up work while maintaining core tension drills.'
  } else if (level === 'early-progression') {
    recommendation = 'You are ready to begin tuck front lever training. Start with 3-5 sets of max holds, focusing on maintaining posterior pelvic tilt and active shoulders.'
  } else if (level === 'intermediate-progression') {
    recommendation = 'Progress to advanced tuck holds and front lever rows. The rows will build the specific pulling endurance needed for straddle and full front lever.'
  } else {
    recommendation = 'You have the strength foundation for advanced progressions. Begin straddle pathway work with one-leg variations and slow negatives from full position.'
  }

  return {
    score: totalScore,
    level,
    label,
    limitingFactor: limitingInfo.factor,
    limitingFactorExplanation: limitingInfo.explanation,
    recommendation,
    nextProgression,
    breakdown,
  }
}

// =============================================================================
// PLANCHE READINESS
// =============================================================================

export interface PlancheInputs {
  maxPushUps: number
  maxDips: number
  plancheLeanHold: number // seconds, or PPPU reps if they prefer
  wallHandstandHold?: number // seconds, optional
  shoulderMobilityConfidence: 'poor' | 'moderate' | 'good' | 'excellent'
  hasParallettes: boolean
  hasFloor: boolean
}

export function calculatePlancheReadiness(inputs: PlancheInputs): ReadinessResult {
  const breakdown: ScoreBreakdown[] = []
  
  // ===================
  // Factor 1: Push-Up Strength (max 20 points)
  // ===================
  let pushUpScore = 0
  let pushUpStatus: ScoreBreakdown['status'] = 'weak'
  
  if (inputs.maxPushUps >= 40) {
    pushUpScore = 20
    pushUpStatus = 'strong'
  } else if (inputs.maxPushUps >= 30) {
    pushUpScore = 16
    pushUpStatus = 'adequate'
  } else if (inputs.maxPushUps >= 20) {
    pushUpScore = 12
    pushUpStatus = 'developing'
  } else if (inputs.maxPushUps >= 10) {
    pushUpScore = 6
    pushUpStatus = 'weak'
  } else {
    pushUpScore = Math.max(0, inputs.maxPushUps)
    pushUpStatus = 'weak'
  }
  
  breakdown.push({
    factor: 'Push-Up Endurance',
    score: pushUpScore,
    maxScore: 20,
    status: pushUpStatus,
  })

  // ===================
  // Factor 2: Dip Strength (max 25 points)
  // ===================
  let dipScore = 0
  let dipStatus: ScoreBreakdown['status'] = 'weak'
  
  if (inputs.maxDips >= 25) {
    dipScore = 25
    dipStatus = 'strong'
  } else if (inputs.maxDips >= 18) {
    dipScore = 20
    dipStatus = 'strong'
  } else if (inputs.maxDips >= 12) {
    dipScore = 15
    dipStatus = 'adequate'
  } else if (inputs.maxDips >= 8) {
    dipScore = 10
    dipStatus = 'developing'
  } else if (inputs.maxDips >= 5) {
    dipScore = 5
    dipStatus = 'weak'
  }
  
  breakdown.push({
    factor: 'Dip Strength',
    score: dipScore,
    maxScore: 25,
    status: dipStatus,
  })

  // ===================
  // Factor 3: Planche Lean / PPPU (max 30 points)
  // ===================
  // This is the most specific indicator for planche
  let leanScore = 0
  let leanStatus: ScoreBreakdown['status'] = 'weak'
  
  if (inputs.plancheLeanHold >= 60) {
    leanScore = 30
    leanStatus = 'strong'
  } else if (inputs.plancheLeanHold >= 45) {
    leanScore = 24
    leanStatus = 'strong'
  } else if (inputs.plancheLeanHold >= 30) {
    leanScore = 18
    leanStatus = 'adequate'
  } else if (inputs.plancheLeanHold >= 20) {
    leanScore = 12
    leanStatus = 'developing'
  } else if (inputs.plancheLeanHold >= 10) {
    leanScore = 6
    leanStatus = 'weak'
  } else {
    leanScore = Math.max(0, Math.floor(inputs.plancheLeanHold / 2))
    leanStatus = 'weak'
  }
  
  breakdown.push({
    factor: 'Planche Lean / Shoulder Loading',
    score: leanScore,
    maxScore: 30,
    status: leanStatus,
  })

  // ===================
  // Factor 4: Handstand / Overhead Strength (max 15 points)
  // ===================
  let hsScore = 0
  let hsStatus: ScoreBreakdown['status'] = 'weak'
  const hsHold = inputs.wallHandstandHold ?? 0
  
  if (hsHold >= 60) {
    hsScore = 15
    hsStatus = 'strong'
  } else if (hsHold >= 45) {
    hsScore = 12
    hsStatus = 'adequate'
  } else if (hsHold >= 30) {
    hsScore = 9
    hsStatus = 'developing'
  } else if (hsHold >= 15) {
    hsScore = 5
    hsStatus = 'weak'
  }
  
  breakdown.push({
    factor: 'Overhead Stability (Handstand)',
    score: hsScore,
    maxScore: 15,
    status: hsStatus,
  })

  // ===================
  // Factor 5: Shoulder Mobility (max 10 points)
  // ===================
  const mobilityScores: Record<string, number> = {
    'poor': 2,
    'moderate': 5,
    'good': 8,
    'excellent': 10,
  }
  const mobilityStatuses: Record<string, ScoreBreakdown['status']> = {
    'poor': 'weak',
    'moderate': 'developing',
    'good': 'adequate',
    'excellent': 'strong',
  }
  
  breakdown.push({
    factor: 'Shoulder Mobility',
    score: mobilityScores[inputs.shoulderMobilityConfidence],
    maxScore: 10,
    status: mobilityStatuses[inputs.shoulderMobilityConfidence],
  })

  // ===================
  // Calculate Total Score
  // ===================
  const totalScore = breakdown.reduce((sum, b) => sum + b.score, 0)
  
  // ===================
  // Determine Level & Labels
  // ===================
  let level: ReadinessLevel
  let label: string
  let nextProgression: string
  
  if (totalScore >= 85) {
    level = 'advanced-ready'
    label = 'Tuck Planche Pathway Ready'
    nextProgression = 'Tuck planche holds, planche negatives, advanced lean work'
  } else if (totalScore >= 65) {
    level = 'intermediate-progression'
    label = 'Frog Stand / Deep Lean Ready'
    nextProgression = 'Frog stand holds, deep planche leans, PPPU progressions'
  } else if (totalScore >= 45) {
    level = 'early-progression'
    label = 'Lean Training Ready'
    nextProgression = 'Planche leans, PPPU, weighted dips, wrist conditioning'
  } else if (totalScore >= 25) {
    level = 'foundation-phase'
    label = 'Foundation Building'
    nextProgression = 'Build dip strength, push-up volume, and shoulder mobility'
  } else {
    level = 'not-ready'
    label = 'Not Ready Yet'
    nextProgression = 'Focus on basic pushing strength: push-ups, dips, and mobility'
  }

  // ===================
  // Determine Limiting Factor
  // ===================
  const weakestFactor = [...breakdown]
    .sort((a, b) => (a.score / a.maxScore) - (b.score / b.maxScore))[0]
  
  const limitingFactorMap: Record<string, { factor: string; explanation: string }> = {
    'Push-Up Endurance': {
      factor: 'General pushing endurance',
      explanation: 'Push-up volume indicates general pushing work capacity. Build to 30+ push-ups before serious planche training.'
    },
    'Dip Strength': {
      factor: 'Vertical pushing deficit',
      explanation: 'Dips build the shoulder strength and protraction pattern critical for planche. Weighted dips especially accelerate progress.'
    },
    'Planche Lean / Shoulder Loading': {
      factor: 'Specific lean tolerance',
      explanation: 'The planche lean is the most specific preparation. Your shoulders need more conditioning for the forward lean position.'
    },
    'Overhead Stability (Handstand)': {
      factor: 'Shoulder stability deficit',
      explanation: 'Handstand work builds the shoulder stability and body awareness that transfers to planche control.'
    },
    'Shoulder Mobility': {
      factor: 'Shoulder mobility limitation',
      explanation: 'Limited shoulder mobility restricts your lean depth and increases injury risk. Prioritize shoulder opening work.'
    },
  }
  
  const limitingInfo = limitingFactorMap[weakestFactor?.factor] || {
    factor: 'General pushing preparedness',
    explanation: 'Focus on building overall pushing strength and shoulder conditioning.'
  }

  // ===================
  // Generate Recommendation
  // ===================
  let recommendation: string
  if (level === 'not-ready') {
    recommendation = 'Build your pushing foundation first. Target 20+ push-ups and 10+ dips before beginning planche-specific work. Add shoulder mobility daily.'
  } else if (level === 'foundation-phase') {
    recommendation = 'Continue building pushing strength. Add planche leans (start with 20-30 degree lean) and work toward 30+ second holds while building dip strength.'
  } else if (level === 'early-progression') {
    recommendation = 'You can begin structured lean work. Focus on progressively deeper planche leans, pseudo planche push-ups, and frog stand entries.'
  } else if (level === 'intermediate-progression') {
    recommendation = 'Progress to frog stands and deeper lean work. The transition from lean to tuck requires patience - focus on 45+ second deep leans before tuck attempts.'
  } else {
    recommendation = 'You have the foundation for tuck planche work. Begin with tuck holds on parallettes, focusing on shoulder protraction and posterior pelvic tilt.'
  }

  return {
    score: totalScore,
    level,
    label,
    limitingFactor: limitingInfo.factor,
    limitingFactorExplanation: limitingInfo.explanation,
    recommendation,
    nextProgression,
    breakdown,
  }
}

// =============================================================================
// MUSCLE-UP READINESS
// =============================================================================

export interface MuscleUpInputs {
  maxPullUps: number
  maxDips: number
  chestToBarReps: number // 0 if can't do
  hasExplosivePulls: boolean // can do high pulls
  hasBar: boolean
  hasBands: boolean
}

export function calculateMuscleUpReadiness(inputs: MuscleUpInputs): ReadinessResult {
  const breakdown: ScoreBreakdown[] = []
  
  // ===================
  // Factor 1: Pull-Up Strength (max 30 points)
  // ===================
  let pullUpScore = 0
  let pullUpStatus: ScoreBreakdown['status'] = 'weak'
  
  if (inputs.maxPullUps >= 15) {
    pullUpScore = 30
    pullUpStatus = 'strong'
  } else if (inputs.maxPullUps >= 12) {
    pullUpScore = 24
    pullUpStatus = 'strong'
  } else if (inputs.maxPullUps >= 10) {
    pullUpScore = 18
    pullUpStatus = 'adequate'
  } else if (inputs.maxPullUps >= 8) {
    pullUpScore = 12
    pullUpStatus = 'developing'
  } else if (inputs.maxPullUps >= 5) {
    pullUpScore = 6
    pullUpStatus = 'weak'
  } else {
    pullUpScore = Math.max(0, inputs.maxPullUps * 1)
    pullUpStatus = 'weak'
  }
  
  breakdown.push({
    factor: 'Pull-Up Strength',
    score: pullUpScore,
    maxScore: 30,
    status: pullUpStatus,
  })

  // ===================
  // Factor 2: Dip Strength (max 20 points)
  // ===================
  let dipScore = 0
  let dipStatus: ScoreBreakdown['status'] = 'weak'
  
  if (inputs.maxDips >= 20) {
    dipScore = 20
    dipStatus = 'strong'
  } else if (inputs.maxDips >= 15) {
    dipScore = 16
    dipStatus = 'strong'
  } else if (inputs.maxDips >= 10) {
    dipScore = 12
    dipStatus = 'adequate'
  } else if (inputs.maxDips >= 6) {
    dipScore = 8
    dipStatus = 'developing'
  } else {
    dipScore = Math.max(0, inputs.maxDips * 1)
    dipStatus = 'weak'
  }
  
  breakdown.push({
    factor: 'Dip Strength',
    score: dipScore,
    maxScore: 20,
    status: dipStatus,
  })

  // ===================
  // Factor 3: Chest-to-Bar Ability (max 25 points)
  // ===================
  let ctbScore = 0
  let ctbStatus: ScoreBreakdown['status'] = 'weak'
  
  if (inputs.chestToBarReps >= 10) {
    ctbScore = 25
    ctbStatus = 'strong'
  } else if (inputs.chestToBarReps >= 8) {
    ctbScore = 20
    ctbStatus = 'strong'
  } else if (inputs.chestToBarReps >= 5) {
    ctbScore = 15
    ctbStatus = 'adequate'
  } else if (inputs.chestToBarReps >= 3) {
    ctbScore = 10
    ctbStatus = 'developing'
  } else if (inputs.chestToBarReps >= 1) {
    ctbScore = 5
    ctbStatus = 'weak'
  }
  
  breakdown.push({
    factor: 'Chest-to-Bar Pull-Ups',
    score: ctbScore,
    maxScore: 25,
    status: ctbStatus,
  })

  // ===================
  // Factor 4: Explosive Pulling Ability (max 20 points)
  // ===================
  let explosiveScore = inputs.hasExplosivePulls ? 20 : 5
  let explosiveStatus: ScoreBreakdown['status'] = inputs.hasExplosivePulls ? 'strong' : 'weak'
  
  // Boost if they have CTB reps (indicates some explosive ability)
  if (!inputs.hasExplosivePulls && inputs.chestToBarReps >= 5) {
    explosiveScore = 12
    explosiveStatus = 'developing'
  }
  
  breakdown.push({
    factor: 'Explosive Pull Ability',
    score: explosiveScore,
    maxScore: 20,
    status: explosiveStatus,
  })

  // ===================
  // Factor 5: Equipment (max 5 points)
  // ===================
  let equipScore = 0
  let equipStatus: ScoreBreakdown['status'] = 'weak'
  
  if (inputs.hasBar && inputs.hasBands) {
    equipScore = 5
    equipStatus = 'strong'
  } else if (inputs.hasBar) {
    equipScore = 4
    equipStatus = 'adequate'
  }
  
  breakdown.push({
    factor: 'Equipment Access',
    score: equipScore,
    maxScore: 5,
    status: equipStatus,
  })

  // ===================
  // Calculate Total Score
  // ===================
  const totalScore = breakdown.reduce((sum, b) => sum + b.score, 0)
  
  // ===================
  // Determine Level & Labels
  // ===================
  let level: ReadinessLevel
  let label: string
  let nextProgression: string
  
  if (totalScore >= 85) {
    level = 'advanced-ready'
    label = 'Strict Muscle-Up Pathway Ready'
    nextProgression = 'Transition drills, muscle-up negatives, strict attempts'
  } else if (totalScore >= 70) {
    level = 'intermediate-progression'
    label = 'Banded Muscle-Up Ready'
    nextProgression = 'Band-assisted muscle-ups, transition practice, explosive pulls'
  } else if (totalScore >= 50) {
    level = 'early-progression'
    label = 'Transition Practice Ready'
    nextProgression = 'High pulls, jumping muscle-ups, transition negatives'
  } else if (totalScore >= 30) {
    level = 'foundation-phase'
    label = 'Pulling Base Needed'
    nextProgression = 'Build to 12+ pull-ups, chest-to-bar work, dip strength'
  } else {
    level = 'not-ready'
    label = 'Not Ready Yet'
    nextProgression = 'Focus on building strict pull-up and dip strength first'
  }

  // ===================
  // Determine Limiting Factor
  // ===================
  const weakestFactor = [...breakdown]
    .filter(b => b.maxScore > 5)
    .sort((a, b) => (a.score / a.maxScore) - (b.score / b.maxScore))[0]
  
  const limitingFactorMap: Record<string, { factor: string; explanation: string }> = {
    'Pull-Up Strength': {
      factor: 'Base pulling strength',
      explanation: 'You need more raw pulling power. The muscle-up requires explosive strength that builds on a foundation of 10-15 strict pull-ups.'
    },
    'Dip Strength': {
      factor: 'Pressing strength deficit',
      explanation: 'The dip portion of the muscle-up is often overlooked. Weak dips mean you cannot complete the movement even if you clear the bar.'
    },
    'Chest-to-Bar Pull-Ups': {
      factor: 'Pulling height deficit',
      explanation: 'Chest-to-bar pull-ups prove you can generate enough height for the transition. Without this, muscle-up attempts will stall.'
    },
    'Explosive Pull Ability': {
      factor: 'Explosive power deficit',
      explanation: 'Muscle-ups require explosive generation. Practice high pulls and explosive pulling drills to develop the necessary power output.'
    },
  }
  
  const limitingInfo = limitingFactorMap[weakestFactor?.factor] || {
    factor: 'General preparedness',
    explanation: 'Focus on building overall upper body strength.'
  }

  // ===================
  // Generate Recommendation
  // ===================
  let recommendation: string
  if (level === 'not-ready') {
    recommendation = 'Build your base first. Work toward 10+ strict pull-ups and 10+ dips before muscle-up training. This foundation is non-negotiable.'
  } else if (level === 'foundation-phase') {
    recommendation = 'Continue building strength. Add chest-to-bar pull-up practice and explosive pull work while maintaining dip volume.'
  } else if (level === 'early-progression') {
    recommendation = 'Begin transition work. Practice jumping muscle-ups, band-assisted attempts, and transition negatives to learn the movement pattern.'
  } else if (level === 'intermediate-progression') {
    recommendation = 'You are close to the muscle-up. Use bands to practice the full movement, focus on explosive pulls, and drill the transition.'
  } else {
    recommendation = 'You have the strength for strict muscle-ups. Focus on transition technique and attempt strict reps with proper form.'
  }

  return {
    score: totalScore,
    level,
    label,
    limitingFactor: limitingInfo.factor,
    limitingFactorExplanation: limitingInfo.explanation,
    recommendation,
    nextProgression,
    breakdown,
  }
}

// =============================================================================
// HSPU (HANDSTAND PUSH-UP) READINESS
// =============================================================================

export interface HSPUInputs {
  wallHSPUReps: number // reps with face to wall
  pikeHSPUReps: number // elevated pike push-up reps
  maxDips: number
  wallHandstandHold: number // seconds
  overheadPressStrength: 'none' | 'light' | 'moderate' | 'strong' // relative to BW
  hasWall: boolean
  hasParallettes: boolean
}

export function calculateHSPUReadiness(inputs: HSPUInputs): ReadinessResult {
  const breakdown: ScoreBreakdown[] = []
  
  // ===================
  // Factor 1: Wall HSPU Ability (max 35 points)
  // ===================
  let wallHSPUScore = 0
  let wallHSPUStatus: ScoreBreakdown['status'] = 'weak'
  
  if (inputs.wallHSPUReps >= 10) {
    wallHSPUScore = 35
    wallHSPUStatus = 'strong'
  } else if (inputs.wallHSPUReps >= 7) {
    wallHSPUScore = 28
    wallHSPUStatus = 'strong'
  } else if (inputs.wallHSPUReps >= 5) {
    wallHSPUScore = 22
    wallHSPUStatus = 'adequate'
  } else if (inputs.wallHSPUReps >= 3) {
    wallHSPUScore = 15
    wallHSPUStatus = 'developing'
  } else if (inputs.wallHSPUReps >= 1) {
    wallHSPUScore = 8
    wallHSPUStatus = 'weak'
  }
  
  breakdown.push({
    factor: 'Wall HSPU Ability',
    score: wallHSPUScore,
    maxScore: 35,
    status: wallHSPUStatus,
  })

  // ===================
  // Factor 2: Pike Push-Up Strength (max 20 points)
  // ===================
  let pikeScore = 0
  let pikeStatus: ScoreBreakdown['status'] = 'weak'
  
  if (inputs.pikeHSPUReps >= 15) {
    pikeScore = 20
    pikeStatus = 'strong'
  } else if (inputs.pikeHSPUReps >= 12) {
    pikeScore = 16
    pikeStatus = 'strong'
  } else if (inputs.pikeHSPUReps >= 8) {
    pikeScore = 12
    pikeStatus = 'adequate'
  } else if (inputs.pikeHSPUReps >= 5) {
    pikeScore = 8
    pikeStatus = 'developing'
  } else if (inputs.pikeHSPUReps >= 3) {
    pikeScore = 4
    pikeStatus = 'weak'
  }
  
  breakdown.push({
    factor: 'Pike Push-Up Strength',
    score: pikeScore,
    maxScore: 20,
    status: pikeStatus,
  })

  // ===================
  // Factor 3: Dip Strength (max 15 points)
  // ===================
  let dipScore = 0
  let dipStatus: ScoreBreakdown['status'] = 'weak'
  
  if (inputs.maxDips >= 20) {
    dipScore = 15
    dipStatus = 'strong'
  } else if (inputs.maxDips >= 15) {
    dipScore = 12
    dipStatus = 'strong'
  } else if (inputs.maxDips >= 10) {
    dipScore = 9
    dipStatus = 'adequate'
  } else if (inputs.maxDips >= 6) {
    dipScore = 6
    dipStatus = 'developing'
  } else if (inputs.maxDips >= 3) {
    dipScore = 3
    dipStatus = 'weak'
  }
  
  breakdown.push({
    factor: 'Dip Strength',
    score: dipScore,
    maxScore: 15,
    status: dipStatus,
  })

  // ===================
  // Factor 4: Handstand Hold / Balance (max 20 points)
  // ===================
  let hsScore = 0
  let hsStatus: ScoreBreakdown['status'] = 'weak'
  
  if (inputs.wallHandstandHold >= 60) {
    hsScore = 20
    hsStatus = 'strong'
  } else if (inputs.wallHandstandHold >= 45) {
    hsScore = 16
    hsStatus = 'adequate'
  } else if (inputs.wallHandstandHold >= 30) {
    hsScore = 12
    hsStatus = 'developing'
  } else if (inputs.wallHandstandHold >= 15) {
    hsScore = 6
    hsStatus = 'weak'
  } else if (inputs.wallHandstandHold >= 5) {
    hsScore = 3
    hsStatus = 'weak'
  }
  
  breakdown.push({
    factor: 'Handstand Hold (Balance)',
    score: hsScore,
    maxScore: 20,
    status: hsStatus,
  })

  // ===================
  // Factor 5: Overhead Press Strength (max 10 points)
  // ===================
  const pressScores: Record<string, number> = {
    'none': 0,
    'light': 4,
    'moderate': 7,
    'strong': 10,
  }
  const pressStatuses: Record<string, ScoreBreakdown['status']> = {
    'none': 'weak',
    'light': 'developing',
    'moderate': 'adequate',
    'strong': 'strong',
  }
  
  breakdown.push({
    factor: 'Overhead Press Strength',
    score: pressScores[inputs.overheadPressStrength],
    maxScore: 10,
    status: pressStatuses[inputs.overheadPressStrength],
  })

  // ===================
  // Calculate Total Score
  // ===================
  const totalScore = breakdown.reduce((sum, b) => sum + b.score, 0)
  
  // ===================
  // Determine Level & Labels
  // ===================
  let level: ReadinessLevel
  let label: string
  let nextProgression: string
  
  if (totalScore >= 85) {
    level = 'advanced-ready'
    label = 'Freestanding HSPU Pathway Ready'
    nextProgression = 'Freestanding HSPU attempts, deficit HSPUs, strict negatives'
  } else if (totalScore >= 70) {
    level = 'intermediate-progression'
    label = 'Wall HSPU Consistent'
    nextProgression = 'Wall HSPU volume, deficit work, freestanding kick-ups'
  } else if (totalScore >= 50) {
    level = 'early-progression'
    label = 'Wall HSPU Practice Ready'
    nextProgression = 'Wall HSPU attempts, pike push-up progressions, handstand holds'
  } else if (totalScore >= 25) {
    level = 'foundation-phase'
    label = 'Foundation Building'
    nextProgression = 'Pike push-ups, wall handstand holds, overhead pressing'
  } else {
    level = 'not-ready'
    label = 'Not Ready Yet'
    nextProgression = 'Build pike push-up strength, dip strength, and handstand comfort'
  }

  // ===================
  // Determine Limiting Factor
  // ===================
  const weakestFactor = [...breakdown]
    .sort((a, b) => (a.score / a.maxScore) - (b.score / b.maxScore))[0]
  
  const limitingFactorMap: Record<string, { factor: string; explanation: string }> = {
    'Wall HSPU Ability': {
      factor: 'Specific HSPU strength',
      explanation: 'Wall HSPUs are the direct progression to freestanding. Build volume here before advancing to freestanding attempts.'
    },
    'Pike Push-Up Strength': {
      factor: 'Vertical pushing foundation',
      explanation: 'Pike push-ups build the overhead pressing strength needed for HSPUs without the balance component. Build to 12+ reps.'
    },
    'Dip Strength': {
      factor: 'Pressing base deficit',
      explanation: 'Dips build general pressing capacity that supports HSPU strength. Strong dips (15+) correlate with easier HSPU development.'
    },
    'Handstand Hold (Balance)': {
      factor: 'Balance and stability',
      explanation: 'You need comfort inverted before adding the pressing motion. Build 30+ second holds for stability.'
    },
    'Overhead Press Strength': {
      factor: 'Shoulder pressing weakness',
      explanation: 'General overhead strength supports HSPU development. Consider adding weighted overhead pressing to your training.'
    },
  }
  
  const limitingInfo = limitingFactorMap[weakestFactor?.factor] || {
    factor: 'General pressing preparedness',
    explanation: 'Focus on building overall pressing strength and handstand comfort.'
  }

  // ===================
  // Generate Recommendation
  // ===================
  let recommendation: string
  if (level === 'not-ready') {
    recommendation = 'Build your foundation first. Work toward 8+ pike push-ups and 30+ second wall handstands before HSPU attempts.'
  } else if (level === 'foundation-phase') {
    recommendation = 'Continue building pressing strength. Add elevated pike push-ups and increase handstand hold time while building dip volume.'
  } else if (level === 'early-progression') {
    recommendation = 'You are ready for wall HSPU practice. Start with negatives if needed, focus on controlled descent and pressing back up.'
  } else if (level === 'intermediate-progression') {
    recommendation = 'Build wall HSPU volume and consistency. Add deficit work for increased range of motion and begin freestanding kick-up practice.'
  } else {
    recommendation = 'You have the strength for freestanding attempts. Focus on controlled kick-ups and maintaining tension through the press.'
  }

  return {
    score: totalScore,
    level,
    label,
    limitingFactor: limitingInfo.factor,
    limitingFactorExplanation: limitingInfo.explanation,
    recommendation,
    nextProgression,
    breakdown,
  }
}

// =============================================================================
// READINESS TIERS (UNIFIED SYSTEM)
// =============================================================================

export type ReadinessTier = 
  | 'not-ready'
  | 'early-foundation'
  | 'developing'
  | 'almost-ready'
  | 'ready-to-push'

export interface ReadinessTierInfo {
  tier: ReadinessTier
  label: string
  description: string
  colorClass: string
  bgClass: string
}

/**
 * Convert numeric score to human-readable tier
 * 0-24 = Not Ready Yet
 * 25-49 = Early Foundation  
 * 50-69 = Developing
 * 70-84 = Almost Ready
 * 85-100 = Ready to Push
 */
export function getReadinessTier(score: number): ReadinessTierInfo {
  if (score >= 85) {
    return {
      tier: 'ready-to-push',
      label: 'Ready to Push',
      description: 'You have the foundation to attempt this skill. Focus on technique and deliberate practice.',
      colorClass: 'text-emerald-400',
      bgClass: 'bg-emerald-500/20 border-emerald-500/40',
    }
  }
  if (score >= 70) {
    return {
      tier: 'almost-ready',
      label: 'Almost Ready',
      description: 'Very close. A few more weeks of targeted work should get you there.',
      colorClass: 'text-green-400',
      bgClass: 'bg-green-500/20 border-green-500/40',
    }
  }
  if (score >= 50) {
    return {
      tier: 'developing',
      label: 'Developing',
      description: 'Solid progress. Continue building strength in the limiting areas.',
      colorClass: 'text-yellow-400',
      bgClass: 'bg-yellow-500/20 border-yellow-500/40',
    }
  }
  if (score >= 25) {
    return {
      tier: 'early-foundation',
      label: 'Early Foundation',
      description: 'Building the base. Focus on fundamental strength before skill-specific work.',
      colorClass: 'text-orange-400',
      bgClass: 'bg-orange-500/20 border-orange-500/40',
    }
  }
  return {
    tier: 'not-ready',
    label: 'Not Ready Yet',
    description: 'Build your foundation first. The prerequisites are not yet in place.',
    colorClass: 'text-red-400',
    bgClass: 'bg-red-500/20 border-red-500/40',
  }
}

// =============================================================================
// WEAK POINT EXTRACTION
// =============================================================================

export interface WeakPoint {
  name: string
  severity: 'critical' | 'moderate' | 'minor'
  percentOfMax: number
  suggestion: string
}

/**
 * Extract ranked weak points from a readiness breakdown
 * Critical: < 40% of max
 * Moderate: 40-60% of max
 * Minor: 60-80% of max
 */
export function extractWeakPoints(breakdown: ScoreBreakdown[]): WeakPoint[] {
  const weakPoints: WeakPoint[] = []
  
  // Sort by percentage of max (ascending = weakest first)
  const sorted = [...breakdown]
    .filter(b => b.maxScore > 5) // Filter out equipment-type factors
    .map(b => ({
      ...b,
      percentOfMax: Math.round((b.score / b.maxScore) * 100)
    }))
    .sort((a, b) => a.percentOfMax - b.percentOfMax)
  
  for (const item of sorted) {
    if (item.percentOfMax >= 80) continue // Not a weak point
    
    let severity: WeakPoint['severity'] = 'minor'
    if (item.percentOfMax < 40) severity = 'critical'
    else if (item.percentOfMax < 60) severity = 'moderate'
    
    const suggestion = getSuggestionForFactor(item.factor, severity)
    
    weakPoints.push({
      name: item.factor,
      severity,
      percentOfMax: item.percentOfMax,
      suggestion,
    })
  }
  
  return weakPoints
}

function getSuggestionForFactor(factor: string, severity: WeakPoint['severity']): string {
  const suggestions: Record<string, Record<WeakPoint['severity'], string>> = {
    'Pull-Up Strength': {
      critical: 'Focus on building strict pull-up volume. Target 3-4 sessions per week.',
      moderate: 'Add weighted pull-ups or increase training frequency.',
      minor: 'Continue current pull-up work. Consider adding more volume.',
    },
    'Weighted Pull-Up': {
      critical: 'Start weighted pull-up training with +10-15lbs. Progress slowly.',
      moderate: 'Increase weighted pull-up load. Target +35-50lbs.',
      minor: 'Continue progressive overload on weighted pulls.',
    },
    'Core Tension (Hollow Hold)': {
      critical: 'Daily hollow hold practice. Start with 10-15s holds.',
      moderate: 'Build to 45-60s hollow holds with good form.',
      minor: 'Maintain core work. Add hollow body rocks.',
    },
    'Tuck Front Lever Hold': {
      critical: 'Begin tuck front lever attempts. Use bands if needed.',
      moderate: 'Build tuck hold time to 15-20s consistently.',
      minor: 'Focus on form quality. Prepare for advanced tuck.',
    },
    'Push-Up Endurance': {
      critical: 'Build push-up volume. Target 30+ reps before skill work.',
      moderate: 'Add push-up variations. Consider pseudo planche push-ups.',
      minor: 'Maintain push-up capacity. Focus on quality.',
    },
    'Dip Strength': {
      critical: 'Priority: build dip strength. Target 15+ strict dips.',
      moderate: 'Add weighted dips. Build to +25-35lbs for reps.',
      minor: 'Continue dip progression. Consider ring dips.',
    },
    'Planche Lean / Shoulder Loading': {
      critical: 'Start planche lean work. Build to 30s holds.',
      moderate: 'Increase lean depth progressively. Add PPPU work.',
      minor: 'Focus on maintaining lean depth. Prepare for frog stand.',
    },
    'Overhead Stability (Handstand)': {
      critical: 'Daily handstand practice. Start with wall holds.',
      moderate: 'Build handstand hold time. Target 45-60s holds.',
      minor: 'Work on freestanding balance. Reduce wall reliance.',
    },
    'Shoulder Mobility': {
      critical: 'Daily shoulder mobility work is essential.',
      moderate: 'Increase shoulder opening frequency.',
      minor: 'Maintain mobility routine.',
    },
    'Chest-to-Bar Pull-Ups': {
      critical: 'Practice explosive pulling. Start with high pull attempts.',
      moderate: 'Build CTB volume. Target 8+ reps.',
      minor: 'Maintain CTB ability. Focus on height consistency.',
    },
    'Explosive Pull Ability': {
      critical: 'Add explosive pulling drills. Focus on pull height.',
      moderate: 'Practice kipping or jumping muscle-up transitions.',
      minor: 'Continue power development work.',
    },
    'Wall HSPU Ability': {
      critical: 'Start with negatives or band-assisted wall HSPUs.',
      moderate: 'Build wall HSPU volume. Target 7+ reps.',
      minor: 'Add deficit work to increase range of motion.',
    },
    'Pike Push-Up Strength': {
      critical: 'Build pike push-up volume. Elevate feet progressively.',
      moderate: 'Increase pike elevation. Target 12+ reps.',
      minor: 'Maintain pike strength. Consider box pike push-ups.',
    },
    'Handstand Hold (Balance)': {
      critical: 'Daily wall handstand practice. Build comfort inverted.',
      moderate: 'Extend hold time to 45-60 seconds.',
      minor: 'Work on freestanding balance elements.',
    },
    'Overhead Press Strength': {
      critical: 'Add overhead pressing to your routine.',
      moderate: 'Progress overhead press load.',
      minor: 'Maintain pressing strength.',
    },
  }
  
  return suggestions[factor]?.[severity] || `Improve ${factor.toLowerCase()} with targeted training.`
}

// =============================================================================
// UNIFIED READINESS CALCULATOR (for dashboard indicators)
// =============================================================================

export type SkillType = 'front-lever' | 'planche' | 'muscle-up' | 'hspu'

export interface UnifiedReadinessResult {
  skillType: SkillType
  skillName: string
  score: number
  tier: ReadinessTierInfo
  primaryWeakPoint: WeakPoint | null
  topWeakPoints: WeakPoint[]
  suggestion: string
  breakdown: ScoreBreakdown[]
}

/**
 * Calculate readiness for any supported skill type
 * This is the main entry point for the unified readiness system
 */
export function calculateUnifiedReadiness(
  skillType: SkillType,
  inputs: FrontLeverInputs | PlancheInputs | MuscleUpInputs | HSPUInputs
): UnifiedReadinessResult {
  let result: ReadinessResult
  let skillName: string
  
  switch (skillType) {
    case 'front-lever':
      result = calculateFrontLeverReadiness(inputs as FrontLeverInputs)
      skillName = 'Front Lever'
      break
    case 'planche':
      result = calculatePlancheReadiness(inputs as PlancheInputs)
      skillName = 'Planche'
      break
    case 'muscle-up':
      result = calculateMuscleUpReadiness(inputs as MuscleUpInputs)
      skillName = 'Muscle-Up'
      break
    case 'hspu':
      result = calculateHSPUReadiness(inputs as HSPUInputs)
      skillName = 'Handstand Push-Up'
      break
  }
  
  const tier = getReadinessTier(result.score)
  const weakPoints = extractWeakPoints(result.breakdown)
  
  return {
    skillType,
    skillName,
    score: result.score,
    tier,
    primaryWeakPoint: weakPoints[0] || null,
    topWeakPoints: weakPoints.slice(0, 3),
    suggestion: result.recommendation,
    breakdown: result.breakdown,
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get color class for readiness score
 */
export function getScoreColor(score: number): string {
  if (score >= 85) return 'text-emerald-400'
  if (score >= 70) return 'text-green-400'
  if (score >= 50) return 'text-yellow-400'
  if (score >= 25) return 'text-orange-400'
  return 'text-red-400'
}

/**
 * Get background color class for readiness level
 */
export function getLevelBgColor(level: ReadinessLevel): string {
  switch (level) {
    case 'advanced-ready': return 'bg-emerald-500/20 border-emerald-500/40'
    case 'intermediate-progression': return 'bg-green-500/20 border-green-500/40'
    case 'early-progression': return 'bg-yellow-500/20 border-yellow-500/40'
    case 'foundation-phase': return 'bg-orange-500/20 border-orange-500/40'
    case 'not-ready': return 'bg-red-500/20 border-red-500/40'
  }
}

/**
 * Get status color for breakdown items
 */
export function getStatusColor(status: ScoreBreakdown['status']): string {
  switch (status) {
    case 'strong': return 'text-emerald-400'
    case 'adequate': return 'text-green-400'
    case 'developing': return 'text-yellow-400'
    case 'weak': return 'text-red-400'
  }
}
