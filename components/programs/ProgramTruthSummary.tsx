'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { getSafeSkillTrace } from '@/lib/safe-access'

/**
 * PROGRAM TRUTH SUMMARY
 *
 * Coaching-style explanation of why the visible Program looks the way it does.
 *
 * [TRUTH-SURFACE-PRUNE + VISUAL-HIERARCHY-LOCK]
 * The primary surface is deliberately short and product-sharp. It answers, in
 * plain language:
 *   1. What is this plan built around?
 *   2. Why does the weekly structure look this way?
 *   3. What was intentionally emphasized vs deferred?
 *   4. Is the program conservative, aggressive, or balanced — and why?
 *
 * Diagnostic / provenance material (DB-truth winner rollup, doctrine-influence
 * terminology, materialization verdict labels, explanation-quality audit
 * footer, hidden-factors count) is NOT surfaced here. It still lives on the
 * canonical truth object and is available to downstream debug surfaces — but
 * this user-facing summary stays on coaching language only.
 *
 * Ownership: this component is a pure consumer of the canonical
 * `truthExplanation` resolved in `app/(app)/program/page.tsx`. It does not
 * compute truth; it only presents a ranked subset.
 */

interface MethodApplicationSummary {
  actuallyApplied: string[]
  perSessionMethods: Array<{
    dayNumber: number
    dayFocus: string
    appliedMethods: string[]
    hasSuperset: boolean
    hasCircuit: boolean
    hasDensity: boolean
    structureDescription: string
  }>
  sessionsWithSupersets: number
  sessionsWithCircuits: number
  sessionsWithDensity: number
  sessionsWithOnlyStraightSets: number
  expressionSummary: string
}

interface MethodMaterialityReport {
  userSelectedMethods: string[]
  appliedMethods: string[]
  selectedButNotApplied: string[]
  nonApplicationReasons: Array<{
    method: string
    reason: string
  }>
  verdict: 'FULLY_EXPRESSED' | 'MOSTLY_EXPRESSED' | 'LIGHTLY_EXPRESSED' | 'NOT_EXPRESSED' | 'NO_PREFERENCES'
  explanationForUser: string
}

// [PHASE 2 MULTI-SKILL] Broader skill coverage contract types
interface SkillCoverageEntry {
  skill: string
  priorityLevel: 'primary' | 'secondary' | 'tertiary' | 'support'
  targetExposure: number
  allocatedSessions: number
  materiallyExpressedSessions: number
  coverageStatus: 'fully_represented' | 'broadly_represented' | 'support_only' | 'deferred'
  deferralReason: string | null
}

interface BroaderSkillCoverageContract {
  entries: SkillCoverageEntry[]
  coverageVerdict: 'strong' | 'adequate' | 'weak'
  representedSkills: string[]
  deferredSkills: Array<{ skill: string; reason: string }>
  supportOnlySkills: string[]
  supportExpressedSkills?: string[]
  supportRotationalSkills?: string[]
}

interface TruthExplanation {
  identityPrimary: string | null
  identitySecondary: string | null
  identityLabel: string
  selectedSkillsUsed: string[]
  representedSkillsInWeek: string[]
  underexpressedSkills: string[]
  broaderSkillCoverage?: BroaderSkillCoverageContract | null
  scheduleModeUsed: 'static' | 'flexible'
  baselineSessions: number
  currentSessions: number
  frequencyWasAdapted: boolean
  frequencyAdaptationReason: string | null
  durationModeUsed: 'static' | 'adaptive'
  durationTargetUsed: number
  experienceLevelUsed: string
  equipmentUsed: string[]
  weightedLoadingUsed: boolean
  flexibilityGoalsUsed: string[]
  flexibilityIntegrated: boolean
  trainingPathUsed: string | null
  goalCategoriesUsed: string[]
  trainingMethodsUsed: string[]
  sessionStyleUsed: string | null
  methodPreferencesApplied?: MethodApplicationSummary
  methodPreferencesMateriality?: MethodMaterialityReport
  jointCautionsConsidered: string[]
  weakPointAddressed: string | null
  limiterAddressed: string | null
  recoveryLevelUsed: string | null
  explanationFactors: Array<{
    factor: string
    label: string
    wasUsed: boolean
    isVisible: boolean
    importance: 'high' | 'medium' | 'low'
  }>
  hiddenTruthNotSurfaced: string[]
  truthfulSummary: string
  explanationQualityVerdict: string
  generatedAt?: string
  triggerSource?: string
  currentWorkingProgressions?: {
    planche: {
      currentWorkingProgression: string | null
      historicalCeiling: string | null
      truthSource: string
      truthNote: string | null
      isConservative: boolean
    }
    frontLever: {
      currentWorkingProgression: string | null
      historicalCeiling: string | null
      truthSource: string
      truthNote: string | null
      isConservative: boolean
    }
    hspu: {
      currentWorkingProgression: string | null
      historicalCeiling: string | null
      truthSource: string
      truthNote: string | null
      isConservative: boolean
    }
    anyConservativeStart: boolean
    anyHistoricalCeiling: boolean
  } | null
  progressionTruthNote?: string | null
  doctrineInfluence?: {
    available: boolean
    source: 'db_live' | 'fallback_none'
    influenceLevel: 'none' | 'minimal' | 'moderate' | 'strong'
    headlineReasons: string[]
    userVisibleSummary: string[]
    methodsInfluenced: boolean
    progressionInfluenced: boolean
    prescriptionInfluenced: boolean
  } | null
  sessionArchitectureTruth?: {
    sourceVerdict: 'FULL_TRUTH_AVAILABLE' | 'PARTIAL_TRUTH_AVAILABLE' | 'MINIMAL_TRUTH_FALLBACK'
    complexity: 'low' | 'moderate' | 'high'
    primarySpineSkills: string[]
    secondaryAnchorSkills: string[]
    supportRotationSkills: string[]
    deferredSkills: Array<{ skill: string; reason: string; details: string }>
    currentWorkingCapsCount: number
    historicalCeilingBlockedCount: number
    weeklyMaterialityVerdict: 'TOO_CLOSE_TO_FOUNDATIONAL_DEFAULT' | 'ACCEPTABLY_DIFFERENT' | 'STRONGLY_PERSONALIZED'
    doctrineArchitectureBias: {
      sessionRoleBias: string
      supportAllocationBias: string
      methodPackagingBias: string
    }
    flexibilityIntegration?: {
      hasFlexibilityGoals: boolean
      integrationMode: 'dedicated_block' | 'warmup_integrated' | 'cooldown_integrated' | 'none'
      flexibilityTimeReserved: number
    }
    methodPackaging?: {
      preferredMethods: string[]
      actualMethodsApplied: string[]
      packagingDecision: string
      rationale: string
    }
    visibleDifferenceScore?: number
    templateEscapeRequired?: boolean
  } | null
  materializationVerdict?: {
    verdict: 'PASS' | 'WARN' | 'FAIL'
    issues: string[]
    skillCoverage: {
      selected: number
      expressed: number
      dropped: string[]
    }
    normalizedExpression?: {
      directlyExpressed?: string[]
      technicallyExpressed?: string[]
      supportExpressed?: string[]
      carryoverOnly?: string[]
      deferredSkills?: string[]
      trulyDropped?: string[]
      truthSourceUsed?: 'visibleWeekAudit' | 'authoritativeIntent' | 'sessionArchitecture' | 'legacyFallback'
    }
    exerciseClassification: {
      total: number
      genericFallback: number
      doctrineDriven: number
      genericRatio: number
    }
    consistencyCheck?: {
      contradictionDetected: boolean
      visibleAuditSkillCount: number
      visiblyExpressedCount: number
    }
  } | null
  authoritativeMultiSkillIntentContract?: {
    selectedSkills: string[]
    primarySkill: string | null
    secondarySkill: string | null
    supportSkills: string[]
    deferredSkills: Array<{
      skill: string
      reasonCode: string
      reasonLabel: string
      details?: string
    }>
    materiallyExpressedSkills: string[]
    reducedThisCycleSkills: string[]
    skillPriorityOrder: Array<{
      skill: string
      role: 'primary' | 'secondary' | 'tertiary' | 'support' | 'deferred'
      priorityScore: number
      exposureSessions: number
      currentWorkingProgression?: string | null
      historicalCeiling?: string | null
    }>
    coverageVerdict: 'strong' | 'adequate' | 'weak'
    sourceTruthCount: number
    materiallyUsedCount: number
    auditTrail: {
      canonicalSourceSkillCount: number
      builderInputSkillCount: number
      weightedAllocationSkillCount: number
      sessionArchitectureSkillCount: number
      skillsLostInPipeline: string[]
      skillsNarrowedReason: string | null
    }
  } | null
  visibleWeekSkillExpressionAudit?: {
    selectedSkillsCount: number
    primarySkill: string
    secondarySkill: string | null
    visibleWeekSkillCount: number
    skillsWithDirectBlocks: string[]
    skillsWithTechnicalSlots: string[]
    skillsWithSupportBlocks: string[]
    skillsWithMixedDayPresence: string[]
    skillsCarryoverOnly: string[]
    deferredSkills: string[]
    finalVerdict: 'VISIBLE_WEEK_EXPRESSION_STRONG' | 'VISIBLE_WEEK_EXPRESSION_ADEQUATE' | 'VISIBLE_WEEK_EXPRESSION_NARROW'
  } | null
  // [DB-TRUTH-WINNER-PROVENANCE-LOCK] Retained on the type for data integrity,
  // but intentionally NOT surfaced in this primary product-facing summary. It
  // stays on the canonical object for downstream diagnostic surfaces.
  dbTruthWinnerSummary?: {
    totalExercisesWithDbTruthInfluence: number
    exercisesReorderedByDbTruth: number
    exercisesConservativeByCurrentTruth: number
    exercisesReadinessGated: number
    exercisesWhereCurrentBeatHistorical: number
    precedenceBreakdown: {
      current: number
      response: number
      historical: number
      readinessGate: number
      default: number
    }
    sourceOfTruth: 'db_truth_final_winner_rollup'
  } | null
}

interface SkillTraceEntry {
  skill: string
  inCanonicalProfile: boolean
  wasPrimaryGoal: boolean
  wasSecondaryGoal: boolean
  inWeightedAllocation: boolean
  weightedPriorityLevel: 'primary' | 'secondary' | 'tertiary' | 'support' | null
  weightedExposureSessions: number
  finalRole: 'primary_spine' | 'secondary_anchor' | 'tertiary' | 'support' | 'deferred'
  materiallyAllocated: boolean
  representationOutcome: 'direct' | 'support' | 'rotational' | 'deferred'
  deferralReasonCode: string | null
  deferralReasonLabel: string | null
  currentWorkingProgression: string | null
  historicalCeiling: string | null
  isConservative: boolean
  progressionDroveDecision: boolean
}

interface SelectedSkillTraceContract {
  sourceSelectedSkills: string[]
  sourcePrimaryGoal: string | null
  sourceSecondaryGoal: string | null
  sourceSkillCount: number
  skillTraces: SkillTraceEntry[]
  weightedAllocationCount: number
  primarySpineCount: number
  secondaryAnchorCount: number
  tertiaryCount: number
  supportCount: number
  deferredCount: number
  finalWeekExpression: {
    directlyRepresentedSkills: string[]
    supportExpressedSkills: string[]
    rotationalSkills: string[]
    deferredSkills: Array<{
      skill: string
      reasonCode: string | null
      reasonLabel: string
      details: string | null
    }>
    coverageVerdict: 'strong' | 'adequate' | 'weak'
    coverageRatio: number
  }
}

interface ProgramTruthSummaryProps {
  truthExplanation: TruthExplanation | null | undefined
  selectedSkillTrace?: SelectedSkillTraceContract | null
  className?: string
}

// ---------------------------------------------------------------------------
// Small presentational helpers kept local so the component stays self-contained
// and does not invent any new truth. They only reformat existing fields.
// ---------------------------------------------------------------------------

function humanize(value: string | null | undefined): string | null {
  if (!value) return null
  return value.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
}

function lowerHumanize(value: string | null | undefined): string | null {
  if (!value) return null
  return value.replace(/_/g, ' ').toLowerCase()
}

type Tone = 'success' | 'info' | 'warning'

function toneClasses(tone: Tone): string {
  switch (tone) {
    case 'success':
      return 'bg-green-500/10 text-green-400 border-green-500/20'
    case 'warning':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/30'
    default:
      return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
  }
}

export function ProgramTruthSummary({ truthExplanation, selectedSkillTrace, className }: ProgramTruthSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!truthExplanation) {
    return null
  }

  const {
    identityPrimary,
    identitySecondary,
    selectedSkillsUsed,
    representedSkillsInWeek,
    underexpressedSkills,
    broaderSkillCoverage,
    scheduleModeUsed,
    currentSessions,
    frequencyWasAdapted,
    frequencyAdaptationReason,
    equipmentUsed,
    weightedLoadingUsed,
    methodPreferencesApplied,
    methodPreferencesMateriality,
    flexibilityGoalsUsed,
    flexibilityIntegrated,
    sessionArchitectureTruth,
    currentWorkingProgressions,
    progressionTruthNote,
    authoritativeMultiSkillIntentContract: authContract,
  } = truthExplanation

  // -------------------------------------------------------------------------
  // Tier 1 — the plain-language narrative. Built entirely from existing truth
  // fields. Each fragment references *visible* program facts (primary goal,
  // session count, actual adaptation reason, actual conservative-start
  // verdict) so the summary reads as an explanation of the plan the user is
  // looking at, not a nearby intelligence object.
  // -------------------------------------------------------------------------
  const primaryLabel = humanize(identityPrimary)
  const secondaryLabel = humanize(identitySecondary)
  const primarySkill = authContract?.primarySkill || sessionArchitectureTruth?.primarySpineSkills?.[0] || null
  const primarySkillLabel = humanize(primarySkill)

  const isConservativeStart =
    !!sessionArchitectureTruth && sessionArchitectureTruth.historicalCeilingBlockedCount > 0
  const conservativeSkillCount = sessionArchitectureTruth?.historicalCeilingBlockedCount ?? 0
  const isPersonalized =
    sessionArchitectureTruth?.weeklyMaterialityVerdict === 'STRONGLY_PERSONALIZED'
  const isTailored =
    sessionArchitectureTruth?.weeklyMaterialityVerdict === 'ACCEPTABLY_DIFFERENT'

  const weeklyPhrase =
    scheduleModeUsed === 'flexible'
      ? `${currentSessions}-session flexible week`
      : `${currentSessions}-day static week`

  const narrativeSentences: string[] = []
  if (primaryLabel) {
    const leader = primarySkillLabel
      ? `Built around ${lowerHumanize(identityPrimary)} with ${lowerHumanize(primarySkill)} as the main skill focus`
      : `Built around ${lowerHumanize(identityPrimary)}`
    narrativeSentences.push(
      secondaryLabel
        ? `${leader}, with ${lowerHumanize(identitySecondary)} as a secondary focus.`
        : `${leader}.`,
    )
  }
  narrativeSentences.push(`Delivered as a ${weeklyPhrase}.`)
  if (frequencyWasAdapted && frequencyAdaptationReason) {
    narrativeSentences.push(`Frequency adapted because ${frequencyAdaptationReason.toLowerCase()}.`)
  }
  if (isConservativeStart) {
    narrativeSentences.push(
      conservativeSkillCount > 1
        ? `Starting from your current working ability on ${conservativeSkillCount} skills, not a historical peak.`
        : `Starting from your current working ability, not a historical peak.`,
    )
  } else if (isPersonalized) {
    narrativeSentences.push(`Strongly personalized to your profile rather than a template.`)
  }

  const narrative = narrativeSentences.join(' ')

  // -------------------------------------------------------------------------
  // Tier 2 — the top chip row. Strictly ranked. Maximum 4 chips so the
  // primary surface stays scannable. Each chip answers a single high-value
  // question about the *visible* program.
  // -------------------------------------------------------------------------
  const topChips: Array<{ label: string; value: string; tone: Tone }> = []

  if (primaryLabel) {
    topChips.push({
      label: 'Focus',
      value: secondaryLabel ? `${primaryLabel} + ${secondaryLabel}` : primaryLabel,
      tone: 'success',
    })
  }

  const skillsTotal = authContract?.sourceTruthCount ?? selectedSkillsUsed.length
  const skillsExpressed =
    authContract?.materiallyUsedCount ??
    (broaderSkillCoverage?.representedSkills.length ?? representedSkillsInWeek.length)
  if (skillsTotal > 0) {
    const ratio = skillsTotal > 0 ? skillsExpressed / skillsTotal : 0
    topChips.push({
      label: 'Skills',
      value: `${skillsExpressed}/${skillsTotal} expressed this cycle`,
      tone: ratio >= 0.8 ? 'success' : ratio >= 0.5 ? 'info' : 'warning',
    })
  }

  topChips.push({
    label: 'Week',
    value: scheduleModeUsed === 'flexible' ? `Flexible · ${currentSessions} sessions` : `${currentSessions} days/week`,
    tone: 'info',
  })

  if (isConservativeStart) {
    topChips.push({ label: 'Starting point', value: 'Current working ability', tone: 'warning' })
  } else if (isPersonalized) {
    topChips.push({ label: 'Style', value: 'Personalized', tone: 'success' })
  } else if (isTailored) {
    topChips.push({ label: 'Style', value: 'Tailored', tone: 'info' })
  }

  // -------------------------------------------------------------------------
  // Tier 3 — expanded details. Grouped into two lightweight sections the user
  // can actually reason about: "Skill roles this cycle" and "Training
  // preferences applied". Kept short; no audit verdict chips, no materiality
  // jargon, no provenance breakdowns.
  // -------------------------------------------------------------------------
  const priorityOrder = authContract?.skillPriorityOrder ?? []
  const deferredEntries =
    authContract?.deferredSkills ??
    broaderSkillCoverage?.deferredSkills.map((d) => ({
      skill: d.skill,
      reasonCode: '',
      reasonLabel: d.reason,
    })) ??
    []

  const safeTrace = selectedSkillTrace ? getSafeSkillTrace(selectedSkillTrace) : null

  const workingProgressionRows = (() => {
    const rows: Array<{ skill: string; current: string; ceiling: string | null; conservative: boolean }> = []
    if (currentWorkingProgressions) {
      const entries: Array<{ key: 'planche' | 'frontLever' | 'hspu'; label: string }> = [
        { key: 'planche', label: 'Planche' },
        { key: 'frontLever', label: 'Front Lever' },
        { key: 'hspu', label: 'HSPU' },
      ]
      for (const { key, label } of entries) {
        const row = currentWorkingProgressions[key]
        if (row?.currentWorkingProgression) {
          rows.push({
            skill: label,
            current: humanize(row.currentWorkingProgression)!,
            ceiling:
              row.historicalCeiling && row.historicalCeiling !== row.currentWorkingProgression
                ? humanize(row.historicalCeiling)
                : null,
            conservative: !!row.isConservative,
          })
        }
      }
    }
    // Supplement from trace if we still have room
    if (safeTrace && rows.length < 4) {
      const typedTraces = (safeTrace.skillTraces ?? []) as Array<{
        skill?: string
        currentWorkingProgression?: string | null
        historicalCeiling?: string | null
        isConservative?: boolean
      }>
      for (const trace of typedTraces) {
        if (rows.length >= 4) break
        if (!trace.skill) continue
        const label = humanize(trace.skill)!
        if (rows.some((r) => r.skill === label)) continue
        if (!trace.currentWorkingProgression && !trace.historicalCeiling) continue
        rows.push({
          skill: label,
          current: trace.currentWorkingProgression ? humanize(trace.currentWorkingProgression)! : '—',
          ceiling:
            trace.historicalCeiling && trace.historicalCeiling !== trace.currentWorkingProgression
              ? humanize(trace.historicalCeiling)
              : null,
          conservative: !!trace.isConservative,
        })
      }
    }
    return rows
  })()

  const appliedMethods = (() => {
    if (!methodPreferencesApplied) return [] as string[]
    const labels: string[] = []
    if (methodPreferencesApplied.sessionsWithSupersets > 0) {
      labels.push(
        `Supersets · ${methodPreferencesApplied.sessionsWithSupersets} session${methodPreferencesApplied.sessionsWithSupersets > 1 ? 's' : ''}`,
      )
    }
    if (methodPreferencesApplied.sessionsWithCircuits > 0) {
      labels.push(
        `Circuits · ${methodPreferencesApplied.sessionsWithCircuits} session${methodPreferencesApplied.sessionsWithCircuits > 1 ? 's' : ''}`,
      )
    }
    if (methodPreferencesApplied.sessionsWithDensity > 0) {
      labels.push(
        `Density · ${methodPreferencesApplied.sessionsWithDensity} session${methodPreferencesApplied.sessionsWithDensity > 1 ? 's' : ''}`,
      )
    }
    return labels
  })()

  const flexibilityLabels = (flexibilityGoalsUsed ?? [])
    .slice(0, 3)
    .map((f) => humanize(f))
    .filter((v): v is string => !!v)

  const equipmentLabels = (equipmentUsed ?? [])
    .slice(0, 6)
    .map((e) => humanize(e))
    .filter((v): v is string => !!v)

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <Card className={cn('bg-[#2A2A2A] border-[#3A3A3A]', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base text-[#E8E4D9]">Why this plan</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[#8A8A8A] hover:text-[#E8E4D9] h-7 px-2"
            aria-label={isExpanded ? 'Hide details' : 'Show details'}
            aria-expanded={isExpanded}
          >
            <span className="text-xs mr-1">{isExpanded ? 'Hide details' : 'Details'}</span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* ---------------------------------------------------------------
            PRIMARY SURFACE — narrative + 3-4 high-value chips + one honest
            warning row. Intentionally compact; no audit verdicts, no
            provenance jargon.
            --------------------------------------------------------------- */}
        <div className="space-y-3">
          {narrative && (
            <p className="text-sm text-[#E8E4D9] leading-relaxed text-pretty">{narrative}</p>
          )}

          {topChips.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {topChips.map((chip, idx) => (
                <div
                  key={idx}
                  className={cn('text-xs px-2 py-1 rounded-md border', toneClasses(chip.tone))}
                >
                  <span className="text-[#6A6A6A] mr-1">{chip.label}:</span>
                  <span className="font-medium">{chip.value}</span>
                </div>
              ))}
            </div>
          )}

          {underexpressedSkills.length > 0 && (
            <div className="text-xs text-amber-400/90 flex items-start gap-1.5">
              <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span>
                {underexpressedSkills.length === 1
                  ? `${humanize(underexpressedSkills[0])} has limited direct work this cycle.`
                  : `${underexpressedSkills.length} skills have limited direct work this cycle.`}
              </span>
            </div>
          )}
        </div>

        {/* ---------------------------------------------------------------
            EXPANDED SURFACE — secondary detail. Two focused sections only:
            skill roles this cycle, and training preferences actually
            applied. Deliberately no "explanation quality" footer, no
            "hidden factors" counter, no doctrine/materialization audit
            chips, no DB-truth provenance row.
            --------------------------------------------------------------- */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-[#3A3A3A] space-y-5">
            {/* Skill roles this cycle */}
            {priorityOrder.length > 0 && (
              <section className="space-y-2">
                <h4 className="text-xs font-medium text-[#8A8A8A] uppercase tracking-wide">
                  Skill Roles This Cycle
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {priorityOrder.map((entry) => {
                    const roleColor =
                      entry.role === 'primary'
                        ? 'bg-green-500/10 text-green-400 border-green-500/20'
                        : entry.role === 'secondary'
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          : entry.role === 'tertiary'
                            ? 'bg-[#1E1E1E] text-[#A4ACB8] border-[#3A3A3A]'
                            : entry.role === 'support'
                              ? 'bg-[#1E1E1E] text-[#A4ACB8] border-[#3A3A3A]'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    const roleTag =
                      entry.role === 'primary'
                        ? 'primary'
                        : entry.role === 'secondary'
                          ? 'secondary'
                          : entry.role === 'tertiary'
                            ? 'tertiary'
                            : entry.role === 'support'
                              ? 'support'
                              : 'deferred'
                    return (
                      <span
                        key={entry.skill}
                        className={cn('text-xs px-2 py-0.5 rounded border', roleColor)}
                        title={`${entry.exposureSessions} session(s) this cycle`}
                      >
                        {humanize(entry.skill)}
                        <span className="text-[#6A6A6A] ml-1">· {roleTag}</span>
                      </span>
                    )
                  })}
                </div>

                {deferredEntries.length > 0 && (
                  <div className="text-xs text-[#8A8A8A] pt-1 space-y-0.5">
                    <p className="font-medium text-[#9A9A9A]">Deferred this cycle</p>
                    {deferredEntries.map(({ skill, reasonLabel }) => (
                      <p key={skill} className="pl-2 text-[#6A6A6A]">
                        <span className="text-[#A4ACB8]">{humanize(skill)}</span>
                        {reasonLabel ? <span> — {reasonLabel}</span> : null}
                      </p>
                    ))}
                  </div>
                )}

                {authContract && authContract.sourceTruthCount <= 2 && (
                  <p className="text-xs text-[#6A6A6A] italic pt-1">
                    You have {authContract.sourceTruthCount} skill{authContract.sourceTruthCount === 1 ? '' : 's'} selected in
                    your profile. Add more in Settings to train a broader set.
                  </p>
                )}
              </section>
            )}

            {/* Current working levels — only when we have concrete rows */}
            {workingProgressionRows.length > 0 && (
              <section className="space-y-2">
                <h4 className="text-xs font-medium text-[#8A8A8A] uppercase tracking-wide">
                  Current Working Levels
                </h4>
                <div className="text-xs bg-[#1E1E1E] rounded p-2.5 space-y-1.5">
                  {workingProgressionRows.map((row) => (
                    <div key={row.skill} className="flex items-center flex-wrap gap-x-2 gap-y-0.5">
                      <span className="text-[#8A8A8A] min-w-[90px]">{row.skill}:</span>
                      <span className="text-[#E8E4D9]">{row.current}</span>
                      {row.conservative && (
                        <span className="text-amber-400/80 text-[11px]">(conservative start)</span>
                      )}
                      {row.ceiling && (
                        <span className="text-[#5A5A5A] text-[11px]">ceiling: {row.ceiling}</span>
                      )}
                    </div>
                  ))}
                  {progressionTruthNote && (
                    <p className="text-[11px] text-[#6A6A6A] italic pt-1">{progressionTruthNote}</p>
                  )}
                </div>
              </section>
            )}

            {/* Training preferences applied — one tight section, no audit chips */}
            {(appliedMethods.length > 0 ||
              flexibilityLabels.length > 0 ||
              weightedLoadingUsed ||
              (methodPreferencesMateriality &&
                methodPreferencesMateriality.verdict !== 'NO_PREFERENCES' &&
                methodPreferencesMateriality.explanationForUser)) && (
              <section className="space-y-2">
                <h4 className="text-xs font-medium text-[#8A8A8A] uppercase tracking-wide">
                  Training Preferences Applied
                </h4>
                <div className="text-xs bg-[#1E1E1E] rounded p-2.5 space-y-2">
                  {methodPreferencesMateriality?.explanationForUser && (
                    <p className="text-[#E8E4D9] leading-relaxed">
                      {methodPreferencesMateriality.explanationForUser}
                    </p>
                  )}
                  {(appliedMethods.length > 0 ||
                    weightedLoadingUsed ||
                    flexibilityLabels.length > 0) && (
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {appliedMethods.map((m) => (
                        <Badge
                          key={m}
                          variant="outline"
                          className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[11px] font-normal"
                        >
                          {m}
                        </Badge>
                      ))}
                      {weightedLoadingUsed && (
                        <Badge
                          variant="outline"
                          className="bg-green-500/10 text-green-400 border-green-500/20 text-[11px] font-normal"
                        >
                          Weighted loading integrated
                        </Badge>
                      )}
                      {flexibilityLabels.length > 0 && (
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[11px] font-normal',
                            flexibilityIntegrated
                              ? 'bg-green-500/10 text-green-400 border-green-500/20'
                              : 'bg-[#2A2A2A] text-[#9A9A9A] border-[#3A3A3A]',
                          )}
                        >
                          Flexibility: {flexibilityLabels.join(', ')}
                          {(flexibilityGoalsUsed?.length ?? 0) > flexibilityLabels.length
                            ? ` +${(flexibilityGoalsUsed?.length ?? 0) - flexibilityLabels.length}`
                            : ''}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Equipment — very soft, one flat row, low visual weight */}
            {equipmentLabels.length > 0 && (
              <section className="space-y-2">
                <h4 className="text-xs font-medium text-[#8A8A8A] uppercase tracking-wide">
                  Equipment Used
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {equipmentLabels.map((eq) => (
                    <span
                      key={eq}
                      className="text-xs bg-[#1E1E1E] text-[#9A9A9A] px-2 py-0.5 rounded"
                    >
                      {eq}
                    </span>
                  ))}
                  {(equipmentUsed?.length ?? 0) > equipmentLabels.length && (
                    <span className="text-xs text-[#6A6A6A] self-center">
                      +{(equipmentUsed?.length ?? 0) - equipmentLabels.length} more
                    </span>
                  )}
                </div>
              </section>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
