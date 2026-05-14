# MASTER-8B.2 — Exercise & Skill Knowledge Schema Report

**Step:** MASTER-8B.2  
**Status:** COMPLETE  
**Date:** May 14th, 2026

---

## Summary

Created the max-intent exercise and skill knowledge foundation that future Program Balance, Adaptive Foundation, Coach Recs, Plan Logic, Method Decisions, future-session mutation, and live workout guidance can safely consume.

This is a **foundation/knowledge schema step** — NOT a generator wiring step, NOT a mutation step, NOT a UI change.

---

## Files Changed

### New Files Created

1. **`lib/program/exercise-skill-knowledge-contract.ts`** (568 lines)
   - Complete typed contract for exercise/skill knowledge
   - Defines identity, taxonomy, training purpose, skill transfer, movement balance, tissue stress, frequency tolerance, method compatibility, progression relationships, warm-up/cooldown needs, user ability gates
   - Pure TypeScript, side-effect free, no React/UI imports

2. **`lib/program/exercise-skill-knowledge-seed.ts`** (1206 lines)
   - Initial seed data using ACTUAL exercise IDs from `adaptive-exercise-pool.ts`
   - 14 exercises seeded with full profiles
   - 8 skills seeded with balance requirements
   - Planche Lean / Push-Up taxonomy correctly separated
   - Weighted Pull-Up and Weighted Dip marked as strength anchors

3. **`lib/program/exercise-skill-knowledge-validation.ts`** (521 lines)
   - Deterministic validation helpers
   - `validateExerciseSkillKnowledgeSeed()` - validates internal coherence
   - `getKnowledgeCoverageSummary()` - returns coverage statistics
   - `getUserCriticalKnowledgeCoverage()` - checks critical skill/exercise coverage
   - `checkPlancheLeanPushUpTaxonomy()` - verifies hold/rep separation
   - `checkWeightedAnchorRepresentation()` - verifies anchor markers

### Files Updated

1. **`lib/program/true-source-registry.ts`**
   - Updated `exercise_skill_knowledge_base` entry:
     - `currentStatus`: `'active_partial'` → `'read_only_active'`
     - `currentOwnerFiles`: Added new contract/seed/validation files
     - `currentSourceSummary`: Updated to reflect B2 completion
     - `readiness`: `'needs_knowledge_schema'` → `'ready_for_read_only_consumption'`
     - `nextAllowedAction`: Updated to point to MASTER-8B.3

2. **`docs/OFFICIAL_CHECKLIST_MAY_14_2026.md`** (to be updated)

---

## Files Intentionally NOT Touched

- `app/(app)/program/page.tsx`
- `app/(app)/workout/session/page.tsx`
- `components/programs/ProgramCoachIntelligenceHub.tsx`
- `components/programs/AdaptiveProgramDisplay.tsx`
- `components/programs/AdaptiveSessionCard.tsx`
- `components/workout/StreamlinedWorkoutSession.tsx`
- `lib/adaptive-program-builder.ts`
- `lib/server/authoritative-program-generation.ts`
- `lib/active-week-mutation-service.ts`
- `lib/program/requested-method-override-planner.ts`
- `lib/program/method-override-artifacts.ts`
- `package.json`
- `pnpm-lock.yaml`
- Database schema/migration files
- Auth/billing/Stripe/Clerk/Neon files

---

## Existing Source Files Audited

- `lib/adaptive-exercise-pool.ts` - Exercise IDs and types
- `lib/movement-family-registry.ts` - MovementFamily, TrainingIntent, SkillCarryover types
- `lib/skills.ts` - Skill definitions and IDs
- `lib/program/true-source-registry.ts` - Registry structure
- `lib/exercise-classification-registry.ts`
- `lib/doctrine-db.ts`
- `lib/program/exercise-prescription-unit-truth.ts`
- `lib/program/exercise-level-coaching-guidance.ts`
- `lib/skill-progression-graph-engine.ts`
- `lib/advanced-skill-progression-graphs.ts`

---

## Knowledge Seed Coverage

### Seeded Exercises (14)

| Exercise ID | Canonical Name | Unit | Anchor? |
|------------|----------------|------|---------|
| `weighted_pull_up` | Weighted Pull-Up | reps | ✅ Yes |
| `weighted_dip` | Weighted Dip | reps | ✅ Yes |
| `planche_lean` | Planche Lean | **seconds** | No |
| `tuck_planche` | Tuck Planche | seconds | No |
| `tuck_planche_pushup` | Tuck Planche Push-Up | **reps** | No |
| `pull_up` | Pull-Up | reps | No |
| `tuck_fl` | Tuck Front Lever | seconds | No |
| `l_sit_skill` | L-Sit | seconds | No |
| `dragon_flag` | Dragon Flag | reps | No |
| `hollow_body` | Hollow Body Hold | seconds | No |
| `dip` | Parallel Bar Dip | reps | No |
| `wall_hspu` | Wall Handstand Push-Up | reps | No |
| `pike_pushup` | Pike Push-Up | reps | No |

### Seeded Skills (8)

| Skill ID | Canonical Name | Family | Balance Requirements |
|----------|----------------|--------|---------------------|
| `planche` | Planche | push | straight_arm_push, vertical_pull, compression_core |
| `front_lever` | Front Lever | pull | straight_arm_pull, horizontal_push, anti_extension_core |
| `back_lever` | Back Lever | pull | straight_arm_pull, horizontal_push |
| `hspu` | Handstand Push-Up | push | vertical_push, vertical_pull |
| `muscle_up` | Muscle-Up | transition | explosive_pull, dip_pattern, vertical_pull |
| `one_arm_pull_up` | One Arm Pull-Up | pull | vertical_pull, grip, horizontal_push |
| `l_sit` | L-Sit | compression | compression_core |
| `v_sit` | V-Sit | compression | compression_core |

---

## Critical Taxonomy Handling

### Planche Lean vs Push-Up

**Problem:** "Planche Lean Push-Ups" was ambiguous — could be static hold or dynamic exercise.

**Solution:**
- `planche_lean` (ID: `planche_lean`)
  - `prescriptionUnit: 'seconds'`
  - `isIsometric: true`
  - `modalities: ['static_hold', 'skill_drill']`
  - `forbiddenInterpretations: ['Must NOT be displayed as a push-up variant', 'Must NOT use rep counts']`

- `tuck_planche_pushup` (ID: `tuck_planche_pushup`)
  - `prescriptionUnit: 'reps'`
  - `isIsometric: false`
  - `modalities: ['dynamic_reps']`
  - `aliases: ['Pseudo Planche Push-Up', 'PPPU', 'Planche Lean Push-Up']`

**Validation:** `checkPlancheLeanPushUpTaxonomy()` returns `{ handled: true }` confirming separation.

### Weighted Strength Anchors

**Problem:** Programs could lose critical weighted anchors in balance adjustments.

**Solution:**
- Both `weighted_pull_up` and `weighted_dip` have:
  - `weightedStrengthAnchor: true`
  - Full `skillTransfers` profiles
  - `trainingCost` profiles with high neural/tendon costs
  - `forbiddenInterpretations` preventing daily programming

**Validation:** `checkWeightedAnchorRepresentation()` returns `{ bothAnchorsMarked: true }`.

---

## What Each File Provides

### Contract File (`exercise-skill-knowledge-contract.ts`)

**Types defined:**
- `KnowledgeExerciseId`, `KnowledgeSkillId`
- `ExerciseKnowledgeSourceKind` (7 kinds)
- `ExerciseModality` (13 modalities)
- `PrescriptionUnitTruth` (7 units)
- `ExerciseTaxonomyWarning` (7 warnings)
- `TrainingPurpose` (15 purposes)
- `SkillTransferStrength` (6 levels)
- `MovementBalanceFamily` (20 families)
- `TissueStressRegion` (15 regions)
- `FrequencyTolerance` (6 tolerances)
- `KnowledgeMethodId` (9 methods)
- `MethodCompatibilityVerdict` (5 verdicts)
- `ProgressionRelationshipKind` (6 kinds)
- `ExerciseSkillKnowledgeEntry` (main exercise schema)
- `SkillKnowledgeEntry` (main skill schema)
- `ExerciseSkillKnowledgeValidationResult`

### Seed File (`exercise-skill-knowledge-seed.ts`)

**Exports:**
- `EXERCISE_SKILL_KNOWLEDGE_SEED` - 14 exercise entries
- `SKILL_KNOWLEDGE_SEED` - 8 skill entries

**Each exercise entry includes:**
- Identity (ID, name, aliases, source kinds, confidence)
- Taxonomy (modalities, prescription unit, movement families, training purposes)
- Skill transfers (with transfer strength, rationale, evidence level, scoring weight)
- Tissue stress profiles (region, magnitude, accumulation risk, spacing need, safeguard tags)
- Frequency tolerance and training cost profile
- Method compatibility (9 methods with verdict, rationale, blocked conditions)
- Progression relationships
- Warm-up and cooldown needs
- User ability gates
- Equipment requirements
- Weighted anchor flag
- Documentation fields

### Validation File (`exercise-skill-knowledge-validation.ts`)

**Functions:**
- `getExerciseSkillKnowledgeEntries()` - accessor
- `getSkillKnowledgeEntries()` - accessor
- `getExerciseSkillKnowledgeEntry(id)` - by ID lookup
- `getSkillKnowledgeById(id)` - by ID lookup
- `findKnowledgeByAlias(alias)` - alias search
- `validateExerciseSkillKnowledgeSeed()` - full validation
- `getKnowledgeCoverageSummary()` - statistics
- `getUserCriticalKnowledgeCoverage()` - critical concept check
- `checkPlancheLeanPushUpTaxonomy()` - taxonomy verification
- `checkWeightedAnchorRepresentation()` - anchor verification

---

## Preservation Verification

| Component | Changed? |
|-----------|----------|
| Method Planner tile | ❌ No |
| Method Planner sheet | ❌ No |
| Adaptive Foundation | ❌ No |
| Skill Map | ❌ No |
| Program Day Cards | ❌ No |
| Start Workout | ❌ No |
| Live workout runtime | ❌ No |
| Generator | ❌ No |
| Program persistence | ❌ No |

---

## Build Verification

**TypeScript:**
```
pnpm exec tsc --noEmit --pretty false
```
Result: PASS

**Build:**
```
pnpm run build
```
Result: PASS

---

## UI Verification Location

**Route:** `/program`

**What to verify:**
1. Program page loads normally
2. Coach Intelligence hub displays
3. Method Planner tile shows green "Applied 6"
4. Method Planner sheet opens with 6 saved methods
5. Adaptive Foundation tile opens with evidence/safeguard content
6. Skill Map opens with selected skills
7. Start Workout button works normally

**Expected PASS:**
- All above behave exactly as before
- No visual changes
- No runtime behavior changes

**Expected FAIL:**
- Method Planner count changes
- Adaptive Foundation disappears or changes
- Skill Map breaks
- Start Workout breaks

---

## Next Step

**MASTER-8B.3 — Program Balance / Future Adaptation Read-Only Intelligence**

This step will:
- Create read-only Program Balance detection logic
- Consume the knowledge seed for balance analysis
- Detect pull dominance, push underrepresentation, missing anchors
- NOT wire to generator
- NOT mutate programs
- NOT change UI
