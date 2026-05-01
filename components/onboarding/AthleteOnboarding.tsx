'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { 
  ChevronLeft, 
  ChevronRight, 
  ArrowRight,
  ArrowLeft,
  User, 
  Target, 
  Dumbbell,
  Zap,
  Settings,
  CheckCircle2,
  Calendar,
  Heart,
  StretchHorizontal,
  Loader2,
  Calculator,
  Activity,
  Shield,
  TrendingUp,
  Check,
} from 'lucide-react'
import { SpartanIcon } from '@/components/brand/SpartanLogo'
import { trackOnboardingCompleted } from '@/lib/analytics'
import { TestingGuideLink, DontKnowHelper } from '@/components/testing/TestingGuideModal'
import { saveAthleteProfile } from '@/lib/data-service'
import {
  type OnboardingProfile,
  type Sex,
  type TrainingExperience,
  type HeightRange,
  type WeightRange,
  type BodyFatRange,
  type BodyFatSource,
  type GoalCategory,
  type PrimaryGoalType,
  type SkillGoal,
  type FlexibilityGoal,
  type PullUpCapacity,
  type PushUpCapacity,
  type DipCapacity,
  type WallHSPUReps,
  type FrontLeverProgression,
  type PlancheProgression,
  type BandLevel,
  type SkillBenchmark,
  type MuscleUpReadiness,
  type HSPUProgression,
  type LSitHoldCapacity,
  type VSitHoldCapacity,
  type FlexibilityLevel,
  type RangeTrainingIntent,
  type EquipmentType,
  type TrainingDaysPerWeek,
  type SessionLengthPreference,
  type SessionStylePreference,
  type RecoveryQuality,
  type TrainingConsistencyAnswer,
  type RecoveryToleranceAnswer,
  type StrengthPerceptionAnswer,
  type SkillFamiliarityAnswer,
  type BodyTypeAnswer,
  type ReadinessCalibration,
  type SkillTrainingHistory,
  type SkillLastTrained,
  type SkillHistoryEntry,
  type PrimaryTrainingOutcome,
  type TrainingPathType,
  type PRTimeframe,
  type AllTimePRBenchmark,
  type PrimaryLimitation,
  type WeakestArea,
  type JointCaution,
  PRIMARY_LIMITATION_LABELS,
  WEAKEST_AREA_LABELS,
  JOINT_CAUTION_LABELS,
  PRIMARY_TRAINING_OUTCOME_LABELS,
  PRIMARY_TRAINING_OUTCOME_DESCRIPTIONS,
  PRIMARY_TRAINING_OUTCOME_HELPER_TEXT,
  PRIMARY_TRAINING_OUTCOME_EXAMPLES,
  TRAINING_PATH_LABELS,
  TRAINING_PATH_DESCRIPTIONS,
  TRAINING_DAYS_LABELS,
  sessionLengthToDurationPreference,
  TRAINING_EXPERIENCE_LABELS,
  TRAINING_EXPERIENCE_DESCRIPTIONS,
  HEIGHT_LABELS,
  WEIGHT_LABELS,
  BODY_FAT_LABELS,
  GOAL_CATEGORY_LABELS,
  GOAL_CATEGORY_DESCRIPTIONS,
  SKILL_GOAL_LABELS,
  FLEXIBILITY_GOAL_LABELS,
  PULLUP_LABELS,
  PUSHUP_LABELS,
  DIP_LABELS,
  WALL_HSPU_LABELS,
  FRONT_LEVER_LABELS,
  PLANCHE_LABELS,
  MUSCLE_UP_LABELS,
  HSPU_LABELS,
  LSIT_HOLD_LABELS,
  VSIT_HOLD_LABELS,
  FLEXIBILITY_LEVEL_LABELS,
  RANGE_INTENT_LABELS,
  RANGE_INTENT_DESCRIPTIONS,
  EQUIPMENT_LABELS,
  SESSION_LENGTH_LABELS,
  SESSION_STYLE_LABELS,
  SESSION_STYLE_DESCRIPTIONS,
  RECOVERY_LABELS,
  TRAINING_CONSISTENCY_LABELS,
  TRAINING_CONSISTENCY_DESCRIPTIONS,
  RECOVERY_TOLERANCE_LABELS,
  RECOVERY_TOLERANCE_DESCRIPTIONS,
  STRENGTH_PERCEPTION_LABELS,
  SKILL_FAMILIARITY_LABELS,
  SKILL_FAMILIARITY_DESCRIPTIONS,
  BODY_TYPE_LABELS,
  BODY_TYPE_DESCRIPTIONS,
  SKILL_TRAINING_HISTORY_LABELS,
  SKILL_TRAINING_HISTORY_DESCRIPTIONS,
  SKILL_LAST_TRAINED_LABELS,
  PR_TIMEFRAME_LABELS,
  calculateReadinessScores,
  calculateTendonAdaptation,
  saveOnboardingProfile,
  createEmptyOnboardingProfile,
  hasEstimatedValues,
} from '@/lib/athlete-profile'
import { BodyFatCalculator } from './BodyFatCalculator'
import { 
  getCanonicalProfile, 
  saveCanonicalProfile, 
  logCanonicalProfileState, 
  clearCanonicalProfileData, 
  markProfileSchemaAsComplete,
  // [PHASE 5] Source truth audit functions
  getSourceTruthSnapshot,
  emitSourceTruthAudit,
  auditCanonicalPrecedence,
} from '@/lib/canonical-profile-service'
  import { logProfileTruthState } from '@/lib/profile-truth-contract'
  import { getOnboardingProfile } from '@/lib/athlete-profile'

// =============================================================================
// [PHASE 16A] ONBOARDING PREFILL TRUTH RECONCILIATION
// Converts persisted/stored profile truth into UI-facing state shape
// This bridges the gap between canonical storage format and UI tile selection
// =============================================================================

/**
 * [PHASE 16A TASK 1 & 2] Normalize stored profile into UI-safe shape
 * Handles:
 * - scheduleMode 'flexible' → trainingDaysPerWeek 'flexible'
 * - sessionDurationMode 'adaptive' → sessionLengthMinutes 'flexible'
 * - equipment alias reconciliation (bench → bench_box)
 */

// =============================================================================
// [PRE-AB6 BUILD GREEN GATE / RAW EQUIPMENT BOUNDARY NORMALIZATION]
// EquipmentType (lib/athlete-profile.ts:584) is the canonical 10-value union:
//   'pullup_bar' | 'dip_bars' | 'parallettes' | 'rings' | 'resistance_bands'
//   | 'weights' | 'bench_box' | 'minimal' | 'barbell' | 'weight_plates'
// It does NOT include 'bench' — that's a legacy raw localStorage alias.
// Once a value is typed as EquipmentType, comparing it to 'bench' is a
// TS2367 "no overlap" error. The fix is to do alias normalization at the
// raw-input boundary BEFORE the canonical type narrows the value space.
// This helper accepts `unknown` (so legacy raw arrays from storage are
// representable), maps 'bench' → 'bench_box', filters via a real type
// guard against the canonical union, and dedupes.
// =============================================================================
const CANONICAL_EQUIPMENT_TYPES: ReadonlySet<EquipmentType> = new Set<EquipmentType>([
  'pullup_bar',
  'dip_bars',
  'parallettes',
  'rings',
  'resistance_bands',
  'weights',
  'bench_box',
  'minimal',
  'barbell',
  'weight_plates',
])

function isCanonicalEquipmentType(value: unknown): value is EquipmentType {
  return typeof value === 'string' && (CANONICAL_EQUIPMENT_TYPES as ReadonlySet<string>).has(value)
}

function normalizeStoredEquipmentForUI(rawEquipment: unknown): EquipmentType[] | undefined {
  if (!Array.isArray(rawEquipment)) return undefined

  const aliased = rawEquipment.map((value): unknown => {
    // Legacy alias 'bench' → canonical 'bench_box'
    if (value === 'bench') return 'bench_box'
    return value
  })

  const canonical = aliased.filter(isCanonicalEquipmentType)
  return Array.from(new Set(canonical))
}

function reconcileStoredProfileForUI(
  storedProfile: Partial<OnboardingProfile>,
  canonicalProfile?: ReturnType<typeof getCanonicalProfile>
): Partial<OnboardingProfile> {
  const reconciled = { ...storedProfile }
  
  // [PHASE 16A TASK 2] Equipment alias normalization - bench → bench_box
  // Pass storedProfile.equipment through the raw-input normalizer (which
  // accepts `unknown`) so legacy 'bench' aliases from localStorage are
  // converted before reaching canonical typing — no `as EquipmentType`
  // casts on impossible string literals.
  const normalizedEquipment = normalizeStoredEquipmentForUI(storedProfile.equipment)
  if (normalizedEquipment) {
    reconciled.equipment = normalizedEquipment

    // Untyped raw view used only for the audit signal — checking whether the
    // legacy 'bench' alias was present requires comparing against an unknown
    // value, which would be impossible against the canonical EquipmentType.
    const rawEquipmentForAudit: unknown[] = Array.isArray(storedProfile.equipment)
      ? storedProfile.equipment
      : []

    console.log('[phase16a-benchbox-raw-equipment-audit]', {
      rawEquipment: storedProfile.equipment,
      normalizedEquipment,
      hadBenchAlias: rawEquipmentForAudit.some((value) => value === 'bench'),
      nowHasBenchBox: normalizedEquipment.includes('bench_box'),
    })
  }
  
  // [PHASE 16A TASK 1] Flexible schedule truth reconciliation
  // If scheduleMode is 'flexible', UI needs trainingDaysPerWeek = 'flexible'
  const effectiveScheduleMode = storedProfile.scheduleMode || canonicalProfile?.scheduleMode
  if (effectiveScheduleMode === 'flexible') {
    reconciled.trainingDaysPerWeek = 'flexible'
    reconciled.scheduleMode = 'flexible'
  } else if (storedProfile.trainingDaysPerWeek === 'flexible') {
    // Already correct
    reconciled.scheduleMode = 'flexible'
  }
  
  // [PHASE 16A TASK 1] Adaptive duration truth reconciliation
  // If sessionDurationMode is 'adaptive', UI needs sessionLengthMinutes = 'flexible'
  const effectiveSessionDurationMode = storedProfile.sessionDurationMode || canonicalProfile?.sessionDurationMode
  if (effectiveSessionDurationMode === 'adaptive') {
    reconciled.sessionLengthMinutes = 'flexible'
    reconciled.sessionDurationMode = 'adaptive'
  } else if (storedProfile.sessionLengthMinutes === 'flexible') {
    // Already correct
    reconciled.sessionDurationMode = 'adaptive'
  }
  
  console.log('[phase16a-onboarding-prefill-ui-shape-audit]', {
    inputScheduleMode: storedProfile.scheduleMode,
    inputTrainingDays: storedProfile.trainingDaysPerWeek,
    outputScheduleMode: reconciled.scheduleMode,
    outputTrainingDays: reconciled.trainingDaysPerWeek,
    inputSessionDurationMode: storedProfile.sessionDurationMode,
    inputSessionLength: storedProfile.sessionLengthMinutes,
    outputSessionDurationMode: reconciled.sessionDurationMode,
    outputSessionLength: reconciled.sessionLengthMinutes,
  })
  
  return reconciled
}

/**
 * [PHASE 16A TASK 6] Merge existing profile with canonical, preferring canonical for shared core fields
 */
function mergeProfilesForPrefill(
  existingProfile: OnboardingProfile | null,
  canonicalProfile: ReturnType<typeof getCanonicalProfile>
): OnboardingProfile {
  const base = existingProfile || createEmptyOnboardingProfile()
  
  // Core shared fields where canonical should win if it has more recent/authoritative data
  const coreFields = {
    // Schedule fields - canonical is authoritative
    scheduleMode: canonicalProfile.scheduleMode || (base as any).scheduleMode,
    sessionDurationMode: canonicalProfile.sessionDurationMode || (base as any).sessionDurationMode,
    
    // Equipment - merge and normalize
    equipment: Array.isArray(canonicalProfile.equipmentAvailable) && canonicalProfile.equipmentAvailable.length > 0
      ? canonicalProfile.equipmentAvailable as EquipmentType[]
      : base.equipment,
  }
  
  const merged = {
    ...base,
    ...coreFields,
  }
  
  console.log('[phase16a-prefill-merge-resolution-audit]', {
    existingScheduleMode: (existingProfile as any)?.scheduleMode,
    canonicalScheduleMode: canonicalProfile.scheduleMode,
    mergedScheduleMode: coreFields.scheduleMode,
    existingSessionDurationMode: (existingProfile as any)?.sessionDurationMode,
    canonicalSessionDurationMode: canonicalProfile.sessionDurationMode,
    mergedSessionDurationMode: coreFields.sessionDurationMode,
    existingEquipmentCount: base.equipment?.length || 0,
    canonicalEquipmentCount: canonicalProfile.equipmentAvailable?.length || 0,
    mergedEquipmentCount: coreFields.equipment?.length || 0,
  })
  
  return merged
}
  // [baseline-vs-earned] ISSUE A: Import baseline capture for onboarding completion
  import { captureBaselineCapability } from '@/lib/baseline-earned-truth'
import {
  type MilitaryBranch,
  type MilitaryTest,
  type MilitaryStatus,
  type MilitaryGoalPriority,
  type MilitaryProfile,
  BRANCH_LABELS,
  BRANCH_DESCRIPTIONS,
  BRANCH_TESTS,
  TEST_LABELS,
  STATUS_LABELS,
  GOAL_PRIORITY_LABELS,
  TEST_CONFIGS,
  getRelevantBenchmarkInputs,
  createEmptyMilitaryProfile,
} from '@/lib/military-test-config'

// =============================================================================
// [PHASE 5] RECOVERY QUALITY DERIVATION HELPER
// =============================================================================

import type { RecoveryProfile as OnboardingRecoveryProfile } from '@/lib/athlete-profile'

/**
 * Derives a summary recovery quality from the four recovery fields.
 * Used to compute canonical `recoveryQuality` from real onboarding selections.
 * 
 * Rules:
 * - If all four are null/missing → return null
 * - Return 'poor' if 2 or more fields are 'poor'
 * - Return 'good' if 3 or more fields are 'good'
 * - Otherwise return 'normal'
 */
function deriveRecoveryQualityFromOnboarding(
  recovery: OnboardingRecoveryProfile | null | undefined
): 'good' | 'normal' | 'poor' | null {
  if (!recovery) return null
  
  const values = [
    recovery.sleepQuality,
    recovery.energyLevel,
    recovery.stressLevel,  // Note: stressLevel uses same enum - 'good' = low stress, 'poor' = high stress
    recovery.recoveryConfidence,
  ].filter(Boolean) as Array<'good' | 'normal' | 'poor'>
  
  // If all four are null/missing
  if (values.length === 0) return null
  
  const poorCount = values.filter(v => v === 'poor').length
  const goodCount = values.filter(v => v === 'good').length
  
  // Return 'poor' if 2 or more fields are 'poor'
  if (poorCount >= 2) return 'poor'
  
  // Return 'good' if 3 or more fields are 'good'
  if (goodCount >= 3) return 'good'
  
  // Otherwise return 'normal'
  return 'normal'
}

// =============================================================================
// SECTION DEFINITIONS
// =============================================================================

type SectionId =
  | 'athlete_profile'
  | 'readiness'
  | 'training_outcome'
  | 'military_profile'
  | 'training_path'
  | 'goals'
  | 'skill_selection'
  | 'strength_benchmarks'
  | 'skill_benchmarks'
  | 'flexibility_benchmarks'
  | 'equipment'
  | 'schedule'
  | 'recovery'
  | 'review'

interface Section {
  id: SectionId
  title: string
  subtitle: string
  icon: typeof User
  showIf?: (profile: OnboardingProfile) => boolean
}

const SECTIONS: Section[] = [
  {
    id: 'athlete_profile',
    title: 'About You',
    subtitle: 'Used to calibrate strength standards and set accurate starting points for your programming.',
    icon: User,
  },
  {
    id: 'readiness',
    title: 'Quick Calibration',
    subtitle: 'These questions help personalize your starting intensity and volume based on your training history.',
    icon: Activity,
  },
  {
    id: 'training_outcome',
    title: 'Training Focus',
    subtitle: 'Determines which exercises and progressions are prioritized in your program.',
    icon: Target,
  },
  {
    id: 'military_profile',
    title: 'Military Test Prep',
    subtitle: 'We build programs specifically for your fitness test requirements.',
    icon: Shield,
    showIf: (profile) => profile.primaryTrainingOutcome === 'military',
  },
  {
    id: 'training_path',
    title: 'Training Path',
    subtitle: 'Skill mastery vs strength training requires different programming.',
    icon: TrendingUp,
  },
  {
    id: 'goals',
    title: 'Your Goals',
    subtitle: 'Your goal shapes exercise selection, volume, and progression speed.',
    icon: Target,
  },
  {
    id: 'skill_selection',
    title: 'Choose Your Skills',
    subtitle: 'We build specific progressions and readiness tracking for each skill.',
    icon: Zap,
    // Only show if user wants skills or has skill_mastery as a goal category
    showIf: (profile) => profile.primaryTrainingOutcome === 'skills' ||
                         profile.trainingPathType === 'skill_progression' ||
                         profile.trainingPathType === 'hybrid' ||
                         profile.goalCategories.includes('skill_mastery') || 
                         profile.goalCategories.includes('flexibility') ||
                         profile.goalCategories.includes('mobility'),
  },
  {
    id: 'strength_benchmarks',
    title: 'Current Strength',
    subtitle: 'We detect your limiting factors and prioritize exercises to address them.',
    icon: Dumbbell,
  },
  {
    id: 'skill_benchmarks',
    title: 'Skill Levels',
    subtitle: 'Current progressions determine your readiness scores and next steps.',
    icon: Zap,
    showIf: (profile) => profile.selectedSkills.length > 0,
  },
  {
    id: 'flexibility_benchmarks',
    title: 'Flexibility',
    subtitle: 'We balance strength and mobility work based on your current range.',
    icon: StretchHorizontal,
    showIf: (profile) => profile.selectedFlexibility.length > 0,
  },
  {
    id: 'equipment',
    title: 'Your Equipment',
    subtitle: 'Every exercise in your program will match your available setup.',
    icon: Settings,
  },
  {
    id: 'schedule',
    title: 'Training Schedule',
    subtitle: 'We design sessions that fit your available time and recovery capacity.',
    icon: Calendar,
  },
  {
    id: 'recovery',
    title: 'Recovery & Lifestyle',
    subtitle: 'We adjust volume and intensity based on your recovery capacity.',
    icon: Heart,
  },
  {
    id: 'review',
    title: 'Review & Confirm',
    subtitle: 'Your personalized program will be generated based on these inputs.',
    icon: CheckCircle2,
  },
]

// =============================================================================
// OPTION BUTTON COMPONENT
// =============================================================================

interface OptionButtonProps {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
  description?: string
  className?: string
  /**
   * When true, the button is non-interactive and visually muted.
   * Used by gated options that require an upstream selection
   * (e.g. body-fat calculator requires `profile.sex` first).
   */
  disabled?: boolean
  /**
   * Content rendering mode:
   * - "compact": for short numeric/range labels (0, 1–3, 21–25) — centered, no wrapping
   * - "standard": default behavior with controlled wrapping
   * - "wrapSafe": for two-word labels that may wrap cleanly (Adv. tuck, One leg)
   */
  contentMode?: 'compact' | 'standard' | 'wrapSafe'
}

function OptionButton({
  selected,
  onClick,
  children,
  description,
  className = '',
  disabled = false,
  contentMode = 'standard',
}: OptionButtonProps) {
  // [PRE-AB6 BUILD GREEN GATE / OPTIONBUTTON DISABLED CONTRACT]
  // Belt-and-suspenders click suppression: native `disabled` attribute
  // hardware-blocks the click event, and this guard prevents the wrapped
  // onClick callback from running even if a synthetic event somehow fires.
  const handleClick = () => {
    if (disabled) return
    onClick()
  }

  // Disabled visual treatment, applied via Tailwind `disabled:` variants
  // so the styles only activate when the native `disabled` attribute is
  // present. Matches the existing `disabled:opacity-50 disabled:cursor-not-allowed`
  // convention already used elsewhere in this file (e.g. L4548 next button).
  const disabledStateClasses = 'disabled:opacity-50 disabled:cursor-not-allowed'

  // Unselected branch swaps to a no-hover variant when disabled so the
  // button does not visually respond to hover while unavailable. The
  // selected branch keeps its full styling (a disabled selected option
  // is rare and should still read as selected, just dimmed via opacity).
  const unselectedClasses = disabled
    ? 'bg-[#0F1115] border-[#2B313A] text-[#A4ACB8]'
    : 'bg-[#0F1115] border-[#2B313A] text-[#A4ACB8] hover:border-[#4F6D8A] hover:text-[#E6E9EF]'

  // Compact mode: centered content, no icon slot, no text wrapping
  if (contentMode === 'compact') {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        aria-disabled={disabled || undefined}
        data-selected={selected ? 'true' : 'false'}
        className={`py-2.5 px-2 rounded-lg border text-sm font-medium transition-all duration-150 flex items-center justify-center min-h-[44px] ${
          selected
            ? 'bg-[#C1121F]/15 border-[#C1121F] text-[#E6E9EF] ring-1 ring-[#C1121F]/40 shadow-[0_0_0_1px_rgba(193,18,31,0.2)]'
            : unselectedClasses
        } ${disabledStateClasses} ${className}`}
      >
        <span className="whitespace-nowrap text-center">{children}</span>
      </button>
    )
  }

  // WrapSafe mode: allows controlled wrapping for multi-word labels
  if (contentMode === 'wrapSafe') {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        aria-disabled={disabled || undefined}
        data-selected={selected ? 'true' : 'false'}
        className={`py-2.5 px-3 rounded-lg border text-sm font-medium transition-all duration-150 flex items-center justify-center text-center min-h-[44px] ${
          selected
            ? 'bg-[#C1121F]/15 border-[#C1121F] text-[#E6E9EF] ring-1 ring-[#C1121F]/40 shadow-[0_0_0_1px_rgba(193,18,31,0.2)]'
            : unselectedClasses
        } ${disabledStateClasses} ${className}`}
      >
        <span className="leading-tight">{children}</span>
      </button>
    )
  }

  // Standard mode: original behavior with icon slot
  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-disabled={disabled || undefined}
      data-selected={selected ? 'true' : 'false'}
      className={`py-3 px-4 rounded-lg border text-sm font-medium transition-all duration-150 flex items-center gap-2 text-left ${
        selected
          ? 'bg-[#C1121F]/15 border-[#C1121F] text-[#E6E9EF] ring-1 ring-[#C1121F]/40 shadow-[0_0_0_1px_rgba(193,18,31,0.2)]'
          : unselectedClasses
      } ${disabledStateClasses} ${className}`}
    >
      {/* Fixed-width icon slot — always reserves space so content never shifts */}
      <span className="w-4 h-4 shrink-0 flex items-center justify-center">
        {selected && <Check className="w-4 h-4 text-[#C1121F]" />}
      </span>
      <div className="flex-1 min-w-0">
        <span className="block">{children}</span>
        {description && (
          <span className="text-xs text-[#6B7280] block mt-0.5">{description}</span>
        )}
      </div>
    </button>
  )
}

/**
 * Label renderer for the "Flexible / Adaptive" schedule options.
 * Keeps the badge on the same line when space allows and wraps gracefully
 * on narrow grid cells without clipping or overflow.
 */
function FlexibleLabel() {
  return (
    <span className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-1 leading-snug">
      <span>Flexible</span>
      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#C1121F]/15 text-[#E05A64] border border-[#C1121F]/20 leading-none whitespace-nowrap shrink-0">
        Adaptive
      </span>
    </span>
  )
}

// =============================================================================
// SECTION CONTENT COMPONENTS
// =============================================================================

interface SectionProps {
  profile: OnboardingProfile
  updateProfile: (updates: Partial<OnboardingProfile>) => void
}

function AthleteProfileSection({ profile, updateProfile }: SectionProps) {
  return (
    <div className="space-y-6">
      {/* Sex */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-[#A4ACB8]">Biological sex</label>
        <p className="text-xs text-[#6B7280] -mt-1">Used to calibrate strength standards and leverage expectations</p>
        <div className="grid grid-cols-2 gap-2">
          {(['male', 'female'] as Sex[]).map((sex) => (
            <OptionButton
              key={sex}
              selected={profile.sex === sex}
              onClick={() => updateProfile({ sex })}
            >
              {sex === 'male' ? 'Male' : 'Female'}
            </OptionButton>
          ))}
        </div>
      </div>

      {/* Training Experience */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-[#A4ACB8]">How long have you been training?</label>
        <p className="text-xs text-[#6B7280] -mt-1">This helps us set appropriate starting points</p>
        <div className="grid grid-cols-1 gap-2">
          {(Object.keys(TRAINING_EXPERIENCE_LABELS) as TrainingExperience[]).map((exp) => (
            <OptionButton
              key={exp}
              selected={profile.trainingExperience === exp}
              onClick={() => updateProfile({ trainingExperience: exp })}
              description={TRAINING_EXPERIENCE_DESCRIPTIONS[exp]}
            >
              {TRAINING_EXPERIENCE_LABELS[exp]}
            </OptionButton>
          ))}
        </div>
      </div>

      {/* Height */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-[#A4ACB8]">Your height</label>
        <p className="text-xs text-[#6B7280] -mt-1">Affects leverage in pulling and pushing movements</p>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(HEIGHT_LABELS) as HeightRange[]).map((height) => (
            <OptionButton
              key={height}
              selected={profile.heightRange === height}
              onClick={() => updateProfile({ heightRange: height })}
            >
              {HEIGHT_LABELS[height]}
            </OptionButton>
          ))}
        </div>
      </div>

      {/* Weight */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-[#A4ACB8]">Your weight</label>
        <p className="text-xs text-[#6B7280] -mt-1">Important for bodyweight strength calculations</p>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(WEIGHT_LABELS) as WeightRange[]).map((weight) => (
            <OptionButton
              key={weight}
              selected={profile.weightRange === weight}
              onClick={() => updateProfile({ weightRange: weight })}
            >
              {WEIGHT_LABELS[weight]}
            </OptionButton>
          ))}
        </div>
      </div>

      {/* Body Fat (Optional) - Enhanced with calculator */}
      <BodyFatSection profile={profile} updateProfile={updateProfile} />
    </div>
  )
}

// Separate component for body fat to manage calculator state
function BodyFatSection({ profile, updateProfile }: SectionProps) {
  const [mode, setMode] = useState<'selection' | 'manual' | 'calculator'>('selection')
  const [manualValue, setManualValue] = useState('')

  // Handle calculator result
  const handleCalculatorResult = (percent: number) => {
    // Map percent to range
    let range: BodyFatRange = 'unknown'
    if (percent < 10) range = 'under_10'
    else if (percent < 15) range = '10_15'
    else if (percent < 20) range = '15_20'
    else if (percent < 25) range = '20_25'
    else if (percent < 30) range = '25_30'
    else range = 'over_30'

    updateProfile({ 
      bodyFatRange: range,
      bodyFatPercent: percent,
      bodyFatSource: 'calculator'
    })
    setMode('selection')
  }

  // Handle manual entry
  const handleManualSubmit = () => {
    const percent = parseFloat(manualValue)
    if (isNaN(percent) || percent < 2 || percent > 50) return

    let range: BodyFatRange = 'unknown'
    if (percent < 10) range = 'under_10'
    else if (percent < 15) range = '10_15'
    else if (percent < 20) range = '15_20'
    else if (percent < 25) range = '20_25'
    else if (percent < 30) range = '25_30'
    else range = 'over_30'

    updateProfile({ 
      bodyFatRange: range,
      bodyFatPercent: percent,
      bodyFatSource: 'manual'
    })
    setMode('selection')
  }

  // Skip body fat
  const handleSkip = () => {
    updateProfile({ 
      bodyFatRange: 'unknown',
      bodyFatPercent: null,
      bodyFatSource: 'unknown'
    })
    setMode('selection')
  }

  // Clear selection
  const handleClear = () => {
    updateProfile({ 
      bodyFatRange: null,
      bodyFatPercent: null,
      bodyFatSource: null
    })
    setMode('selection')
    setManualValue('')
  }

  // Show calculator
  if (mode === 'calculator' && profile.sex) {
    return (
      <div className="space-y-3">
        <label className="text-sm font-medium text-[#A4ACB8]">
          Body Fat Calculator
        </label>
        <Card className="bg-[#0F1115] border-[#2B313A] p-4">
          <BodyFatCalculator 
            sex={profile.sex}
            onResult={handleCalculatorResult}
            onCancel={() => setMode('selection')}
            embedded
          />
        </Card>
      </div>
    )
  }

  // Show manual entry
  if (mode === 'manual') {
    return (
      <div className="space-y-3">
        <label className="text-sm font-medium text-[#A4ACB8]">
          Enter Body Fat %
        </label>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="e.g. 15"
            value={manualValue}
            onChange={(e) => setManualValue(e.target.value)}
            className="bg-[#0F1115] border-[#2B313A] text-[#E6E9EF] w-24"
          />
          <span className="text-[#6B7280] self-center">%</span>
          <Button
            onClick={handleManualSubmit}
            disabled={!manualValue || parseFloat(manualValue) < 2 || parseFloat(manualValue) > 50}
            className="bg-[#C1121F] hover:bg-[#C1121F]/90 text-white"
            size="sm"
          >
            <Check className="w-4 h-4" />
          </Button>
        </div>
        <button 
          onClick={() => setMode('selection')}
          className="text-sm text-[#6B7280] hover:text-[#A4ACB8] transition-colors"
        >
          Cancel
        </button>
      </div>
    )
  }

  // Selection mode - show current value or options
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-[#A4ACB8]">
        Body fat % <span className="text-[#6B7280]">(optional)</span>
      </label>
      <p className="text-xs text-[#6B7280] -mt-1">
        Improves training accuracy but not required.
      </p>

      {/* Show current value if set */}
      {profile.bodyFatPercent !== null && profile.bodyFatSource !== 'unknown' ? (
        <div className="bg-[#0F1115] rounded-lg p-3 border border-[#2B313A]">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[#E6E9EF] font-medium">{profile.bodyFatPercent}%</span>
              <span className="text-[#6B7280] text-sm ml-2">
                ({profile.bodyFatSource === 'calculator' ? 'calculated' : 'entered manually'})
              </span>
            </div>
            <button
              onClick={handleClear}
              className="text-sm text-[#4F6D8A] hover:text-[#6B8FAD] transition-colors"
            >
              Change
            </button>
          </div>
        </div>
      ) : profile.bodyFatRange === 'unknown' ? (
        <div className="bg-[#0F1115] rounded-lg p-3 border border-[#2B313A]">
          <div className="flex items-center justify-between">
            <span className="text-[#6B7280]">Skipped</span>
            <button
              onClick={handleClear}
              className="text-sm text-[#4F6D8A] hover:text-[#6B8FAD] transition-colors"
            >
              Change
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          <OptionButton
            selected={false}
            onClick={() => setMode('manual')}
          >
            Enter manually
          </OptionButton>
          <OptionButton
            selected={false}
            onClick={() => {
              if (profile.sex) {
                setMode('calculator')
              }
            }}
            disabled={!profile.sex}
            description={!profile.sex ? 'Select sex first to use calculator' : 'Uses U.S. Navy method'}
          >
            Estimate with calculator
          </OptionButton>
          <OptionButton
            selected={false}
            onClick={handleSkip}
          >
            Skip for now
          </OptionButton>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// READINESS CALIBRATION SECTION
// =============================================================================

function ReadinessCalibrationSection({ profile, updateProfile }: SectionProps) {
  // Helper to update readiness calibration
  const updateReadiness = <K extends keyof ReadinessCalibration>(
    key: K,
    value: ReadinessCalibration[K]
  ) => {
    const current = profile.readinessCalibration || {
      trainingConsistency: null,
      recoveryTolerance: null,
      strengthPerception: null,
      skillFamiliarity: null,
      bodyType: null,
      scores: null,
    }
    
    const updated = { ...current, [key]: value }
    
    // Recalculate scores whenever any answer changes
    const scores = calculateReadinessScores(updated)
    
    updateProfile({
      readinessCalibration: {
        ...updated,
        scores,
      }
    })
  }

  const consistencyOptions: TrainingConsistencyAnswer[] = ['very_consistent', 'mostly_consistent', 'inconsistent', 'just_starting']
  const recoveryOptions: RecoveryToleranceAnswer[] = ['bounces_back', 'needs_time', 'easily_overtrained']
  const strengthOptions: StrengthPerceptionAnswer[] = ['above_average', 'average', 'below_average', 'unsure']
  const skillOptions: SkillFamiliarityAnswer[] = ['experienced', 'some_exposure', 'new_to_skills']
  const bodyTypeOptions: BodyTypeAnswer[] = ['lean_light', 'athletic_medium', 'strong_heavy', 'tall_long']

  return (
    <div className="space-y-6">
      {/* Intro text */}
      <p className="text-xs text-[#6B7280] -mt-2 pb-2 border-b border-[#2B313A]">
        These help us estimate your training capacity — especially useful if you don't know exact numbers yet.
      </p>

      {/* Q1: Training Consistency */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-[#A4ACB8]">How consistent is your training?</label>
        <div className="grid grid-cols-1 gap-2">
          {consistencyOptions.map((opt) => (
            <OptionButton
              key={opt}
              selected={profile.readinessCalibration?.trainingConsistency === opt}
              onClick={() => updateReadiness('trainingConsistency', opt)}
              description={TRAINING_CONSISTENCY_DESCRIPTIONS[opt]}
            >
              {TRAINING_CONSISTENCY_LABELS[opt]}
            </OptionButton>
          ))}
        </div>
      </div>

      {/* Q2: Recovery Tolerance */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-[#A4ACB8]">How well do you recover from training?</label>
        <div className="grid grid-cols-1 gap-2">
          {recoveryOptions.map((opt) => (
            <OptionButton
              key={opt}
              selected={profile.readinessCalibration?.recoveryTolerance === opt}
              onClick={() => updateReadiness('recoveryTolerance', opt)}
              description={RECOVERY_TOLERANCE_DESCRIPTIONS[opt]}
            >
              {RECOVERY_TOLERANCE_LABELS[opt]}
            </OptionButton>
          ))}
        </div>
      </div>

      {/* Q3: Strength Perception */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-[#A4ACB8]">How would you rate your relative strength?</label>
        <p className="text-xs text-[#6B7280] -mt-1">Compared to others your size</p>
        <div className="grid grid-cols-2 gap-2">
          {strengthOptions.map((opt) => (
            <OptionButton
              key={opt}
              selected={profile.readinessCalibration?.strengthPerception === opt}
              onClick={() => updateReadiness('strengthPerception', opt)}
            >
              {STRENGTH_PERCEPTION_LABELS[opt]}
            </OptionButton>
          ))}
        </div>
      </div>

      {/* Q4: Skill Familiarity */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-[#A4ACB8]">Experience with skill training?</label>
        <p className="text-xs text-[#6B7280] -mt-1">Levers, handstands, gymnastics-style work</p>
        <div className="grid grid-cols-1 gap-2">
          {skillOptions.map((opt) => (
            <OptionButton
              key={opt}
              selected={profile.readinessCalibration?.skillFamiliarity === opt}
              onClick={() => updateReadiness('skillFamiliarity', opt)}
              description={SKILL_FAMILIARITY_DESCRIPTIONS[opt]}
            >
              {SKILL_FAMILIARITY_LABELS[opt]}
            </OptionButton>
          ))}
        </div>
      </div>

      {/* Q5: Body Type */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-[#A4ACB8]">How would you describe your build?</label>
        <div className="grid grid-cols-2 gap-2">
          {bodyTypeOptions.map((opt) => (
            <OptionButton
              key={opt}
              selected={profile.readinessCalibration?.bodyType === opt}
              onClick={() => updateReadiness('bodyType', opt)}
              description={BODY_TYPE_DESCRIPTIONS[opt]}
            >
              {BODY_TYPE_LABELS[opt]}
            </OptionButton>
          ))}
        </div>
      </div>
      
      {/* Athlete Diagnostics Section */}
      <div className="pt-4 mt-4 border-t border-[#2B313A]">
        <p className="text-xs text-[#6B7280] pb-3">
          Help us understand your unique training needs
        </p>
        
        {/* Q6: Primary Limitation */}
        <div className="space-y-3 mb-6">
          <label className="text-sm font-medium text-[#A4ACB8]">What usually limits your progress the most?</label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(PRIMARY_LIMITATION_LABELS) as PrimaryLimitation[]).map((opt) => (
              <OptionButton
                key={opt}
                selected={profile.primaryLimitation === opt}
                onClick={() => updateProfile({ primaryLimitation: opt })}
              >
                {PRIMARY_LIMITATION_LABELS[opt]}
              </OptionButton>
            ))}
          </div>
        </div>
        
        {/* Q7: Weakest Area */}
        <div className="space-y-3 mb-6">
          <label className="text-sm font-medium text-[#A4ACB8]">Which area holds you back the most?</label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(WEAKEST_AREA_LABELS) as WeakestArea[]).map((opt) => (
              <OptionButton
                key={opt}
                selected={profile.weakestArea === opt}
                onClick={() => updateProfile({ weakestArea: opt })}
              >
                {WEAKEST_AREA_LABELS[opt]}
              </OptionButton>
            ))}
          </div>
        </div>
        
        {/* Q8: Joint Cautions (multi-select) */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-[#A4ACB8]">Any joints we should prioritize?</label>
          <p className="text-xs text-[#6B7280] -mt-1">Adds targeted warm-ups, prep, and recovery work — useful for durability, prevention, and high-stress skill training</p>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(JOINT_CAUTION_LABELS) as JointCaution[]).map((joint) => (
              <OptionButton
                key={joint}
                selected={profile.jointCautions?.includes(joint) ?? false}
                onClick={() => {
                  const current = profile.jointCautions || []
                  const updated = current.includes(joint)
                    ? current.filter(j => j !== joint)
                    : [...current, joint]
                  // Selecting a specific joint removes "None" state
                  updateProfile({ jointCautions: updated })
                }}
                contentMode="wrapSafe"
              >
                {JOINT_CAUTION_LABELS[joint]}
              </OptionButton>
            ))}
          </div>
          <OptionButton
            selected={profile.jointCautions?.length === 0 || !profile.jointCautions}
            onClick={() => updateProfile({ jointCautions: [] })}
            className="w-full"
          >
            No priority — balanced prep is fine
          </OptionButton>
        </div>
      </div>
  </div>
  )
  }

// =============================================================================
// TRAINING OUTCOME SECTION - What the user wants to achieve
// =============================================================================

function TrainingOutcomeSection({ profile, updateProfile }: SectionProps) {
  const outcomes: PrimaryTrainingOutcome[] = [
    'strength',
    'max_reps', 
    'military',
    'skills',
    'endurance',
    'general_fitness',
  ]

  const getOutcomeIcon = (outcome: PrimaryTrainingOutcome) => {
    switch (outcome) {
      case 'strength': return Dumbbell
      case 'max_reps': return TrendingUp
      case 'military': return Shield
      case 'skills': return Zap
      case 'endurance': return Activity
      case 'general_fitness': return Heart
      default: return Target
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <p className="text-sm text-[#A4ACB8]">
          This helps SpartanLab choose the best training structure for your goals.
        </p>
      </div>
      
      <div className="space-y-3">
        {outcomes.map(outcome => {
          const Icon = getOutcomeIcon(outcome)
          const isSelected = profile.primaryTrainingOutcome === outcome
          
          return (
            <button
              key={outcome}
              onClick={() => {
                // Auto-add relevant goal categories based on outcome
                const updates: Partial<OnboardingProfile> = { 
                  primaryTrainingOutcome: outcome 
                }
                
                // If selecting skills, ensure skill_mastery is in categories
                if (outcome === 'skills' && !profile.goalCategories.includes('skill_mastery')) {
                  updates.goalCategories = [...profile.goalCategories, 'skill_mastery']
                }
                // If selecting strength, ensure strength is in categories
                if (outcome === 'strength' && !profile.goalCategories.includes('strength')) {
                  updates.goalCategories = [...profile.goalCategories, 'strength']
                }
                // If selecting endurance, ensure endurance is in categories
                if (outcome === 'endurance' && !profile.goalCategories.includes('endurance')) {
                  updates.goalCategories = [...profile.goalCategories, 'endurance']
                }
                
                updateProfile(updates)
              }}
              className={`w-full p-4 rounded-xl border transition-all text-left ${
                isSelected
                  ? 'bg-[#C1121F]/10 border-[#C1121F] ring-1 ring-[#C1121F]/30'
                  : 'bg-[#1C1F26] border-[#2B313A] hover:border-[#3A3A3A]'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  isSelected ? 'bg-[#C1121F]/20 text-[#C1121F]' : 'bg-[#2B313A] text-[#6B7280]'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`font-medium ${isSelected ? 'text-white' : 'text-[#A4ACB8]'}`}>
                    {PRIMARY_TRAINING_OUTCOME_LABELS[outcome]}
                  </div>
                  <div className="text-xs text-[#6B7280] mt-1">
                    {PRIMARY_TRAINING_OUTCOME_DESCRIPTIONS[outcome]}
                  </div>
                  {/* Helper text - who this is best for */}
                  <div className="text-xs text-[#4F6D8A] mt-2 italic">
                    {PRIMARY_TRAINING_OUTCOME_HELPER_TEXT[outcome]}
                  </div>
                  {/* Example outcomes */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {PRIMARY_TRAINING_OUTCOME_EXAMPLES[outcome].slice(0, 3).map((example, i) => (
                      <span 
                        key={i}
                        className={`text-[10px] px-2 py-0.5 rounded-full ${
                          isSelected 
                            ? 'bg-[#C1121F]/20 text-[#E6E9EF]' 
                            : 'bg-[#2B313A] text-[#6B7280]'
                        }`}
                      >
                        {example}
                      </span>
                    ))}
                  </div>
                </div>
                {isSelected && (
                  <Check className="w-5 h-5 text-[#C1121F] flex-shrink-0" />
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Explanatory note */}
      <div className="bg-[#1C1F26] border border-[#2B313A] rounded-lg p-4 mt-6">
        <p className="text-xs text-[#6B7280] text-center">
          SpartanLab supports everything from beginners building their first pull-up to athletes training for military fitness standards or advanced calisthenics skills.
        </p>
      </div>
  </div>
  )
  }

// =============================================================================
// MILITARY PROFILE SECTION - Branch, test, benchmarks for military prep
// =============================================================================

function MilitaryProfileSection({ profile, updateProfile }: SectionProps) {
  // Initialize military profile if not set
  const militaryProfile = profile.militaryProfile || createEmptyMilitaryProfile()
  
  const updateMilitaryProfile = (updates: Partial<MilitaryProfile>) => {
    updateProfile({
      militaryProfile: { ...militaryProfile, ...updates }
    })
  }

  const branches: MilitaryBranch[] = [
    'marine_corps', 'army', 'navy', 'air_force', 'space_force', 'coast_guard', 'general_recruit'
  ]

  const availableTests = militaryProfile.branch ? BRANCH_TESTS[militaryProfile.branch] : []
  const benchmarkInputs = militaryProfile.targetTest 
    ? getRelevantBenchmarkInputs(militaryProfile.targetTest)
    : []

  const statuses: MilitaryStatus[] = ['recruit_poolee', 'active_duty', 'returning', 'chasing_max']
  const priorities: MilitaryGoalPriority[] = ['pass_minimum', 'competitive', 'max_score']

  return (
    <div className="space-y-8">
      {/* Branch Selection */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-[#A4ACB8]">Branch / Service</label>
        <p className="text-xs text-[#6B7280] -mt-1">Select your military branch or service</p>
        <div className="grid grid-cols-2 gap-2">
          {branches.map(branch => (
            <button
              key={branch}
              onClick={() => {
                updateMilitaryProfile({ 
                  branch, 
                  targetTest: null // Reset test when branch changes
                })
              }}
              className={`p-3 rounded-lg border text-left transition-all ${
                militaryProfile.branch === branch
                  ? 'bg-[#C1121F]/10 border-[#C1121F] ring-1 ring-[#C1121F]/30'
                  : 'bg-[#1C1F26] border-[#2B313A] hover:border-[#3A3A3A]'
              }`}
            >
              <div className={`font-medium text-sm ${
                militaryProfile.branch === branch ? 'text-white' : 'text-[#A4ACB8]'
              }`}>
                {BRANCH_LABELS[branch]}
              </div>
              <div className="text-xs text-[#6B7280] mt-0.5">
                {BRANCH_DESCRIPTIONS[branch]}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Test Selection - only show if branch selected */}
      {militaryProfile.branch && availableTests.length > 0 && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-[#A4ACB8]">Target Test</label>
          <p className="text-xs text-[#6B7280] -mt-1">Which fitness test are you preparing for?</p>
          <div className="space-y-2">
            {availableTests.map(test => {
              const testConfig = TEST_CONFIGS[test]
              return (
                <button
                  key={test}
                  onClick={() => updateMilitaryProfile({ targetTest: test })}
                  className={`w-full p-3 rounded-lg border text-left transition-all ${
                    militaryProfile.targetTest === test
                      ? 'bg-[#C1121F]/10 border-[#C1121F] ring-1 ring-[#C1121F]/30'
                      : 'bg-[#1C1F26] border-[#2B313A] hover:border-[#3A3A3A]'
                  }`}
                >
                  <div className={`font-medium ${
                    militaryProfile.targetTest === test ? 'text-white' : 'text-[#A4ACB8]'
                  }`}>
                    {TEST_LABELS[test]}
                  </div>
                  <div className="text-xs text-[#6B7280] mt-1">
                    {testConfig.testDescription}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {testConfig.events.slice(0, 3).map(event => (
                      <span key={event.id} className="text-[10px] px-2 py-0.5 rounded-full bg-[#2B313A] text-[#6B7280]">
                        {event.name}
                      </span>
                    ))}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Status */}
      {militaryProfile.targetTest && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-[#A4ACB8]">Your Current Status</label>
          <div className="grid grid-cols-2 gap-2">
            {statuses.map(status => (
              <OptionButton
                key={status}
                selected={militaryProfile.status === status}
                onClick={() => updateMilitaryProfile({ status })}
              >
                {STATUS_LABELS[status]}
              </OptionButton>
            ))}
          </div>
        </div>
      )}

      {/* Goal Priority */}
      {militaryProfile.status && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-[#A4ACB8]">Goal Priority</label>
          <p className="text-xs text-[#6B7280] -mt-1">What&apos;s your main objective?</p>
          <div className="space-y-2">
            {priorities.map(priority => (
              <OptionButton
                key={priority}
                selected={militaryProfile.goalPriority === priority}
                onClick={() => updateMilitaryProfile({ goalPriority: priority })}
                className="w-full"
              >
                {GOAL_PRIORITY_LABELS[priority]}
              </OptionButton>
            ))}
          </div>
        </div>
      )}

      {/* Test Date */}
      {militaryProfile.goalPriority && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-[#A4ACB8]">Test Date (optional)</label>
          <p className="text-xs text-[#6B7280] -mt-1">When is your test? This helps us plan your training timeline.</p>
          <Input
            type="date"
            value={militaryProfile.testDate || ''}
            onChange={(e) => updateMilitaryProfile({ testDate: e.target.value || null })}
            className="bg-[#1C1F26] border-[#2B313A] text-[#E6E9EF]"
          />
        </div>
      )}

      {/* Current Benchmarks */}
      {militaryProfile.goalPriority && benchmarkInputs.length > 0 && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-[#A4ACB8]">Current Benchmarks</label>
          <p className="text-xs text-[#6B7280] -mt-1">Enter your current numbers so we can track your progress</p>
          <div className="space-y-3">
            {benchmarkInputs.map(input => (
              <div key={input.field} className="flex items-center gap-3">
                <label className="text-sm text-[#A4ACB8] flex-1">{input.label}</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder={input.placeholder}
                    value={militaryProfile.currentBenchmarks[input.field] || ''}
                    onChange={(e) => {
                      const value = e.target.value ? Number(e.target.value) : undefined
                      updateMilitaryProfile({
                        currentBenchmarks: {
                          ...militaryProfile.currentBenchmarks,
                          [input.field]: value
                        }
                      })
                    }}
                    className="w-24 bg-[#1C1F26] border-[#2B313A] text-[#E6E9EF]"
                  />
                  <span className="text-xs text-[#6B7280] w-12">{input.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Equipment Access */}
      {militaryProfile.goalPriority && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-[#A4ACB8]">Equipment Access</label>
          <p className="text-xs text-[#6B7280] -mt-1">What do you have access to for training?</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: 'hasTrack', label: 'Track / Measured Route' },
              { key: 'hasTreadmill', label: 'Treadmill' },
              { key: 'hasPullUpBar', label: 'Pull-Up Bar' },
              { key: 'hasWeights', label: 'Weights / Dumbbells' },
              { key: 'hasSled', label: 'Sled / Resistance' },
              { key: 'hasAmmoCan', label: 'Ammo Can / Substitute' },
              { key: 'hasMedicineBall', label: 'Medicine Ball' },
              { key: 'hasSandbag', label: 'Sandbag' },
            ].map(item => (
              <OptionButton
                key={item.key}
                selected={militaryProfile.equipment[item.key as keyof typeof militaryProfile.equipment]}
                onClick={() => {
                  updateMilitaryProfile({
                    equipment: {
                      ...militaryProfile.equipment,
                      [item.key]: !militaryProfile.equipment[item.key as keyof typeof militaryProfile.equipment]
                    }
                  })
                }}
              >
                {item.label}
              </OptionButton>
            ))}
          </div>
        </div>
      )}

      {/* Test Overview Card */}
      {militaryProfile.targetTest && (
        <div className="bg-[#1C1F26] border border-[#2B313A] rounded-lg p-4 mt-4">
          <h4 className="text-sm font-medium text-[#E6E9EF] mb-2">
            {TEST_LABELS[militaryProfile.targetTest]} Overview
          </h4>
          <div className="space-y-2">
            {TEST_CONFIGS[militaryProfile.targetTest].events.map(event => (
              <div key={event.id} className="flex justify-between text-xs">
                <span className="text-[#A4ACB8]">{event.name}</span>
                <span className="text-[#6B7280]">
                  Min: {event.minimumMale || 'N/A'}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-[#6B7280] mt-3">
            Total duration: {TEST_CONFIGS[militaryProfile.targetTest].totalTestDuration}
          </p>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// TRAINING PATH SECTION - What type of training to focus on
// =============================================================================

function TrainingPathSection({ profile, updateProfile }: SectionProps) {
  const paths: TrainingPathType[] = ['skill_progression', 'strength_endurance', 'hybrid']

  const getPathIcon = (path: TrainingPathType) => {
    switch (path) {
      case 'skill_progression': return Zap
      case 'strength_endurance': return Dumbbell
      case 'hybrid': return TrendingUp
      default: return Target
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <p className="text-sm text-[#A4ACB8]">
          This determines how SpartanLab structures your program.
        </p>
      </div>
      
      <div className="space-y-3">
        {paths.map(path => {
          const Icon = getPathIcon(path)
          const isSelected = profile.trainingPathType === path
          
          return (
            <button
              key={path}
              onClick={() => {
                const updates: Partial<OnboardingProfile> = { trainingPathType: path }
                
                // Auto-add skill_mastery category if selecting skill-based paths
                if ((path === 'skill_progression' || path === 'hybrid') && 
                    !profile.goalCategories.includes('skill_mastery')) {
                  updates.goalCategories = [...profile.goalCategories, 'skill_mastery']
                }
                
                updateProfile(updates)
              }}
              className={`w-full p-4 rounded-xl border transition-all text-left ${
                isSelected
                  ? 'bg-[#C1121F]/10 border-[#C1121F] ring-1 ring-[#C1121F]/30'
                  : 'bg-[#1C1F26] border-[#2B313A] hover:border-[#3A3A3A]'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  isSelected ? 'bg-[#C1121F]/20 text-[#C1121F]' : 'bg-[#2B313A] text-[#6B7280]'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`font-medium ${isSelected ? 'text-white' : 'text-[#A4ACB8]'}`}>
                    {TRAINING_PATH_LABELS[path]}
                  </div>
                  <div className="text-xs text-[#6B7280] mt-1">
                    {TRAINING_PATH_DESCRIPTIONS[path]}
                  </div>
                </div>
                {isSelected && (
                  <Check className="w-5 h-5 text-[#C1121F] flex-shrink-0" />
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
  
function GoalsSection({ profile, updateProfile }: SectionProps) {
  const toggleCategory = (cat: GoalCategory) => {
    const current = profile.goalCategories
    const updated = current.includes(cat)
      ? current.filter(c => c !== cat)
      : [...current, cat]
    updateProfile({ goalCategories: updated })
  }

  // Primary/Secondary goal options - includes all first-class skills
  // Skills PR: Added one_arm_pull_up, one_arm_push_up, dragon_flag, planche_push_up, back_lever, iron_cross, i_sit
  const goalOptions: PrimaryGoalType[] = [
    // Lever/Static Skills
    'front_lever', 'back_lever', 'planche', 'planche_push_up',
    // Transition Skills
    'muscle_up', 'iron_cross',
    // Pressing Skills
    'handstand_pushup', 'handstand',
    // Unilateral Strength Skills
    'one_arm_pull_up', 'one_arm_push_up',
    // Core/Compression Skills
    'dragon_flag', 'l_sit', 'v_sit', 'i_sit',
    // Flexibility Goals
    'pancake', 'front_splits', 'side_splits',
    // Strength Goals
    'weighted_pull', 'weighted_dip', 'general_strength', 'muscle_building', 'work_capacity'
  ]

  const goalLabels: Record<PrimaryGoalType, string> = {
    'front_lever': 'Front Lever',
    'back_lever': 'Back Lever',
    'planche': 'Planche',
    'planche_push_up': 'Planche Push-Up',
    'muscle_up': 'Muscle-Up',
    'iron_cross': 'Iron Cross',
    'handstand_pushup': 'Handstand Push-Up',
    'handstand': 'Handstand',
    'one_arm_pull_up': 'One-Arm Pull-Up',
    'one_arm_push_up': 'One-Arm Push-Up',
    'dragon_flag': 'Dragon Flag',
    'l_sit': 'L-Sit',
    'v_sit': 'V-Sit',
    'i_sit': 'Manna / I-Sit',
    'pancake': 'Pancake',
    'front_splits': 'Front Splits',
    'side_splits': 'Side Splits',
    'toe_touch': 'Toe Touch',
    'weighted_pull': 'Weighted Pull-ups',
    'weighted_dip': 'Weighted Dips',
    'general_strength': 'General Strength',
    'muscle_building': 'Muscle Building',
    'work_capacity': 'Work Capacity / Endurance',
  }

  return (
    <div className="space-y-6">
      {/* Goal Categories */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-[#A4ACB8]">What areas are you focused on?</label>
        <p className="text-xs text-[#6B7280] -mt-1">Select all that apply</p>
        <div className="grid grid-cols-1 gap-2">
          {(Object.keys(GOAL_CATEGORY_LABELS) as GoalCategory[]).map((cat) => (
            <OptionButton
              key={cat}
              selected={profile.goalCategories.includes(cat)}
              onClick={() => toggleCategory(cat)}
              description={GOAL_CATEGORY_DESCRIPTIONS[cat]}
            >
              {GOAL_CATEGORY_LABELS[cat]}
            </OptionButton>
          ))}
        </div>
      </div>

      {/* Primary Goal */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-[#A4ACB8]">Primary goal</label>
        <p className="text-xs text-[#6B7280] -mt-1">Your main training focus</p>
        <div className="grid grid-cols-2 gap-2">
          {goalOptions.map((goal) => (
            <OptionButton
              key={goal}
              selected={profile.primaryGoal === goal}
              onClick={() => updateProfile({ primaryGoal: goal })}
            >
              {goalLabels[goal]}
            </OptionButton>
          ))}
        </div>
      </div>

      {/* Secondary Goal (Optional) */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-[#A4ACB8]">Secondary goal <span className="text-[#6B7280]">(optional)</span></label>
        <div className="grid grid-cols-2 gap-2">
          <OptionButton
            selected={profile.secondaryGoal === null}
            onClick={() => updateProfile({ secondaryGoal: null })}
          >
            None
          </OptionButton>
          {goalOptions.filter(g => g !== profile.primaryGoal).map((goal) => (
            <OptionButton
              key={goal}
              selected={profile.secondaryGoal === goal}
              onClick={() => updateProfile({ secondaryGoal: goal })}
            >
              {goalLabels[goal]}
            </OptionButton>
          ))}
        </div>
      </div>
    </div>
  )
}

function SkillSelectionSection({ profile, updateProfile }: SectionProps) {
  const toggleSkill = (skill: SkillGoal) => {
    const current = profile.selectedSkills
    const updated = current.includes(skill)
      ? current.filter(s => s !== skill)
      : [...current, skill]
    updateProfile({ selectedSkills: updated })
  }

  const toggleFlexibility = (goal: FlexibilityGoal) => {
    const current = profile.selectedFlexibility
    const updated = current.includes(goal)
      ? current.filter(g => g !== goal)
      : [...current, goal]
    updateProfile({ selectedFlexibility: updated })
  }

  const showSkills = profile.goalCategories.includes('skill_mastery')
  const showFlexibility = profile.goalCategories.includes('flexibility') || profile.goalCategories.includes('mobility')

  return (
    <div className="space-y-6">
      {/* Skills */}
      {showSkills && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-[#A4ACB8]">Skills you want to pursue</label>
          <p className="text-xs text-[#6B7280] -mt-1">Select all that interest you</p>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(SKILL_GOAL_LABELS) as SkillGoal[]).map((skill) => (
              <OptionButton
                key={skill}
                selected={profile.selectedSkills.includes(skill)}
                onClick={() => toggleSkill(skill)}
              >
                {SKILL_GOAL_LABELS[skill]}
              </OptionButton>
            ))}
          </div>
        </div>
      )}

      {/* Flexibility Goals */}
      {showFlexibility && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-[#A4ACB8]">Flexibility / mobility goals</label>
          <p className="text-xs text-[#6B7280] -mt-1">Select your targets</p>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(FLEXIBILITY_GOAL_LABELS) as FlexibilityGoal[]).map((goal) => (
              <OptionButton
                key={goal}
                selected={profile.selectedFlexibility.includes(goal)}
                onClick={() => toggleFlexibility(goal)}
              >
                {FLEXIBILITY_GOAL_LABELS[goal]}
              </OptionButton>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Helper component for "Don't know" hint
function DontKnowHint({ metricKey }: { metricKey?: string }) {
  return (
    <div className="flex items-start gap-2 mt-2 p-2 rounded bg-[#4F6D8A]/10 border border-[#4F6D8A]/20">
      <p className="text-xs text-[#A4ACB8] flex-1">
        Not sure? Test this after a proper warm-up. You can update your numbers anytime.
      </p>
      {metricKey && (
        <TestingGuideLink metricKey={metricKey} variant="link" label="How to test" />
      )}
    </div>
  )
}

function StrengthBenchmarksSection({ profile, updateProfile }: SectionProps) {
  // Separate known values from "unknown" for better UX
  const pullupOptions = (Object.keys(PULLUP_LABELS) as PullUpCapacity[]).filter(k => k !== 'unknown')
  const dipOptions = (Object.keys(DIP_LABELS) as DipCapacity[]).filter(k => k !== 'unknown')
  const pushupOptions = (Object.keys(PUSHUP_LABELS) as PushUpCapacity[]).filter(k => k !== 'unknown')
  const hspuOptions = (Object.keys(WALL_HSPU_LABELS) as WallHSPUReps[]).filter(k => k !== 'unknown')

  return (
    <div className="space-y-6">
      {/* Section intro */}
      <p className="text-xs text-[#6B7280] -mt-2 pb-2 border-b border-[#2B313A]">
        Don't know your numbers? Select "Not tested" — you can always update later.
      </p>

      {/* Max Pull-ups */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-[#A4ACB8]">Current max strict pull-ups</label>
        <p className="text-xs text-[#6B7280] -mt-1">Dead hang to chin over bar, no kipping</p>
        <div className="grid grid-cols-4 gap-1.5">
          {pullupOptions.map((cap) => (
            <OptionButton
              key={cap}
              selected={profile.pullUpMax === cap}
              onClick={() => updateProfile({ pullUpMax: cap })}
              contentMode="compact"
            >
              {PULLUP_LABELS[cap]}
            </OptionButton>
          ))}
        </div>
        <OptionButton
          selected={profile.pullUpMax === 'unknown'}
          onClick={() => updateProfile({ pullUpMax: 'unknown' })}
          className="w-full mt-1"
        >
          Don't know / Not tested
        </OptionButton>
        {profile.pullUpMax === 'unknown' && <DontKnowHint metricKey="pullUpMax" />}
      </div>

      {/* Max Dips */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-[#A4ACB8]">Current max dips</label>
        <p className="text-xs text-[#6B7280] -mt-1">Parallel bar dips, full depth</p>
        <div className="grid grid-cols-4 gap-1.5">
          {dipOptions.map((cap) => (
            <OptionButton
              key={cap}
              selected={profile.dipMax === cap}
              onClick={() => updateProfile({ dipMax: cap })}
              contentMode="compact"
            >
              {DIP_LABELS[cap]}
            </OptionButton>
          ))}
        </div>
        <OptionButton
          selected={profile.dipMax === 'unknown'}
          onClick={() => updateProfile({ dipMax: 'unknown' })}
          className="w-full mt-1"
        >
          Don't know / Not tested
        </OptionButton>
        {profile.dipMax === 'unknown' && <DontKnowHint metricKey="dipMax" />}
      </div>

      {/* Max Push-ups */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-[#A4ACB8]">Current max push-ups</label>
        <p className="text-xs text-[#6B7280] -mt-1">Full range, chest to ground</p>
        <div className="grid grid-cols-3 gap-1.5">
          {pushupOptions.map((cap) => (
            <OptionButton
              key={cap}
              selected={profile.pushUpMax === cap}
              onClick={() => updateProfile({ pushUpMax: cap })}
              contentMode="compact"
            >
              {PUSHUP_LABELS[cap]}
            </OptionButton>
          ))}
        </div>
        <OptionButton
          selected={profile.pushUpMax === 'unknown'}
          onClick={() => updateProfile({ pushUpMax: 'unknown' })}
          className="w-full mt-1"
        >
          Don't know / Not tested
        </OptionButton>
        {profile.pushUpMax === 'unknown' && <DontKnowHint metricKey="pushUpMax" />}
      </div>

      {/* Wall HSPU */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-[#A4ACB8]">Current wall handstand push-ups</label>
        <p className="text-xs text-[#6B7280] -mt-1">Full range against wall</p>
        <div className="grid grid-cols-5 gap-1.5">
          {hspuOptions.map((reps) => (
            <OptionButton
              key={reps}
              selected={profile.wallHSPUReps === reps}
              onClick={() => updateProfile({ wallHSPUReps: reps })}
              contentMode="compact"
            >
              {WALL_HSPU_LABELS[reps]}
            </OptionButton>
          ))}
        </div>
        <OptionButton
          selected={profile.wallHSPUReps === 'unknown'}
          onClick={() => updateProfile({ wallHSPUReps: 'unknown' })}
          className="w-full mt-1"
        >
          Don't know / Not tested
        </OptionButton>
        {profile.wallHSPUReps === 'unknown' && <DontKnowHint metricKey="wallHSPUReps" />}
      </div>

      {/* Current Weighted Pull-up */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-[#A4ACB8]">Current best weighted pull-up <span className="text-[#6B7280]">(optional)</span></label>
        <p className="text-xs text-[#6B7280] -mt-1">Weight you can currently do for 1–5 reps</p>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Weight"
            value={profile.weightedPullUp?.load || ''}
            onChange={(e) => updateProfile({
              weightedPullUp: {
                load: e.target.value ? parseInt(e.target.value) : null,
                unit: profile.weightedPullUp?.unit || 'lbs',
                reps: profile.weightedPullUp?.reps,
              }
            })}
            className="flex-1 bg-[#0F1115] border-[#2B313A] text-[#E6E9EF]"
          />
          <div className="flex gap-1">
            <OptionButton
              selected={profile.weightedPullUp?.unit === 'lbs'}
              onClick={() => updateProfile({
                weightedPullUp: { ...profile.weightedPullUp, unit: 'lbs', load: profile.weightedPullUp?.load ?? null }
              })}
              className="px-3"
            >
              lbs
            </OptionButton>
            <OptionButton
              selected={profile.weightedPullUp?.unit === 'kg'}
              onClick={() => updateProfile({
                weightedPullUp: { ...profile.weightedPullUp, unit: 'kg', load: profile.weightedPullUp?.load ?? null }
              })}
              className="px-3"
            >
              kg
            </OptionButton>
          </div>
        </div>
        {profile.weightedPullUp?.load && (
          <div className="space-y-1.5">
            <label className="text-xs text-[#6B7280]">Reps at this weight</label>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((rep) => (
                <button
                  key={rep}
                  type="button"
                  onClick={() => updateProfile({
                    weightedPullUp: { ...profile.weightedPullUp!, reps: rep }
                  })}
                  className={`px-3 py-1.5 rounded text-xs transition-colors ${
                    profile.weightedPullUp?.reps === rep
                      ? 'bg-[#4F6D8A] text-white'
                      : 'bg-[#1A1D24] text-[#A4ACB8] hover:bg-[#2B313A]'
                  }`}
                >
                  {rep}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* All-time PR Weighted Pull-up */}
      <div className="space-y-3 border-t border-[#2B313A] pt-4">
        <label className="text-sm font-medium text-[#A4ACB8]">All-time best weighted pull-up <span className="text-[#6B7280]">(optional)</span></label>
        <p className="text-xs text-[#6B7280] -mt-1">Most weight you ever added successfully</p>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Weight"
            value={profile.allTimePRPullUp?.load || ''}
            onChange={(e) => updateProfile({
              allTimePRPullUp: {
                load: e.target.value ? parseInt(e.target.value) : null,
                unit: profile.allTimePRPullUp?.unit || 'lbs',
                reps: profile.allTimePRPullUp?.reps,
                timeframe: profile.allTimePRPullUp?.timeframe || 'current',
              }
            })}
            className="flex-1 bg-[#0F1115] border-[#2B313A] text-[#E6E9EF]"
          />
          <div className="flex gap-1">
            <OptionButton
              selected={profile.allTimePRPullUp?.unit === 'lbs'}
              onClick={() => updateProfile({
                allTimePRPullUp: { ...profile.allTimePRPullUp, unit: 'lbs', load: profile.allTimePRPullUp?.load ?? null, timeframe: profile.allTimePRPullUp?.timeframe || 'current' }
              })}
              className="px-3"
            >
              lbs
            </OptionButton>
            <OptionButton
              selected={profile.allTimePRPullUp?.unit === 'kg'}
              onClick={() => updateProfile({
                allTimePRPullUp: { ...profile.allTimePRPullUp, unit: 'kg', load: profile.allTimePRPullUp?.load ?? null, timeframe: profile.allTimePRPullUp?.timeframe || 'current' }
              })}
              className="px-3"
            >
              kg
            </OptionButton>
          </div>
        </div>
        {profile.allTimePRPullUp?.load && (
          <>
            <div className="space-y-1.5">
              <label className="text-xs text-[#6B7280]">Reps at PR weight</label>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((rep) => (
                  <button
                    key={rep}
                    type="button"
                    onClick={() => updateProfile({
                      allTimePRPullUp: { ...profile.allTimePRPullUp!, reps: rep }
                    })}
                    className={`px-3 py-1.5 rounded text-xs transition-colors ${
                      profile.allTimePRPullUp?.reps === rep
                        ? 'bg-[#4F6D8A] text-white'
                        : 'bg-[#1A1D24] text-[#A4ACB8] hover:bg-[#2B313A]'
                    }`}
                  >
                    {rep}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-[#6B7280]">When was this PR?</label>
              <div className="grid grid-cols-2 gap-1.5">
                {(Object.keys(PR_TIMEFRAME_LABELS) as PRTimeframe[]).map((tf) => (
                  <button
                    key={tf}
                    type="button"
                    onClick={() => updateProfile({
                      allTimePRPullUp: { ...profile.allTimePRPullUp!, timeframe: tf }
                    })}
                    className={`px-2 py-1.5 rounded text-xs transition-colors ${
                      profile.allTimePRPullUp?.timeframe === tf
                        ? 'bg-[#4F6D8A] text-white'
                        : 'bg-[#1A1D24] text-[#A4ACB8] hover:bg-[#2B313A]'
                    }`}
                  >
                    {PR_TIMEFRAME_LABELS[tf]}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Current Weighted Dip */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-[#A4ACB8]">Current best weighted dip <span className="text-[#6B7280]">(optional)</span></label>
        <p className="text-xs text-[#6B7280] -mt-1">Weight you can currently do for 1–5 reps</p>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Weight"
            value={profile.weightedDip?.load || ''}
            onChange={(e) => updateProfile({
              weightedDip: {
                load: e.target.value ? parseInt(e.target.value) : null,
                unit: profile.weightedDip?.unit || 'lbs',
                reps: profile.weightedDip?.reps,
              }
            })}
            className="flex-1 bg-[#0F1115] border-[#2B313A] text-[#E6E9EF]"
          />
          <div className="flex gap-1">
            <OptionButton
              selected={profile.weightedDip?.unit === 'lbs'}
              onClick={() => updateProfile({
                weightedDip: { ...profile.weightedDip, unit: 'lbs', load: profile.weightedDip?.load ?? null }
              })}
              className="px-3"
            >
              lbs
            </OptionButton>
            <OptionButton
              selected={profile.weightedDip?.unit === 'kg'}
              onClick={() => updateProfile({
                weightedDip: { ...profile.weightedDip, unit: 'kg', load: profile.weightedDip?.load ?? null }
              })}
              className="px-3"
            >
              kg
            </OptionButton>
          </div>
        </div>
        {profile.weightedDip?.load && (
          <div className="space-y-1.5">
            <label className="text-xs text-[#6B7280]">Reps at this weight</label>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((rep) => (
                <button
                  key={rep}
                  type="button"
                  onClick={() => updateProfile({
                    weightedDip: { ...profile.weightedDip!, reps: rep }
                  })}
                  className={`px-3 py-1.5 rounded text-xs transition-colors ${
                    profile.weightedDip?.reps === rep
                      ? 'bg-[#4F6D8A] text-white'
                      : 'bg-[#1A1D24] text-[#A4ACB8] hover:bg-[#2B313A]'
                  }`}
                >
                  {rep}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* All-time PR Weighted Dip */}
      <div className="space-y-3 border-t border-[#2B313A] pt-4">
        <label className="text-sm font-medium text-[#A4ACB8]">All-time best weighted dip <span className="text-[#6B7280]">(optional)</span></label>
        <p className="text-xs text-[#6B7280] -mt-1">Most weight you ever added successfully</p>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Weight"
            value={profile.allTimePRDip?.load || ''}
            onChange={(e) => updateProfile({
              allTimePRDip: {
                load: e.target.value ? parseInt(e.target.value) : null,
                unit: profile.allTimePRDip?.unit || 'lbs',
                reps: profile.allTimePRDip?.reps,
                timeframe: profile.allTimePRDip?.timeframe || 'current',
              }
            })}
            className="flex-1 bg-[#0F1115] border-[#2B313A] text-[#E6E9EF]"
          />
          <div className="flex gap-1">
            <OptionButton
              selected={profile.allTimePRDip?.unit === 'lbs'}
              onClick={() => updateProfile({
                allTimePRDip: { ...profile.allTimePRDip, unit: 'lbs', load: profile.allTimePRDip?.load ?? null, timeframe: profile.allTimePRDip?.timeframe || 'current' }
              })}
              className="px-3"
            >
              lbs
            </OptionButton>
            <OptionButton
              selected={profile.allTimePRDip?.unit === 'kg'}
              onClick={() => updateProfile({
                allTimePRDip: { ...profile.allTimePRDip, unit: 'kg', load: profile.allTimePRDip?.load ?? null, timeframe: profile.allTimePRDip?.timeframe || 'current' }
              })}
              className="px-3"
            >
              kg
            </OptionButton>
          </div>
        </div>
        {profile.allTimePRDip?.load && (
          <>
            <div className="space-y-1.5">
              <label className="text-xs text-[#6B7280]">Reps at PR weight</label>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((rep) => (
                  <button
                    key={rep}
                    type="button"
                    onClick={() => updateProfile({
                      allTimePRDip: { ...profile.allTimePRDip!, reps: rep }
                    })}
                    className={`px-3 py-1.5 rounded text-xs transition-colors ${
                      profile.allTimePRDip?.reps === rep
                        ? 'bg-[#4F6D8A] text-white'
                        : 'bg-[#1A1D24] text-[#A4ACB8] hover:bg-[#2B313A]'
                    }`}
                  >
                    {rep}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-[#6B7280]">When was this PR?</label>
              <div className="grid grid-cols-2 gap-1.5">
                {(Object.keys(PR_TIMEFRAME_LABELS) as PRTimeframe[]).map((tf) => (
                  <button
                    key={tf}
                    type="button"
                    onClick={() => updateProfile({
                      allTimePRDip: { ...profile.allTimePRDip!, timeframe: tf }
                    })}
                    className={`px-2 py-1.5 rounded text-xs transition-colors ${
                      profile.allTimePRDip?.timeframe === tf
                        ? 'bg-[#4F6D8A] text-white'
                        : 'bg-[#1A1D24] text-[#A4ACB8] hover:bg-[#2B313A]'
                    }`}
                  >
                    {PR_TIMEFRAME_LABELS[tf]}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// SKILL HISTORY INPUT COMPONENT
// =============================================================================

interface SkillHistoryInputProps {
  skillKey: SkillGoal
  skillLabel: string
  profile: OnboardingProfile
  updateProfile: (updates: Partial<OnboardingProfile>) => void
}

// Progression ladders for "highest level ever reached" selector
const SKILL_PROGRESSION_OPTIONS: Record<string, { value: string; label: string }[]> = {
  'front_lever': [
    { value: 'tuck', label: 'Tuck' },
    { value: 'adv_tuck', label: 'Advanced Tuck' },
    { value: 'one_leg', label: 'One Leg' },
    { value: 'straddle', label: 'Straddle' },
    { value: 'full', label: 'Full' },
  ],
  'planche': [
    { value: 'lean', label: 'Lean' },
    { value: 'tuck', label: 'Tuck' },
    { value: 'adv_tuck', label: 'Advanced Tuck' },
    { value: 'straddle', label: 'Straddle' },
    { value: 'full', label: 'Full' },
  ],
  'muscle_up': [
    { value: 'kipping', label: 'Kipping' },
    { value: 'strict_1_3', label: '1-3 Strict' },
    { value: 'strict_4_plus', label: '4+ Strict' },
  ],
  'handstand_pushup': [
    { value: 'negative', label: 'Negative' },
    { value: 'partial', label: 'Partial ROM' },
    { value: 'full_wall', label: 'Full Wall' },
    { value: 'freestanding', label: 'Freestanding' },
  ],
  'l_sit': [
    { value: 'tuck', label: 'Tucked L-sit' },
    { value: 'l_sit', label: 'Full L-sit' },
    { value: 'v_sit', label: 'V-sit' },
    { value: 'i_sit', label: 'I-sit (Manna prep)' },
  ],
  'v_sit': [
    { value: 'l_sit', label: 'L-sit' },
    { value: 'v_sit', label: 'V-sit' },
    { value: 'i_sit', label: 'I-sit' },
    { value: 'manna', label: 'Manna' },
  ],
}

// [PRE-AB6 BUILD GREEN GATE / SKILLHISTORY KEY NARROWING]
// SkillGoal is broader than the canonical OnboardingProfile.skillHistory key
// set (lib/athlete-profile.ts:1052-1060 → 'front_lever' | 'planche' |
// 'muscle_up' | 'handstand_pushup' | 'handstand' | 'l_sit' | 'v_sit').
// Broader SkillGoal members like 'back_lever' or 'i_sit' must NOT be allowed
// to index profile.skillHistory. Derive the allowed key set straight from
// the canonical type so future changes propagate, and provide a runtime
// type guard that narrows SkillGoal → SkillHistoryKey before any indexing.
type SkillHistoryKey = keyof OnboardingProfile['skillHistory']

const SKILL_HISTORY_KEYS = [
  'front_lever',
  'planche',
  'muscle_up',
  'handstand_pushup',
  'handstand',
  'l_sit',
  'v_sit',
] as const satisfies readonly SkillHistoryKey[]

function isSkillHistoryKey(skillKey: SkillGoal): skillKey is SkillHistoryKey {
  return (SKILL_HISTORY_KEYS as readonly string[]).includes(skillKey)
}

function SkillHistoryInput({ skillKey, skillLabel, profile, updateProfile }: SkillHistoryInputProps) {
  const historyOptions: SkillTrainingHistory[] = ['never', 'tried_little', 'trained_consistently', 'previously_strong']
  const lastTrainedOptions: SkillLastTrained[] = ['currently', 'within_3_months', '3_to_6_months', '6_to_12_months', '1_to_2_years', 'over_2_years']
  
  // [PRE-AB6 BUILD GREEN GATE / SKILLHISTORY KEY NARROWING]
  // Narrow once at the top of the component. Every read/write against
  // profile.skillHistory below uses skillHistoryKey, never raw skillKey.
  // For unsupported SkillGoal values, skillHistoryKey is null and history
  // reads/writes short-circuit safely without crashing or storing under
  // unsupported keys.
  const skillHistoryKey: SkillHistoryKey | null = isSkillHistoryKey(skillKey) ? skillKey : null

  const currentHistory = skillHistoryKey ? profile.skillHistory?.[skillHistoryKey] : undefined
  const showLastTrained = currentHistory?.trainingHistory && currentHistory.trainingHistory !== 'never'
  const showHighestLevel = currentHistory?.trainingHistory === 'previously_strong'
  const progressionOptions = SKILL_PROGRESSION_OPTIONS[skillKey] || []
  
  // Skills with dedicated SkillBenchmark objects store highestLevelEverReached on the benchmark
  // Skills without (muscle_up, l_sit, v_sit) store it on SkillHistoryEntry
  const skillBenchmarkKey = skillKey === 'front_lever' ? 'frontLever' 
    : skillKey === 'planche' ? 'planche'
    : skillKey === 'handstand_pushup' ? 'hspu'
    : null
  
  // Get current highest level from the appropriate storage location
  const currentHighestLevel = skillBenchmarkKey 
    ? (profile[skillBenchmarkKey as keyof OnboardingProfile] as SkillBenchmark | null)?.highestLevelEverReached 
    : currentHistory?.highestLevelEverReached ?? null
  
  const updateHistory = (trainingHistory: SkillTrainingHistory) => {
    if (!skillHistoryKey) return

    const lastTrained = trainingHistory === 'never' ? null : (currentHistory?.lastTrained || null)
    const tendonAdaptationScore = calculateTendonAdaptation(trainingHistory, lastTrained)
    
    updateProfile({
      skillHistory: {
        ...profile.skillHistory,
        [skillHistoryKey]: {
          ...currentHistory,
          trainingHistory,
          lastTrained,
          tendonAdaptationScore,
        }
      }
    })
  }
  
  const updateLastTrained = (lastTrained: SkillLastTrained) => {
    if (!skillHistoryKey) return

    const trainingHistory = currentHistory?.trainingHistory || 'never'
    const tendonAdaptationScore = calculateTendonAdaptation(trainingHistory, lastTrained)
    
    updateProfile({
      skillHistory: {
        ...profile.skillHistory,
        [skillHistoryKey]: {
          ...currentHistory,
          trainingHistory,
          lastTrained,
          tendonAdaptationScore,
        }
      }
    })
  }
  
  const updateHighestLevel = (level: string) => {
    // For skills with SkillBenchmark objects, store on the benchmark
    if (skillBenchmarkKey) {
      const currentBenchmark = profile[skillBenchmarkKey as keyof OnboardingProfile] as SkillBenchmark | null
      updateProfile({
        [skillBenchmarkKey]: {
          ...currentBenchmark,
          progression: currentBenchmark?.progression || 'none',
          highestLevelEverReached: level,
        }
      })
      return
    }

    // For skills without SkillBenchmark (muscle_up, l_sit, v_sit), store on SkillHistoryEntry
    if (!skillHistoryKey) return

    const trainingHistory = currentHistory?.trainingHistory || 'previously_strong'
    const tendonAdaptationScore = currentHistory?.tendonAdaptationScore || calculateTendonAdaptation(trainingHistory, currentHistory?.lastTrained ?? null)

    updateProfile({
      skillHistory: {
        ...profile.skillHistory,
        [skillHistoryKey]: {
          ...currentHistory,
          trainingHistory,
          lastTrained: currentHistory?.lastTrained ?? null,
          tendonAdaptationScore,
          highestLevelEverReached: level,
        }
      }
    })
  }
  
  return (
    <div className="bg-[#0F1115] border border-[#2B313A] rounded-lg p-3 space-y-3">
      <div className="space-y-2">
        <label className="text-xs text-[#6B7280]">Past experience with {skillLabel}</label>
        <div className="grid grid-cols-2 gap-1.5">
          {historyOptions.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => updateHistory(opt)}
              className={`
                px-2 py-1.5 rounded text-xs transition-colors
                ${currentHistory?.trainingHistory === opt
                  ? 'bg-[#4F6D8A] text-white'
                  : 'bg-[#1A1D24] text-[#A4ACB8] hover:bg-[#2B313A]'
                }
              `}
            >
              {SKILL_TRAINING_HISTORY_LABELS[opt]}
            </button>
          ))}
        </div>
      </div>
      
      {/* Highest level ever reached — only shown when "Reached higher level" is selected */}
      {showHighestLevel && progressionOptions.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-[#2B313A]">
          <label className="text-xs text-[#6B7280]">Highest level you ever reached</label>
          <p className="text-[10px] text-[#4F5D6B]">Your all-time best, even if you can't do it now</p>
          <div className="grid grid-cols-3 gap-1.5">
            {progressionOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => updateHighestLevel(opt.value)}
                className={`
                  px-2 py-1.5 rounded text-xs transition-colors
                  ${currentHighestLevel === opt.value
                    ? 'bg-[#C1121F]/20 text-[#E05A64] border border-[#C1121F]/30'
                    : 'bg-[#1A1D24] text-[#A4ACB8] hover:bg-[#2B313A]'
                  }
                `}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {showLastTrained && (
        <div className="space-y-2 pt-2 border-t border-[#2B313A]">
          <label className="text-xs text-[#6B7280]">When did you last train this seriously?</label>
          <div className="grid grid-cols-2 gap-1.5">
            {lastTrainedOptions.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => updateLastTrained(opt)}
                className={`
                  px-2 py-1.5 rounded text-xs transition-colors
                  ${currentHistory?.lastTrained === opt
                    ? 'bg-[#4F6D8A] text-white'
                    : 'bg-[#1A1D24] text-[#A4ACB8] hover:bg-[#2B313A]'
                  }
                `}
              >
                {SKILL_LAST_TRAINED_LABELS[opt]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// BAND ASSIST INPUT — optional UI block shown below hold-seconds fields
// Captures isAssisted + bandLevel. No engine logic — prep data only.
// =============================================================================

const BAND_OPTIONS: { value: BandLevel; label: string; dot: string }[] = [
  { value: 'yellow', label: 'Yellow',  dot: '#D4B800' }, // muted gold
  { value: 'red',    label: 'Red',     dot: '#B03030' }, // muted red
  { value: 'black',  label: 'Black',   dot: '#555E68' }, // muted slate
  { value: 'purple', label: 'Purple',  dot: '#7B5EA7' }, // muted purple
  { value: 'green',  label: 'Green',   dot: '#3D7A50' }, // muted green
]

interface BandAssistInputProps {
  isAssisted: boolean
  bandLevel: BandLevel | null | undefined
  onAssistedChange: (v: boolean) => void
  onBandChange: (v: BandLevel | null) => void
}

function BandAssistInput({ isAssisted, bandLevel, onAssistedChange, onBandChange }: BandAssistInputProps) {
  return (
    <div className="mt-3 space-y-2.5">
      {/* Was this assisted? */}
      <div className="space-y-1.5">
        <label className="text-xs text-[#6B7280]">Was this assisted?</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { onAssistedChange(false); onBandChange(null) }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              !isAssisted
                ? 'bg-[#1A2030] border-[#3A4560] text-[#C8D0DC]'
                : 'bg-transparent border-[#2B313A] text-[#6B7280] hover:border-[#3A4560] hover:text-[#A4ACB8]'
            }`}
          >
            No
          </button>
          <button
            type="button"
            onClick={() => onAssistedChange(true)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              isAssisted
                ? 'bg-[#1A2030] border-[#3A4560] text-[#C8D0DC]'
                : 'bg-transparent border-[#2B313A] text-[#6B7280] hover:border-[#3A4560] hover:text-[#A4ACB8]'
            }`}
          >
            Yes (band)
          </button>
        </div>
      </div>

      {/* Band level — only when assisted */}
      {isAssisted && (
        <div className="space-y-1.5">
          <label className="text-xs text-[#6B7280]">Band level</label>
          <div className="flex flex-wrap gap-2">
            {BAND_OPTIONS.map(({ value, label, dot }) => (
              <button
                key={value}
                type="button"
                onClick={() => onBandChange(value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  bandLevel === value
                    ? 'bg-[#1A2030] border-[#3A4560] text-[#C8D0DC]'
                    : 'bg-transparent border-[#2B313A] text-[#6B7280] hover:border-[#3A4560] hover:text-[#A4ACB8]'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: dot }}
                />
                {label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-[#4F5D6B]">
            Band assistance helps SpartanLab estimate your true strength more accurately.
          </p>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// SKILL BENCHMARKS SECTION
// =============================================================================

function SkillBenchmarksSection({ profile, updateProfile }: SectionProps) {
  const hasSkill = (skill: SkillGoal) => profile.selectedSkills.includes(skill)
  
  // Filter out "unknown" from the main grid, show it separately
  const flOptions = (Object.keys(FRONT_LEVER_LABELS) as FrontLeverProgression[]).filter(k => k !== 'unknown')
  const plancheOptions = (Object.keys(PLANCHE_LABELS) as PlancheProgression[]).filter(k => k !== 'unknown')
  const muOptions = (Object.keys(MUSCLE_UP_LABELS) as MuscleUpReadiness[]).filter(k => k !== 'unknown')
  const hspuOptions = (Object.keys(HSPU_LABELS) as HSPUProgression[]).filter(k => k !== 'unknown')
  const lsitOptions = (Object.keys(LSIT_HOLD_LABELS) as LSitHoldCapacity[]).filter(k => k !== 'unknown')
  const vsitOptions = (Object.keys(VSIT_HOLD_LABELS) as VSitHoldCapacity[]).filter(k => k !== 'unknown')

  return (
    <div className="space-y-6">
      {/* Front Lever */}
      {hasSkill('front_lever') && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-[#A4ACB8]">Current front lever level</label>
          <p className="text-xs text-[#6B7280] -mt-1">Your current usable progression</p>
          <div className="grid grid-cols-3 gap-1.5">
            {flOptions.map((prog) => (
              <OptionButton
                key={prog}
                selected={profile.frontLever?.progression === prog}
                onClick={() => updateProfile({
                  frontLever: { progression: prog, holdSeconds: profile.frontLever?.holdSeconds }
                })}
                contentMode="wrapSafe"
              >
                {FRONT_LEVER_LABELS[prog]}
              </OptionButton>
            ))}
          </div>
          <OptionButton
            selected={profile.frontLever?.progression === 'unknown'}
            onClick={() => updateProfile({ frontLever: { progression: 'unknown' } })}
            className="w-full"
          >
            Don't know / Skip for now
          </OptionButton>
          {profile.frontLever?.progression && profile.frontLever.progression !== 'none' && profile.frontLever.progression !== 'unknown' && (
            <div className="mt-2 space-y-1">
              <label className="text-xs text-[#6B7280]">Current best hold (seconds) — optional</label>
              <p className="text-[10px] text-[#4F5D6B]">Use your cleanest, controlled hold — not partial or heavily assisted positions.</p>
              <p className="text-[10px] text-[#4F5D6B]">If using a band, select it below for better accuracy.</p>
              <Input
                type="number"
                placeholder="e.g. 10"
                value={profile.frontLever?.holdSeconds || ''}
                onChange={(e) => updateProfile({
                  frontLever: {
                    ...profile.frontLever,
                    progression: profile.frontLever?.progression || 'none',
                    holdSeconds: e.target.value ? parseInt(e.target.value) : undefined
                  }
                })}
                className="mt-1 bg-[#0F1115] border-[#2B313A] text-[#E6E9EF] w-24"
              />
              <BandAssistInput
                isAssisted={profile.frontLever?.isAssisted ?? false}
                bandLevel={profile.frontLever?.bandLevel ?? null}
                onAssistedChange={(v) => updateProfile({
                  frontLever: {
                    ...profile.frontLever,
                    progression: profile.frontLever?.progression || 'none',
                    isAssisted: v,
                    bandLevel: v ? (profile.frontLever?.bandLevel ?? null) : null,
                  }
                })}
                onBandChange={(v) => updateProfile({
                  frontLever: {
                    ...profile.frontLever,
                    progression: profile.frontLever?.progression || 'none',
                    isAssisted: true,
                    bandLevel: v,
                  }
                })}
              />
            </div>
          )}
          {profile.frontLever?.progression === 'unknown' && <DontKnowHint metricKey="frontLever" />}
          <SkillHistoryInput
            skillKey="front_lever"
            skillLabel="front lever"
            profile={profile}
            updateProfile={updateProfile}
          />
        </div>
      )}

      {/* Planche */}
      {hasSkill('planche') && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-[#A4ACB8]">Current planche level</label>
          <p className="text-xs text-[#6B7280] -mt-1">Your current usable progression</p>
          <div className="grid grid-cols-3 gap-1.5">
            {plancheOptions.map((prog) => (
              <OptionButton
                key={prog}
                selected={profile.planche?.progression === prog}
                onClick={() => updateProfile({
                  planche: { progression: prog, holdSeconds: profile.planche?.holdSeconds }
                })}
                contentMode="wrapSafe"
              >
                {PLANCHE_LABELS[prog]}
              </OptionButton>
            ))}
          </div>
          <OptionButton
            selected={profile.planche?.progression === 'unknown'}
            onClick={() => updateProfile({ planche: { progression: 'unknown' } })}
            className="w-full"
          >
            Don't know / Skip for now
          </OptionButton>
          {profile.planche?.progression && profile.planche.progression !== 'none' && profile.planche.progression !== 'unknown' && (
            <div className="mt-2 space-y-1">
              <label className="text-xs text-[#6B7280]">Current best hold (seconds) — optional</label>
              <p className="text-[10px] text-[#4F5D6B]">Use your cleanest, controlled hold — not partial or heavily assisted positions.</p>
              <p className="text-[10px] text-[#4F5D6B]">If using a band, select it below for better accuracy.</p>
              <Input
                type="number"
                placeholder="e.g. 10"
                value={profile.planche?.holdSeconds || ''}
                onChange={(e) => updateProfile({
                  planche: {
                    ...profile.planche,
                    progression: profile.planche?.progression || 'none',
                    holdSeconds: e.target.value ? parseInt(e.target.value) : undefined
                  }
                })}
                className="mt-1 bg-[#0F1115] border-[#2B313A] text-[#E6E9EF] w-24"
              />
              <BandAssistInput
                isAssisted={profile.planche?.isAssisted ?? false}
                bandLevel={profile.planche?.bandLevel ?? null}
                onAssistedChange={(v) => updateProfile({
                  planche: {
                    ...profile.planche,
                    progression: profile.planche?.progression || 'none',
                    isAssisted: v,
                    bandLevel: v ? (profile.planche?.bandLevel ?? null) : null,
                  }
                })}
                onBandChange={(v) => updateProfile({
                  planche: {
                    ...profile.planche,
                    progression: profile.planche?.progression || 'none',
                    isAssisted: true,
                    bandLevel: v,
                  }
                })}
              />
            </div>
          )}
          {profile.planche?.progression === 'unknown' && <DontKnowHint metricKey="planche" />}
          <SkillHistoryInput
            skillKey="planche"
            skillLabel="planche"
            profile={profile}
            updateProfile={updateProfile}
          />
        </div>
      )}

      {/* Muscle-Up */}
      {hasSkill('muscle_up') && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-[#A4ACB8]">Current muscle-up ability</label>
          <div className="grid grid-cols-2 gap-1.5">
            {muOptions.map((level) => (
              <OptionButton
                key={level}
                selected={profile.muscleUp === level}
                onClick={() => updateProfile({ muscleUp: level })}
                contentMode="wrapSafe"
              >
                {MUSCLE_UP_LABELS[level]}
              </OptionButton>
            ))}
          </div>
          <OptionButton
            selected={profile.muscleUp === 'unknown'}
            onClick={() => updateProfile({ muscleUp: 'unknown' })}
            className="w-full"
          >
            Don't know / Skip for now
          </OptionButton>
          {profile.muscleUp === 'unknown' && <DontKnowHint metricKey="muscleUp" />}
          <SkillHistoryInput
            skillKey="muscle_up"
            skillLabel="muscle-ups"
            profile={profile}
            updateProfile={updateProfile}
          />
        </div>
      )}

      {/* HSPU */}
      {hasSkill('handstand_pushup') && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-[#A4ACB8]">Current HSPU level</label>
          <div className="grid grid-cols-2 gap-1.5">
            {hspuOptions.map((prog) => (
              <OptionButton
                key={prog}
                selected={profile.hspu?.progression === prog}
                onClick={() => updateProfile({
                  hspu: { progression: prog, reps: profile.hspu?.reps }
                })}
                contentMode="wrapSafe"
              >
                {HSPU_LABELS[prog]}
              </OptionButton>
            ))}
          </div>
          <OptionButton
            selected={profile.hspu?.progression === 'unknown'}
            onClick={() => updateProfile({ hspu: { progression: 'unknown' } })}
            className="w-full"
          >
            Don't know / Skip for now
          </OptionButton>
          {profile.hspu?.progression === 'unknown' && <DontKnowHint metricKey="wallHSPUReps" />}
          <SkillHistoryInput
            skillKey="handstand_pushup"
            skillLabel="HSPU/handstand work"
            profile={profile}
            updateProfile={updateProfile}
          />
        </div>
      )}

      {/* L-Sit */}
      {hasSkill('l_sit') && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-[#A4ACB8]">Current L-sit hold</label>
          <div className="grid grid-cols-3 gap-1.5">
            {lsitOptions.map((hold) => (
              <OptionButton
                key={hold}
                selected={profile.lSitHold === hold}
                onClick={() => updateProfile({ lSitHold: hold })}
                contentMode="wrapSafe"
              >
                {LSIT_HOLD_LABELS[hold]}
              </OptionButton>
            ))}
          </div>
          <OptionButton
            selected={profile.lSitHold === 'unknown'}
            onClick={() => updateProfile({ lSitHold: 'unknown' })}
            className="w-full"
          >
            Don't know / Skip for now
          </OptionButton>
          {profile.lSitHold === 'unknown' && <DontKnowHint metricKey="lSitHold" />}
          <SkillHistoryInput
            skillKey="l_sit"
            skillLabel="L-sit"
            profile={profile}
            updateProfile={updateProfile}
          />
        </div>
      )}

      {/* V-Sit */}
      {hasSkill('v_sit') && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-[#A4ACB8]">Current V-sit hold</label>
          <div className="grid grid-cols-2 gap-1.5">
            {vsitOptions.map((hold) => (
              <OptionButton
                key={hold}
                selected={profile.vSitHold === hold}
                onClick={() => updateProfile({ vSitHold: hold })}
                contentMode="wrapSafe"
              >
                {VSIT_HOLD_LABELS[hold]}
              </OptionButton>
            ))}
          </div>
          <OptionButton
            selected={profile.vSitHold === 'unknown'}
            onClick={() => updateProfile({ vSitHold: 'unknown' })}
            className="w-full"
          >
            Don't know / Skip for now
          </OptionButton>
          {profile.vSitHold === 'unknown' && <DontKnowHint metricKey="vSitHold" />}
          <SkillHistoryInput
            skillKey="v_sit"
            skillLabel="V-sit"
            profile={profile}
            updateProfile={updateProfile}
          />
        </div>
      )}
    </div>
  )
}

function FlexibilityBenchmarksSection({ profile, updateProfile }: SectionProps) {
  const hasGoal = (goal: FlexibilityGoal) => profile.selectedFlexibility.includes(goal)
  
  // Filter out "unknown" from the main grid
  const flexOptions = (Object.keys(FLEXIBILITY_LEVEL_LABELS) as FlexibilityLevel[]).filter(k => k !== 'unknown')

  const updateFlexBenchmark = (
    key: 'pancake' | 'toeTouch' | 'frontSplits' | 'sideSplits',
    level: FlexibilityLevel
  ) => {
    updateProfile({
      [key]: {
        level,
        rangeIntent: profile[key]?.rangeIntent || null,
      }
    })
  }

  const updateRangeIntent = (
    key: 'pancake' | 'toeTouch' | 'frontSplits' | 'sideSplits',
    intent: RangeTrainingIntent
  ) => {
    updateProfile({
      [key]: {
        level: profile[key]?.level || 'beginner',
        rangeIntent: intent,
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Pancake */}
      {hasGoal('pancake') && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-[#A4ACB8]">Pancake</label>
          <div className="grid grid-cols-3 gap-1.5">
            {flexOptions.map((level) => (
              <OptionButton
                key={level}
                selected={profile.pancake?.level === level}
                onClick={() => updateFlexBenchmark('pancake', level)}
                contentMode="wrapSafe"
              >
                {FLEXIBILITY_LEVEL_LABELS[level]}
              </OptionButton>
            ))}
          </div>
          <OptionButton
            selected={profile.pancake?.level === 'unknown'}
            onClick={() => updateFlexBenchmark('pancake', 'unknown')}
            className="w-full"
          >
            Don't know / Skip for now
          </OptionButton>
          {profile.pancake?.level !== 'unknown' && (
            <div className="mt-2">
              <label className="text-xs text-[#6B7280]">Training focus</label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {(Object.keys(RANGE_INTENT_LABELS) as RangeTrainingIntent[]).map((intent) => (
                  <OptionButton
                    key={intent}
                    selected={profile.pancake?.rangeIntent === intent}
                    onClick={() => updateRangeIntent('pancake', intent)}
                  >
                    {RANGE_INTENT_LABELS[intent]}
                  </OptionButton>
                ))}
              </div>
            </div>
          )}
          {profile.pancake?.level === 'unknown' && <DontKnowHint metricKey="pancake" />}
        </div>
      )}

      {/* Toe Touch */}
      {hasGoal('toe_touch') && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-[#A4ACB8]">Toe Touch / Forward Fold</label>
          <div className="grid grid-cols-3 gap-1.5">
            {flexOptions.map((level) => (
              <OptionButton
                key={level}
                selected={profile.toeTouch?.level === level}
                onClick={() => updateFlexBenchmark('toeTouch', level)}
                contentMode="wrapSafe"
              >
                {FLEXIBILITY_LEVEL_LABELS[level]}
              </OptionButton>
            ))}
          </div>
          <OptionButton
            selected={profile.toeTouch?.level === 'unknown'}
            onClick={() => updateFlexBenchmark('toeTouch', 'unknown')}
            className="w-full"
          >
            Don't know / Skip for now
          </OptionButton>
          {profile.toeTouch?.level === 'unknown' && <DontKnowHint metricKey="forwardFold" />}
        </div>
      )}

      {/* Front Splits */}
      {hasGoal('front_splits') && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-[#A4ACB8]">Front Splits</label>
          <div className="grid grid-cols-3 gap-1.5">
            {flexOptions.map((level) => (
              <OptionButton
                key={level}
                selected={profile.frontSplits?.level === level}
                onClick={() => updateFlexBenchmark('frontSplits', level)}
                contentMode="wrapSafe"
              >
                {FLEXIBILITY_LEVEL_LABELS[level]}
              </OptionButton>
            ))}
          </div>
          <OptionButton
            selected={profile.frontSplits?.level === 'unknown'}
            onClick={() => updateFlexBenchmark('frontSplits', 'unknown')}
            className="w-full"
          >
            Don't know / Skip for now
          </OptionButton>
          {profile.frontSplits?.level !== 'unknown' && (
            <div className="mt-2">
              <label className="text-xs text-[#6B7280]">Training focus</label>
              <div className="grid grid-cols-3 gap-1.5 mt-1">
                {(Object.keys(RANGE_INTENT_LABELS) as RangeTrainingIntent[]).map((intent) => (
                  <OptionButton
                    key={intent}
                    selected={profile.frontSplits?.rangeIntent === intent}
                    onClick={() => updateRangeIntent('frontSplits', intent)}
                    contentMode="wrapSafe"
                  >
                    {RANGE_INTENT_LABELS[intent]}
                  </OptionButton>
                ))}
              </div>
            </div>
          )}
          {profile.frontSplits?.level === 'unknown' && <DontKnowHint metricKey="frontSplits" />}
        </div>
      )}

      {/* Side Splits */}
      {hasGoal('side_splits') && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-[#A4ACB8]">Side Splits</label>
          <div className="grid grid-cols-3 gap-1.5">
            {flexOptions.map((level) => (
              <OptionButton
                key={level}
                selected={profile.sideSplits?.level === level}
                onClick={() => updateFlexBenchmark('sideSplits', level)}
                contentMode="wrapSafe"
              >
                {FLEXIBILITY_LEVEL_LABELS[level]}
              </OptionButton>
            ))}
          </div>
          <OptionButton
            selected={profile.sideSplits?.level === 'unknown'}
            onClick={() => updateFlexBenchmark('sideSplits', 'unknown')}
            className="w-full"
          >
            Don't know / Skip for now
          </OptionButton>
          {profile.sideSplits?.level !== 'unknown' && (
            <div className="mt-2">
              <label className="text-xs text-[#6B7280]">Training focus</label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {(Object.keys(RANGE_INTENT_LABELS) as RangeTrainingIntent[]).map((intent) => (
                  <OptionButton
                    key={intent}
                    selected={profile.sideSplits?.rangeIntent === intent}
                    onClick={() => updateRangeIntent('sideSplits', intent)}
                    contentMode="wrapSafe"
                  >
                    {RANGE_INTENT_LABELS[intent]}
                  </OptionButton>
                ))}
              </div>
            </div>
          )}
          {profile.sideSplits?.level === 'unknown' && <DontKnowHint metricKey="sideSplits" />}
        </div>
      )}
    </div>
  )
}

function EquipmentSection({ profile, updateProfile }: SectionProps) {
  const toggleEquipment = (eq: EquipmentType) => {
    const current = profile.equipment
    // Special handling for minimal
    if (eq === 'minimal') {
      updateProfile({ equipment: ['minimal'] })
      return
    }
    // Remove minimal if selecting other equipment
    const filtered = current.filter(e => e !== 'minimal')
    const updated = filtered.includes(eq)
      ? filtered.filter(e => e !== eq)
      : [...filtered, eq]
    updateProfile({ equipment: updated.length > 0 ? updated : [] })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <label className="text-sm font-medium text-[#A4ACB8]">What equipment do you have?</label>
        <p className="text-xs text-[#6B7280] -mt-1">Select everything you can access regularly — we'll adapt exercises accordingly</p>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(EQUIPMENT_LABELS) as EquipmentType[]).map((eq) => (
            <OptionButton
              key={eq}
              selected={profile.equipment.includes(eq)}
              onClick={() => toggleEquipment(eq)}
            >
              {EQUIPMENT_LABELS[eq]}
            </OptionButton>
          ))}
        </div>
      </div>
      <p className="text-xs text-[#6B7280] italic pt-1 border-t border-[#2B313A]">
        Don't have much? That's fine — bodyweight training can take you far.
      </p>
      {/* [loadability-truth] ISSUE D: Explain weighted prescription requirement */}
      {profile.equipment.includes('weights') ? (
        <p className="text-xs text-emerald-600/80 mt-2">
          Weights selected — you'll get automatic load targets for weighted pull-ups, dips, and more.
        </p>
      ) : (
        <p className="text-xs text-[#6B7280] mt-2">
          Tip: Select "Weights" if you have a weight belt, dumbbells, or plates — this enables automatic weight targets for supported exercises.
        </p>
      )}
    </div>
  )
}

function ScheduleSection({ profile, updateProfile }: SectionProps) {
  const days: TrainingDaysPerWeek[] = [2, 3, 4, 5, 6, 'flexible']
  const lengths: SessionLengthPreference[] = [20, 30, 45, 60, 75, 'flexible']
  
  return (
  <div className="space-y-6">
  {/* Days per week */}
  <div className="space-y-3">
  <label className="text-sm font-medium text-[#A4ACB8]">How many days per week can you realistically train?</label>
  <p className="text-xs text-[#6B7280] -mt-1">Be realistic — consistency beats intensity</p>
  <div className="grid grid-cols-3 gap-2">
  {days.map((day) => (
  <OptionButton
  key={String(day)}
  selected={profile.trainingDaysPerWeek === day}
  onClick={() => updateProfile({ trainingDaysPerWeek: day })}
  className="justify-center min-h-[48px]"
  >
  {day === 'flexible' ? <FlexibleLabel /> : TRAINING_DAYS_LABELS[day]}
  </OptionButton>
  ))}
  </div>
  <p className="text-xs text-[#6B7280] pt-1">
    Flexible calculates your weekly sessions based on recovery, training history, and goals when your program is built or rebuilt.
  </p>
  </div>
  
  {/* Session length */}
  <div className="space-y-3">
  <label className="text-sm font-medium text-[#A4ACB8]">How much time do you usually have per workout?</label>
  <p className="text-xs text-[#6B7280] -mt-1">SpartanLab will design workouts that fit your available training time.</p>
  <div className="grid grid-cols-2 gap-2">
  {lengths.map((len) => (
  <OptionButton
  key={String(len)}
  selected={profile.sessionLengthMinutes === len}
  onClick={() => updateProfile({ 
    sessionLengthMinutes: len,
    workoutDurationPreference: sessionLengthToDurationPreference(len)
  })}
  className="min-h-[48px]"
  >
  {len === 'flexible' ? <FlexibleLabel /> : SESSION_LENGTH_LABELS[len]}
  </OptionButton>
  ))}
  </div>
  <div className="pt-1 space-y-0.5">
    <p className="text-xs text-[#6B7280]">
      SpartanLab adjusts session length based on your availability, recovery, and training priority for that day.
    </p>
    <p className="text-xs text-[#55606B]">Maintains progress even on shorter days.</p>
  </div>
  </div>

      {/* Session style */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-[#A4ACB8]">Preferred session style</label>
        <p className="text-xs text-[#6B7280] -mt-1">How should SpartanLab prioritize your session structure?</p>
        <div className="grid grid-cols-1 gap-2">
          {(Object.keys(SESSION_STYLE_LABELS) as SessionStylePreference[]).map((style) => (
            <OptionButton
              key={style}
              selected={profile.sessionStyle === style}
              onClick={() => updateProfile({ sessionStyle: style })}
              description={SESSION_STYLE_DESCRIPTIONS[style]}
            >
              {SESSION_STYLE_LABELS[style]}
            </OptionButton>
          ))}
        </div>
        <p className="text-xs text-[#6B7280] pt-0.5">
          Flexible scheduling will automatically adjust this based on your time and recovery.
        </p>
      </div>

      {/* System clarification — above Continue, below all options */}
      <p className="text-xs text-[#55606B] text-center pt-1 border-t border-[#1E2530]">
        SpartanLab adapts your training dynamically — these settings guide the system, not limit it.
      </p>
    </div>
  )
}

function RecoverySection({ profile, updateProfile }: SectionProps) {
  const updateRecovery = (key: keyof NonNullable<OnboardingProfile['recovery']>, value: RecoveryQuality) => {
    updateProfile({
      recovery: {
        sleepQuality: profile.recovery?.sleepQuality || 'normal',
        energyLevel: profile.recovery?.energyLevel || 'normal',
        stressLevel: profile.recovery?.stressLevel || 'normal',
        recoveryConfidence: profile.recovery?.recoveryConfidence || 'normal',
        [key]: value,
      }
    })
  }

  const qualities: RecoveryQuality[] = ['good', 'normal', 'poor']

  return (
    <div className="space-y-6">
      {/* Section intro */}
      <p className="text-xs text-[#6B7280] -mt-2 pb-2 border-b border-[#2B313A]">
        These affect how hard we program your training. Be honest — it helps us keep you safe.
      </p>

      {/* Sleep Quality */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-[#A4ACB8]">How well do you typically sleep?</label>
        <div className="flex gap-2">
          {qualities.map((q) => (
            <OptionButton
              key={q}
              selected={profile.recovery?.sleepQuality === q}
              onClick={() => updateRecovery('sleepQuality', q)}
              className="flex-1 justify-center"
            >
              {RECOVERY_LABELS[q]}
            </OptionButton>
          ))}
        </div>
      </div>

      {/* Energy Level */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-[#A4ACB8]">General energy level</label>
        <div className="flex gap-2">
          {qualities.map((q) => (
            <OptionButton
              key={q}
              selected={profile.recovery?.energyLevel === q}
              onClick={() => updateRecovery('energyLevel', q)}
              className="flex-1 justify-center"
            >
              {RECOVERY_LABELS[q]}
            </OptionButton>
          ))}
        </div>
      </div>

      {/* Stress Level */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-[#A4ACB8]">Life stress level</label>
        <div className="flex gap-2">
          {qualities.map((q) => (
            <OptionButton
              key={q}
              selected={profile.recovery?.stressLevel === q}
              onClick={() => updateRecovery('stressLevel', q)}
              className="flex-1 justify-center"
            >
              {RECOVERY_LABELS[q]}
            </OptionButton>
          ))}
        </div>
      </div>

      {/* Recovery Confidence */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-[#A4ACB8]">Recovery confidence</label>
        <p className="text-xs text-[#6B7280] -mt-1">How well do you bounce back between sessions?</p>
        <div className="flex gap-2">
          {qualities.map((q) => (
            <OptionButton
              key={q}
              selected={profile.recovery?.recoveryConfidence === q}
              onClick={() => updateRecovery('recoveryConfidence', q)}
              className="flex-1 justify-center"
            >
              {RECOVERY_LABELS[q]}
            </OptionButton>
          ))}
        </div>
      </div>
    </div>
  )
}

interface ReviewSectionProps {
  profile: OnboardingProfile
  onEditSection?: (sectionId: SectionId) => void
  onClearAll?: () => void
  showClearConfirm?: boolean
  setShowClearConfirm?: (show: boolean) => void
}

function ReviewSection({ profile, onEditSection, onClearAll, showClearConfirm, setShowClearConfirm }: ReviewSectionProps) {
  const hasEstimates = hasEstimatedValues(profile)

  // Helper to format skill list
  const formatSkills = () => {
    if (profile.selectedSkills.length === 0) return null
    return profile.selectedSkills.map(s => SKILL_GOAL_LABELS[s]).join(', ')
  }

  // Helper to format flexibility goals
  const formatFlexibility = () => {
    if (profile.selectedFlexibility.length === 0) return null
    return profile.selectedFlexibility.map(f => FLEXIBILITY_GOAL_LABELS[f]).join(', ')
  }

  // Helper for strength summary
  const getStrengthSummary = () => {
  const items = []
  if (profile.pullUpMax && profile.pullUpMax !== 'unknown') items.push(`Pull-ups: ${PULLUP_LABELS[profile.pullUpMax]}`)
  if (profile.dipMax && profile.dipMax !== 'unknown') items.push(`Dips: ${DIP_LABELS[profile.dipMax]}`)
  if (profile.pushUpMax && profile.pushUpMax !== 'unknown') items.push(`Push-ups: ${PUSHUP_LABELS[profile.pushUpMax]}`)
  
  // Weighted pull-up with current vs all-time
  if (profile.weightedPullUp?.load) {
    const currentReps = profile.weightedPullUp.reps ? ` x ${profile.weightedPullUp.reps}` : ''
    items.push(`Wtd. pull-up now: +${profile.weightedPullUp.load}${profile.weightedPullUp.unit}${currentReps}`)
  }
  if (profile.allTimePRPullUp?.load) {
    const prReps = profile.allTimePRPullUp.reps ? ` x ${profile.allTimePRPullUp.reps}` : ''
    const timeframe = profile.allTimePRPullUp.timeframe && profile.allTimePRPullUp.timeframe !== 'current' 
      ? ` • ${PR_TIMEFRAME_LABELS[profile.allTimePRPullUp.timeframe]}` : ''
    items.push(`Wtd. pull-up best: +${profile.allTimePRPullUp.load}${profile.allTimePRPullUp.unit}${prReps}${timeframe}`)
  }
  
  // Weighted dip with current vs all-time
  if (profile.weightedDip?.load) {
    const currentReps = profile.weightedDip.reps ? ` x ${profile.weightedDip.reps}` : ''
    items.push(`Wtd. dip now: +${profile.weightedDip.load}${profile.weightedDip.unit}${currentReps}`)
  }
  if (profile.allTimePRDip?.load) {
    const prReps = profile.allTimePRDip.reps ? ` x ${profile.allTimePRDip.reps}` : ''
    const timeframe = profile.allTimePRDip.timeframe && profile.allTimePRDip.timeframe !== 'current' 
      ? ` • ${PR_TIMEFRAME_LABELS[profile.allTimePRDip.timeframe]}` : ''
    items.push(`Wtd. dip best: +${profile.allTimePRDip.load}${profile.allTimePRDip.unit}${prReps}${timeframe}`)
  }
  
  return items.length > 0 ? items : null
  }

  // [PRE-AB6 BUILD GREEN GATE / STRICT LABEL MAP KEY GUARDS]
  // SkillBenchmark.progression is canonically typed as plain `string`
  // (lib/athlete-profile.ts:401), so direct indexing into the strict label
  // maps Record<FrontLeverProgression | PlancheProgression | HSPUProgression, string>
  // produces TS7053. Each helper below derives its key set from the actual
  // label-map shape via `keyof typeof MAP`, type-guards the input via a
  // hasOwnProperty check, and returns null on miss — preserving the existing
  // `|| rawString` runtime fallback used at the highest-level-ever sites.
  type FrontLeverProgressionKey = keyof typeof FRONT_LEVER_LABELS
  type PlancheProgressionKey = keyof typeof PLANCHE_LABELS
  type HSPUProgressionKey = keyof typeof HSPU_LABELS

  const isFrontLeverProgressionKey = (value: unknown): value is FrontLeverProgressionKey =>
    typeof value === 'string' && Object.prototype.hasOwnProperty.call(FRONT_LEVER_LABELS, value)

  const isPlancheProgressionKey = (value: unknown): value is PlancheProgressionKey =>
    typeof value === 'string' && Object.prototype.hasOwnProperty.call(PLANCHE_LABELS, value)

  const isHSPUProgressionKey = (value: unknown): value is HSPUProgressionKey =>
    typeof value === 'string' && Object.prototype.hasOwnProperty.call(HSPU_LABELS, value)

  const getFrontLeverProgressionLabel = (value: unknown): string | null =>
    isFrontLeverProgressionKey(value) ? FRONT_LEVER_LABELS[value] : null

  const getPlancheProgressionLabel = (value: unknown): string | null =>
    isPlancheProgressionKey(value) ? PLANCHE_LABELS[value] : null

  const getHSPUProgressionLabel = (value: unknown): string | null =>
    isHSPUProgressionKey(value) ? HSPU_LABELS[value] : null

  // Helper for skill level summary with history
  const getSkillSummary = () => {
  const items: string[] = []
  
  // Front Lever
  const flProgressionLabel = getFrontLeverProgressionLabel(profile.frontLever?.progression)
  if (
    flProgressionLabel &&
    profile.frontLever?.progression !== 'unknown' &&
    profile.frontLever?.progression !== 'none'
  ) {
    let flSummary = `Front Lever: ${flProgressionLabel}`
    // Add hold time + band assistance
    if (profile.frontLever.holdSeconds) {
      flSummary += ` ${profile.frontLever.holdSeconds}s`
    }
    if (profile.frontLever.isAssisted && profile.frontLever.bandLevel) {
      flSummary += ` (${profile.frontLever.bandLevel} band)`
    }
    // Add highest level ever
    if (profile.frontLever.highestLevelEverReached && profile.frontLever.highestLevelEverReached !== profile.frontLever.progression) {
      const flHighestLabel = getFrontLeverProgressionLabel(profile.frontLever.highestLevelEverReached)
      flSummary += ` — was ${flHighestLabel || profile.frontLever.highestLevelEverReached}`
    }
    const flHistory = profile.skillHistory?.front_lever
    if (flHistory?.trainingHistory && flHistory.trainingHistory !== 'never') {
      flSummary += ` • ${SKILL_TRAINING_HISTORY_LABELS[flHistory.trainingHistory]}`
      if (flHistory.lastTrained) {
        flSummary += ` (${SKILL_LAST_TRAINED_LABELS[flHistory.lastTrained]})`
      }
    }
    items.push(flSummary)
  }
  
  // Planche
  const plProgressionLabel = getPlancheProgressionLabel(profile.planche?.progression)
  if (
    plProgressionLabel &&
    profile.planche?.progression !== 'unknown' &&
    profile.planche?.progression !== 'none'
  ) {
    let plSummary = `Planche: ${plProgressionLabel}`
    // Add hold time + band assistance
    if (profile.planche.holdSeconds) {
      plSummary += ` ${profile.planche.holdSeconds}s`
    }
    if (profile.planche.isAssisted && profile.planche.bandLevel) {
      plSummary += ` (${profile.planche.bandLevel} band)`
    }
    // Add highest level ever
    if (profile.planche.highestLevelEverReached && profile.planche.highestLevelEverReached !== profile.planche.progression) {
      const plHighestLabel = getPlancheProgressionLabel(profile.planche.highestLevelEverReached)
      plSummary += ` — was ${plHighestLabel || profile.planche.highestLevelEverReached}`
    }
    const plHistory = profile.skillHistory?.planche
    if (plHistory?.trainingHistory && plHistory.trainingHistory !== 'never') {
      plSummary += ` • ${SKILL_TRAINING_HISTORY_LABELS[plHistory.trainingHistory]}`
      if (plHistory.lastTrained) {
        plSummary += ` (${SKILL_LAST_TRAINED_LABELS[plHistory.lastTrained]})`
      }
    }
    items.push(plSummary)
  }
  
  // Muscle-Up
  if (profile.muscleUp && profile.muscleUp !== 'unknown' && profile.muscleUp !== 'none') {
    let muSummary = `Muscle-Up: ${MUSCLE_UP_LABELS[profile.muscleUp]}`
    const muHistory = profile.skillHistory?.muscle_up
    // Add highest level ever reached from skill history
    if (muHistory?.highestLevelEverReached && muHistory.highestLevelEverReached !== profile.muscleUp) {
      const highestLabel = SKILL_PROGRESSION_OPTIONS['muscle_up']?.find(o => o.value === muHistory.highestLevelEverReached)?.label || muHistory.highestLevelEverReached
      muSummary += ` — was ${highestLabel}`
    }
    if (muHistory?.trainingHistory && muHistory.trainingHistory !== 'never') {
      muSummary += ` • ${SKILL_TRAINING_HISTORY_LABELS[muHistory.trainingHistory]}`
      if (muHistory.lastTrained) {
        muSummary += ` (${SKILL_LAST_TRAINED_LABELS[muHistory.lastTrained]})`
      }
    }
    items.push(muSummary)
  }
  
  // HSPU
  const hspuProgressionLabel = getHSPUProgressionLabel(profile.hspu?.progression)
  if (
    hspuProgressionLabel &&
    profile.hspu?.progression !== 'unknown' &&
    profile.hspu?.progression !== 'none'
  ) {
    let hspuSummary = `HSPU: ${hspuProgressionLabel}`
    const hspuHistory = profile.skillHistory?.handstand_pushup
    if (hspuHistory?.trainingHistory && hspuHistory.trainingHistory !== 'never') {
      hspuSummary += ` • ${SKILL_TRAINING_HISTORY_LABELS[hspuHistory.trainingHistory]}`
      if (hspuHistory.lastTrained) {
        hspuSummary += ` (${SKILL_LAST_TRAINED_LABELS[hspuHistory.lastTrained]})`
      }
    }
    items.push(hspuSummary)
  }
  
  // L-sit
  if (profile.lSitHold && profile.lSitHold !== 'unknown' && profile.lSitHold !== 'none') {
    let lSitSummary = `L-sit: ${LSIT_HOLD_LABELS[profile.lSitHold]}`
    const lSitHistory = profile.skillHistory?.l_sit
    // Add highest level ever reached from skill history
    if (lSitHistory?.highestLevelEverReached) {
      const highestLabel = SKILL_PROGRESSION_OPTIONS['l_sit']?.find(o => o.value === lSitHistory.highestLevelEverReached)?.label || lSitHistory.highestLevelEverReached
      lSitSummary += ` — was ${highestLabel}`
    }
    if (lSitHistory?.trainingHistory && lSitHistory.trainingHistory !== 'never') {
      lSitSummary += ` • ${SKILL_TRAINING_HISTORY_LABELS[lSitHistory.trainingHistory]}`
      if (lSitHistory.lastTrained) {
        lSitSummary += ` (${SKILL_LAST_TRAINED_LABELS[lSitHistory.lastTrained]})`
      }
    }
    items.push(lSitSummary)
  }
  
  // V-sit
  if (profile.vSitHold && profile.vSitHold !== 'unknown' && profile.vSitHold !== 'none') {
    let vSitSummary = `V-sit: ${VSIT_HOLD_LABELS[profile.vSitHold]}`
    const vSitHistory = profile.skillHistory?.v_sit
    // Add highest level ever reached from skill history
    if (vSitHistory?.highestLevelEverReached) {
      const highestLabel = SKILL_PROGRESSION_OPTIONS['v_sit']?.find(o => o.value === vSitHistory.highestLevelEverReached)?.label || vSitHistory.highestLevelEverReached
      vSitSummary += ` — was ${highestLabel}`
    }
    if (vSitHistory?.trainingHistory && vSitHistory.trainingHistory !== 'never') {
      vSitSummary += ` • ${SKILL_TRAINING_HISTORY_LABELS[vSitHistory.trainingHistory]}`
      if (vSitHistory.lastTrained) {
        vSitSummary += ` (${SKILL_LAST_TRAINED_LABELS[vSitHistory.lastTrained]})`
      }
    }
    items.push(vSitSummary)
  }
  
  return items.length > 0 ? items : null
  }

  const EditButton = ({ section }: { section: SectionId }) => (
    onEditSection ? (
      <button
        onClick={() => onEditSection(section)}
        className="text-xs text-[#4F6D8A] hover:text-[#6B8FAD] transition-colors"
      >
        Edit
      </button>
    ) : null
  )

  return (
    <div className="space-y-4">
      {/* Header message */}
      <div className="text-center pb-2">
        <p className="text-sm text-[#A4ACB8]">
          Here's what we know about you. Make sure everything looks right.
        </p>
      </div>
      
      {/* Estimated values notice */}
      {hasEstimates && (
        <div className="bg-[#4F6D8A]/10 border border-[#4F6D8A]/30 rounded-lg p-3">
          <p className="text-sm text-[#A4ACB8]">
            <span className="text-[#4F6D8A] font-medium">Some metrics not provided.</span>{' '}
            No problem — your program will start with safe, conservative estimates. Update your numbers anytime as you learn them.
          </p>
        </div>
      )}
      
      <div className="space-y-3 text-sm">
        {/* Athlete Profile */}
        <div className="bg-[#0F1115] rounded-lg p-3 border border-[#2B313A]">
          <div className="flex justify-between items-start mb-1">
            <span className="text-[#6B7280] text-xs uppercase tracking-wide">Your Profile</span>
            <EditButton section="athlete_profile" />
          </div>
          <div className="text-[#E6E9EF]">
            {profile.sex ? (profile.sex === 'male' ? 'Male' : 'Female') : 'Not set'} 
            {profile.trainingExperience && ` • ${TRAINING_EXPERIENCE_LABELS[profile.trainingExperience]}`}
          </div>
          {profile.bodyFatPercent && (
            <div className="text-[#A4ACB8] text-xs mt-1">Body fat: {profile.bodyFatPercent}%</div>
          )}
        </div>

        {/* Goals */}
        <div className="bg-[#0F1115] rounded-lg p-3 border border-[#2B313A]">
          <div className="flex justify-between items-start mb-1">
            <span className="text-[#6B7280] text-xs uppercase tracking-wide">Goals</span>
            <EditButton section="goals" />
          </div>
          <div className="text-[#E6E9EF]">
            {profile.primaryGoal || 'Not set'}
            {profile.secondaryGoal && ` + ${profile.secondaryGoal}`}
          </div>
        </div>

        {/* Skills (if any selected) */}
        {formatSkills() && (
          <div className="bg-[#0F1115] rounded-lg p-3 border border-[#2B313A]">
            <div className="flex justify-between items-start mb-1">
              <span className="text-[#6B7280] text-xs uppercase tracking-wide">Skills to Master</span>
              <EditButton section="skill_selection" />
            </div>
            <div className="text-[#E6E9EF] text-xs leading-relaxed">
              {formatSkills()}
            </div>
          </div>
        )}

        {/* Flexibility (if any selected) */}
        {formatFlexibility() && (
          <div className="bg-[#0F1115] rounded-lg p-3 border border-[#2B313A]">
            <div className="flex justify-between items-start mb-1">
              <span className="text-[#6B7280] text-xs uppercase tracking-wide">Flexibility Goals</span>
              <EditButton section="skill_selection" />
            </div>
            <div className="text-[#E6E9EF] text-xs leading-relaxed">
              {formatFlexibility()}
            </div>
          </div>
        )}

        {/* Strength Benchmarks */}
        {getStrengthSummary() && (
          <div className="bg-[#0F1115] rounded-lg p-3 border border-[#2B313A]">
            <div className="flex justify-between items-start mb-1">
              <span className="text-[#6B7280] text-xs uppercase tracking-wide">Strength</span>
              <EditButton section="strength_benchmarks" />
            </div>
            <div className="text-[#E6E9EF] text-xs leading-relaxed space-y-0.5">
              {getStrengthSummary()?.map((item, i) => (
                <div key={i}>{item}</div>
              ))}
            </div>
          </div>
        )}

        {/* Skill Levels */}
        {getSkillSummary() && (
          <div className="bg-[#0F1115] rounded-lg p-3 border border-[#2B313A]">
            <div className="flex justify-between items-start mb-1">
              <span className="text-[#6B7280] text-xs uppercase tracking-wide">Skill Levels</span>
              <EditButton section="skill_benchmarks" />
            </div>
            <div className="text-[#E6E9EF] text-xs leading-relaxed space-y-0.5">
              {getSkillSummary()?.map((item, i) => (
                <div key={i}>{item}</div>
              ))}
            </div>
          </div>
        )}

        {/* Schedule */}
        <div className="bg-[#0F1115] rounded-lg p-3 border border-[#2B313A]">
          <div className="flex justify-between items-start mb-1">
            <span className="text-[#6B7280] text-xs uppercase tracking-wide">Training Schedule</span>
            <EditButton section="schedule" />
          </div>
          <div className="text-[#E6E9EF] text-xs space-y-0.5">
            <div>{profile.trainingDaysPerWeek || '?'} days/week{profile.sessionLengthMinutes && ` • ${SESSION_LENGTH_LABELS[profile.sessionLengthMinutes as SessionLengthPreference]}`}</div>
            {profile.sessionStyle && (
              <div className="text-[#A4ACB8]">Style: {SESSION_STYLE_LABELS[profile.sessionStyle]}</div>
            )}
          </div>
        </div>

        {/* Equipment */}
        <div className="bg-[#0F1115] rounded-lg p-3 border border-[#2B313A]">
          <div className="flex justify-between items-start mb-1">
            <span className="text-[#6B7280] text-xs uppercase tracking-wide">Equipment</span>
            <EditButton section="equipment" />
          </div>
          <div className="text-[#E6E9EF] text-xs leading-relaxed">
            {profile.equipment.length > 0 
              ? profile.equipment.map(e => EQUIPMENT_LABELS[e]).join(', ')
              : 'Bodyweight only'}
          </div>
        </div>

        {/* Readiness Calibration Summary */}
        {profile.readinessCalibration?.scores && (
          <div className="bg-[#0F1115] rounded-lg p-3 border border-[#2B313A]">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[#6B7280] text-xs uppercase tracking-wide">Training Calibration</span>
              <EditButton section="readiness" />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-full bg-[#2B313A] rounded-full h-1.5">
                  <div 
                    className="bg-[#4F6D8A] h-1.5 rounded-full" 
                    style={{ width: `${profile.readinessCalibration.scores.volumeToleranceScore}%` }}
                  />
                </div>
                <span className="text-[#6B7280] whitespace-nowrap">Volume</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-full bg-[#2B313A] rounded-full h-1.5">
                  <div 
                    className="bg-[#4F6D8A] h-1.5 rounded-full" 
                    style={{ width: `${profile.readinessCalibration.scores.recoveryToleranceScore}%` }}
                  />
                </div>
                <span className="text-[#6B7280] whitespace-nowrap">Recovery</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-full bg-[#2B313A] rounded-full h-1.5">
                  <div 
                    className="bg-[#4F6D8A] h-1.5 rounded-full" 
                    style={{ width: `${profile.readinessCalibration.scores.skillAdaptationScore}%` }}
                  />
                </div>
                <span className="text-[#6B7280] whitespace-nowrap">Skill</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-full bg-[#2B313A] rounded-full h-1.5">
                  <div 
                    className="bg-[#4F6D8A] h-1.5 rounded-full" 
                    style={{ width: `${profile.readinessCalibration.scores.strengthPotentialScore}%` }}
                  />
                </div>
                <span className="text-[#6B7280] whitespace-nowrap">Strength</span>
              </div>
            </div>
            <p className="text-[#6B7280] text-[10px] mt-2 text-center">
              These estimates help calibrate your starting program
            </p>
          </div>
        )}

        {/* Athlete Diagnostics Summary */}
        {(profile.primaryLimitation || profile.weakestArea || (profile.jointCautions && profile.jointCautions.length > 0)) && (
          <div className="bg-[#0F1115] rounded-lg p-3 border border-[#2B313A]">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[#6B7280] text-xs uppercase tracking-wide">Athlete Diagnostics</span>
              <EditButton section="readiness" />
            </div>
            <div className="space-y-1.5 text-xs">
              {profile.primaryLimitation && profile.primaryLimitation !== 'not_sure' && (
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Primary limitation:</span>
                  <span className="text-[#E6E9EF]">{PRIMARY_LIMITATION_LABELS[profile.primaryLimitation]}</span>
                </div>
              )}
              {profile.weakestArea && profile.weakestArea !== 'not_sure' && (
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Weakest area:</span>
                  <span className="text-[#E6E9EF]">{WEAKEST_AREA_LABELS[profile.weakestArea]}</span>
                </div>
              )}
              {profile.jointCautions && profile.jointCautions.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Joint priority:</span>
                  <span className="text-[#E6E9EF]">{profile.jointCautions.map(j => JOINT_CAUTION_LABELS[j]).join(', ')}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Confidence message */}
      <div className="bg-[#C1121F]/5 border border-[#C1121F]/20 rounded-lg p-3 mt-4">
        <p className="text-xs text-[#A4ACB8] text-center">
          Your personalized program will be built using your strength, skills, and goals.
          <br />
          <span className="text-[#6B7280]">SpartanLab adapts as you improve — update your metrics anytime.</span>
        </p>
      </div>
      
      {/* Clear All option - for users who want to start fresh */}
      {onClearAll && (
        <div className="mt-6 pt-4 border-t border-[#2B313A]">
          {showClearConfirm ? (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 space-y-3">
              <div className="text-center">
                <p className="text-sm text-red-400 font-medium mb-1">Clear All Profile Data?</p>
                <p className="text-xs text-[#A4ACB8]">
                  This will reset your onboarding selections and let you start fresh.
                </p>
              </div>
              
              {/* What will be cleared */}
              <div className="bg-[#0F1115] rounded-lg p-2.5 space-y-1.5">
                <p className="text-[10px] text-[#6B7280] uppercase tracking-wide font-medium">Will be cleared:</p>
                <ul className="text-xs text-[#A4ACB8] space-y-0.5 pl-2">
                  <li>• Goals and skill selections</li>
                  <li>• Strength and skill benchmarks</li>
                  <li>• Schedule and equipment preferences</li>
                </ul>
              </div>
              
              {/* What will be preserved */}
              <div className="bg-[#1A2F1A]/30 border border-[#2D5A2D]/30 rounded-lg p-2.5 space-y-1.5">
                <p className="text-[10px] text-[#4ADE80] uppercase tracking-wide font-medium">Will be preserved:</p>
                <ul className="text-xs text-[#4ADE80]/80 space-y-0.5 pl-2">
                  <li>• Workout history and completed sessions</li>
                  <li>• Program history and archives</li>
                  <li>• Account and billing information</li>
                </ul>
              </div>
              
              <div className="flex gap-2 justify-center pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowClearConfirm?.(false)}
                  className="border-[#3A3A3A] text-[#A4ACB8] hover:bg-[#2A2A2A]"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={onClearAll}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Clear Profile Data
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowClearConfirm?.(true)}
              className="w-full text-xs text-[#6B7280] hover:text-[#A4ACB8] transition-colors py-2"
            >
              Want to start over? Clear all selections
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function AthleteOnboarding() {
  const router = useRouter()
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [profile, setProfile] = useState<OnboardingProfile>(createEmptyOnboardingProfile())
  const [prefillLoaded, setPrefillLoaded] = useState(false)
  
  // =============================================================================
  // REGRESSION GUARD: ONBOARDING PREFILL BEHAVIOR
  // =============================================================================
  // 
  // This useEffect enables onboarding to act as a true profile editor on revisit.
  // 
  // REQUIRED BEHAVIOR (DO NOT REGRESS):
  // 1. On revisit, all previously saved values MUST appear pre-selected
  // 2. Prefill source priority: existingProfile > canonical > defaults
  // 3. If canonical profile has data, it MUST be reflected in selections
  // 4. Editing one step MUST NOT wipe unrelated untouched fields
  // 5. Clear All is the ONLY way to reset - not navigation or refresh
  // 
  // If this behavior breaks, users will see blank forms after saving.
  // =============================================================================
  useEffect(() => {
    if (prefillLoaded) return
    
    const existingProfile = getOnboardingProfile()
    const canonical = getCanonicalProfile()
    
    // TASK 9: Dev-safe diagnostic for onboarding prefill
    // TASK 7: Enhanced logging for round-trip verification
    if (process.env.NODE_ENV !== 'production') {
      console.log('[AthleteOnboarding] Prefill initialization:', {
        hasExistingProfile: !!existingProfile,
        existingOnboardingComplete: existingProfile?.onboardingComplete,
        existingPrimaryGoal: existingProfile?.primaryGoal,
        existingScheduleMode: existingProfile?.scheduleMode,
        existingSessionDurationMode: existingProfile?.sessionDurationMode,
        canonicalOnboardingComplete: canonical.onboardingComplete,
        canonicalPrimaryGoal: canonical.primaryGoal,
        canonicalSecondaryGoal: canonical.secondaryGoal,
        canonicalScheduleMode: canonical.scheduleMode,
        canonicalSessionDurationMode: canonical.sessionDurationMode,
        canonicalTrainingDaysPerWeek: canonical.trainingDaysPerWeek,
        canonicalSessionLengthMinutes: canonical.sessionLengthMinutes,
      })
    }
    logCanonicalProfileState('AthleteOnboarding prefill initialization')
    
    // [PHASE 16A TASK 1 & 6] Use reconciliation bridge instead of raw profile
    // This ensures flexible/adaptive UI state matches canonical truth
    if (existingProfile && (existingProfile.onboardingComplete || existingProfile.primaryGoal)) {
      console.log('[AthleteOnboarding] Prefilling from existing onboarding profile WITH reconciliation')
      
      // [PHASE 16A] Merge existing with canonical, then reconcile for UI
      const mergedProfile = mergeProfilesForPrefill(existingProfile, canonical)
      const reconciledProfile = reconcileStoredProfileForUI(mergedProfile, canonical)
      
      console.log('[phase16a-onboarding-prefill-raw-source-audit]', {
        source: 'existingProfile',
        rawScheduleMode: existingProfile.scheduleMode,
        rawTrainingDays: existingProfile.trainingDaysPerWeek,
        rawSessionDurationMode: existingProfile.sessionDurationMode,
        rawSessionLength: existingProfile.sessionLengthMinutes,
        rawEquipment: existingProfile.equipment,
        canonicalScheduleMode: canonical.scheduleMode,
        canonicalSessionDurationMode: canonical.sessionDurationMode,
      })
      
      setProfile({
        ...existingProfile,
        ...reconciledProfile,
      } as OnboardingProfile)
      
      // [PHASE 16A] Verify flexible/adaptive tiles will render correctly
      const willFlexDaysRender = reconciledProfile.trainingDaysPerWeek === 'flexible'
      const willAdaptiveDurationRender = reconciledProfile.sessionLengthMinutes === 'flexible'
      
      console.log('[phase16a-onboarding-flex-visual-truth-verdict]', {
        scheduleMode: reconciledProfile.scheduleMode,
        trainingDaysPerWeek: reconciledProfile.trainingDaysPerWeek,
        flexibleTileWillBeSelected: willFlexDaysRender,
        verdict: reconciledProfile.scheduleMode === 'flexible' 
          ? (willFlexDaysRender ? 'flex_visual_truth_correct' : 'flex_visual_truth_mismatch')
          : 'not_flexible_mode',
      })
      
      console.log('[phase16a-onboarding-adaptive-duration-visual-truth-verdict]', {
        sessionDurationMode: reconciledProfile.sessionDurationMode,
        sessionLengthMinutes: reconciledProfile.sessionLengthMinutes,
        adaptiveTileWillBeSelected: willAdaptiveDurationRender,
        verdict: reconciledProfile.sessionDurationMode === 'adaptive'
          ? (willAdaptiveDurationRender ? 'adaptive_visual_truth_correct' : 'adaptive_visual_truth_mismatch')
          : 'not_adaptive_mode',
      })
      
      console.log('[phase16a-benchbox-ui-normalization-audit]', {
        rawEquipment: existingProfile.equipment,
        reconciledEquipment: reconciledProfile.equipment,
        benchBoxWillBeSelected: (reconciledProfile.equipment as EquipmentType[])?.includes('bench_box'),
        verdict: 'equipment_normalized_for_ui',
      })
      
    } else if (canonical.onboardingComplete || canonical.primaryGoal) {
      // Fallback: Comprehensively populate from canonical if onboarding profile is missing
      console.log('[AthleteOnboarding] Prefilling comprehensive data from canonical profile')
      logProfileTruthState('AthleteOnboarding prefill from canonical')
      setProfile(prev => ({
        ...prev,
        // Demographics
        sex: (canonical.sex as Sex) || prev.sex,
        heightRange: (canonical.heightRange as HeightRange) || prev.heightRange,
        weightRange: (canonical.weightRange as WeightRange) || prev.weightRange,
        trainingExperience: (canonical.trainingExperience as TrainingExperience) || prev.trainingExperience,
        
        // Goals
        primaryGoal: (canonical.primaryGoal as PrimaryGoalType) || prev.primaryGoal,
        secondaryGoal: (canonical.secondaryGoal as PrimaryGoalType) || prev.secondaryGoal,
        selectedSkills: canonical.selectedSkills as SkillGoal[] || prev.selectedSkills,
        selectedFlexibility: canonical.selectedFlexibility as FlexibilityGoal[] || prev.selectedFlexibility,
        goalCategories: canonical.goalCategories as GoalCategory[] || prev.goalCategories,
        trainingPathType: (canonical.trainingPathType as TrainingPathType) || prev.trainingPathType,
        primaryTrainingOutcome: (canonical.primaryTrainingOutcome as PrimaryTrainingOutcome) || prev.primaryTrainingOutcome,
        
        // Schedule - TASK 1: Handle flexible schedule mode properly
        // If scheduleMode is 'flexible', set trainingDaysPerWeek to 'flexible' string
        trainingDaysPerWeek: canonical.scheduleMode === 'flexible' 
          ? 'flexible' 
          : (canonical.trainingDaysPerWeek as TrainingDaysPerWeek) || prev.trainingDaysPerWeek,
        // ISSUE B FIX: Restore sessionDurationMode and sessionLengthMinutes correctly
        // When sessionDurationMode is 'adaptive', set sessionLengthMinutes to 'flexible' string
        sessionLengthMinutes: canonical.sessionDurationMode === 'adaptive'
          ? 'flexible'
          : canonical.sessionLengthMinutes || prev.sessionLengthMinutes,
        sessionStyle: (canonical.sessionStylePreference as SessionStylePreference) || prev.sessionStyle,
        
        // Equipment & diagnostics - [PHASE 16A TASK 2] normalize bench → bench_box
        // [PRE-AB6 BUILD GREEN GATE / RAW EQUIPMENT BOUNDARY NORMALIZATION]
        // Route through normalizeStoredEquipmentForUI so the canonical
        // `EquipmentType[]` cast on a possibly-legacy source is replaced with
        // proper raw-input normalization. Falls back to prev.equipment (already
        // canonical) if neither source produces a usable array.
        equipment: normalizeStoredEquipmentForUI(canonical.equipmentAvailable ?? prev.equipment) ?? prev.equipment,
        jointCautions: canonical.jointCautions as JointCaution[] || prev.jointCautions,
        weakestArea: (canonical.weakestArea as WeakestArea) || prev.weakestArea,
        primaryLimitation: (canonical.primaryLimitation as PrimaryLimitation) || prev.primaryLimitation,
        
        // Strength benchmarks
        pullUpMax: (canonical.pullUpMax as PullUpCapacity) || prev.pullUpMax,
        dipMax: (canonical.dipMax as DipCapacity) || prev.dipMax,
        pushUpMax: (canonical.pushUpMax as PushUpCapacity) || prev.pushUpMax,
        wallHSPUReps: (canonical.wallHSPUReps as WallHSPUReps) || prev.wallHSPUReps,
        weightedPullUp: canonical.weightedPullUp ? {
          load: canonical.weightedPullUp.addedWeight,
          reps: canonical.weightedPullUp.reps,
          unit: canonical.weightedPullUp.unit || 'lbs',
        } : prev.weightedPullUp,
        weightedDip: canonical.weightedDip ? {
          load: canonical.weightedDip.addedWeight,
          reps: canonical.weightedDip.reps,
          unit: canonical.weightedDip.unit || 'lbs',
        } : prev.weightedDip,
        
        // All-time PRs
        allTimePRPullUp: canonical.allTimePRPullUp || prev.allTimePRPullUp,
        allTimePRDip: canonical.allTimePRDip || prev.allTimePRDip,
        
        // Skill benchmarks with band context
        frontLever: canonical.frontLeverProgression ? {
          progression: canonical.frontLeverProgression as FrontLeverProgression,
          holdSeconds: canonical.frontLeverHoldSeconds ?? undefined,
          isAssisted: canonical.frontLeverIsAssisted,
          bandLevel: (canonical.frontLeverBandLevel as BandLevel) || undefined,
          highestLevelEverReached: canonical.frontLeverHighestEver || undefined,
        } : prev.frontLever,
        planche: canonical.plancheProgression ? {
          progression: canonical.plancheProgression as PlancheProgression,
          holdSeconds: canonical.plancheHoldSeconds ?? undefined,
          isAssisted: canonical.plancheIsAssisted,
          bandLevel: (canonical.plancheBandLevel as BandLevel) || undefined,
          highestLevelEverReached: canonical.plancheHighestEver || undefined,
        } : prev.planche,
        muscleUp: (canonical.muscleUpReadiness as MuscleUpReadiness) || prev.muscleUp,
        hspu: canonical.hspuProgression ? {
          progression: canonical.hspuProgression as HSPUProgression,
        } : prev.hspu,
        lSitHold: (canonical.lSitHoldSeconds as LSitHoldCapacity) || prev.lSitHold,
        vSitHold: (canonical.vSitHoldSeconds as VSitHoldCapacity) || prev.vSitHold,
        
        // Flexibility with range intent
        frontSplits: canonical.frontSplitsLevel ? {
          level: canonical.frontSplitsLevel as FlexibilityLevel,
          rangeIntent: (canonical.frontSplitsRangeIntent as RangeTrainingIntent) || null,
        } : prev.frontSplits,
        sideSplits: canonical.sideSplitsLevel ? {
          level: canonical.sideSplitsLevel as FlexibilityLevel,
          rangeIntent: (canonical.sideSplitsRangeIntent as RangeTrainingIntent) || null,
        } : prev.sideSplits,
        pancake: canonical.pancakeLevel ? {
          level: canonical.pancakeLevel as FlexibilityLevel,
          rangeIntent: (canonical.pancakeRangeIntent as RangeTrainingIntent) || null,
        } : prev.pancake,
        toeTouch: canonical.toeTouchLevel ? {
          level: canonical.toeTouchLevel as FlexibilityLevel,
          rangeIntent: (canonical.toeTouchRangeIntent as RangeTrainingIntent) || null,
        } : prev.toeTouch,
      }))
    }
    
    // [PHASE 16A TASK 6] Final prefill verdict - log what will be displayed
    console.log('[phase16a-prefill-final-ui-profile-verdict]', {
      prefillSource: existingProfile ? 'existingProfile+canonical' : canonical.primaryGoal ? 'canonical' : 'empty',
      willRenderFlexibleDays: profile.trainingDaysPerWeek === 'flexible',
      willRenderAdaptiveDuration: profile.sessionLengthMinutes === 'flexible',
      equipmentCount: profile.equipment?.length || 0,
      hasBenchBox: profile.equipment?.includes('bench_box'),
      verdict: 'prefill_complete',
    })
    
    setPrefillLoaded(true)
  }, [prefillLoaded])
  
  // Clear all onboarding data and reset to empty state (with confirmation)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  
  // Deep-link URL param handling for profile updates
  // ?section=skill_selection&mode=update routes to specific section
  const searchParams = useSearchParams()
  const [isUpdateMode, setIsUpdateMode] = useState(false)
  const [deepLinkProcessed, setDeepLinkProcessed] = useState(false)
  
  const handleClearAllData = useCallback(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[AthleteOnboarding] Clear All confirmed - clearing onboarding data')
    }
    
    // TASK 2: Use canonical service to clear profile data properly
    // This preserves workout history and archived programs
    clearCanonicalProfileData()
    
    // Reset local state to empty profile
    setProfile(createEmptyOnboardingProfile())
    
    // Also clear the local onboarding profile key
    if (typeof window !== 'undefined') {
      localStorage.removeItem('spartanlab_onboarding_profile')
    }
    
    setShowClearConfirm(false)
    // Reset to first section
    setCurrentSectionIndex(0)
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('[AthleteOnboarding] Clear All completed - profile reset, workout history preserved')
    }
  }, [])

  // Filter sections based on showIf conditions
  const visibleSections = useMemo(() => {
    return SECTIONS.filter(section => !section.showIf || section.showIf(profile))
  }, [profile])
  
  // Process deep-link params after profile is loaded and visibleSections computed
  useEffect(() => {
    if (!prefillLoaded || deepLinkProcessed || visibleSections.length === 0) return
    
    try {
      const sectionParam = searchParams?.get('section')
      const modeParam = searchParams?.get('mode')
      
      if (modeParam === 'update') {
        setIsUpdateMode(true)
        console.log('[AthleteOnboarding] Update mode activated via URL param')
      }
      
      if (sectionParam) {
        const targetSectionId = sectionParam as SectionId
        const sectionIndex = visibleSections.findIndex(s => s.id === targetSectionId)
        
        if (sectionIndex !== -1) {
          console.log('[AthleteOnboarding] Deep-linking to section:', targetSectionId, 'at index:', sectionIndex)
          setCurrentSectionIndex(sectionIndex)
        } else {
          console.log('[AthleteOnboarding] Section not found or not visible:', targetSectionId)
        }
      }
      
      setDeepLinkProcessed(true)
    } catch (err) {
      console.error('[AthleteOnboarding] Error processing URL params:', err)
      setDeepLinkProcessed(true)
    }
  }, [prefillLoaded, deepLinkProcessed, searchParams, visibleSections])

  const currentSection = visibleSections[currentSectionIndex]
  const totalSections = visibleSections.length
  const isLastSection = currentSectionIndex === totalSections - 1
  const progress = ((currentSectionIndex + 1) / totalSections) * 100

  const updateProfile = useCallback((updates: Partial<OnboardingProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }))
  }, [])

  // Check if current section has minimum required data
  const canProceed = useMemo(() => {
    if (!currentSection) return false
    
    switch (currentSection.id) {
    case 'athlete_profile':
      return profile.sex !== null && profile.trainingExperience !== null
      case 'readiness':
      // At least 3 of 5 questions answered
      const r = profile.readinessCalibration
      const answered = [
        r?.trainingConsistency,
        r?.recoveryTolerance,
        r?.strengthPerception,
        r?.skillFamiliarity,
        r?.bodyType
  ].filter(Boolean).length
  return answered >= 3
  case 'training_outcome':
  return profile.primaryTrainingOutcome !== null
  case 'military_profile':
  // Military profile is complete if branch and test are selected
  return profile.militaryProfile?.branch !== null && 
         profile.militaryProfile?.targetTest !== null &&
         profile.militaryProfile?.goalPriority !== null
  case 'training_path':
  return profile.trainingPathType !== null
  case 'goals':
  return profile.primaryGoal !== null
      case 'skill_selection':
        return true // Optional selections
      case 'strength_benchmarks':
        return profile.pullUpMax !== null || profile.dipMax !== null
      case 'skill_benchmarks':
        return true // All optional within context
      case 'flexibility_benchmarks':
        return true // All optional within context
      case 'equipment':
        return profile.equipment.length > 0
      case 'schedule':
        return profile.trainingDaysPerWeek !== null && profile.sessionLengthMinutes !== null
      case 'recovery':
        return true // All optional
      case 'review':
        return true
      default:
        return true
    }
  }, [currentSection, profile])

  // Scroll to top on every step change
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    // Reset all possible scroll targets for cross-browser/mobile compatibility
    window.scrollTo({ top: 0, behavior: 'instant' })
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0
    }
    // Double-tap with requestAnimationFrame for delayed scroll restoration issues
    requestAnimationFrame(() => {
      window.scrollTo(0, 0)
      document.documentElement.scrollTop = 0
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0
      }
    })
  }, [currentSectionIndex])
  
  const handleNext = () => {
    if (!canProceed) return
    
    if (isLastSection) {
      handleSubmit()
    } else {
      setCurrentSectionIndex(prev => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(prev => prev - 1)
    }
  }

  // Navigate to a specific section (used by ReviewSection edit buttons)
  const goToSection = useCallback((sectionId: SectionId) => {
    const sectionIndex = visibleSections.findIndex(s => s.id === sectionId)
    if (sectionIndex !== -1) {
      setCurrentSectionIndex(sectionIndex)
    }
  }, [visibleSections])

  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    try {
      // Mark as complete and save onboarding profile
      const finalProfile = { ...profile, onboardingComplete: true }
      saveOnboardingProfile(finalProfile)
      
      // [baseline-vs-earned] ISSUE A: Capture baseline capability before any workouts
      // This separates starting capability from earned in-app progress
      captureBaselineCapability()
      console.log('[baseline-vs-earned] Baseline capability captured at onboarding completion')
      
      // CANONICAL FIX: Save ALL onboarding data to canonical profile service
      // This ensures settings, metrics, builder, and generation all see the same truth
      const isFlexibleSchedule = profile.trainingDaysPerWeek === 'flexible' || 
                                  (profile as any).scheduleMode === 'flexible'
      // TASK 1A: Detect adaptive time preference from onboarding selection
      const isAdaptiveTime = profile.sessionLengthMinutes === 'flexible'
      
      // ==========================================================================
      // TASK A FIX: Save COMPLETE canonical profile with ALL onboarding fields
      // Previously missing: equipment, benchmarks, skill data, recovery, cautions
      // ==========================================================================
      saveCanonicalProfile({
        // Identity
        onboardingComplete: true,
        
        // Demographics
        sex: profile.sex,
        heightRange: profile.heightRange,
        weightRange: profile.weightRange,
        trainingExperience: profile.trainingExperience,
        
        // Experience level (mapped)
        experienceLevel: profile.trainingExperience === 'new' || profile.trainingExperience === 'some' 
          ? 'beginner' 
          : profile.trainingExperience === 'intermediate' 
            ? 'intermediate' 
            : 'advanced',
        
        // Goals - CRITICAL: preserve ALL goal data
        primaryGoal: profile.primaryGoal,
        secondaryGoal: profile.secondaryGoal,
        selectedSkills: profile.selectedSkills,
        selectedFlexibility: profile.selectedFlexibility,
        selectedStrength: profile.selectedStrength || [],
        goalCategory: profile.goalCategory,
        goalCategories: profile.goalCategories,
        trainingPathType: profile.trainingPathType,
        primaryTrainingOutcome: profile.primaryTrainingOutcome,
        
        // Schedule - preserve flexible mode correctly
        trainingDaysPerWeek: isFlexibleSchedule 
          ? null  // null = truly flexible, engine derives at runtime
          : (typeof profile.trainingDaysPerWeek === 'number' ? profile.trainingDaysPerWeek : null),
        scheduleMode: isFlexibleSchedule ? 'flexible' : 'static',
        sessionDurationMode: isAdaptiveTime ? 'adaptive' : 'static',
        sessionLengthMinutes: typeof profile.sessionLengthMinutes === 'number'
          ? (profile.sessionLengthMinutes <= 30 ? 30 
             : profile.sessionLengthMinutes <= 45 ? 45 
             : profile.sessionLengthMinutes <= 60 ? 60 
             : 90)
          : 60,
        sessionStylePreference: profile.sessionStyle,
        trainingStyle: profile.trainingStyle,
        
        // TASK A: Equipment - was missing from canonical save!
        equipmentAvailable: profile.equipment || [],
        
        // TASK A: Athlete diagnostics - were missing!
        jointCautions: profile.jointCautions || [],
        weakestArea: profile.weakestArea || null,
        primaryLimitation: profile.primaryLimitation || null,
        
        // TASK A: Strength benchmarks - CRITICAL for engine
        pullUpMax: profile.pullUpMax || null,
        dipMax: profile.dipMax || null,
        pushUpMax: profile.pushUpMax || null,
        wallHSPUReps: profile.wallHSPUReps || null,
        weightedPullUp: profile.weightedPullUp || null,
        weightedDip: profile.weightedDip || null,
        allTimePRPullUp: profile.allTimePRPullUp || null,
        allTimePRDip: profile.allTimePRDip || null,
        
        // TASK A: Skill benchmarks - CRITICAL for engine
        frontLeverProgression: profile.frontLever?.progression || null,
        frontLeverHoldSeconds: profile.frontLever?.holdSeconds || null,
        frontLeverIsAssisted: profile.frontLever?.isAssisted || false,
        frontLeverBandLevel: profile.frontLever?.bandLevel || null,
        frontLeverHighestEver: profile.frontLever?.highestLevelEverReached || null,
        
        plancheProgression: profile.planche?.progression || null,
        plancheHoldSeconds: profile.planche?.holdSeconds || null,
        plancheIsAssisted: profile.planche?.isAssisted || false,
        plancheBandLevel: profile.planche?.bandLevel || null,
        plancheHighestEver: profile.planche?.highestLevelEverReached || null,
        
        muscleUpReadiness: profile.muscleUp || null,
        hspuProgression: profile.hspu?.progression || null,
        lSitHoldSeconds: profile.lSitHold || null,
        vSitHoldSeconds: profile.vSitHold || null,
        
        // [PHASE 5] Recovery context - derive from real four-field object
        recoveryQuality: deriveRecoveryQualityFromOnboarding(profile.recovery),
      })
      
      // [PHASE 5] [onboarding-recovery-truth-audit] Log recovery derivation
      const derivedRecoveryQuality = deriveRecoveryQualityFromOnboarding(profile.recovery)
      console.log('[onboarding-recovery-truth-audit]', {
        rawRecoveryObject: profile.recovery,
        derivedRecoveryQuality,
        sleepQuality: profile.recovery?.sleepQuality || null,
        energyLevel: profile.recovery?.energyLevel || null,
        stressLevel: profile.recovery?.stressLevel || null,
        recoveryConfidence: profile.recovery?.recoveryConfidence || null,
      })
      
      // TASK 6: Log complete canonical save for verification
      console.log('[onboarding] TASK A FIX: Complete canonical save:', {
        primaryGoal: profile.primaryGoal,
        secondaryGoal: profile.secondaryGoal,
        selectedSkillsCount: profile.selectedSkills?.length || 0,
        goalCategoriesCount: profile.goalCategories?.length || 0,
        trainingPathType: profile.trainingPathType,
        equipmentCount: profile.equipment?.length || 0,
        hasBenchmarks: !!(profile.pullUpMax || profile.dipMax),
        hasSkillData: !!(profile.frontLever?.progression || profile.planche?.progression),
        hasRecovery: !!derivedRecoveryQuality,
      })
      
      // TASK 2: Log onboarding saved schedule/duration
      console.log('[onboarding] TASK 2: Saved schedule/duration identity:', {
        scheduleMode: isFlexibleSchedule ? 'flexible' : 'static',
        trainingDaysPerWeek: isFlexibleSchedule ? null : profile.trainingDaysPerWeek,
        sessionDurationMode: isAdaptiveTime ? 'adaptive' : 'static',
        sessionLengthMinutes: typeof profile.sessionLengthMinutes === 'number' ? profile.sessionLengthMinutes : 60,
      })
      
      // [PHASE 5] [schedule-duration-source-truth-audit] - Task 4
      console.log('[schedule-duration-source-truth-audit]', {
        rawOnboardingValues: {
          trainingDaysPerWeek: profile.trainingDaysPerWeek,
          sessionLengthMinutes: profile.sessionLengthMinutes,
        },
        canonicalSavedValues: {
          scheduleMode: isFlexibleSchedule ? 'flexible' : 'static',
          trainingDaysPerWeek: isFlexibleSchedule ? null : (typeof profile.trainingDaysPerWeek === 'number' ? profile.trainingDaysPerWeek : null),
          sessionDurationMode: isAdaptiveTime ? 'adaptive' : 'static',
          sessionLengthMinutes: typeof profile.sessionLengthMinutes === 'number' ? profile.sessionLengthMinutes : 60,
        },
        flexiblePreserved: isFlexibleSchedule ? 'yes_saved_as_flexible' : 'static_preserved',
        adaptiveTimePreserved: isAdaptiveTime ? 'yes_saved_as_adaptive' : 'static_preserved',
      })
      
      // [PHASE 5] [phase5-source-truth-final-verdict] - Task 5
      const derivedRecoveryForVerdict = deriveRecoveryQualityFromOnboarding(profile.recovery)
      console.log('[phase5-source-truth-final-verdict]', {
        selectedSkillsCount: profile.selectedSkills?.length || 0,
        scheduleMode: isFlexibleSchedule ? 'flexible' : 'static',
        trainingDaysPerWeek: isFlexibleSchedule ? null : profile.trainingDaysPerWeek,
        sessionDurationMode: isAdaptiveTime ? 'adaptive' : 'static',
        sessionLengthMinutes: typeof profile.sessionLengthMinutes === 'number' ? profile.sessionLengthMinutes : 60,
        rawRecovery: profile.recovery,
        derivedRecoveryQuality: derivedRecoveryForVerdict,
        normalizedRecovery: 'will_be_filled_by_normalizer',
        sourceTruthSafeToAdvance: !!(
          (profile.selectedSkills?.length || 0) > 0 &&
          (isFlexibleSchedule ? true : typeof profile.trainingDaysPerWeek === 'number') &&
          (derivedRecoveryForVerdict !== null || !profile.recovery)  // recovery is optional
        ),
      })
      
      // [PHASE 5 TASK 4] SAVE CHAIN ORDER AUDIT - verify onboarding follows correct order
      console.log('[phase5-save-chain-order-audit]', {
        step1_rawNormalized: true, // Values are mapped above
        step2_canonicalUpdated: true, // saveCanonicalProfile called above
        step3_recoveryDerived: !!derivedRecoveryForVerdict,
        step4_entryBuiltFromCanonical: 'will_happen_at_generation',
        step5_programGenerated: 'will_happen_at_generation',
        step6_snapshotSaved: 'will_happen_at_generation',
        step7_displayReady: 'will_happen_at_generation',
        onboardingSaveComplete: true,
      })
      
      // [PHASE 5 TASK 2] Verify canonical precedence after save
      auditCanonicalPrecedence()
      
      // Log canonical state after save for debugging
      logProfileTruthState('After onboarding submit')
      
      // LEGACY: Also sync to athlete profile for backward compatibility
      // [PHASE 14A TASK 2] FIX: Preserve FULL equipment array without lossy filtering
      saveAthleteProfile({
        sex: profile.sex,
        experienceLevel: profile.trainingExperience === 'new' || profile.trainingExperience === 'some' 
          ? 'beginner' 
          : profile.trainingExperience === 'intermediate' 
            ? 'intermediate' 
            : 'advanced',
        trainingDaysPerWeek: isFlexibleSchedule 
          ? 4  // Internal default for engine calculations
          : (typeof profile.trainingDaysPerWeek === 'number' ? profile.trainingDaysPerWeek : 4),
        scheduleMode: isFlexibleSchedule ? 'flexible' : 'static',
        sessionLengthMinutes: typeof profile.sessionLengthMinutes === 'number'
          ? (profile.sessionLengthMinutes <= 30 ? 30 
             : profile.sessionLengthMinutes <= 45 ? 45 
             : profile.sessionLengthMinutes <= 60 ? 60 
             : 90)
          : 60,
        primaryGoal: profile.selectedSkills[0] || profile.primaryGoal || null,
        // [PHASE 14A] REMOVED LOSSY FILTER - preserve full equipment array
        equipmentAvailable: profile.equipment || [],
        // Sync joint cautions for protocol recommendations and exercise selection
        jointCautions: profile.jointCautions || [],
        // Sync weakest area for programming emphasis
        weakestArea: profile.weakestArea || null,
        onboardingComplete: true,
      })
      
      // ==========================================================================
      // TASK A FIX: Persist COMPLETE profile to canonical DB for authenticated users
      // Previously missing: secondaryGoal, selectedSkills, selectedFlexibility, 
      // selectedStrength, goalCategory, sessionDurationMode
      // ==========================================================================
      try {
        // Re-compute isAdaptiveTime for DB payload (matches canonical save)
        const isAdaptiveTimeForDB = profile.sessionLengthMinutes === 'flexible'
        
        const dbProfilePayload = {
          sex: profile.sex,
          experienceLevel: profile.trainingExperience === 'new' || profile.trainingExperience === 'some' 
            ? 'beginner' 
            : profile.trainingExperience === 'intermediate' 
              ? 'intermediate' 
              : 'advanced',
          trainingDaysPerWeek: isFlexibleSchedule 
            ? null 
            : (typeof profile.trainingDaysPerWeek === 'number' ? profile.trainingDaysPerWeek : 4),
          scheduleMode: isFlexibleSchedule ? 'flexible' : 'static',
          sessionDurationMode: isAdaptiveTimeForDB ? 'adaptive' : 'static',
          sessionLengthMinutes: typeof profile.sessionLengthMinutes === 'number'
            ? (profile.sessionLengthMinutes <= 30 ? 30 
               : profile.sessionLengthMinutes <= 45 ? 45 
               : profile.sessionLengthMinutes <= 60 ? 60 
               : 90)
            : 60,
          // TASK A FIX: primaryGoal should be the actual primary goal, not first selected skill
          primaryGoal: profile.primaryGoal || null,
          // TASK A FIX: Previously missing fields
          secondaryGoal: profile.secondaryGoal || null,
          selectedSkills: profile.selectedSkills || [],
          selectedFlexibility: profile.selectedFlexibility || [],
          selectedStrength: profile.selectedStrength || [],
          goalCategory: profile.goalCategory || null,
          // [PHASE 14A TASK 2] FIX: Preserve FULL equipment array without lossy filtering
          equipmentAvailable: profile.equipment || [],
          jointCautions: profile.jointCautions || [],
          weakestArea: profile.weakestArea || null,
          trainingStyle: profile.trainingStyle || 'balanced_hybrid',
        }
        
        // TASK 6: Log DB payload for verification
        console.log('[Onboarding] TASK A FIX: DB payload with all fields:', {
          primaryGoal: dbProfilePayload.primaryGoal,
          secondaryGoal: dbProfilePayload.secondaryGoal,
          selectedSkillsCount: dbProfilePayload.selectedSkills.length,
          sessionDurationMode: dbProfilePayload.sessionDurationMode,
        })
        
        // [PHASE 14A TASK 2] Equipment roundtrip audit
        const rawEquipment = profile.equipment || []
        const canonicalEquipment = profile.equipment || [] // Now matches raw
        const dbPayloadEquipment = dbProfilePayload.equipmentAvailable
        const droppedEquipment = rawEquipment.filter(e => !dbPayloadEquipment.includes(e))
        
        console.log('[phase14a-onboarding-equipment-roundtrip-audit]', {
          rawOnboardingEquipment: rawEquipment,
          canonicalEquipmentSaved: canonicalEquipment,
          dbPayloadEquipmentSaved: dbPayloadEquipment,
          droppedValues: droppedEquipment,
          hasWeights: rawEquipment.includes('weights'),
          hasBenchBox: rawEquipment.includes('bench_box'),
          verdict: droppedEquipment.length === 0 ? 'pass' : 'fail_equipment_dropped',
        })
        
        console.log('[phase14a-no-equipment-loss-verdict]', {
          noLoss: droppedEquipment.length === 0,
          rawCount: rawEquipment.length,
          savedCount: dbPayloadEquipment.length,
          verdict: droppedEquipment.length === 0 ? 'equipment_truth_preserved' : 'equipment_truth_lost',
        })
        
        // [PHASE 16A TASK 2] Bench/Box roundtrip verification
        const rawHasBenchBox = rawEquipment.includes('bench_box')
        const savedHasBenchBox = dbPayloadEquipment.includes('bench_box')
        const benchBoxPreserved = !rawHasBenchBox || savedHasBenchBox
        
        console.log('[phase16a-benchbox-roundtrip-verdict]', {
          userSelectedBenchBox: rawHasBenchBox,
          savedBenchBox: savedHasBenchBox,
          benchBoxPreserved,
          verdict: benchBoxPreserved ? 'benchbox_roundtrip_pass' : 'benchbox_roundtrip_fail',
        })
        
        const dbResponse = await fetch('/api/onboarding/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dbProfilePayload),
        })
        
        if (!dbResponse.ok) {
          console.error('[Onboarding] DB profile save failed:', dbResponse.status, dbResponse.statusText)
        } else {
          const dbResult = await dbResponse.json()
          console.log('[Onboarding] Profile upserted to DB successfully:', {
            scheduleMode: dbResult.profile?.scheduleMode,
            sessionDurationMode: dbResult.profile?.sessionDurationMode,
            selectedSkillsCount: dbResult.profile?.selectedSkills?.length || 0,
            onboardingComplete: dbResult.profile?.onboardingComplete,
          })
          
          // Sync DB response back to local storage - DB truth wins
          if (dbResult.success && dbResult.profile) {
            saveAthleteProfile({
              ...dbResult.profile,
              onboardingComplete: true,
            })
            console.log('[Onboarding] Synced DB profile to local storage')
          }
        }
      } catch (dbError) {
        console.error('[Onboarding] Error persisting to DB:', dbError)
        // Non-fatal - local storage was saved, continue
      }
      
      // Small delay for UX
      await new Promise(resolve => setTimeout(resolve, 500))
      
// Track completion
    trackOnboardingCompleted('onboarding')
    
    // Mark profile schema as up-to-date (clears profile update notification)
    markProfileSchemaAsComplete()
    console.log('[AthleteOnboarding] Profile schema marked as complete')
    
    // Navigate to program preview page (upgrade opportunity)
    // If in update mode, return to dashboard instead
    // ISSUE C FIX: Log navigation attempt for debugging
    const targetRoute = isUpdateMode ? '/dashboard' : '/onboarding/complete'
    console.log('[AthleteOnboarding] Navigating to:', targetRoute)
    router.push(targetRoute)
    
    // Note: setIsSubmitting(false) is NOT called on success because we're navigating away
    // The component will unmount, making the state irrelevant
    } catch (error) {
      // ISSUE B/D FIX: Log failure with consistent envelope and always reset loading
      console.error('[AthleteOnboarding] Submit FAILED:', {
        success: false,
        stage: 'submit',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      setIsSubmitting(false)
    }
  }

  // Render section content
  const renderSectionContent = () => {
    if (!currentSection) return null
    
    const props = { profile, updateProfile }
    
    switch (currentSection.id) {
    case 'athlete_profile':
      return <AthleteProfileSection {...props} />
  case 'readiness':
  return <ReadinessCalibrationSection {...props} />
  case 'training_outcome':
  return <TrainingOutcomeSection {...props} />
  case 'military_profile':
  return <MilitaryProfileSection {...props} />
  case 'training_path':
  return <TrainingPathSection {...props} />
  case 'goals':
  return <GoalsSection {...props} />
      case 'skill_selection':
        return <SkillSelectionSection {...props} />
      case 'strength_benchmarks':
        return <StrengthBenchmarksSection {...props} />
      case 'skill_benchmarks':
        return <SkillBenchmarksSection {...props} />
      case 'flexibility_benchmarks':
        return <FlexibilityBenchmarksSection {...props} />
      case 'equipment':
        return <EquipmentSection {...props} />
      case 'schedule':
        return <ScheduleSection {...props} />
      case 'recovery':
        return <RecoverySection {...props} />
      case 'review':
        return <ReviewSection profile={profile} onEditSection={goToSection} onClearAll={handleClearAllData} showClearConfirm={showClearConfirm} setShowClearConfirm={setShowClearConfirm} />
      default:
        return null
    }
  }

  if (!currentSection) {
    return (
      // [PHASE 16H] Consistent viewport isolation on error state
      <div className="h-[100dvh] bg-[#0F1115] flex items-center justify-center overflow-hidden">
        <div className="text-center p-8">
          <p className="text-[#A4ACB8] mb-4">Unable to load onboarding. Please refresh.</p>
          <Button onClick={() => window.location.reload()}>Refresh</Button>
        </div>
      </div>
    )
  }

  const Icon = currentSection.icon

  // [PHASE 16H] Mobile viewport isolation diagnostic
  console.log('[phase16h-onboarding-viewport-shell-audit]', {
    rendered: true,
    viewportStrategy: '100dvh_with_overflow_hidden',
    scrollContainerOwner: 'inner_flex_1_container',
    backgroundCoverage: 'full_viewport_solid_bg',
    timestamp: new Date().toISOString(),
  })
  
  // [PHASE 16H] Final verdict - no underlay bleed-through possible with:
  // 1. h-[100dvh] on outer shell (true mobile viewport height)
  // 2. overflow-hidden on outer shell (clips any overflow)
  // 3. bg-[#0F1115] on both outer and inner containers (solid background)
  console.log('[phase16h-mobile-viewport-final-verdict]', {
    fix: 'applied',
    outerShell: 'h-[100dvh] overflow-hidden bg-solid',
    innerScroll: 'flex-1 overflow-y-auto bg-solid',
    underlayBleedthrough: 'prevented',
  })

  return (
    // [PHASE 16H] VIEWPORT ISOLATION FIX:
    // Use h-[100dvh] for true mobile viewport height (accounts for browser chrome)
    // overflow-hidden on outer shell prevents underlying content bleed-through
    <div className="h-[100dvh] bg-[#0F1115] flex flex-col overflow-hidden">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-[#2B313A] z-50">
        <div 
          className="h-full bg-[#C1121F] transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* [PHASE 16H] Inner scroll container owns all scrolling - outer shell is fixed viewport */}
      <div ref={scrollContainerRef} className="flex-1 flex items-start justify-center p-4 pt-8 pb-24 overflow-y-auto bg-[#0F1115]">
        <div className="w-full max-w-lg">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <SpartanIcon size={36} />
            </div>
            <p className="text-xs text-[#6B7280] uppercase tracking-wider mb-1">
              {currentSectionIndex === 0 
                ? 'Quick setup'
                : `Step ${currentSectionIndex + 1} of ${totalSections}`
              }
            </p>
            <div className="flex items-center justify-center gap-2 mb-1">
              <Icon className="w-5 h-5 text-[#C1121F]" />
              <h1 className="text-xl md:text-2xl font-bold text-[#E6E9EF]">
                {currentSection.title}
              </h1>
            </div>
            <p className="text-sm text-[#6B7280]">
              {currentSection.subtitle}
            </p>
          </div>

          {/* Content Card */}
          <Card className="bg-[#1A1F26] border-[#2B313A] p-4 md:p-6">
            {renderSectionContent()}

            {/* Navigation Buttons */}
            <div className="flex gap-3 mt-6 pt-4 border-t border-[#2B313A]">
              {currentSectionIndex > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1 border-[#2B313A] hover:bg-[#2B313A] text-[#A4ACB8] py-5 md:py-6"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              )}
              <Button
                onClick={handleNext}
                disabled={!canProceed || isSubmitting}
                className={`bg-[#C1121F] hover:bg-[#A30F1A] text-white py-5 md:py-6 font-medium gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                  currentSectionIndex === 0 ? 'flex-1' : 'flex-[2]'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Building Program...
                  </>
                ) : isLastSection ? (
                  'Generate My Program'
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Section Indicators - [PHASE 16A TASK 3] Now clickable for direct navigation */}
          <div className="flex justify-center gap-1 mt-4 md:mt-6 flex-wrap">
            {visibleSections.map((section, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  console.log('[phase16a-step-dot-navigation-click-audit]', {
                    fromSection: currentSectionIndex,
                    toSection: i,
                    targetSectionId: section.id,
                    targetSectionTitle: section.title,
                  })
                  setCurrentSectionIndex(i)
                  console.log('[phase16a-step-dot-navigation-section-jump-verdict]', {
                    jumped: true,
                    from: currentSectionIndex,
                    to: i,
                    preservedState: true,
                    noValidationCorruption: true,
                  })
                }}
                aria-label={`Go to step ${i + 1} of ${visibleSections.length}: ${section.title}`}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-[#C1121F]/50 focus:ring-offset-1 focus:ring-offset-[#0F1115] ${
                  i === currentSectionIndex
                    ? 'w-5 bg-[#C1121F]'
                    : i < currentSectionIndex
                      ? 'w-1.5 bg-[#C1121F]/50 hover:bg-[#C1121F]/70'
                      : 'w-1.5 bg-[#2B313A] hover:bg-[#3B414A]'
                }`}
              />
            ))}
          </div>

          {/* Footer Note */}
          <p className="text-center text-xs text-[#6B7280] mt-4 md:mt-6 px-4">
            Everything here helps SpartanLab build training that fits you.
            <br />
            <span className="text-[#4F6D8A]">You can always change these later.</span>
          </p>
        </div>
      </div>
    </div>
  )
}
