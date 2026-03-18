import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Target, Dumbbell, Calendar, ArrowRight, ArrowUp, Pause, AlertCircle } from 'lucide-react'
import type { PrimarySkillSummary, StrengthSummary, ProgramSummary } from '@/lib/dashboard-service'
import type { ReadinessStatus } from '@/types/skill-readiness'

const READINESS_LABELS: Record<ReadinessStatus, string> = {
  progress_now: 'Ready to Progress',
  micro_progress: 'Micro-Progress',
  stay_current: 'Building',
  stabilize: 'Stabilize First',
}

interface CoreToolsSectionProps {
  skillSummary: PrimarySkillSummary
  strengthSummary: StrengthSummary
  programSummary: ProgramSummary
}

export function CoreToolsSection({
  skillSummary,
  strengthSummary,
  programSummary,
}: CoreToolsSectionProps) {
  const tools = [
    {
      href: '/my-skills',
      icon: Target,
      title: 'Skill Progression',
      description: 'Track skills with readiness analysis and personalized guidance.',
      metric: skillSummary.hasData
        ? skillSummary.readinessStatus
          ? `${skillSummary.displayName}: ${READINESS_LABELS[skillSummary.readinessStatus]}`
          : `${skillSummary.displayName} at ${skillSummary.currentLevelName}`
        : 'Start tracking a skill',
      hasData: skillSummary.hasData,
    },
    {
      href: '/strength',
      icon: Dumbbell,
      title: 'Weighted Strength',
      description: 'Relative strength analysis, skill-support mapping, and progress trends.',
      metric: strengthSummary.pullTier || strengthSummary.pushTier
        ? `Pull: ${strengthSummary.pullTier || '—'} • Push: ${strengthSummary.pushTier || '—'}`
        : strengthSummary.pullUp
          ? `Latest pull-up: +${strengthSummary.pullUp.weightAdded} x ${strengthSummary.pullUp.reps}`
          : strengthSummary.dip
            ? `Latest dip: +${strengthSummary.dip.weightAdded} x ${strengthSummary.dip.reps}`
            : 'Log your first lift',
      hasData: strengthSummary.hasAnyData,
    },
    {
      href: '/program',
      icon: Calendar,
      title: 'Adaptive Program',
      description: 'Constraint-aware, time-adaptive training based on your data.',
      metric: programSummary.hasData
        ? `${programSummary.daysPerWeek}-day ${programSummary.goalLabel} program`
        : 'Build your adaptive program',
      hasData: programSummary.hasData,
    },
  ]

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-[#A5A5A5] uppercase tracking-wider">
        Core Tools
      </h2>
      <div className="grid sm:grid-cols-3 gap-4">
        {tools.map((tool) => (
          <Card
            key={tool.href}
            className="bg-[#2A2A2A] border-[#3A3A3A] p-5 hover:border-[#4A4A4A] transition-colors group"
          >
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-lg bg-[#1A1A1A] flex items-center justify-center shrink-0 group-hover:bg-[#E63946]/10 transition-colors">
                <tool.icon className="w-5 h-5 text-[#E63946]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold mb-1">{tool.title}</h3>
                <p className="text-xs text-[#6A6A6A] mb-3 line-clamp-2">
                  {tool.description}
                </p>
                <p className={`text-sm mb-4 truncate ${tool.hasData ? 'text-[#A5A5A5]' : 'text-[#6A6A6A]'}`}>
                  {tool.metric}
                </p>
                <Link href={tool.href}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-[#3A3A3A] hover:bg-[#3A3A3A] hover:border-[#4A4A4A] gap-2"
                  >
                    Open
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
