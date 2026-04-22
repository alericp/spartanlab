// =============================================================================
// [PROGRAM-GROUP-SCANNER-R2] Program-surface grouped diagnostic strip
//
// PURPOSE
// Pure READ-ONLY diagnostic visibility for grouped-method truth on the
// Program screen. Now mirrors the EXACT same rule the Program card's
// adapter (`buildGroupedDisplayModel`) uses, so the scanner cannot
// overclaim grouped structure that the visible card body would not
// render. The previous R1 behavior treated any non-straight exercise
// method as equivalent to grouped-block truth and surfaced the first
// non-straight method as a `GROUP: <METHOD>` label; that was the root
// cause of the "scanner says grouped, card looks flat" symptom the user
// verified. Those labels have been removed.
//
// AUTHORITATIVE TRUTH (pure consumer only)
// Reads the same canonical fields the adapter consumes:
//   - session.styleMetadata.styledGroups[].groupType + .exercises[]
//   - session.exercises[].blockId + .method + .methodLabel
//
// Classification now distinguishes two honest shapes:
//
//   1. groupedBlocks -- paired/multi-member grouped structure the card
//      renders as a framed block. Requires either
//        a. styledGroups non-straight group with >= minMembersFor(type)
//           usable members, OR
//        b. session.exercises sharing the same blockId + non-straight
//           method with >= minMembersFor(type) usable members.
//      Mirrors the adapter's Priority 1 + Priority 2 gates exactly.
//      All grouped-block methods now require >=2 members -- cluster
//      joined the >=2 gate in the CLUSTER-DOCTRINE-CORRECTION so that
//      single-exercise cluster stops masquerading as grouped structure.
//
//   2. singleExerciseMethods -- exercises that carry a non-straight
//      method but do NOT contribute to a renderable grouped block.
//      Typical cause: cluster emitted as a primary-effort execution cue
//      on a single exercise (no blockId); density emitted on a single
//      exercise (density min is 2). These render as ordinary rows in
//      the card body with an inline method pill, and the card's
//      "Method cues present: ..." status line names them explicitly.
//      The scanner surfaces them as a separate METHODS token so it
//      neither conflates them with grouped structure nor hides them.
//
// SHIPPING GATE
// Controlled by a single local constant `SHOW_PROGRAM_GROUP_SCANNER`.
// Defaults to true for this debug pass. Flip to false to hide without
// removing code.
// =============================================================================

import { minMembersFor } from '@/components/programs/lib/session-group-display'

// Local debug gate - independent from live-corridor diagnostics.
const SHOW_PROGRAM_GROUP_SCANNER = true

// --- Narrow pure-consumer types ------------------------------------------
// We deliberately declare the minimum shape we read. We do NOT import the
// richer program type to avoid type coupling and to stay resilient if
// the upstream type shifts. Every field is optional and null-guarded.
type StyledGroupMemberLike = { name?: string | null }
type StyledGroupLike = {
  id?: string | null
  groupType?: string | null
  exercises?: StyledGroupMemberLike[] | null
}
type SessionExercise = {
  name?: string | null
  blockId?: string | null
  method?: string | null
  methodLabel?: string | null
}
type ProgramSession = {
  dayNumber?: number | null
  name?: string | null
  focus?: string | null
  styleMetadata?: { styledGroups?: StyledGroupLike[] | null } | null
  exercises?: SessionExercise[] | null
}
type ProgramLike = {
  sessions?: ProgramSession[] | null
} | null | undefined

interface GroupedProgramScannerStripProps {
  program: ProgramLike
}

// --- Method normalization (mirrors adapter) -------------------------------
// The adapter folds 'density' to 'density_block'; the scanner must too so
// per-type counts and min-members gates line up exactly.
type SupportedMethod = 'superset' | 'circuit' | 'density_block' | 'cluster'
function normalizeMethod(raw: string | null | undefined): SupportedMethod | null {
  if (!raw) return null
  const m = raw.toLowerCase()
  if (m === 'superset') return 'superset'
  if (m === 'circuit') return 'circuit'
  if (m === 'cluster') return 'cluster'
  if (m === 'density_block' || m === 'density') return 'density_block'
  return null
}

function hasUsableName(n: string | null | undefined): boolean {
  return typeof n === 'string' && n.trim().length >= 2
}

function titleForMethod(m: SupportedMethod): string {
  switch (m) {
    case 'superset': return 'superset'
    case 'circuit': return 'circuit'
    case 'density_block': return 'density'
    case 'cluster': return 'cluster'
  }
}

// --- Per-session summary (pure) ------------------------------------------
// Produces the same two tokens the card actually renders into:
//   groupedBlocks      -> grouped-block body slot
//   singleMethodTokens -> method badge on the row (or absent when truly straight)
function summarizeSession(sess: ProgramSession) {
  const styled: StyledGroupLike[] = Array.isArray(sess.styleMetadata?.styledGroups)
    ? (sess.styleMetadata!.styledGroups as StyledGroupLike[])
    : []
  const exercises: SessionExercise[] = Array.isArray(sess.exercises)
    ? (sess.exercises as SessionExercise[])
    : []

  // --- Count renderable grouped blocks (adapter-identical rule) ---
  // Priority 1: styledGroups filtered to non-straight + usable-name + min-members.
  const groupedBlockTokens: SupportedMethod[] = []
  const consumedByGroupBlockIds = new Set<string>()

  for (const g of styled) {
    const type = normalizeMethod(g?.groupType)
    if (!type) continue
    const usable = Array.isArray(g?.exercises)
      ? g!.exercises!.filter((m): m is StyledGroupMemberLike => !!m && hasUsableName(m.name))
      : []
    if (usable.length < minMembersFor(type)) continue
    groupedBlockTokens.push(type)
  }

  // If Priority 1 produced any block, the adapter wins with styledGroups and
  // does NOT fall to the exercise-fallback. Scanner mirrors that.
  const priorityOneWins = groupedBlockTokens.length > 0

  if (!priorityOneWins) {
    // Priority 2: exercises sharing the same blockId + non-straight method.
    const blockMembers = new Map<string, { method: SupportedMethod; names: string[] }>()
    for (const ex of exercises) {
      if (!ex?.blockId) continue
      const method = normalizeMethod(ex.method)
      if (!method) continue
      const entry = blockMembers.get(ex.blockId) || { method, names: [] }
      if (hasUsableName(ex.name)) entry.names.push(ex.name as string)
      blockMembers.set(ex.blockId, entry)
    }
    for (const [bId, { method, names }] of blockMembers) {
      if (names.length < minMembersFor(method)) continue
      groupedBlockTokens.push(method)
      consumedByGroupBlockIds.add(bId)
    }
  } else {
    // Priority 1 won; still track which blockIds the card's rich renderer
    // considers consumed so single-method accounting below doesn't double-
    // report a member that IS visibly grouped. Matching is by blockId when
    // the exercise carries one and the styledGroup id matches, else by
    // usable-name equality with any styled member.
    const styledBlockIds = new Set<string>(
      styled.map(g => (typeof g?.id === 'string' ? g!.id! : '')).filter(Boolean)
    )
    const styledMemberNames = new Set<string>()
    for (const g of styled) {
      for (const m of g?.exercises || []) {
        if (hasUsableName(m?.name)) styledMemberNames.add((m!.name as string).toLowerCase().trim())
      }
    }
    for (const ex of exercises) {
      if (ex?.blockId && styledBlockIds.has(ex.blockId)) consumedByGroupBlockIds.add(ex.blockId)
      if (hasUsableName(ex?.name) && styledMemberNames.has((ex!.name as string).toLowerCase().trim())) {
        if (ex?.blockId) consumedByGroupBlockIds.add(ex.blockId)
      }
    }
  }

  // --- Single-exercise method cues ---
  // Exercises that carry a non-straight method but whose blockId (if any)
  // did NOT contribute to a renderable grouped block. These are exactly the
  // rows the card will render with an inline method pill rather than inside
  // a grouped frame. Tracked as a deduped token list per method type.
  const singleMethodCounts: Record<SupportedMethod, number> = {
    superset: 0,
    circuit: 0,
    density_block: 0,
    cluster: 0,
  }
  for (const ex of exercises) {
    const method = normalizeMethod(ex?.method)
    if (!method) continue
    if (ex?.blockId && consumedByGroupBlockIds.has(ex.blockId)) continue
    // If no blockId, it's intrinsically a single-exercise method cue.
    singleMethodCounts[method] += 1
  }

  const groupedBlockCount = groupedBlockTokens.length
  const singleMethodTokens: string[] = []
  ;(Object.keys(singleMethodCounts) as SupportedMethod[]).forEach(m => {
    const n = singleMethodCounts[m]
    if (n > 0) singleMethodTokens.push(`${n}×${titleForMethod(m)}`)
  })

  // Per-type grouped block tally for the row label.
  const groupedBlockLabelTokens: string[] = (() => {
    const c: Record<SupportedMethod, number> = {
      superset: 0, circuit: 0, density_block: 0, cluster: 0,
    }
    for (const t of groupedBlockTokens) c[t] += 1
    const out: string[] = []
    if (c.superset > 0) out.push(`${c.superset}×superset`)
    if (c.circuit > 0) out.push(`${c.circuit}×circuit`)
    if (c.density_block > 0) out.push(`${c.density_block}×density`)
    if (c.cluster > 0) out.push(`${c.cluster}×cluster`)
    return out
  })()

  const hasAny = groupedBlockCount > 0 || singleMethodTokens.length > 0

  // [SCANNER-REASON-TOKEN] Precise dev-readable reason for the common
  // "cluster present on the card but BLOCKS says 0" case. Compact, single
  // token, shown only when it genuinely explains the split so the scanner
  // does not become a wall of noise.
  //
  //   method_only_cluster        -> cluster exists only as a row-level cue
  //                                 (no blockId). Card renders the row flat
  //                                 with an inline method pill; scanner
  //                                 correctly reports BLOCKS:0 METHODS:1x
  //                                 cluster. NOT a bug.
  //
  //   grouped_cluster_requires_multi_member_block
  //                              -> cluster carries a blockId but the block
  //                                 has fewer than minMembersFor('cluster')
  //                                 usable members, so the adapter cannot
  //                                 render it as a framed block.
  let reasonToken: string | null = null
  if (groupedBlockCount === 0 && singleMethodCounts.cluster > 0) {
    const hasClusterWithBlockId = exercises.some(
      e => (e?.method || '').toLowerCase() === 'cluster' && !!e?.blockId,
    )
    reasonToken = hasClusterWithBlockId
      ? 'grouped_cluster_requires_multi_member_block'
      : 'method_only_cluster'
  }

  return {
    day: typeof sess.dayNumber === 'number' ? sess.dayNumber : null,
    name: typeof sess.name === 'string' && sess.name.length > 0 ? sess.name : null,
    focus: typeof sess.focus === 'string' && sess.focus.length > 0 ? sess.focus : null,
    hasAny,
    groupedBlockCount,
    groupedBlockLabelTokens,
    singleMethodTokens,
    exerciseCount: exercises.length,
    reasonToken,
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
  const activeOnly = summaries.filter(s => s.hasAny)

  // Nothing non-straight anywhere -> render nothing, reserve no space.
  if (activeOnly.length === 0) return null

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
          active:<span className="text-[#E6E9EF]"> {activeOnly.length}</span>
        </span>
      </div>
      {/*
        [SCANNER-LEGEND] Explicit BLOCKS vs METHODS legend so the two
        tokens cannot be misread as the same thing. BLOCKS = multi-member
        grouped structure that the card body paints as a framed block
        (e.g. a real superset pair). METHODS = single-row execution cues
        that render as an inline method pill on an ordinary flat row
        (e.g. a primary-effort cluster on one exercise). A session with
        BLOCKS:0 and METHODS:1x cluster is NOT a broken grouped render;
        it is an honestly flat session with a method cue. The card
        surfaces the same distinction via its "Method cues present:"
        status line.
      */}
      <div className="mb-1 text-[9px] uppercase tracking-wide text-[#6B7280]">
        BLOCKS = grouped multi-exercise structure &nbsp;·&nbsp; METHODS = single-row execution cues
      </div>
      <ul className="flex flex-col gap-0.5">
        {activeOnly.map((s, idx) => {
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
                BLOCKS:<span className="text-[#E6E9EF]">
                  {' '}
                  {s.groupedBlockCount > 0
                    ? `${s.groupedBlockCount} (${s.groupedBlockLabelTokens.join(', ')})`
                    : '0'}
                </span>
              </span>
              <span>
                METHODS:<span className="text-[#E6E9EF]">
                  {' '}
                  {s.singleMethodTokens.length > 0 ? s.singleMethodTokens.join(', ') : '-'}
                </span>
              </span>
              <span>
                EX:<span className="text-[#E6E9EF]">{s.exerciseCount}</span>
              </span>
              {s.reasonToken && (() => {
                // [SCANNER-REASON-HUMANIZATION] Map machine tokens to compact
                // human phrases so a glance at the scanner reads honestly:
                // "method-only cluster (not grouped)" cannot be misread as
                // a broken grouped render. Machine tokens themselves remain
                // stable on `s.reasonToken` for audit/tests.
                const humanWhy =
                  s.reasonToken === 'method_only_cluster'
                    ? 'method-only cluster (not grouped)'
                    : s.reasonToken === 'grouped_cluster_requires_multi_member_block'
                      ? 'cluster block needs 2+ members'
                      : s.reasonToken
                return (
                  <span>
                    WHY:<span className="text-[#E6E9EF]"> {humanWhy}</span>
                  </span>
                )
              })()}
              <span className="truncate text-[#6B7280]">· {labelToken}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
