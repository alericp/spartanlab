/**
 * Source-batch fallback registry.
 *
 * Each batch exports DB-row-shaped atom arrays + a counts helper. The runtime
 * contract consumes this registry only when the doctrine DB returns zero
 * atoms.
 */

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
