# MASTER-8C.20 / AB20.4.13 — Exercise Knowledge Coverage Read-Only Report

## Status: COMPLETE

## Current Official Step
MASTER-8C.20 / AB20.4.13 — Exercise Knowledge Coverage Expansion + Dynamic Read-Only Coverage Proof

## Parent Sequence
MASTER-8C cross-branch intelligence foundation map

## Files Changed
- `lib/program/exercise-knowledge-coverage-readonly-analyzer.ts` — NEW (257 lines, thin adapter wrapping existing coverage resolver)
- `components/programs/ProgramCoachIntelligenceHub.tsx` — Import, useMemo, prop passing, dynamic row UI
- `lib/program/intelligence-foundation-branch-map.ts` — Updated `exercise_skill_knowledge_base` branch entry

## Files Intentionally Not Touched
- Live workout runtime files
- Program generator core files
- Saved program persistence files
- Database schema/migrations
- Auth/billing/package files
- Method Planner apply/remove/reset files
- Superset/Cluster/Drop Set writer files
- Program Card render files
- Onboarding/settings pages

## Existing Exercise Knowledge Source Owners Found (Audit)

| File | Classification |
|------|---------------|
| `lib/program/exercise-skill-knowledge-contract.ts` | Type owner - defines all knowledge types |
| `lib/program/exercise-skill-knowledge-seed.ts` | Seed owner - 80+ exercise entries with full science |
| `lib/program/exercise-skill-knowledge-validation.ts` | Validation helper - checks seed completeness |
| `lib/program/program-balance-exercise-identity-coverage.ts` | Identity coverage helper - REUSED as main resolver |
| `lib/program/generator-knowledge-consumption-proof.ts` | Generator proof helper - read-only proof contract |

## Implementation Approach
- **New analyzer created?** YES — `exercise-knowledge-coverage-readonly-analyzer.ts` (thin adapter only)
- **Existing coverage helper reused?** YES — `summarizeExerciseIdentityCoverage()` from `program-balance-exercise-identity-coverage.ts` does all real resolution
- **Seed entries added?** NO — the existing 80+ entries already cover common calisthenics exercises including all listed priority exercises
- **Duplicate logic created?** NO — the analyzer is a thin wrapper that adds headline/summary/sources/missing for Foundation Map display

## Coverage Architecture
The adapter takes deduplicated exercises from program sessions, passes them through:
1. Full science seed check (direct ID match)
2. Alias resolution (reverse alias map)
3. Adaptive pool check (ID and name match)
4. Enhanced profile check
5. Truly unknown fallback

Each exercise is classified as: `full_science_known`, `alias_resolved`, `basic_identity_known`, `enhanced_partial_known`, or `truly_unknown`.

## Dynamic Fields Rendered
- Coverage headline (color-coded by ratio: green >= 90%, yellow >= 60%, amber < 60%)
- Coverage summary (full science count / total, basic count, unknown count)
- Top partial/basic exercises (max 3)
- Top unknown exercises (max 3, amber highlight)
- Source basis
- Mutation lock: "No exercise selection changed."

## Protected Values (All NO)
- Exercises changed: NO
- Sets changed: NO
- Reps changed: NO
- RPE changed: NO
- Rest changed: NO
- Warm-up changed: NO
- Cooldown changed: NO
- Substitutions changed: NO
- Generator changed: NO
- Live workout changed: NO
- Saved program mutation: NO
- Future-session mutation: NO
- Database schema changed: NO

## Verification
- **TypeScript:** `pnpm tsc --noEmit --pretty false` — PASS (0 errors)
- **Build:** `pnpm run build` — PASS

## Exact UI Location to Verify
**Program Page -> Coach Intelligence Hub -> Plan Logic -> AI Intelligence Foundation Map -> Exercise Knowledge Base row**

### Expected PASS Visual
- Row shows `Read-only` status chip
- Dynamic coverage headline (e.g. "8/11 full science, all identified")
- Coverage summary line with counts
- Basic/partial exercise names if any exist
- Unknown exercise names if any exist (amber highlight)
- Source basis (e.g. "exercise-skill seed, adaptive pool, alias resolver")
- "No exercise selection changed." mutation lock text
- Recovery / Readiness row still shows dynamic proof
- Prehab / Rehab / Tendon row still shows dynamic proof
- Set / Volume row still visible

### Expected FAIL Visual
- Row shows only static "Partial" copy with no coverage counts
- Claims fake full coverage
- Claims exercises were changed
- Breaks Recovery/Prehab/Set-Volume rows
- Adds new Coach Intelligence tile
- TypeScript or build fails

## Next Official Step
MASTER-8C.21 / AB20.4.14 — Next intelligence branch (Coach Recs evidence bridge or Progression/Periodization read-only bridge)
