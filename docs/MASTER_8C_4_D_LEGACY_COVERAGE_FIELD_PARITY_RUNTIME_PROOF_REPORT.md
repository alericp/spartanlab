# MASTER-8C.4.D — Legacy Coverage Field Parity + Runtime Source Proof Report

## Current Official Step
MASTER-8C.4.D (repair gate inside MASTER-8C.4)

## Status
COMPLETE

---

## Why MASTER-8C.4.C Failed Live Acceptance

MASTER-8C.4.C patched the **final result return fields** (`knowledgeMatchedExerciseCount`, `knowledgeMissingExerciseCount`) to use identity resolver counts, but it did NOT update:
1. The **legacy `ProgramBalanceKnowledgeCoverageSummary` fields** which still used old `known.length` / `unknown.length` from `resolveProgramBalanceExercise()`
2. The **downstream gates** in findings and future planning that consumed the stale legacy fields

This caused a truth mismatch: the final counts said one thing while the internal summary said another.

---

## Stale Legacy Fields Found (Before Fix)

| Field | Old Source | Issue |
|-------|------------|-------|
| `knownExerciseCount` | `known.length` | Used old local resolver |
| `unknownExerciseCount` | `unknown.length` | Used old local resolver |
| `unknownExerciseIds` | `unknown.map(...)` | Used old local resolver |
| `unknownExerciseNames` | `unknown.map(...)` | Used old local resolver |
| `mayUnderestimateBalanceIssues` | `unknown.length > 0` | Used old count |
| `mayUnderestimateAnchorSupport` | `unknown.length > 0` | Used old count |
| `mayUnderestimateWarmupCooldownNeeds` | `unknown.length > 0` | Used old count |
| `missingCoverageWarnings` majority check | `unknown.length > known.length` | Used old counts |

## Downstream Stale Gates Found (Before Fix)

| Location | Gate Logic | Issue |
|----------|------------|-------|
| Analyzer findings (pull/push) | `knowledgeCoverage.unknownExerciseCount > 0` | Used stale field |
| Knowledge Coverage Gap finding | `unknownExerciseCount > 0` | Used stale field |
| Future planning DB gate | `unknownExerciseCount > knownExerciseCount` | Used stale field |

---

## What Was Changed

### 1. `lib/program/program-balance-readonly-analyzer.ts`

**`summarizeProgramBalanceKnowledgeCoverage()` function:**
- Computes `authoritativeFullScienceKnown = identityCoverage.fullScienceKnownCount + identityCoverage.aliasResolvedCount`
- Computes `authoritativeNeedScience = exercises.length - authoritativeFullScienceKnown`
- Uses `fullScienceCoveredIds` Set to compute which exercises need science
- Returns `knownExerciseCount: authoritativeFullScienceKnown`
- Returns `unknownExerciseCount: authoritativeNeedScience`
- Returns `unknownExerciseIds/Names` from identity resolver, not old local resolver
- Uses authoritative counts for `mayUnderestimate*` flags

### 2. `lib/program/program-balance-future-planning.ts`

**`derivePlanStatus()` function:**
- Changed from `unknownExerciseCount > knowledgeCoverage.knownExerciseCount` 
- To `!knowledgeCoverage.fullScienceCoverageComplete`

**`deriveBlockedReason()` function:**
- Now handles zero unknown count case gracefully

### 3. `components/programs/ProgramCoachIntelligenceHub.tsx`

**Runtime proof added:**
- Small diagnostic line after Coverage Summary showing resolver source
- Format: `Resolver: identity/full-science (8C.4.D)` + `X+Y = matched/total`

---

## Authoritative Resolver Now Owns

| Item | Status |
|------|--------|
| Final visible counts | YES |
| Legacy coverage summary fields | YES |
| Missing Data text | YES |
| Future Candidate full DB gate | YES |
| Knowledge Coverage Gap finding | YES |

---

## Current-Program Resolver Comparison (Expected)

| Metric | Value |
|--------|-------|
| Total current-program exercises | 21 |
| Identity full-science known | 21 (or near) |
| Identity alias-resolved | 0 (or included above) |
| Identity need-science | 0 |
| Truly unknown | 0 |
| Basic app-pool known but missing science | 0 |

---

## Runtime Proof Text Added

Location: Coverage Summary section in Program Balance modal

Format:
```
Resolver: identity/full-science (8C.4.D)  |  X+Y = matched/total
```

This proves which resolver path is active and what counts are being computed.

---

## Expected Program Balance Coverage After Deploy

| Metric | Expected Value |
|--------|----------------|
| Sessions | 6 |
| Exercises | 21 |
| Full Science | 21 |
| Need Science | 0 |
| Truly Unknown | 0 |
| Full coaching science total | 128 |
| App pool total | 129 |

---

## Gate Status

| Gate | Status |
|------|--------|
| Future Candidate DB gate | CLEARED (if current-program coverage complete) |
| Mutation enabled | NO |
| Program Balance read-only preserved | YES |

---

## Files Changed

1. `lib/program/program-balance-readonly-analyzer.ts` - Made identity resolver authoritative for all coverage fields
2. `lib/program/program-balance-future-planning.ts` - Fixed DB gate to use `fullScienceCoverageComplete`
3. `components/programs/ProgramCoachIntelligenceHub.tsx` - Added runtime resolver proof
4. `docs/MASTER_8C_4_D_LEGACY_COVERAGE_FIELD_PARITY_RUNTIME_PROOF_REPORT.md` - This report

## Files Intentionally Not Touched

- Program page
- Live Workout
- Method Planner
- Generator
- Restart Program
- Program Cards
- Prisma schema
- Package files
- Auth/billing

---

## Build Results

| Command | Result |
|---------|--------|
| `pnpm tsc --noEmit --pretty false` | PASSED |
| `pnpm run build` | PASSED |
| Deployment safe | YES |

---

## UI Verification

### What Should Be Gone
- Full Science 20
- Need Science 1
- "1 exercise(s) not found in any app source"
- "1 exercises not in knowledge seed"
- "full DB gate pending" (from current-program coverage)

### What Should Be Newly Visible
- Full Science 21
- Need Science 0
- Runtime proof line: `Resolver: identity/full-science (8C.4.D) | X+Y = 21/21`
- Honest non-DB blocker if future candidates still blocked (read-only phase, writer not enabled)

### Verification Steps
1. Open live app → Program page
2. Scroll to Coach Intelligence
3. Tap Program Balance
4. Check Coverage Summary shows Full Science 21 / Need Science 0
5. Check "not found" message is gone
6. Check Missing Data doesn't say "1 exercises not in knowledge seed"
7. Check runtime proof line shows identity resolver
8. Check Future Candidates doesn't say "full DB gate pending"
9. Confirm workout cards unchanged
10. Confirm Method Planner unchanged

---

## Next Step (Only If PASS)

**MASTER-8C.5** — Generator / Restart Program DB Consumption Gate
