// Constraint Scoring Engine
// Aggregates signals and determines primary constraint

import type { 
  ConstraintSignal, 
  ConstraintType, 
  ConstraintCategory,
  ConfidenceLevel,
} from '@/types/constraint-engine'

export interface ScoredConstraint {
  type: ConstraintType
  category: ConstraintCategory
  totalScore: number
  confidence: ConfidenceLevel
  signalCount: number
}

/**
 * Aggregate scores from all signals
 */
export function aggregateConstraintScores(signals: ConstraintSignal[]): ScoredConstraint[] {
  // Group by constraint type
  const grouped = new Map<ConstraintType, ConstraintSignal[]>()
  
  for (const signal of signals) {
    const existing = grouped.get(signal.type) || []
    existing.push(signal)
    grouped.set(signal.type, existing)
  }
  
  // Calculate aggregated scores
  const scored: ScoredConstraint[] = []
  
  for (const [type, typeSignals] of grouped) {
    // Take the highest score for each type (don't double count)
    const maxScore = Math.max(...typeSignals.map(s => s.score))
    const category = typeSignals[0].category
    
    // Determine aggregate confidence
    const highConfidence = typeSignals.some(s => s.confidence === 'high')
    const mediumConfidence = typeSignals.some(s => s.confidence === 'medium')
    const confidence: ConfidenceLevel = highConfidence ? 'high' : mediumConfidence ? 'medium' : 'low'
    
    scored.push({
      type,
      category,
      totalScore: maxScore,
      confidence,
      signalCount: typeSignals.length,
    })
  }
  
  // Sort by score descending
  return scored.sort((a, b) => b.totalScore - a.totalScore)
}

/**
 * Determine the primary constraint from scored results
 */
export function determinePrimaryConstraint(
  scored: ScoredConstraint[]
): { primary: ScoredConstraint | null; secondary: ScoredConstraint | null } {
  if (scored.length === 0) {
    return { primary: null, secondary: null }
  }
  
  const primary = scored[0]
  
  // Only include secondary if it's close to primary (within 2 points)
  let secondary: ScoredConstraint | null = null
  if (scored.length > 1 && primary.totalScore - scored[1].totalScore <= 2) {
    secondary = scored[1]
  }
  
  return { primary, secondary }
}

/**
 * Calculate overall data quality based on available signals
 */
export function calculateDataQuality(
  hasSkillData: boolean,
  hasStrengthData: boolean,
  hasVolumeData: boolean,
  hasRecoveryData: boolean
): 'sufficient' | 'partial' | 'insufficient' {
  const dataPoints = [hasSkillData, hasStrengthData, hasVolumeData, hasRecoveryData]
  const available = dataPoints.filter(Boolean).length
  
  if (available >= 3) return 'sufficient'
  if (available >= 1) return 'partial'
  return 'insufficient'
}
