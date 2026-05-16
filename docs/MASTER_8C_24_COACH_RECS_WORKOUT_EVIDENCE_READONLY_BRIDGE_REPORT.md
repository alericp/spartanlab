# MASTER-8C.24 / AB20.4.17 — Coach Recs Workout Evidence Read-Only Bridge Report

## Step Identity
- **Current AB step:** MASTER-8C.24 / AB20.4.17
- **Parent step:** MASTER-8C / AB20.4
- **Status:** COMPLETE

## What Changed
- Created `coach-recommendation-workout-evidence-readonly-bridge.ts` (299 lines) — pure helper that accepts WorkoutLog[] and returns structured evidence summary
- Updated `coach-recommendation-candidate-readonly-analyzer.ts` with evidence bridge integration (609 -> ~680 lines)
- Wired local trusted workout logs into Coach Recs via `getRecentWorkoutLogsForGenerationRequest()` (client-safe, returns [] on server)
- Evidence-tier decisions now use structured evidence quality (none/weak/usable/strong) instead of just boolean flags
- Prehab/tendon candidates use specific pain/RPE evidence; recovery candidates use specific readiness/fatigue evidence
- Evidence collection candidate now splits into no-evidence vs weak-evidence messaging
- UI shows compact evidence proof line (emerald green) when logged evidence exists

## Evidence Sources Consumed
- Local trusted workout logs via `getRecentWorkoutLogsForGenerationRequest()` from `performance-feedback-integration.ts`
- WorkoutLog fields: trusted, completionStatus, perceivedDifficulty, notes, exerciseNotes (flags + freeText), completedSetEvidence (actualRPE, prescribedRPE, actualReps, prescribedReps, noteFlags)
- Adaptive foundation evidence snapshot (existing, unchanged)
- Server evidence reader: NOT TOUCHED

## Evidence Signals Detected
- RPE evidence: actualRPE from completedSetEvidence entries
- Pain/tension evidence: pain tokens in notes, exerciseNotes flags/freeText, set-level noteFlags
- Readiness/fatigue evidence: readiness tokens in notes, exerciseNotes flags
- Under-target performance: actualReps < prescribedReps, actualHoldSeconds < prescribedHoldSeconds
- High-effort evidence: perceivedDifficulty === 'hard', actualRPE >= threshold

## Files Changed
| File | Change |
|------|--------|
| `lib/program/coach-recommendation-workout-evidence-readonly-bridge.ts` | NEW (299 lines) |
| `lib/program/coach-recommendation-candidate-readonly-analyzer.ts` | Evidence bridge integration, structured evidence-tier decisions |
| `components/programs/ProgramCoachIntelligenceHub.tsx` | Imports, evidence useMemo, sheet evidence proof line, Foundation Map evidence label |
| `lib/program/intelligence-foundation-branch-map.ts` | coach_recs updated for evidence bridge |
| `docs/OFFICIAL_CHECKLIST_MAY_14_2026.md` | Updated position |

## Files Intentionally Not Touched
Generator, adaptive program builder, save/load persistence, Program Cards, live workout runtime, workout session page, Method Planner writers, database schema, Stripe/Clerk/auth/billing, exercise seed DB, EvidenceCoachRecommendationCard, server evidence reader/writer.

## Protected Values (All NO)
Exercises/Sets/Reps/RPE/Rest/Warm-up/Cooldown/Substitutions/Generator/Live Workout/Saved Program/Future Sessions/Database Schema/Method Planner/Program Cards: ALL NO

## Verification
- **TypeScript:** `pnpm tsc --noEmit --pretty false` — PASS (0 errors)
- **Build:** `pnpm run build` — PASS

## UI Location to Verify
**Program Page -> Coach Intelligence Hub -> Coach Recs**

### No completed logs:
- Header shows "Source quality: branch/plan inference only; needs logged workout evidence"
- No emerald evidence proof line
- Cards show Plan-structure signal / Source-branch inference / Needs logged evidence chips
- Footer: "Not applied to program. No future sessions changed."

### Completed trusted logs present:
- Header shows "Source quality: branch inference + [quality] workout evidence ([N] sessions)"
- Emerald evidence proof line: "Evidence: N trusted sessions | RPE present | pain/tension noted" (varies)
- Cards may show mixed/logged_user_evidence tier chips where specific evidence exists
- Footer: "Not applied to program. No future sessions changed."

### Foundation Map -> Coach Recs row:
- Shows evidence-tier summary with workout evidence quality when logs exist
- Shows emerald workout evidence label when logs exist
- Still says "Not applied. No future sessions changed."

## Next Official Step
MASTER-8C.25 / AB20.4.18 — Coach Recs Evidence Trend Classification / Read-Only Pattern Detection
