'use client'

import { Card } from '@/components/ui/card'
import { type WeeklyVolumeSummary } from '@/lib/volume-analyzer'
import { Activity, Dumbbell, Layers, Clock } from 'lucide-react'

interface WeeklyVolumeCardProps {
  volume: WeeklyVolumeSummary
}

export function WeeklyVolumeCard({ volume }: WeeklyVolumeCardProps) {
  const metrics = [
    {
      label: 'Workouts',
      value: volume.workoutsThisWeek,
      icon: Activity,
    },
    {
      label: 'Exercises',
      value: volume.exercisesLogged,
      icon: Dumbbell,
    },
    {
      label: 'Total Sets',
      value: volume.totalSets,
      icon: Layers,
    },
    {
      label: 'Training Time',
      value: `${volume.totalTrainingMinutes}m`,
      icon: Clock,
    },
  ]

  return (
    <Card className="bg-[#1E1E1E] border-[#3A3A3A] p-5">
      <h3 className="text-lg font-semibold text-[#F5F5F5] mb-4">Weekly Training Summary</h3>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="bg-[#2A2A2A] rounded-lg p-4 text-center"
          >
            <metric.icon className="w-5 h-5 text-[#E63946] mx-auto mb-2" />
            <div className="text-2xl font-bold text-[#F5F5F5]">{metric.value}</div>
            <div className="text-xs text-[#A5A5A5] mt-1">{metric.label}</div>
          </div>
        ))}
      </div>
    </Card>
  )
}
