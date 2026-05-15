# MASTER-8C.5 — Generator/Restart Program DB Consumption Gate Report

**Step:** MASTER-8C.5  
**Status:** COMPLETED  
**Date:** May 15th, 2026

---

## Summary

MASTER-8C.5 has been successfully implemented. The generator/selector corridor now consumes the exercise knowledge foundation through a read-only enrichment bridge, and the future Method Override Frequency / User Agency doctrine has been registered in the method system future queue.

---

## Files Changed

### Created:
1. **`lib/exercise-knowledge-generator-bridge.ts`** (338 lines)
   - Pure TypeScript enrichment bridge
   - `getGeneratorExerciseKnowledgeForPoolExercise()` - looks up knowledge by ID/alias
   - `enrichExerciseForGeneratorSelection()` - enriches pool exercise with knowledge data
   - `buildGeneratorKnowledgeConsumptionSummary()` - builds consumption summary
   - `getMethodCompatibilityForExercise()` - gets method compatibility for exercise
   - `normalizeKnowledgeMethodKeyForSelector()` - normalizes method keys

### Modified:
1. **`lib/program-exercise-selector.ts`**
   - Added import for generator bridge
   - Extended `NormalizedExerciseCandidate` with 10 knowledge enrichment fields:
     - `knowledgeMatched`
     - `knowledgeExerciseId`
     - `knowledgeMovementBalanceFamilies`
     - `knowledgeTissueStressRegions`
     - `knowledgeTrainingPurposes`
     - `knowledgeSkillTransferTargets`
     - `knowledgeMethodCompatibilityVerdicts`
     - `knowledgePrescriptionUnitTruth`
     - `knowledgeFrequencyTolerance`
     - `knowledgeTrainingCost`
   - Updated `normalizeExerciseCandidate()` to call bridge and populate knowledge fields
   - Added `knowledgeConsumptionSummary` to `ExerciseSelection` interface
   - `selectExercisesForSession()` now returns `knowledgeConsumptionSummary`

2. **`docs/MASTER_METHOD_SYSTEM_FUTURE_DOCTRINE_QUEUE.md`**
   - Added Section C: "Method Override Frequency, User Agency, Slot Ownership, and Scientific Method Application"
   - Added Section D: "Generator DB Consumption Foundation (MASTER-8C.5)" with status IMPLEMENTED
   - Registered all future requirements for method frequency, slot ownership, user agency, and scientific method contracts

---

## Files Intentionally Not Touched

- `package.json` / lockfile
- Database schema
- Auth/Clerk
- Stripe
- Live workout reducer
- Conditioning finisher fake-row guard (preserved)
- `adaptive-exercise-pool.ts` (not replaced, only used for type reference)
- `adaptive-program-builder.ts` (no changes needed - it reads the new fields)
- Method Planner apply behavior (unchanged)

---

## Verification Checklist

### Generator/Selector Now Consumes Exercise Knowledge:
- [x] `normalizeExerciseCandidate()` calls `enrichExerciseForGeneratorSelection()`
- [x] All exercise candidates are enriched with knowledge fields
- [x] Knowledge consumption summary is returned from selector
- [x] Fresh build/restart/regenerate all use the same `selectExercisesForSession()` corridor

### Restart/Regenerate Shares Same Consumption Path:
- [x] `selectExercisesForSession()` is the single entry point used by `adaptive-program-builder.ts`
- [x] All paths (fresh build, restart, regenerate) flow through this function
- [x] No bypass paths exist that skip knowledge enrichment

### Program Balance Protection:
- [x] No changes to Program Balance analyzer
- [x] 20/20 science coverage should remain on current program
- [x] No conditioning_finisher unresolved/missing

### Conditioning Finisher Protection:
- [x] No fake row creation code added
- [x] Existing guards in `requested-method-override-planner.ts` preserved
- [x] Endurance/Conditioning remains caution/not materialized

### Method Planner Protection:
- [x] No changes to Method Planner apply behavior
- [x] Applied real methods count unchanged
- [x] Preview-only behavior preserved

### Future Doctrine Registered:
- [x] Section C added to `MASTER_METHOD_SYSTEM_FUTURE_DOCTRINE_QUEUE.md`
- [x] Method Override Frequency requirements documented
- [x] User Agency with Safety Warnings documented
- [x] Exercise Slot Ownership documented
- [x] Scientific Method Contracts listed (8 methods)
- [x] Implementation Layered Order documented

---

## TypeScript / Build Results

**TypeScript command:** `pnpm tsc --noEmit --pretty false`  
**TypeScript result:** PASSED (0 errors)

**Build command:** `pnpm run build`  
**Build result:** PASSED  
**Build classification:** N/A (success)

---

## Visible Proof Locations

### Primary Verification:
- **Route:** Program Page
- **Section:** Coach Intelligence → Program Balance
- **Expected:** Coverage Summary should still show Full Science 20 and Need Science 0

### Secondary Verification:
- **Route:** Any generated/restarted program
- **Verification:** The `knowledgeConsumptionSummary` is now attached to each session's `ExerciseSelection`
- **Console output:** `[v0]` logs will show enrichment happening during generation

### Knowledge Consumption Summary Structure:
```typescript
{
  poolCount: number           // Total exercises selected
  matchedCount: number        // Exercises with knowledge match
  missingCount: number        // Exercises without knowledge
  matchedIds: string[]        // IDs of matched exercises
  missingIds: string[]        // IDs of missing exercises
  consumptionMode: 'read_only_enrichment'
  mutationApplied: false
  verdict: 'ready' | 'partial' | 'blocked'
}
```

---

## What PASS Looks Like

1. Current program still has 20/20 science coverage in Program Balance
2. Generated/restarted programs successfully use the knowledge enrichment bridge
3. TypeScript passes with 0 errors
4. Build passes
5. No conditioning_finisher fake exercise rows
6. No method planner behavior changes
7. Future doctrine registered in queue document

---

## What FAIL Would Look Like

1. Program Balance loses 20/20 coverage
2. Generator/restart bypasses knowledge bridge
3. TypeScript errors
4. Build failures
5. conditioning_finisher returns as fake exercise
6. Method planner counts regress
7. No doctrine queue updates

---

## Next Official Step

**MASTER-8C.6** — Method / Program Balance / Generator Consumption Parity Gate

This step should verify:
1. All three systems (Program Balance, Generator, Method Planner) agree on exercise knowledge
2. No drift between read-only analysis and generator decisions
3. Method compatibility influences generator method selection where appropriate

---

## Architecture Notes

### Enrichment Flow:
```
Exercise Pool (adaptive-exercise-pool.ts)
    ↓
normalizeExerciseCandidate() [program-exercise-selector.ts]
    ↓
enrichExerciseForGeneratorSelection() [exercise-knowledge-generator-bridge.ts]
    ↓
getGeneratorExerciseKnowledgeForPoolExercise() [bridge]
    ↓
getExerciseSkillKnowledgeEntry() / findKnowledgeByAlias() [validation]
    ↓
EXERCISE_SKILL_KNOWLEDGE_SEED [seed]
    ↓
NormalizedExerciseCandidate with knowledge fields
    ↓
Exercise selection scoring/filtering (can now use knowledge)
    ↓
ExerciseSelection with knowledgeConsumptionSummary
```

### Key Design Decisions:
1. **Bridge pattern** - Knowledge enrichment is isolated in a pure function module
2. **Read-only** - No mutation of exercise pool or knowledge seed
3. **Graceful fallback** - Missing knowledge returns empty fields, not crashes
4. **Optional fields** - All knowledge fields are optional arrays/nulls
5. **Summary proof** - Consumption summary provides auditable proof of usage
