# MASTER-8C.22 / AB20.4.15 — Coach Recs Evidence Bridge Report

## Status: COMPLETE

## Current Step
- **Step:** MASTER-8C.22 / AB20.4.15
- **Parent:** MASTER-8C / AB20.4

## What Was Done
Created a read-only Coach Recommendation Candidate analyzer that bridges existing source branches into the Coach Recs tile/sheet, replacing the empty/dead state with honest source-backed candidates when no applied evidence recommendation exists.

## New Analyzer
- **File:** `lib/program/coach-recommendation-candidate-readonly-analyzer.ts` (453 lines)
- **Type:** Pure, deterministic, side-effect free
- **No React, no fetch, no DB, no localStorage, no Date.now, no Math.random, no as any**

## Inputs Consumed
1. Recovery/Readiness model (readiness level, confidence, signals)
2. Prehab/Rehab/Tendon Safeguard model (risk level, confidence, detected signals)
3. Progression/Periodization model (posture, direction, confidence, signals)
4. Program Balance model (status, findings)
5. Exercise Knowledge model (coverage ratio, unknown count)
6. Adaptive Foundation (completed workout evidence, workout history)
7. Session count from program

## Candidate Categories
- `prehab_tendon` — high tendon/joint risk
- `recovery` — reduced/protected readiness
- `progression_periodization` — blocked/conservative/mixed progression
- `program_balance` — balance findings
- `exercise_knowledge` — coverage gaps
- `evidence_collection` — no logged workouts
- `set_volume` — partial rationale

## Candidate Rules
- Priority order: prehab > recovery > progression > balance > evidence > knowledge > set-volume
- Every candidate: `appliedToProgram: false`, `mutationStatus: 'read_only_not_applied'`
- Model always: `noProgramChangesApplied: true`, `noFutureSessionChangesApplied: true`
- Max 5 candidates returned, sorted by priority

## Old Evidence Path Preserved
- `EvidenceCoachRecommendationBundle` untouched
- `EvidenceCoachRecommendationCard` still renders when `coachRecommendationBundle?.primary` exists
- `deriveEvidenceCoachRecommendations` helper untouched

## UI Surfaces Updated
1. **Coach Recs tile:** Shows "Preview" badge + "Read-only" summary when candidates exist
2. **Coach Recs sheet:** Renders read-only candidate cards with priority/category/recommendation/sources when no applied bundle exists
3. **Foundation Map:** Coach Recs row now shows dynamic proof (headline, confidence, top candidate, sources, missing, mutation lock)
4. **Branch map:** coach_recs upgraded from partial/display_only to read_only/mutation_locked

## Files Changed
| File | Change |
|------|--------|
| `lib/program/coach-recommendation-candidate-readonly-analyzer.ts` | NEW (453 lines) |
| `components/programs/ProgramCoachIntelligenceHub.tsx` | Import, useMemo, tile badge, sheet candidates, Foundation Map row |
| `lib/program/intelligence-foundation-branch-map.ts` | Updated coach_recs branch entry |
| `docs/MASTER_8C_22_COACH_RECS_EVIDENCE_BRIDGE_REPORT.md` | NEW |
| `docs/OFFICIAL_CHECKLIST_MAY_14_2026.md` | Updated |

## Files Intentionally Not Touched
- Live workout runtime, generator core, saved program persistence, database schema, auth, billing, Method Planner apply/remove/reset, superset/cluster/drop set writers, Program Card render, onboarding/settings, any route/API mutation path, EvidenceCoachRecommendationCard, evidence-derived-coach-recommendations.ts

## Protected Values (All NO)
- Exercises/Sets/Reps/RPE/Rest/Warm-up/Cooldown/Substitutions changed: NO
- Generator/Live Workout/Saved Program/Future Sessions/Database Schema changed: NO
- Method Planner apply/revert/reset changed: NO
- Program Cards changed: NO

## Verification
- **TypeScript:** `pnpm tsc --noEmit --pretty false` — PASS (0 errors)
- **Build:** `pnpm run build` — PASS

## UI Location to Verify
**Program Page -> Coach Intelligence Hub -> Coach Recs tile/sheet**
**Program Page -> Coach Intelligence Hub -> Plan Logic -> AI Intelligence Foundation Map -> Coach Recs row**

## Expected PASS Visual
- Coach Recs tile shows "Preview" badge and "Read-only" summary
- Coach Recs sheet shows source-backed candidate cards with priority, recommendation, sources, and "Not applied to program. No future sessions changed."
- Foundation Map Coach Recs row shows dynamic proof with headline, confidence, sources, missing

## Expected FAIL Visual
- Coach Recs still only shows "No coach recommendations yet" despite source branches being available
- Coach Recs claims recommendations were applied
- Existing Foundation Map rows break

## Next Official Step
**MASTER-8C.23 / AB20.4.16** — Coach Recommendation Priority/Source Quality Refinement OR Evidence/Workout History Bridge
