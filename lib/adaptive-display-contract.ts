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
// DISPLAY FORMATTERS
// =============================================================================

/**
 * Get schedule display info from canonical profile data
 * 
 * [PHASE 14B] Truthful display:
 * - flexible mode shows "Adaptive" not a fixed number
 * - static mode shows the actual day count
 */
export function getScheduleDisplayInfo(
  scheduleMode: 'flexible' | 'static' | undefined,
  trainingDaysPerWeek: number | null | undefined
): ScheduleDisplayInfo {
  const isFlexible = scheduleMode === 'flexible'
  
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
 */
export function getDurationDisplayInfo(
  sessionDurationMode: 'adaptive' | 'static' | undefined,
  sessionLengthMinutes: number | undefined
): DurationDisplayInfo {
  const isAdaptive = sessionDurationMode === 'adaptive'
  const baseline = typeof sessionLengthMinutes === 'number' ? sessionLengthMinutes : 60
  
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
  
  return {
    label: `${baseline} min`,
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
  scheduleMode: 'flexible' | 'static' | undefined,
  trainingDaysPerWeek: number | null | undefined,
  sessionDurationMode: 'adaptive' | 'static' | undefined,
  sessionLengthMinutes: number | undefined
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
 */
export function getCompactScheduleLabel(
  scheduleMode: 'flexible' | 'static' | undefined,
  trainingDaysPerWeek: number | null | undefined
): string {
  if (scheduleMode === 'flexible') {
    return 'Adaptive Schedule'
  }
  const days = typeof trainingDaysPerWeek === 'number' ? trainingDaysPerWeek : 4
  return `${days} Days/Week`
}

/**
 * Get compact duration label for card headers
 */
export function getCompactDurationLabel(
  sessionDurationMode: 'adaptive' | 'static' | undefined,
  sessionLengthMinutes: number | undefined
): string {
  const baseline = typeof sessionLengthMinutes === 'number' ? sessionLengthMinutes : 60
  if (sessionDurationMode === 'adaptive') {
    return `~${baseline} min (Adaptive)`
  }
  return `${baseline} min`
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
  scheduleMode: 'flexible' | 'static' | undefined,
  trainingDaysPerWeek: number | null | undefined,
  sessionDurationMode: 'adaptive' | 'static' | undefined,
  sessionLengthMinutes: number | undefined,
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
