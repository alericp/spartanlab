# AB13-3 RUNTIME / VISUAL ACCEPTANCE REPORT

## 1. Branch / commit inspected
- **branch:** `v0/alericpetsch836-6923-ad99269e`
- **predecessor:** AB13-2 PR #1233 / commit `04ccbde` (Vercel Ready on main)

## 2. Previous state
- **AB13-1:** helper + card created (`lib/program/evidence-derived-coach-recommendations.ts`, `components/programs/EvidenceCoachRecommendationCard.tsx`)
- **AB13-1B:** Program page wiring restored (imports + bundle derivation + render directly below `FeedbackLoopProofCard`)
- **AB13-2:** actionability layer added (8 new fields on `EvidenceCoachRecommendation`, "What to do now" panel, three new chips, blockedReason note)
- **Vercel production state:** Ready on main at PR #1233 / commit `04ccbde`

## 3. Files inspected
- `lib/program/evidence-derived-coach-recommendations.ts`
- `components/programs/EvidenceCoachRecommendationCard.tsx`
- `app/(app)/program/page.tsx` (lines 815-822 imports, lines 2470-2512 IIFE)
- `components/programs/FeedbackLoopProofCard.tsx` (unchanged, untouched)
- `docs/AB13_2_EVIDENCE_COACH_ACTIONABILITY_REPORT.md`

## 4. Files changed
**None.** AB13-3 is verification-only. The static delivery chain, helper coverage, renderer coverage, fake-active gating, and duplicate-path discipline were all already in place from AB13-2. Adding cosmetic guards or new data attributes would have widened scope past the acceptance lock.

## 5. Static delivery chain
| Stage | Verdict | Evidence |
|---|---|---|
| `calibrationPlan` source present | PASS | `app/(app)/program/page.tsx:2470-2483` builds plan via `buildEvidenceAwareCalibrationPlan` |
| `generationInfluence` source present | PASS | `app/(app)/program/page.tsx:2493` reads `program.evidenceCalibrationInfluence ?? null` |
| helper derivation present | PASS | `app/(app)/program/page.tsx:2498-2501` calls `deriveEvidenceCoachRecommendations({ plan, influence })` |
| bundle passed to Program page card | PASS | `app/(app)/program/page.tsx:2509` `<EvidenceCoachRecommendationCard bundle={coachRecommendationBundle} />` |
| card rendered below FeedbackLoopProofCard | PASS | Same `<div className="flex flex-col gap-3">` wrapper at `:2503-2510`, FeedbackLoopProofCard at `:2504`, coach card at `:2509` |
| renderer displays helper fields | PASS | Card renders title, status badge, confidence badge, truth-status chip, evidence-quality chip, actionability chip, summary, recommendation, "What to do now" panel, why list, visibleProof chips, blockedReason note, evidence sources, supporting notes — every string sourced from `bundle.primary` |

## 6. Helper state coverage
| State | Verdict | Branch |
|---|---|---|
| active | PASS | `evidence-derived-coach-recommendations.ts:227-308` — gated by `influence.status === 'active' && influence.allowedToMutateProgram`, returns non-null primary with `appliedToProgram: true` |
| suppressed | PASS | `:341-377` — `metadata_only` plan with `suppressedConstraints.length > 0`, returns non-null primary with `appliedToProgram: false`, `blockedReason` set |
| observe | PASS | `:380-405` — `metadata_only` plan with zero suppressed, returns non-null primary, `appliedToProgram: false` |
| waiting | PASS | `:312-338` — `plan?.status === 'no_evidence'`, returns non-null primary with `confidenceLabel: 'insufficient'`, `appliedToProgram: false` |
| degraded | PASS | `:194-224` — `influence.status === 'degraded'`, returns non-null primary with `appliedToProgram: false` |
| `primary: null` only when truly hidden | PASS | Returns `EMPTY_BUNDLE` only when `influence === null` OR `influence.status === 'inactive'` (`:189-191`), and as a defensive fallback at `:409` that is unreachable under the union |

## 7. Renderer coverage
| Element | Verdict | Source line |
|---|---|---|
| title/header | PASS | `EvidenceCoachRecommendationCard.tsx:84-87` |
| truth-status chip | PASS | `:92` `<TruthStatusBadge label={primary.truthStatusLabel} />` |
| evidence-quality chip | PASS | `:93` `<EvidenceQualityBadge quality={primary.evidenceQualityLabel} />` |
| actionability chip | PASS | `:94` `<ActionabilityBadge actionability={primary.actionability} />` |
| "What to do now" | PASS | `:117-148` |
| user next step | PASS | `:135-141` |
| system next step | PASS | `:142-147` |
| blockedReason note | PASS | `:181-189` (renders only when `primary.blockedReason` is truthy) |

## 8. Fake-active audit
| Rule | Verdict | Evidence |
|---|---|---|
| active requires `status === 'active'` | PASS | `:227` `if (influence.status === 'active' && ...)` is the only path that emits `status: 'active'` literal at `:257` |
| active requires `appliedToProgram === true` | PASS | `appliedToProgram: true` literal exists at exactly one line (`:270`) inside the gated active branch |
| suppressed never claims mutation | PASS | Suppressed branch sets `appliedToProgram: false` at `:363` and `truthStatusLabel: 'Detected, not applied'` |
| waiting never claims evidence | PASS | Waiting branch sets `confidenceLabel: 'insufficient'` at `:328`, `evidenceSource: []`, `visibleProof: []` |
| degraded never claims healthy calibration | PASS | Degraded branch sets `appliedToProgram: false` at `:215`, `confidenceLabel: 'low'`, `severity: 'caution'` |
| no Program page invented copy | PASS | Grep for `coachActionLabel|coachActionDetail|userNextStep|systemNextStep|truthStatusLabel` against `app/(app)/program/page.tsx` returns zero matches |

## 9. Duplicate/parallel path audit
| Rule | Verdict | Evidence |
|---|---|---|
| single helper | PASS | Grep `function deriveEvidenceCoachRecommendations` returns exactly 1 file |
| single renderer | PASS | Grep `function EvidenceCoachRecommendationCard` returns exactly 1 file |
| single Program page consumer | PASS | Grep `EvidenceCoachRecommendationCard|deriveEvidenceCoachRecommendations` in `app/(app)/program/page.tsx` returns 4 hits — 2 imports + 1 derivation + 1 render — no second consumer |
| no local copy builder | PASS | No `coachAction*` / `userNextStep` / `systemNextStep` / `truthStatusLabel` literals anywhere in `app/(app)/program/page.tsx` |
| no fake fallback card | PASS | No alternate "AI Coach" card or competing recommendation surface in `components/programs/` |

## 10. Build result
- `pnpm exec tsc --noEmit --pretty false`: **NOT RUN** (sandbox cannot execute pnpm)
- `pnpm run build`: **NOT RUN** (sandbox cannot execute pnpm)
- **Code-level audit:** zero `as any`, zero `@ts-ignore`, zero `@ts-expect-error` in either AB13 file (only mention is the audit comment at `evidence-derived-coach-recommendations.ts:32` declaring the contract). Vercel production is Ready on AB13-2 PR #1233 / commit `04ccbde`, which is the standing build proof for the unchanged code path.

## 11. Visible result expected
On the Program page, directly below the existing `FeedbackLoopProofCard`, the user sees a second card that is:

- titled with one of: **AI Coach Recommendation - Active**, **Coach Recommendation - Observing**, **Adjustment detected - not applied yet**, **Waiting for evidence**, or **Evidence unavailable - safe baseline**
- topped with **two badge rows**: row 1 = status badge + confidence badge; row 2 = truth-status / evidence-quality / actionability chips
- followed by a **summary**, the **recommendation** in a bordered box, then a **"What to do now"** panel containing `coachActionLabel`, `coachActionDetail`, "Your next step", and "What SpartanLab will do"
- ending with a **"Why" list**, **proof chips**, an honest **"Why it is not applied yet"** note when `blockedReason` exists, and **"Sources:"** footer

For most current users (AB12-2 default hooks: every structural constraint suppressed), the card will read **"Adjustment detected - not applied yet"** with chips **Detected, not applied / Limited evidence / Blocked**, an actionable next step describing what to log, and a clear blockedReason explaining why the suggestion is held back. This is the honest state — it is not a regression, it is the truth boundary AB13-4+ will move.

The DOM exposes data attributes for visual/runtime confirmation:
- `data-ab13-2-status` (`active|observe|suppressed|waiting|degraded`)
- `data-ab13-2-applied` (`true|false`)
- `data-ab13-2-derived-from` (`ab11+ab12|ab12-only|inactive`)
- `data-ab13-2-actionability`
- `data-ab13-2-evidence-quality`
- `data-ab13-2-truth-status`

These satisfy the AB13-3 testability requirement without adding debug clutter to user-visible UI.

## 12. Final decision
**AB13-3 COMPLETE — visual/runtime acceptance locked; safe to proceed to AB13-4.**

The static delivery chain is unbroken end-to-end, every status branch returns a non-null primary so the card cannot silently disappear in any honest state, the active claim is gated by exactly one `if` in exactly one file, no duplicate producers or local Program-page copy builders exist, and the renderer is a pure pass-through. The required data attributes already shipped in AB13-2, so no code change was warranted in AB13-3.

## 13. Next recommended step
**AB13-4 — wire the first real structural builder hook (`progressionAggressiveness: 'conservative'`).** Flip exactly one entry in the AB12-2 `structuralHooks` config inside `executeAuthoritativeGeneration`, add a single typed read of `influence.progressionAggressiveness` inside the existing performance-adaptation seam in `lib/adaptive-program-builder.ts` (or the Phase L mutation already producing `performanceAdaptation` stamps), gate the cap behind `influence.allowedToMutateProgram`, and ship. After AB13-4 lands, the AB13-2 card will switch from "Adjustment detected - not applied yet" to "AI Coach Recommendation - Active" for the first time honestly — closing the AB11 -> AB12 -> AB13 truth funnel into a real program-shape change. Do not attempt AB14 (broader coach engine) until AB13-4 is visually confirmed.
