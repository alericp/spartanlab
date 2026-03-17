'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { Card } from '@/components/ui/card'
import { Trophy, ChevronRight, Dumbbell, Timer, Hash } from 'lucide-react'
import Link from 'next/link'
import type { PersonalRecordHistory } from '@/types/history'

interface PRStats {
  totalPRs: number
  recentPRCount: number
  latestPR: PersonalRecordHistory | null
}

export function PRArchiveCard() {
  const { userId } = useAuth()
  const [stats, setStats] = useState<PRStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      if (!userId) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/history/prs?userId=${userId}&limit=100`)
        if (response.ok) {
          const data = await response.json()
          const prs: PersonalRecordHistory[] = data.prs || []
          
          // Calculate recent PRs (last 30 days)
          const thirtyDaysAgo = new Date()
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
          const recentPRs = prs.filter(pr => new Date(pr.achievedAt) > thirtyDaysAgo)
          
          // Sort to find latest
          const sorted = [...prs].sort(
            (a, b) => new Date(b.achievedAt).getTime() - new Date(a.achievedAt).getTime()
          )

          setStats({
            totalPRs: prs.length,
            recentPRCount: recentPRs.length,
            latestPR: sorted[0] || null,
          })
        }
      } catch (error) {
        console.error('[PRArchiveCard] Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [userId])

  const getPRIcon = (prType: string) => {
    switch (prType) {
      case 'max_weight': return <Dumbbell className="w-3 h-3" />
      case 'best_hold': return <Timer className="w-3 h-3" />
      case 'best_reps': return <Hash className="w-3 h-3" />
      default: return <Trophy className="w-3 h-3" />
    }
  }

  const formatPRValue = (pr: PersonalRecordHistory) => {
    switch (pr.prType) {
      case 'max_weight': return pr.unit ? `${pr.valuePrimary} ${pr.unit}` : `+${pr.valuePrimary} lb`
      case 'best_hold': return `${pr.valuePrimary} sec`
      case 'best_reps': return `${pr.valuePrimary} reps`
      case 'best_volume': return `${pr.valuePrimary}`
      default: return `${pr.valuePrimary}`
    }
  }

  return (
    <Link href="/prs" className="block group">
      <Card className="bg-[#1A1F26] border-[#2B313A] p-4 sm:p-5 hover:border-[#C1121F]/50 transition-colors">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-semibold text-[#E6E9EF]">PR Archive</h3>
              <p className="text-xs text-[#6B7280]">Personal records</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-[#6B7280] group-hover:text-[#C1121F] transition-colors" />
        </div>

        {loading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-[#2B313A] rounded w-1/2" />
            <div className="h-4 bg-[#2B313A] rounded w-3/4" />
          </div>
        ) : stats && stats.totalPRs > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center gap-4 text-sm">
              <span className="text-[#A4ACB8]">
                <span className="font-semibold text-[#E6E9EF]">{stats.totalPRs}</span> total PRs
              </span>
              {stats.recentPRCount > 0 && (
                <span className="text-emerald-400 text-xs">
                  +{stats.recentPRCount} this month
                </span>
              )}
            </div>
            
            {stats.latestPR && (
              <div className="flex items-center gap-2 text-xs text-[#A4ACB8]">
                <span className="text-amber-400">
                  {getPRIcon(stats.latestPR.prType)}
                </span>
                <span>Latest: {stats.latestPR.exerciseName}</span>
                <span className="text-amber-400 font-medium">
                  {formatPRValue(stats.latestPR)}
                </span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-[#6B7280]">
            No PRs tracked yet. Complete workouts to start building your archive.
          </p>
        )}
      </Card>
    </Link>
  )
}
