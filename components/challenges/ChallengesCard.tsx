'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Target, ChevronRight, Trophy, Flame, Crown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChallengeList } from './ChallengeCard'
import { 
  getActiveChallengesWithProgress,
  getCompletedChallengeCount,
  getTotalScoreBoost,
} from '@/lib/challenges/challenge-engine'
import { getCurrentSeasonInfo } from '@/lib/challenges/challenge-definitions'

interface ChallengesCardProps {
  maxDisplay?: number
}

export function ChallengesCard({ maxDisplay = 3 }: ChallengesCardProps) {
  const [challenges, setChallenges] = useState<Array<{
    challenge: ReturnType<typeof getActiveChallengesWithProgress>[0]['challenge']
    progress: ReturnType<typeof getActiveChallengesWithProgress>[0]['progress']
    percentComplete: number
  }>>([])
  const [completedCount, setCompletedCount] = useState(0)
  const [scoreBoost, setScoreBoost] = useState(0)
  const [season, setSeason] = useState<ReturnType<typeof getCurrentSeasonInfo>>(null)
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
    const data = getActiveChallengesWithProgress()
    // Sort by completion (incomplete first), then by percent complete (highest first)
    const sorted = [...data].sort((a, b) => {
      if (a.progress.completed !== b.progress.completed) {
        return a.progress.completed ? 1 : -1
      }
      return b.percentComplete - a.percentComplete
    })
    setChallenges(sorted)
    setCompletedCount(getCompletedChallengeCount())
    setScoreBoost(getTotalScoreBoost())
    setSeason(getCurrentSeasonInfo())
  }, [])
  
  if (!mounted) {
    return (
      <Card className="bg-[#12151A] border-[#2A2F36]">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-[#E6E9EF] flex items-center gap-2">
            <Target className="w-5 h-5 text-[#C1121F]" />
            Challenges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-[#C1121F] border-t-transparent rounded-full animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }
  
  const activeCount = challenges.filter(c => !c.progress.completed).length
  
  return (
    <Card className="bg-[#12151A] border-[#2A2F36]">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-[#E6E9EF] flex items-center gap-2">
            <Target className="w-5 h-5 text-[#C1121F]" />
            Challenges
          </CardTitle>
          <Link href="/challenges">
            <Button variant="ghost" size="sm" className="text-[#A4ACB8] hover:text-[#E6E9EF] -mr-2">
              View All
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats row */}
        <div className="flex items-center gap-4 p-3 rounded-lg bg-[#1A1F26] border border-[#2A2F36]">
          <div className="flex items-center gap-2 flex-1">
            <Flame className="w-4 h-4 text-orange-400" />
            <div>
              <p className="text-xs text-[#6B7280]">Active</p>
              <p className="text-sm font-semibold text-[#E6E9EF]">{activeCount}</p>
            </div>
          </div>
          <div className="w-px h-8 bg-[#2A2F36]" />
          <div className="flex items-center gap-2 flex-1">
            <Trophy className="w-4 h-4 text-emerald-400" />
            <div>
              <p className="text-xs text-[#6B7280]">Completed</p>
              <p className="text-sm font-semibold text-[#E6E9EF]">{completedCount}</p>
            </div>
          </div>
          {scoreBoost > 0 && (
            <>
              <div className="w-px h-8 bg-[#2A2F36]" />
              <div className="flex items-center gap-2 flex-1">
                <span className="text-amber-400 text-sm font-bold">+{scoreBoost}</span>
                <p className="text-xs text-[#6B7280]">Score</p>
              </div>
            </>
          )}
        </div>
        
        {/* Season indicator */}
        {season && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <Crown className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-amber-400 font-medium">{season.name}</span>
          </div>
        )}
        
        {/* Challenge list */}
        <ChallengeList challenges={challenges} maxDisplay={maxDisplay} />
      </CardContent>
    </Card>
  )
}
