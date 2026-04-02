/**
 * Doctrine DB Audit API
 * 
 * GET /api/audit/doctrine-db
 * 
 * Returns a clean JSON audit of:
 * - Whether doctrine tables exist
 * - Row counts per table
 * - Whether any live doctrine source exists
 * - Whether any progression rules exist
 * - Whether any exercise selection rules exist
 * - Whether any prescription rules exist
 * - Whether sources are active
 * - Whether generator currently reads doctrine DB
 * 
 * This route is read-only and diagnostic only.
 */

import { NextResponse } from 'next/server'
import { checkDoctrineRuntimeReadiness } from '@/lib/doctrine-runtime-readiness'
import { compareDoctrineSourcesStatus } from '@/lib/doctrine-query-service'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Get runtime readiness check
    const readiness = await checkDoctrineRuntimeReadiness()
    
    // Get comparison between code and DB sources
    const comparison = await compareDoctrineSourcesStatus()
    
    // Build comprehensive audit response
    const audit = {
      timestamp: new Date().toISOString(),
      phase: 'doctrine_db_foundation_audit',
      
      // Table existence
      tablesExist: readiness.tablesPresent,
      
      // Row counts per table
      tableCounts: {
        training_doctrine_sources: readiness.counts.sources,
        training_doctrine_principles: readiness.counts.principles,
        progression_rules: readiness.counts.progressionRules,
        exercise_selection_rules: readiness.counts.exerciseSelectionRules,
        exercise_contraindication_rules: readiness.counts.contraindicationRules,
        method_rules: readiness.counts.methodRules,
        prescription_rules: readiness.counts.prescriptionRules,
        skill_carryover_rules: readiness.counts.carryoverRules,
        total_rules: readiness.counts.totalRules,
      },
      
      // Active sources status
      activeSourcesExist: readiness.liveSourcesPresent,
      activeSourcesCount: readiness.counts.activeSources,
      
      // Key rule existence
      hasProgressionRules: readiness.hasProgressionRules,
      hasExerciseSelectionRules: readiness.hasExerciseSelectionRules,
      hasPrescriptionRules: readiness.hasPrescriptionRules,
      hasContraindicationRules: readiness.hasContraindicationRules,
      hasMethodRules: readiness.hasMethodRules,
      hasCarryoverRules: readiness.hasCarryoverRules,
      
      // Minimum thresholds
      minimumThresholdsMet: {
        principles: readiness.minPrinciplesMet,
        progressionRules: readiness.minProgressionRulesMet,
        exerciseSelectionRules: readiness.minExerciseRulesMet,
        contraindicationRules: readiness.minContraindicationsMet,
      },
      
      // Code vs DB comparison
      codeRegistries: {
        doctrineRegistry: comparison.codeRegistries.doctrineRegistry.length,
        methodProfiles: comparison.codeRegistries.methodProfiles.length,
        skillSupportMappings: comparison.codeRegistries.skillSupportMappings.length,
        doctrineIds: comparison.codeRegistries.doctrineRegistry,
        methodProfileIds: comparison.codeRegistries.methodProfiles,
        skillMappingIds: comparison.codeRegistries.skillSupportMappings,
      },
      
      // Current generator status
      generatorCurrentlyReadsDoctrineDB: false, // NOT YET - will be true after wiring phase
      generatorCurrentlyReadsCodeRegistries: true, // Currently using code registries
      
      // Status verdicts
      status: {
        codeOnlyToday: comparison.status.codeOnlyToday,
        dbFoundationExists: comparison.status.dbFoundationExists,
        dbHasData: comparison.status.dbHasData,
        readyForHybrid: comparison.status.readyForHybrid,
      },
      
      // Overall readiness
      readiness: {
        verdict: readiness.readinessVerdict,
        explanation: readiness.readinessExplanation,
        safeToConsumeInLaterPhase: readiness.safeToConsumeInLaterPhase,
        missingComponents: readiness.missingComponents,
      },
      
      // Next steps
      nextSteps: getNextSteps(readiness, comparison),
    }
    
    return NextResponse.json(audit)
  } catch (error) {
    console.error('[doctrine-db-audit] Error:', error)
    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        phase: 'doctrine_db_foundation_audit',
        error: 'Failed to perform doctrine DB audit',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        tablesExist: false,
        generatorCurrentlyReadsDoctrineDB: false,
        generatorCurrentlyReadsCodeRegistries: true,
      },
      { status: 500 }
    )
  }
}

function getNextSteps(
  readiness: Awaited<ReturnType<typeof checkDoctrineRuntimeReadiness>>,
  comparison: Awaited<ReturnType<typeof compareDoctrineSourcesStatus>>
): string[] {
  const steps: string[] = []
  
  if (!readiness.tablesPresent) {
    steps.push('1. Run migration: scripts/012-doctrine-foundation-schema.sql')
    steps.push('2. Run seed: scripts/013-doctrine-foundation-seed.sql')
  } else if (!readiness.liveSourcesPresent) {
    steps.push('1. Run seed: scripts/013-doctrine-foundation-seed.sql')
  } else if (!readiness.minimumCoverageMet) {
    steps.push('1. Add more doctrine data to meet minimum thresholds')
    steps.push(`   Missing: ${readiness.missingComponents.join(', ')}`)
  } else if (comparison.status.readyForHybrid) {
    steps.push('1. Doctrine DB foundation is ready')
    steps.push('2. Next phase: Wire doctrine DB into generator')
    steps.push('3. Implement selectDoctrinesForAthlete() call from builder')
  }
  
  return steps
}
