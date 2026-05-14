# Official Checklist of May 14th, 2026

This is the active SpartanLab roadmap/checklist as of May 14th, 2026. Unless the user explicitly asks for an older historical checklist, future checklist additions should append to this dated roadmap.

This checklist supersedes ambiguous older checklist references. Do not invent new checklist numbers. Do not advance unless the current step passes TypeScript, build/deploy or environment-gate classification, runtime behavior proof, and visible UI proof.

---

## Max-Intent Build Bracket — Required Under Every Future Step

Every future step in this roadmap must satisfy these checks before claiming PASS:

### 1. Max Intent Knowledge Base Check
- The implementation must avoid cheap/generic logic.
- If programming is touched, consider exercise science, skill priority, muscle balance, movement families, tendon/joint stress, recovery, progression, method compatibility, and user-specific profile truth.

### 2. Source-of-Truth Check
- Identify the authoritative source.
- Identify which branches consume it.
- Prevent duplicate or conflicting truth.

### 3. Truth-to-UI Survival Check
- Any computed intelligence must survive to visible UI proof if the user should see it.

### 4. User-Specific Doctrine Alignment Check
- The user's selected skills, equipment, strength anchors, recovery profile, joint cautions, and preferences must be considered.

### 5. Branch-Impact Review
Every future step must state whether it affects:
- Skill Map
- Method Planner
- Adaptive Foundation
- Calibration
- Coach Recs
- Plan Logic
- Recovery/Readiness
- Prehab/Rehab/Tendon Safeguards
- Program Balance
- Exercise Knowledge Base
- Evidence/Workout History
- Live Workout Runtime
- Program Cards
- Saved Program Persistence

### 6. No Mutation Before Read-Only Proof
- Future-session mutation cannot be enabled until the relevant read-only source proves correct.

### 7. Method Planner Protection
- Current green `Applied 6` behavior is protected.
- Method Planner may only be changed at safe insertion points when the new foundation contracts reach that corridor.
- Do not destroy working Method Planner behavior.

### 8. Disabled/Partial Hub Tile Accounting
- Coach Recs, Calibration, Plan Logic, or any disabled/partial AI Hub tile must not be forgotten.
- If a future foundation branch should feed them, document that dependency before building.

### 9. TypeScript/Build Proof
```bash
pnpm tsc --noEmit --pretty false
pnpm run build
```

### 10. Exact Visible Proof
- Every step must specify route, tile/card, modal/sheet, exact text/chip, and PASS/FAIL visual.

---

## Official Step Order

Use this exact sequence unless a build gate or repair gate blocks it.

### MASTER-8B.0 — True-Source Roadmap Inventory + Hub Contract Freeze

**Status:** COMPLETE

**Purpose:** Inventory all true-source branches before building more logic.

**What This Step Delivered:**
- Created this dated roadmap document
- Defined the Max-Intent Build Bracket
- Created the True-Source Branch Inventory
- Froze Method Planner current working behavior as protected
- Classified all Coach Intelligence hub tiles
- Defined the official step order through MASTER-8D

---

### MASTER-8B.1 — Cross-Branch True-Source Foundation Registry / Contracts

**Status:** COMPLETE

**Purpose:** Create typed contracts/registry describing all true-source branches and their ownership boundaries without changing program behavior.

**What This Step Delivered:**
- Created `lib/program/true-source-registry.ts` (998 lines)
- Defined 16 true-source branches with complete ownership contracts
- Defined 7 Coach Intelligence tile contracts
- Method Planner protected as `protected_active` with existing_writer_only mutation authority
- Active-week mutation service classified as `primitive_placeholder` (NOT the final adaptation writer)
- Adaptive Foundation remains `read_only_active`
- No runtime behavior changed
- Report: `docs/MASTER_8B_1_TRUE_SOURCE_FOUNDATION_REGISTRY_REPORT.md`

**Branches Registered:**
- Skill Map / selected skill representation
- Method Planner / requested method override truth
- Adaptive Foundation / athlete model
- Calibration / evidence lifecycle
- Coach Recs / recommendation bundle
- Plan Logic / construction rationale
- Recovery/Readiness
- Prehab/Rehab/Tendon/Joint Safeguards
- Program Balance / skill and movement distribution (missing_needed)
- Exercise Knowledge Base
- Evidence / workout history / logged sets / RPE / band usage / discomfort notes
- Program Cards
- Live Workout Runtime (protected)
- Saved Program Persistence
- Active Week Mutation Placeholder (primitive_placeholder)

**Files Changed:**
- Created `lib/program/true-source-registry.ts`
- Created `docs/MASTER_8B_1_TRUE_SOURCE_FOUNDATION_REGISTRY_REPORT.md`
- Updated `docs/OFFICIAL_CHECKLIST_MAY_14_2026.md`

**Files NOT Touched:**
- Live workout runtime
- Method Planner apply/revert/reset writers
- Generator logic
- Database schema
- Any UI components

---

### MASTER-8B.2 — Max-Intent Exercise + Skill Knowledge Base Seed Schema

**Status:** COMPLETE

**Purpose:** Create a structured app-readable knowledge contract for exercise/skill science:
- Movement families
- Skill transfer relationships
- Tendon/joint stress mapping
- Frequency tolerance
- Intensity cost / volume cost / failure cost
- Warm-up needs
- Cooldown/mobility needs
- Method compatibility
- Progression/regression paths
- Equipment needs
- User ability gating

**What This Step Delivered:**
- Created `lib/program/exercise-skill-knowledge-contract.ts` (568 lines) - typed contract
- Created `lib/program/exercise-skill-knowledge-seed.ts` (1206 lines) - seed data
- Created `lib/program/exercise-skill-knowledge-validation.ts` (521 lines) - validation helpers
- Created `docs/MASTER_8B_2_EXERCISE_SKILL_KNOWLEDGE_SCHEMA_REPORT.md` (288 lines) - report
- Updated `lib/program/true-source-registry.ts` - knowledge base entry updated to `read_only_active`

**Seeded Coverage:**
- 14 exercises with full profiles (movement families, skill transfer, tissue stress, method compatibility, warm-up/cooldown, progression paths)
- 8 skills with balance requirements (planche, FL, BL, HSPU, MU, OAPU, L-sit, V-sit)
- Weighted Pull-Up and Weighted Dip marked as strength anchors
- Planche Lean (seconds/hold) vs Tuck Planche Push-Up (reps/dynamic) taxonomy correctly separated

**Files NOT Touched:**
- Program Page, Workout Session page, Generator, Method Planner, Adaptive Foundation
- Live workout runtime, database schema, package.json

**Constraint:** No generator wiring yet. Knowledge is read-only foundation.

---

### MASTER-8B.3 — Program Balance / Future Adaptation Readiness Read-Only Intelligence

**Status:** COMPLETE

**Purpose:** Detect (read-only, no mutation):
- Planche under-expression
- Push/pull imbalance
- Pull dominance
- Repeated same-family days
- Missing weighted pull-up/dip anchors
- Poor skill spacing
- Tissue stress risk
- Future-session adaptation candidates

**What This Step Delivered:**
- Created `lib/program/program-balance-intelligence-contract.ts` (435 lines) - typed contract
- Created `lib/program/program-balance-readonly-analyzer.ts` (918 lines) - read-only analyzer
- Created `lib/program/program-balance-validation.ts` (401 lines) - validation/fixture helpers
- Created `docs/MASTER_8B_3_PROGRAM_BALANCE_READONLY_INTELLIGENCE_REPORT.md` - report
- Updated `lib/program/true-source-registry.ts` - program_balance branch to `read_only_active`

**B2 Intake Repair:**
- Fixed B2 report: "14 exercises" → "13 exercises" (actual count)
- Added explicit notes that B2 seed is representative only

**Analyzer Capabilities:**
- Consumes B2 representative knowledge seed (13 exercises, 8 skills)
- Detects skill underexpression, pull dominance, push underrepresentation
- Detects weighted anchor gaps, tissue stress accumulation
- Identifies future-session adaptation candidates (read-only classification)
- Reports knowledge coverage gaps honestly
- Always returns `mutationAllowedNow: false`
- Always returns `fullKnowledgeBaseComplete: false`

**Full Database Expansion:** Deferred to MASTER-8C / MASTER-8C+

**Constraint:** No mutation. No generator wiring. No UI wiring yet.

---

### MASTER-8B.4 — Coach Intelligence Hub Tile Contract Wiring

**Status:** NOT STARTED

**Purpose:** Ensure all hub tiles are accounted for with one of:
- Active with real source
- Partial with honest missing evidence
- Disabled with reason
- Future-only with required source branch

**Tiles to Account For:**
- Skill Map
- Method Decisions
- Adaptive Foundation
- Calibration
- Coach Recs
- Method Planner
- Plan Logic

**Constraint:** No fake claims.

---

### MASTER-8B.5 — Method Planner Safe Integration With Foundation Sources

**Status:** NOT STARTED

**Purpose:** Only after the foundation registry exists, safely decide whether Method Planner should consume new branch context.

**Constraint:** Preserve current Applied 6 / native Supersets / Cluster Sets caution behavior unless a verified source says otherwise.

---

### MASTER-8B.6 — Controlled Future Session Adaptation Writer

**Status:** NOT STARTED

**Purpose:** Allow future uncompleted sessions to mutate from typed readiness contracts.

**Constraints:**
- Completed sessions must never mutate.
- Mutation must be traceable and reversible/noticeable.
- No live runtime mutation yet.

---

### MASTER-8B.7 — Post-Workout Adaptation Notice + Program Card Mutation Proof

**Status:** NOT STARTED

**Purpose:** After workout logging, show visible banner/notice if future sessions changed.

**Constraint:** Program cards must reflect the changes. No hidden mutation.

---

### MASTER-8B.8 — Live Workout Runtime Adaptation Bridge

**Status:** NOT STARTED

**Purpose:** Ensure Start Workout consumes the mutated future-session truth exactly.

**Constraint:** Live workout must not boot stale pre-mutation data.

---

### MASTER-8C — Doctrine DB / Knowledge Base Generator Wiring

**Status:** NOT STARTED

**Purpose:** Wire structured knowledge contracts into program generation and regeneration paths.

**Requirement:** Fresh build, regenerate, modify, saved reload, and live runtime must agree.

---

### MASTER-8D — Full Runtime Parity + Final UI Cleanup

**Status:** NOT STARTED

**Purpose:** Final polish after logic and truth corridors are stable.

---

## True-Source Branch Inventory

| Branch | Current Owner File(s) | Current Status | Future Role | Mutation Authority | UI Surfaces | Risk If Ignored | Safe Insertion Point |
|--------|----------------------|----------------|-------------|-------------------|-------------|-----------------|---------------------|
| **Skill Map / Selected Skill Representation** | `ProgramCoachIntelligenceHub.tsx`, skill helpers | Active/Partial | Skill exposure truth and selected-skill coverage | No direct mutation | Skill Map tile/sheet, program cards | Selected skills disappear or are under-expressed | After MASTER-8B.1 |
| **Method Decisions** | `per-day-method-summary.ts`, `WeeklyMethodDecisionAccordion` | Active | Explain AI-selected methods | No direct mutation | Method Decisions tile/sheet | Method explanation diverges from real methods | After MASTER-8B.1 |
| **Method Planner** | `ProgramCoachIntelligenceHub.tsx`, `requested-method-override-planner.ts`, `method-override-artifacts.ts` | **Active, recently repaired (PROTECTED)** | User-requested method additions/overrides | Only through existing apply/revert/reset writer | Method Planner tile/sheet | Counts drift or applied/native/preview rows disagree | After MASTER-8B.1 registry and MASTER-8B.5 integration |
| **Adaptive Foundation** | `adaptive-foundation-model.ts`, `ProgramCoachIntelligenceHub.tsx` | Active read-only | Athlete model, evidence state, constraints, safeguards | None yet | Adaptive Foundation tile/sheet | Looks intelligent but does not drive future changes | After MASTER-8B.1 |
| **Calibration** | `CalibrationCheckpointCard.tsx`, calibration helpers | Active/Partial depending on evidence | Baseline and performance calibration | No direct mutation until generator/writer consumes it | Calibration tile/sheet | Baseline claims not used | After MASTER-8B.1 |
| **Coach Recs** | `EvidenceCoachRecommendationCard.tsx`, recommendation helpers | Partial/empty if no evidence | Actionable advice and next-step coaching | No direct mutation | Coach Recs tile/sheet | Dead tile or cosmetic recommendations | After MASTER-8B.1 and MASTER-8B.4 |
| **Plan Logic** | `ProgramTruthSummary.tsx`, `program-display-contract.ts` | Active/Partial | Construction rationale and proof | No direct mutation | Plan Logic tile/sheet | Explanations mask weak programming | After MASTER-8B.1 |
| **Recovery / Readiness** | Workout feedback/readiness helpers, `active-week-mutation-service.ts` | Partial | Guide future-session adjustments | Future writer only | Adaptive Foundation, program cards, live workout | Recovery data displayed but not used | After MASTER-8B.3 |
| **Prehab / Rehab / Tendon / Joint Safeguards** | `adaptive-foundation-model.ts`, constraint/safeguard helpers | Read-only active | Adjust exercise choice, warm-ups, cooldowns, intensity | Future writer only | Adaptive Foundation, workout cards, live runtime eventually | Safeguards are decorative | After MASTER-8B.3 |
| **Program Balance / Skill Distribution** | **Currently missing as formal source** | Missing/Needed | Detect planche under-expression, pull dominance, push/pull imbalance, weighted anchor absence, repetition | Future writer only | Adaptive Foundation, Plan Logic, Program Cards | The app creates boring or imbalanced programs | MASTER-8B.3 creates this |
| **Exercise / Skill Knowledge Base** | Doctrine DB foundation exists but not generator-wired | Foundation exists, not fully consumed | Science-guided programming decisions | Indirect through generator/writer | Explanations, knowledge bubbles, plan logic | Generic cheap decisions | After MASTER-8B.2 and MASTER-8C |
| **Evidence / Workout History / RPE / Bands / Discomfort** | `workout-log-service.ts`, feedback loop helpers | Partial | Drive adaptation confidence and future changes | Future writer only | Adaptive Foundation, Coach Recs, Program Cards, Live Workout | Logged data does not change anything | After MASTER-8B.1 |
| **Program Cards** | `AdaptiveProgramDisplay.tsx`, `AdaptiveSessionCard.tsx` | Active | Final visible proof of adapted sessions | None; display consumer only | Program page session cards | Backend changes not visible | After MASTER-8B.7 |
| **Live Workout Runtime** | Live workout components/pages | **Active, protected** | Consume adapted session truth | None; runtime consumer unless same-day adjustment later | Start Workout / live workout | Program page says changed, live workout boots old session | After MASTER-8B.8 |
| **Saved Program Persistence** | Program page/save/load helpers | Active, fragile if shape changes | Preserve source truth and mutated future sessions | Future writer must update safely | Reloaded Program page | Fresh truth lost after reload | After MASTER-8B.6 |

---

## Current Coach Intelligence Hub Tile Status

| Tile | Status | Source | Notes |
|------|--------|--------|-------|
| **Skill Map** | Active | Program skill representation | Shows selected skills and expression |
| **Method Decisions** | Active | `per-day-method-summary.ts` | AI-selected method explanations |
| **Method Planner** | **Active (PROTECTED)** | `requested-method-override-planner.ts`, artifact truth | Green Applied 6 behavior is working and frozen |
| **Adaptive Foundation** | Active (read-only) | `adaptive-foundation-model.ts` | Evidence sources, safeguards, guarded preview |
| **Calibration** | Partial | `CalibrationCheckpointCard.tsx` | Active when evidence exists |
| **Coach Recs** | Partial/Empty | `EvidenceCoachRecommendationCard.tsx` | Empty when no evidence |
| **Plan Logic** | Active/Partial | `ProgramTruthSummary.tsx` | Construction rationale |

---

## Current Active-Week Mutation Classification

**File:** `lib/active-week-mutation-service.ts`

**Current Status:** Primitive/frequency-level, NOT the final deep adaptation writer.

**What It Does:**
- `evaluateActiveWeekMutation()` exists
- `consumePendingScheduleNotice()` exists
- Connected from `AdaptiveProgramDisplay.tsx`

**What It Does NOT Do:**
- Does not rebalance exercises
- Does not adjust warm-ups or cooldowns
- Does not modify weighted strength anchors
- Does not redistribute planche exposure
- Does not correct push/pull imbalance
- Does not adapt tissue stress at the session level

**Classification:** This is a placeholder service, not a production-grade adaptation writer. The final adaptation writer will be created in MASTER-8B.6.

---

## Method Planner Protected Behavior (As of May 14, 2026)

**Current Visible State:**
- Coach Intelligence tile: Method Planner shows green `Applied 6`
- Method Planner sheet proof line: `Planner truth: 6 saved · 0 preview · 1 not applied`
- Applied rows (6):
  - Circuits
  - Density Blocks
  - Drop Sets
  - Endurance/Conditioning
  - Rest-Pause
  - Top Set + Backoff
- Native/Original row: Supersets
- Caution/Not-applied row: Cluster Sets

**Protection Rule:** This behavior must not be broken unless a later step (MASTER-8B.5 or later) proves a safe insertion point for new foundation sources.

---

## Verification After Deploy

**Route:** `/program`

**Expected PASS:**
- Program page loads without error
- Coach Intelligence hub appears
- Method Planner tile shows `Applied 6` green
- Opening Method Planner shows 6 saved method additions + 1 not-applied
- Adaptive Foundation opens and shows evidence sources, safeguards, guarded preview
- Start Workout button works
- No visible runtime behavior changes

**Expected FAIL:**
- Method Planner count changes
- Adaptive Foundation content disappears
- Coach Intelligence tile layout breaks
- Start Workout breaks
- Program page fails to load
- Any runtime mutation occurs that was not present before this step

---

## Appendix: File Reference

### Primary Documentation Files
- `docs/OFFICIAL_CHECKLIST_MAY_14_2026.md` (this file)
- `docs/PROGRAM_INTELLIGENCE_QUALITY_CHECKLIST.md` (historical context)
- `docs/MASTER_8B_0_TRUE_SOURCE_ROADMAP_INVENTORY_REPORT.md` (step report)

### Key Source Files (Read-Only Audit)
- `components/programs/ProgramCoachIntelligenceHub.tsx` — Coach Intelligence hub tiles and sheets
- `lib/program/adaptive-foundation-model.ts` — Typed read-only Adaptive Foundation model
- `lib/program/requested-method-override-planner.ts` — Method Planner logic
- `lib/program/method-override-artifacts.ts` — Artifact collection
- `lib/active-week-mutation-service.ts` — Primitive mutation service (placeholder)
- `components/programs/AdaptiveProgramDisplay.tsx` — Program display and mutation hooks
- `lib/adaptive-program-builder.ts` — Program generation
- `lib/program/per-day-method-summary.ts` — Method decision summaries
- `lib/program/program-display-contract.ts` — Display contracts
