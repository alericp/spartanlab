# MASTER-8C.4.E: Exact Unresolved Exercise Resolution Report

## MASTER-8C.4.E FINAL REPORT

| Item | Value |
|------|-------|
| **Current official step** | MASTER-8C.4.E |
| **Status** | DIAGNOSTIC DEPLOYED |

## Why MASTER-8C.4.D Failed Live Acceptance

Live runtime proof showed `20+0 = 20/21`:
- `fullScienceKnownCount = 20`
- `aliasResolvedCount = 0` 
- `analyzedExerciseCount = 21`
- `knowledgeMissingExerciseCount = 1`
- `trulyUnknownCount = 1` (inferred from "1 exercise not found in any app source")

The authoritative identity resolver found 20 exercises with full science but 1 exercise that is truly unknown (not in any source - seed, pool, or alias).

## Diagnostic Enhancement Deployed

Updated `ProgramCoachIntelligenceHub.tsx` to show exact unresolved exercise IDs:
- When `trulyUnknownCount > 0`: Shows "Unresolved: <exerciseId>, ..." 
- When `unknownExerciseIds.length > 0`: Shows "Need science: <exerciseId>, ..."

This will reveal the exact exercise ID causing the 20/21 gap on next deployment.

## Files Changed

1. `components/programs/ProgramCoachIntelligenceHub.tsx` - Added exact unresolved ID diagnostic display
2. `docs/MASTER_8C_4_E_EXACT_UNRESOLVED_EXERCISE_RESOLUTION_REPORT.md` - This report

## Files Intentionally Not Touched

- `lib/program/exercise-skill-knowledge-seed.ts` - No entry added yet (need exact ID first)
- `lib/program/program-balance-exercise-identity-coverage.ts` - Alias map not changed yet
- Generator, restart, live workout, method planner, Program Card files

## Build Results

| Command | Result |
|---------|--------|
| TypeScript | PASSED |
| Build | PASSED |
| Deployment safe | YES |

## Expected UI After Deployment

1. Program Balance will still show `Full Science 20 / Need Science 1`
2. Runtime proof will still show `20+0 = 20/21`
3. **NEW**: Below "1 exercise(s) not found in any app source" will appear:
   - `Unresolved: <exact_exercise_id>` 
4. **NEW**: Below the main message will appear:
   - `Need science: <exact_exercise_id>`

## Next Action

After deployment, user reports the exact unresolved exercise ID shown in the diagnostic. Then:
1. If ID is an alias variant of existing entry → add alias mapping
2. If ID is in pool but missing seed → add seed entry
3. If ID is generated/stale → determine correct fix path

## Mutation Status

| Item | Status |
|------|--------|
| Program Balance read-only | YES |
| Future Candidate DB gate | Still pending (coverage incomplete) |
| Mutation enabled | NO |

## Exact UI Verification

**What to look for after deploy:**
1. Open Program page → Coach Intelligence → Program Balance
2. Check Coverage Summary: Sessions 6 / Exercises 21 / Full Science 20 / Need Science 1
3. Look for **NEW** diagnostic line: `Unresolved: <exercise_id>` or `Need science: <exercise_id>`
4. Report the exact exercise ID shown

**PASS criteria for this diagnostic step:**
- The exact unresolved exercise ID is visible in the UI
- User can report the ID for next fix step
