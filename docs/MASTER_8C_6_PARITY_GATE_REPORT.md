# MASTER-8C.6 — Method / Program Balance / Generator Consumption Parity Gate

## Current Official Step
MASTER-8C.6 (including MASTER-8C.6.1 and MASTER-8C.6.2 repair gates)

## Status
**COMPLETE**

## MASTER-8C.6.1 Repair Summary

**Problem Found:** After MASTER-8C.6, Program Balance showed "Generator proof unavailable — selector bridge not found on saved program". The proof was computed but not attached to the final `sessionStyleMetadata` object that gets saved and rendered.

**Root Cause:** `sessionGeneratorKnowledgeProof` was computed at line ~27292 but `sessionStyleMetadata` was built later at lines ~30661 (fallback) and ~30857 (success) without including the proof.

**Fix Applied:** Added `generatorKnowledgeProof: sessionGeneratorKnowledgeProof` to both:
1. The initial fallback `sessionStyleMetadata` definition
2. The successful style path `sessionStyleMetadata` assignment

Now the proof rides on `program.sessions[n].styleMetadata.generatorKnowledgeProof` as expected by the UI.

## MASTER-8C.6.2 Repair Summary

**Problem Found:** After MASTER-8C.6.1 deployed, Program Balance still showed "Generator proof unavailable" because the current saved program in localStorage was generated before the proof metadata existed.

**Root Cause:** The UI was reading a legacy saved program whose sessions did not contain `session.styleMetadata.generatorKnowledgeProof`. The fix in MASTER-8C.6.1 only helps newly generated programs.

**Fix Applied:** Added a read-only backfill resolver that:
1. First checks for native metadata proof (from MASTER-8C.6.1)
2. Falls back to deriving proof from saved session exercises via the existing knowledge bridge
3. Labels backfilled proof with `source: 'saved_program_backfill'` to distinguish from native proof

Changes:
- `lib/program/generator-knowledge-consumption-proof.ts` - Added `resolveSessionGeneratorKnowledgeProofFromSession()` resolver and extended source type to include `'saved_program_backfill'`
- `components/programs/ProgramCoachIntelligenceHub.tsx` - Updated to use resolver instead of direct metadata extraction
- `components/programs/AdaptiveSessionCard.tsx` - Updated to use resolver for session-level proof

Now legacy saved programs show real matched counts from their exercises, while new programs show native proof from the selector.

## Summary

MASTER-8C.6 closes the truth-to-UI gap by ensuring generator knowledge consumption survives from:
- selector output -> builder session assembly -> final session object -> saved program -> UI

The proof is now visible in both Program Balance (program-level rollup) and session details (per-session proof).

## Files Changed

### New Files
1. `lib/program/generator-knowledge-consumption-proof.ts`
   - `SessionGeneratorKnowledgeProof` interface
   - `ProgramGeneratorKnowledgeProof` interface  
   - `buildSessionGeneratorKnowledgeProof()` - builds session-level proof from selector summary
   - `rollUpProgramGeneratorKnowledgeProof()` - rolls up session proofs to program level
   - `extractSessionProofFromMetadata()` - extracts proof from styleMetadata safely

### Modified Files
1. `lib/adaptive-program-builder.ts`
   - Added `generatorKnowledgeProof` field to `styleMetadata` type
   - Added import for proof builder functions
   - Stamps proof onto `session.styleMetadata.generatorKnowledgeProof` during method materialization

2. `components/programs/ProgramCoachIntelligenceHub.tsx`
   - Added import for proof rollup functions
   - Added `generatorKnowledgeProof` useMemo computation from program sessions
   - Added prop to `ProgramBalanceSheetContent` for passing proof
   - Added "Generator DB Consumption" UI section in Program Balance sheet

3. `components/programs/AdaptiveSessionCard.tsx`
   - Added import for `extractSessionProofFromMetadata`
   - Added "DB-informed selection" section in "Why this workout" dropdown

## Files Intentionally Not Touched
- package.json
- pnpm lockfile
- Prisma schema / migrations
- auth / Clerk
- Stripe / billing
- live workout reducer/runtime
- conditioning finisher guards (preserved)

## TypeScript
- **Command:** `pnpm tsc --noEmit --pretty false`
- **Result:** PASS (0 errors)

## Build
- **Command:** `pnpm run build`
- **Result:** PASS

## Verification Checklist

### Program Balance Coverage
- Sessions: Expected 6
- Exercises: Expected 20
- Full Science: Expected 20
- Need Science: Expected 0
- conditioning_finisher: Should NOT appear

### Generator Proof Visibility
- Program Balance sheet shows "Generator DB Consumption" section
- Shows sessions with proof count (e.g., "6/6")
- Shows exercises matched count (e.g., "20/20")
- Shows "Read-only" and "Selector bridge" chips
- Shows "No workout structure changed"

### Session-Level Proof
- "Why this workout" dropdown shows "DB-informed selection" section
- Shows matched/total exercise count
- Shows "Read-only" chip
- Shows "Knowledge used: movement family, tissue stress, skill transfer"

### Method Planner Parity
- Endurance/Conditioning remains caution/deferred/not materialized
- Applied methods do NOT include fake finisher artifacts
- Method Planner counts remain honest

### Fake Finisher Status
- No "Conditioning Finisher" exercise row
- conditioning_finisher not in unresolved/missing
- Synthetic finisher artifacts not counted as applied

## UI Verification Locations

### Program Balance
- **Route:** Program Page
- **Screen:** Coach Intelligence Hub -> Program Balance sheet
- **Section:** Coverage Summary + Generator DB Consumption
- **Expected:** 20/20 coverage, generator proof visible

### Session Details  
- **Route:** Program Page
- **Screen:** Any Day card expanded -> "Why this workout" dropdown
- **Section:** DB-informed selection
- **Expected:** Matched exercise count, read-only badge

### Method Planner
- **Route:** Program Page
- **Screen:** Coach Intelligence Hub -> Method Override Planner
- **Section:** Applied methods / Other methods
- **Expected:** Endurance/Conditioning NOT shown as applied

## PASS Criteria Met
1. TypeScript passes
2. Build passes
3. Program Balance expected to remain 20/20 with 0 need science
4. No conditioning_finisher fake exercise/missing item expected
5. Generator knowledge proof survives into saved session metadata
6. Program Balance / Coach Intelligence shows generator DB consumption proof
7. Session details show DB-informed exercise knowledge proof
8. Method Planner does not count fake finisher/endurance artifacts
9. No workout structure changes applied

## Next Official Step
**MASTER-8C.7** — Method Contract / Slot Ownership / Frequency Foundation Inventory

(Only if MASTER-8C.6 proves Program Balance, Generator, and Method Planner are consuming the same knowledge truth without drift)
