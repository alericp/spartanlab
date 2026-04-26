/**
 * Source-batch fallback registry — uploaded-PDF doctrine batches.
 *
 * Each batch (batch-01-*, batch-02-*, batch-03-*) is a pure data file exporting
 * DB-row-shaped atom arrays + provenance. The runtime contract consumes ONLY
 * this aggregator (never a single batch) so adding a new batch never touches
 * runtime code.
 *
 * DB live atoms always win. This aggregator is read only when the doctrine DB
 * returns zero atoms.
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ FUTURE BATCH PATTERN (e.g. batch_04):                                   │
 * │   1. Create lib/doctrine/source-batches/batch-04-uploaded-pdf-doctrine.ts│
 * │   2. Re-export its public accessors at the top of this file.            │
 * │   3. Import its accessors in the import block below.                    │
 * │   4. Append `"batch_04"` to the BATCHES tuple.                          │
 * │   5. Add it to the per-helper concat lists below.                       │
 * │ Runtime contract, builder, save/load, and Program UI must NOT be edited.│
 * └─────────────────────────────────────────────────────────────────────────┘
 */

// Batch 01 — re-exported for back-compat with any caller still using getBatch01*
export {
  getBatch01Sources,
  getBatch01Principles,
  getBatch01ProgressionRules,
  getBatch01ExerciseSelectionRules,
  getBatch01ContraindicationRules,
  getBatch01MethodRules,
  getBatch01PrescriptionRules,
  getBatch01CarryoverRules,
  getBatch01Counts,
  getBatch01CountsBySource,
  getBatch01ProvenanceFor,
  type Batch01Provenance,
  type Batch01Counts,
  type Batch01PriorityType,
  type Batch01IntelligenceTier,
} from "./batch-01-uploaded-pdf-doctrine"

// Batch 02 — added in Batch 2 ingestion pass.
export {
  getBatch02Sources,
  getBatch02Principles,
  getBatch02ProgressionRules,
  getBatch02ExerciseSelectionRules,
  getBatch02ContraindicationRules,
  getBatch02MethodRules,
  getBatch02PrescriptionRules,
  getBatch02CarryoverRules,
  getBatch02Counts,
  getBatch02CountsBySource,
  getBatch02ProvenanceFor,
  type Batch02Provenance,
  type Batch02Counts,
  type Batch02PriorityType,
  type Batch02IntelligenceTier,
} from "./batch-02-uploaded-pdf-doctrine"

// Batch 03 — added in Batch 3 ingestion pass.
export {
  getBatch03Sources,
  getBatch03Principles,
  getBatch03ProgressionRules,
  getBatch03ExerciseSelectionRules,
  getBatch03ContraindicationRules,
  getBatch03MethodRules,
  getBatch03PrescriptionRules,
  getBatch03CarryoverRules,
  getBatch03Counts,
  getBatch03CountsBySource,
  getBatch03ProvenanceFor,
  type Batch03Provenance,
  type Batch03Counts,
  type Batch03PriorityType,
  type Batch03IntelligenceTier,
} from "./batch-03-uploaded-pdf-doctrine"

import {
  getBatch01Sources,
  getBatch01Principles,
  getBatch01ProgressionRules,
  getBatch01ExerciseSelectionRules,
  getBatch01ContraindicationRules,
  getBatch01MethodRules,
  getBatch01PrescriptionRules,
  getBatch01CarryoverRules,
  getBatch01CountsBySource,
  getBatch01ProvenanceFor,
  type Batch01Provenance,
} from "./batch-01-uploaded-pdf-doctrine"

import {
  getBatch02Sources,
  getBatch02Principles,
  getBatch02ProgressionRules,
  getBatch02ExerciseSelectionRules,
  getBatch02ContraindicationRules,
  getBatch02MethodRules,
  getBatch02PrescriptionRules,
  getBatch02CarryoverRules,
  getBatch02CountsBySource,
  getBatch02ProvenanceFor,
  type Batch02Provenance,
} from "./batch-02-uploaded-pdf-doctrine"

import {
  getBatch03Sources,
  getBatch03Principles,
  getBatch03ProgressionRules,
  getBatch03ExerciseSelectionRules,
  getBatch03ContraindicationRules,
  getBatch03MethodRules,
  getBatch03PrescriptionRules,
  getBatch03CarryoverRules,
  getBatch03CountsBySource,
  getBatch03ProvenanceFor,
  type Batch03Provenance,
} from "./batch-03-uploaded-pdf-doctrine"

import type {
  DoctrineSource,
  DoctrinePrinciple,
  ProgressionRule,
  ExerciseSelectionRule,
  MethodRule,
  PrescriptionRule,
  CarryoverRule,
} from "../../doctrine-db"

// =============================================================================
// Unified uploaded-PDF doctrine aggregator
// =============================================================================

const BATCHES = ["batch_01", "batch_02", "batch_03"] as const
export type UploadedDoctrineBatchKey = (typeof BATCHES)[number]

export function getUploadedDoctrineBatchKeys(): readonly UploadedDoctrineBatchKey[] {
  return BATCHES
}

export function getUploadedDoctrineBatchSources(): DoctrineSource[] {
  return [...getBatch01Sources(), ...getBatch02Sources(), ...getBatch03Sources()]
}

export function getUploadedDoctrineBatchPrinciples(): DoctrinePrinciple[] {
  return [...getBatch01Principles(), ...getBatch02Principles(), ...getBatch03Principles()]
}

export function getUploadedDoctrineBatchProgressionRules(): ProgressionRule[] {
  return [
    ...getBatch01ProgressionRules(),
    ...getBatch02ProgressionRules(),
    ...getBatch03ProgressionRules(),
  ]
}

export function getUploadedDoctrineBatchExerciseSelectionRules(): ExerciseSelectionRule[] {
  return [
    ...getBatch01ExerciseSelectionRules(),
    ...getBatch02ExerciseSelectionRules(),
    ...getBatch03ExerciseSelectionRules(),
  ]
}

// ContraindicationRule is not exported from doctrine-db.ts; keep loose union
// so this helper exists for future readers without forcing a schema rewrite.
export function getUploadedDoctrineBatchContraindicationRules(): unknown[] {
  return [
    ...getBatch01ContraindicationRules(),
    ...getBatch02ContraindicationRules(),
    ...getBatch03ContraindicationRules(),
  ]
}

export function getUploadedDoctrineBatchMethodRules(): MethodRule[] {
  return [...getBatch01MethodRules(), ...getBatch02MethodRules(), ...getBatch03MethodRules()]
}

export function getUploadedDoctrineBatchPrescriptionRules(): PrescriptionRule[] {
  return [
    ...getBatch01PrescriptionRules(),
    ...getBatch02PrescriptionRules(),
    ...getBatch03PrescriptionRules(),
  ]
}

export function getUploadedDoctrineBatchCarryoverRules(): CarryoverRule[] {
  // Batches return CarryoverRule-shaped objects (Batch 02 historically uses
  // looser typing, kept compatible via structural cast for downstream coverage).
  return [
    ...(getBatch01CarryoverRules() as CarryoverRule[]),
    ...(getBatch02CarryoverRules() as unknown as CarryoverRule[]),
    ...(getBatch03CarryoverRules() as CarryoverRule[]),
  ]
}

export interface UploadedDoctrineBatchCounts {
  batchCount: number
  batchKeys: readonly UploadedDoctrineBatchKey[]
  sources: number
  principles: number
  progressionRules: number
  exerciseSelectionRules: number
  contraindicationRules: number
  methodRules: number
  prescriptionRules: number
  carryoverRules: number
  totalAtoms: number
  batchAtomCounts: Record<UploadedDoctrineBatchKey, number>
}

function batchAtomCount(
  principles: number,
  progression: number,
  selection: number,
  contraindication: number,
  method: number,
  prescription: number,
  carryover: number,
): number {
  return principles + progression + selection + contraindication + method + prescription + carryover
}

export function getUploadedDoctrineBatchCounts(): UploadedDoctrineBatchCounts {
  const principles = getUploadedDoctrineBatchPrinciples().length
  const progression = getUploadedDoctrineBatchProgressionRules().length
  const selection = getUploadedDoctrineBatchExerciseSelectionRules().length
  const contraindication = getUploadedDoctrineBatchContraindicationRules().length
  const method = getUploadedDoctrineBatchMethodRules().length
  const prescription = getUploadedDoctrineBatchPrescriptionRules().length
  const carryover = getUploadedDoctrineBatchCarryoverRules().length
  return {
    batchCount: BATCHES.length,
    batchKeys: BATCHES,
    sources: getUploadedDoctrineBatchSources().length,
    principles,
    progressionRules: progression,
    exerciseSelectionRules: selection,
    contraindicationRules: contraindication,
    methodRules: method,
    prescriptionRules: prescription,
    carryoverRules: carryover,
    totalAtoms:
      principles + progression + selection + contraindication + method + prescription + carryover,
    batchAtomCounts: {
      batch_01: batchAtomCount(
        getBatch01Principles().length,
        getBatch01ProgressionRules().length,
        getBatch01ExerciseSelectionRules().length,
        getBatch01ContraindicationRules().length,
        getBatch01MethodRules().length,
        getBatch01PrescriptionRules().length,
        getBatch01CarryoverRules().length,
      ),
      batch_02: batchAtomCount(
        getBatch02Principles().length,
        getBatch02ProgressionRules().length,
        getBatch02ExerciseSelectionRules().length,
        getBatch02ContraindicationRules().length,
        getBatch02MethodRules().length,
        getBatch02PrescriptionRules().length,
        getBatch02CarryoverRules().length,
      ),
      batch_03: batchAtomCount(
        getBatch03Principles().length,
        getBatch03ProgressionRules().length,
        getBatch03ExerciseSelectionRules().length,
        getBatch03ContraindicationRules().length,
        getBatch03MethodRules().length,
        getBatch03PrescriptionRules().length,
        getBatch03CarryoverRules().length,
      ),
    },
  }
}

export function getUploadedDoctrineBatchCountsByBatch(): Record<UploadedDoctrineBatchKey, number> {
  return getUploadedDoctrineBatchCounts().batchAtomCounts
}

export function getUploadedDoctrineBatchCountsBySource(): Record<string, number> {
  const out: Record<string, number> = {}
  for (const [k, v] of Object.entries(getBatch01CountsBySource())) {
    out[k] = (out[k] ?? 0) + v
  }
  for (const [k, v] of Object.entries(getBatch02CountsBySource())) {
    out[k] = (out[k] ?? 0) + v
  }
  for (const [k, v] of Object.entries(getBatch03CountsBySource())) {
    out[k] = (out[k] ?? 0) + v
  }
  return out
}

export function getUploadedDoctrineProvenanceFor(
  atomId: string,
): Batch01Provenance | Batch02Provenance | Batch03Provenance | null {
  return (
    getBatch01ProvenanceFor(atomId) ??
    getBatch02ProvenanceFor(atomId) ??
    getBatch03ProvenanceFor(atomId) ??
    null
  )
}
