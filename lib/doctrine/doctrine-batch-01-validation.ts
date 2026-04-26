/**
 * DOCTRINE BATCH 1 — INGESTION + PARITY VALIDATOR
 *
 * Verifies:
 *  1. The in-code Batch 1 atom store covers all 9 expected source keys.
 *  2. Per-source atom minimums declared in Section 1 of the prompt are met.
 *  3. Total atom count >= 74.
 *  4. Provenance is populated for every atom.
 *
 * This is a pure runtime validator — no DB access. It can be called by the SQL
 * seed verifier or by an integration test to enforce parity.
 */

import {
  getBatch01Sources,
  getBatch01Counts,
  getBatch01CountsBySource,
  getBatch01Principles,
  getBatch01ProgressionRules,
  getBatch01ExerciseSelectionRules,
  getBatch01ContraindicationRules,
  getBatch01MethodRules,
  getBatch01PrescriptionRules,
  getBatch01CarryoverRules,
  getBatch01ProvenanceFor,
} from "./source-batches"

/**
 * Minimum atom counts per source key, as declared in the prompt's Section 1
 * "9 ingested PDF sources" block.
 */
export const BATCH_01_PER_SOURCE_MINIMUMS: Record<string, number> = {
  hybrid_ppl_uploaded_pdf_batch_01: 8,
  forearm_health_uploaded_pdf_batch_01: 4,
  pull_up_pro_phase_1_uploaded_pdf_batch_01: 8,
  pull_up_pro_phase_2_uploaded_pdf_batch_01: 8,
  pull_up_pro_phase_3_uploaded_pdf_batch_01: 8,
  front_lever_uploaded_pdf_batch_01: 10,
  lower_body_b_uploaded_pdf_batch_01: 8,
  body_by_rings_uploaded_pdf_batch_01: 12,
  cardio_guide_uploaded_pdf_batch_01: 8,
}

export const BATCH_01_TOTAL_MINIMUM = 74

export interface Batch01ValidationReport {
  ok: boolean
  totals: {
    sourcesCount: number
    expectedSourcesCount: number
    totalAtoms: number
    totalAtomsMinimum: number
  }
  perSource: Array<{
    sourceKey: string
    actual: number
    minimum: number
    ok: boolean
  }>
  missingSourceKeys: string[]
  extraSourceKeys: string[]
  provenanceMissingFor: string[]
  failures: string[]
}

export function validateBatch01(): Batch01ValidationReport {
  const failures: string[] = []
  const sources = getBatch01Sources()
  const counts = getBatch01Counts()
  const perSource = getBatch01CountsBySource()

  // 1. Source coverage
  const expectedSourceKeys = Object.keys(BATCH_01_PER_SOURCE_MINIMUMS)
  const actualSourceKeys = sources.map((s) => s.sourceKey)
  const missingSourceKeys = expectedSourceKeys.filter((k) => !actualSourceKeys.includes(k))
  const extraSourceKeys = actualSourceKeys.filter((k) => !expectedSourceKeys.includes(k))
  if (missingSourceKeys.length > 0) {
    failures.push(`Missing source keys: ${missingSourceKeys.join(", ")}`)
  }

  // 2. Per-source minimums (count via provenance index, not DB-row source_id,
  //    because provenance carries the source_key string).
  const perSourceReport = expectedSourceKeys.map((k) => {
    const actual = perSource[k] ?? 0
    const minimum = BATCH_01_PER_SOURCE_MINIMUMS[k]
    const ok = actual >= minimum
    if (!ok) failures.push(`Source ${k} has ${actual} atoms, minimum is ${minimum}`)
    return { sourceKey: k, actual, minimum, ok }
  })

  // 3. Total atom minimum
  if (counts.totalAtoms < BATCH_01_TOTAL_MINIMUM) {
    failures.push(`Total atoms ${counts.totalAtoms} below minimum ${BATCH_01_TOTAL_MINIMUM}`)
  }

  // 4. Provenance completeness — every atom id must resolve.
  const provenanceMissingFor: string[] = []
  const allAtomIds: string[] = [
    ...getBatch01Principles().map((a) => a.id),
    ...getBatch01ProgressionRules().map((a) => a.id),
    ...getBatch01ExerciseSelectionRules().map((a) => a.id),
    ...getBatch01ContraindicationRules().map((a) => a.id),
    ...getBatch01MethodRules().map((a) => a.id),
    ...getBatch01PrescriptionRules().map((a) => a.id),
    ...getBatch01CarryoverRules().map((a) => a.id),
  ]
  for (const id of allAtomIds) {
    if (!getBatch01ProvenanceFor(id)) {
      provenanceMissingFor.push(id)
    }
  }
  if (provenanceMissingFor.length > 0) {
    failures.push(`Provenance missing for ${provenanceMissingFor.length} atom(s)`)
  }

  return {
    ok: failures.length === 0,
    totals: {
      sourcesCount: sources.length,
      expectedSourcesCount: expectedSourceKeys.length,
      totalAtoms: counts.totalAtoms,
      totalAtomsMinimum: BATCH_01_TOTAL_MINIMUM,
    },
    perSource: perSourceReport,
    missingSourceKeys,
    extraSourceKeys,
    provenanceMissingFor,
    failures,
  }
}
