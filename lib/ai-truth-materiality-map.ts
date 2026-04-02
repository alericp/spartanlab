/**
 * AI TRUTH MATERIALITY MAP
 * 
 * =============================================================================
 * AUTHORITATIVE DIAGNOSTIC: Field-by-field materiality verdicts
 * =============================================================================
 * 
 * This file defines the SINGLE authoritative map of which onboarding/canonical
 * profile fields are:
 * 1. Persisted to the program object
 * 2. Read back on program load
 * 3. Consumed by the generator
 * 4. Materially affecting the final program output
 * 5. Surfaced in the UI (ProgramTruthSummary or program page)
 * 
 * MATERIALITY DEFINITION:
 * A field is "materially generative" ONLY if it changes at least one of:
 * - Weekly structure (session count, architecture)
 * - Exercise selection (which exercises appear)
 * - Session style (supersets, circuits, straight sets)
 * - Volume/intensity (sets, reps, load)
 * - Support work selection (accessories, prehab)
 * - Warmup/cooldown content
 * 
 * A field is NOT materially generative if it is only:
 * - Saved but not read
 * - Logged but not used in logic
 * - Shown in explanation copy but doesn't affect actual output
 * 
 * VERDICTS:
 * - GREEN: Materially influencing output appropriately
 * - YELLOW: Persisted/read but weakly expressed or not clearly visible
 * - RED: Important truth missing, downgraded, or non-material
 */

// =============================================================================
// TYPES
// =============================================================================

export type MaterialityVerdict = 'GREEN' | 'YELLOW' | 'RED'

export interface FieldMaterialityRecord {
  fieldName: string
  // Chain tracking
  canonicalSourcePresent: boolean
  savedOnProgram: boolean
  savedInGenerationTruthSnapshot: boolean
  restoredOnRead: boolean
  usedByGenerator: boolean
  materiallyAffectsOutput: boolean | 'uncertain'
  surfacedInUI: boolean
  // Verdict
  verdict: MaterialityVerdict
  reason: string
  // Fix priority
  nearestFileOrFunction: string
  nextFixPriority: 'high' | 'medium' | 'low' | 'none'
}

// =============================================================================
// AUTHORITATIVE MATERIALITY MAP
// =============================================================================

export const TRUTH_MATERIALITY_MAP: FieldMaterialityRecord[] = [
  // ==========================================================================
  // GOALS & IDENTITY
  // ==========================================================================
  {
    fieldName: 'primaryGoal',
    canonicalSourcePresent: true,
    savedOnProgram: true,
    savedInGenerationTruthSnapshot: true,
    restoredOnRead: true,
    usedByGenerator: true,
    materiallyAffectsOutput: true,
    surfacedInUI: true,
    verdict: 'GREEN',
    reason: 'Drives structure selection, skill block emphasis, exercise selection. Shown in UI.',
    nearestFileOrFunction: 'adaptive-program-builder.ts: resolveGoalStructure()',
    nextFixPriority: 'none',
  },
  {
    fieldName: 'secondaryGoal',
    canonicalSourcePresent: true,
    savedOnProgram: true,
    savedInGenerationTruthSnapshot: true,
    restoredOnRead: true,
    usedByGenerator: true,
    materiallyAffectsOutput: true,
    surfacedInUI: false,
    verdict: 'YELLOW',
    reason: 'Used in generation but NOT shown in ProgramTruthSummary. User cannot see secondary goal impact.',
    nearestFileOrFunction: 'ProgramTruthSummary.tsx: identitySecondary',
    nextFixPriority: 'medium',
  },
  {
    fieldName: 'selectedSkills',
    canonicalSourcePresent: true,
    savedOnProgram: true,
    savedInGenerationTruthSnapshot: true,
    restoredOnRead: true,
    usedByGenerator: true,
    materiallyAffectsOutput: true,
    surfacedInUI: true,
    verdict: 'GREEN',
    reason: 'Determines skill blocks, exercise selection. Shown in "Skills Targeted" and tags.',
    nearestFileOrFunction: 'adaptive-program-builder.ts: buildSkillBlocks()',
    nextFixPriority: 'none',
  },
  {
    fieldName: 'goalCategories',
    canonicalSourcePresent: true,
    savedOnProgram: true,
    savedInGenerationTruthSnapshot: false,
    restoredOnRead: true,
    usedByGenerator: true,
    materiallyAffectsOutput: true,
    surfacedInUI: false,
    verdict: 'YELLOW',
    reason: 'Multiple categories influence hierarchy but not shown in explanation.',
    nearestFileOrFunction: 'adaptive-program-builder.ts: resolveGoalCategories()',
    nextFixPriority: 'low',
  },
  {
    fieldName: 'trainingPathType',
    canonicalSourcePresent: true,
    savedOnProgram: true,
    savedInGenerationTruthSnapshot: false,
    restoredOnRead: true,
    usedByGenerator: true,
    materiallyAffectsOutput: true,
    surfacedInUI: false,
    verdict: 'YELLOW',
    reason: 'skill_progression vs strength_endurance vs hybrid affects structure but hidden.',
    nearestFileOrFunction: 'adaptive-program-builder.ts: trainingPathType handling',
    nextFixPriority: 'low',
  },
  
  // ==========================================================================
  // SCHEDULE & DURATION
  // ==========================================================================
  {
    fieldName: 'scheduleMode',
    canonicalSourcePresent: true,
    savedOnProgram: true,
    savedInGenerationTruthSnapshot: true,
    restoredOnRead: true,
    usedByGenerator: true,
    materiallyAffectsOutput: true,
    surfacedInUI: true,
    verdict: 'GREEN',
    reason: 'static vs flexible is core identity. Shown in Schedule Status panel.',
    nearestFileOrFunction: 'adaptive-program-builder.ts: resolveScheduleMode()',
    nextFixPriority: 'none',
  },
  {
    fieldName: 'trainingDaysPerWeek',
    canonicalSourcePresent: true,
    savedOnProgram: true,
    savedInGenerationTruthSnapshot: true,
    restoredOnRead: true,
    usedByGenerator: true,
    materiallyAffectsOutput: true,
    surfacedInUI: true,
    verdict: 'GREEN',
    reason: 'Baseline frequency shown in Schedule Status. Drives session count.',
    nearestFileOrFunction: 'adaptive-program-builder.ts: resolveSessionCount()',
    nextFixPriority: 'none',
  },
  {
    fieldName: 'sessionDurationMode',
    canonicalSourcePresent: true,
    savedOnProgram: true,
    savedInGenerationTruthSnapshot: true,
    restoredOnRead: true,
    usedByGenerator: true,
    materiallyAffectsOutput: true,
    surfacedInUI: false,
    verdict: 'YELLOW',
    reason: 'static vs adaptive affects compression but not explained in UI.',
    nearestFileOrFunction: 'adaptive-program-builder.ts: sessionDurationMode',
    nextFixPriority: 'low',
  },
  {
    fieldName: 'sessionLengthMinutes',
    canonicalSourcePresent: true,
    savedOnProgram: true,
    savedInGenerationTruthSnapshot: true,
    restoredOnRead: true,
    usedByGenerator: true,
    materiallyAffectsOutput: true,
    surfacedInUI: true,
    verdict: 'GREEN',
    reason: 'Duration target shown in session cards. Drives exercise count.',
    nearestFileOrFunction: 'adaptive-program-builder.ts: resolveSessionLength()',
    nextFixPriority: 'none',
  },
  
  // ==========================================================================
  // EXPERIENCE & EQUIPMENT
  // ==========================================================================
  {
    fieldName: 'experienceLevel',
    canonicalSourcePresent: true,
    savedOnProgram: true,
    savedInGenerationTruthSnapshot: true,
    restoredOnRead: true,
    usedByGenerator: true,
    materiallyAffectsOutput: true,
    surfacedInUI: false,
    verdict: 'YELLOW',
    reason: 'Affects volume, progression rate, complexity. NOT displayed in truth summary.',
    nearestFileOrFunction: 'adaptive-program-builder.ts: experienceLevelAdjustment()',
    nextFixPriority: 'medium',
  },
  {
    fieldName: 'equipment',
    canonicalSourcePresent: true,
    savedOnProgram: true,
    savedInGenerationTruthSnapshot: true,
    restoredOnRead: true,
    usedByGenerator: true,
    materiallyAffectsOutput: true,
    surfacedInUI: false,
    verdict: 'YELLOW',
    reason: 'Critical for exercise filtering. NOT shown in UI - user doesnt know what was filtered.',
    nearestFileOrFunction: 'adaptive-program-builder.ts: filterByEquipment()',
    nextFixPriority: 'medium',
  },
  
  // ==========================================================================
  // TRAINING METHOD PREFERENCES - HIGH PRIORITY FROM AUDIT
  // ==========================================================================
  {
    fieldName: 'trainingMethodPreferences',
    canonicalSourcePresent: true,
    savedOnProgram: true, // [METHOD-TRUTH-CONTRACT] Now a first-class field on AdaptiveProgram
    savedInGenerationTruthSnapshot: true,
    restoredOnRead: true, // [METHOD-TRUTH-CONTRACT] Now survives save/read cycle as first-class field
    usedByGenerator: true,
    materiallyAffectsOutput: true,
    surfacedInUI: true, // [PHASE 2] Now surfaced in ProgramTruthSummary
    verdict: 'GREEN', // [METHOD-TRUTH-CONTRACT] Fully authoritative, durable, and materially generative
    reason: 'Supersets/circuits/density affects session structure. Now elevated to first-class program field, applied via applySessionStylePreferences() and explained in ProgramTruthSummary.',
    nearestFileOrFunction: 'authoritative-program-generation.ts: program.trainingMethodPreferences, adaptive-program-builder.ts: applySessionStylePreferences(), ai-truth-audit.ts: aggregateActualAppliedMethods()',
    nextFixPriority: 'done', // [METHOD-TRUTH-CONTRACT] Completed
  },
  {
    fieldName: 'sessionStylePreference',
    canonicalSourcePresent: true,
    savedOnProgram: true, // [SESSION-STYLE-TRUTH] Now elevated to first-class field
    savedInGenerationTruthSnapshot: true,
    restoredOnRead: true, // [SESSION-STYLE-TRUTH] Now survives save/read cycle
    usedByGenerator: true, // [SESSION-STYLE-MATERIALITY] Now materially adjusts session construction
    materiallyAffectsOutput: true, // [SESSION-STYLE-MATERIALITY] Now affects exercise counts, accessories
    surfacedInUI: true, // [SESSION-STYLE-MATERIALITY] Shows materiality status in ProgramTruthSummary
    verdict: 'GREEN', // [SESSION-STYLE-MATERIALITY] Fully authoritative, durable, and materially generative
    reason: 'longer_complete vs shorter_focused materially adjusts session construction via applySessionStyleToDurationConfig(). Affects exercise counts and accessory inclusion.',
    nearestFileOrFunction: 'adaptive-program-builder.ts: applySessionStyleToDurationConfig(), authoritative-program-generation.ts: program.sessionStylePreference',
    nextFixPriority: 'done', // [SESSION-STYLE-MATERIALITY] Completed
  },
  
  // ==========================================================================
  // FLEXIBILITY GOALS
  // ==========================================================================
  {
    fieldName: 'selectedFlexibility',
    canonicalSourcePresent: true,
    savedOnProgram: true, // [FLEXIBILITY-TRUTH-CONTRACT] Now elevated to first-class field
    savedInGenerationTruthSnapshot: true,
    restoredOnRead: true, // [FLEXIBILITY-TRUTH-CONTRACT] Now survives save/read cycle
    usedByGenerator: true,
    materiallyAffectsOutput: true,
    surfacedInUI: true, // [FLEXIBILITY-TRUTH-CONTRACT] Now shown in ProgramTruthSummary
    verdict: 'GREEN', // [FLEXIBILITY-TRUTH-CONTRACT] Fully authoritative, durable, and materially generative
    reason: 'Affects cooldown/mobility content via planFlexibilityInsertions(). Now durably persisted on program and shown in UI.',
    nearestFileOrFunction: 'authoritative-program-generation.ts: program.selectedFlexibility, engine-quality-contract.ts: planFlexibilityInsertions()',
    nextFixPriority: 'done', // [FLEXIBILITY-TRUTH-CONTRACT] Completed
  },
  
  // ==========================================================================
  // JOINT CAUTIONS - HIGH PRIORITY FROM AUDIT
  // ==========================================================================
  {
    fieldName: 'jointCautions',
    canonicalSourcePresent: true,
    savedOnProgram: true, // [AI-TRUTH-PERSISTENCE] Now elevated to first-class field
    savedInGenerationTruthSnapshot: true,
    restoredOnRead: true, // [AI-TRUTH-PERSISTENCE] Now survives save/read cycle
    usedByGenerator: true,
    materiallyAffectsOutput: true,
    surfacedInUI: true, // [AI-TRUTH-PERSISTENCE] Now shown in ProgramTruthSummary
    verdict: 'GREEN', // [AI-TRUTH-PERSISTENCE] Upgraded - fully durable and surfaced
    reason: 'CRITICAL: Filters exercises for safety. Now durably persisted and shown in UI.',
    nearestFileOrFunction: 'authoritative-program-generation.ts: program.jointCautions, exercise-database-resolver.ts: hasJointConflict()',
    nextFixPriority: 'done', // [AI-TRUTH-PERSISTENCE] Completed
  },
  
  // ==========================================================================
  // WEIGHTED STRENGTH BENCHMARKS - HIGH PRIORITY FROM AUDIT
  // ==========================================================================
  {
    fieldName: 'weightedPullUp',
    canonicalSourcePresent: true,
    savedOnProgram: false,
    savedInGenerationTruthSnapshot: true,
    restoredOnRead: false,
    usedByGenerator: true,
    materiallyAffectsOutput: true,
    surfacedInUI: false,
    verdict: 'YELLOW',
    reason: 'Drives weighted load prescription. Only in snapshot. User doesnt see it influenced loading.',
    nearestFileOrFunction: 'adaptive-program-builder.ts: resolveWeightedLoading()',
    nextFixPriority: 'high',
  },
  {
    fieldName: 'weightedDip',
    canonicalSourcePresent: true,
    savedOnProgram: false,
    savedInGenerationTruthSnapshot: true,
    restoredOnRead: false,
    usedByGenerator: true,
    materiallyAffectsOutput: true,
    surfacedInUI: false,
    verdict: 'YELLOW',
    reason: 'Drives weighted load prescription. Only in snapshot. User doesnt see it influenced loading.',
    nearestFileOrFunction: 'adaptive-program-builder.ts: resolveWeightedLoading()',
    nextFixPriority: 'high',
  },
  
  // ==========================================================================
  // SKILL BENCHMARKS / PROGRESSIONS
  // ==========================================================================
  {
    fieldName: 'plancheProgression',
    canonicalSourcePresent: true,
    savedOnProgram: false,
    savedInGenerationTruthSnapshot: true,
    restoredOnRead: false,
    usedByGenerator: true,
    materiallyAffectsOutput: true,
    surfacedInUI: false,
    verdict: 'YELLOW',
    reason: 'Determines planche exercise variation. Only in snapshot. User doesnt know their level shaped exercises.',
    nearestFileOrFunction: 'adaptive-program-builder.ts: resolveSkillProgression()',
    nextFixPriority: 'medium',
  },
  {
    fieldName: 'frontLeverProgression',
    canonicalSourcePresent: true,
    savedOnProgram: false,
    savedInGenerationTruthSnapshot: true,
    restoredOnRead: false,
    usedByGenerator: true,
    materiallyAffectsOutput: true,
    surfacedInUI: false,
    verdict: 'YELLOW',
    reason: 'Determines front lever exercise variation. Only in snapshot.',
    nearestFileOrFunction: 'adaptive-program-builder.ts: resolveSkillProgression()',
    nextFixPriority: 'medium',
  },
  
  // ==========================================================================
  // DIAGNOSTICS & RECOVERY
  // ==========================================================================
  {
    fieldName: 'weakestArea',
    canonicalSourcePresent: true,
    savedOnProgram: true,
    savedInGenerationTruthSnapshot: true,
    restoredOnRead: true,
    usedByGenerator: true,
    materiallyAffectsOutput: true,
    surfacedInUI: false,
    verdict: 'YELLOW',
    reason: 'Affects accessory selection. Saved but not explained in UI.',
    nearestFileOrFunction: 'weak-point-engine.ts: detectWeakPoints()',
    nextFixPriority: 'low',
  },
  {
    fieldName: 'primaryLimitation',
    canonicalSourcePresent: true,
    savedOnProgram: false,
    savedInGenerationTruthSnapshot: true,
    restoredOnRead: false,
    usedByGenerator: true,
    materiallyAffectsOutput: true,
    surfacedInUI: false,
    verdict: 'YELLOW',
    reason: 'mobility/strength limiter affects emphasis. Only in snapshot.',
    nearestFileOrFunction: 'adaptive-program-builder.ts: applyLimiterLogic()',
    nextFixPriority: 'low',
  },
  {
    fieldName: 'recoveryQuality',
    canonicalSourcePresent: true,
    savedOnProgram: true,
    savedInGenerationTruthSnapshot: true,
    restoredOnRead: true,
    usedByGenerator: true,
    materiallyAffectsOutput: true,
    surfacedInUI: false,
    verdict: 'YELLOW',
    reason: 'Affects volume/intensity. Saved but not shown in explanation.',
    nearestFileOrFunction: 'adaptive-program-builder.ts: applyRecoveryModifier()',
    nextFixPriority: 'low',
  },
]

// =============================================================================
// SUMMARY FUNCTIONS
// =============================================================================

export function getMaterialitySummary(): {
  greenCount: number
  yellowCount: number
  redCount: number
  highPriorityFixes: string[]
  topUnderexpressedField: string | null
} {
  const greenCount = TRUTH_MATERIALITY_MAP.filter(f => f.verdict === 'GREEN').length
  const yellowCount = TRUTH_MATERIALITY_MAP.filter(f => f.verdict === 'YELLOW').length
  const redCount = TRUTH_MATERIALITY_MAP.filter(f => f.verdict === 'RED').length
  
  const highPriorityFixes = TRUTH_MATERIALITY_MAP
    .filter(f => f.nextFixPriority === 'high')
    .map(f => f.fieldName)
  
  // Determine top underexpressed field
  const topUnderexpressed = TRUTH_MATERIALITY_MAP
    .filter(f => f.verdict === 'YELLOW' && f.nextFixPriority === 'high')
    .sort((a, b) => {
      // Prioritize fields that are materially affecting output but not surfaced
      if (a.materiallyAffectsOutput && !a.surfacedInUI) return -1
      if (b.materiallyAffectsOutput && !b.surfacedInUI) return 1
      return 0
    })[0]
  
  return {
    greenCount,
    yellowCount,
    redCount,
    highPriorityFixes,
    topUnderexpressedField: topUnderexpressed?.fieldName || null,
  }
}

export function getFieldsPersistedButNotMateriallyGenerative(): string[] {
  return TRUTH_MATERIALITY_MAP
    .filter(f => f.savedOnProgram && f.materiallyAffectsOutput === false)
    .map(f => f.fieldName)
}

export function getFieldsMateriallyGenerativeButNotSurfaced(): string[] {
  return TRUTH_MATERIALITY_MAP
    .filter(f => f.materiallyAffectsOutput === true && !f.surfacedInUI)
    .map(f => f.fieldName)
}

export function getFieldsFullyConnected(): string[] {
  return TRUTH_MATERIALITY_MAP
    .filter(f => f.verdict === 'GREEN')
    .map(f => f.fieldName)
}

export function logMaterialityAudit(): void {
  const summary = getMaterialitySummary()
  
  console.log('[AI-TRUTH-MATERIALITY-AUDIT]', {
    timestamp: new Date().toISOString(),
    greenCount: summary.greenCount,
    yellowCount: summary.yellowCount,
    redCount: summary.redCount,
    highPriorityFixes: summary.highPriorityFixes,
    topUnderexpressedField: summary.topUnderexpressedField,
    fullyConnected: getFieldsFullyConnected(),
    materialButNotSurfaced: getFieldsMateriallyGenerativeButNotSurfaced(),
  })
}

// =============================================================================
// PERSONAL ALIGNMENT ANALYSIS
// =============================================================================

export interface PersonalAlignmentAnalysis {
  profileShape: string
  alignedFields: string[]
  underexpressedFields: string[]
  singleHighestValueFix: string
  alignmentVerdict: 'FULLY_ALIGNED' | 'MOSTLY_ALIGNED' | 'PARTIALLY_ALIGNED' | 'NEEDS_WORK'
}

/**
 * Analyze alignment against an advanced user profile shape:
 * - Advanced experience
 * - Planche primary, Front Lever secondary
 * - Hybrid/skill-strength orientation
 * - Flexible/adaptive schedule
 * - Weighted loading enabled
 * - Meaningful training method preferences
 */
export function analyzePersonalAlignment(): PersonalAlignmentAnalysis {
  const profileShape = 'advanced | planche-primary | front-lever-secondary | hybrid | flexible | weighted-loading-enabled'
  
  // Fields critical for this profile shape
  const criticalFields = [
    'primaryGoal',           // planche - must be headline
    'secondaryGoal',         // front lever - must influence
    'selectedSkills',        // skill blocks
    'scheduleMode',          // flexible
    'trainingMethodPreferences', // session structure
    'weightedPullUp',        // weighted loading
    'weightedDip',           // weighted loading
    'plancheProgression',    // exercise selection
    'frontLeverProgression', // exercise selection
    'experienceLevel',       // volume/complexity
  ]
  
  const alignedFields: string[] = []
  const underexpressedFields: string[] = []
  
  for (const fieldName of criticalFields) {
    const record = TRUTH_MATERIALITY_MAP.find(f => f.fieldName === fieldName)
    if (!record) continue
    
    if (record.verdict === 'GREEN') {
      alignedFields.push(fieldName)
    } else {
      underexpressedFields.push(fieldName)
    }
  }
  
  // Determine single highest value fix
  // Priority: trainingMethodPreferences (most visible impact on session structure)
  // Then: weightedPullUp/weightedDip (loading prescriptions)
  // Then: jointCautions (safety visibility)
  let singleHighestValueFix = 'trainingMethodPreferences'
  
  const highPriorityYellow = TRUTH_MATERIALITY_MAP
    .filter(f => f.verdict === 'YELLOW' && f.nextFixPriority === 'high')
  
  if (highPriorityYellow.length > 0) {
    // trainingMethodPreferences is highest value because it's most visible to user
    const methodPrefs = highPriorityYellow.find(f => f.fieldName === 'trainingMethodPreferences')
    if (methodPrefs) {
      singleHighestValueFix = 'trainingMethodPreferences'
    } else {
      singleHighestValueFix = highPriorityYellow[0].fieldName
    }
  }
  
  // Determine alignment verdict
  let alignmentVerdict: PersonalAlignmentAnalysis['alignmentVerdict']
  const alignmentRatio = alignedFields.length / criticalFields.length
  
  if (alignmentRatio >= 0.9) {
    alignmentVerdict = 'FULLY_ALIGNED'
  } else if (alignmentRatio >= 0.7) {
    alignmentVerdict = 'MOSTLY_ALIGNED'
  } else if (alignmentRatio >= 0.5) {
    alignmentVerdict = 'PARTIALLY_ALIGNED'
  } else {
    alignmentVerdict = 'NEEDS_WORK'
  }
  
  return {
    profileShape,
    alignedFields,
    underexpressedFields,
    singleHighestValueFix,
    alignmentVerdict,
  }
}
