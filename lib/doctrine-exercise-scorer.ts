/**
 * DOCTRINE EXERCISE SCORER
 * [PHASE 4] Bounded doctrine-informed exercise scoring layer
 * 
 * PURPOSE:
 * This service applies doctrine DB rules to modify exercise candidate scores
 * AFTER hard eligibility filters have already run. It cannot resurrect excluded
 * exercises or bypass safety/progression gates.
 * 
 * DESIGN:
 * - Additive layer, not a replacement
 * - Safe fallback when DB unavailable
 * - Bounded score modifiers only
 * - Full audit trail for verification
 * 
 * NON-GOALS:
 * - Does NOT control session count or schedule
 * - Does NOT replace method packaging
 * - Does NOT override prescription rules
 * - Does NOT bypass current progression truth
 */

import {
  getExerciseSelectionRules,
  getContraindicationRules,
  getCarryoverRules,
  type ExerciseSelectionRule,
  type ContraindicationRule,
  type CarryoverRule,
} from './doctrine-db'
import { 
  safeString, 
  safeExerciseId, 
  safeExerciseName,
  safeRuleKey,
  safeContains,
  safeArrayContains,
} from './utils/safe-string'

// =============================================================================
// TYPES
// =============================================================================

export interface DoctrineScoreContext {
  primaryGoal: string
  secondaryGoal?: string | null
  selectedSkills: string[]
  experienceLevel: string
  jointCautions: string[]
  equipment: string[]
  sessionFocus: string
  hasWeightedEquipment: boolean
}

export interface DoctrineScoreResult {
  exerciseId: string
  baseScore: number
  doctrineScoreDelta: number
  finalScore: number
  doctrineReasons: string[]
  doctrineMatchedRules: Array<{
    ruleId: string
    ruleType: 'selection' | 'contraindication' | 'carryover'
    scoreDelta: number
    reason: string
  }>
  doctrineConfidence: 'low' | 'medium' | 'high'
  doctrineApplied: boolean
}

export interface DoctrineScoringAudit {
  totalCandidates: number
  rulesQueried: {
    selectionRules: number
    contraindicationRules: number
    carryoverRules: number
  }
  rulesMatched: {
    selectionRules: number
    contraindicationRules: number
    carryoverRules: number
  }
  candidatesAffected: number
  topCandidateChanged: boolean
  top3Changed: boolean
  preDoctrineTop3: string[]
  postDoctrineTop3: string[]
  doctrineApplied: boolean
  fallbackReason: string | null
}

interface ExerciseCandidate {
  exercise: { id: string; name: string; transferTo?: string[]; category?: string }
  score: number
}

// =============================================================================
// SCORE MODIFIERS (BOUNDED)
// =============================================================================

const DOCTRINE_SCORE_MODIFIERS = {
  // Selection rule modifiers
  SELECTION_MATCH_BOOST: 15,        // Exercise matches selection rule for goal/skill
  SELECTION_PREFERRED_BOOST: 10,    // Exercise is in preferred_when context
  SELECTION_AVOID_PENALTY: -12,     // Exercise is in avoid_when context
  
  // Carryover rule modifiers
  CARRYOVER_DIRECT_BOOST: 18,       // Direct carryover to target skill
  CARRYOVER_INDIRECT_BOOST: 10,     // Indirect carryover
  CARRYOVER_PREREQUISITE_BOOST: 8,  // Prerequisite relationship
  CARRYOVER_ACCESSORY_BOOST: 5,     // Accessory relationship
  
  // Contraindication modifiers
  CONTRAINDICATION_CAUTION: -8,     // Caution level contraindication
  CONTRAINDICATION_WARNING: -15,    // Warning level contraindication
  // Note: 'blocked' severity should have been caught by hard filters
  
  // Weight scaling
  HIGH_WEIGHT_RULE_MULTIPLIER: 1.5,
  LOW_WEIGHT_RULE_MULTIPLIER: 0.7,
}

// =============================================================================
// MAIN SCORING FUNCTION
// =============================================================================

/**
 * Apply doctrine DB rules to score exercise candidates.
 * This is a bounded modifier layer that respects existing hard filters.
 * 
 * @param candidates - Already-filtered exercise candidates with base scores
 * @param context - Athlete and session context for doctrine matching
 * @returns Scored candidates with doctrine metadata and audit trail
 */
export async function scoreExercisesWithDoctrine(
  candidates: ExerciseCandidate[],
  context: DoctrineScoreContext
): Promise<{
  scoredCandidates: DoctrineScoreResult[]
  audit: DoctrineScoringAudit
}> {
  // Initialize audit
  const audit: DoctrineScoringAudit = {
    totalCandidates: candidates.length,
    rulesQueried: { selectionRules: 0, contraindicationRules: 0, carryoverRules: 0 },
    rulesMatched: { selectionRules: 0, contraindicationRules: 0, carryoverRules: 0 },
    candidatesAffected: 0,
    topCandidateChanged: false,
    top3Changed: false,
    preDoctrineTop3: [],
    postDoctrineTop3: [],
    doctrineApplied: false,
    fallbackReason: null,
  }
  
  // Capture pre-doctrine top 3 for comparison
  const sortedPre = [...candidates].sort((a, b) => b.score - a.score)
  audit.preDoctrineTop3 = sortedPre.slice(0, 3).map(c => c.exercise.id)
  
  // If no candidates, return early
  if (candidates.length === 0) {
    audit.fallbackReason = 'no_candidates'
    return { scoredCandidates: [], audit }
  }
  
  // Fetch doctrine rules (gracefully handle failures)
  let selectionRules: ExerciseSelectionRule[] = []
  let contraindicationRules: ContraindicationRule[] = []
  let carryoverRules: CarryoverRule[] = []
  
  try {
    // Fetch rules relevant to this context
    const [selRules, contraRules, carryRules] = await Promise.all([
      getExerciseSelectionRules({
        goalKey: context.primaryGoal,
      }),
      getContraindicationRules(),
      getCarryoverRules(context.primaryGoal),
    ])
    
    selectionRules = selRules
    contraindicationRules = contraRules
    carryoverRules = carryRules
    
    audit.rulesQueried = {
      selectionRules: selectionRules.length,
      contraindicationRules: contraindicationRules.length,
      carryoverRules: carryoverRules.length,
    }
    
    console.log('[PHASE4-DOCTRINE-SCORER] Rules fetched:', {
      selectionRules: selectionRules.length,
      contraindicationRules: contraindicationRules.length,
      carryoverRules: carryoverRules.length,
      primaryGoal: context.primaryGoal,
    })
  } catch (error) {
    console.log('[PHASE4-DOCTRINE-SCORER] Failed to fetch rules, using fallback:', error)
    audit.fallbackReason = 'db_fetch_failed'
    // Return candidates with no doctrine modification
    return {
      scoredCandidates: candidates.map(c => ({
        exerciseId: c.exercise.id,
        baseScore: c.score,
        doctrineScoreDelta: 0,
        finalScore: c.score,
        doctrineReasons: [],
        doctrineMatchedRules: [],
        doctrineConfidence: 'low' as const,
        doctrineApplied: false,
      })),
      audit,
    }
  }
  
  // If no rules found, return without modification
  const totalRules = selectionRules.length + contraindicationRules.length + carryoverRules.length
  if (totalRules === 0) {
    audit.fallbackReason = 'no_matching_rules'
    audit.postDoctrineTop3 = audit.preDoctrineTop3
    return {
      scoredCandidates: candidates.map(c => ({
        exerciseId: c.exercise.id,
        baseScore: c.score,
        doctrineScoreDelta: 0,
        finalScore: c.score,
        doctrineReasons: [],
        doctrineMatchedRules: [],
        doctrineConfidence: 'low' as const,
        doctrineApplied: false,
      })),
      audit,
    }
  }
  
  // Score each candidate with doctrine rules
  const scoredCandidates: DoctrineScoreResult[] = candidates.map(candidate => {
    const result = scoreCandidate(
      candidate,
      context,
      selectionRules,
      contraindicationRules,
      carryoverRules
    )
    
    // Track matches for audit
    if (result.doctrineMatchedRules.length > 0) {
      audit.candidatesAffected++
      result.doctrineMatchedRules.forEach(rule => {
        if (rule.ruleType === 'selection') audit.rulesMatched.selectionRules++
        if (rule.ruleType === 'contraindication') audit.rulesMatched.contraindicationRules++
        if (rule.ruleType === 'carryover') audit.rulesMatched.carryoverRules++
      })
    }
    
    return result
  })
  
  // Sort by final score and capture post-doctrine top 3
  const sortedPost = [...scoredCandidates].sort((a, b) => b.finalScore - a.finalScore)
  audit.postDoctrineTop3 = sortedPost.slice(0, 3).map(c => c.exerciseId)
  
  // Check if doctrine changed the results
  audit.topCandidateChanged = audit.preDoctrineTop3[0] !== audit.postDoctrineTop3[0]
  audit.top3Changed = JSON.stringify(audit.preDoctrineTop3) !== JSON.stringify(audit.postDoctrineTop3)
  audit.doctrineApplied = audit.candidatesAffected > 0
  
  // Log final audit
  console.log('[PHASE4-DOCTRINE-SCORER] Scoring complete:', {
    totalCandidates: audit.totalCandidates,
    candidatesAffected: audit.candidatesAffected,
    topCandidateChanged: audit.topCandidateChanged,
    top3Changed: audit.top3Changed,
    preDoctrineTop3: audit.preDoctrineTop3,
    postDoctrineTop3: audit.postDoctrineTop3,
    doctrineApplied: audit.doctrineApplied,
    verdict: audit.doctrineApplied ? 'DOCTRINE_EXERCISE_SCORING_LIVE' : 'DOCTRINE_NEUTRAL',
  })
  
  return { scoredCandidates, audit }
}

// =============================================================================
// CANDIDATE SCORING
// =============================================================================

function scoreCandidate(
  candidate: ExerciseCandidate,
  context: DoctrineScoreContext,
  selectionRules: ExerciseSelectionRule[],
  contraindicationRules: ContraindicationRule[],
  carryoverRules: CarryoverRule[]
): DoctrineScoreResult {
  // [EXERCISE-SELECTION-HARDENING] Use safe string normalization
  const exerciseId = safeExerciseId(candidate.exercise)
  const exerciseName = safeExerciseName(candidate.exercise)
  
  // Skip scoring if candidate has no valid identifiers
  if (!exerciseId && !exerciseName) {
    console.warn('[doctrine-exercise-scorer] Skipping malformed candidate with no id/name')
    return {
      exerciseId: 'unknown',
      baseScore: candidate.score,
      doctrineScoreDelta: 0,
      finalScore: candidate.score,
      doctrineReasons: ['Skipped: malformed exercise candidate'],
      doctrineMatchedRules: [],
      doctrineConfidence: 'low' as const,
      doctrineApplied: false,
    }
  }
  
  let doctrineScoreDelta = 0
  const doctrineReasons: string[] = []
  const doctrineMatchedRules: DoctrineScoreResult['doctrineMatchedRules'] = []
  
  // 1. Apply selection rules
  for (const rule of selectionRules) {
    const ruleExerciseKey = safeRuleKey(rule.exerciseKey)
    
    // Check if rule applies to this exercise
    if (!exerciseId.includes(ruleExerciseKey) && !exerciseName.includes(ruleExerciseKey)) {
      continue
    }
    
    // Check level scope
    if (rule.levelScope.length > 0 && !rule.levelScope.includes(context.experienceLevel)) {
      continue
    }
    
    // Base selection match boost
    let delta = DOCTRINE_SCORE_MODIFIERS.SELECTION_MATCH_BOOST
    
    // Apply rule weight scaling
    if (rule.selectionWeight > 0.8) {
      delta *= DOCTRINE_SCORE_MODIFIERS.HIGH_WEIGHT_RULE_MULTIPLIER
    } else if (rule.selectionWeight < 0.4) {
      delta *= DOCTRINE_SCORE_MODIFIERS.LOW_WEIGHT_RULE_MULTIPLIER
    }
    
    // Check preferred_when context
    const preferredWhen = rule.preferredWhenJson as Record<string, unknown> | null
    if (preferredWhen) {
      if (
        (preferredWhen.hasWeightedEquipment && context.hasWeightedEquipment) ||
        (preferredWhen.sessionFocus === context.sessionFocus) ||
        (preferredWhen.experienceLevel === context.experienceLevel)
      ) {
        delta += DOCTRINE_SCORE_MODIFIERS.SELECTION_PREFERRED_BOOST
        doctrineReasons.push(`Preferred for ${context.sessionFocus} session`)
      }
    }
    
    // Check avoid_when context
    const avoidWhen = rule.avoidWhenJson as Record<string, unknown> | null
    if (avoidWhen) {
      const hasAvoidContext = context.jointCautions.some(j => 
        (avoidWhen.jointCautions as string[] | undefined)?.includes(j)
      )
      if (hasAvoidContext) {
        delta += DOCTRINE_SCORE_MODIFIERS.SELECTION_AVOID_PENALTY
        doctrineReasons.push('Avoid context matched (joint caution)')
      }
    }
    
    doctrineScoreDelta += delta
    doctrineMatchedRules.push({
      ruleId: rule.id,
      ruleType: 'selection',
      scoreDelta: delta,
      reason: `Selection rule for ${rule.goalKey || rule.skillKey}`,
    })
  }
  
  // 2. Apply carryover rules
  // [EXERCISE-SELECTION-HARDENING] Use safe string normalization
  for (const rule of carryoverRules) {
  const sourceKey = safeRuleKey(rule.sourceExerciseOrSkillKey)
  if (!sourceKey) continue // Skip malformed rule
  
  // Check if this exercise matches the source
  if (!safeContains(exerciseId, sourceKey) && !safeContains(exerciseName, sourceKey)) {
  // Also check if exercise transfers to target skill
  const targetSkillKey = safeRuleKey(rule.targetSkillKey)
  const transfersToTarget = targetSkillKey && safeArrayContains(candidate.exercise.transferTo, targetSkillKey)
  if (!transfersToTarget) continue
  }
    
    // Apply carryover boost based on type
    let delta = 0
    switch (rule.carryoverType) {
      case 'direct':
        delta = DOCTRINE_SCORE_MODIFIERS.CARRYOVER_DIRECT_BOOST
        doctrineReasons.push(`Direct carryover to ${rule.targetSkillKey}`)
        break
      case 'indirect':
        delta = DOCTRINE_SCORE_MODIFIERS.CARRYOVER_INDIRECT_BOOST
        doctrineReasons.push(`Indirect carryover to ${rule.targetSkillKey}`)
        break
      case 'prerequisite':
        delta = DOCTRINE_SCORE_MODIFIERS.CARRYOVER_PREREQUISITE_BOOST
        doctrineReasons.push(`Prerequisite for ${rule.targetSkillKey}`)
        break
      case 'accessory':
        delta = DOCTRINE_SCORE_MODIFIERS.CARRYOVER_ACCESSORY_BOOST
        doctrineReasons.push(`Accessory work for ${rule.targetSkillKey}`)
        break
    }
    
    // Scale by carryover strength
    delta *= rule.carryoverStrength
    
    doctrineScoreDelta += delta
    doctrineMatchedRules.push({
      ruleId: rule.id,
      ruleType: 'carryover',
      scoreDelta: delta,
      reason: `Carryover: ${rule.sourceExerciseOrSkillKey} -> ${rule.targetSkillKey}`,
    })
  }
  
  // 3. Apply contraindication rules (penalties only)
  // [EXERCISE-SELECTION-HARDENING] Use safe string normalization
  for (const rule of contraindicationRules) {
  const ruleExerciseKey = safeRuleKey(rule.exerciseKey)
  if (!ruleExerciseKey) continue // Skip malformed rule
  
  // Check if rule applies to this exercise
  if (!safeContains(exerciseId, ruleExerciseKey) && !safeContains(exerciseName, ruleExerciseKey)) {
      continue
    }
    
    // Check if athlete has matching joint cautions
    const blockedJoints = rule.blockedJointJson || []
    const hasMatchingCaution = context.jointCautions.some(j => 
      blockedJoints.includes(j)
    )
    
    if (!hasMatchingCaution) continue
    
    // Apply penalty based on severity
    let delta = 0
    switch (rule.severity) {
      case 'caution':
        delta = DOCTRINE_SCORE_MODIFIERS.CONTRAINDICATION_CAUTION
        doctrineReasons.push(`Caution: ${rule.modificationGuidance || 'Joint concern'}`)
        break
      case 'warning':
        delta = DOCTRINE_SCORE_MODIFIERS.CONTRAINDICATION_WARNING
        doctrineReasons.push(`Warning: ${rule.modificationGuidance || 'Joint concern'}`)
        break
      case 'blocked':
        // This should have been caught by hard filters, but penalize heavily just in case
        delta = -30
        doctrineReasons.push(`Blocked: ${rule.modificationGuidance || 'Joint contraindication'}`)
        break
    }
    
    doctrineScoreDelta += delta
    doctrineMatchedRules.push({
      ruleId: rule.id,
      ruleType: 'contraindication',
      scoreDelta: delta,
      reason: `Contraindication for ${blockedJoints.join(', ')}`,
    })
  }
  
  // Calculate confidence based on rule matches
  const totalMatches = doctrineMatchedRules.length
  const doctrineConfidence: DoctrineScoreResult['doctrineConfidence'] = 
    totalMatches >= 3 ? 'high' :
    totalMatches >= 1 ? 'medium' :
    'low'
  
  return {
    exerciseId: candidate.exercise.id,
    baseScore: candidate.score,
    doctrineScoreDelta,
    finalScore: candidate.score + doctrineScoreDelta,
    doctrineReasons,
    doctrineMatchedRules,
    doctrineConfidence,
    doctrineApplied: doctrineMatchedRules.length > 0,
  }
}

// =============================================================================
// UTILITY: Re-rank candidates with doctrine scores
// =============================================================================

export function applyDoctrineScoringToRankedCandidates<T extends ExerciseCandidate>(
  candidates: T[],
  doctrineResults: DoctrineScoreResult[]
): T[] {
  // Create lookup map
  const scoreMap = new Map(doctrineResults.map(r => [r.exerciseId, r.finalScore]))
  
  // Sort by final doctrine-adjusted score
  return [...candidates].sort((a, b) => {
    const aScore = scoreMap.get(a.exercise.id) ?? a.score
    const bScore = scoreMap.get(b.exercise.id) ?? b.score
    return bScore - aScore
  })
}

// =============================================================================
// EXPORT AUDIT SUMMARY FOR UI
// =============================================================================

export function getDoctrineInfluenceSummary(
  audit: DoctrineScoringAudit
): string | null {
  if (!audit.doctrineApplied) {
    return null
  }
  
  const changes: string[] = []
  
  if (audit.topCandidateChanged) {
    changes.push('Doctrine adjusted top exercise selection')
  } else if (audit.top3Changed) {
    changes.push('Doctrine refined exercise ranking')
  }
  
  if (audit.rulesMatched.carryoverRules > 0) {
    changes.push(`${audit.rulesMatched.carryoverRules} carryover rule(s) applied`)
  }
  
  if (audit.rulesMatched.contraindicationRules > 0) {
    changes.push(`${audit.rulesMatched.contraindicationRules} safety rule(s) applied`)
  }
  
  if (audit.rulesMatched.selectionRules > 0) {
    changes.push(`${audit.rulesMatched.selectionRules} selection rule(s) applied`)
  }
  
  return changes.length > 0 ? changes.join('. ') : null
}

// =============================================================================
// PRE-CACHED RULES FOR SYNCHRONOUS SCORING
// =============================================================================

export interface CachedDoctrineRules {
  selectionRules: ExerciseSelectionRule[]
  contraindicationRules: ContraindicationRule[]
  carryoverRules: CarryoverRule[]
  fetchedAt: number
  primaryGoal: string
  /** [PHASE 4G] All goal/skill keys used to query rules — primary + secondary + selectedSkills. */
  queriedSkillKeys: string[]
  /** [PHASE 4G] Stable cache key combining all queried keys, used for cache validity. */
  cacheKey: string
}

let rulesCache: CachedDoctrineRules | null = null
const CACHE_TTL_MS = 60000 // 1 minute cache

/**
 * [PHASE 4G] DOCTRINE APPLICATION GATE — RULE MATCHING REPAIR
 *
 * Pre-fetch doctrine rules for the athlete's full skill context so they are
 * available synchronously during exercise selection scoring.
 *
 * WHY THE WIDER CONTEXT EXISTS (Phase 4G root cause)
 * --------------------------------------------------
 * Before Phase 4G this function fetched rules by `primaryGoal` ONLY. For a
 * hybrid athlete with `selectedSkills` like
 * `[planche, front_lever, back_lever, handstand, hspu, v_sit]` and
 * `primaryGoal: 'planche'`, the SQL filters in `getExerciseSelectionRules`
 * (`r.goalKey === filters.goalKey`) and `getCarryoverRules`
 * (`r.targetSkillKey === targetSkillKey`) silently discarded 5 of 6 skills'
 * worth of rules. Those rules could not enter the cache, could not score
 * candidates, could not become eligible/selected/materialized — explaining
 * the user-visible "doctrine evaluated this session but didn't change it"
 * pattern that motivated Phase 4G.
 *
 * THE FIX
 * -------
 * Accept the full skill context (`primaryGoal`, `secondaryGoal`,
 * `selectedSkills`). Fetch rules for the deduplicated UNION of all those
 * keys, then merge and dedupe by rule id. Backward compatible: callers
 * that still pass only `primaryGoal` get the legacy single-skill behavior.
 *
 * SAFETY
 * ------
 *   * Does NOT lower any score modifier or relax any safety filter.
 *   * Does NOT add new candidate exercises — it only allows rules for
 *     skills the athlete actually selected to score the candidates that
 *     already passed safety/progression/equipment gates.
 *   * Contraindication rules are global (no goal filter), so they were
 *     never narrowed and are unchanged.
 *   * Cache key includes all queried keys so a wider fetch cannot be
 *     served from a previous narrower cache entry.
 *
 * NON-GOALS
 * ---------
 *   * Does NOT add method/prescription/carryover materialization paths.
 *     Phase 4G's surgical fix is the query gate; downstream materialization
 *     of method and prescription rules is a separate phase.
 */
export interface PrefetchDoctrineRulesContext {
  primaryGoal: string
  secondaryGoal?: string | null
  selectedSkills?: string[] | null
}

export async function prefetchDoctrineRules(
  contextOrPrimaryGoal: string | PrefetchDoctrineRulesContext
): Promise<CachedDoctrineRules | null> {
  // Backward-compat: callers may still pass a single primaryGoal string.
  const ctx: PrefetchDoctrineRulesContext = typeof contextOrPrimaryGoal === 'string'
    ? { primaryGoal: contextOrPrimaryGoal }
    : contextOrPrimaryGoal

  const primaryGoal = ctx.primaryGoal
  // Build the deduplicated union of skill keys to query. Primary first,
  // then secondary, then selectedSkills, dropping null/empty/duplicates.
  const queriedSkillKeysSet = new Set<string>()
  const addKey = (k: string | null | undefined) => {
    if (typeof k === 'string' && k.trim().length > 0) queriedSkillKeysSet.add(k.trim())
  }
  addKey(primaryGoal)
  addKey(ctx.secondaryGoal)
  if (Array.isArray(ctx.selectedSkills)) {
    for (const s of ctx.selectedSkills) addKey(s)
  }
  const queriedSkillKeys = Array.from(queriedSkillKeysSet)
  // Stable cache key — sorted so order-insensitive. Used both for validity
  // checks and so a previous narrow fetch cannot satisfy a wider request.
  const cacheKey = queriedSkillKeys.slice().sort().join('|')

  // Reuse cache only when the FULL query key matches (Phase 4G: not just primaryGoal).
  if (
    rulesCache &&
    rulesCache.cacheKey === cacheKey &&
    Date.now() - rulesCache.fetchedAt < CACHE_TTL_MS
  ) {
    console.log('[PHASE4G-DOCTRINE-CACHE] Using cached rules for skill set:', {
      primaryGoal,
      queriedSkillKeysCount: queriedSkillKeys.length,
      cacheKey,
    })
    return rulesCache
  }

  try {
    // Issue one query per skill key in parallel for selection + carryover.
    // Contraindication rules are global, fetched once.
    const selectionPromises = queriedSkillKeys.map(skillKey =>
      getExerciseSelectionRules({ goalKey: skillKey })
    )
    const carryoverPromises = queriedSkillKeys.map(skillKey =>
      getCarryoverRules(skillKey)
    )

    const [selectionResults, carryoverResults, contraRules] = await Promise.all([
      Promise.all(selectionPromises),
      Promise.all(carryoverPromises),
      getContraindicationRules(),
    ])

    // Merge and dedupe by rule id. A rule that legitimately matches two of
    // the athlete's skills (e.g. a carryover from front_lever to back_lever)
    // must appear once, not twice — otherwise the per-rule scoreDelta would
    // be double-counted in the per-candidate scorer.
    const selRulesById = new Map<string, ExerciseSelectionRule>()
    for (const arr of selectionResults) {
      for (const r of arr) {
        if (r && typeof r.id === 'string' && !selRulesById.has(r.id)) {
          selRulesById.set(r.id, r)
        }
      }
    }
    const carryRulesById = new Map<string, CarryoverRule>()
    for (const arr of carryoverResults) {
      for (const r of arr) {
        if (r && typeof r.id === 'string' && !carryRulesById.has(r.id)) {
          carryRulesById.set(r.id, r)
        }
      }
    }

    const selRules = Array.from(selRulesById.values())
    const carryRules = Array.from(carryRulesById.values())

    rulesCache = {
      selectionRules: selRules,
      contraindicationRules: contraRules,
      carryoverRules: carryRules,
      fetchedAt: Date.now(),
      primaryGoal,
      queriedSkillKeys,
      cacheKey,
    }

    console.log('[PHASE4G-DOCTRINE-CACHE] Rules prefetched (multi-skill):', {
      primaryGoal,
      secondaryGoal: ctx.secondaryGoal ?? null,
      queriedSkillKeysCount: queriedSkillKeys.length,
      queriedSkillKeys,
      selectionRules: selRules.length,
      contraindicationRules: contraRules.length,
      carryoverRules: carryRules.length,
      // [PHASE 4G ROOT-CAUSE PROOF] If selectionRules / carryoverRules grew vs
      // the previous primary-only count, that is the literal proof that the
      // earlier query was discarding rules for skills the athlete selected.
      verdict:
        queriedSkillKeys.length > 1
          ? 'DOCTRINE_QUERY_WIDENED_TO_FULL_SKILL_SET'
          : 'DOCTRINE_QUERY_SINGLE_SKILL_ONLY',
    })

    return rulesCache
  } catch (error) {
    console.log('[PHASE4G-DOCTRINE-CACHE] Failed to prefetch rules:', error)
    return null
  }
}

/**
 * Get the current cached doctrine rules (if any).
 * Returns null if no rules are cached or cache is expired.
 */
export function getCachedDoctrineRules(): CachedDoctrineRules | null {
  if (rulesCache && Date.now() - rulesCache.fetchedAt < CACHE_TTL_MS) {
    return rulesCache
  }
  return null
}

/**
 * Synchronous scoring function using cached rules.
 * Falls back gracefully if no rules are cached.
 */
export function scoreExercisesWithDoctrineSync(
  candidates: Array<{ exercise: { id: string; name: string; transferTo?: string[] }; score: number }>,
  context: DoctrineScoreContext,
  cachedRules?: CachedDoctrineRules | null
): DoctrineScoreResult[] {
  const rules = cachedRules || getCachedDoctrineRules()
  
  if (!rules || rules.selectionRules.length + rules.contraindicationRules.length + rules.carryoverRules.length === 0) {
    // No rules available, return unmodified scores
    return candidates.map(c => ({
      exerciseId: c.exercise.id,
      baseScore: c.score,
      doctrineScoreDelta: 0,
      finalScore: c.score,
      doctrineReasons: [],
      doctrineMatchedRules: [],
      doctrineConfidence: 'low' as const,
      doctrineApplied: false,
    }))
  }
  
  // Score each candidate synchronously
  // [EXERCISE-SELECTION-HARDENING] Use safe string normalization
  return candidates.map(candidate => {
    const exerciseId = safeExerciseId(candidate.exercise)
    const exerciseName = safeExerciseName(candidate.exercise)
    
    // Skip scoring if candidate has no valid identifiers
    if (!exerciseId && !exerciseName) {
      return {
        exerciseId: 'unknown',
        baseScore: candidate.score,
        doctrineScoreDelta: 0,
        finalScore: candidate.score,
        doctrineReasons: ['Skipped: malformed exercise candidate'],
        doctrineMatchedRules: [],
        doctrineConfidence: 'low' as const,
        doctrineApplied: false,
      }
    }
    
    let doctrineScoreDelta = 0
    const doctrineReasons: string[] = []
    const doctrineMatchedRules: DoctrineScoreResult['doctrineMatchedRules'] = []
    
    // Apply selection rules
    for (const rule of rules.selectionRules) {
      const ruleKey = safeRuleKey(rule.exerciseKey)
      if (!exerciseId.includes(ruleKey) && !exerciseName.includes(ruleKey)) continue
      if (rule.levelScope.length > 0 && !rule.levelScope.includes(context.experienceLevel)) continue
      
      let delta = DOCTRINE_SCORE_MODIFIERS.SELECTION_MATCH_BOOST
      if (rule.selectionWeight > 0.8) delta *= DOCTRINE_SCORE_MODIFIERS.HIGH_WEIGHT_RULE_MULTIPLIER
      else if (rule.selectionWeight < 0.4) delta *= DOCTRINE_SCORE_MODIFIERS.LOW_WEIGHT_RULE_MULTIPLIER
      
      doctrineScoreDelta += delta
      doctrineMatchedRules.push({
        ruleId: rule.id,
        ruleType: 'selection',
        scoreDelta: delta,
        reason: `Selection rule for ${rule.goalKey || rule.skillKey}`,
      })
      doctrineReasons.push(`Doctrine-preferred for ${context.primaryGoal}`)
    }
    
    // Apply carryover rules
    for (const rule of rules.carryoverRules) {
    // [EXERCISE-SELECTION-HARDENING] Use safe string normalization
    const sourceKey = safeRuleKey(rule.sourceExerciseOrSkillKey)
    if (!sourceKey) continue // Skip malformed rule
    const hasDirectMatch = safeContains(exerciseId, sourceKey) || safeContains(exerciseName, sourceKey)
    const targetSkillKey = safeRuleKey(rule.targetSkillKey)
    const transfersToTarget = targetSkillKey && safeArrayContains(candidate.exercise.transferTo, targetSkillKey)
      
      if (!hasDirectMatch && !transfersToTarget) continue
      
      let delta = 0
      switch (rule.carryoverType) {
        case 'direct': delta = DOCTRINE_SCORE_MODIFIERS.CARRYOVER_DIRECT_BOOST; break
        case 'indirect': delta = DOCTRINE_SCORE_MODIFIERS.CARRYOVER_INDIRECT_BOOST; break
        case 'prerequisite': delta = DOCTRINE_SCORE_MODIFIERS.CARRYOVER_PREREQUISITE_BOOST; break
        case 'accessory': delta = DOCTRINE_SCORE_MODIFIERS.CARRYOVER_ACCESSORY_BOOST; break
      }
      delta *= rule.carryoverStrength
      
      doctrineScoreDelta += delta
      doctrineMatchedRules.push({
        ruleId: rule.id,
        ruleType: 'carryover',
        scoreDelta: delta,
        reason: `Carryover: ${rule.sourceExerciseOrSkillKey} -> ${rule.targetSkillKey}`,
      })
      doctrineReasons.push(`${rule.carryoverType} carryover to ${rule.targetSkillKey}`)
    }
    
  // Apply contraindication rules
  // [EXERCISE-SELECTION-HARDENING] Use safe string normalization
  for (const rule of rules.contraindicationRules) {
    const ruleKey = safeRuleKey(rule.exerciseKey)
    if (!ruleKey) continue // Skip malformed rule
    if (!safeContains(exerciseId, ruleKey) && !safeContains(exerciseName, ruleKey)) continue
      
      const blockedJoints = rule.blockedJointJson || []
      const hasMatchingCaution = context.jointCautions.some(j => blockedJoints.includes(j))
      if (!hasMatchingCaution) continue
      
      const delta = rule.severity === 'caution' 
        ? DOCTRINE_SCORE_MODIFIERS.CONTRAINDICATION_CAUTION
        : rule.severity === 'warning'
          ? DOCTRINE_SCORE_MODIFIERS.CONTRAINDICATION_WARNING
          : -30
      
      doctrineScoreDelta += delta
      doctrineMatchedRules.push({
        ruleId: rule.id,
        ruleType: 'contraindication',
        scoreDelta: delta,
        reason: `Joint caution: ${blockedJoints.join(', ')}`,
      })
      doctrineReasons.push(`Joint protection applied`)
    }
    
    const totalMatches = doctrineMatchedRules.length
    
    return {
      exerciseId: candidate.exercise.id,
      baseScore: candidate.score,
      doctrineScoreDelta,
      finalScore: candidate.score + doctrineScoreDelta,
      doctrineReasons,
      doctrineMatchedRules,
      doctrineConfidence: totalMatches >= 3 ? 'high' : totalMatches >= 1 ? 'medium' : 'low',
      doctrineApplied: totalMatches > 0,
    }
  })
}

/**
 * Apply doctrine scoring and return re-sorted candidates (synchronous).
 * This is the main integration point for the exercise selector.
 */
export function applyDoctrineScoringSyncAndSort<T extends { exercise: { id: string; name: string; transferTo?: string[] }; score: number }>(
  candidates: T[],
  context: DoctrineScoreContext,
  cachedRules?: CachedDoctrineRules | null
): { sorted: T[]; audit: DoctrineScoringAudit } {
  const preTop3 = candidates.slice(0, 3).map(c => c.exercise.id)
  
  const results = scoreExercisesWithDoctrineSync(candidates, context, cachedRules)
  const scoreMap = new Map(results.map(r => [r.exerciseId, r]))
  
  // Sort by doctrine-adjusted score
  const sorted = [...candidates].sort((a, b) => {
    const aResult = scoreMap.get(a.exercise.id)
    const bResult = scoreMap.get(b.exercise.id)
    const aScore = aResult?.finalScore ?? a.score
    const bScore = bResult?.finalScore ?? b.score
    return bScore - aScore
  })
  
  const postTop3 = sorted.slice(0, 3).map(c => c.exercise.id)
  const candidatesAffected = results.filter(r => r.doctrineApplied).length
  
  const audit: DoctrineScoringAudit = {
    totalCandidates: candidates.length,
    rulesQueried: {
      selectionRules: cachedRules?.selectionRules.length || 0,
      contraindicationRules: cachedRules?.contraindicationRules.length || 0,
      carryoverRules: cachedRules?.carryoverRules.length || 0,
    },
    rulesMatched: {
      selectionRules: results.filter(r => r.doctrineMatchedRules.some(m => m.ruleType === 'selection')).length,
      contraindicationRules: results.filter(r => r.doctrineMatchedRules.some(m => m.ruleType === 'contraindication')).length,
      carryoverRules: results.filter(r => r.doctrineMatchedRules.some(m => m.ruleType === 'carryover')).length,
    },
    candidatesAffected,
    topCandidateChanged: preTop3[0] !== postTop3[0],
    top3Changed: JSON.stringify(preTop3) !== JSON.stringify(postTop3),
    preDoctrineTop3: preTop3,
    postDoctrineTop3: postTop3,
    doctrineApplied: candidatesAffected > 0,
    fallbackReason: candidatesAffected === 0 ? 'no_matching_rules' : null,
  }
  
  // Log if doctrine changed results
  if (audit.doctrineApplied) {
    console.log('[PHASE4-DOCTRINE-SYNC-SCORING]', {
      candidatesAffected: audit.candidatesAffected,
      topCandidateChanged: audit.topCandidateChanged,
      top3Changed: audit.top3Changed,
      preDoctrineTop3: audit.preDoctrineTop3,
      postDoctrineTop3: audit.postDoctrineTop3,
      verdict: audit.topCandidateChanged 
        ? 'DOCTRINE_CHANGED_WINNER' 
        : audit.top3Changed 
          ? 'DOCTRINE_CHANGED_RANKING'
          : 'DOCTRINE_AFFECTED_BUT_SAME_RESULT',
    })
  }
  
  return { sorted, audit }
}
