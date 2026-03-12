'use client'

import { type GoalProjection } from '@/lib/goal-projection-engine'
import { GoalProjectionCard } from './GoalProjectionCard'

interface GoalProjectionListProps {
  projections: GoalProjection[]
  title: string
  emptyMessage?: string
}

export function GoalProjectionList({ projections, title, emptyMessage }: GoalProjectionListProps) {
  if (projections.length === 0 && emptyMessage) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-[#E6E9EF]">{title}</h2>
        <div className="text-center py-8 text-[#A4ACB8]">
          {emptyMessage}
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-[#E6E9EF]">{title}</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {projections.map((projection) => (
          <GoalProjectionCard key={projection.goalType} projection={projection} />
        ))}
      </div>
    </div>
  )
}
