/**
 * Training Doctrine Registry
 * 
 * A knowledge layer that stores structured calisthenics training philosophies
 * and methodology principles for AI engine reference.
 * 
 * =============================================================================
 * PURPOSE
 * =============================================================================
 * 
 * The registry stores training principles, not entire programs.
 * Each doctrine profile represents a methodology style used by experienced
 * athletes or coaches. Doctrines inform decisions across multiple engines
 * without replacing their core logic.
 * 
 * =============================================================================
 * HOW TO ADD NEW DOCTRINES
 * =============================================================================
 * 
 * 1. Open doctrineRegistry.ts
 * 2. Add a new entry to DOCTRINE_REGISTRY with a unique doctrineId
 * 3. Fill all TrainingDoctrine fields (see doctrineTypes.ts for structure)
 * 4. Keep descriptions short and machine-readable
 * 5. Ensure compatibleFrameworks references valid CoachingFrameworkId values
 * 
 * =============================================================================
 * HOW ENGINES REFERENCE DOCTRINES
 * =============================================================================
 * 
 * Import the service functions you need:
 * 
 *   import { getDoctrineById, getDoctrineAttributes } from '@/lib/training-doctrine-registry'
 * 
 * Engine Integration Examples:
 * 
 * - Coaching Framework Engine:
 *   Use getDoctrinesByFramework() to find compatible doctrines
 *   Reference doctrine.keyPrinciples for methodology alignment
 * 
 * - Program Builder:
 *   Use getDoctrineAttributes() for volumeProfile and skillFrequencyProfile
 *   Reference doctrine to inform set/rep decisions
 * 
 * - Weak Point Detection:
 *   Use getDoctrineSafetyNotes() for relevant warnings
 *   Consider doctrine.movementBiasTendency for emphasis decisions
 * 
 * - Skill Progression:
 *   Reference doctrine.progressionPhilosophy for pacing
 *   Use findBestDoctrineMatch() to align with athlete goals
 * 
 * - Performance Envelope:
 *   Reference doctrine.volumeProfile and intensityProfile
 *   Use to validate envelope parameters against methodology
 * 
 * =============================================================================
 * EXPORTS
 * =============================================================================
 */

// Types
export type {
  DoctrineCategory,
  TrainingStyleBias,
  VolumeProfile,
  IntensityProfile,
  SkillFrequencyProfile,
  ProgressionPhilosophy,
  MovementBiasTendency,
  PrimaryFocus,
  TrainingDoctrine,
  DoctrineQueryFilters,
  DoctrineAttributes
} from './doctrineTypes'

// Registry
export {
  DOCTRINE_REGISTRY,
  getAllDoctrineIds,
  doctrineExists,
  getDoctrineCount
} from './doctrineRegistry'

// Service Functions
export {
  // Core queries
  getDoctrineById,
  getDoctrineList,
  getDoctrineAttributes,
  getAllDoctrineAttributes,
  
  // Filtered queries
  findDoctrines,
  getDoctrinesByCategory,
  getDoctrinesByFocus,
  getDoctrinesByFramework,
  
  // Attribute-specific
  getDoctrineVolumeProfile,
  getDoctrineSkillFrequency,
  getDoctrineMovementBias,
  getDoctrineSafetyNotes,
  getDoctrineKeyPrinciples,
  
  // Compatibility helpers
  isDoctrineCompatibleWithFramework,
  findBestDoctrineMatch,
  getDoctrineRecommendations
} from './doctrineService'
