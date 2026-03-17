/**
 * Training Doctrine Service
 * 
 * PURPOSE:
 * Provides lightweight synchronous functions for querying doctrine information.
 * Other engines import these functions to access training philosophy data.
 * 
 * HOW ENGINES SHOULD USE THIS:
 * - Import specific functions needed (getDoctrineById, getDoctrineAttributes, etc.)
 * - Use attributes to inform decisions, not replace engine logic
 * - Doctrine data supplements existing framework and envelope data
 * 
 * INTEGRATION EXAMPLES:
 * - Coaching Framework Engine: Match framework to compatible doctrines
 * - Program Builder: Reference doctrine principles for programming decisions
 * - Weak Point Detection: Use doctrine safety notes for recommendations
 * - Skill Progression: Reference progression philosophy for pacing
 */

import type {
  TrainingDoctrine,
  DoctrineAttributes,
  DoctrineQueryFilters,
  DoctrineCategory,
  PrimaryFocus,
  VolumeProfile,
  SkillFrequencyProfile,
  MovementBiasTendency
} from './doctrineTypes'

import {
  DOCTRINE_REGISTRY,
  getAllDoctrineIds,
  doctrineExists
} from './doctrineRegistry'

// =============================================================================
// CORE QUERY FUNCTIONS
// =============================================================================

/**
 * Get a doctrine by its ID
 * Returns undefined if not found
 */
export function getDoctrineById(doctrineId: string): TrainingDoctrine | undefined {
  return DOCTRINE_REGISTRY[doctrineId]
}

/**
 * Get all doctrines as an array
 */
export function getDoctrineList(): TrainingDoctrine[] {
  return Object.values(DOCTRINE_REGISTRY)
}

/**
 * Get doctrine attributes only (lightweight subset)
 * Useful when engines only need classification data
 */
export function getDoctrineAttributes(doctrineId: string): DoctrineAttributes | undefined {
  const doctrine = DOCTRINE_REGISTRY[doctrineId]
  if (!doctrine) return undefined
  
  return {
    doctrineId: doctrine.doctrineId,
    category: doctrine.category,
    trainingStyleBias: doctrine.trainingStyleBias,
    volumeProfile: doctrine.volumeProfile,
    intensityProfile: doctrine.intensityProfile,
    skillFrequencyProfile: doctrine.skillFrequencyProfile,
    progressionPhilosophy: doctrine.progressionPhilosophy,
    movementBiasTendency: doctrine.movementBiasTendency
  }
}

/**
 * Get all doctrine attributes (lightweight listing)
 */
export function getAllDoctrineAttributes(): DoctrineAttributes[] {
  return Object.values(DOCTRINE_REGISTRY).map(doctrine => ({
    doctrineId: doctrine.doctrineId,
    category: doctrine.category,
    trainingStyleBias: doctrine.trainingStyleBias,
    volumeProfile: doctrine.volumeProfile,
    intensityProfile: doctrine.intensityProfile,
    skillFrequencyProfile: doctrine.skillFrequencyProfile,
    progressionPhilosophy: doctrine.progressionPhilosophy,
    movementBiasTendency: doctrine.movementBiasTendency
  }))
}

// =============================================================================
// FILTERED QUERY FUNCTIONS
// =============================================================================

/**
 * Find doctrines matching filter criteria
 */
export function findDoctrines(filters: DoctrineQueryFilters): TrainingDoctrine[] {
  return Object.values(DOCTRINE_REGISTRY).filter(doctrine => {
    if (filters.category && doctrine.category !== filters.category) {
      return false
    }
    if (filters.primaryFocus && !doctrine.primaryFocus.includes(filters.primaryFocus)) {
      return false
    }
    if (filters.trainingStyleBias && doctrine.trainingStyleBias !== filters.trainingStyleBias) {
      return false
    }
    if (filters.volumeProfile && doctrine.volumeProfile !== filters.volumeProfile) {
      return false
    }
    if (filters.skillFrequencyProfile && doctrine.skillFrequencyProfile !== filters.skillFrequencyProfile) {
      return false
    }
    return true
  })
}

/**
 * Find doctrines by category
 */
export function getDoctrinesByCategory(category: DoctrineCategory): TrainingDoctrine[] {
  return Object.values(DOCTRINE_REGISTRY).filter(d => d.category === category)
}

/**
 * Find doctrines by primary focus
 */
export function getDoctrinesByFocus(focus: PrimaryFocus): TrainingDoctrine[] {
  return Object.values(DOCTRINE_REGISTRY).filter(d => d.primaryFocus.includes(focus))
}

/**
 * Find doctrines compatible with a coaching framework
 */
export function getDoctrinesByFramework(frameworkId: string): TrainingDoctrine[] {
  return Object.values(DOCTRINE_REGISTRY).filter(d => 
    d.compatibleFrameworks.includes(frameworkId)
  )
}

// =============================================================================
// ATTRIBUTE-SPECIFIC QUERIES
// =============================================================================

/**
 * Get volume profile for a doctrine
 */
export function getDoctrineVolumeProfile(doctrineId: string): VolumeProfile | undefined {
  return DOCTRINE_REGISTRY[doctrineId]?.volumeProfile
}

/**
 * Get skill frequency profile for a doctrine
 */
export function getDoctrineSkillFrequency(doctrineId: string): SkillFrequencyProfile | undefined {
  return DOCTRINE_REGISTRY[doctrineId]?.skillFrequencyProfile
}

/**
 * Get movement bias tendency for a doctrine
 */
export function getDoctrineMovementBias(doctrineId: string): MovementBiasTendency | undefined {
  return DOCTRINE_REGISTRY[doctrineId]?.movementBiasTendency
}

/**
 * Get safety notes for a doctrine
 */
export function getDoctrineSafetyNotes(doctrineId: string): string[] {
  return DOCTRINE_REGISTRY[doctrineId]?.safetyNotes ?? []
}

/**
 * Get key principles for a doctrine
 */
export function getDoctrineKeyPrinciples(doctrineId: string): string[] {
  return DOCTRINE_REGISTRY[doctrineId]?.keyPrinciples ?? []
}

// =============================================================================
// COMPATIBILITY HELPERS
// =============================================================================

/**
 * Check if a doctrine is compatible with a framework
 */
export function isDoctrineCompatibleWithFramework(
  doctrineId: string,
  frameworkId: string
): boolean {
  const doctrine = DOCTRINE_REGISTRY[doctrineId]
  if (!doctrine) return false
  return doctrine.compatibleFrameworks.includes(frameworkId)
}

/**
 * Get best doctrine match for a given focus and style
 */
export function findBestDoctrineMatch(
  focus: PrimaryFocus,
  preferredVolume?: VolumeProfile,
  preferredFrequency?: SkillFrequencyProfile
): TrainingDoctrine | undefined {
  const candidates = getDoctrinesByFocus(focus)
  
  if (candidates.length === 0) return undefined
  if (candidates.length === 1) return candidates[0]
  
  // Score candidates based on preference match
  let bestMatch = candidates[0]
  let bestScore = 0
  
  for (const doctrine of candidates) {
    let score = 0
    if (preferredVolume && doctrine.volumeProfile === preferredVolume) {
      score += 2
    }
    if (preferredFrequency && doctrine.skillFrequencyProfile === preferredFrequency) {
      score += 2
    }
    if (score > bestScore) {
      bestScore = score
      bestMatch = doctrine
    }
  }
  
  return bestMatch
}

/**
 * Get doctrine recommendations for an athlete profile
 */
export function getDoctrineRecommendations(profile: {
  primaryGoal?: PrimaryFocus
  hasTendonConcerns?: boolean
  prefersHighFrequency?: boolean
  prefersLowVolume?: boolean
}): TrainingDoctrine[] {
  const recommendations: TrainingDoctrine[] = []
  const doctrines = getDoctrineList()
  
  for (const doctrine of doctrines) {
    let score = 0
    
    // Goal match
    if (profile.primaryGoal && doctrine.primaryFocus.includes(profile.primaryGoal)) {
      score += 3
    }
    
    // Tendon concerns
    if (profile.hasTendonConcerns && doctrine.doctrineId === 'tendon_conservative') {
      score += 5
    }
    
    // Frequency preference
    if (profile.prefersHighFrequency && 
        (doctrine.skillFrequencyProfile === 'high_frequency' || 
         doctrine.skillFrequencyProfile === 'greasing_groove')) {
      score += 2
    }
    
    // Volume preference
    if (profile.prefersLowVolume && doctrine.volumeProfile === 'low_volume_high_intensity') {
      score += 2
    }
    
    if (score >= 3) {
      recommendations.push(doctrine)
    }
  }
  
  // Sort by relevance (primary goal match first)
  return recommendations.sort((a, b) => {
    const aHasGoal = profile.primaryGoal && a.primaryFocus.includes(profile.primaryGoal)
    const bHasGoal = profile.primaryGoal && b.primaryFocus.includes(profile.primaryGoal)
    if (aHasGoal && !bHasGoal) return -1
    if (!aHasGoal && bHasGoal) return 1
    return 0
  })
}

// =============================================================================
// RE-EXPORTS
// =============================================================================

export { getAllDoctrineIds, doctrineExists }
