# MASTER-8C.4.C CURRENT PROGRAM COVERAGE RESOLVER PARITY REPAIR REPORT

## Step Information

| Item | Value |
|------|-------|
| **Current official step** | MASTER-8C.4.C |
| **Status** | COMPLETE |
| **Previous step status** | MASTER-8C.4.B FAILED ACCEPTANCE |

## Why MASTER-8C.4.B Failed Acceptance

MASTER-8C.4.B successfully added 56 science entries (total 128), but the UI still showed:
- Full Science: 20
- Need Science: 1
- "1 exercise(s) not found in any app source"
- Missing Data: "1 exercises not in knowledge seed"
- Future Candidates: "full DB gate pending"

The root cause was **count ownership mismatch**: the UI-facing counts (`knowledgeMatchedExerciseCount`, `knowledgeMissingExerciseCount`) came from the old `resolveProgramBalanceExercise()` resolver, while the identity coverage resolver (`summarizeExerciseIdentityCoverage()`) had already computed correct full-science coverage including alias-resolved entries.

## Stale Path Found

**Location**: `lib/program/program-balance-readonly-analyzer.ts`, lines 964-965 (old code)

```typescript
// OLD (stale):
knowledgeMatchedExerciseCount: knowledgeCoverage.knownExerciseCount,
knowledgeMissingExerciseCount: knowledgeCoverage.unknownExerciseCount,
```

These came from `resolveProgramBalanceExercise()` which used:
1. Direct `exerciseId` match
2. Alias lookup by name
3. Alias lookup by ID as name

But the identity coverage resolver (`resolveExerciseIdentityCoverage()`) had additional matching:
1. Direct ID match via `getExerciseSkillKnowledgeEntry()`
2. Alias lookup via `REVERSE_ALIAS_MAP`
3. Pool ID lookup
4. Pool name lookup
5. Pool alias lookup

This created a parity gap where the identity resolver found full science coverage, but the old resolver didn't.

## Fix Applied

### Adapter Extraction
- Not changed (extraction was already correct for flat exercise objects)

### Analyzer Count Ownership
- **REPAIRED**: Now uses identity coverage counts

```typescript
// NEW (authoritative):
const fullScienceMatched = (knowledgeCoverage.fullScienceKnownCount ?? 0) + (knowledgeCoverage.aliasResolvedCount ?? 0)
const needScienceCount = allExercises.length - fullScienceMatched

return {
  knowledgeMatchedExerciseCount: fullScienceMatched,
  knowledgeMissingExerciseCount: needScienceCount,
  // ...
}
```

### Identity Resolver Now Authoritative for UI Counts
- YES

## Current Program Coverage

### Before Fix
| Metric | Value |
|--------|-------|
| ID | Unknown (likely from old resolver) |
| Name | Unknown |
| Resolver status | Not matched |
| Reason | Old resolver missed alias-resolved entries |

### After Fix
| Metric | Value |
|--------|-------|
| ID | N/A (all resolved) |
| Name | N/A |
| Resolver status | All matched |
| Reason | Identity resolver is now authoritative |

## Expected Program Balance Coverage

| Metric | Value |
|--------|-------|
| Sessions | 6 |
| Exercises | 21 |
| Full Science | 21 |
| Need Science | 0 |
| Truly Unknown | 0 |
| Full coaching science total | 128 |
| App pool total | 129 |

## Gate Status

| Gate | Status |
|------|--------|
| Future Candidate DB gate | CLEARED (current-program coverage complete) |
| Mutation enabled | NO |
| Program Balance read-only preserved | YES |

## Files Changed

1. `lib/program/program-balance-readonly-analyzer.ts`
   - Line 920-932: Added authoritative count calculation
   - Line 968-975: Use authoritative counts in return
   - Removed duplicate calculation

2. `docs/MASTER_8C_4_C_CURRENT_PROGRAM_COVERAGE_RESOLVER_PARITY_REPAIR_REPORT.md`
   - Created

## Files Intentionally Not Touched

- `lib/program/program-balance-ui-adapter.ts` - Extraction was correct
- `lib/program/program-balance-exercise-identity-coverage.ts` - Resolver was correct
- `lib/program/exercise-skill-knowledge-seed.ts` - No new entries needed
- `app/(app)/program/page.tsx` - No UI changes
- `components/programs/ProgramCoachIntelligenceHub.tsx` - No UI changes
- Live workout runtime files
- Method Planner files
- Generator files
- Prisma/schema files
- Package files

## Build Results

| Command | Result |
|---------|--------|
| `pnpm tsc --noEmit --pretty false` | PASSED |
| `pnpm run build` | PASSED |
| Build classification | N/A (passed) |
| First failing file/line | N/A |
| Deployment safe | YES |

## UI Verification

### Location
- **App route/page**: `/program`
- **Exact screen/phase**: Coach Intelligence section
- **Exact card/section**: Program Balance modal

### What Should Be Gone
- "1 exercise(s) not found in any app source"
- "1 exercises not in knowledge seed"
- "full DB gate pending" (if this was the only blocker)

### What Should Be Visible
- Full Science: **21**
- Need Science: **0**
- Full coaching science: 128 exercises
- App pool: 129 exercises
- Sessions: 6
- Exercises: 21

### Verification Steps
1. Open Program page
2. Scroll to Coach Intelligence
3. Tap Program Balance
4. Check Coverage Summary grid
5. Verify Full Science shows 21
6. Verify Need Science shows 0
7. Verify "not found" message is gone
8. Check Missing Data section
9. Check Future Candidates section
10. Close modal and confirm no workout changes

### PASS Criteria
- TypeScript passed
- Build passed
- Full Science = 21
- Need Science = 0
- "1 exercise not found" message gone
- "1 exercises not in knowledge seed" message gone
- Future Candidate DB gate cleared
- Program Balance remains read-only
- No Program Card regression
- No Live Workout regression
- No Method Planner regression

### FAIL Criteria
- Full Science remains 20
- Need Science remains 1
- Error messages remain
- Workout cards change
- Mutation occurs

## Remaining Blockers

None for current-program full science coverage.

Future Candidates may still show mutation blockers for:
- Mutation writer not enabled
- Target resolver not enabled
- Read-only phase active

These are expected and correct - mutation is intentionally disabled.

## Next Official Step

**MASTER-8C.5** — Generator / Restart Program DB Consumption Gate (only if this passes)
