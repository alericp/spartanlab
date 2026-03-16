/**
 * Joint Integrity Protocol System - Public API
 * 
 * Central export for all protocol-related functionality.
 */

export {
  // Types
  type JointRegion,
  type ActivationType,
  type DifficultyLevel,
  type SkillRelevance,
  type ProtocolExercise,
  type JointIntegrityProtocol,
  type ProtocolRecommendation,
  
  // Constants
  JOINT_INTEGRITY_PROTOCOLS,
  JOINT_REGION_LABELS,
  JOINT_CAUTION_TO_REGION,
  
  // Lookup functions
  getProtocolById,
  getProtocolBySlug,
  getProtocolsForRegion,
  getProtocolsForSkill,
  getProtocolsForSkills,
  getProtocolsForCautions,
  getAllProtocolSlugs,
  
  // Integration functions
  recommendProtocolsForSession,
  generateProtocolExplanation,
} from './joint-integrity-protocol'
