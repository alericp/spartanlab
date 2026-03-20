/**
 * Weekly Load Balancing Engine
 * 
 * TASK 4: Improves weekly stress distribution so advanced skill users don't get:
 * - Too many similar hard days
 * - Too much straight-arm stress stacked badly
 * - Too much accessory overlap
 * - A fake "adaptive" week that is just four similar sessions
 */

// =============================================================================
// TYPES
// =============================================================================

export type StressCategory = 
  | 'straight_arm_push'    // Planche, maltese
  | 'straight_arm_pull'    // Front lever, back lever
  | 'bent_arm_push'        // Dips, push-ups, HSPU
  | 'bent_arm_pull'        // Pull-ups, rows
  | 'weighted_push'        // Weighted dips
  | 'weighted_pull'        // Weighted pull-ups
  | 'compression_core'     // L-sit, V-sit, hollow
  | 'neural_high'          // Max effort skill work
  | 'tendon_high'          // Straight-arm hold stress

export type DayIntensity = 'high' | 'moderate' | 'low' | 'recovery'

export interface DayStressProfile {
  dayIndex: number
  dayName: string
  intensity: DayIntensity
  stressCategories: StressCategory[]
  primaryFocus: string
  neuralLoad: number      // 0-100
  tendonLoad: number      // 0-100
  volumeLoad: number      // 0-100
  isPushEmphasis: boolean
  isPullEmphasis: boolean
  isMixedDay: boolean
}

export interface WeeklyStressBalance {
  days: DayStressProfile[]
  totalNeuralLoad: number
  totalTendonLoad: number
  straightArmDays: number
  consecutiveHighDays: number
  recoveryDaysPresent: boolean
  balanceScore: number    // 0-100, higher is better
  issues: string[]
  recommendations: string[]
}

// =============================================================================
// STRESS WEIGHTS BY CATEGORY
// =============================================================================

const STRESS_WEIGHTS: Record<StressCategory, { neural: number; tendon: number; volume: number }> = {
  straight_arm_push: { neural: 85, tendon: 90, volume: 60 },
  straight_arm_pull: { neural: 80, tendon: 85, volume: 55 },
  bent_arm_push: { neural: 50, tendon: 30, volume: 70 },
  bent_arm_pull: { neural: 55, tendon: 35, volume: 70 },
  weighted_push: { neural: 60, tendon: 40, volume: 75 },
  weighted_pull: { neural: 65, tendon: 45, volume: 75 },
  compression_core: { neural: 40, tendon: 50, volume: 50 },
  neural_high: { neural: 90, tendon: 60, volume: 40 },
  tendon_high: { neural: 70, tendon: 95, volume: 50 },
}

// =============================================================================
// BALANCED WEEKLY TEMPLATES
// =============================================================================

export interface WeeklyTemplate {
  name: string
  description: string
  forGoals: string[]
  days: Array<{
    dayType: 'primary_skill' | 'secondary_skill' | 'strength_support' | 'mixed_density' | 'recovery'
    intensity: DayIntensity
    allowedStress: StressCategory[]
    maxNeuralLoad: number
    maxTendonLoad: number
  }>
}

/**
 * TASK 4: Balanced weekly templates for hybrid skill athletes
 */
export const WEEKLY_TEMPLATES: Record<string, WeeklyTemplate> = {
  hybrid_push_primary_4day: {
    name: 'Hybrid Push Primary (4-day)',
    description: 'Planche primary with pull secondary. Respects tendon recovery.',
    forGoals: ['planche', 'front_lever'],
    days: [
      {
        dayType: 'primary_skill',
        intensity: 'high',
        allowedStress: ['straight_arm_push', 'bent_arm_push', 'weighted_push', 'compression_core', 'neural_high'],
        maxNeuralLoad: 85,
        maxTendonLoad: 80,
      },
      {
        dayType: 'secondary_skill',
        intensity: 'moderate',
        allowedStress: ['straight_arm_pull', 'bent_arm_pull', 'weighted_pull', 'compression_core'],
        maxNeuralLoad: 70,
        maxTendonLoad: 70,
      },
      {
        dayType: 'strength_support',
        intensity: 'moderate',
        allowedStress: ['weighted_push', 'weighted_pull', 'bent_arm_push', 'bent_arm_pull', 'compression_core'],
        maxNeuralLoad: 60,
        maxTendonLoad: 50,
      },
      {
        dayType: 'mixed_density',
        intensity: 'moderate',
        allowedStress: ['straight_arm_push', 'straight_arm_pull', 'compression_core'],
        maxNeuralLoad: 65,
        maxTendonLoad: 60,
      },
    ],
  },
  
  hybrid_pull_primary_4day: {
    name: 'Hybrid Pull Primary (4-day)',
    description: 'Front lever primary with push secondary. Balanced stress.',
    forGoals: ['front_lever', 'planche'],
    days: [
      {
        dayType: 'primary_skill',
        intensity: 'high',
        allowedStress: ['straight_arm_pull', 'bent_arm_pull', 'weighted_pull', 'compression_core', 'neural_high'],
        maxNeuralLoad: 85,
        maxTendonLoad: 80,
      },
      {
        dayType: 'secondary_skill',
        intensity: 'moderate',
        allowedStress: ['straight_arm_push', 'bent_arm_push', 'weighted_push', 'compression_core'],
        maxNeuralLoad: 70,
        maxTendonLoad: 70,
      },
      {
        dayType: 'strength_support',
        intensity: 'moderate',
        allowedStress: ['weighted_pull', 'weighted_push', 'bent_arm_pull', 'bent_arm_push', 'compression_core'],
        maxNeuralLoad: 60,
        maxTendonLoad: 50,
      },
      {
        dayType: 'mixed_density',
        intensity: 'moderate',
        allowedStress: ['straight_arm_pull', 'straight_arm_push', 'compression_core'],
        maxNeuralLoad: 65,
        maxTendonLoad: 60,
      },
    ],
  },
  
  skill_strength_5day: {
    name: 'Skill + Strength (5-day)',
    description: 'For athletes who want both skill and weighted strength emphasis.',
    forGoals: ['planche', 'front_lever', 'weighted_strength'],
    days: [
      {
        dayType: 'primary_skill',
        intensity: 'high',
        allowedStress: ['straight_arm_push', 'compression_core', 'neural_high', 'tendon_high'],
        maxNeuralLoad: 85,
        maxTendonLoad: 85,
      },
      {
        dayType: 'strength_support',
        intensity: 'high',
        allowedStress: ['weighted_pull', 'weighted_push', 'bent_arm_pull', 'bent_arm_push'],
        maxNeuralLoad: 75,
        maxTendonLoad: 50,
      },
      {
        dayType: 'secondary_skill',
        intensity: 'moderate',
        allowedStress: ['straight_arm_pull', 'compression_core'],
        maxNeuralLoad: 70,
        maxTendonLoad: 75,
      },
      {
        dayType: 'strength_support',
        intensity: 'moderate',
        allowedStress: ['weighted_push', 'weighted_pull', 'bent_arm_push', 'bent_arm_pull'],
        maxNeuralLoad: 65,
        maxTendonLoad: 45,
      },
      {
        dayType: 'mixed_density',
        intensity: 'low',
        allowedStress: ['compression_core', 'bent_arm_push', 'bent_arm_pull'],
        maxNeuralLoad: 50,
        maxTendonLoad: 40,
      },
    ],
  },
  
  recovery_aware_3day: {
    name: 'Recovery-Aware (3-day)',
    description: 'For athletes with recovery constraints or joint concerns.',
    forGoals: ['planche', 'front_lever'],
    days: [
      {
        dayType: 'primary_skill',
        intensity: 'moderate',
        allowedStress: ['straight_arm_push', 'compression_core'],
        maxNeuralLoad: 70,
        maxTendonLoad: 65,
      },
      {
        dayType: 'secondary_skill',
        intensity: 'moderate',
        allowedStress: ['straight_arm_pull', 'weighted_pull', 'compression_core'],
        maxNeuralLoad: 65,
        maxTendonLoad: 60,
      },
      {
        dayType: 'strength_support',
        intensity: 'moderate',
        allowedStress: ['weighted_push', 'weighted_pull', 'bent_arm_push', 'bent_arm_pull'],
        maxNeuralLoad: 60,
        maxTendonLoad: 45,
      },
    ],
  },
}

// =============================================================================
// WEEKLY BALANCE ANALYSIS
// =============================================================================

/**
 * TASK 4: Analyze a weekly session distribution for stress balance
 */
export function analyzeWeeklyBalance(
  days: DayStressProfile[]
): WeeklyStressBalance {
  const issues: string[] = []
  const recommendations: string[] = []
  
  // Calculate totals
  let totalNeural = 0
  let totalTendon = 0
  let straightArmDays = 0
  let consecutiveHigh = 0
  let maxConsecutiveHigh = 0
  let recoveryPresent = false
  
  for (let i = 0; i < days.length; i++) {
    const day = days[i]
    totalNeural += day.neuralLoad
    totalTendon += day.tendonLoad
    
    // Check for straight-arm stress
    const hasStraightArm = day.stressCategories.some(s => 
      s === 'straight_arm_push' || s === 'straight_arm_pull' || s === 'tendon_high'
    )
    if (hasStraightArm) straightArmDays++
    
    // Track consecutive high days
    if (day.intensity === 'high') {
      consecutiveHigh++
      maxConsecutiveHigh = Math.max(maxConsecutiveHigh, consecutiveHigh)
    } else {
      consecutiveHigh = 0
    }
    
    // Check for recovery day
    if (day.intensity === 'low' || day.intensity === 'recovery') {
      recoveryPresent = true
    }
  }
  
  // Issue detection
  if (maxConsecutiveHigh >= 3) {
    issues.push('Three or more consecutive high-intensity days detected')
    recommendations.push('Insert a moderate or recovery day to allow neural recovery')
  }
  
  if (straightArmDays > 3 && days.length <= 5) {
    issues.push('Too many straight-arm stress days in the week')
    recommendations.push('Replace one skill day with bent-arm support work')
  }
  
  if (totalTendon > days.length * 70) {
    issues.push('Total weekly tendon load is high')
    recommendations.push('Consider reducing one straight-arm session or adding band assistance')
  }
  
  if (!recoveryPresent && days.length >= 4) {
    issues.push('No recovery or lower-intensity day present')
    recommendations.push('Include at least one moderate/recovery day for adaptation')
  }
  
  // Check for push/pull imbalance
  const pushDays = days.filter(d => d.isPushEmphasis).length
  const pullDays = days.filter(d => d.isPullEmphasis).length
  if (Math.abs(pushDays - pullDays) >= 2 && days.length >= 4) {
    issues.push(`Push/pull imbalance detected (${pushDays} push vs ${pullDays} pull days)`)
    recommendations.push('Balance push and pull emphasis across the week')
  }
  
  // Calculate balance score
  let balanceScore = 100
  balanceScore -= maxConsecutiveHigh >= 3 ? 20 : 0
  balanceScore -= straightArmDays > 3 ? 15 : 0
  balanceScore -= !recoveryPresent && days.length >= 4 ? 10 : 0
  balanceScore -= Math.abs(pushDays - pullDays) >= 2 ? 10 : 0
  balanceScore -= totalTendon > days.length * 70 ? 15 : 0
  balanceScore = Math.max(0, balanceScore)
  
  return {
    days,
    totalNeuralLoad: totalNeural,
    totalTendonLoad: totalTendon,
    straightArmDays,
    consecutiveHighDays: maxConsecutiveHigh,
    recoveryDaysPresent: recoveryPresent,
    balanceScore,
    issues,
    recommendations,
  }
}

// =============================================================================
// DAY STRESS CLASSIFICATION
// =============================================================================

/**
 * Classify a day's stress profile based on its exercises
 */
export function classifyDayStress(
  dayFocus: string,
  exercises: Array<{
    name: string
    category: string
    isIsometric?: boolean
    isWeighted?: boolean
    isPrimarySkill?: boolean
  }>
): DayStressProfile {
  const stressCategories: StressCategory[] = []
  let neuralLoad = 0
  let tendonLoad = 0
  let volumeLoad = 0
  let isPushEmphasis = false
  let isPullEmphasis = false
  
  // Classify based on focus
  if (dayFocus.includes('push') || dayFocus.includes('planche') || dayFocus.includes('hspu')) {
    isPushEmphasis = true
  }
  if (dayFocus.includes('pull') || dayFocus.includes('lever') || dayFocus.includes('muscle_up')) {
    isPullEmphasis = true
  }
  
  // Analyze exercises
  for (const ex of exercises) {
    const name = ex.name.toLowerCase()
    const cat = ex.category.toLowerCase()
    
    // Straight-arm stress detection
    if (name.includes('planche') || name.includes('maltese')) {
      stressCategories.push('straight_arm_push')
      if (!stressCategories.includes('tendon_high')) {
        stressCategories.push('tendon_high')
      }
    }
    if (name.includes('front lever') || name.includes('back lever')) {
      stressCategories.push('straight_arm_pull')
      if (!stressCategories.includes('tendon_high')) {
        stressCategories.push('tendon_high')
      }
    }
    
    // Weighted stress
    if (ex.isWeighted || name.includes('weighted')) {
      if (cat === 'push' || name.includes('dip')) {
        stressCategories.push('weighted_push')
      } else if (cat === 'pull' || name.includes('pull')) {
        stressCategories.push('weighted_pull')
      }
    }
    
    // Bent-arm stress
    if (!ex.isWeighted && !name.includes('lever') && !name.includes('planche')) {
      if (cat === 'push' || name.includes('push') || name.includes('dip')) {
        if (!stressCategories.includes('bent_arm_push')) {
          stressCategories.push('bent_arm_push')
        }
      }
      if (cat === 'pull' || name.includes('pull') || name.includes('row')) {
        if (!stressCategories.includes('bent_arm_pull')) {
          stressCategories.push('bent_arm_pull')
        }
      }
    }
    
    // Compression/core
    if (cat === 'core' || name.includes('l-sit') || name.includes('v-sit') || name.includes('hollow')) {
      if (!stressCategories.includes('compression_core')) {
        stressCategories.push('compression_core')
      }
    }
    
    // Neural high detection
    if (ex.isPrimarySkill && (ex.isIsometric || name.includes('hold'))) {
      if (!stressCategories.includes('neural_high')) {
        stressCategories.push('neural_high')
      }
    }
  }
  
  // Calculate loads from stress categories
  for (const cat of stressCategories) {
    const weights = STRESS_WEIGHTS[cat]
    neuralLoad = Math.max(neuralLoad, weights.neural)
    tendonLoad = Math.max(tendonLoad, weights.tendon)
    volumeLoad += weights.volume * 0.3 // Accumulate volume
  }
  
  // Cap volume
  volumeLoad = Math.min(100, volumeLoad)
  
  // Determine intensity
  let intensity: DayIntensity = 'moderate'
  if (neuralLoad >= 80 || tendonLoad >= 80) {
    intensity = 'high'
  } else if (neuralLoad <= 50 && tendonLoad <= 50) {
    intensity = 'low'
  }
  
  return {
    dayIndex: 0, // To be set by caller
    dayName: '',  // To be set by caller
    intensity,
    stressCategories,
    primaryFocus: dayFocus,
    neuralLoad,
    tendonLoad,
    volumeLoad,
    isPushEmphasis,
    isPullEmphasis,
    isMixedDay: isPushEmphasis && isPullEmphasis,
  }
}

// =============================================================================
// TEMPLATE SELECTION
// =============================================================================

/**
 * Select the best weekly template for an athlete's goals
 */
export function selectWeeklyTemplate(
  primaryGoal: string,
  secondaryGoal: string | null,
  trainingDays: number,
  hasRecoveryConcerns: boolean
): WeeklyTemplate {
  // Recovery-aware for joint concerns
  if (hasRecoveryConcerns && trainingDays <= 3) {
    return WEEKLY_TEMPLATES.recovery_aware_3day
  }
  
  // Push primary (planche, HSPU)
  const pushSkills = ['planche', 'handstand_pushup']
  if (pushSkills.includes(primaryGoal)) {
    if (trainingDays >= 5) {
      return WEEKLY_TEMPLATES.skill_strength_5day
    }
    return WEEKLY_TEMPLATES.hybrid_push_primary_4day
  }
  
  // Pull primary (front lever, muscle-up)
  const pullSkills = ['front_lever', 'muscle_up', 'back_lever']
  if (pullSkills.includes(primaryGoal)) {
    if (trainingDays >= 5) {
      return WEEKLY_TEMPLATES.skill_strength_5day
    }
    return WEEKLY_TEMPLATES.hybrid_pull_primary_4day
  }
  
  // Default to hybrid push primary
  return WEEKLY_TEMPLATES.hybrid_push_primary_4day
}

// =============================================================================
// DEV DIAGNOSTICS (TASK 10)
// =============================================================================

export function logWeeklyBalanceDiagnostics(balance: WeeklyStressBalance): void {
  if (process.env.NODE_ENV === 'development') {
    console.log('[WeeklyLoadBalance] TASK 10 DIAG:', {
      totalNeuralLoad: balance.totalNeuralLoad,
      totalTendonLoad: balance.totalTendonLoad,
      straightArmDays: balance.straightArmDays,
      consecutiveHighDays: balance.consecutiveHighDays,
      balanceScore: balance.balanceScore,
      issues: balance.issues.length > 0 ? balance.issues : 'None',
    })
  }
}
