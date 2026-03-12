'use client'

import { Card } from '@/components/ui/card'
import { Target, Dumbbell, TrendingUp, Calendar } from 'lucide-react'
import { StrengthScoreBreakdown } from '@/lib/strength-score-engine'

interface ScoreBreakdownProps {
  score: StrengthScoreBreakdown
}

export function ScoreBreakdown({ score }: ScoreBreakdownProps) {
  const sections = [
    {
      title: 'Skill Score',
      icon: Target,
      score: score.skillScore,
      weight: 35,
      description: 'Current progression across planche, front lever, muscle-up, and handstand push-up.',
      details: [
        'Tracks advancement through movement progressions',
        'Higher levels = exponentially more difficult',
        'Represents technical mastery',
      ],
    },
    {
      title: 'Strength Score',
      icon: Dumbbell,
      score: score.strengthScore,
      weight: 35,
      description: 'Based on weighted dip, pull-up, and muscle-up performance.',
      details: [
        'Measured by estimated 1RM from logged records',
        'Normalizes different exercise difficulty levels',
        'Reflects pure strength capacity',
      ],
    },
    {
      title: 'Readiness Score',
      icon: TrendingUp,
      score: score.readinessScore,
      weight: 15,
      description: 'How close you are to progressing to the next skill level.',
      details: [
        'Based on clean hold quality and consistency',
        'Higher density improves readiness',
        'Indicates progression timing',
      ],
    },
    {
      title: 'Consistency Score',
      icon: Calendar,
      score: score.consistencyScore,
      weight: 15,
      description: 'Based on training frequency and recent workout activity.',
      details: [
        `${score.consistencyScore >= 75 ? 'Strong' : 'Moderate'} weekly training frequency`,
        'Adjusted for recent activity recency',
        'Reflects dedication to the program',
      ],
    },
  ]

  const getScoreColor = (s: number) => {
    if (s >= 70) return 'text-green-400'
    if (s >= 40) return 'text-blue-400'
    return 'text-[#A5A5A5]'
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
      {sections.map((section) => {
        const Icon = section.icon
        return (
          <Card key={section.title} className="bg-[#2A2A2A] border-[#3A3A3A] p-5">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-[#6A6A6A]" />
                    <p className="text-xs text-[#6A6A6A] uppercase tracking-wider">
                      {section.title}
                    </p>
                  </div>
                  <p className={`text-3xl font-bold ${getScoreColor(section.score)}`}>
                    {section.score}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#6A6A6A]">Weight</p>
                  <p className="text-sm font-semibold text-[#A5A5A5]">{section.weight}%</p>
                </div>
              </div>

              <p className="text-sm text-[#A5A5A5] leading-relaxed">{section.description}</p>

              <div className="space-y-1.5 pt-2 border-t border-[#3A3A3A]">
                {section.details.map((detail, idx) => (
                  <div key={idx} className="flex gap-2 text-xs text-[#6A6A6A]">
                    <span className="text-[#E63946] flex-shrink-0">•</span>
                    <span>{detail}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
