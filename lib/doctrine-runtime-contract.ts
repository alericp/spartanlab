/**
 * DOCTRINE RUNTIME CONTRACT
 * 
 * PURPOSE:
 * Single authoritative contract that combines Doctrine DB + resolved athlete truth
 * into a generation-safe structure. Built ONCE per generation, then passed through
 * the entire generation pipeline to materially influence:
 * - Progression resolution
 * - Weekly/session structure bias
 * - Method selection bias
 * - Support-skill inclusion
 * - Exercise selection
 * - Prescription style
 * - Truth explanation UI
 * 
 * This contract is the upstream authority - it is NOT decorative.
 * Session assembly, exercise selection, and method packaging MUST consume it.
 * 
 * SAFETY:
 * - Graceful fallback when DB unavailable
 * - Does NOT bypass current-working-progression safety
 * - Does NOT override conservative progression gates
 * - Additive influence only
 */

import {
  getDoctrineSources,
  getDoctrinePrinciples,
  getProgressionRules,
  getMethodRules,
  getPrescriptionRules,
  getCarryoverRules,
  getExerciseSelectionRules,
  getDoctrineCoverageSummary,
  type DoctrineSource,
  type DoctrinePrinciple,
  type ProgressionRule,
  type MethodRule,
  type PrescriptionRule,
  type CarryoverRule,
  type ExerciseSelectionRule,
  type DoctrineCoverageSummary,
} from './doctrine-db'

// [DOCTRINE-UPLOADED-PDF-FALLBACK] In-code fallback atoms used only when the
// DB returns zero atoms (DB unavailable, tables empty, or live read failed).
// When the DB has live atoms, this import is loaded but unused.
//
// Reads from the unified uploaded-PDF batch aggregator so that any future
// uploaded batch (Batch 03+) is picked up automatically without touching this
// file.
import {
  getUploadedDoctrineBatchSources,
  getUploadedDoctrineBatchPrinciples,
  getUploadedDoctrineBatchProgressionRules,
  getUploadedDoctrineBatchMethodRules,
  getUploadedDoctrineBatchPrescriptionRules,
  getUploadedDoctrineBatchCarryoverRules,
  getUploadedDoctrineBatchExerciseSelectionRules,
  getUploadedDoctrineBatchCounts,
  getUploadedDoctrineBatchCountsByBatch,
  getUploadedDoctrineBatchCountsBySource,
} from './doctrine/source-batches'

// =============================================================================
// TYPES
// =============================================================================

export interface SkillProgressionDoctrine {
  preferredEntryProgressions: string[]
  blockedProgressions: string[]
  conservativeBias: boolean
  assistedRecommended: boolean
  prerequisitesRequired: Record<string, string>
  rationale: string[]
}

export interface DoctrineRuntimeContract {
  available: boolean
  source:
    | 'db_live'
    | 'hybrid_db_plus_uploaded_fallback'
    | 'fallback_uploaded_pdf_batches'
    | 'fallback_batch_01'
    | 'fallback_none'
  builtAt: string
  contractVersion: string

  /**
   * Deterministic [0..1] score reflecting how much of the doctrine surface is
   * actually active for this build. Builders may gate doctrine-guided generation
   * on a coherence threshold (e.g. > 0.5).
   *
   * 0    — no doctrine available
   * 0.25 — available but only one weak area active
   * 0.5  — multiple doctrine areas active, no skill/prescription/method influence
   * 0.75 — skill or prescription influence exists
   * 0.9+ — skill + prescription + method/exercise influence all exist
   */
  globalCoherence: number

  /**
   * Distinct doctrine source families represented in the active doctrine set.
   * e.g. ["progression", "method", "rings_hypertrophy", "weighted_calisthenics"].
   */
  sourceFamiliesUsed: string[]

  /**
   * Source keys (e.g. "front_lever_uploaded_pdf_batch_01") that contributed at
   * least one atom to the active contract.
   */
  activeSourceKeys: string[]

  /**
   * Multi-batch coverage. ALWAYS populated for every source mode (db_live,
   * hybrid, fallback). Reflects the final merged atom set the contract is
   * actually using, so the Program UI can show real batch counts in every
   * mode (previously hardcoded to 0 in db_live, which silently hid Batch 2/3
   * coverage when DB had only representative anchor atoms).
   */
  batchCoverage: {
    batchCount: number
    batchKeys: string[]
    batchAtomCounts: Record<string, number>
    bySource: Record<string, number>
  }

  /**
   * DB / uploaded-PDF-fallback completeness analysis. Honest report of which
   * uploaded-doctrine batches were filled from DB vs filled from in-code
   * fallback. Prevents the "partial DB silently suppresses richer fallback"
   * failure mode by making the decision visible to the runtime contract and
   * to the Program UI proof strip.
   *
   * state:
   *   - 'empty'    — DB had zero atoms; entire contract came from fallback
   *   - 'partial'  — DB had atoms for some batches, fallback filled others
   *   - 'complete' — every registered batch was satisfied from DB
   */
  dbCompleteness: {
    state: 'empty' | 'partial' | 'complete'
    totalDbAtoms: number
    totalFallbackBatchAtoms: number
    perBatch: Record<
      string,
      { dbTotal: number; fallbackTotal: number; filled: 'db' | 'fallback' }
    >
    filledFromFallback: string[]
  }

  doctrineCoverage: {
    principlesCount: number
    progressionRuleCount: number
    exerciseSelectionRuleCount: number
    methodRuleCount: number
    prescriptionRuleCount: number
    carryoverRuleCount: number
    sourcesCount: number
    hasLiveRules: boolean
  }

  progressionDoctrine: {
    perSkill: Record<string, SkillProgressionDoctrine>
    globalConservativeBias: boolean
    globalAssistedBias: boolean
  }

  methodDoctrine: {
    preferredMethods: string[]
    limitedMethods: string[]
    blockedMethods: string[]
    methodReasons: Record<string, string[]>
    densityAllowed: boolean
    supersetsAllowed: boolean
    circuitsAllowed: boolean
    straightSetsPreferred: boolean
  }

  prescriptionDoctrine: {
    intensityBias: 'conservative' | 'moderate' | 'aggressive' | null
    volumeBias: 'low' | 'moderate' | 'high' | null
    densityBias: 'avoid' | 'limited' | 'allowed' | 'preferred' | null
    holdBias: 'skill_quality_first' | 'volume_first' | null
    restBias: {
      skill: { min: number | null; max: number | null }
      strengthSupport: { min: number | null; max: number | null }
      accessory: { min: number | null; max: number | null }
    }
    rationale: string[]
  }

  skillDoctrine: {
    representedSkills: string[]
    supportSkills: string[]
    deferredSkills: string[]
    carryoverMap: Record<string, string[]>
    skillReasons: Record<string, string[]>
  }

  exerciseDoctrine: {
    enabled: boolean
    selectionRuleCount: number
    carryoverRuleCount: number
    summary: string[]
  }

  explanationDoctrine: {
    headlineReasons: string[]
    hiddenFactors: string[]
    userVisibleSummary: string[]
    doctrineInfluenceLevel: 'none' | 'minimal' | 'moderate' | 'strong'
  }
}

export interface DoctrineRuntimeBuildContext {
  primaryGoal: string
  secondaryGoal: string | null
  selectedSkills: string[]
  experienceLevel: string
  jointCautions: string[]
  equipmentAvailable: string[]
  currentWorkingProgressions: Record<string, { currentWorkingProgression: string | null; historicalCeiling: string | null }>
  trainingMethodPreferences: string[]
  sessionStyle: string | null
}

// =============================================================================
// BUILD CONTRACT FROM DB + ATHLETE TRUTH
// =============================================================================

/**
 * Build the authoritative Doctrine Runtime Contract.
 * This function queries doctrine DB ONCE, normalizes the data, and returns
 * a plain object contract that can be passed through the generation pipeline.
 */
export async function buildDoctrineRuntimeContract(
  context: DoctrineRuntimeBuildContext
): Promise<DoctrineRuntimeContract> {
  const startTime = Date.now()
  
  try {
    // Query all doctrine data once up front
    const [
      coverage,
      dbSources,
      dbPrinciples,
      dbProgressionRules,
      dbMethodRules,
      dbPrescriptionRules,
      dbCarryoverRules,
      dbExerciseSelectionRules,
    ] = await Promise.all([
      getDoctrineCoverageSummary(),
      getDoctrineSources(),
      getDoctrinePrinciples({}),
      getProgressionRules({}),
      getMethodRules({}),
      getPrescriptionRules({}),
      getCarryoverRules({}),
      getExerciseSelectionRules({}),
    ])
    
    // [DOCTRINE-DB-FALLBACK-COMPLETENESS-GATE]
    // Replaces the previous global `coverage.totalRulesCount > 0` gate, which
    // silently fell into db_live whenever ANY atoms existed in DB — even if
    // DB only had representative anchor atoms for Batch 2 / Batch 3 (or later
    // batches) while the in-code fallback held the richer 80–100+ atom set.
    // That suppression made later batches look identical in the Program UI
    // even after they were ingested.
    //
    // Per-batch completeness compares DB atom count vs in-code fallback atom
    // count for every registered uploaded-PDF batch (`batch_01`, `batch_02`,
    // `batch_03`, plus any future Batch 04+ added to the aggregator). For
    // each batch the larger set wins:
    //   • DB atoms ≥ fallback atoms  → keep DB rows for that batch
    //   • DB atoms <  fallback atoms → replace with fallback rows for batch
    // Legacy non-batch DB doctrine (no `src_batch_NN_` prefix) is always
    // preserved.
    //
    // Source mode is then derived from the merge result, never from a global
    // count threshold:
    //   • totalDb = 0 + fallback empty   → 'fallback_none'
    //   • totalDb = 0 + fallback present → 'fallback_uploaded_pdf_batches'
    //   • all batches filled from DB     → 'db_live'
    //   • some batches filled from FB    → 'hybrid_db_plus_uploaded_fallback'

    const fallbackCountsByBatch = getUploadedDoctrineBatchCountsByBatch() as
      Record<string, { principles: number; progression: number; method: number; prescription: number; selection: number; carryover: number }>
    const REGISTERED_BATCH_KEYS = Object.keys(fallbackCountsByBatch)

    const batchKeyFromSourceId = (sid: string | null | undefined): string | null => {
      if (!sid) return null
      const m = sid.match(/^src_batch_(\d{2})_/)
      return m ? `batch_${m[1]}` : null
    }
    const countAtomsByBatch = <T extends { source_id?: string | null }>(rows: T[], batchKey: string): number =>
      rows.filter(r => batchKeyFromSourceId(r.source_id) === batchKey).length

    type PerBatchStat = { dbTotal: number; fallbackTotal: number; filled: 'db' | 'fallback' }
    const perBatch: Record<string, PerBatchStat> = {}
    for (const bk of REGISTERED_BATCH_KEYS) {
      const fb = fallbackCountsByBatch[bk]
      const fbTotal = fb.principles + fb.progression + fb.method + fb.prescription + fb.selection + fb.carryover
      const dbTotal =
        countAtomsByBatch(dbPrinciples, bk) +
        countAtomsByBatch(dbProgressionRules, bk) +
        countAtomsByBatch(dbMethodRules, bk) +
        countAtomsByBatch(dbPrescriptionRules, bk) +
        countAtomsByBatch(dbExerciseSelectionRules, bk) +
        countAtomsByBatch(dbCarryoverRules, bk)
      perBatch[bk] = { dbTotal, fallbackTotal: fbTotal, filled: dbTotal >= fbTotal ? 'db' : 'fallback' }
    }
    const filledFromFallback = REGISTERED_BATCH_KEYS.filter(bk => perBatch[bk].filled === 'fallback')
    const totalDbAtoms = coverage.totalRulesCount
    const totalFallbackBatchAtoms = REGISTERED_BATCH_KEYS.reduce((s, bk) => s + perBatch[bk].fallbackTotal, 0)

    // Per-category merge: keep DB legacy rows + per-batch DB or fallback rows
    const fbPrinciplesAll = getUploadedDoctrineBatchPrinciples()
    const fbProgressionAll = getUploadedDoctrineBatchProgressionRules()
    const fbMethodAll = getUploadedDoctrineBatchMethodRules()
    const fbPrescriptionAll = getUploadedDoctrineBatchPrescriptionRules()
    const fbCarryoverAll = getUploadedDoctrineBatchCarryoverRules()
    const fbSelectionAll = getUploadedDoctrineBatchExerciseSelectionRules()

    const mergeForCategory = <T extends { source_id?: string | null }>(dbRows: T[], fbRows: T[]): T[] => {
      const out: T[] = []
      for (const r of dbRows) if (batchKeyFromSourceId(r.source_id) === null) out.push(r) // legacy non-batch
      for (const bk of REGISTERED_BATCH_KEYS) {
        if (perBatch[bk].filled === 'db') {
          for (const r of dbRows) if (batchKeyFromSourceId(r.source_id) === bk) out.push(r)
        } else {
          for (const r of fbRows) if (batchKeyFromSourceId(r.source_id) === bk) out.push(r)
        }
      }
      return out
    }

    let principles = mergeForCategory(dbPrinciples, fbPrinciplesAll)
    let progressionRules = mergeForCategory(dbProgressionRules, fbProgressionAll)
    let methodRules = mergeForCategory(dbMethodRules, fbMethodAll)
    let prescriptionRules = mergeForCategory(dbPrescriptionRules, fbPrescriptionAll)
    let carryoverRules = mergeForCategory(dbCarryoverRules, fbCarryoverAll)
    let exerciseSelectionRules = mergeForCategory(dbExerciseSelectionRules, fbSelectionAll)

    // Sources: keep all DB sources, then add fallback sources whose source_key
    // is not already present (deduped).
    let sources = (() => {
      const seen = new Set<string>()
      const out: typeof dbSources = []
      for (const s of dbSources) {
        const k = (s as { source_key?: string | null; id?: string | null }).source_key ?? (s as { id?: string }).id ?? ''
        if (k && !seen.has(k)) { seen.add(k); out.push(s) }
      }
      if (filledFromFallback.length > 0) {
        for (const s of getUploadedDoctrineBatchSources()) {
          const k = (s as { source_key?: string | null; id?: string | null }).source_key ?? (s as { id?: string }).id ?? ''
          if (k && !seen.has(k)) { seen.add(k); out.push(s) }
        }
      }
      return out
    })()

    // Decide source mode from the merge result, not a global threshold.
    let dbCompletenessState: 'empty' | 'partial' | 'complete'
    let contractSource: DoctrineRuntimeContract['source']
    if (totalDbAtoms === 0 && totalFallbackBatchAtoms === 0) {
      dbCompletenessState = 'empty'
      contractSource = 'fallback_none'
    } else if (totalDbAtoms === 0) {
      dbCompletenessState = 'empty'
      contractSource = 'fallback_uploaded_pdf_batches'
      // Replace anything that fell through with full fallback (safety).
      sources = getUploadedDoctrineBatchSources()
      principles = fbPrinciplesAll
      progressionRules = fbProgressionAll
      methodRules = fbMethodAll
      prescriptionRules = fbPrescriptionAll
      carryoverRules = fbCarryoverAll
      exerciseSelectionRules = fbSelectionAll
    } else if (filledFromFallback.length === 0) {
      dbCompletenessState = 'complete'
      contractSource = 'db_live'
    } else {
      dbCompletenessState = 'partial'
      contractSource = 'hybrid_db_plus_uploaded_fallback'
    }

    console.log('[DOCTRINE-RUNTIME-CONTRACT-COMPLETENESS]', {
      contractSource,
      dbCompletenessState,
      totalDbAtoms,
      totalFallbackBatchAtoms,
      filledFromFallback,
      perBatch,
      verdict:
        contractSource === 'hybrid_db_plus_uploaded_fallback'
          ? 'PARTIAL_DB_COMPLETED_BY_UPLOADED_FALLBACK'
          : contractSource === 'db_live'
          ? 'DB_COMPLETE_NO_FALLBACK_NEEDED'
          : contractSource === 'fallback_uploaded_pdf_batches'
          ? 'DB_EMPTY_USING_UPLOADED_FALLBACK'
          : 'NO_DOCTRINE_AVAILABLE',
    })

    const hasLiveRules = principles.length + progressionRules.length + methodRules.length +
      prescriptionRules.length + carryoverRules.length + exerciseSelectionRules.length > 0
    
    // Build progression doctrine per skill
    const progressionDoctrine = buildProgressionDoctrine(
      progressionRules,
      context.selectedSkills,
      context.currentWorkingProgressions,
      context.jointCautions,
      context.experienceLevel
    )
    
    // Build method doctrine
    const methodDoctrine = buildMethodDoctrine(
      methodRules,
      context.trainingMethodPreferences,
      context.experienceLevel,
      context.primaryGoal
    )
    
    // Build prescription doctrine
    const prescriptionDoctrine = buildPrescriptionDoctrine(
      prescriptionRules,
      context.experienceLevel,
      context.primaryGoal
    )
    
    // Build skill doctrine with carryover
    const skillDoctrine = buildSkillDoctrine(
      carryoverRules,
      context.selectedSkills,
      context.primaryGoal,
      context.secondaryGoal
    )
    
    // Build exercise doctrine summary
    const exerciseDoctrine = buildExerciseDoctrine(
      exerciseSelectionRules,
      carryoverRules
    )
    
    // Build explanation doctrine
    const explanationDoctrine = buildExplanationDoctrine(
      principles,
      progressionDoctrine,
      methodDoctrine,
      prescriptionDoctrine,
      hasLiveRules
    )
    
    // Compute deterministic doctrine coverage / family / batch metadata.
    const sourceFamiliesUsed = computeSourceFamiliesUsed(sources)
    const activeSourceKeys = computeActiveSourceKeys(sources)
    // Always populate batchCoverage from the FINAL merged atom set so
    // db_live, hybrid, and fallback all expose honest batch evidence to the
    // Program UI. Counts are derived from `perBatch` (which reflects the
    // merge winner per batch), not from the raw aggregator alone.
    const batchAtomCounts: Record<string, number> = {}
    for (const bk of REGISTERED_BATCH_KEYS) {
      batchAtomCounts[bk] = perBatch[bk].filled === 'db' ? perBatch[bk].dbTotal : perBatch[bk].fallbackTotal
    }
    const batchCoverage = {
      batchCount: REGISTERED_BATCH_KEYS.length,
      batchKeys: [...REGISTERED_BATCH_KEYS],
      batchAtomCounts,
      bySource: getUploadedDoctrineBatchCountsBySource(),
    }
    const dbCompleteness = {
      state: dbCompletenessState,
      totalDbAtoms,
      totalFallbackBatchAtoms,
      perBatch,
      filledFromFallback,
    }

    const globalCoherence = computeGlobalCoherence({
      hasLiveRules,
      principlesCount: principles.length,
      progressionRuleCount: progressionRules.length,
      exerciseSelectionRuleCount: exerciseSelectionRules.length,
      methodRuleCount: methodRules.length,
      prescriptionRuleCount: prescriptionRules.length,
      carryoverRuleCount: carryoverRules.length,
      progressionDoctrine,
      methodDoctrine,
      prescriptionDoctrine,
      skillDoctrine,
      exerciseDoctrine,
    })

    const contract: DoctrineRuntimeContract = {
      available: true,
      source: contractSource,
      builtAt: new Date().toISOString(),
      contractVersion: '1.1.0',

      globalCoherence,
      sourceFamiliesUsed,
      activeSourceKeys,
      batchCoverage,
      dbCompleteness,

      doctrineCoverage: {
        principlesCount: principles.length,
        progressionRuleCount: progressionRules.length,
        exerciseSelectionRuleCount: exerciseSelectionRules.length,
        methodRuleCount: methodRules.length,
        prescriptionRuleCount: prescriptionRules.length,
        carryoverRuleCount: carryoverRules.length,
        sourcesCount: sources.length,
        hasLiveRules,
      },
      
      progressionDoctrine,
      methodDoctrine,
      prescriptionDoctrine,
      skillDoctrine,
      exerciseDoctrine,
      explanationDoctrine,
    }
    
    console.log('[DOCTRINE-RUNTIME-CONTRACT-BUILT]', {
      available: true,
      source: contractSource,
      buildTimeMs: Date.now() - startTime,
      coverage: contract.doctrineCoverage,
      batchCoverage: contract.batchCoverage,
      sourceFamiliesUsed: contract.sourceFamiliesUsed,
      activeSourceKeyCount: contract.activeSourceKeys.length,
      globalCoherence: contract.globalCoherence,
      progressionSkillCount: Object.keys(progressionDoctrine.perSkill).length,
      methodPreferredCount: methodDoctrine.preferredMethods.length,
      methodBlockedCount: methodDoctrine.blockedMethods.length,
      prescriptionIntensityBias: prescriptionDoctrine.intensityBias,
      skillCarryoverCount: Object.keys(skillDoctrine.carryoverMap).length,
      explanationLevel: explanationDoctrine.doctrineInfluenceLevel,
      verdict: 'DOCTRINE_RUNTIME_CONTRACT_BUILT',
    })
    
    return contract
    
  } catch (error) {
    console.log('[DOCTRINE-RUNTIME-CONTRACT-FALLBACK]', {
      error: error instanceof Error ? error.message : 'Unknown error',
      verdict: 'DOCTRINE_RUNTIME_CONTRACT_FALLBACK',
    })
    
    return buildFallbackContract()
  }
}

// =============================================================================
// PROGRESSION DOCTRINE BUILDER
// =============================================================================

function buildProgressionDoctrine(
  rules: ProgressionRule[],
  selectedSkills: string[],
  currentProgressions: Record<string, { currentWorkingProgression: string | null; historicalCeiling: string | null }>,
  jointCautions: string[],
  experienceLevel: string
): DoctrineRuntimeContract['progressionDoctrine'] {
  const perSkill: Record<string, SkillProgressionDoctrine> = {}
  let globalConservativeBias = false
  let globalAssistedBias = false
  
  // Check for global conservative bias based on experience or joint cautions
  if (experienceLevel === 'beginner' || experienceLevel === 'novice') {
    globalConservativeBias = true
  }
  if (jointCautions.length > 0) {
    globalConservativeBias = true
  }
  
  // [EXERCISE-SELECTION-HARDENING] Safe string operations
  for (const skill of selectedSkills) {
    const skillLowerSafe = (skill ?? '').toLowerCase()
    const skillRules = rules.filter(r => 
      (r.skillKey ?? '').toLowerCase() === skillLowerSafe
    )
    
    const currentProgression = currentProgressions[skill]?.currentWorkingProgression
    const preferredEntryProgressions: string[] = []
    const blockedProgressions: string[] = []
    const prerequisitesRequired: Record<string, string> = {}
    const rationale: string[] = []
    let conservativeBias = globalConservativeBias
    let assistedRecommended = false
    
    for (const rule of skillRules) {
      // Check if current level matches any rule's current level
      if (currentProgression && rule.currentLevelKey.toLowerCase() === currentProgression.toLowerCase()) {
        preferredEntryProgressions.push(rule.nextLevelKey)
        
        if (rule.progressionRuleSummary) {
          rationale.push(rule.progressionRuleSummary)
        }
        
        // Check prerequisites
        if (rule.requiredPrerequisitesJson) {
          Object.assign(prerequisitesRequired, rule.requiredPrerequisitesJson)
        }
        
        // Check caution flags
        if (rule.cautionFlagsJson) {
          for (const flag of rule.cautionFlagsJson) {
            if (flag.toLowerCase().includes('conservative')) {
              conservativeBias = true
            }
            if (flag.toLowerCase().includes('assisted') || flag.toLowerCase().includes('band')) {
              assistedRecommended = true
              globalAssistedBias = true
            }
          }
        }
      }
      
      // Check for blocked progressions based on confidence
      if (rule.confidenceWeight < 0.3) {
        blockedProgressions.push(rule.nextLevelKey)
      }
    }
    
    // Apply joint caution influence
    // [EXERCISE-SELECTION-HARDENING] Safe string operations
    for (const caution of jointCautions) {
      const cautionLower = (caution ?? '').toLowerCase()
      const skillLower = (skill ?? '').toLowerCase()
      
      if (cautionLower.includes('shoulder') && 
          (skillLower.includes('planche') || skillLower.includes('hspu') || skillLower.includes('handstand'))) {
        conservativeBias = true
        assistedRecommended = true
        rationale.push('Conservative approach due to shoulder considerations')
      }
      if (cautionLower.includes('elbow') && 
          (skillLower.includes('planche') || skillLower.includes('lever'))) {
        conservativeBias = true
        rationale.push('Conservative approach due to elbow considerations')
      }
      if (cautionLower.includes('wrist') && skillLower.includes('handstand')) {
        conservativeBias = true
        rationale.push('Modified grip/positioning for wrist protection')
      }
    }
    
    perSkill[skill] = {
      preferredEntryProgressions,
      blockedProgressions,
      conservativeBias,
      assistedRecommended,
      prerequisitesRequired,
      rationale,
    }
  }
  
  return {
    perSkill,
    globalConservativeBias,
    globalAssistedBias,
  }
}

// =============================================================================
// METHOD DOCTRINE BUILDER
// =============================================================================

function buildMethodDoctrine(
  rules: MethodRule[],
  userPreferences: string[],
  experienceLevel: string,
  primaryGoal: string
): DoctrineRuntimeContract['methodDoctrine'] {
  const preferredMethods: string[] = []
  const limitedMethods: string[] = []
  const blockedMethods: string[] = []
  const methodReasons: Record<string, string[]> = {}
  
  // Default safety settings based on experience
  let densityAllowed = experienceLevel !== 'beginner'
  let supersetsAllowed = true
  let circuitsAllowed = experienceLevel !== 'beginner'
  let straightSetsPreferred = true
  
  // Process user preferences first
  for (const pref of userPreferences) {
    const prefLower = pref.toLowerCase()
    if (prefLower.includes('superset')) {
      preferredMethods.push('supersets')
      supersetsAllowed = true
      methodReasons['supersets'] = ['User preference: supersets enabled']
    }
    if (prefLower.includes('circuit')) {
      preferredMethods.push('circuits')
      circuitsAllowed = true
      methodReasons['circuits'] = ['User preference: circuits enabled']
    }
    if (prefLower.includes('density') || prefLower.includes('emom') || prefLower.includes('amrap')) {
      preferredMethods.push('density')
      densityAllowed = true
      methodReasons['density'] = ['User preference: density work enabled']
    }
    if (prefLower.includes('straight') || prefLower.includes('traditional')) {
      straightSetsPreferred = true
      methodReasons['straight_sets'] = ['User preference: traditional sets preferred']
    }
  }
  
  // Apply doctrine rules
  for (const rule of rules) {
    const isCompatibleGoal = !rule.compatibleGoalsJson || 
      rule.compatibleGoalsJson.some(g => primaryGoal.toLowerCase().includes(g.toLowerCase()))
    const isCompatibleLevel = !rule.compatibleLevelsJson || 
      rule.compatibleLevelsJson.some(l => experienceLevel.toLowerCase().includes(l.toLowerCase()))
    
    if (isCompatibleGoal && isCompatibleLevel) {
      // Method is compatible
      if (!preferredMethods.includes(rule.methodKey)) {
        preferredMethods.push(rule.methodKey)
      }
      
      if (rule.bestUseCasesJson) {
        methodReasons[rule.methodKey] = [
          ...(methodReasons[rule.methodKey] || []),
          ...rule.bestUseCasesJson,
        ]
      }
    } else if (!isCompatibleLevel) {
      // Method blocked for this experience level
      if (!blockedMethods.includes(rule.methodKey)) {
        blockedMethods.push(rule.methodKey)
      }
      methodReasons[rule.methodKey] = [
        ...(methodReasons[rule.methodKey] || []),
        `Not recommended for ${experienceLevel} level`,
      ]
    } else {
      // Method limited for this goal
      if (!limitedMethods.includes(rule.methodKey)) {
        limitedMethods.push(rule.methodKey)
      }
      if (rule.avoidUseCasesJson) {
        methodReasons[rule.methodKey] = [
          ...(methodReasons[rule.methodKey] || []),
          ...rule.avoidUseCasesJson,
        ]
      }
    }
  }
  
  // Block density/circuits for skill-focused primary goals if not explicitly preferred
  if (primaryGoal.toLowerCase().includes('skill') || 
      primaryGoal.toLowerCase().includes('handstand') || 
      primaryGoal.toLowerCase().includes('planche') ||
      primaryGoal.toLowerCase().includes('lever')) {
    if (!userPreferences.some(p => p.toLowerCase().includes('density'))) {
      densityAllowed = false
      if (!limitedMethods.includes('density')) {
        limitedMethods.push('density')
      }
      methodReasons['density'] = [
        ...(methodReasons['density'] || []),
        'Density work limited for skill-focused training to preserve neural quality',
      ]
    }
    if (!userPreferences.some(p => p.toLowerCase().includes('circuit'))) {
      circuitsAllowed = false
      if (!limitedMethods.includes('circuits')) {
        limitedMethods.push('circuits')
      }
      methodReasons['circuits'] = [
        ...(methodReasons['circuits'] || []),
        'Circuit training limited for skill-focused work to maintain technique quality',
      ]
    }
  }
  
  return {
    preferredMethods,
    limitedMethods,
    blockedMethods,
    methodReasons,
    densityAllowed,
    supersetsAllowed,
    circuitsAllowed,
    straightSetsPreferred,
  }
}

// =============================================================================
// PRESCRIPTION DOCTRINE BUILDER
// =============================================================================

function buildPrescriptionDoctrine(
  rules: PrescriptionRule[],
  experienceLevel: string,
  primaryGoal: string
): DoctrineRuntimeContract['prescriptionDoctrine'] {
  let intensityBias: 'conservative' | 'moderate' | 'aggressive' | null = null
  let volumeBias: 'low' | 'moderate' | 'high' | null = null
  let densityBias: 'avoid' | 'limited' | 'allowed' | 'preferred' | null = null
  let holdBias: 'skill_quality_first' | 'volume_first' | null = 'skill_quality_first'
  const restBias = {
    skill: { min: null as number | null, max: null as number | null },
    strengthSupport: { min: null as number | null, max: null as number | null },
    accessory: { min: null as number | null, max: null as number | null },
  }
  const rationale: string[] = []
  
  // Apply experience-based defaults
  if (experienceLevel === 'beginner' || experienceLevel === 'novice') {
    intensityBias = 'conservative'
    volumeBias = 'moderate'
    densityBias = 'avoid'
    rationale.push('Conservative prescription for building movement quality')
  } else if (experienceLevel === 'intermediate') {
    intensityBias = 'moderate'
    volumeBias = 'moderate'
    densityBias = 'limited'
  } else {
    intensityBias = 'moderate'
    volumeBias = 'moderate'
    densityBias = 'allowed'
  }
  
  // Apply skill-focused goal adjustments
  if (primaryGoal.toLowerCase().includes('skill') || 
      primaryGoal.toLowerCase().includes('handstand') || 
      primaryGoal.toLowerCase().includes('planche') ||
      primaryGoal.toLowerCase().includes('lever')) {
    holdBias = 'skill_quality_first'
    restBias.skill = { min: 90, max: 180 }
    rationale.push('Longer rest periods for neural skill work')
  }
  
  // Apply doctrine rules
  for (const rule of rules) {
    const matchesLevel = !rule.levelScope || 
      rule.levelScope.some(l => experienceLevel.toLowerCase().includes(l.toLowerCase()))
    const matchesGoal = !rule.goalScope || 
      rule.goalScope.some(g => primaryGoal.toLowerCase().includes(g.toLowerCase()))
    
    if (!matchesLevel || !matchesGoal) continue
    
    // Apply rest ranges
    if (rule.restRangeJson) {
      const restJson = rule.restRangeJson as Record<string, { min?: number; max?: number }>
      if (restJson.skill) {
        restBias.skill = {
          min: restJson.skill.min ?? restBias.skill.min,
          max: restJson.skill.max ?? restBias.skill.max,
        }
      }
      if (restJson.strength || restJson.strengthSupport) {
        const s = restJson.strength || restJson.strengthSupport
        restBias.strengthSupport = {
          min: s?.min ?? restBias.strengthSupport.min,
          max: s?.max ?? restBias.strengthSupport.max,
        }
      }
      if (restJson.accessory) {
        restBias.accessory = {
          min: restJson.accessory.min ?? restBias.accessory.min,
          max: restJson.accessory.max ?? restBias.accessory.max,
        }
      }
    }
    
    // Apply hold ranges for skill work
    if (rule.holdRangeJson) {
      const holdJson = rule.holdRangeJson as { bias?: string }
      if (holdJson.bias === 'quality') {
        holdBias = 'skill_quality_first'
        rationale.push('Hold duration optimized for technique quality')
      }
    }
    
    // Apply progression guidance
    if (rule.progressionGuidance) {
      rationale.push(rule.progressionGuidance)
    }
  }
  
  return {
    intensityBias,
    volumeBias,
    densityBias,
    holdBias,
    restBias,
    rationale,
  }
}

// =============================================================================
// SKILL DOCTRINE BUILDER
// =============================================================================

function buildSkillDoctrine(
  carryoverRules: CarryoverRule[],
  selectedSkills: string[],
  primaryGoal: string,
  secondaryGoal: string | null
): DoctrineRuntimeContract['skillDoctrine'] {
  const representedSkills: string[] = []
  const supportSkills: string[] = []
  const deferredSkills: string[] = []
  const carryoverMap: Record<string, string[]> = {}
  const skillReasons: Record<string, string[]> = {}
  
  // Primary goal skill is always represented
  const primarySkill = primaryGoal.replace(/_/g, ' ')
  representedSkills.push(primarySkill)
  skillReasons[primarySkill] = ['Primary training focus']
  
  // Secondary goal skill is represented if selected
  if (secondaryGoal) {
    const secondarySkill = secondaryGoal.replace(/_/g, ' ')
    representedSkills.push(secondarySkill)
    skillReasons[secondarySkill] = ['Secondary training focus']
  }
  
  // Build carryover map from doctrine rules
  for (const rule of carryoverRules) {
    const targetSkill = rule.targetSkillKey
    const sourceSkill = rule.sourceExerciseOrSkillKey
    
    if (!carryoverMap[targetSkill]) {
      carryoverMap[targetSkill] = []
    }
    
    if (!carryoverMap[targetSkill].includes(sourceSkill)) {
      carryoverMap[targetSkill].push(sourceSkill)
    }
    
    // Track carryover reasons
    if (rule.rationale) {
      if (!skillReasons[targetSkill]) {
        skillReasons[targetSkill] = []
      }
      skillReasons[targetSkill].push(`Carryover from ${sourceSkill}: ${rule.rationale}`)
    }
  }
  
  // Classify remaining selected skills
  for (const skill of selectedSkills) {
    if (representedSkills.includes(skill)) continue
    
    // Check if this skill has carryover benefit from primary/secondary
    // [EXERCISE-SELECTION-HARDENING] Safe string operations
    const hasCarryoverBenefit = carryoverRules.some(r => 
      (r.targetSkillKey ?? '').toLowerCase() === (skill ?? '').toLowerCase() &&
      (representedSkills.some(rep => (r.sourceExerciseOrSkillKey ?? '').toLowerCase().includes((rep ?? '').toLowerCase())))
    )
    
    if (hasCarryoverBenefit) {
      supportSkills.push(skill)
      skillReasons[skill] = [
        ...(skillReasons[skill] || []),
        'Receives carryover benefit from primary training',
      ]
    } else {
      // Check if we have capacity for support work
      if (supportSkills.length < 2) {
        supportSkills.push(skill)
        skillReasons[skill] = ['Included as support skill for balanced development']
      } else {
        deferredSkills.push(skill)
        skillReasons[skill] = ['Deferred to maintain training focus on primary goals']
      }
    }
  }
  
  return {
    representedSkills,
    supportSkills,
    deferredSkills,
    carryoverMap,
    skillReasons,
  }
}

// =============================================================================
// EXERCISE DOCTRINE BUILDER
// =============================================================================

function buildExerciseDoctrine(
  selectionRules: ExerciseSelectionRule[],
  carryoverRules: CarryoverRule[]
): DoctrineRuntimeContract['exerciseDoctrine'] {
  const summary: string[] = []
  
  if (selectionRules.length > 0) {
    summary.push(`${selectionRules.length} exercise selection rules active`)
  }
  if (carryoverRules.length > 0) {
    summary.push(`${carryoverRules.length} carryover relationships mapped`)
  }
  
  return {
    enabled: selectionRules.length > 0 || carryoverRules.length > 0,
    selectionRuleCount: selectionRules.length,
    carryoverRuleCount: carryoverRules.length,
    summary,
  }
}

// =============================================================================
// EXPLANATION DOCTRINE BUILDER
// =============================================================================

function buildExplanationDoctrine(
  principles: DoctrinePrinciple[],
  progressionDoctrine: DoctrineRuntimeContract['progressionDoctrine'],
  methodDoctrine: DoctrineRuntimeContract['methodDoctrine'],
  prescriptionDoctrine: DoctrineRuntimeContract['prescriptionDoctrine'],
  hasLiveRules: boolean
): DoctrineRuntimeContract['explanationDoctrine'] {
  const headlineReasons: string[] = []
  const hiddenFactors: string[] = []
  const userVisibleSummary: string[] = []
  
  // Determine influence level
  let doctrineInfluenceLevel: 'none' | 'minimal' | 'moderate' | 'strong' = 'none'
  
  if (!hasLiveRules) {
    doctrineInfluenceLevel = 'none'
    userVisibleSummary.push('Using standard training principles')
  } else {
    // Count how many doctrine areas are active
    let activeAreas = 0
    
    if (Object.keys(progressionDoctrine.perSkill).length > 0) {
      activeAreas++
      if (progressionDoctrine.globalConservativeBias) {
        headlineReasons.push('Conservative progression approach for safety')
        userVisibleSummary.push('Progression paced for long-term success')
      }
      if (progressionDoctrine.globalAssistedBias) {
        headlineReasons.push('Assisted variations recommended for current level')
      }
    }
    
    if (methodDoctrine.preferredMethods.length > 0) {
      activeAreas++
      if (methodDoctrine.straightSetsPreferred) {
        userVisibleSummary.push('Straight sets for skill quality')
      }
      if (!methodDoctrine.densityAllowed) {
        hiddenFactors.push('Density work limited for skill preservation')
      }
    }
    
    if (prescriptionDoctrine.intensityBias) {
      activeAreas++
      if (prescriptionDoctrine.intensityBias === 'conservative') {
        userVisibleSummary.push('Intensity calibrated for technique development')
      }
      if (prescriptionDoctrine.holdBias === 'skill_quality_first') {
        userVisibleSummary.push('Hold durations optimized for skill acquisition')
      }
    }
    
    // Add principle-based headlines
    for (const principle of principles.slice(0, 3)) {
      if (principle.safetyPriority >= 8) {
        headlineReasons.push(principle.principleTitle)
      }
    }
    
    // Determine overall influence level
    if (activeAreas >= 3) {
      doctrineInfluenceLevel = 'strong'
    } else if (activeAreas >= 2) {
      doctrineInfluenceLevel = 'moderate'
    } else if (activeAreas >= 1) {
      doctrineInfluenceLevel = 'minimal'
    }
  }
  
  return {
    headlineReasons,
    hiddenFactors,
    userVisibleSummary,
    doctrineInfluenceLevel,
  }
}

// =============================================================================
// FALLBACK CONTRACT
// =============================================================================

function buildFallbackContract(): DoctrineRuntimeContract {
  return {
    available: false,
    source: 'fallback_none',
    builtAt: new Date().toISOString(),
    contractVersion: '1.1.0',

    globalCoherence: 0,
    sourceFamiliesUsed: [],
    activeSourceKeys: [],
    batchCoverage: { batchCount: 0, batchKeys: [], batchAtomCounts: {}, bySource: {} },
    dbCompleteness: {
      state: 'empty',
      totalDbAtoms: 0,
      totalFallbackBatchAtoms: 0,
      perBatch: {},
      filledFromFallback: [],
    },

    doctrineCoverage: {
      principlesCount: 0,
      progressionRuleCount: 0,
      exerciseSelectionRuleCount: 0,
      methodRuleCount: 0,
      prescriptionRuleCount: 0,
      carryoverRuleCount: 0,
      sourcesCount: 0,
      hasLiveRules: false,
    },
    
    progressionDoctrine: {
      perSkill: {},
      globalConservativeBias: false,
      globalAssistedBias: false,
    },
    
    methodDoctrine: {
      preferredMethods: [],
      limitedMethods: [],
      blockedMethods: [],
      methodReasons: {},
      densityAllowed: true,
      supersetsAllowed: true,
      circuitsAllowed: true,
      straightSetsPreferred: true,
    },
    
    prescriptionDoctrine: {
      intensityBias: null,
      volumeBias: null,
      densityBias: null,
      holdBias: null,
      restBias: {
        skill: { min: null, max: null },
        strengthSupport: { min: null, max: null },
        accessory: { min: null, max: null },
      },
      rationale: [],
    },
    
    skillDoctrine: {
      representedSkills: [],
      supportSkills: [],
      deferredSkills: [],
      carryoverMap: {},
      skillReasons: {},
    },
    
    exerciseDoctrine: {
      enabled: false,
      selectionRuleCount: 0,
      carryoverRuleCount: 0,
      summary: [],
    },
    
    explanationDoctrine: {
      headlineReasons: [],
      hiddenFactors: [],
      userVisibleSummary: ['Using standard training principles'],
      doctrineInfluenceLevel: 'none',
    },
  }
}

// =============================================================================
// COVERAGE / FAMILY / COHERENCE HELPERS
// =============================================================================

/**
 * Distinct doctrine_family values from the active source set, e.g.
 *   ["progression_selection_logic", "rings_hypertrophy", "weighted_calisthenics"]
 *
 * Tolerant to either snake_case `doctrine_family` (DB rows) or camelCase
 * `doctrineFamily` (code fallback rows) — every source object surveyed wins.
 */
function computeSourceFamiliesUsed(sources: DoctrineSource[]): string[] {
  const seen = new Set<string>()
  for (const s of sources) {
    const anyS = s as unknown as Record<string, unknown>
    const fam =
      (typeof anyS.doctrineFamily === 'string' && anyS.doctrineFamily) ||
      (typeof anyS.doctrine_family === 'string' && (anyS.doctrine_family as string)) ||
      null
    if (fam) seen.add(fam)
  }
  return Array.from(seen).sort()
}

function computeActiveSourceKeys(sources: DoctrineSource[]): string[] {
  const out: string[] = []
  for (const s of sources) {
    const anyS = s as unknown as Record<string, unknown>
    const k =
      (typeof anyS.sourceKey === 'string' && anyS.sourceKey) ||
      (typeof anyS.source_key === 'string' && (anyS.source_key as string)) ||
      null
    if (k) out.push(k)
  }
  return out
}

/**
 * Deterministic [0..1] coherence score (see DoctrineRuntimeContract.globalCoherence).
 * Builders MAY gate doctrine-guided generation on a threshold (e.g. > 0.5).
 *
 * Active areas:
 *   - skill influence: any per-skill progression doctrine OR any carryover
 *   - prescription influence: any non-null bias OR rationale text
 *   - method influence: any preferred/limited/blocked method OR straightSetsPreferred=false
 *   - exercise influence: enabled with at least one selection rule
 */
function computeGlobalCoherence(args: {
  hasLiveRules: boolean
  principlesCount: number
  progressionRuleCount: number
  exerciseSelectionRuleCount: number
  methodRuleCount: number
  prescriptionRuleCount: number
  carryoverRuleCount: number
  progressionDoctrine: DoctrineRuntimeContract['progressionDoctrine']
  methodDoctrine: DoctrineRuntimeContract['methodDoctrine']
  prescriptionDoctrine: DoctrineRuntimeContract['prescriptionDoctrine']
  skillDoctrine: DoctrineRuntimeContract['skillDoctrine']
  exerciseDoctrine: DoctrineRuntimeContract['exerciseDoctrine']
}): number {
  if (!args.hasLiveRules) return 0

  const skillActive =
    Object.keys(args.progressionDoctrine.perSkill).length > 0 ||
    Object.keys(args.skillDoctrine.carryoverMap).length > 0

  const rxActive =
    args.prescriptionDoctrine.intensityBias != null ||
    args.prescriptionDoctrine.volumeBias != null ||
    args.prescriptionDoctrine.densityBias != null ||
    args.prescriptionDoctrine.holdBias != null ||
    args.prescriptionDoctrine.rationale.length > 0

  const methodActive =
    args.methodDoctrine.preferredMethods.length > 0 ||
    args.methodDoctrine.limitedMethods.length > 0 ||
    args.methodDoctrine.blockedMethods.length > 0 ||
    args.methodDoctrine.straightSetsPreferred === false

  const exerciseActive =
    args.exerciseDoctrine.enabled && args.exerciseDoctrine.selectionRuleCount > 0

  // Count distinct doctrine areas that have any countable rules at all.
  const countableAreas =
    (args.progressionRuleCount > 0 ? 1 : 0) +
    (args.methodRuleCount > 0 ? 1 : 0) +
    (args.prescriptionRuleCount > 0 ? 1 : 0) +
    (args.exerciseSelectionRuleCount > 0 ? 1 : 0) +
    (args.carryoverRuleCount > 0 ? 1 : 0) +
    (args.principlesCount > 0 ? 1 : 0)

  if (countableAreas === 0) return 0
  if (countableAreas === 1) return 0.25

  // Multiple areas exist. Promote based on actual influence.
  if (skillActive && rxActive && (methodActive || exerciseActive)) return 0.95
  if (skillActive || rxActive) return 0.75
  return 0.5
}
