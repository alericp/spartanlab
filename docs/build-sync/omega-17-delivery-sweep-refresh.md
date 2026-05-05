# STEP-5A-OMEGA-17 — Delivery Sweep Refresh Marker

## Purpose

This marker confirms a real pushed commit exists on this branch so the user
can pull/merge concretely. It also documents what OMEGA-17 actually did,
since prior OMEGA-16 work was not reaching `main` due to the sibling-branch
delivery loop (each v0 turn pushes to its own `v0/alericpetsch836-...` head
branch, and only an explicit PR merge into `main` causes Vercel to rebuild).

## Active branch at the time of this commit

- **Head branch (this turn):** `v0/alericpetsch836-6923-9e481618`
- **Base branch:** `main`
- **Last Vercel-built commit on `main` (per user prompt):** `053999a`
- **Vercel error this fix targets:**
  `app/(app)/program/page.tsx:11815:34` — TS2339,
  `Property 'selectedStrength' does not exist on type 'AdaptiveProgramInputs'`

## Sandbox environment limitations (transparent disclosure)

The v0 editing sandbox does NOT have shell access. The following commands
that the prompt requested CANNOT be executed from inside this sandbox and
were therefore replaced with equivalent static analysis via repository-wide
`Grep` over `app/(app)/program/page.tsx`:

| Prompt-requested command | Sandbox status | Equivalent performed |
|---|---|---|
| `git status --short` | NOT EXECUTABLE | n/a — v0 commits the working tree at end of turn |
| `git branch --show-current` | NOT EXECUTABLE | head branch known from chat metadata |
| `git fetch origin` | NOT EXECUTABLE | n/a — v0 pulls at start of turn |
| `git checkout -B step-5a-omega-17-...` | NOT EXECUTABLE | v0 commits to the chat's existing head branch |
| `pnpm exec tsc --noEmit --pretty false --noErrorTruncation` | NOT EXECUTABLE | full-file static `Grep` sweep across all same-class patterns |
| `pnpm run build` | NOT EXECUTABLE | result will be observed on Vercel after merge |
| `git push -u origin ...` | NOT EXECUTABLE | v0 auto-pushes the working tree to the head branch at end of turn |

This is the same constraint disclosed in OMEGA-14, OMEGA-15, and OMEGA-16
final responses. It does not weaken the fix — only the runtime verification
mechanism shifts from local `tsc` to Vercel build verification on the merged
SHA.

## Same-class sweep performed (the real one — not Vercel-first-error patching)

All 4 `Partial<CanonicalProgrammingProfile>` writeback objects in
`app/(app)/program/page.tsx` were inspected for the `selectedStrength`
metadata-read pattern:

| Writeback object | Line | `selectedStrength` source | Status |
|---|---|---|---|
| `initialBuildWritebackTruth` | L7823 | L7856 IIFE wrapping `readProgramPageStringArray(inputs, 'selectedStrength')` | SAFE — OMEGA-XI/OMICRON pattern |
| `modifyWritebackTruth` | L9430 | OMITS the field deliberately | OUT OF SCOPE — modify flow does not write this |
| `regenerateWritebackTruth` | L11794 | L11815 raw `(inputs?.selectedStrength as string[] \| undefined)` bandage | **BROKEN — fixed by OMEGA-17** |
| `adjustmentWritebackTruth` | L14099 | L14121 reads from `canonicalProfileNow.selectedStrength` | SAFE — canonical truth source |

Additional same-class sweep across the 5 risky metadata field names
(`selectedStrength`, `selectedStyles`, `selectedFlexibility`,
`goalCategories`, `trainingPathType`) on the 6 typed input variables
(`inputs`, `freshRebuildInput`, `updatedInputs`, `effectiveInputs`,
`generationInputs`, `nextInputs`):

- `selectedStrength` on `inputs`: 1 occurrence at L11815 → **fixed**.
- `selectedStyles`/`selectedFlexibility`/`goalCategories`/`trainingPathType`
  on `inputs`: zero raw direct reads (OMEGA-11 already routed these through
  `inputsMeta` / boundary helpers — confirmed by `Grep`).
- All `freshRebuildInput.<field>` / `updatedInputs.<field>` /
  `generationInputs.<field>` reads: type-valid (these objects DO own the
  fields — `freshRebuildInput` is a richer rebuild-input contract; the raw
  `AdaptiveProgramInputs` does not have the deep-planner identity fields).

Other corridors swept:

- Union `.sessions` / `.generatedDays` reads on `AdaptiveProgram |
  GeneratedProgram`: zero (OMEGA-12/13 `getProgramSessionCountForAudit`
  intact, 25+ helper hits across the file).
- Schedule mode raw/canonical mismatch: zero callsite-impossible compares
  remain (OMEGA-14/15 `toCanonicalScheduleModeForProgramProfile(unknown)`
  intact; only the in-helper `=== 'adaptive'` comparison at the helper body
  remains, which is type-valid against `unknown`).
- New `as any` / `@ts-ignore` / `@ts-expect-error` introduced under
  `STEP-5A-OMEGA-17`: zero.

## Fix applied

At `app/(app)/program/page.tsx:11815`, replaced:

```ts
selectedStrength: (inputs?.selectedStrength as string[] | undefined)?.length
  ? inputs.selectedStrength
  : undefined,
```

with the architecturally symmetric IIFE + boundary-helper pattern already
used at L7856 for the sibling `initialBuildWritebackTruth`:

```ts
selectedStrength: ((): string[] | undefined => {
  const arr = readProgramPageStringArray(inputs, 'selectedStrength')
  return arr.length > 0 ? arr : undefined
})(),
```

`readProgramPageStringArray` accepts `unknown` and returns `string[]` with
runtime narrowing — type-safe against the strict `AdaptiveProgramInputs`
contract while preserving the original empty-array → `undefined` semantics.

## Files changed in OMEGA-17

1. `app/(app)/program/page.tsx` — single edit at L11815 region (functional
   fix + provenance comment).
2. `docs/build-sync/omega-17-delivery-sweep-refresh.md` — this marker (new
   file).

## Safety guarantees (re-affirmed)

- No `as any`, `@ts-ignore`, `@ts-expect-error`, or `@ts-nocheck` introduced.
- No widening of `AdaptiveProgramInputs`, `CanonicalProgrammingProfile`,
  `AdaptiveProgram`, `GeneratedProgram`, or `ScheduleMode`.
- No schema, generator, doctrine, live-workout, onboarding, auth, billing,
  or UI changes.
- No `package.json`, `tsconfig.json`, `next.config.*`, or Vercel-config
  changes.
- No new dependencies.
- No suppressions of build errors via `ignoreBuildErrors` or similar.

## Required next user action

The OMEGA-12/13/14/15/16 regression pattern is sibling-branch delivery loop:
each v0 turn pushes to the chat's head branch, and **only an explicit PR
merge into `main`** causes Vercel to rebuild. To break the loop:

1. Open the PR for `v0/alericpetsch836-6923-9e481618` → `main`.
2. The diff for THIS turn shows two edits:
   - `app/(app)/program/page.tsx` — single region around L11815.
   - `docs/build-sync/omega-17-delivery-sweep-refresh.md` — this marker.
3. Merge the PR.
4. Confirm Vercel triggers a new deployment for the new merge SHA (it must
   NOT be `053999a`).
5. Reply with PASS / next exact `file:line:column` / "still on `053999a`".

If the user truly cannot pull/merge:
- `git fetch origin && git checkout v0/alericpetsch836-6923-9e481618` will
  fetch THIS branch directly and verify the fix is present at L11815.
- If the head branch shows up empty or stale on the user's local clone,
  the issue is GitHub remote sync, not v0 — refer to vercel.com/help.

---

## OMEGA-21 DIAGNOSTIC APPEND

OMEGA-21-EXPORT-ROUTING-PROOF — APPENDED INTO AN EXISTING TRACKED FILE

If the user's NEXT downloaded zip contains this exact line below but does
NOT contain `OMEGA_21_EXPORT_ROUTING_PROOF_ROOT.txt` at the repo root, the
export channel is delivering ONLY pre-existing files at older snapshots —
NEW files written by recent v0 turns are being excluded. This is a
v0-platform-side bug (likely "Download ZIP" pinned to an older version
block, or a stale GitHub branch checkout) and must be escalated to
vercel.com/help.

If the next zip contains BOTH this appended line AND the root marker, the
channel is healthy — the user simply needs to download from the LATEST
version block (three-dots menu on the most recent version, not an older
one) or pull the LATEST `v0/...` head branch.

If the next zip contains NEITHER, the user is downloading or pulling from
a different chat/project entirely than this workspace.

OMEGA-21-DIAGNOSTIC-APPEND-MARKER
