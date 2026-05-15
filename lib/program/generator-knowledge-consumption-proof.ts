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

// =============================================================================
// SESSION-LEVEL PROOF
// =============================================================================

/**
 * Session-level generator knowledge consumption proof
 * Stamped onto session.styleMetadata.generatorKnowledgeProof
 */
export interface SessionGeneratorKnowledgeProof {
  readonly source: 'selector_knowledge_bridge'
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
  readonly source: 'selector_knowledge_bridge'
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

  // Build proof lines
  const proofLines: string[] = []
  proofLines.push(`Sessions analyzed: ${validProofs.length}/${sessionProofs.length}`)
  proofLines.push(`Selected exercises: ${totalMatched}/${totalSelected} matched`)
  proofLines.push(`Mode: read-only enrichment`)
  proofLines.push(`No workout structure changed`)

  return {
    source: 'selector_knowledge_bridge',
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
  
  // Validate required fields
  if (p.source !== 'selector_knowledge_bridge') return null
  if (typeof p.selectedExerciseCount !== 'number') return null
  if (typeof p.matchedExerciseCount !== 'number') return null
  
  return proof as SessionGeneratorKnowledgeProof
}
