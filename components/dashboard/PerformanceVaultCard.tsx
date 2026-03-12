'use client'

import { Card } from '@/components/ui/card'
import { Database, Crown, ChevronRight, Trophy, Award, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { getPRVault } from '@/lib/pr-vault-engine'
import { getMilestones } from '@/lib/milestone-engine'
import { getEliteInsights } from '@/lib/elite-insight-engine'
import { getQuickEngineStatus } from '@/lib/adaptive-athlete-engine'
import { useState, useEffect } from 'react'

export function PerformanceVaultCard() {
  const [stats, setStats] = useState<{
    totalPRs: number
    totalMilestones: number
    totalInsights: number
    topInsight: string | null
    momentum: string | null
    topConcern: string | null
  } | null>(null)
  
  useEffect(() => {
    const vault = getPRVault()
    const milestones = getMilestones()
    const insights = getEliteInsights()
    const engineStatus = getQuickEngineStatus()
    
    setStats({
      totalPRs: vault.totalPRs,
      totalMilestones: milestones.totalMilestones,
      totalInsights: insights.insights.length,
      topInsight: insights.primaryInsight?.value || null,
      momentum: engineStatus.hasData ? engineStatus.momentumLabel : null,
      topConcern: engineStatus.topConcern,
    })
  }, [])
  
  return (
    <Link href="/database" className="block group">
      <Card className="bg-gradient-to-br from-[#0F1115] via-[#1A1F26] to-[#0F1115] border-[#2B313A] p-5 hover:border-[#C1121F]/50 transition-colors relative overflow-hidden">
        {/* Background accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#C1121F]/10 to-transparent rounded-full blur-2xl" />
        
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#C1121F] to-amber-600 flex items-center justify-center">
                <Database className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-[#E6E9EF]">Performance Database</h3>
                  <Crown className="w-4 h-4 text-amber-500" />
                </div>
                <p className="text-xs text-[#6B7280]">Elite Analytics</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#6B7280] group-hover:text-[#C1121F] transition-colors" />
          </div>
          
          {stats ? (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#0F1115] rounded-lg p-3 text-center border border-[#2B313A]">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Trophy className="w-3 h-3 text-amber-500" />
                </div>
                <p className="text-lg font-bold text-[#E6E9EF]">{stats.totalPRs}</p>
                <p className="text-xs text-[#6B7280]">PRs</p>
              </div>
              <div className="bg-[#0F1115] rounded-lg p-3 text-center border border-[#2B313A]">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Award className="w-3 h-3 text-[#4F6D8A]" />
                </div>
                <p className="text-lg font-bold text-[#E6E9EF]">{stats.totalMilestones}</p>
                <p className="text-xs text-[#6B7280]">Milestones</p>
              </div>
              <div className="bg-[#0F1115] rounded-lg p-3 text-center border border-[#2B313A]">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Sparkles className="w-3 h-3 text-[#C1121F]" />
                </div>
                <p className="text-lg font-bold text-[#E6E9EF]">{stats.totalInsights}</p>
                <p className="text-xs text-[#6B7280]">Insights</p>
              </div>
            </div>
          ) : (
            <div className="animate-pulse grid grid-cols-3 gap-3">
              <div className="bg-[#0F1115] rounded-lg h-16 border border-[#2B313A]" />
              <div className="bg-[#0F1115] rounded-lg h-16 border border-[#2B313A]" />
              <div className="bg-[#0F1115] rounded-lg h-16 border border-[#2B313A]" />
            </div>
          )}
          
          {stats?.topInsight && (
            <div className="mt-3 pt-3 border-t border-[#2B313A]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <p className="text-xs text-[#A4ACB8]">
                  <span className="text-amber-500">Top Insight:</span> {stats.topInsight}
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </Link>
  )
}
