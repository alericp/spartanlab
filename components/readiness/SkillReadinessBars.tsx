'use client'

import React from 'react'

export interface ReadinessComponentProps {
  skill: string
  readinessScore: number
  components: {
    label: string
    score: number
    color: string
  }[]
  limitingFactor: string
}

const SKILL_LABELS: Record<string, string> = {
  front_lever: 'Front Lever',
  planche: 'Planche',
  hspu: 'Handstand Push-up',
  muscle_up: 'Muscle-up',
  l_sit: 'L-sit / Compression',
}

const LIMITER_COLORS: Record<string, string> = {
  'Pull Strength': '#E63946',
  'Compression': '#F1FAEE',
  'Scapular Control': '#A8DADC',
  'Straight Arm': '#457B9D',
  'Mobility': '#1D3557',
}

/**
 * Progress bar component
 */
function ProgressBar({
  label,
  score,
  color,
}: {
  label: string
  score: number
  color: string
}) {
  const barWidth = Math.max(5, Math.min(100, score))
  const emptyWidth = 100 - barWidth

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#A5A5A5] font-medium">{label}</span>
        <span className="text-xs text-[#E63946] font-semibold">{Math.round(score)}%</span>
      </div>
      <div className="flex gap-px h-2 bg-[#1A1A1A] rounded-full overflow-hidden border border-[#2A2A2A]">
        <div
          className="transition-all duration-300"
          style={{
            width: `${barWidth}%`,
            backgroundColor: color,
          }}
        />
        <div
          className="bg-[#0A0A0A]"
          style={{
            width: `${emptyWidth}%`,
          }}
        />
      </div>
    </div>
  )
}

/**
 * Skill Readiness Visualization Component
 *
 * Displays a skill readiness breakdown with:
 * - Overall readiness percentage
 * - Component breakdown bars
 * - Primary limiting factor
 */
export function SkillReadinessBars({
  skill,
  readinessScore,
  components,
  limitingFactor,
}: ReadinessComponentProps) {
  const skillLabel = SKILL_LABELS[skill] || skill

  return (
    <div className="space-y-6 p-4 bg-[#0F0F0F] rounded-lg border border-[#2A2A2A]">
      {/* Header with skill name and overall score */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#F5F5F5]">{skillLabel} Readiness</h3>
          <div
            className={`text-2xl font-bold ${
              readinessScore >= 80
                ? 'text-[#06D6A0]'
                : readinessScore >= 60
                  ? 'text-[#FFD60A]'
                  : readinessScore >= 40
                    ? 'text-[#FFC300]'
                    : 'text-[#E63946]'
            }`}
          >
            {Math.round(readinessScore)}%
          </div>
        </div>

        {/* Progress bar for overall readiness */}
        <div className="w-full h-1.5 bg-[#1A1A1A] rounded-full overflow-hidden border border-[#2A2A2A]">
          <div
            className={`h-full transition-all duration-300 ${
              readinessScore >= 80
                ? 'bg-[#06D6A0]'
                : readinessScore >= 60
                  ? 'bg-[#FFD60A]'
                  : readinessScore >= 40
                    ? 'bg-[#FFC300]'
                    : 'bg-[#E63946]'
            }`}
            style={{ width: `${readinessScore}%` }}
          />
        </div>
      </div>

      {/* Component breakdown */}
      <div className="space-y-3">
        {components.map((comp, idx) => (
          <ProgressBar
            key={idx}
            label={comp.label}
            score={comp.score}
            color={comp.color}
          />
        ))}
      </div>

      {/* Limiting factor indicator */}
      {limitingFactor && (
        <div className="pt-3 border-t border-[#2A2A2A]">
          <p className="text-xs text-[#A5A5A5] mb-2">Primary Limiter</p>
          <div className="flex items-center gap-2 p-2 bg-[#1A1A1A] rounded border border-[#E63946]/30">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: LIMITER_COLORS[limitingFactor] || '#E63946' }}
            />
            <span className="text-sm font-medium text-[#F5F5F5]">{limitingFactor}</span>
          </div>
        </div>
      )}
    </div>
  )
}
