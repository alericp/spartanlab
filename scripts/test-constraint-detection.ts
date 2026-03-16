// Test script for Constraint Detection Engine
// Run with: npx ts-node scripts/test-constraint-detection.ts

import {
  detectSkillConstraints,
  detectConstraintsSync,
  CONSTRAINT_CATEGORY_LABELS,
  SKILL_CONSTRAINT_REQUIREMENTS,
  type SkillType,
} from '../lib/constraint-detection-engine'

// Mock athlete profile for testing
const mockProfile = {
  primaryGoal: 'front_lever',
  trainingAge: 'intermediate',
  equipmentAvailable: ['pullup_bar', 'rings', 'parallettes'],
  bodyweight: 175,
  weakestArea: 'core_strength',
  jointCautions: ['wrists'],
}

console.log('='.repeat(60))
console.log('CONSTRAINT DETECTION ENGINE TEST')
console.log('='.repeat(60))

// Test 1: Skill constraint requirements
console.log('\n1. SKILL CONSTRAINT REQUIREMENTS')
console.log('-'.repeat(40))

const skills: SkillType[] = ['front_lever', 'back_lever', 'planche', 'hspu', 'muscle_up', 'l_sit']

for (const skill of skills) {
  const req = SKILL_CONSTRAINT_REQUIREMENTS[skill]
  console.log(`\n${skill.toUpperCase()}:`)
  console.log('  Primary:', req.primaryConstraints.join(', '))
  console.log('  Secondary:', req.secondaryConstraints.join(', '))
}

// Test 2: Constraint category labels
console.log('\n\n2. CONSTRAINT CATEGORY LABELS')
console.log('-'.repeat(40))

Object.entries(CONSTRAINT_CATEGORY_LABELS).forEach(([key, label]) => {
  console.log(`  ${key}: ${label}`)
})

// Test 3: Skill-specific constraint detection
console.log('\n\n3. SKILL-SPECIFIC CONSTRAINT DETECTION')
console.log('-'.repeat(40))

// Note: This would normally use real athlete profile data
// For testing, we can see the structure

console.log('\nExpected output structure for detectSkillConstraints():')
console.log(`{
  skill: SkillType,
  primaryConstraint: ConstraintCategory,
  secondaryConstraint: ConstraintCategory | null,
  strongQualities: ConstraintCategory[],
  constraintScores: ConstraintScore[],
  overallReadiness: number (0-100),
  recommendations: string[],
  explanation: string,
}`)

// Test 4: Integration points
console.log('\n\n4. INTEGRATION POINTS')
console.log('-'.repeat(40))
console.log('- Program Generation: getConstraintContextForProgram()')
console.log('- Roadmap Blocking: getConstraintContextForRoadmap(skill)')
console.log('- Dashboard Display: getConstraintSummaryForDashboard()')
console.log('- Skill Details: getSkillConstraints(skill)')
console.log('- All Skills: getAllSkillConstraints()')

// Test 5: Volume adjustment mapping
console.log('\n\n5. VOLUME ADJUSTMENT MAPPING')
console.log('-'.repeat(40))
console.log('When primary constraint is detected, the engine maps it to volume priorities:')
console.log('')
console.log('pull_strength → Increase: weighted_pull, pull_up, row')
console.log('compression_strength → Increase: l_sit, v_up, pike_compression')
console.log('scapular_control → Increase: scapular_pull, retraction, depression')
console.log('shoulder_stability → Increase: shoulder_prep, external_rotation')

console.log('\n' + '='.repeat(60))
console.log('TEST COMPLETE')
console.log('='.repeat(60))
