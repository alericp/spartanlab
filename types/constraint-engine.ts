// Constraint Engine Types
// Types for the primary limiter detection system

export type ConstraintType =
  | 'skill_density_deficit'
  | 'progression_jump_too_large'
  | 'inconsistent_skill_exposure'
  | 'pull_strength_deficit'
  | 'push_strength_deficit'
  | 'core_tension_deficit'
  | 'strength_imbalance'
  | 'pull_volume_low'
  | 'push_volume_low'
  | 'total_volume_low'
  | 'horizontal_pull_neglect'
  | 'fatigue_accumulation'
  | 'recovery_deficit'
  | 'training_inconsistency'
  | 'no_primary_constraint'
  | 'insufficient_data'

export type ConstraintCategory = 'skill' | 'strength' | 'volume' | 'recovery' | 'none'

export type ConfidenceLevel = 'high' | 'medium' | 'low'

export interface ConstraintSignal {
  type: ConstraintType
  category: ConstraintCategory
  score: number // 0-10 scoring
  confidence: ConfidenceLevel
  rawMetrics?: Record<string, number | string | boolean | null>
}

export interface FocusItem {
  action: string
  priority: 'primary' | 'secondary'
}

export interface ConstraintResult {
  primaryConstraint: ConstraintType
  constraintLabel: string
  category: ConstraintCategory
  confidence: ConfidenceLevel
  score: number
  secondarySignal?: ConstraintType
  secondaryLabel?: string
  recommendedFocus: FocusItem[]
  explanation: string
  dataQuality: 'sufficient' | 'partial' | 'insufficient'
}

// Constraint labels for display
export const CONSTRAINT_LABELS: Record<ConstraintType, string> = {
  skill_density_deficit: 'Skill Exposure Too Low',
  progression_jump_too_large: 'Progression Too Advanced',
  inconsistent_skill_exposure: 'Training Inconsistency',
  pull_strength_deficit: 'Pulling Strength Deficit',
  push_strength_deficit: 'Pushing Strength Deficit',
  core_tension_deficit: 'Core Tension Deficit',
  strength_imbalance: 'Push/Pull Imbalance',
  pull_volume_low: 'Low Pull Volume',
  push_volume_low: 'Low Push Volume',
  total_volume_low: 'Volume Too Low',
  horizontal_pull_neglect: 'Horizontal Pulling Neglect',
  fatigue_accumulation: 'Recovery / Fatigue Limiter',
  recovery_deficit: 'Recovery / Fatigue Limiter',
  training_inconsistency: 'Training Inconsistency',
  no_primary_constraint: 'No Primary Constraint',
  insufficient_data: 'More Data Needed',
}

export const CONSTRAINT_CATEGORY_LABELS: Record<ConstraintCategory, string> = {
  skill: 'Skill Training',
  strength: 'Strength Foundation',
  volume: 'Training Volume',
  recovery: 'Recovery & Fatigue',
  none: 'Balanced',
}
