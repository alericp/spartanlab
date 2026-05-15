# MASTER-8C.8 — Slot Eligibility Scoring + Frequency Selection UI Preview

## Current Official Step
MASTER-8C.8

## Status
**COMPLETE**

## Summary

Created a read-only slot eligibility and frequency preview layer that:
- Scores each method family against actual program sessions/exercise slots
- Computes safe preview-only frequency bounds per method
- Displays compact UI in Method Override Planner sheet
- Does NOT mutate the program or persist any selections

## Files Changed

### New Files
1. **`lib/program/method-slot-eligibility-frequency-planner.ts`** (609 lines)
   - Types: `MethodSlotEligibilityStatus`, `MethodFrequencyPreviewStatus`, `SlotKind`, etc.
   - `isMethodSlotEligibleTrainingExercise()` - filters non-training artifacts
   - `scoreSessionForCircuit()` - scores grouped method slots
   - `scoreSessionForRowLevelMethod()` - scores row-level method slots
   - `buildMethodFrequencyPreview()` - builds preview for single method
   - `buildMethodSlotEligibilityFrequencyPlan()` - main planner function

### Modified Files
2. **`components/programs/ProgramCoachIntelligenceHub.tsx`**
   - Added import for slot planner
   - Added `SlotEligibilityFrequencyPreviewSection` component
   - Added `MethodFrequencyPreviewRow` component
   - Added section to Method Override Planner sheet render

## Files Intentionally Not Touched
- `lib/adaptive-program-builder.ts`
- `lib/program-exercise-selector.ts`
- `lib/program/generator-knowledge-consumption-proof.ts`
- `lib/program/program-balance-readonly-analyzer.ts`
- `lib/program/method-contract-slot-frequency-inventory.ts` (consumed, not modified)
- Live workout runtime files
- Workout logging files
- Schema/migrations
- Package.json

## Build Results
- **TypeScript:** PASS (0 errors)
- **Build:** PASS

## Method Eligibility Summary

| Method | Category | Eligibility | Frequency Status |
|--------|----------|-------------|------------------|
| Circuit | grouped_structural | eligible | selectable_preview_only |
| Superset | grouped_structural | blocked | blocked (no writer) |
| Density Block | grouped_structural | blocked | blocked (timed logging) |
| Top Set | row_level | eligible | selectable_preview_only |
| Backoff Sets | row_level | eligible | selectable_preview_only |
| Drop Set | row_level | eligible_with_caution | selectable_preview_only |
| Rest-Pause | row_level | eligible_with_caution | selectable_preview_only |
| Cluster | row_level | eligible | selectable_preview_only |
| Endurance/Conditioning | session_finisher | blocked | blocked (no prescription) |
| Prescription Rest | prescription_modifier | inventory_only | not_supported_yet |
| Prescription RPE | prescription_modifier | inventory_only | not_supported_yet |
| Straight Sets | row_level | not_applicable | not_supported_yet |

## Key Invariants Preserved

| Check | Status |
|-------|--------|
| mutationAllowedNow | false |
| frequencySelectionsPersist | false |
| programChanged | false |
| Method Planner apply behavior | UNCHANGED |
| Program Balance 20/20 | PRESERVED |
| Generator DB Consumption 20/20 | PRESERVED |
| Day card DB-INFORMED 3/3 | PRESERVED |
| Fake Conditioning Finisher | EXCLUDED |
| Live workout runtime | UNCHANGED |

## UI Verification

### Location
Program Page → Coach Intelligence → Method Override Planner → "Slot Eligibility & Frequency Preview" section

### Expected Visual Elements
- "Preview only" badge
- "Not saved" badge  
- Eligible/blocked method counts
- Method rows with:
  - Status chip (Eligible/Caution/Blocked)
  - Frequency selection chips (0x, 1x, 2x, etc.) for eligible methods
  - Blocked reason for blocked methods
  - Session/slot counts
- Clear disclaimer: "Preview only — no program changes applied"
- Mutation status: "0 methods", "Selections persist: No", "Program changed: No"

## Blocked Methods and Reasons

1. **Superset**: No structural writer implemented yet
2. **Density Block**: Timed-window logging model required
3. **Endurance/Conditioning**: Synthetic placeholder only — no real exercise prescription yet

## Next Official Step (if PASS)
**MASTER-8C.9** — Implement frequency-to-slot planning preview or controlled method placement preview
