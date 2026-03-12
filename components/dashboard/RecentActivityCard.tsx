import { Card } from '@/components/ui/card'
import { Target, Dumbbell, Calendar, Clock } from 'lucide-react'
import { formatRelativeTime, type RecentActivity } from '@/lib/dashboard-service'

interface RecentActivityCardProps {
  activities: RecentActivity[]
}

const ICON_MAP = {
  skill: Target,
  strength: Dumbbell,
  program: Calendar,
}

export function RecentActivityCard({ activities }: RecentActivityCardProps) {
  if (activities.length === 0) {
    return (
      <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-5">
        <div className="flex items-center gap-3 text-[#6A6A6A]">
          <Clock className="w-4 h-4" />
          <p className="text-sm">
            No recent activity yet. Start by updating a skill, logging strength, or generating a program.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-5">
      <h3 className="text-sm font-semibold text-[#6A6A6A] uppercase tracking-wider mb-4">
        Recent Activity
      </h3>
      <div className="space-y-3">
        {activities.map((activity, idx) => {
          const Icon = ICON_MAP[activity.type]
          return (
            <div key={idx} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-[#1A1A1A] flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-[#E63946]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{activity.label}</p>
              </div>
              <span className="text-xs text-[#6A6A6A] shrink-0">
                {formatRelativeTime(activity.timestamp)}
              </span>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
