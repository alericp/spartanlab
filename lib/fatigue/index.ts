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
