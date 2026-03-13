'use client'

import { Target, Zap, Dumbbell, Flame, Activity, Shield } from 'lucide-react'

interface TrainingEmphasisProps {
  primaryEmphasis: string
  secondaryEmphasis?: string
  rationale: string
  coachingTip?: string
}

const emphasisIcons: Record<string, React.ElementType> = {
  'Strength-focused': Dumbbell,
  'Skill-focused': Target,
  'Power-focused': Zap,
  'Range-building': Flame,
  'Active range strength': Flame,
  'Endurance-focused': Activity,
  'Recovery-aware training': Shield,
  'Building support strength': Dumbbell,
  'Skill and strength combined': Target,
  'Depth and strength combined': Flame,
}

export function TrainingEmphasis({ 
  primaryEmphasis, 
  secondaryEmphasis, 
  rationale,
  coachingTip 
}: TrainingEmphasisProps) {
  const Icon = emphasisIcons[primaryEmphasis] || Target

  return (
    <div className="bg-[#0F1115] border border-[#2B313A] rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-lg bg-[#C1121F]/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-[#C1121F]" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-[#E6E9EF]">This Week's Focus</h3>
          <p className="text-xs text-[#6B7280]">Training emphasis</p>
        </div>
      </div>

      {/* Emphasis badges */}
      <div className="flex flex-wrap gap-2 mb-3">
        <span className="px-2.5 py-1 text-xs font-medium bg-[#C1121F]/10 text-[#C1121F] rounded-full">
          {primaryEmphasis}
        </span>
        {secondaryEmphasis && (
          <span className="px-2.5 py-1 text-xs font-medium bg-[#1A1D24] text-[#A4ACB8] rounded-full border border-[#2B313A]">
            {secondaryEmphasis}
          </span>
        )}
      </div>

      {/* Rationale */}
      <p className="text-sm text-[#A4ACB8] leading-relaxed">
        {rationale}
      </p>

      {/* Coaching tip */}
      {coachingTip && (
        <div className="mt-3 pt-3 border-t border-[#2B313A]">
          <p className="text-xs text-[#6B7280] italic">
            "{coachingTip}"
          </p>
        </div>
      )}
    </div>
  )
}

export function TrainingEmphasisCompact({ 
  primaryEmphasis, 
  rationale 
}: Pick<TrainingEmphasisProps, 'primaryEmphasis' | 'rationale'>) {
  const Icon = emphasisIcons[primaryEmphasis] || Target

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-[#1A1D24] rounded-lg border border-[#2B313A]">
      <Icon className="w-4 h-4 text-[#C1121F]" />
      <span className="text-xs text-[#A4ACB8]">{rationale}</span>
    </div>
  )
}
