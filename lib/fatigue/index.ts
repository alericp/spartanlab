/**
 * Fatigue Detection & Deload System
 * 
 * Comprehensive fatigue monitoring and recovery management for SpartanLab.
 * 
 * Exports:
 * - Deload system types and functions
 * - Fatigue signal classification
 * - Long-term pattern tracking
 * - Coaching message generation
 */

export {
  // Types
  type DeloadType,
  type DeloadTrigger,
  type FatigueLevel,
  type DeloadRecommendation,
  type DeloadAdjustments,
  type FatigueSignalSummary,
  type FatiguePatternEntry,
  
  // Functions
  classifyFatigueLevel,
  determineDeloadNeed,
  getDeloadRecommendation,
  saveFatiguePattern,
  getFatiguePatterns,
  analyzeFatigueHistory,
} from './deload-system'

// =============================================================================
// ADAPTIVE DELOAD & RECOVERY PHASE ENGINE
// =============================================================================

export {
  // Types
  type RecoveryPhaseType,
  type RecoveryPhaseStatus,
  type TriggerSource,
  type TrendDirection,
  type RecoveryPhase,
  type RecoveryPhaseAdjustments,
  type TriggerSignal,
  type RecoveryTriggerAssessment,
  type RecoveryAssessmentInput,
  type SessionRecoveryAdjustment,
  type RecoveryPhaseExplanation,
  
  // Assessment Functions
  assessRecoveryNeed,
  generatePhaseAdjustments,
  calculatePhaseDuration,
  
  // Program Integration
  applyRecoveryAdjustmentsToSession,
  
  // Coaching & Explanations
  generateRecoveryPhaseExplanation,
  generateRecoveryCoachMessage,
  
  // Phase Management
  assessPhaseCompletion,
  assessCycleCompatibility,
} from '../adaptive-deload-recovery-engine'
