'use client'

import { Card } from '@/components/ui/card'
import { Award, Target, Dumbbell, Activity, Calendar } from 'lucide-react'
import type { MilestoneSnapshot, MilestoneCategory } from '@/lib/milestone-engine'

interface MilestonesSectionProps {
  snapshot: MilestoneSnapshot
}

function getCategoryIcon(category: MilestoneCategory) {
  switch (category) {
    case 'skill':
      return <Target className="w-4 h-4 text-[#E63946]" />
    case 'strength':
      return <Dumbbell className="w-4 h-4 text-blue-400" />
    case 'training':
      return <Activity className="w-4 h-4 text-green-400" />
    case 'consistency':
      return <Calendar className="w-4 h-4 text-purple-400" />
    default:
      return <Award className="w-4 h-4 text-amber-500" />
  }
}

function getSignificanceStyle(significance: 'notable' | 'significant' | 'major') {
  switch (significance) {
    case 'major':
      return 'border-l-amber-500 bg-gradient-to-r from-amber-500/5 to-transparent'
    case 'significant':
      return 'border-l-blue-400 bg-gradient-to-r from-blue-500/5 to-transparent'
    case 'notable':
    default:
      return 'border-l-[#6A6A6A]'
  }
}

export function MilestonesSection({ snapshot }: MilestonesSectionProps) {
  if (snapshot.totalMilestones === 0) {
    return (
      <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-[#1A1A1A] flex items-center justify-center">
            <Award className="w-5 h-5 text-amber-500" />
          </div>
          <h2 className="text-lg font-semibold">Milestones</h2>
        </div>
        <p className="text-sm text-[#6A6A6A]">
          Keep training to unlock your first milestones.
        </p>
      </Card>
    )
  }
  
  // Show up to 8 milestones, prioritizing recent and major ones
  const displayMilestones = [
    ...snapshot.recentMilestones.slice(0, 4),
    ...snapshot.milestones
      .filter(m => m.significance === 'major' && !snapshot.recentMilestones.includes(m))
      .slice(0, 2),
    ...snapshot.milestones
      .filter(m => !snapshot.recentMilestones.includes(m) && m.significance !== 'major')
      .slice(0, 2),
  ].slice(0, 8)
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-[#1A1A1A] flex items-center justify-center">
          <Award className="w-5 h-5 text-amber-500" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Milestones</h2>
          <p className="text-xs text-[#6A6A6A]">{snapshot.totalMilestones} achievements</p>
        </div>
      </div>
      
      {/* Recent milestones highlight */}
      {snapshot.recentMilestones.length > 0 && (
        <Card className="bg-gradient-to-r from-amber-500/10 to-transparent border-amber-500/30 p-4">
          <p className="text-xs text-amber-500 font-medium mb-2">Recent Achievement</p>
          <div className="flex items-center gap-3">
            {getCategoryIcon(snapshot.recentMilestones[0].category)}
            <div>
              <p className="font-medium">{snapshot.recentMilestones[0].title}</p>
              <p className="text-xs text-[#A5A5A5]">{snapshot.recentMilestones[0].description}</p>
            </div>
          </div>
        </Card>
      )}
      
      {/* Milestone list */}
      <div className="grid gap-2">
        {displayMilestones.map(milestone => (
          <Card 
            key={milestone.id}
            className={`bg-[#2A2A2A] border-[#3A3A3A] border-l-2 p-3 ${getSignificanceStyle(milestone.significance)}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getCategoryIcon(milestone.category)}
                <div>
                  <p className="text-sm font-medium">{milestone.title}</p>
                  <p className="text-xs text-[#6A6A6A]">{milestone.description}</p>
                </div>
              </div>
              <p className="text-xs text-[#6A6A6A]">
                {new Date(milestone.dateAchieved).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
