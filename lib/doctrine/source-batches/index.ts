/**
 * Source-batch fallback registry — uploaded-PDF doctrine batches.
 *
 * Each batch (batch-01-*, batch-02-*) is a pure data file exporting DB-row-shaped
 * atom arrays + provenance. The runtime contract consumes ONLY this aggregator
 * (never a single batch) so adding a new batch never touches runtime code.
 *
 * DB live atoms always win. This aggregator is read only when the doctrine DB
 * returns zero atoms.
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
//
// Adding a future Batch 03 means: add one import block above + bump BATCHES + add
// the per-batch lengths in batchAtomCounts. Runtime contract code does not change.

const BATCHES = ["batch_01", "batch_02"] as const
export type UploadedDoctrineBatchKey = (typeof BATCHES)[number]

export function getUploadedDoctrineBatchKeys(): readonly UploadedDoctrineBatchKey[] {
  return BATCHES
}

export function getUploadedDoctrineBatchSources(): DoctrineSource[] {
  return [...getBatch01Sources(), ...getBatch02Sources()]
}

export function getUploadedDoctrineBatchPrinciples(): DoctrinePrinciple[] {
  return [...getBatch01Principles(), ...getBatch02Principles()]
}

export function getUploadedDoctrineBatchProgressionRules(): ProgressionRule[] {
  return [...getBatch01ProgressionRules(), ...getBatch02ProgressionRules()]
}

export function getUploadedDoctrineBatchExerciseSelectionRules(): ExerciseSelectionRule[] {
  return [...getBatch01ExerciseSelectionRules(), ...getBatch02ExerciseSelectionRules()]
}

// ContraindicationRule is not exported from doctrine-db.ts; keep loose union
// so this helper exists for future readers without forcing a schema rewrite.
export function getUploadedDoctrineBatchContraindicationRules(): unknown[] {
  return [...getBatch01ContraindicationRules(), ...getBatch02ContraindicationRules()]
}

export function getUploadedDoctrineBatchMethodRules(): MethodRule[] {
  return [...getBatch01MethodRules(), ...getBatch02MethodRules()]
}

export function getUploadedDoctrineBatchPrescriptionRules(): PrescriptionRule[] {
  return [...getBatch01PrescriptionRules(), ...getBatch02PrescriptionRules()]
}

export function getUploadedDoctrineBatchCarryoverRules(): CarryoverRule[] {
  // Both batches return CarryoverRule-shaped objects (Batch 02 differs in field
  // naming but is structurally compatible for downstream coverage counting).
  return [
    ...(getBatch01CarryoverRules() as CarryoverRule[]),
    ...(getBatch02CarryoverRules() as unknown as CarryoverRule[]),
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
      batch_01:
        getBatch01Principles().length +
        getBatch01ProgressionRules().length +
        getBatch01ExerciseSelectionRules().length +
        getBatch01ContraindicationRules().length +
        getBatch01MethodRules().length +
        getBatch01PrescriptionRules().length +
        getBatch01CarryoverRules().length,
      batch_02:
        getBatch02Principles().length +
        getBatch02ProgressionRules().length +
        getBatch02ExerciseSelectionRules().length +
        getBatch02ContraindicationRules().length +
        getBatch02MethodRules().length +
        getBatch02PrescriptionRules().length +
        getBatch02CarryoverRules().length,
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
  return out
}

export function getUploadedDoctrineProvenanceFor(
  atomId: string,
): Batch01Provenance | Batch02Provenance | null {
  return getBatch01ProvenanceFor(atomId) ?? getBatch02ProvenanceFor(atomId) ?? null
}
