# MASTER-8C.9 — Frequency-to-Slot Placement Preview Report

## Current Official Step
MASTER-8C.9

## Status
COMPLETE

## Summary
Created a pure read-only frequency-to-slot placement preview system that converts a selected frequency into concrete proposed placements across actual sessions/slots. When users select a non-zero frequency chip for a method, they now see exactly which days/exercises would receive the method — but nothing is saved or applied.

## Files Changed

### NEW: `lib/program/method-frequency-slot-placement-preview.ts` (537 lines)
- `FrequencySlotPlacementPreviewStatus` type — preview states
- `FrequencySlotPlacementReasonCode` type — reason codes
- `FrequencySlotPlacementTarget` interface — proposed placement details
- `FrequencySlotSkippedCandidate` interface — skipped slots with reasons
- `FrequencySlotPlacementPreview` interface — full preview output
- `buildFrequencySlotPlacementPreview()` — main builder function
- Consumes 8C.8 output (does not duplicate slot eligibility truth)

### MODIFIED: `components/programs/ProgramCoachIntelligenceHub.tsx`
- Added import for `buildFrequencySlotPlacementPreview` and `FrequencySlotPlacementPreview`
- Updated `SlotEligibilityFrequencyPreviewSection` to pass `program` to row components
- Updated `MethodFrequencyPreviewRow` to:
  - Accept `program` prop
  - Build placement preview when frequency > 0 is selected
  - Display proposed placements with session/exercise names
  - Show "Preview only · Not saved · Existing saved methods are separate"

## Files Intentionally NOT Touched
- `lib/adaptive-program-builder.ts`
- `lib/program-exercise-selector.ts`
- `lib/program/generator-knowledge-consumption-proof.ts`
- `lib/program/program-balance-readonly-analyzer.ts`
- Live workout runtime files
- Workout logging files
- Schema/migrations
- package.json / pnpm-lock.yaml
- Method Planner apply/revert/reset mutation functions

## Key Invariants (All Preserved)

| Invariant | Value |
|-----------|-------|
| mutationAllowedNow | `false` |
| selectionPersists | `false` |
| programChanged | `false` |
| existingSavedArtifactsAreSeparate | `true` |
| wouldMutateIfAppliedLater | `false` |
| appliedNow | `false` |

## Existing Saved Artifact Distinction
The implementation explicitly preserves the distinction:
- **Existing saved Method Planner artifacts** = Current program history (unchanged)
- **New frequency-planning placement** = Preview-only (not saved, not applied)

If Density Blocks appear in existing applied list, they remain there. The slot preview blocking NEW density placement does NOT remove existing saved artifacts.

## Method-by-Method Behavior

| Method | Status | Behavior |
|--------|--------|----------|
| Circuit | Caution | Can preview placements |
| Superset | Blocked | "Structural writer not implemented" |
| Density Block | Blocked | "Timed-window logging model required" |
| Top Set | Caution | Can preview placements |
| Backoff Sets | Caution | Can preview placements |
| Drop Sets | Eligible | Can preview placements |
| Rest-Pause | Eligible | Can preview placements |
| Cluster Sets | Caution | Can preview placements |
| Endurance/Conditioning | Blocked | "Real modality/exercise prescription required" |

## Placement Ranking Rules
1. Prefer high-confidence slots
2. Prefer different sessions before repeating (spacing)
3. Prefer slots not already method-owned
4. Avoid primary skill-sensitive rows
5. Prefer fewer caution reasons
6. Preserve session order for week distribution

## Build Results
- **TypeScript:** PASS (0 errors)
- **Build:** PASS

## UI Verification Location
Program Page → Coach Intelligence → Method Override Planner → Slot Eligibility & Frequency Preview → Select a non-zero frequency chip (e.g., "2x" for Drop Sets)

## Expected PASS Visual
- Selecting "2x" shows placement preview with:
  - "2 placements proposed · Preview only"
  - Day X — Exercise Name
  - "Standard sets → Drop Sets preview"
  - "Not saved · No program changes · Existing saved methods are separate"

## Expected FAIL Visual
- Selecting frequency changes actual program
- Placements are saved/persisted
- Existing Method Planner artifacts are removed

## Preservation Checks

| Check | Status |
|-------|--------|
| MASTER-8C.8 baseline visible | PRESERVED |
| Method Planner applied count | PRESERVED |
| Program Balance 20/20 | PRESERVED |
| Generator DB Consumption 20/20 | PRESERVED |
| Day card DB-INFORMED 3/3 | PRESERVED |
| Fake Conditioning Finisher guard | PRESERVED |
| Live workout runtime | PRESERVED |
| Existing saved artifacts | PRESERVED |

## Next Official Step (if PASS)
**MASTER-8C.10** — Controlled placement confirmation / mutation contract design (still not broad runtime mutation)
