# MASTER-8C.19 / AB20.4.12 — Recovery / Readiness Read-Only Bridge Report

## Status: COMPLETE

## Current Official Step
MASTER-8C.19 / AB20.4.12

## Parent Sequence
MASTER-8C cross-branch intelligence foundation map

## What This Step Did
Created a pure, deterministic, read-only Recovery / Readiness analyzer that consumes existing program structure, adaptive foundation, program balance, and safeguard intelligence to produce honest recovery/readiness signals. Wired it into the Plan Logic / AI Intelligence Foundation Map with dynamic visible proof.

---

## Source Audit Results

### Existing Recovery/Readiness Source Files Found

| File | Classification |
|------|----------------|
| `lib/program/recovery-adaptation-snapshot-contract.ts` | Source owner - canonical readiness/fatigue/joint/injury/deload snapshot |
| `lib/program/recovery-program-awareness-bridge.ts` | Derived analyzer - consumes L4 recommendations |
| `lib/program/adaptive-foundation-model.ts` | Source owner - `sourceStatus.hasReadinessEvidence`, `readinessStatus` input |
| `lib/program/program-balance-readonly-analyzer.ts` | Derived analyzer - tissue/movement balance signals |
| `lib/program/prehab-rehab-tendon-safeguard-readonly-analyzer.ts` | Derived analyzer - tendon/joint risk signals |
| `lib/training-feedback-loop.ts` | Source owner - workout feedback/completion |
| `lib/program/recovery-injury-substitution-coaching.ts` | Future path - substitution logic (not consumed) |

### Decision
Created NEW analyzer (`recovery-readiness-readonly-analyzer.ts`) that bridges existing sources into a Foundation Map-compatible read-only model. Existing sources were inspected but not modified.

---

## Files Changed

| File | Action |
|------|--------|
| `lib/program/recovery-readiness-readonly-analyzer.ts` | NEW (541 lines) |
| `components/programs/ProgramCoachIntelligenceHub.tsx` | Updated - import, useMemo, prop passing, dynamic row UI |
| `lib/program/intelligence-foundation-branch-map.ts` | Updated - Recovery/Readiness branch entry |
| `docs/OFFICIAL_CHECKLIST_MAY_14_2026.md` | Updated |
| `docs/MASTER_8C_19_RECOVERY_READINESS_READONLY_BRIDGE_REPORT.md` | NEW |

## Files Intentionally Not Touched
- Live workout runtime files
- Program generator core files
- Saved program persistence files
- Method Planner apply/remove/reset files
- Superset/Cluster/Drop Set writer files
- Database schema/migrations
- Auth/billing/Stripe/Clerk files
- Package files
- Program Card render files

---

## Analyzer Architecture

### Input Sources Consumed
- `program.sessions` - exercise count, total sets, skill/tendon classification, methods
- `adaptiveFoundationModel.sourceStatus` - boolean flags for evidence availability
- `adaptiveFoundationModel.constraints` - constraint codes (protected_week, intensity_capped, etc.)
- `adaptiveFoundationModel.dominantLimiters` - limiter list
- `adaptiveFoundationModel.evidenceSnapshot` - completed workout evidence
- `programBalanceResult.findings` - tissue/movement balance signals
- `safeguardAnalysisResult.riskLevel` - tendon/joint risk escalation

### Detection Patterns

| Signal | Source | Severity |
|--------|--------|----------|
| Protected week constraint | Constraint code | high |
| Intensity capped | Constraint code | moderate |
| Volume reduced | Constraint code | moderate |
| High recovery demand | Session structure (>8 exercises, >30 sets) | watch/moderate |
| Tendon stress escalation | Safeguard analyzer risk | moderate |
| Tissue imbalance | Program balance findings | watch/moderate |
| High-skill session density | Exercise name keywords | watch |
| Tendon-heavy session | Exercise name keywords | watch |
| Limited readiness evidence | Missing source flags | info |

### Readiness Level Classification
- `ready` - No constraints, low demands, no risk escalation
- `watch` - Minor signals or limited evidence
- `reduced` - Multiple moderate signals or missing key evidence
- `protected` - Protected week constraint or high risk escalation
- `unknown` - Insufficient data

### Source Basis (what was used)
- `program_structure`, `adaptive_foundation`, `program_balance`, `safeguard_intelligence`, `constraint_evidence`

### Missing Sources (honestly reported)
- `completed_workout_feedback`, `recent_rpe_trend`, `sleep_or_recovery_checkin`, `soreness_or_pain_notes`, `multi_session_history`

---

## Dynamic Fields Rendered in UI

For `recovery_readiness` branch row in AI Intelligence Foundation Map:
- **Readiness headline** - Color-coded chip (amber for protected/reduced, yellow for watch, emerald for ready)
- **Confidence** - low/medium/high chip
- **Top signals** - Up to 3 signal labels
- **Source basis** - Up to 3 sources used
- **Missing sources** - Up to 3 missing evidence types
- **Mutation lock** - "No future sessions changed."

Fallback when model unavailable:
- "Read-only scan unavailable from current program props; recovery mutation remains locked."

---

## Protected Values (All NO)

| Protected Value | Status |
|----------------|--------|
| Exercises changed | NO |
| Sets changed | NO |
| Reps changed | NO |
| RPE changed | NO |
| Rest changed | NO |
| Warm-up changed | NO |
| Cooldown changed | NO |
| Substitutions changed | NO |
| Generator changed | NO |
| Live workout changed | NO |
| Saved program mutation | NO |
| Future-session mutation | NO |
| Database schema changed | NO |

## Protected UI Corridors

| Corridor | Status |
|----------|--------|
| Coach Intelligence Hub 8 tiles | PRESERVED |
| Plan Logic opens | PRESERVED |
| AI Intelligence Foundation Map 13 branches | PRESERVED |
| Set / Volume Prescription Rationale | PRESERVED (Partial/read-only) |
| Prehab / Rehab / Tendon Safeguards | PRESERVED (Read-only, dynamic proof) |
| Method Planner | PRESERVED |
| Program Card superset structure | PRESERVED |
| Start Workout button | PRESERVED |
| Live workout runtime | PRESERVED |

---

## Verification Results

- **TypeScript command:** `pnpm tsc --noEmit --pretty false`
- **TypeScript result:** PASS (0 errors)
- **Build command:** `pnpm run build`
- **Build result:** PASS (exit code 0)

---

## UI Location to Verify
**Program Page -> Coach Intelligence Hub -> Plan Logic -> AI Intelligence Foundation Map -> Recovery / Readiness row**

### Expected PASS
- Row shows "Read-only" status chip
- Row shows "Mutation locked" chip
- Row shows dynamic scan details:
  - Readiness headline (e.g., "Watch: plan-derived signals only" or "Protected: protected week constraint")
  - Confidence (e.g., "low confidence")
  - Top signals (e.g., "Limited readiness evidence, High-skill session density")
  - Source basis (e.g., "Sources: program_structure, adaptive_foundation")
  - Missing sources (e.g., "Missing: completed_workout_feedback, recent_rpe_trend")
- "No future sessions changed" text
- OR honest fallback if model unavailable

### Expected FAIL
- Row shows only static copy with no readiness/signals/sources
- Claims fake recovery data or completed workout evidence
- Claims future workouts were changed
- Breaks Prehab/Rehab or Set/Volume rows
- Creates a 9th Coach Intelligence tile

---

## Next Official Step
**MASTER-8C.20 / AB20.4.13** — Next intelligence branch:
- Exercise Knowledge coverage expansion, OR
- Coach Recs evidence bridge, OR
- Progression/Periodization read-only bridge
