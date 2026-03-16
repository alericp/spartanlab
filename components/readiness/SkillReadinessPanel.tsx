'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Target, ChevronRight, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { SkillReadinessVisual, CompactSkillReadiness } from './SkillReadinessVisual'
import {
  calculateCanonicalReadiness,
  calculateReadinessFromProfile,
  type CanonicalReadinessResult,
  type SkillType,
  type AthleteReadinessInput,
} from '@/lib/readiness/canonical-readiness-engine'

// =============================================================================
// TYPES
// =============================================================================

interface SkillReadinessPanelProps {
  athleteProfile?: {
    pullUpMax?: number | null
    dipMax?: number | null
    pushUpMax?: number | null
    hollowHoldTime?: number | null
    experienceLevel?: string
    equipment?: string[]
    primarySkill?: string
    goals?: string[]
  }
  skills?: SkillType[]
  title?: string
  compact?: boolean
  maxDisplay?: number
  showViewAll?: boolean
  className?: string
}

// Default skills to show
const DEFAULT_SKILLS: SkillType[] = ['front_lever', 'planche', 'muscle_up', 'hspu', 'l_sit']

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * Skill Readiness Panel
 * 
 * Dashboard component that displays readiness for multiple skills.
 * Uses the canonical readiness engine as the source of truth.
 * Supports compact and expanded display modes.
 */
export function SkillReadinessPanel({
  athleteProfile,
  skills = DEFAULT_SKILLS,
  title = "Skill Readiness",
  compact = false,
  maxDisplay = 3,
  showViewAll = true,
  className,
}: SkillReadinessPanelProps) {
  const [results, setResults] = useState<CanonicalReadinessResult[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)
  
  useEffect(() => {
    // Calculate readiness for all requested skills
    const calculateAllReadiness = () => {
      try {
        const calculatedResults: CanonicalReadinessResult[] = []
        
        for (const skill of skills) {
          const result = calculateReadinessFromProfile(skill, {
            pullUpMax: athleteProfile?.pullUpMax,
            dipMax: athleteProfile?.dipMax,
            pushUpMax: athleteProfile?.pushUpMax,
            hollowHoldTime: athleteProfile?.hollowHoldTime,
            experienceLevel: athleteProfile?.experienceLevel,
            equipment: athleteProfile?.equipment,
          })
          calculatedResults.push(result)
        }
        
        // Sort by overall score (highest first) for better UX
        calculatedResults.sort((a, b) => b.overallScore - a.overallScore)
        
        setResults(calculatedResults)
      } catch (error) {
        console.error('[SkillReadinessPanel] Error calculating readiness:', error)
      } finally {
        setLoading(false)
      }
    }
    
    calculateAllReadiness()
  }, [athleteProfile, skills])
  
  // Determine which results to show
  const displayResults = expanded ? results : results.slice(0, maxDisplay)
  const hasMore = results.length > maxDisplay && !expanded
  
  // Get the primary skill focus (athlete's main goal)
  const primarySkillResult = athleteProfile?.primarySkill 
    ? results.find(r => r.skill === athleteProfile.primarySkill)
    : results[0]
  
  if (loading) {
    return (
      <Card className={cn("p-4 bg-[#0F1318] border-[#2B313A]", className)}>
        <div className="flex items-center gap-3 mb-4">
          <Target className="w-5 h-5 text-[#E63946]" />
          <h2 className="text-lg font-semibold text-[#F5F5F5]">{title}</h2>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-[#6B7280] animate-spin" />
        </div>
      </Card>
    )
  }
  
  if (results.length === 0) {
    return (
      <Card className={cn("p-4 bg-[#0F1318] border-[#2B313A]", className)}>
        <div className="flex items-center gap-3 mb-4">
          <Target className="w-5 h-5 text-[#E63946]" />
          <h2 className="text-lg font-semibold text-[#F5F5F5]">{title}</h2>
        </div>
        <p className="text-sm text-[#A5A5A5] text-center py-4">
          Complete your assessment to see skill readiness.
        </p>
        <Link
          href="/onboarding"
          className="block text-center text-sm text-[#E63946] hover:text-[#C1121F] transition-colors"
        >
          Start Assessment
        </Link>
      </Card>
    )
  }
  
  // Compact mode: show inline badges
  if (compact) {
    return (
      <Card className={cn("p-4 bg-[#0F1318] border-[#2B313A]", className)}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-[#E63946]" />
            <h3 className="font-semibold text-[#F5F5F5] text-sm">{title}</h3>
          </div>
          {showViewAll && (
            <Link
              href="/calculators/skill-readiness-score"
              className="text-xs text-[#6B7280] hover:text-[#E63946] transition-colors flex items-center gap-1"
            >
              View All <ChevronRight className="w-3 h-3" />
            </Link>
          )}
        </div>
        
        <div className="space-y-2">
          {displayResults.map((result) => (
            <CompactSkillReadiness key={result.skill} result={result} />
          ))}
        </div>
        
        {hasMore && (
          <button
            onClick={() => setExpanded(true)}
            className="mt-3 w-full text-xs text-[#6B7280] hover:text-[#A5A5A5] transition-colors text-center"
          >
            Show {results.length - maxDisplay} more skills
          </button>
        )}
      </Card>
    )
  }
  
  // Full mode: show detailed cards
  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Target className="w-5 h-5 text-[#E63946]" />
          <h2 className="text-lg font-semibold text-[#F5F5F5]">{title}</h2>
        </div>
        {showViewAll && (
          <Link
            href="/calculators/skill-readiness-score"
            className="text-sm text-[#6B7280] hover:text-[#E63946] transition-colors flex items-center gap-1"
          >
            Full Analysis <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>
      
      {/* Primary Skill Highlight (if set) */}
      {primarySkillResult && athleteProfile?.primarySkill && (
        <div className="mb-2">
          <p className="text-xs text-[#6B7280] mb-2 uppercase tracking-wide">Primary Focus</p>
          <SkillReadinessVisual 
            result={primarySkillResult}
            showBreakdown={true}
            showCoaching={true}
          />
        </div>
      )}
      
      {/* Other Skills Grid */}
      <div className="grid gap-3 sm:grid-cols-2">
        {displayResults
          .filter(r => r.skill !== athleteProfile?.primarySkill)
          .map((result) => (
            <SkillReadinessVisual 
              key={result.skill}
              result={result}
              showBreakdown={true}
              showCoaching={true}
              compact={true}
            />
          ))}
      </div>
      
      {hasMore && (
        <button
          onClick={() => setExpanded(true)}
          className="w-full py-2 text-sm text-[#6B7280] hover:text-[#A5A5A5] transition-colors border border-[#2B313A] rounded-lg hover:border-[#3B414A]"
        >
          Show {results.length - maxDisplay} more skills
        </button>
      )}
    </div>
  )
}

// =============================================================================
// SINGLE SKILL FOCUS COMPONENT
// =============================================================================

interface SingleSkillReadinessProps {
  skill: SkillType
  athleteProfile?: {
    pullUpMax?: number | null
    dipMax?: number | null
    pushUpMax?: number | null
    hollowHoldTime?: number | null
    experienceLevel?: string
    equipment?: string[]
  }
  showBreakdown?: boolean
  showCoaching?: boolean
  className?: string
}

/**
 * Single Skill Readiness Display
 * For use when showing readiness for just one skill (e.g., on skill detail pages)
 */
export function SingleSkillReadiness({
  skill,
  athleteProfile,
  showBreakdown = true,
  showCoaching = true,
  className,
}: SingleSkillReadinessProps) {
  const [result, setResult] = useState<CanonicalReadinessResult | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    try {
      const calculated = calculateReadinessFromProfile(skill, {
        pullUpMax: athleteProfile?.pullUpMax,
        dipMax: athleteProfile?.dipMax,
        pushUpMax: athleteProfile?.pushUpMax,
        hollowHoldTime: athleteProfile?.hollowHoldTime,
        experienceLevel: athleteProfile?.experienceLevel,
        equipment: athleteProfile?.equipment,
      })
      setResult(calculated)
    } catch (error) {
      console.error('[SingleSkillReadiness] Error:', error)
    } finally {
      setLoading(false)
    }
  }, [skill, athleteProfile])
  
  if (loading) {
    return (
      <div className={cn("h-32 bg-[#0F1318] rounded-lg border border-[#2B313A] animate-pulse", className)} />
    )
  }
  
  if (!result) {
    return (
      <Card className={cn("p-4 bg-[#0F1318] border-[#2B313A]", className)}>
        <p className="text-sm text-[#A5A5A5]">Unable to calculate readiness.</p>
      </Card>
    )
  }
  
  return (
    <SkillReadinessVisual
      result={result}
      showBreakdown={showBreakdown}
      showCoaching={showCoaching}
      className={className}
    />
  )
}

// =============================================================================
// EXPORTS
// =============================================================================

export type { SkillReadinessPanelProps, SingleSkillReadinessProps }
