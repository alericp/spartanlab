'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ClipboardList, ArrowRight, Calendar } from 'lucide-react'
import { formatWorkoutDate } from '@/lib/workout-analytics'
import type { RecentTrainingModel } from '@/lib/workout/history-progress'

interface RecentTrainingCardProps {
  model: RecentTrainingModel
}

export function RecentTrainingCard({ model }: RecentTrainingCardProps) {
  if (model.mode === 'empty') {
    return (
      <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-5">
        <Header href={model.href} />
        <div className="text-center py-4">
          <p className="text-[#A5A5A5] text-sm mb-3">No workouts logged yet</p>
          <Link href={model.href}>
            <Button size="sm" className="bg-[#E63946] hover:bg-[#D62828]">
              Log First Workout
            </Button>
          </Link>
        </div>
      </Card>
    )
  }

  if (model.mode === 'error') {
    return (
      <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-5">
        <Header href="/history/workouts" />
        <div className="rounded border border-amber-500/30 bg-amber-500/10 p-3">
          <p className="text-sm font-medium text-amber-100">{model.title}</p>
          <p className="mt-1 text-sm text-[#E6E9EF]">{model.detail}</p>
        </div>
        {model.device && <DeviceSummary summary={model.device} label="On this device" />}
      </Card>
    )
  }

  if (model.mode === 'device') {
    return (
      <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-5">
        <Header href={model.href} />
        <DeviceSummary summary={model} label="On this device" />
      </Card>
    )
  }

  return (
    <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-5">
      <Header href={model.href} />
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 py-2 px-3 bg-[#1A1A1A] rounded">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#A5A5A5]" />
            <span className="text-sm text-[#A5A5A5]">This week</span>
          </div>
          <span className="font-medium whitespace-nowrap">
            {model.workoutsThisWeek} {model.workoutsThisWeek === 1 ? 'workout' : 'workouts'}
          </span>
        </div>
        {model.sessions.map(session => (
          <div key={session.id} className="px-3">
            <p className="font-medium text-sm">{session.name}</p>
            <p className="text-xs text-[#A5A5A5]">{formatWorkoutDate(session.date)}</p>
            {session.lines.length > 0 && (
              <ul className="mt-1 space-y-0.5">
                {session.lines.map(line => (
                  <li key={line} className="text-xs text-[#E6E9EF] break-words">{line}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}

function Header({ href }: { href: string }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-4">
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-[#E63946]/10 flex items-center justify-center shrink-0">
          <ClipboardList className="w-4 h-4 text-[#E63946]" />
        </div>
        <h3 className="font-semibold">Recent Training</h3>
      </div>
      <Link href={href}>
        <Button variant="ghost" size="sm" className="text-[#A5A5A5] hover:text-[#F5F5F5] gap-1 whitespace-nowrap">
          View All
          <ArrowRight className="w-4 h-4" />
        </Button>
      </Link>
    </div>
  )
}

function DeviceSummary({
  summary,
  label,
}: {
  summary: {
    href: '/workouts'
    workoutsThisWeek: number
    lastWorkoutName: string | null
    lastWorkoutDate: string | null
  }
  label: string
}) {
  return (
    <div className="space-y-3 mt-3">
      <p className="text-xs text-[#A5A5A5]">{label}</p>
      <div className="flex items-center justify-between gap-3 py-2 px-3 bg-[#1A1A1A] rounded">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#A5A5A5]" />
          <span className="text-sm text-[#A5A5A5]">This week</span>
        </div>
        <span className="font-medium whitespace-nowrap">
          {summary.workoutsThisWeek} {summary.workoutsThisWeek === 1 ? 'workout' : 'workouts'}
        </span>
      </div>
      {summary.lastWorkoutDate && (
        <div className="px-3">
          <p className="text-xs text-[#A5A5A5] mb-1">Last session</p>
          <p className="font-medium text-sm break-words">{summary.lastWorkoutName}</p>
          <p className="text-xs text-[#A5A5A5]">{formatWorkoutDate(summary.lastWorkoutDate)}</p>
          <Link href={summary.href} className="text-xs text-[#E63946] hover:underline">
            Device workout log
          </Link>
        </div>
      )}
    </div>
  )
}
