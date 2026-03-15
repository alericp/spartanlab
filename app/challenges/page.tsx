'use client'

import { useState, useEffect } from 'react'
import { Target, Trophy, Flame, Crown, Clock, Sparkles } from 'lucide-react'
import { PageContainer } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChallengeCard } from '@/components/challenges/ChallengeCard'
import { ChallengeNotification } from '@/components/challenges/ChallengeNotification'
import { AuthGuard } from '@/components/auth/AuthGuard'
import {
  getActiveChallengesWithProgress,
  getCompletedChallengeCount,
  getTotalScoreBoost,
  getExpiringChallenges,
} from '@/lib/challenges/challenge-engine'
import {
  getCurrentSeasonInfo,
  CHALLENGE_CATEGORY_LABELS,
  type ChallengeCategory,
} from '@/lib/challenges/challenge-definitions'

function ChallengesContent() {
  const [challenges, setChallenges] = useState<ReturnType<typeof getActiveChallengesWithProgress>>([])
  const [completedCount, setCompletedCount] = useState(0)
  const [scoreBoost, setScoreBoost] = useState(0)
  const [expiring, setExpiring] = useState<ReturnType<typeof getExpiringChallenges>>([])
  const [season, setSeason] = useState<ReturnType<typeof getCurrentSeasonInfo>>(null)
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<ChallengeCategory | 'all'>('all')
  
  useEffect(() => {
    setMounted(true)
    const data = getActiveChallengesWithProgress()
    setChallenges(data)
    setCompletedCount(getCompletedChallengeCount())
    setScoreBoost(getTotalScoreBoost())
    setExpiring(getExpiringChallenges())
    setSeason(getCurrentSeasonInfo())
  }, [])
  
  if (!mounted) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-2 border-[#C1121F] border-t-transparent rounded-full animate-spin" />
        </div>
      </PageContainer>
    )
  }
  
  const filteredChallenges = activeTab === 'all' 
    ? challenges 
    : challenges.filter(c => c.challenge.category === activeTab)
  
  const activeChallenges = filteredChallenges.filter(c => !c.progress.completed)
  const completedChallenges = filteredChallenges.filter(c => c.progress.completed)
  
  return (
    <PageContainer>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#E6E9EF]">Challenges</h1>
              <p className="text-[#A4ACB8] mt-1">Complete challenges to earn rewards and boost your Spartan Score</p>
            </div>
          </div>
          
          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-[#12151A] border-[#2A2F36]">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <Flame className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-xs text-[#6B7280]">Active</p>
                  <p className="text-xl font-bold text-[#E6E9EF]">{activeChallenges.length}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-[#12151A] border-[#2A2F36]">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-[#6B7280]">Completed</p>
                  <p className="text-xl font-bold text-[#E6E9EF]">{completedCount}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-[#12151A] border-[#2A2F36]">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-[#6B7280]">Score Boost</p>
                  <p className="text-xl font-bold text-amber-400">+{scoreBoost}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-[#12151A] border-[#2A2F36]">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-xs text-[#6B7280]">Expiring Soon</p>
                  <p className="text-xl font-bold text-[#E6E9EF]">{expiring.length}</p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Season Banner */}
          {season && (
            <Card className="bg-gradient-to-r from-amber-500/10 to-amber-600/5 border-amber-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <Crown className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-amber-400">{season.name}</h2>
                    <p className="text-sm text-[#A4ACB8]">{season.theme}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Challenge Tabs */}
          <Tabs defaultValue="all" onValueChange={(v) => setActiveTab(v as ChallengeCategory | 'all')}>
            <TabsList className="bg-[#1A1F26] border border-[#2A2F36]">
              <TabsTrigger value="all" className="data-[state=active]:bg-[#C1121F] data-[state=active]:text-white">
                All
              </TabsTrigger>
              <TabsTrigger value="weekly" className="data-[state=active]:bg-[#C1121F] data-[state=active]:text-white">
                Weekly
              </TabsTrigger>
              <TabsTrigger value="monthly" className="data-[state=active]:bg-[#C1121F] data-[state=active]:text-white">
                Monthly
              </TabsTrigger>
              <TabsTrigger value="seasonal" className="data-[state=active]:bg-[#C1121F] data-[state=active]:text-white">
                Seasonal
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab} className="mt-6">
              {/* Active Challenges */}
              {activeChallenges.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-[#A4ACB8] uppercase tracking-wide">
                    Active Challenges
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {activeChallenges.map(({ challenge, progress, percentComplete }) => (
                      <ChallengeCard
                        key={challenge.id}
                        challenge={challenge}
                        progress={progress}
                        percentComplete={percentComplete}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Completed Challenges */}
              {completedChallenges.length > 0 && (
                <div className="space-y-4 mt-8">
                  <h3 className="text-sm font-medium text-[#A4ACB8] uppercase tracking-wide">
                    Completed
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {completedChallenges.map(({ challenge, progress, percentComplete }) => (
                      <ChallengeCard
                        key={challenge.id}
                        challenge={challenge}
                        progress={progress}
                        percentComplete={percentComplete}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Empty state */}
              {filteredChallenges.length === 0 && (
                <Card className="bg-[#12151A] border-[#2A2F36]">
                  <CardContent className="py-12 text-center">
                    <Target className="w-12 h-12 mx-auto text-[#3A4553] mb-4" />
                    <h3 className="text-[#E6E9EF] font-medium mb-2">No challenges in this category</h3>
                    <p className="text-sm text-[#6B7280]">
                      Check back soon for new challenges
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
          
          {/* How It Works */}
          <Card className="bg-[#12151A] border-[#2A2F36]">
            <CardHeader>
              <CardTitle className="text-base text-[#E6E9EF]">How Challenges Work</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-[#A4ACB8]">
              <p>
                <strong className="text-[#E6E9EF]">Weekly Challenges</strong> reset every Sunday and reward consistent training habits.
              </p>
              <p>
                <strong className="text-[#E6E9EF]">Monthly Challenges</strong> reset on the 1st of each month for bigger goals and rewards.
              </p>
              <p>
                <strong className="text-[#E6E9EF]">Seasonal Challenges</strong> run for 3 months and offer the most prestigious rewards.
              </p>
              <p className="pt-2 border-t border-[#2A2F36]">
                Complete challenges to earn Spartan Score boosts and exclusive badges that appear on your profile and leaderboard rankings.
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Challenge completion notification */}
<ChallengeNotification />
  </PageContainer>
  )
}

export default function ChallengesPage() {
  return (
    <AuthGuard redirectTo="/sign-in">
      <ChallengesContent />
    </AuthGuard>
  )
}
