/**
 * Advanced Skill Progression Graphs (re-export shim)
 *
 * [DOCTRINAL-ARCHITECTURE] This module previously contained a full set of
 * elite-skill progression graph data (MALTESE_GRAPH, PLANCHE_PUSHUP_GRAPH,
 * FRONT_LEVER_PULLUP_GRAPH, SLOW_MUSCLE_UP_GRAPH) hand-authored against an
 * older `SkillProgressionGraph` shape that used:
 *   - `entryNode` / `terminalNode` (now `entryNodeId` / `terminalNodeIds`)
 *   - `movementFamily` (now `category`)
 *   - `knowledgeBubble.fullExplanation` (now `detailedExplanation`)
 *   - omitted `commonMistakes`, `techniqueCues`, `primaryStressAreas`,
 *     `recommendedFrequency`, `globalPrerequisites`, `generalSafetyWarnings`
 *   - omitted `notes` on every `ProgressionEdge`
 *
 * The canonical, contract-compliant graph data for the same four skills
 * (plus `WEIGHTED_MUSCLE_UP_GRAPH`) has long been maintained in
 * `lib/advanced-skill-progression-graphs.ts`, which is the single source of
 * truth referenced everywhere else in the codebase. The two files were
 * accidentally diverging copies of the same domain data, with the legacy
 * file failing TypeScript against the canonical
 * `SkillProgressionGraph` / `ProgressionNode` / `ProgressionEdge` contracts
 * defined in `lib/skill-progression-graph-engine.ts`.
 *
 * Rather than maintain two parallel data sources (and continually
 * re-fail TypeScript whenever the canonical contract evolves), this file
 * now re-exports the canonical graph constants directly. This:
 *   - preserves the public import path (`@/lib/advanced-skill-graphs`)
 *     used by `lib/skill-progression-graph-engine.ts:17`
 *   - guarantees the 4 graphs structurally satisfy the canonical
 *     `SkillProgressionGraph` interface (no contract drift possible)
 *   - eliminates the ~50 stale-field TypeScript errors this file produced
 *   - removes the doctrinal risk of two graphs disagreeing on node data
 *
 * No graph data is lost: the canonical file already contains the same
 * four skills with richer, contract-compliant content (full
 * `commonMistakes`, `techniqueCues`, `primaryStressAreas`, plus the
 * `WEIGHTED_MUSCLE_UP_GRAPH` extension that this legacy file lacked).
 *
 * If a future change needs to edit graph data, edit
 * `lib/advanced-skill-progression-graphs.ts` directly.
 */

export {
  MALTESE_GRAPH,
  PLANCHE_PUSHUP_GRAPH,
  FRONT_LEVER_PULLUP_GRAPH,
  SLOW_MUSCLE_UP_GRAPH,
} from './advanced-skill-progression-graphs'
