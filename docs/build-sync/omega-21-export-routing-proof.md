# OMEGA-21 EXPORT ROUTING PROOF

OMEGA-21-EXPORT-ROUTING-PROOF

## Why this file exists

The user has now downloaded TWO zips in a row (post-OMEGA-19 and
post-OMEGA-20) and confirmed neither contained markers I wrote during
those turns. Yet `Grep` against `/vercel/share/v0-project` THIS TURN
proves all of those marker files DO exist on disk:

- `docs/build-sync/omega-19-delivery-proof.md` (contains `OMEGA-19-DELIVERY-PROOF-MARKER`)
- `docs/build-sync/omega-19-file-manifest.json` (contains `OMEGA-19-DELIVERY-PROOF-MARKER`)
- `docs/build-sync/omega-20-delivery-proof.md` (contains `OMEGA-20-DELIVERY-PROOF-MARKER`)
- `docs/build-sync/omega-20-file-manifest.json` (contains `OMEGA-20-DELIVERY-PROOF-MARKER`)
- `OMEGA_20_DELIVERY_PROOF_ROOT.txt` (contains `OMEGA-20-DELIVERY-PROOF-MARKER`)

The workspace ALSO contains the older markers the user CONFIRMED were in
their zip:

- `docs/build-sync/omega-10-delivery-refresh.md`
- `docs/build-sync/omega-17-delivery-sweep-refresh.md`

This is dispositive: **the workspace IS the correct SpartanLab project.**
The bug is in the export pipeline between this v0 chat and whatever zip
the user is inspecting.

## Project routing proof (Glob + Grep, no shell)

| Check | Method | Result |
|---|---|---|
| Repo identity | `Read package.json` line 1-2 | `"name": "my-project"` (Next.js project; matches SpartanLab structure) |
| Has `app/(app)/program/page.tsx`? | `Glob **/program/page.tsx` | YES (exists) |
| Has `components/active-workout/AdaptiveWorkoutIterator.tsx`? | `Glob components/active-workout/**` | NO (does not exist) |
| Has user-confirmed-zip markers (omega-10, omega-17)? | `Glob **/*omega*` | YES |
| Has prior-turn markers (omega-19, omega-20)? | `Glob **/*omega*` | YES (so they WERE written, but did not reach the zip) |
| Workspace path | inferred from absolute paths | `/vercel/share/v0-project` |
| Vercel project ID (chat metadata) | system context | `prj_mvwi5hBTAB1MZElzuZYtYY9BIRkx` |
| GitHub remote (chat metadata) | system context | `alericp/spartanlab` |
| Last reference workspace ref (chat metadata) | system context | `v0/alericpetsch836-6923-3c70bce5` |

## Note on `components/active-workout/AdaptiveWorkoutIterator.tsx`

The OMEGA-19 / OMEGA-20 / OMEGA-21 prompts repeatedly cite this file as
"already changed in the previous reported work". It does not exist in
this repository. It has never existed in any turn I have access to. The
real recent live-workout work was in:

- `components/workout/StreamlinedWorkoutSession.tsx`
- `components/workout/ActiveWorkoutStartCorridor.tsx`
- `lib/workout/live-workout-machine.ts`

If your downstream auditor is searching the zip for
`AdaptiveWorkoutIterator.tsx` and treating its absence as proof of zip
staleness, that audit is checking for a file that was never created.

## Diagnostic setup this turn

Three markers were written/appended in coordinated locations to localize
the export bug:

1. **NEW FILE at REPO ROOT** — `OMEGA_21_EXPORT_ROUTING_PROOF_ROOT.txt`
   Tests whether new top-level files reach the export.
2. **NEW FILE in docs/build-sync/** — this file
   Tests whether new nested files reach the export.
3. **APPEND to a PREEXISTING tracked file** —
   `docs/build-sync/omega-17-delivery-sweep-refresh.md`
   has a new "OMEGA-21 DIAGNOSTIC APPEND" section appended to its end,
   containing the unique string `OMEGA-21-DIAGNOSTIC-APPEND-MARKER`.
   Tests whether edits to FILES THE USER ALREADY HAS reach the export.

## Interpretation matrix for the user's next zip / pull

| Root marker | Append marker | Diagnosis |
|---|---|---|
| present | present | Export is healthy this turn. Prior failures were due to user downloading from an older version block / pulling stale branch. Action: download from THIS chat's LATEST version block. |
| absent | present | v0 export is dropping NEW files but preserving edits to PREEXISTING files. This is a v0-platform export bug. Action: vercel.com/help with this chat URL. |
| absent | absent | The zip is from a different chat / different project / cached older artifact. Action: confirm chat URL and re-download. |
| present | absent | Should be impossible. Action: vercel.com/help. |

## Required user verification (≤30 seconds, two terminal commands)

After downloading the next zip OR pulling the latest `v0/...` branch:

```
test -f OMEGA_21_EXPORT_ROUTING_PROOF_ROOT.txt && echo ROOT_PRESENT || echo ROOT_MISSING
grep -c "OMEGA-21-DIAGNOSTIC-APPEND-MARKER" docs/build-sync/omega-17-delivery-sweep-refresh.md
```

Paste the two output lines back. They tell us which row of the matrix
above applies, which tells us exactly where the bug is.

## Agent environment disclosure (unchanged from prior turns)

- No shell access. Cannot run `git`, `unzip`, `pnpm`, `shasum`, `find`, `ls`, `pwd`.
- Can only Read/Write/Edit/Glob/Grep against `/vercel/share/v0-project`.
- End-of-turn push to GitHub head branch is performed by the v0 platform
  itself, not the agent. Agent cannot observe the resulting branch name
  or commit SHA from inside the turn.

OMEGA-21-EXPORT-ROUTING-PROOF
