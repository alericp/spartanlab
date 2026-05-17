# MASTER-8C.32 / AB20.4.25 — Completed/Future Session Identity Resolution Gate

## Current Official Step
MASTER-8C.32 / AB20.4.25

## Step Type
Read-only repair/foundation gate — completed-vs-future session identity resolution for target session preview.

## Summary
Repaired the Target Session Resolution Preview's completed-vs-future session identity proof. Previously, `completedDays` was hardcoded as an empty Set, causing the UI to always show "0 completed / all future" even when trusted workout logs existed. Now, completed day numbers are resolved from trusted workout logs using the `generatedWorkoutId` day parser (`/day[-_\s]?(\d+)/i`), and identity status (resolved/partial/unavailable/no_logs) is honestly reported in the UI.

## Files Changed
| File | Change |
|------|--------|
| `lib/program/workout-log-session-identity-readonly-bridge.ts` | NEW (293 lines) — pure read-only identity resolver |
| `lib/program/mutation-target-session-resolution-preview.ts` | Extended model with identity fields + accept identity model in resolver |
| `components/programs/ProgramCoachIntelligenceHub.tsx` | Import + sessionIdentityModel useMemo + rewired completedDays + identity proof UI in Plan Logic card + Foundation Map row |
| `lib/program/intelligence-foundation-branch-map.ts` | plan_logic branch updated for identity resolution |
| `docs/MASTER_8C_32_AB20_4_25_COMPLETED_FUTURE_SESSION_IDENTITY_RESOLUTION_REPORT.md` | NEW |
| `docs/OFFICIAL_CHECKLIST_MAY_14_2026.md` | Updated position |

## Identity Source
Trusted workout logs already loaded by `getRecentWorkoutLogsForGenerationRequest()` (reused from existing Coach Recs evidence memo — no duplicate localStorage read). Day numbers extracted from `generatedWorkoutId` using conservative regex, validated against program session day numbers.

## Identity Statuses Supported
- `no_logs` — no trusted workout logs available
- `identity_unavailable` — logs exist but no parseable day mapping
- `partially_resolved` — some logs resolved, some could not be mapped
- `resolved` — all trusted logs successfully mapped to program days

## Whether writer/apply/confirm functions were called: NO
## Whether storage reads/writes were added: NO (reuses existing log reader)
## Whether apply/approve/confirm UI was added: NO
## Whether confirmed plan was created: NO
## Whether marker was saved: NO

## Protected NO Table
| Protected Value | Changed? |
|----------------|----------|
| Exercises | NO |
| Sets | NO |
| Reps | NO |
| RPE | NO |
| Rest | NO |
| Warm-up | NO |
| Cooldown | NO |
| Substitutions | NO |
| Generator | NO |
| Saved Program | NO |
| Program Cards | NO |
| Live Workout | NO |
| Start Workout | NO |
| Future Sessions | NO |
| Method Planner | NO |
| Schema | NO |
| Storage writes | NO |
| Confirmed plan creation | NO |
| Marker save | NO |

No future sessions changed.

## TypeScript/Build Proof
- `pnpm tsc --noEmit --pretty false` — PASS (0 errors)
- `pnpm run build` — PASS

## UI Verification
1. Open /program -> Coach Intelligence Hub -> Plan Logic
2. Target Resolution Preview card should now show:
   - Session identity status chip (resolved/partial/unavailable/no logs)
   - Completed session count reflecting resolved identity (not hardcoded 0)
   - "Completed sessions protected" when resolved
   - Unmapped log count when partially resolved
3. AI Foundation Map -> Plan Logic row should show Identity status chip
4. All other cards (Evidence Hook, Trend, Review Gate, Pathway Map) unchanged

## Remaining Limitations
- Identity resolution depends on `generatedWorkoutId` containing day number patterns
- Logs without parseable day identifiers are counted as unresolved, not guessed
- Per-session ID matching (beyond day number) is not yet implemented
- Candidate-to-session mapping remains category-based, not exercise-level

## Next Official Step (only if this passes)
MASTER-8C.33 / AB20.4.26 — to be verified from checklist (likely user-confirmation/marker-preview contract gate, still read-only unless explicitly approved)
