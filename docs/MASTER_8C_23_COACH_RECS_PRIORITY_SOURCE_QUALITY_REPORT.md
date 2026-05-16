# MASTER-8C.23 / AB20.4.16 — Coach Recs Priority + Source Quality Refinement Report

## Status: COMPLETE

## Current Step
- **AB Step:** MASTER-8C.23 / AB20.4.16
- **Parent:** MASTER-8C / AB20.4
- **Previous:** MASTER-8C.22 / AB20.4.15 (Coach Recs Evidence Bridge)

## What Changed

### Source-Quality / Evidence-Tier Types Added
- `CoachRecommendationEvidenceTier`: `logged_user_evidence` | `source_branch_inference` | `plan_structure_inference` | `missing_evidence` | `mixed`
- `CoachRecommendationActionReadiness`: `observe_only` | `collect_evidence` | `ready_for_review` | `blocked_until_evidence`
- Per-candidate fields: `evidenceTier`, `actionReadiness`, `sourceQualityLabel`, `sourceQualityExplanation`, `shouldAvoidScaryLanguage`
- Model-level fields: `evidenceTierSummary`, `sourceQualitySummary`, `appliedRecommendationReadiness`

### Candidate Priority Rules Refined
- "high" priority labels now say "structural caution" in the UI, not raw "high"
- Prehab/Tendon: Title changes to "High structural caution on tendon-heavy work" when no logged pain/RPE exists
- Recovery: Title changes to "Program structure suggests recovery should be monitored" when no readiness logs exist
- Progression: Blocking is downgraded to "medium" unless logged evidence supports it
- Confidence downgraded across the board when no logged workout evidence exists
- Scary language avoided when `shouldAvoidScaryLanguage: true` (plan-inference-only candidates)

### UI Proof Rendered
- Coach Recs sheet header: Added source-quality summary + "Needs logged evidence" chip
- Candidate cards: Added evidence-tier chip (Plan-structure signal / Source-branch inference / Needs logged evidence) + source-quality explanation text
- Foundation Map Coach Recs row: Added evidence-tier summary line

## Files Changed
| File | Change |
|------|--------|
| `lib/program/coach-recommendation-candidate-readonly-analyzer.ts` | Rewrote 453 -> 609 lines with source-quality layer |
| `components/programs/ProgramCoachIntelligenceHub.tsx` | Updated sheet header, candidate cards, Foundation Map row |
| `lib/program/intelligence-foundation-branch-map.ts` | Updated coach_recs branch metadata |
| `docs/OFFICIAL_CHECKLIST_MAY_14_2026.md` | Updated position |
| `docs/MASTER_8C_23_COACH_RECS_PRIORITY_SOURCE_QUALITY_REPORT.md` | NEW |

## Files Intentionally Not Touched
Live workout, generator, saved program persistence, Method Planner, Program Cards, database schema, auth/billing, exercise seed DB, EvidenceCoachRecommendationCard, evidence-derived-coach-recommendations.ts

## Protected Values (All NO)
Exercises/Sets/Reps/RPE/Rest/Warm-up/Cooldown/Substitutions/Generator/Saved Program/Program Cards/Live Workout/Future Sessions/Method Planner/Database Schema: ALL NO

## Verification
- **TypeScript:** `pnpm tsc --noEmit --pretty false` - PASS (0 errors)
- **Build:** `pnpm run build` - PASS

## UI Location to Verify
**Program Page -> Coach Intelligence Hub -> Coach Recs**
- Each card shows evidence-tier chip (Plan-structure signal / Source-branch inference / Needs logged evidence)
- Each card shows source-quality explanation in italic
- "high" priority cards say "structural caution" not raw "high"
- Sheet header shows source-quality summary + "Needs logged evidence" chip when applicable
- Footer: "Not applied to program. No future sessions changed."

**Program Page -> Coach Intelligence Hub -> Plan Logic -> AI Intelligence Foundation Map -> Coach Recs row**
- Row shows evidence-tier summary line
- Row shows sources, missing sources, mutation lock

### Expected PASS
Cards clearly distinguish plan-structure inference from logged user evidence. No scary language when only inference exists. Source-quality explanation present on every card.

### Expected FAIL
Cards still show raw "high" without context, claim confirmed harm from inference, or lose evidence-tier labels.

## Next Official Step
**MASTER-8C.24 / AB20.4.17** - Evidence / Workout History Read-Only Bridge
