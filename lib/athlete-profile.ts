// Athlete Profile Types for Onboarding
// These range-based types allow quick selection without exact values
// The Adaptive Training Engine uses these to calibrate training recommendations

export type HeightRange =
  | 'under_5_4'
  | '5_4_to_5_7'
  | '5_7_to_5_10'
  | '5_10_to_6_1'
  | '6_1_to_6_4'
  | 'over_6_4'

export type WeightRange =
  | 'under_140'
  | '140_160'
  | '160_180'
  | '180_200'
  | '200_220'
  | 'over_220'

export type PullUpCapacity =
  | '0_3'
  | '4_7'
  | '8_12'
  | '13_17'
  | '18_22'
  | '23_plus'

export type PushUpCapacity =
  | '0_10'
  | '10_25'
  | '25_40'
  | '40_60'
  | '60_plus'

export type DipCapacity =
  | '0'
  | '1_5'
  | '6_10'
  | '11_15'
  | '16_20'
  | '21_25'
  | '25_plus'

export type LSitCapacity =
  | 'none'
  | 'under_10'
  | '10_20'
  | '20_plus'

export type TrainingTimeRange =
  | '10_20'
  | '20_30'
  | '30_45'
  | '45_60'
  | '60_plus'

export type WeeklyTrainingDays =
  | '2'
  | '3'
  | '4'
  | '5_plus'

export type OnboardingGoal =
  | 'skill'
  | 'strength'
  | 'endurance'
  | 'abs'
  | 'general'

export type SkillInterest =
  | 'front_lever'
  | 'planche'
  | 'muscle_up'
  | 'handstand_pushup'
  | 'l_sit'
  | 'compression'

export type FlexibilityFocus = 'none' | 'minor' | 'important'

export type FlexibilityGoal =
  | 'pancake'
  | 'toe_touch'
  | 'front_splits'
  | 'side_splits'

export type EquipmentType =
  | 'pullup_bar'
  | 'dip_bars'
  | 'parallettes'
  | 'rings'
  | 'resistance_bands'
  | 'none'

export type EnduranceInterest = 'yes' | 'occasionally' | 'no'

export interface OnboardingProfile {
  sex: 'male' | 'female' | null
  heightRange: HeightRange | null
  weightRange: WeightRange | null
  pullUpCapacity: PullUpCapacity | null
  pushUpCapacity: PushUpCapacity | null
  dipCapacity: DipCapacity | null
  lSitCapacity: LSitCapacity | null
  trainingTime: TrainingTimeRange | null
  weeklyTraining: WeeklyTrainingDays | null
  primaryGoal: OnboardingGoal | null
  // New fields for enhanced onboarding
  skillInterests: SkillInterest[]
  flexibilityFocus: FlexibilityFocus | null
  flexibilityGoals: FlexibilityGoal[]
  equipment: EquipmentType[]
  enduranceInterest: EnduranceInterest | null
  // First-run experience flags
  hasSeenDashboardIntro: boolean
}

// Labels for display
export const HEIGHT_LABELS: Record<HeightRange, string> = {
  'under_5_4': "Under 5'4\"",
  '5_4_to_5_7': "5'4\" – 5'7\"",
  '5_7_to_5_10': "5'7\" – 5'10\"",
  '5_10_to_6_1': "5'10\" – 6'1\"",
  '6_1_to_6_4': "6'1\" – 6'4\"",
  'over_6_4': "Over 6'4\"",
}

export const WEIGHT_LABELS: Record<WeightRange, string> = {
  'under_140': 'Under 140 lbs',
  '140_160': '140 – 160 lbs',
  '160_180': '160 – 180 lbs',
  '180_200': '180 – 200 lbs',
  '200_220': '200 – 220 lbs',
  'over_220': '220+ lbs',
}

export const PULLUP_LABELS: Record<PullUpCapacity, string> = {
  '0_3': '0–3',
  '4_7': '4–7',
  '8_12': '8–12',
  '13_17': '13–17',
  '18_22': '18–22',
  '23_plus': '23+',
}

export const PUSHUP_LABELS: Record<PushUpCapacity, string> = {
  '0_10': '0–10',
  '10_25': '10–25',
  '25_40': '25–40',
  '40_60': '40–60',
  '60_plus': '60+',
}

export const DIP_LABELS: Record<DipCapacity, string> = {
  '0': '0',
  '1_5': '1–5',
  '6_10': '6–10',
  '11_15': '11–15',
  '16_20': '16–20',
  '21_25': '21–25',
  '25_plus': '25+',
}

export const LSIT_LABELS: Record<LSitCapacity, string> = {
  'none': 'No',
  'under_10': 'Under 10 sec',
  '10_20': '10–20 sec',
  '20_plus': '20+ sec',
}

export const TRAINING_TIME_LABELS: Record<TrainingTimeRange, string> = {
  '10_20': '10–20 min',
  '20_30': '20–30 min',
  '30_45': '30–45 min',
  '45_60': '45–60 min',
  '60_plus': '60+ min',
}

export const WEEKLY_TRAINING_LABELS: Record<WeeklyTrainingDays, string> = {
  '2': '2',
  '3': '3',
  '4': '4',
  '5_plus': '5+',
}

export const GOAL_LABELS: Record<OnboardingGoal, string> = {
  'skill': 'Unlock skills',
  'strength': 'Build strength',
  'endurance': 'Improve endurance',
  'abs': 'Visible abs / core',
  'general': 'General fitness',
}

export const SKILL_INTEREST_LABELS: Record<SkillInterest, string> = {
  'front_lever': 'Front Lever',
  'planche': 'Planche',
  'muscle_up': 'Muscle-Up',
  'handstand_pushup': 'Handstand Push-Up',
  'l_sit': 'L-Sit / V-Sit',
  'compression': 'Compression Skills',
}

export const FLEXIBILITY_FOCUS_LABELS: Record<FlexibilityFocus, string> = {
  'none': 'Not a focus',
  'minor': 'Minor accessory goal',
  'important': 'Important training goal',
}

export const FLEXIBILITY_GOAL_LABELS: Record<FlexibilityGoal, string> = {
  'pancake': 'Pancake stretch',
  'toe_touch': 'Toe touch',
  'front_splits': 'Front splits',
  'side_splits': 'Side splits',
}

export const EQUIPMENT_LABELS: Record<EquipmentType, string> = {
  'pullup_bar': 'Pull-up bar',
  'dip_bars': 'Dip bars',
  'parallettes': 'Parallettes',
  'rings': 'Gym rings',
  'resistance_bands': 'Resistance bands',
  'none': 'None / minimal',
}

export const ENDURANCE_INTEREST_LABELS: Record<EnduranceInterest, string> = {
  'yes': 'Yes, regularly',
  'occasionally': 'Occasionally',
  'no': 'Not really',
}

// Storage key for onboarding profile
const ONBOARDING_STORAGE_KEY = 'spartanlab_onboarding_profile'

// Save onboarding profile to localStorage
export function saveOnboardingProfile(profile: OnboardingProfile): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(profile))
  }
}

// Get onboarding profile from localStorage
export function getOnboardingProfile(): OnboardingProfile | null {
  if (typeof window === 'undefined') return null
  
  const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY)
  if (!stored) return null
  
  try {
    return JSON.parse(stored)
  } catch {
    return null
  }
}

// Check if onboarding is complete
export function isOnboardingComplete(): boolean {
  const profile = getOnboardingProfile()
  if (!profile) return false
  
  return (
    profile.sex !== null &&
    profile.heightRange !== null &&
    profile.weightRange !== null &&
    profile.pullUpCapacity !== null &&
    profile.dipCapacity !== null &&
    profile.lSitCapacity !== null &&
    profile.trainingTime !== null &&
    profile.weeklyTraining !== null &&
    profile.primaryGoal !== null &&
    profile.equipment.length > 0 &&
    profile.enduranceInterest !== null
  )
}

// Create empty onboarding profile
export function createEmptyOnboardingProfile(): OnboardingProfile {
  return {
    sex: null,
    heightRange: null,
    weightRange: null,
    pullUpCapacity: null,
    pushUpCapacity: null,
    dipCapacity: null,
    lSitCapacity: null,
    trainingTime: null,
    weeklyTraining: null,
    primaryGoal: null,
    skillInterests: [],
    flexibilityFocus: null,
    flexibilityGoals: [],
    equipment: [],
    enduranceInterest: null,
    hasSeenDashboardIntro: false,
  }
}

// Check if user has seen dashboard intro
export function hasSeenDashboardIntro(): boolean {
  const profile = getOnboardingProfile()
  return profile?.hasSeenDashboardIntro ?? false
}

// Mark dashboard intro as seen
export function markDashboardIntroSeen(): void {
  const profile = getOnboardingProfile()
  if (profile) {
    saveOnboardingProfile({
      ...profile,
      hasSeenDashboardIntro: true,
    })
  }
}

// Reset dashboard intro (for testing or help access)
export function resetDashboardIntro(): void {
  const profile = getOnboardingProfile()
  if (profile) {
    saveOnboardingProfile({
      ...profile,
      hasSeenDashboardIntro: false,
    })
  }
}

// Convert onboarding profile to strength tier estimate
export function estimateStrengthTier(profile: OnboardingProfile): 'novice' | 'developing' | 'intermediate' | 'advanced' | 'elite' {
  if (!profile.pullUpCapacity || !profile.dipCapacity) return 'novice'
  
  const pullupScore = {
    '0': 0,
    '1_3': 1,
    '4_7': 2,
    '8_12': 3,
    '13_17': 4,
    '18_22': 5,
    '23_plus': 6,
  }[profile.pullUpCapacity]
  
  const dipScore = {
    '0': 0,
    '1_5': 1,
    '6_10': 2,
    '11_15': 3,
    '16_20': 4,
    '21_25': 5,
    '25_plus': 6,
  }[profile.dipCapacity]
  
  const avgScore = (pullupScore + dipScore) / 2
  
  if (avgScore <= 1) return 'novice'
  if (avgScore <= 2.5) return 'developing'
  if (avgScore <= 4) return 'intermediate'
  if (avgScore <= 5) return 'advanced'
  return 'elite'
}

// Convert onboarding goal to program builder goal
export function mapOnboardingGoalToProgram(goal: OnboardingGoal): string {
  const goalMap: Record<OnboardingGoal, string> = {
    'skill': 'front_lever', // Default skill focus
    'strength': 'weighted_strength',
    'endurance': 'general_strength',
    'abs': 'general_strength',
    'general': 'general_strength',
  }
  return goalMap[goal] || 'general_strength'
}

// Convert training time range to session length minutes
export function mapTrainingTimeToMinutes(time: TrainingTimeRange): number {
  const timeMap: Record<TrainingTimeRange, number> = {
    '10_20': 20,
    '20_30': 30,
    '30_45': 45,
    '45_60': 60,
    '60_plus': 75,
  }
  return timeMap[time] || 45
}

// Convert weekly training to days number
export function mapWeeklyTrainingToDays(weekly: WeeklyTrainingDays): number {
  const daysMap: Record<WeeklyTrainingDays, number> = {
    '2': 2,
    '3': 3,
    '4': 4,
    '5_plus': 5,
  }
  return daysMap[weekly] || 3
}

// Get experience level from onboarding data
export function mapStrengthTierToExperience(tier: ReturnType<typeof estimateStrengthTier>): 'beginner' | 'intermediate' | 'advanced' {
  if (tier === 'novice' || tier === 'developing') return 'beginner'
  if (tier === 'intermediate') return 'intermediate'
  return 'advanced'
}

// Generate suggested program inputs from onboarding profile
export function suggestProgramInputsFromOnboarding(profile: OnboardingProfile) {
  const strengthTier = estimateStrengthTier(profile)
  
  return {
    experienceLevel: mapStrengthTierToExperience(strengthTier),
    sessionLength: profile.trainingTime ? mapTrainingTimeToMinutes(profile.trainingTime) : 45,
    trainingDaysPerWeek: profile.weeklyTraining ? mapWeeklyTrainingToDays(profile.weeklyTraining) : 3,
    primaryGoal: profile.primaryGoal ? mapOnboardingGoalToProgram(profile.primaryGoal) : 'general_strength',
    estimatedStrengthTier: strengthTier,
  }
}
