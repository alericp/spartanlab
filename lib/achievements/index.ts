// Achievement System - Public API
//
// [ACHIEVEMENT-INDEX-DUPLICATE-EXPORT] Both `achievement-definitions` and
// `achievement-engine` export `getUnlockedAchievements` and
// `markAchievementSeen`. Wildcard re-exporting both produced TS2308 at
// this file. The engine versions are the ones every external caller
// imports from `@/lib/achievements/...` (achievement-engine.ts is the
// behavior owner; achievement-definitions.ts is the data/registry
// owner with helper duplicates). Re-export the engine versions
// explicitly and surface everything else from definitions, then
// re-export the engine namespace too — without duplicating the two
// conflicting names.
export * from './achievement-definitions'
export {
  // Behavior surface (engine owner)
  onTrainingEvent,
  getUnlockedAchievements,
  markAchievementSeen,
} from './achievement-engine'
