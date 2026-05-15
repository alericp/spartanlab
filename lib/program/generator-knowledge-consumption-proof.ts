/**
 * GENERATOR KNOWLEDGE CONSUMPTION PROOF CONTRACT — MASTER-8C.6
 *
 * =============================================================================
 * READ-ONLY PROOF CONTRACT FOR GENERATOR DB CONSUMPTION
 * =============================================================================
 *
 * This module defines the typed shape for proving that the generator/selector
 * consumed the exercise knowledge foundation. This proof survives from:
 *   selector → builder → session → saved program → UI
 *
 * IMPORTANT GUARANTEES:
 *   - Pure TypeScript, JSON-safe, side-effect free
 *   - No localStorage, no Date.now, no React imports
 *   - No database calls, no route calls
 *   - No UI imports, no `as any`, no `@ts-ignore`
 *   - No mutation of program/session data
 *   - Read-only proof only
 *
 * Created: MASTER-8C.6
 */

import type { GeneratorKnowledgeConsumptionSummary } from '@/lib/exercise-knowledge-generator-bridge'
import { buildGeneratorKnowledgeConsumptionSummary } from '@/lib/exercise-knowledge-generator-bridge'
import { isSyntheticConditioningFinisherPlaceholder } from './conditioning-finisher-artifact-contract'

// =============================================================================
// SESSION-LEVEL PROOF
// =============================================================================

/**
 * Session-level generator knowledge consumption proof
 * Stamped onto session.styleMetadata.generatorKnowledgeProof
 * 
 * source can be:
 * - 'selector_knowledge_bridge': Native proof from generator/selector (preferred)
 * - 'saved_program_backfill': Read-only backfill for legacy saved programs
 */
export interface SessionGeneratorKnowledgeProof {
  readonly source: 'selector_knowledge_bridge' | 'saved_program_backfill'
  readonly mode: 'read_only_enrichment'
  readonly mutationApplied: false
  readonly selectedExerciseCount: number
  readonly matchedExerciseCount: number
  readonly missingExerciseCount: number
  readonly verdict: 'ready' | 'partial' | 'blocked' | 'unavailable'
  readonly matchedExerciseIds: readonly string[]
  readonly missingExerciseIds: readonly string[]
  readonly proofLines: readonly string[]
}

/**
 * Build session-level proof from selector summary
 */
export function buildSessionGeneratorKnowledgeProof(
  summary: GeneratorKnowledgeConsumptionSummary | null | undefined
): SessionGeneratorKnowledgeProof {
  if (!summary) {
    return {
      source: 'selector_knowledge_bridge',
      mode: 'read_only_enrichment',
      mutationApplied: false,
      selectedExerciseCount: 0,
      matchedExerciseCount: 0,
      missingExerciseCount: 0,
      verdict: 'unavailable',
      matchedExerciseIds: [],
      missingExerciseIds: [],
      proofLines: ['Generator knowledge consumption summary not available from selector'],
    }
  }

  const proofLines: string[] = []
  
  proofLines.push(`Mode: ${summary.consumptionMode}`)
  proofLines.push(`Exercises matched: ${summary.matchedCount}/${summary.poolCount}`)
  
  if (summary.verdict === 'ready') {
    proofLines.push('All selected exercises matched to knowledge foundation')
  } else if (summary.verdict === 'partial') {
    proofLines.push(`${summary.missingCount} exercise(s) missing knowledge match`)
  } else if (summary.verdict === 'blocked') {
    proofLines.push('No exercises matched to knowledge foundation')
  }
  
  proofLines.push('No automatic program changes applied')

  return {
    source: 'selector_knowledge_bridge',
    mode: 'read_only_enrichment',
    mutationApplied: false,
    selectedExerciseCount: summary.poolCount,
    matchedExerciseCount: summary.matchedCount,
    missingExerciseCount: summary.missingCount,
    verdict: summary.verdict,
    matchedExerciseIds: [...summary.matchedIds],
    missingExerciseIds: [...summary.missingIds],
    proofLines,
  }
}

// =============================================================================
// PROGRAM-LEVEL ROLLUP
// =============================================================================

/**
 * Program-level generator knowledge consumption proof
 * Rolled up from all session proofs
 */
export interface ProgramGeneratorKnowledgeProof {
  readonly source: 'selector_knowledge_bridge' | 'saved_program_backfill' | 'mixed'
  readonly mode: 'read_only_enrichment'
  readonly mutationApplied: false
  readonly sessionCount: number
  readonly sessionsWithProof: number
  readonly totalSelectedExercises: number
  readonly matchedExercises: number
  readonly missingExercises: number
  readonly verdict: 'ready' | 'partial' | 'blocked' | 'unavailable'
  readonly matchedExerciseIds: readonly string[]
  readonly missingExerciseIds: readonly string[]
  readonly proofLines: readonly string[]
}

/**
 * Roll up session proofs into program-level proof
 */
export function rollUpProgramGeneratorKnowledgeProof(
  sessionProofs: readonly (SessionGeneratorKnowledgeProof | null | undefined)[]
): ProgramGeneratorKnowledgeProof {
  const validProofs = sessionProofs.filter((p): p is SessionGeneratorKnowledgeProof => 
    p !== null && p !== undefined && p.verdict !== 'unavailable'
  )

  if (validProofs.length === 0) {
    return {
      source: 'selector_knowledge_bridge',
      mode: 'read_only_enrichment',
      mutationApplied: false,
      sessionCount: sessionProofs.length,
      sessionsWithProof: 0,
      totalSelectedExercises: 0,
      matchedExercises: 0,
      missingExercises: 0,
      verdict: 'unavailable',
      matchedExerciseIds: [],
      missingExerciseIds: [],
      proofLines: ['Generator knowledge proof unavailable — selector bridge not found on sessions'],
    }
  }

  // Aggregate counts
  const totalSelected = validProofs.reduce((sum, p) => sum + p.selectedExerciseCount, 0)
  const totalMatched = validProofs.reduce((sum, p) => sum + p.matchedExerciseCount, 0)
  const totalMissing = validProofs.reduce((sum, p) => sum + p.missingExerciseCount, 0)

  // Deduplicate exercise IDs
  const matchedIds = new Set<string>()
  const missingIds = new Set<string>()
  for (const proof of validProofs) {
    for (const id of proof.matchedExerciseIds) matchedIds.add(id)
    for (const id of proof.missingExerciseIds) missingIds.add(id)
  }

  // Determine overall verdict
  let verdict: 'ready' | 'partial' | 'blocked'
  if (totalMissing === 0 && totalMatched > 0) {
    verdict = 'ready'
  } else if (totalMatched > 0) {
    verdict = 'partial'
  } else {
    verdict = 'blocked'
  }

  // Determine source (mixed if both native and backfill present)
  const sources = new Set(validProofs.map(p => p.source))
  let source: 'selector_knowledge_bridge' | 'saved_program_backfill' | 'mixed'
  if (sources.size > 1) {
    source = 'mixed'
  } else if (sources.has('saved_program_backfill')) {
    source = 'saved_program_backfill'
  } else {
    source = 'selector_knowledge_bridge'
  }

  // Build proof lines
  const proofLines: string[] = []
  proofLines.push(`Sessions analyzed: ${validProofs.length}/${sessionProofs.length}`)
  proofLines.push(`Selected exercises: ${totalMatched}/${totalSelected} matched`)
  proofLines.push(`Mode: read-only enrichment`)
  if (source === 'saved_program_backfill') {
    proofLines.push(`Source: Derived from saved program exercises`)
  } else if (source === 'mixed') {
    proofLines.push(`Source: Mixed (native + backfill)`)
  }
  proofLines.push(`No workout structure changed`)

  return {
    source,
    mode: 'read_only_enrichment',
    mutationApplied: false,
    sessionCount: sessionProofs.length,
    sessionsWithProof: validProofs.length,
    totalSelectedExercises: totalSelected,
    matchedExercises: totalMatched,
    missingExercises: totalMissing,
    verdict,
    matchedExerciseIds: [...matchedIds],
    missingExerciseIds: [...missingIds],
    proofLines,
  }
}

/**
 * Extract session proof from styleMetadata safely
 */
export function extractSessionProofFromMetadata(
  styleMetadata: unknown
): SessionGeneratorKnowledgeProof | null {
  if (!styleMetadata || typeof styleMetadata !== 'object') return null
  
  const meta = styleMetadata as Record<string, unknown>
  const proof = meta.generatorKnowledgeProof
  
  if (!proof || typeof proof !== 'object') return null
  
  const p = proof as Record<string, unknown>
  
  // Validate required fields - accept either source type
  if (p.source !== 'selector_knowledge_bridge' && p.source !== 'saved_program_backfill') return null
  if (typeof p.selectedExerciseCount !== 'number') return null
  if (typeof p.matchedExerciseCount !== 'number') return null
  
  return proof as SessionGeneratorKnowledgeProof
}

// =============================================================================
// SAVED PROGRAM BACKFILL RESOLVER — MASTER-8C.6.2 + MASTER-8C.6.3
// =============================================================================

/**
 * Minimal exercise shape needed for knowledge bridge lookup
 */
interface MinimalExercise {
  id: string
  name: string
}

/**
 * MASTER-8C.6.3: Determines if an exercise row is a real analyzable exercise
 * for Generator DB Consumption backfill purposes.
 * 
 * This mirrors the filtering logic used by Program Balance UI Adapter to ensure
 * count parity between Coverage Summary and Generator DB Consumption.
 * 
 * Excludes:
 * - Synthetic conditioning finisher placeholders
 * - Group/circuit headers (no real exercise identity)
 * - Empty/invalid exercise rows
 */
function isGeneratorKnowledgeBackfillAnalyzableExercise(ex: unknown): boolean {
  if (!ex || typeof ex !== 'object') return false
  
  const exercise = ex as Record<string, unknown>
  
  // [MASTER-8C.6.3.1] Skip synthetic conditioning finisher placeholders
  // These are method artifacts, not real exercises
  if (isSyntheticConditioningFinisherPlaceholder(exercise)) {
    return false
  }
  
  // Must have at least an id or name to be analyzable
  const id = exercise.id
  const name = exercise.name
  const hasId = typeof id === 'string' && id.trim().length > 0
  const hasName = typeof name === 'string' && name.trim().length > 0
  
  if (!hasId && !hasName) {
    return false
  }
  
  // Skip generic group/circuit container rows without real exercise identity
  const nameStr = typeof name === 'string' ? name.toLowerCase().trim() : ''
  if (nameStr === 'circuit' || nameStr === 'group' || nameStr === 'superset') {
    return false
  }
  
  // Passed all checks - this is a real analyzable exercise
  return true
}

/**
 * Resolve session generator knowledge proof from a session object
 * 
 * Priority:
 * 1. Use existing native metadata proof if present and valid
 * 2. Fall back to deriving proof from session exercises via knowledge bridge
 * 
 * MASTER-8C.6.3: Backfill now filters to real analyzable exercises only,
 * matching Program Balance Coverage's filtering logic for count parity.
 * 
 * This is read-only and does not mutate the session.
 */
export function resolveSessionGeneratorKnowledgeProofFromSession(
  session: unknown
): SessionGeneratorKnowledgeProof | null {
  if (!session || typeof session !== 'object') return null
  
  const s = session as Record<string, unknown>
  
  // 1. Try native metadata proof first
  const nativeProof = extractSessionProofFromMetadata(s.styleMetadata)
  if (nativeProof && nativeProof.verdict !== 'unavailable') {
    if (process.env.NODE_ENV === 'development') {
      console.log('[MASTER-8C.6.2-GENERATOR-PROOF-NATIVE]', {
        hadNativeMetadataProof: true,
        verdict: nativeProof.verdict,
        matchedCount: nativeProof.matchedExerciseCount,
      })
    }
    return nativeProof
  }
  
  // 2. Fall back to deriving from session exercises
  const exercises = s.exercises
  if (!Array.isArray(exercises) || exercises.length === 0) {
    return null
  }
  
  // [MASTER-8C.6.3] Filter to real analyzable exercises only
  // This mirrors Program Balance UI Adapter's filtering for count parity
  const rawCount = exercises.length
  const analyzableExercises = exercises.filter(isGeneratorKnowledgeBackfillAnalyzableExercise)
  const skippedCount = rawCount - analyzableExercises.length
  
  // Convert to minimal exercise shape for knowledge bridge
  const minimalExercises: MinimalExercise[] = analyzableExercises
    .filter((ex): ex is Record<string, unknown> => ex && typeof ex === 'object')
    .map(ex => ({
      id: typeof ex.id === 'string' ? ex.id : '',
      name: typeof ex.name === 'string' ? ex.name : '',
    }))
    .filter(ex => ex.id || ex.name) // Must have at least id or name
  
  if (minimalExercises.length === 0) {
    return null
  }
  
  // Use existing knowledge bridge to build summary
  // Cast to Exercise[] since the bridge only needs id and name
  const summary = buildGeneratorKnowledgeConsumptionSummary(
    minimalExercises as unknown as import('@/lib/adaptive-exercise-pool').Exercise[]
  )
  
  // Build backfill proof from summary
  const proofLines: string[] = []
  proofLines.push(`Mode: read_only_enrichment`)
  proofLines.push(`Source: Derived from saved program exercises`)
  proofLines.push(`Exercises matched: ${summary.matchedCount}/${summary.poolCount}`)
  if (summary.verdict === 'ready') {
    proofLines.push('All exercises matched to knowledge foundation')
  } else if (summary.verdict === 'partial') {
    proofLines.push(`${summary.missingCount} exercise(s) missing knowledge match`)
  }
  proofLines.push('No automatic program changes applied')
  
  const backfillProof: SessionGeneratorKnowledgeProof = {
    source: 'saved_program_backfill',
    mode: 'read_only_enrichment',
    mutationApplied: false,
    selectedExerciseCount: summary.poolCount,
    matchedExerciseCount: summary.matchedCount,
    missingExerciseCount: summary.missingCount,
    verdict: summary.verdict,
    matchedExerciseIds: [...summary.matchedIds],
    missingExerciseIds: [...summary.missingIds],
    proofLines,
  }
  
  if (process.env.NODE_ENV === 'development') {
    // [MASTER-8C.6.3] Enhanced diagnostic with artifact filtering info
    const skippedExercises = exercises.filter(ex => !isGeneratorKnowledgeBackfillAnalyzableExercise(ex))
    console.log('[MASTER-8C.6.3-GENERATOR-PROOF-COUNT-PARITY]', {
      rawExerciseCount: rawCount,
      keptExerciseCount: analyzableExercises.length,
      skippedExerciseCount: skippedCount,
      skippedExerciseNames: skippedExercises
        .filter((ex): ex is Record<string, unknown> => ex && typeof ex === 'object')
        .map(ex => ex.name)
        .filter(Boolean),
      matchedExerciseCount: summary.matchedCount,
      missingExerciseCount: summary.missingCount,
      verdict: summary.verdict,
      source: 'saved_program_backfill',
      mutationApplied: false,
    })
  }
  
  return backfillProof
}
