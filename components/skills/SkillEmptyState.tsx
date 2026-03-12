'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Activity, 
  TrendingUp, 
  Target,
  ArrowRight,
  CheckCircle,
} from 'lucide-react'

interface SkillEmptyStateProps {
  type: 'no_sessions' | 'no_strength' | 'no_profile' | 'partial_data'
  skillName?: string
}

export function SkillEmptyState({ type, skillName }: SkillEmptyStateProps) {
  const configs = {
    no_sessions: {
      icon: <Activity className="w-12 h-12" />,
      title: 'Start Tracking',
      description: 'Log your first skill session to unlock readiness analysis.',
      tips: [
        'Record hold times for each set',
        'Note the quality of each hold',
        'Track consistently for best insights',
      ],
    },
    no_strength: {
      icon: <TrendingUp className="w-12 h-12" />,
      title: 'Add Strength Data',
      description: 'Connect your weighted strength records for better progression recommendations.',
      tips: [
        'Log weighted pull-ups and dips',
        'Support strength informs skill readiness',
        'Track your 1RM progress',
      ],
    },
    no_profile: {
      icon: <Target className="w-12 h-12" />,
      title: 'Complete Your Profile',
      description: 'Add your bodyweight and experience level for personalized guidance.',
      tips: [
        'Set your current bodyweight',
        'Select your experience level',
        'Recommendations adapt to you',
      ],
    },
    partial_data: {
      icon: <CheckCircle className="w-12 h-12" />,
      title: 'Keep Building',
      description: 'More data improves accuracy. Continue logging sessions.',
      tips: [
        'Aim for 2-3 sessions per week',
        'Track both good and bad days',
        'Consistency reveals true readiness',
      ],
    },
  }

  const config = configs[type]

  return (
    <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-6">
      <div className="text-center py-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#1A1A1A] text-[#3A3A3A] mb-4">
          {config.icon}
        </div>
        
        <h3 className="text-xl font-semibold mb-2">{config.title}</h3>
        <p className="text-[#A5A5A5] mb-6 max-w-sm mx-auto">
          {config.description}
        </p>

        <div className="bg-[#1A1A1A] rounded-lg p-4 max-w-sm mx-auto mb-6">
          <p className="text-xs text-[#A5A5A5] uppercase tracking-wider mb-3">Tips</p>
          <ul className="space-y-2">
            {config.tips.map((tip, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-[#A5A5A5]">
                <ArrowRight className="w-3 h-3 text-[#E63946]" />
                {tip}
              </li>
            ))}
          </ul>
        </div>

        {/* CTA Button */}
        {type === 'no_sessions' && (
          <Button className="bg-[#E63946] hover:bg-[#D62828] text-white gap-2">
            <Activity className="w-4 h-4" />
            Log Skill Session
          </Button>
        )}
        {type === 'no_strength' && (
          <Link href="/strength">
            <Button className="bg-[#E63946] hover:bg-[#D62828] text-white gap-2">
              <TrendingUp className="w-4 h-4" />
              Log Strength Record
            </Button>
          </Link>
        )}
        {type === 'no_profile' && (
          <Link href="/settings">
            <Button className="bg-[#E63946] hover:bg-[#D62828] text-white gap-2">
              <Target className="w-4 h-4" />
              Complete Profile
            </Button>
          </Link>
        )}
      </div>
    </Card>
  )
}
