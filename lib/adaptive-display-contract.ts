/**
 * Adaptive Display Contract
 * 
 * [PHASE 14B TASK 6] Shared display helper layer for truthful adaptive schedule/duration display.
 * This ensures all UI surfaces show consistent, truthful information about:
 * - Schedule mode (flexible/static)
 * - Training days per week
 * - Session duration mode (adaptive/static)
 * - Session length minutes
 * 
 * Use this contract across:
 * - Onboarding complete summary
 * - First session ready page  
 * - Program overview card
 * - Settings preview
 */

import type { TrainingDaysPerWeek, SessionLengthPreference } from '@/lib/athlete-profile'
import type { SessionLength as ProgramSessionLength } from '@/lib/program-service'

// =============================================================================
// [PRE-AB6 BUILD GREEN GATE / ADAPTIVE DISPLAY CONTRACT BOUNDARY]
// Real onboarding/profile/program schedule + duration truth use literal
// unions that include adaptive/flexible signals:
//   TrainingDaysPerWeek      = 2 | 3 | 4 | 5 | 6 | 7 | 'flexible'
//   SessionLengthPreference  = 20 | 30 | 45 | 60 | 75 | 90 | 120 | 'flexible'
//   sessionDurationMode      = 'static' | 'adaptive' | undefined
// Display helpers were previously typed for `number | undefined` only,
// which rejected legitimate 'flexible' / null / undefined values that
// flow naturally from optional chaining on profile/program objects.
// Widen the helper boundary to accept the real unions and normalize
// flexible/adaptive signals inside the helpers. Display-only — callers
// never need to fake-convert flexible into a numeric stand-in, and no
// fallback is ever written back into profile/program data.
// =============================================================================
type ScheduleModeInput = 'flexible' | 'static' | null | undefined
type TrainingDaysInput = TrainingDaysPerWeek | number | null | undefined
type SessionDurationModeInput = 'adaptive' | 'static' | null | undefined
// [BUILD GREEN GATE / PROGRAM SESSION-LENGTH BOUNDARY]
// Program truth from lib/program-service.ts uses SessionLength which includes
// range tokens ('10-20' | '20-30' | '30-45' | '45-60' | '60+') in addition
// to numeric minutes. Athlete profile preference uses SessionLengthPreference
// which adds 'flexible'. The display contract is the shared boundary for
// BOTH sources, so SessionLengthInput must accept the full union — display
// helpers normalize range tokens to a numeric baseline for layout math and
// preserve the original token for label rendering. Program truth is never
// mutated and no normalized value is written back.
type SessionLengthInput =
  | SessionLengthPreference
  | ProgramSessionLength
  | number
  | null
  | undefined

// =============================================================================
// TYPES
// =============================================================================

export interface ScheduleDisplayInfo {
  label: string
  sublabel: string
  mode: 'flexible' | 'static'
  daysPerWeek: number | null
  isAdaptive: boolean
}

export interface DurationDisplayInfo {
  label: string
  sublabel: string
  mode: 'adaptive' | 'static'
  baselineMinutes: number
  isAdaptive: boolean
}

export interface AdaptiveDisplayContract {
  schedule: ScheduleDisplayInfo
  duration: DurationDisplayInfo
  summary: string
}

// =============================================================================
// SESSION-LENGTH DISPLAY-ONLY NORMALIZERS
// =============================================================================
// These two helpers exist purely to render labels and run baseline math for
// adaptive copy. They are NEVER persisted, NEVER passed back into program
// generation, and NEVER overwrite program.sessionLength.
//
// Baseline mapping rationale:
//   - numeric              -> use as-is
//   - 'flexible'           -> 60 (athlete-profile adaptive default)
//   - '10-20' / '20-30' / '30-45' / '45-60' -> upper bound of the range
//   - '60+'                -> 75 (conservative extended-session baseline;
//                            extended sessions in the runtime average above 60
//                            but the program truth doesn't claim a fixed 90)
//   - null / undefined     -> 60 (existing display fallback preserved)

function resolveSessionLengthBaselineMinutes(
  sessionLengthMinutes: SessionLengthInput
): number {
  if (typeof sessionLengthMinutes === 'number') return sessionLengthMinutes

  switch (sessionLengthMinutes) {
    case 'flexible':
      return 60
    case '10-20':
      return 20
    case '20-30':
      return 30
    case '30-45':
      return 45
    case '45-60':
      return 60
    case '60+':
      return 75
    default:
      return 60
  }
}

function getSessionLengthDisplayLabel(
  sessionLengthMinutes: SessionLengthInput,
  baseline: number
): string {
  switch (sessionLengthMinutes) {
    case '10-20':
      return '10-20 min'
    case '20-30':
      return '20-30 min'
    case '30-45':
      return '30-45 min'
    case '45-60':
      return '45-60 min'
    case '60+':
      return '60+ min'
    case 'flexible':
      return `~${baseline} min`
    default:
      return `${baseline} min`
  }
}

// =============================================================================
// DISPLAY FORMATTERS
// =============================================================================

/**
 * Get schedule display info from canonical profile data
 * 
 * [PHASE 14B] Truthful display:
 * - flexible mode shows "Adaptive" not a fixed number
 * - static mode shows the actual day count
 *
 * [PRE-AB6] Treat schedule as flexible if EITHER scheduleMode === 'flexible'
 * OR trainingDaysPerWeek === 'flexible' — legacy/partially-normalized
 * profiles may carry the flexible signal on either field. Numeric fallback
 * is display-only and is never written back into profile/program data.
 */
export function getScheduleDisplayInfo(
  scheduleMode: ScheduleModeInput,
  trainingDaysPerWeek: TrainingDaysInput
): ScheduleDisplayInfo {
  const isFlexible = scheduleMode === 'flexible' || trainingDaysPerWeek === 'flexible'
  
  if (isFlexible) {
    return {
      label: 'Adaptive',
      sublabel: 'Weekly sessions calculated from recovery and training history',
      mode: 'flexible',
      daysPerWeek: null,
      isAdaptive: true,
    }
  }
  
  const days = typeof trainingDaysPerWeek === 'number' ? trainingDaysPerWeek : 4
  return {
    label: `${days} days/week`,
    sublabel: 'Fixed weekly training schedule',
    mode: 'static',
    daysPerWeek: days,
    isAdaptive: false,
  }
}

/**
 * Get duration display info from canonical profile data
 *
 * [PHASE 14B] Truthful display:
 * - adaptive mode shows "Adaptive" with baseline target
 * - static mode shows exact duration
 *
 * [PRE-AB6] Treat duration as adaptive if EITHER sessionDurationMode === 'adaptive'
 * OR sessionLengthMinutes === 'flexible' — legacy/partially-normalized
 * profiles may carry the adaptive signal on either field. Numeric baseline
 * fallback (60) is display-only and is never written back into profile/program
 * data.
 */
export function getDurationDisplayInfo(
  sessionDurationMode: SessionDurationModeInput,
  sessionLengthMinutes: SessionLengthInput
): DurationDisplayInfo {
  const isAdaptive = sessionDurationMode === 'adaptive' || sessionLengthMinutes === 'flexible'
  const baseline = resolveSessionLengthBaselineMinutes(sessionLengthMinutes)
  
  // Map baseline to display range
  const rangeLabel = baseline <= 30 ? '~25-35' 
    : baseline <= 45 ? '~40-50'
    : baseline <= 60 ? '~55-70'
    : baseline <= 75 ? '~70-85'
    : '~80-100'
  
  if (isAdaptive) {
    return {
      label: 'Adaptive',
      sublabel: `${rangeLabel} min base target`,
      mode: 'adaptive',
      baselineMinutes: baseline,
      isAdaptive: true,
    }
  }
  
  // [BUILD GREEN GATE] Preserve range-token truth in label rendering when the
  // program carries a token like '60+' or '45-60'. Numeric program truth still
  // renders as `${baseline} min` via the default branch.
  return {
    label: getSessionLengthDisplayLabel(sessionLengthMinutes, baseline),
    sublabel: 'Fixed session duration',
    mode: 'static',
    baselineMinutes: baseline,
    isAdaptive: false,
  }
}

/**
 * Get full adaptive display contract from profile data
 */
export function getAdaptiveDisplayContract(
  scheduleMode: ScheduleModeInput,
  trainingDaysPerWeek: TrainingDaysInput,
  sessionDurationMode: SessionDurationModeInput,
  sessionLengthMinutes: SessionLengthInput
): AdaptiveDisplayContract {
  const schedule = getScheduleDisplayInfo(scheduleMode, trainingDaysPerWeek)
  const duration = getDurationDisplayInfo(sessionDurationMode, sessionLengthMinutes)
  
  // Build summary string
  let summary: string
  if (schedule.isAdaptive && duration.isAdaptive) {
    summary = 'Fully adaptive schedule and session duration'
  } else if (schedule.isAdaptive) {
    summary = `Adaptive schedule, ${duration.baselineMinutes} min sessions`
  } else if (duration.isAdaptive) {
    summary = `${schedule.daysPerWeek} days/week, adaptive duration`
  } else {
    summary = `${schedule.daysPerWeek} days/week, ${duration.baselineMinutes} min sessions`
  }
  
  // [PHASE 14B] Audit: Log display contract for verification
  console.log('[phase14b-shared-display-contract-audit]', {
    scheduleMode,
    trainingDaysPerWeek,
    sessionDurationMode,
    sessionLengthMinutes,
    displayScheduleLabel: schedule.label,
    displayDurationLabel: duration.label,
    summary,
    verdict: 'display_contract_resolved',
  })
  
  return { schedule, duration, summary }
}

/**
 * Get compact schedule label for card headers
 *
 * [PRE-AB6] Accepts the real TrainingDaysPerWeek union (numbers + 'flexible').
 * Flexible signal on either input maps to the adaptive label; non-flexible
 * non-numeric values fall through to the display-only numeric fallback.
 */
export function getCompactScheduleLabel(
  scheduleMode: ScheduleModeInput,
  trainingDaysPerWeek: TrainingDaysInput
): string {
  if (scheduleMode === 'flexible' || trainingDaysPerWeek === 'flexible') {
    return 'Adaptive Schedule'
  }
  const days = typeof trainingDaysPerWeek === 'number' ? trainingDaysPerWeek : 4
  return `${days} Days/Week`
}

/**
 * Get compact duration label for card headers
 *
 * [PRE-AB6] Accepts the real SessionLengthPreference union (numbers + 'flexible')
 * plus null/undefined from optional chaining. Adaptive signal on either input
 * maps to the adaptive label; non-adaptive non-numeric values fall through
 * to the display-only numeric baseline of 60.
 */
export function getCompactDurationLabel(
  sessionDurationMode: SessionDurationModeInput,
  sessionLengthMinutes: SessionLengthInput
): string {
  const isAdaptive = sessionDurationMode === 'adaptive' || sessionLengthMinutes === 'flexible'
  const baseline = resolveSessionLengthBaselineMinutes(sessionLengthMinutes)
  if (isAdaptive) {
    return `~${baseline} min (Adaptive)`
  }
  return getSessionLengthDisplayLabel(sessionLengthMinutes, baseline)
}

// =============================================================================
// PHASE 14B AUDITS
// =============================================================================

/**
 * Run adaptive display parity audit
 * Call this when rendering summaries to verify truth
 */
export function runAdaptiveDisplayParityAudit(
  source: string,
  scheduleMode: ScheduleModeInput,
  trainingDaysPerWeek: TrainingDaysInput,
  sessionDurationMode: SessionDurationModeInput,
  sessionLengthMinutes: SessionLengthInput,
  displayedScheduleLabel: string,
  displayedDurationLabel: string
): void {
  const expectedSchedule = getScheduleDisplayInfo(scheduleMode, trainingDaysPerWeek)
  const expectedDuration = getDurationDisplayInfo(sessionDurationMode, sessionLengthMinutes)
  
  const scheduleParity = displayedScheduleLabel.includes(expectedSchedule.label) || 
    displayedScheduleLabel.toLowerCase().includes('adaptive') === expectedSchedule.isAdaptive
  const durationParity = displayedDurationLabel.includes(expectedDuration.label) ||
    displayedDurationLabel.toLowerCase().includes('adaptive') === expectedDuration.isAdaptive
  
  console.log('[phase14b-adaptive-display-parity-audit]', {
    source,
    canonical: {
      scheduleMode,
      trainingDaysPerWeek,
      sessionDurationMode,
      sessionLengthMinutes,
    },
    expected: {
      scheduleLabel: expectedSchedule.label,
      durationLabel: expectedDuration.label,
    },
    actual: {
      displayedScheduleLabel,
      displayedDurationLabel,
    },
    scheduleParity,
    durationParity,
    verdict: scheduleParity && durationParity ? 'parity_ok' : 'parity_mismatch',
  })
}
