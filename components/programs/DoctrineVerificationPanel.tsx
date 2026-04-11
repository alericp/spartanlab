'use client'

/**
 * DOCTRINE VERIFICATION PANEL
 * 
 * A compact, professional diagnostic panel that shows whether the generated
 * program truly aligns with athlete truth and training doctrine.
 * 
 * This is NOT a debug tool - it's a quality assurance surface that helps
 * users understand program alignment.
 */

import { useState } from 'react'
import { ChevronDown, ChevronUp, CheckCircle, AlertCircle, XCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DoctrineVerificationReport, VerificationVerdict, DoctrineCategory } from '@/lib/doctrine-to-output-verification'

interface DoctrineVerificationPanelProps {
  report: DoctrineVerificationReport | null
  compact?: boolean
  className?: string
}

const CATEGORY_LABELS: Record<DoctrineCategory, string> = {
  goal_alignment: 'Goal Alignment',
  skill_exposure: 'Skill Exposure',
  stage_realism: 'Stage Realism',
  weekly_structure: 'Weekly Structure',
  exercise_specificity: 'Exercise Specificity',
  dosage_quality: 'Dosage Quality',
  recovery_overlap: 'Recovery Spacing',
  equipment_alignment: 'Equipment Match',
  time_budget: 'Time Budget',
  anti_genericity: 'Program Uniqueness',
  doctrine_shape: 'Doctrine Shape',
  progression_suitability: 'Progression Fit',
}

function VerdictIcon({ verdict, size = 'sm' }: { verdict: VerificationVerdict; size?: 'sm' | 'md' }) {
  const sizeClass = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'
  
  switch (verdict) {
    case 'PASS':
      return <CheckCircle className={cn(sizeClass, 'text-green-500')} />
    case 'PARTIAL':
      return <AlertCircle className={cn(sizeClass, 'text-amber-500')} />
    case 'FAIL':
      return <XCircle className={cn(sizeClass, 'text-red-500')} />
    case 'NOT_APPLICABLE':
      return <Info className={cn(sizeClass, 'text-gray-400')} />
  }
}

function VerdictBadge({ verdict }: { verdict: VerificationVerdict }) {
  const colors = {
    PASS: 'bg-green-500/10 text-green-500 border-green-500/20',
    PARTIAL: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    FAIL: 'bg-red-500/10 text-red-500 border-red-500/20',
    NOT_APPLICABLE: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  }
  
  return (
    <span className={cn(
      'px-2 py-0.5 text-[10px] font-medium rounded border',
      colors[verdict]
    )}>
      {verdict.replace('_', ' ')}
    </span>
  )
}

export function DoctrineVerificationPanel({ 
  report, 
  compact = false,
  className 
}: DoctrineVerificationPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  if (!report) {
    return null
  }
  
  const overallColor = {
    PASS: 'text-green-500',
    PARTIAL: 'text-amber-500',
    FAIL: 'text-red-500',
    NOT_APPLICABLE: 'text-gray-400',
  }[report.overallVerdict]
  
  const overallBg = {
    PASS: 'bg-green-500/5 border-green-500/10',
    PARTIAL: 'bg-amber-500/5 border-amber-500/10',
    FAIL: 'bg-red-500/5 border-red-500/10',
    NOT_APPLICABLE: 'bg-gray-500/5 border-gray-500/10',
  }[report.overallVerdict]
  
  // Compact view - just the overall status
  if (compact && !isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors',
          overallBg,
          'hover:bg-[#1A1A1A]',
          className
        )}
      >
        <VerdictIcon verdict={report.overallVerdict} size="sm" />
        <span className={cn('text-[11px] font-medium', overallColor)}>
          {report.overallScore}/100
        </span>
        <span className="text-[10px] text-[#666]">
          {report.passCount} pass, {report.partialCount + report.failCount} issues
        </span>
        <ChevronDown className="w-3 h-3 text-[#666]" />
      </button>
    )
  }
  
  return (
    <div className={cn(
      'rounded-lg border bg-[#0D0D0D]',
      overallBg,
      className
    )}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#1A1A1A]/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <VerdictIcon verdict={report.overallVerdict} size="md" />
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className={cn('text-sm font-medium', overallColor)}>
                Doctrine Alignment: {report.overallScore}/100
              </span>
              <VerdictBadge verdict={report.overallVerdict} />
            </div>
            <p className="text-[11px] text-[#888] mt-0.5">
              {report.passCount} pass, {report.partialCount} partial, {report.failCount} fail
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-[#666]" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[#666]" />
        )}
      </button>
      
      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-[#1A1A1A]">
          {/* Overall reason */}
          <p className="text-[11px] text-[#AAA] pt-3">
            {report.overallReason}
          </p>
          
          {/* Critical gap highlight */}
          {report.mostCriticalGap && (
            <div className="p-2.5 rounded bg-red-500/5 border border-red-500/10">
              <div className="flex items-start gap-2">
                <XCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-[10px] font-medium text-red-400">Critical Gap</span>
                  <p className="text-[11px] text-[#AAA] mt-0.5">{report.mostCriticalGap}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Dimension grid */}
          <div className="grid grid-cols-2 gap-2">
            {report.dimensions
              .filter(d => d.verdict !== 'NOT_APPLICABLE')
              .map((dimension) => (
                <DimensionCard key={dimension.category} dimension={dimension} />
              ))}
          </div>
          
          {/* Profile snapshot */}
          <details className="group">
            <summary className="text-[10px] text-[#666] cursor-pointer hover:text-[#888] transition-colors">
              Profile & Program Details
            </summary>
            <div className="mt-2 grid grid-cols-2 gap-3 text-[10px] text-[#777]">
              <div className="space-y-1">
                <div className="font-medium text-[#999]">Profile</div>
                <div>Primary: {report.profileSnapshot.primaryGoal || 'none'}</div>
                <div>Secondary: {report.profileSnapshot.secondaryGoal || 'none'}</div>
                <div>Skills: {report.profileSnapshot.selectedSkillCount}</div>
                <div>Level: {report.profileSnapshot.experienceLevel}</div>
                <div>Duration: {report.profileSnapshot.sessionDuration}</div>
              </div>
              <div className="space-y-1">
                <div className="font-medium text-[#999]">Program</div>
                <div>Sessions: {report.programSnapshot.sessionCount}</div>
                <div>Exercises: {report.programSnapshot.totalExercises}</div>
                <div>Avg/session: {report.programSnapshot.averageExercisesPerSession}</div>
                <div>Direct work: {report.programSnapshot.directWorkCount}</div>
                <div>Weighted: {report.programSnapshot.weightedExerciseCount}</div>
              </div>
            </div>
          </details>
        </div>
      )}
    </div>
  )
}

function DimensionCard({ dimension }: { dimension: DoctrineVerificationReport['dimensions'][0] }) {
  const [showDetails, setShowDetails] = useState(false)
  
  const bgColor = {
    PASS: 'bg-green-500/5 hover:bg-green-500/10',
    PARTIAL: 'bg-amber-500/5 hover:bg-amber-500/10',
    FAIL: 'bg-red-500/5 hover:bg-red-500/10',
    NOT_APPLICABLE: 'bg-gray-500/5',
  }[dimension.verdict]
  
  return (
    <button
      onClick={() => setShowDetails(!showDetails)}
      className={cn(
        'p-2 rounded border border-transparent text-left transition-colors',
        bgColor,
        showDetails && 'border-[#333]'
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <VerdictIcon verdict={dimension.verdict} size="sm" />
          <span className="text-[10px] font-medium text-[#CCC]">
            {CATEGORY_LABELS[dimension.category]}
          </span>
        </div>
        <span className="text-[9px] text-[#666]">{dimension.score}</span>
      </div>
      
      {showDetails && (
        <div className="mt-2 space-y-1 text-[9px] text-[#888]">
          <p>{dimension.reason}</p>
          {dimension.recommendation && (
            <p className="text-amber-400/80">→ {dimension.recommendation}</p>
          )}
        </div>
      )}
    </button>
  )
}

// =============================================================================
// COMPACT INLINE VERSION (for embedding in other components)
// =============================================================================

interface InlineVerificationBadgeProps {
  report: DoctrineVerificationReport | null
  onClick?: () => void
}

export function InlineVerificationBadge({ report, onClick }: InlineVerificationBadgeProps) {
  if (!report) return null
  
  const colors = {
    PASS: 'bg-green-500/10 text-green-500 border-green-500/20',
    PARTIAL: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    FAIL: 'bg-red-500/10 text-red-500 border-red-500/20',
    NOT_APPLICABLE: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  }
  
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded border text-[10px] font-medium transition-colors hover:brightness-110',
        colors[report.overallVerdict]
      )}
    >
      <VerdictIcon verdict={report.overallVerdict} size="sm" />
      <span>{report.overallScore}/100</span>
    </button>
  )
}
