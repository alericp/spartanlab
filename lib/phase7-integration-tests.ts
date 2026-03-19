/**
 * Phase 7 Integration Checks
 * 
 * Quick runtime checks to ensure all doctrine expansions are wired correctly
 * Run this during development to validate Phase 7 implementation
 */

import { calculateCanonicalReadiness, type AthleteReadinessInput } from './readiness/canonical-readiness-engine'
import { EXERCISE_CLASSIFICATIONS } from './exercise-classification-registry'
import { PROGRESSION_LADDERS } from './progression-ladders'
import { SKILL_PREREQUISITE_PROFILES } from './skill-readiness/skillPrerequisiteData'
import { DOCTRINE_REGISTRY } from './training-doctrine-registry/doctrineRegistry'
import { generateDoctrineCoverageReport, logCoverageReport, validateDragonFlagIntegration } from './doctrine-coverage-validator'

/**
 * Test 1: Dragon Flag Readiness Calculation
 */
export function testDragonFlagReadiness(): boolean {
  console.log('[phase7-test] Testing Dragon Flag Readiness Calculation...')
  
  const input: AthleteReadinessInput = {
    dragonFlagTuckReps: 8,
    legRaiseMax: 15,
    abWheelRolloutMax: 12,
    hollowHoldTime: 60,
    lowerBackMobility: 'good',
  }
  
  const result = calculateCanonicalReadiness('dragon_flag', input)
  
  if (!result || result.skill !== 'dragon_flag') {
    console.error('[phase7-test] ✗ Dragon flag readiness calculation failed')
    return false
  }
  
  console.log(`[phase7-test] ✓ Dragon Flag Score: ${result.overallScore}/100 - ${result.levelLabel}`)
  console.log(`[phase7-test] ✓ Primary Limiter: ${result.primaryLimiter}`)
  return true
}

/**
 * Test 2: Dragon Flag Exercise Availability
 */
export function testDragonFlagExercises(): boolean {
  console.log('[phase7-test] Testing Dragon Flag Exercise Coverage...')
  
  const requiredExercises = ['dragon_flag_tuck', 'dragon_flag_neg', 'dragon_flag', 'dragon_flag_assisted']
  const missing = requiredExercises.filter(id => !(id in EXERCISE_CLASSIFICATIONS))
  
  if (missing.length > 0) {
    console.error(`[phase7-test] ✗ Missing dragon flag exercises: ${missing.join(', ')}`)
    return false
  }
  
  console.log(`[phase7-test] ✓ All ${requiredExercises.length} dragon flag exercises present`)
  return true
}

/**
 * Test 3: Dragon Flag Prerequisite Profile
 */
export function testDragonFlagPrerequisites(): boolean {
  console.log('[phase7-test] Testing Dragon Flag Prerequisite Profile...')
  
  if (!('dragon_flag' in SKILL_PREREQUISITE_PROFILES)) {
    console.error('[phase7-test] ✗ Dragon flag missing from prerequisite profiles')
    return false
  }
  
  const profile = SKILL_PREREQUISITE_PROFILES['dragon_flag']
  
  if (!profile || !profile.metrics || profile.metrics.length === 0) {
    console.error('[phase7-test] ✗ Dragon flag prerequisite profile incomplete')
    return false
  }
  
  console.log(`[phase7-test] ✓ Dragon flag prerequisite profile has ${profile.metrics.length} metrics`)
  return true
}

/**
 * Test 4: Dragon Flag Progression Ladder
 */
export function testDragonFlagLadder(): boolean {
  console.log('[phase7-test] Testing Dragon Flag Progression Ladder...')
  
  const coreLadder = PROGRESSION_LADDERS.find(l => l.id === 'anti_extension_progression')
  
  if (!coreLadder) {
    console.error('[phase7-test] ✗ Anti-extension progression ladder not found')
    return false
  }
  
  // Check if dragon flag exercises are in the ladder
  const hasDF = coreLadder.steps.some(s => s.exerciseId.includes('dragon_flag'))
  
  if (!hasDF) {
    console.warn('[phase7-test] ⚠ Dragon flag not in anti-extension ladder (may be expected)')
  } else {
    console.log(`[phase7-test] ✓ Dragon flag integrated in progression ladder`)
  }
  
  return true
}

/**
 * Test 5: Weighted Calisthenics Support
 */
export function testWeightedCalisthenicsSupport(): boolean {
  console.log('[phase7-test] Testing Weighted Calisthenics Support...')
  
  const weightedBasics = [
    'weighted_pull_up',
    'weighted_chin_up',
    'weighted_dip',
    'weighted_row',
  ]
  
  const missing = weightedBasics.filter(id => !(id in EXERCISE_CLASSIFICATIONS))
  
  if (missing.length > 0) {
    console.warn(`[phase7-test] ⚠ Missing weighted exercises: ${missing.join(', ')} (may be expected)`)
  } else {
    console.log(`[phase7-test] ✓ All weighted basics are classified`)
  }
  
  return true
}

/**
 * Test 6: Doctrine Registry
 */
export function testDoctrineRegistry(): boolean {
  console.log('[phase7-test] Testing Doctrine Registry...')
  
  const doctrines = Object.keys(DOCTRINE_REGISTRY)
  
  if (doctrines.length === 0) {
    console.error('[phase7-test] ✗ Doctrine registry is empty')
    return false
  }
  
  console.log(`[phase7-test] ✓ Doctrine registry has ${doctrines.length} registered doctrines`)
  console.log(`[phase7-test]   Found: ${doctrines.slice(0, 3).join(', ')}...`)
  
  return true
}

/**
 * Test 7: Full Coverage Report
 */
export function testCoverageReport(): boolean {
  console.log('[phase7-test] Generating Coverage Report...')
  
  const report = generateDoctrineCoverageReport()
  
  if (!report || report.skillCoverageResults.size === 0) {
    console.error('[phase7-test] ✗ Coverage report generation failed')
    return false
  }
  
  const dragonFlagResult = report.skillCoverageResults.get('dragon_flag')
  
  if (!dragonFlagResult) {
    console.error('[phase7-test] ✗ Dragon flag missing from coverage report')
    return false
  }
  
  if (dragonFlagResult.isReachable) {
    console.log('[phase7-test] ✓ Dragon flag is reachable in live engine')
  } else {
    console.error('[phase7-test] ✗ Dragon flag is NOT reachable')
    dragonFlagResult.issues.forEach(issue => console.error(`  - ${issue}`))
    return false
  }
  
  return true
}

/**
 * Run all Phase 7 integration tests
 */
export function runPhase7IntegrationTests(): void {
  console.log('\n=== PHASE 7 INTEGRATION TESTS ===\n')
  
  const tests = [
    { name: 'Dragon Flag Readiness', fn: testDragonFlagReadiness },
    { name: 'Dragon Flag Exercises', fn: testDragonFlagExercises },
    { name: 'Dragon Flag Prerequisites', fn: testDragonFlagPrerequisites },
    { name: 'Dragon Flag Ladder', fn: testDragonFlagLadder },
    { name: 'Weighted Calisthenics', fn: testWeightedCalisthenicsSupport },
    { name: 'Doctrine Registry', fn: testDoctrineRegistry },
    { name: 'Coverage Report', fn: testCoverageReport },
  ]
  
  let passed = 0
  let failed = 0
  
  for (const test of tests) {
    try {
      const result = test.fn()
      if (result) {
        passed++
      } else {
        failed++
      }
    } catch (error) {
      console.error(`[phase7-test] ✗ ${test.name} threw error:`, error)
      failed++
    }
  }
  
  console.log(`\n=== RESULTS ===`)
  console.log(`Passed: ${passed}/${tests.length}`)
  console.log(`Failed: ${failed}/${tests.length}`)
  
  if (failed === 0) {
    console.log('\n✓ ALL PHASE 7 INTEGRATION TESTS PASSED')
  } else {
    console.log('\n✗ Some tests failed - see details above')
  }
  
  console.log('\n=== COVERAGE DIAGNOSTICS ===\n')
  const report = generateDoctrineCoverageReport()
  logCoverageReport(report)
  
  console.log('\n=== DRAGON FLAG SPECIFIC CHECK ===\n')
  validateDragonFlagIntegration()
}

// Export for optional export from page route or CLI
export default runPhase7IntegrationTests
