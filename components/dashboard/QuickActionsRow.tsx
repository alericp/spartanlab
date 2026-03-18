import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Target, Dumbbell, Calendar, Play, ArrowRight, Archive, Trophy } from 'lucide-react'

export function QuickActionsRow() {
  const secondaryActions = [
    {
      href: '/my-skills',
      icon: Target,
      label: 'Skills',
    },
    {
      href: '/strength',
      icon: Dumbbell,
      label: 'Strength',
    },
    {
      href: '/my-programs',
      icon: Calendar,
      label: 'Program',
    },
    {
      href: '/history',
      icon: Archive,
      label: 'History',
    },
    {
      href: '/history/prs',
      icon: Trophy,
      label: 'PRs',
    },
  ]

  return (
    <div className="space-y-3">
      {/* Primary CTA - Start Workout */}
      <Link href="/workout/session" className="block">
        <Button 
          className="w-full sm:w-auto bg-[#C1121F] hover:bg-[#A30F1A] text-white gap-2 h-12 px-6 text-base"
        >
          <Play className="w-5 h-5" />
          Start Workout
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </Link>
      
      {/* Secondary Actions - More subtle */}
      <div className="flex flex-wrap gap-2">
        {secondaryActions.map((action) => (
          <Link key={action.href} href={action.href}>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-[#6B7280] hover:text-[#E6E9EF] hover:bg-[#1A1F26]"
            >
              <action.icon className="w-4 h-4" />
              {action.label}
            </Button>
          </Link>
        ))}
      </div>
    </div>
  )
}
