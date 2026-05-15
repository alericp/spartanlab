# MASTER-8C.4.G — Conditioning Finisher Method Artifact Classification Report

## Current Official Step
MASTER-8C.4.G — Repair gate inside MASTER-8C.4

## Why MASTER-8C.4.F Did Not Complete the Step
MASTER-8C.4.F fixed the synthetic `exercise-3` placeholder extraction, but live acceptance exposed a final unresolved ID: `conditioning_finisher`. The Program Balance coverage showed:
- Full Science: 20
- Need Science: 1
- Unresolved: `conditioning_finisher`

## Root Cause Analysis

### Was `conditioning_finisher` a Real Exercise?
**NO.** It is a method artifact created by `applyEnduranceConditioningFinisher()` in `lib/program/requested-method-override-planner.ts`.

### Was It a Method Artifact?
**YES.** The conditioning finisher is a session-ending conditioning method section, not a canonical exercise identity. It was inserted into `session.exercises[]` with these markers:
- `name: 'Conditioning Finisher'`
- `method: 'endurance_density'`
- `trainingMethod: 'endurance_density'`
- `isFinisher: true`
- `category: 'conditioning'`
- `methodLabel: 'Endurance/Conditioning Finisher'`

### Source File/Function
`lib/program/requested-method-override-planner.ts` → `applyEnduranceConditioningFinisher()`

### Why Seed/Pool Addition Was Rejected
Adding `conditioning_finisher` to the exercise science seed or adaptive pool would be fake science. It is not a real exercise with:
- Movement families
- Tissue stress regions
- Skill transfers
- Prescription units

It is a method/section placeholder awaiting future materialization into real modality choices.

---

## Contract Changes

### ProgramBalanceExerciseInput Fields Added
```typescript
readonly analysisRole?: 'exercise' | 'method_artifact'
readonly excludeFromExerciseKnowledgeCoverage?: boolean
readonly methodArtifactKind?: 'conditioning_finisher' | 'density_block' | 'unknown_method_artifact'
readonly methodArtifactLabel?: string
readonly methodArtifactReason?: string
```

### Method Artifact Summary Fields Added to KnowledgeCoverageSummary
```typescript
readonly methodArtifactCount?: number
readonly methodArtifactIds?: readonly string[]
readonly methodArtifactLabels?: readonly string[]
readonly totalAnalyzedItemCount?: number
readonly realExerciseCount?: number
```

### Backward Compatibility
All new fields are optional. Existing callers continue to work without modification.

---

## Coverage Before

| Metric | Value |
|--------|-------|
| Sessions | 6 |
| Work Items | 21 |
| Full Science | 20 |
| Need Science | 1 |
| Truly Unknown | 1 (`conditioning_finisher`) |
| Runtime Proof | `20+0 = 20/21` |

---

## Coverage After

| Metric | Value |
|--------|-------|
| Sessions | 6 |
| Real Exercises | 20 |
| Method Artifacts | 1 (Conditioning Finisher) |
| Full Science | 20 |
| Need Science | 0 |
| Truly Unknown | 0 |
| Runtime Proof | `20+0 = 20/20 +1m` |
| Full Science Coverage Complete | YES |
| Current Program Coverage Complete | YES |
| Future Candidate DB Gate Status | CLEARED (if this was the only blocker) |

---

## Program Page Finisher Display

### Old Display
- Row rendered like normal support exercise
- Showed prescription like `2 × 8–12` (confusing)
- Then showed generic panel with finisher instructions
- User could not tell it was a method section

### New Display
- Finisher panel uses distinct cyan color scheme
- Timer icon indicates time-based work
- Label: "Conditioning Finisher"
- Exec line: "Low-moderate intensity sustained work (5-8 min). Choose: row, bike, jump rope, or bodyweight circuit."
- Clearly distinguishable from straight-set exercises

### Full Future Finisher Engine
DEFERRED — see `docs/MASTER_METHOD_SYSTEM_FUTURE_DOCTRINE_QUEUE.md`

---

## Preserved Behaviors

| Area | Status |
|------|--------|
| Read-only / No Mutation | ✅ Preserved |
| Method Planner Protected | ✅ Preserved |
| Generator Untouched | ✅ Preserved |
| Restart Untouched | ✅ Preserved |
| Live Workout Untouched | ✅ Preserved |

---

## Files Changed

1. `lib/program/program-balance-intelligence-contract.ts`
   - Added method artifact classification fields to `ProgramBalanceExerciseInput`
   - Added method artifact tracking fields to `ProgramBalanceKnowledgeCoverageSummary`

2. `lib/program/program-balance-ui-adapter.ts`
   - Added `isConditioningFinisherArtifact()` detection helper
   - Updated `extractExerciseInput()` to mark finisher artifacts with method artifact classification

3. `lib/program/program-balance-readonly-analyzer.ts`
   - Updated `summarizeProgramBalanceKnowledgeCoverage()` to accept original inputs
   - Added logic to separate method artifacts from real exercises
   - Method artifacts excluded from exercise science coverage calculations

4. `components/programs/ProgramCoachIntelligenceHub.tsx`
   - Updated Coverage Summary to show method artifact exclusion
   - Changed "Exercises" to "Work Items" with method artifact breakdown
   - Added "Method artifact excluded: Conditioning Finisher" notice
   - Updated runtime proof line to show method artifact count

5. `components/programs/AdaptiveSessionCard.tsx`
   - Added finisher variant to panel color/icon mapping (cyan theme)

6. `docs/MASTER_METHOD_SYSTEM_FUTURE_DOCTRINE_QUEUE.md`
   - Created future doctrine queue for conditioning finisher and density block engines

7. `docs/MASTER_8C_4_G_CONDITIONING_FINISHER_METHOD_ARTIFACT_REPORT.md`
   - This report

---

## Files Intentionally Not Touched

- `lib/program/exercise-skill-knowledge-seed.ts` — No fake science entry
- `lib/adaptive-exercise-pool.ts` — No fake pool entry
- Generator files — No changes
- Restart/generate route files — No changes
- Live workout runtime files — No changes
- Method Planner apply/reset files — No changes
- Prisma/schema files — No changes
- Package files — No changes
- Stripe/Clerk/auth/env files — No changes

---

## Build Verification

**TypeScript Command:** `pnpm tsc --noEmit --pretty false`
**TypeScript Result:** PASS (0 errors)

**Build Command:** `pnpm run build`
**Build Result:** PASS (successful build)

**Deployment Safe:** YES

---

## Exact UI Verification

### A. Program Balance Verification

**App Route:** Live app → Program page
**Section:** Coach Intelligence → Program Balance

**What Should Be Gone:**
- `Unresolved: conditioning_finisher`
- `Need science: conditioning_finisher`
- `1 exercise(s) not found in any app source.`
- False Missing Data warning caused by finisher

**What Should Be Visible:**
- "Method artifact excluded: Conditioning Finisher"
- Need Science: 0
- Work Items: 20 +1 method
- Runtime proof: `20+0 = 20/20 +1m`
- Read-only / No mutation badges

### B. Program Page Finisher Display Verification

**App Route:** Live app → Program page
**Section:** Open session with Conditioning Finisher

**What Should Be Gone:**
- Fake straight-set prescription display for finisher
- Confusing `2 × 8–12` style numbers

**What Should Be Visible:**
- Cyan-colored finisher panel
- Timer icon
- "Conditioning Finisher" label
- "Low-moderate intensity sustained work (5-8 min)..." instruction
- Clear method section appearance

---

## Remaining Blockers
None for MASTER-8C.4.G scope.

## Next Official Step (If This Passes)
MASTER-8C.5 — Generator / Restart Program DB Consumption Gate
