import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Target, Dumbbell, Calendar, Play } from 'lucide-react'

export function QuickActionsRow() {
  const actions = [
    {
      href: '/workout/session',
      icon: Play,
      label: "Start Workout",
      variant: 'default' as const,
    },
    {
      href: '/skills',
      icon: Target,
      label: 'Update Skills',
      variant: 'outline' as const,
    },
    {
      href: '/strength',
      icon: Dumbbell,
      label: 'Log Strength',
      variant: 'outline' as const,
    },
    {
      href: '/programs',
      icon: Calendar,
      label: 'Build Program',
      variant: 'outline' as const,
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        {actions.map((action, idx) => (
          <Link key={action.href} href={action.href}>
            <Button
              variant={action.variant}
              className={`gap-2 ${
                idx === 0
                  ? 'bg-[#C1121F] hover:bg-[#A30F1A] text-white'
                  : 'border-[#2B313A] hover:bg-[#1A1F26] text-[#A4ACB8] hover:text-[#E6E9EF]'
              }`}
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
