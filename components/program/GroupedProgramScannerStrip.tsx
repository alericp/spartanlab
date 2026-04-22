// =============================================================================
// [PROGRAM-GROUP-SCANNER-R1] Program-surface grouped diagnostic strip
//
// PURPOSE
// Pure READ-ONLY diagnostic visibility for grouped-method truth on the
// Program screen. Mirrors the live-workout corridor grouped scanner, but
// consumes Program-surface authoritative truth instead of live-session
// truth. Fixes the surface mismatch where the user was checking the
// Program screen but the existing grouped scanner was mounted only in
// the live workout corridor.
//
// AUTHORITATIVE TRUTH (pure consumer only)
// Reads the EXACT canonical fields already used on `app/(app)/program/page.tsx`
// by the `[FUNNEL-AUDIT-S1S2]` helper (see line ~3189 of that file):
//   - session.styleMetadata.styledGroups[].groupType
//   - session.exercises[].method
// A session is treated as grouped iff any styledGroup has a groupType !=
// 'straight' OR any exercise has a method that is truthy AND != 'straight'.
// This is the same rule `hasGroupedTruth` already uses in the probe.
//
// STRICT CONSTRAINTS
//   - No hooks, no effects, no local state, no handlers, no mutation.
//   - Zero behavior change.
//   - Does NOT normalize, infer, or re-derive grouped truth in a new way.
//   - Returns null (no DOM, no layout gap) when no session carries
//     grouped truth AND when input is missing/malformed.
//   - Null-safe across every optional field (sessions, styleMetadata,
//     styledGroups, exercises, method, dayNumber, etc.).
//   - Small visual footprint: one compact line per grouped session,
//     wrapped in a single small panel. No card restyle, no CTA impact.
//
// SHIPPING GATE
// Controlled by a single local constant `SHOW_PROGRAM_GROUP_SCANNER`.
// Defaults to true for this debug pass. Flip to false to hide without
// removing code. Independent from the live corridor's SHOW_GROUP_SCANNER.
// =============================================================================

// Local debug gate - independent from live-corridor diagnostics.
const SHOW_PROGRAM_GROUP_SCANNER = true

// --- Narrow pure-consumer types ------------------------------------------
// We deliberately declare the minimum shape we read. We do NOT import the
// richer program type to avoid type coupling and to stay resilient if
// the upstream type shifts. Every field is optional and null-guarded.
type StyledGroup = { groupType?: string | null }
type SessionExercise = { blockId?: string | null; method?: string | null }
type ProgramSession = {
  dayNumber?: number | null
  name?: string | null
  focus?: string | null
  styleMetadata?: { styledGroups?: StyledGroup[] | null } | null
  exercises?: SessionExercise[] | null
}
type ProgramLike = {
  sessions?: ProgramSession[] | null
} | null | undefined

interface GroupedProgramScannerStripProps {
  program: ProgramLike
}

// --- Per-session summary (pure) ------------------------------------------
// Mirrors the shape already produced by the `[FUNNEL-AUDIT-S1S2]` summarize
// helper on app/(app)/program/page.tsx. We intentionally do NOT import that
// helper because the probe is inline inside a useEffect on the page; this
// reimplementation is a pure consumer that reads the SAME canonical fields.
function summarizeSession(sess: ProgramSession) {
  const styled: StyledGroup[] = Array.isArray(sess.styleMetadata?.styledGroups)
    ? (sess.styleMetadata!.styledGroups as StyledGroup[])
    : []
  const exercises: SessionExercise[] = Array.isArray(sess.exercises)
    ? (sess.exercises as SessionExercise[])
    : []

  // Non-straight grouped structures at the styleMetadata level.
  const nonStraightGroups = styled.filter(
    (g) => !!g && typeof g.groupType === 'string' && g.groupType !== 'straight',
  )
  // Non-straight methods at the exercise level (same rule as the probe).
  const nonStraightExercises = exercises.filter(
    (e) => !!e && typeof e.method === 'string' && e.method.length > 0 && e.method !== 'straight',
  )

  const hasGroupedTruth =
    nonStraightGroups.length > 0 || nonStraightExercises.length > 0

  // First canonical group-type token (upper-cased). If none, fall back to
  // the first non-straight exercise method. Never invent a type.
  const firstGroupType =
    nonStraightGroups[0]?.groupType ||
    nonStraightExercises[0]?.method ||
    null

  return {
    day: typeof sess.dayNumber === 'number' ? sess.dayNumber : null,
    name: typeof sess.name === 'string' && sess.name.length > 0 ? sess.name : null,
    focus: typeof sess.focus === 'string' && sess.focus.length > 0 ? sess.focus : null,
    hasGroupedTruth,
    groupType: firstGroupType ? firstGroupType.toUpperCase() : null,
    groupBlockCount: nonStraightGroups.length,
    memberCount: nonStraightExercises.length,
    exerciseCount: exercises.length,
  }
}

export function GroupedProgramScannerStrip({
  program,
}: GroupedProgramScannerStripProps) {
  if (!SHOW_PROGRAM_GROUP_SCANNER) return null

  // Defensive: program, sessions, everything may be missing.
  const sessions: ProgramSession[] = Array.isArray(program?.sessions)
    ? (program!.sessions as ProgramSession[])
    : []
  if (sessions.length === 0) return null

  const summaries = sessions.map(summarizeSession)
  const groupedOnly = summaries.filter((s) => s.hasGroupedTruth)

  // No grouped truth across any session -> render nothing, reserve no space.
  if (groupedOnly.length === 0) return null

  return (
    <div
      role="note"
      aria-label="Program grouped-method scanner (debug)"
      className="mb-3 rounded-md border border-[#2B313A] bg-[#0F1115] px-2 py-1.5 font-mono text-[10px] leading-tight text-[#A4ACB8]"
    >
      <div className="mb-1 flex items-center gap-2">
        <span className="text-[#E6E9EF]">PROGRAM_GROUPED</span>
        <span className="text-[#6B7280]">·</span>
        <span>
          sessions:<span className="text-[#E6E9EF]"> {summaries.length}</span>
        </span>
        <span className="text-[#6B7280]">·</span>
        <span>
          grouped:<span className="text-[#E6E9EF]"> {groupedOnly.length}</span>
        </span>
      </div>
      <ul className="flex flex-col gap-0.5">
        {groupedOnly.map((s, idx) => {
          const dayToken = s.day !== null ? `D${s.day}` : `#${idx + 1}`
          const labelToken = s.name || s.focus || '-'
          return (
            <li
              key={`${dayToken}-${idx}`}
              className="flex flex-wrap items-center gap-x-2 gap-y-0.5"
            >
              <span>
                DAY:<span className="text-[#E6E9EF]">{dayToken}</span>
              </span>
              <span>
                GROUP:<span className="text-[#E6E9EF]">{s.groupType || '?'}</span>
              </span>
              <span>
                BLOCKS:<span className="text-[#E6E9EF]">{s.groupBlockCount}</span>
              </span>
              <span>
                MEMBERS:<span className="text-[#E6E9EF]">{s.memberCount}</span>
              </span>
              <span>
                EX:<span className="text-[#E6E9EF]">{s.exerciseCount}</span>
              </span>
              <span className="truncate text-[#6B7280]">· {labelToken}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
