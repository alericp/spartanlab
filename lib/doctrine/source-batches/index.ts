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

// Batch 04 — added in Batch 4 ingestion pass.
export {
  getBatch04Sources,
  getBatch04Principles,
  getBatch04ProgressionRules,
  getBatch04ExerciseSelectionRules,
  getBatch04ContraindicationRules,
  getBatch04MethodRules,
  getBatch04PrescriptionRules,
  getBatch04CarryoverRules,
  getBatch04Counts,
  getBatch04CountsBySource,
  getBatch04ProvenanceFor,
  type Batch04Provenance,
} from "./batch-04-uploaded-pdf-doctrine"

// Batch 05 — added in Batch 5 ingestion pass.
export {
  getBatch05Sources,
  getBatch05Principles,
  getBatch05ProgressionRules,
  getBatch05ExerciseSelectionRules,
  getBatch05ContraindicationRules,
  getBatch05MethodRules,
  getBatch05PrescriptionRules,
  getBatch05CarryoverRules,
  getBatch05Counts,
  getBatch05CountsBySource,
  getBatch05ProvenanceFor,
  type Batch05Provenance,
} from "./batch-05-uploaded-pdf-doctrine"

// Batch 06 — added in Batch 6 ingestion pass (OTZ Beginner/Intermediate, Davai
// Iron Cross, OTZ Full Planche, Davai/Flolit Front Lever, Lyan Muscle-Up, plus
// the Legal Advanced-Skill Source Gate governance source).
export {
  getBatch06Sources,
  getBatch06Principles,
  getBatch06ProgressionRules,
  getBatch06ExerciseSelectionRules,
  getBatch06ContraindicationRules,
  getBatch06MethodRules,
  getBatch06PrescriptionRules,
  getBatch06CarryoverRules,
  getBatch06Counts,
  getBatch06CountsBySource,
  getBatch06ProvenanceFor,
  BATCH_06_INACTIVE_ADVANCED_CANDIDATES,
  isLegallyActiveSourceStatus,
  type Batch06Provenance,
  type SourceLegalityStatus,
  type InactiveAdvancedSourceCandidate,
} from "./batch-06-uploaded-pdf-doctrine"

// Batch 07 — added in Batch 7 ingestion pass: lower-body skill/strength
// (pistol, dragon, hinge, hypertrophy), calisthenics-skill leg-dose
// interference rules, and military/tactical fitness doctrine across Army
// AFT/ACFT-style, Marine PFT/CFT, Navy PRT, Air Force/Space Force PFA,
// rucking/load carriage, tactical running engine, and tactical calisthenics
// endurance. Legal-source: public branch standards + original synthesis;
// no leaked/pirated material.
export {
  getBatch07Sources,
  getBatch07Principles,
  getBatch07ProgressionRules,
  getBatch07ExerciseSelectionRules,
  getBatch07ContraindicationRules,
  getBatch07MethodRules,
  getBatch07PrescriptionRules,
  getBatch07CarryoverRules,
  getBatch07Counts,
  getBatch07CountsBySource,
  getBatch07ProvenanceFor,
  BATCH_07_INACTIVE_ADVANCED_CANDIDATES,
  type Batch07Provenance,
  type LegTrainingPreference,
  type LowerBodySkillKey,
  type MilitaryTrainingGoal,
  type MilitaryEventPriority,
} from "./batch-07-lower-body-military-doctrine"

// Batch 08 — added in Batch 8 ingestion pass: elite rings + advanced
// calisthenics gap-fill (Victorian, Maltese, OAFL, OABL, FL row, OAFL row,
// planche pushup, full planche pushup, press-to-planche, Azarian, Nakayama,
// archer pull/push pathways, rings transition strength) + the
// ADVANCED_SKILL_SUPPORT_MATRIX truth-classification layer. Legal-source:
// FIG public docs + public creator content paraphrased + original synthesis;
// no leaked/pirated material; source-gap recorded honestly per skill.
export {
  getBatch08Sources,
  getBatch08Principles,
  getBatch08ProgressionRules,
  getBatch08ExerciseSelectionRules,
  getBatch08ContraindicationRules,
  getBatch08MethodRules,
  getBatch08PrescriptionRules,
  getBatch08CarryoverRules,
  getBatch08Counts,
  getBatch08CountsBySource,
  getBatch08ProvenanceFor,
  BATCH_08_INACTIVE_ADVANCED_CANDIDATES,
  ADVANCED_SKILL_SUPPORT_MATRIX,
  type Batch08Provenance,
  type AdvancedSkillKey,
  type AdvancedSkillFamily,
  type AdvancedSkillSupportLevel,
  type AdvancedSourceConfidence,
  type DoctrineStrength,
  type ContraindicationLevel,
  type AdvancedSkillSupportEntry,
} from "./batch-08-elite-rings-advanced-calisthenics-doctrine"

// Batch 09 — added in Batch 9 ingestion pass: mobility / flexibility /
// warm-up / cooldown / skill-specific ramp-up + the FLEXIBILITY_GOAL_SUPPORT_MATRIX
// truth-classification layer (side split, middle split, front split, pancake,
// toe touch, hamstring/hip-flexor/adductor flexibility, shoulder/wrist/thoracic/
// ankle/squat/overhead/handstand mobility, planche wrist prep, FL scap prep,
// BL shoulder-extension prep). User-preferred 3×15s short-round protocol marked
// USER_AUTHORED_VERIFIED based on existing encoding in skill-progression-rules,
// range-training-system, training-principles-engine, adaptive-exercise-pool, and
// skill-audit-system has3Rounds validator. Legal-source: SpartanLab user-authored
// doctrine + general training physiology consensus + original synthesis.
export {
  getBatch09Sources,
  getBatch09Principles,
  getBatch09ProgressionRules,
  getBatch09ExerciseSelectionRules,
  getBatch09ContraindicationRules,
  getBatch09MethodRules,
  getBatch09PrescriptionRules,
  getBatch09CarryoverRules,
  getBatch09Counts,
  getBatch09CountsBySource,
  getBatch09ProvenanceFor,
  FLEXIBILITY_GOAL_SUPPORT_MATRIX,
  type Batch09Provenance,
  type FlexibilityGoalKey,
  type FlexibilityPhase,
  type FlexibilityPlacement,
  type FlexibilitySourceConfidence,
  type FlexibilityGoalSupportEntry,
} from "./batch-09-mobility-flexibility-warmup-cooldown-doctrine"

// Batch 10 — added in Batch 10 ingestion pass: training method decision
// governor (top set / back-off / drop set / mechanical drop / rest-pause /
// cluster / antagonist + same-muscle superset / circuit / density block /
// repeat-effort endurance / EMOM / AMRAP) + per-method rejection rules +
// METHOD_COMPATIBILITY_MATRIX (12 methods × 8 exercise categories) +
// fatigue/recovery gating + time-constrained compression + user override
// warning logic + method materialization truth guard. Reinforces existing
// session-shape profiles in lib/doctrine/method-profile-registry.ts and
// existing density/endurance engines without rewriting them. Legal-source:
// public evidence-informed strength-and-conditioning principles +
// SpartanLab user-authored coaching doctrine (clearly marked) +
// codebase-observed runtime (clearly marked).
export {
  getBatch10Sources,
  getBatch10Principles,
  getBatch10ProgressionRules,
  getBatch10ExerciseSelectionRules,
  getBatch10ContraindicationRules,
  getBatch10MethodRules,
  getBatch10PrescriptionRules,
  getBatch10CarryoverRules,
  getBatch10Counts,
  getBatch10CountsBySource,
  getBatch10ProvenanceFor,
  METHOD_COMPATIBILITY_MATRIX,
  type Batch10Provenance,
  type MethodKey,
  type ExerciseCategoryKey,
  type MethodCompatibilityLevel,
  type MethodSourceConfidence,
  type MethodCompatibilityEntry,
} from "./batch-10-training-method-decision-governor-doctrine"

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

import {
  getBatch04Sources,
  getBatch04Principles,
  getBatch04ProgressionRules,
  getBatch04ExerciseSelectionRules,
  getBatch04ContraindicationRules,
  getBatch04MethodRules,
  getBatch04PrescriptionRules,
  getBatch04CarryoverRules,
  getBatch04CountsBySource,
  getBatch04ProvenanceFor,
  type Batch04Provenance,
} from "./batch-04-uploaded-pdf-doctrine"

import {
  getBatch05Sources,
  getBatch05Principles,
  getBatch05ProgressionRules,
  getBatch05ExerciseSelectionRules,
  getBatch05ContraindicationRules,
  getBatch05MethodRules,
  getBatch05PrescriptionRules,
  getBatch05CarryoverRules,
  getBatch05CountsBySource,
  getBatch05ProvenanceFor,
  type Batch05Provenance,
} from "./batch-05-uploaded-pdf-doctrine"

import {
  getBatch06Sources,
  getBatch06Principles,
  getBatch06ProgressionRules,
  getBatch06ExerciseSelectionRules,
  getBatch06ContraindicationRules,
  getBatch06MethodRules,
  getBatch06PrescriptionRules,
  getBatch06CarryoverRules,
  getBatch06CountsBySource,
  getBatch06ProvenanceFor,
  type Batch06Provenance,
} from "./batch-06-uploaded-pdf-doctrine"

import {
  getBatch07Sources,
  getBatch07Principles,
  getBatch07ProgressionRules,
  getBatch07ExerciseSelectionRules,
  getBatch07ContraindicationRules,
  getBatch07MethodRules,
  getBatch07PrescriptionRules,
  getBatch07CarryoverRules,
  getBatch07CountsBySource,
  getBatch07ProvenanceFor,
  type Batch07Provenance,
} from "./batch-07-lower-body-military-doctrine"

import {
  getBatch08Sources,
  getBatch08Principles,
  getBatch08ProgressionRules,
  getBatch08ExerciseSelectionRules,
  getBatch08ContraindicationRules,
  getBatch08MethodRules,
  getBatch08PrescriptionRules,
  getBatch08CarryoverRules,
  getBatch08CountsBySource,
  getBatch08ProvenanceFor,
  type Batch08Provenance,
} from "./batch-08-elite-rings-advanced-calisthenics-doctrine"

import {
  getBatch09Sources,
  getBatch09Principles,
  getBatch09ProgressionRules,
  getBatch09ExerciseSelectionRules,
  getBatch09ContraindicationRules,
  getBatch09MethodRules,
  getBatch09PrescriptionRules,
  getBatch09CarryoverRules,
  getBatch09CountsBySource,
  getBatch09ProvenanceFor,
  type Batch09Provenance,
} from "./batch-09-mobility-flexibility-warmup-cooldown-doctrine"

import {
  getBatch10Sources,
  getBatch10Principles,
  getBatch10ProgressionRules,
  getBatch10ExerciseSelectionRules,
  getBatch10ContraindicationRules,
  getBatch10MethodRules,
  getBatch10PrescriptionRules,
  getBatch10CarryoverRules,
  getBatch10CountsBySource,
  getBatch10ProvenanceFor,
  type Batch10Provenance,
} from "./batch-10-training-method-decision-governor-doctrine"

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

const BATCHES = ["batch_01", "batch_02", "batch_03", "batch_04", "batch_05", "batch_06", "batch_07", "batch_08", "batch_09", "batch_10"] as const
export type UploadedDoctrineBatchKey = (typeof BATCHES)[number]

export function getUploadedDoctrineBatchKeys(): readonly UploadedDoctrineBatchKey[] {
  return BATCHES
}

export function getUploadedDoctrineBatchSources(): DoctrineSource[] {
  return [
    ...getBatch01Sources(),
    ...getBatch02Sources(),
    ...getBatch03Sources(),
    ...getBatch04Sources(),
    ...getBatch05Sources(),
    ...getBatch06Sources(),
    ...getBatch07Sources(),
    ...getBatch08Sources(),
    ...getBatch09Sources(),
    ...getBatch10Sources(),
  ]
}

export function getUploadedDoctrineBatchPrinciples(): DoctrinePrinciple[] {
  return [
    ...getBatch01Principles(),
    ...getBatch02Principles(),
    ...getBatch03Principles(),
    ...getBatch04Principles(),
    ...getBatch05Principles(),
    ...getBatch06Principles(),
    ...getBatch07Principles(),
    ...getBatch08Principles(),
    ...getBatch09Principles(),
    ...getBatch10Principles(),
  ]
}

export function getUploadedDoctrineBatchProgressionRules(): ProgressionRule[] {
  return [
    ...getBatch01ProgressionRules(),
    ...getBatch02ProgressionRules(),
    ...getBatch03ProgressionRules(),
    ...getBatch04ProgressionRules(),
    ...getBatch05ProgressionRules(),
    ...getBatch06ProgressionRules(),
    ...getBatch07ProgressionRules(),
    ...getBatch08ProgressionRules(),
    ...getBatch09ProgressionRules(),
    ...getBatch10ProgressionRules(),
  ]
}

export function getUploadedDoctrineBatchExerciseSelectionRules(): ExerciseSelectionRule[] {
  return [
    ...getBatch01ExerciseSelectionRules(),
    ...getBatch02ExerciseSelectionRules(),
    ...getBatch03ExerciseSelectionRules(),
    ...getBatch04ExerciseSelectionRules(),
    ...getBatch05ExerciseSelectionRules(),
    ...getBatch06ExerciseSelectionRules(),
    ...getBatch07ExerciseSelectionRules(),
    ...getBatch08ExerciseSelectionRules(),
    ...getBatch09ExerciseSelectionRules(),
    ...getBatch10ExerciseSelectionRules(),
  ]
}

// ContraindicationRule is not exported from doctrine-db.ts; keep loose union
// so this helper exists for future readers without forcing a schema rewrite.
export function getUploadedDoctrineBatchContraindicationRules(): unknown[] {
  return [
    ...getBatch01ContraindicationRules(),
    ...getBatch02ContraindicationRules(),
    ...getBatch03ContraindicationRules(),
    ...getBatch04ContraindicationRules(),
    ...getBatch05ContraindicationRules(),
    ...getBatch06ContraindicationRules(),
    ...getBatch07ContraindicationRules(),
    ...getBatch08ContraindicationRules(),
    ...getBatch09ContraindicationRules(),
    ...getBatch10ContraindicationRules(),
  ]
}

export function getUploadedDoctrineBatchMethodRules(): MethodRule[] {
  return [
    ...getBatch01MethodRules(),
    ...getBatch02MethodRules(),
    ...getBatch03MethodRules(),
    ...getBatch04MethodRules(),
    ...getBatch05MethodRules(),
    ...getBatch06MethodRules(),
    ...getBatch07MethodRules(),
    ...getBatch08MethodRules(),
    ...getBatch09MethodRules(),
    ...getBatch10MethodRules(),
  ]
}

export function getUploadedDoctrineBatchPrescriptionRules(): PrescriptionRule[] {
  return [
    ...getBatch01PrescriptionRules(),
    ...getBatch02PrescriptionRules(),
    ...getBatch03PrescriptionRules(),
    ...getBatch04PrescriptionRules(),
    ...getBatch05PrescriptionRules(),
    ...getBatch06PrescriptionRules(),
    ...getBatch07PrescriptionRules(),
    ...getBatch08PrescriptionRules(),
    ...getBatch09PrescriptionRules(),
    ...getBatch10PrescriptionRules(),
  ]
}

export function getUploadedDoctrineBatchCarryoverRules(): CarryoverRule[] {
  // Batches return CarryoverRule-shaped objects (Batch 02/04/05/06/07/08/09 use
  // looser typing — kept compatible via structural cast for downstream
  // coverage).
  return [
    ...(getBatch01CarryoverRules() as CarryoverRule[]),
    ...(getBatch02CarryoverRules() as unknown as CarryoverRule[]),
    ...(getBatch03CarryoverRules() as CarryoverRule[]),
    ...(getBatch04CarryoverRules() as unknown as CarryoverRule[]),
    ...(getBatch05CarryoverRules() as unknown as CarryoverRule[]),
    ...(getBatch06CarryoverRules() as unknown as CarryoverRule[]),
    ...(getBatch07CarryoverRules() as unknown as CarryoverRule[]),
    ...(getBatch08CarryoverRules() as unknown as CarryoverRule[]),
    ...(getBatch09CarryoverRules() as unknown as CarryoverRule[]),
    ...(getBatch10CarryoverRules() as unknown as CarryoverRule[]),
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
      batch_04: batchAtomCount(
        getBatch04Principles().length,
        getBatch04ProgressionRules().length,
        getBatch04ExerciseSelectionRules().length,
        getBatch04ContraindicationRules().length,
        getBatch04MethodRules().length,
        getBatch04PrescriptionRules().length,
        getBatch04CarryoverRules().length,
      ),
      batch_05: batchAtomCount(
        getBatch05Principles().length,
        getBatch05ProgressionRules().length,
        getBatch05ExerciseSelectionRules().length,
        getBatch05ContraindicationRules().length,
        getBatch05MethodRules().length,
        getBatch05PrescriptionRules().length,
        getBatch05CarryoverRules().length,
      ),
      batch_06: batchAtomCount(
        getBatch06Principles().length,
        getBatch06ProgressionRules().length,
        getBatch06ExerciseSelectionRules().length,
        getBatch06ContraindicationRules().length,
        getBatch06MethodRules().length,
        getBatch06PrescriptionRules().length,
        getBatch06CarryoverRules().length,
      ),
      batch_07: batchAtomCount(
        getBatch07Principles().length,
        getBatch07ProgressionRules().length,
        getBatch07ExerciseSelectionRules().length,
        getBatch07ContraindicationRules().length,
        getBatch07MethodRules().length,
        getBatch07PrescriptionRules().length,
        getBatch07CarryoverRules().length,
      ),
      batch_08: batchAtomCount(
        getBatch08Principles().length,
        getBatch08ProgressionRules().length,
        getBatch08ExerciseSelectionRules().length,
        getBatch08ContraindicationRules().length,
        getBatch08MethodRules().length,
        getBatch08PrescriptionRules().length,
        getBatch08CarryoverRules().length,
      ),
      batch_09: batchAtomCount(
        getBatch09Principles().length,
        getBatch09ProgressionRules().length,
        getBatch09ExerciseSelectionRules().length,
        getBatch09ContraindicationRules().length,
        getBatch09MethodRules().length,
        getBatch09PrescriptionRules().length,
        getBatch09CarryoverRules().length,
      ),
      batch_10: batchAtomCount(
        getBatch10Principles().length,
        getBatch10ProgressionRules().length,
        getBatch10ExerciseSelectionRules().length,
        getBatch10ContraindicationRules().length,
        getBatch10MethodRules().length,
        getBatch10PrescriptionRules().length,
        getBatch10CarryoverRules().length,
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
  for (const [k, v] of Object.entries(getBatch04CountsBySource())) {
    out[k] = (out[k] ?? 0) + v
  }
  for (const [k, v] of Object.entries(getBatch05CountsBySource())) {
    out[k] = (out[k] ?? 0) + v
  }
  for (const [k, v] of Object.entries(getBatch06CountsBySource())) {
    out[k] = (out[k] ?? 0) + v
  }
  for (const [k, v] of Object.entries(getBatch07CountsBySource())) {
    out[k] = (out[k] ?? 0) + v
  }
  for (const [k, v] of Object.entries(getBatch08CountsBySource())) {
    out[k] = (out[k] ?? 0) + v
  }
  for (const [k, v] of Object.entries(getBatch09CountsBySource())) {
    out[k] = (out[k] ?? 0) + v
  }
  for (const [k, v] of Object.entries(getBatch10CountsBySource())) {
    out[k] = (out[k] ?? 0) + v
  }
  return out
}

export function getUploadedDoctrineProvenanceFor(
  atomId: string,
):
  | Batch01Provenance
  | Batch02Provenance
  | Batch03Provenance
  | Batch04Provenance
  | Batch05Provenance
  | Batch06Provenance
  | Batch07Provenance
  | Batch08Provenance
  | Batch09Provenance
  | Batch10Provenance
  | null {
  return (
    getBatch01ProvenanceFor(atomId) ??
    getBatch02ProvenanceFor(atomId) ??
    getBatch03ProvenanceFor(atomId) ??
    getBatch04ProvenanceFor(atomId) ??
    getBatch05ProvenanceFor(atomId) ??
    getBatch06ProvenanceFor(atomId) ??
    getBatch07ProvenanceFor(atomId) ??
    getBatch08ProvenanceFor(atomId) ??
    getBatch09ProvenanceFor(atomId) ??
    getBatch10ProvenanceFor(atomId) ??
    null
  )
}
