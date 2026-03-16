'use client'

import { useState, useEffect } from 'react'
import { 
  Swords, 
  Users, 
  Trophy, 
  Target,
  Clock,
  ChevronRight,
  Crown,
  Medal,
  Plus,
  Check,
  X,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import {
  type H2HChallenge,
  type WeeklyPool,
  type H2HChallengeType,
  H2H_CHALLENGE_CONFIGS,
  POOL_TIER_THRESHOLDS,
  getMyActiveChallenges,
  getPendingChallengesForMe,
  getMyWeeklyPools,
  getPoolStandings,
  getH2HStats,
  getCompletedChallenges,
  acceptFriendChallenge,
  declineFriendChallenge,
  joinWeeklyPool,
  getPoolTierForScore,
} from '@/lib/h2h/h2h-service'
import { calculateSpartanScore } from '@/lib/strength-score-engine'
import { getCurrentUser } from '@/lib/data-service'
import { CreateChallengeModal } from './CreateChallengeModal'
import { SubmitScoreModal } from './SubmitScoreModal'

interface H2HPanelProps {
  className?: string
  compact?: boolean
}

export function H2HPanel({ className, compact = false }: H2HPanelProps) {
  const [mounted, setMounted] = useState(false)
  const [activeChallenges, setActiveChallenges] = useState<H2HChallenge[]>([])
  const [pendingForMe, setPendingForMe] = useState<H2HChallenge[]>([])
  const [myPools, setMyPools] = useState<WeeklyPool[]>([])
  const [stats, setStats] = useState<ReturnType<typeof getH2HStats> | null>(null)
  const [recentResults, setRecentResults] = useState<H2HChallenge[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [selectedChallenge, setSelectedChallenge] = useState<H2HChallenge | null>(null)
  const [userTier, setUserTier] = useState<ReturnType<typeof getPoolTierForScore>>('bronze')
  
  const refreshData = () => {
    setActiveChallenges(getMyActiveChallenges())
    setPendingForMe(getPendingChallengesForMe())
    setMyPools(getMyWeeklyPools())
    setStats(getH2HStats())
    setRecentResults(getCompletedChallenges())
    const score = calculateSpartanScore()
    setUserTier(getPoolTierForScore(score.totalScore))
  }
  
  useEffect(() => {
    setMounted(true)
    refreshData()
  }, [])
  
  const handleAcceptChallenge = (challengeId: string) => {
    acceptFriendChallenge(challengeId)
    refreshData()
  }
  
  const handleDeclineChallenge = (challengeId: string) => {
    declineFriendChallenge(challengeId)
    refreshData()
  }
  
  const handleJoinPool = (challengeType: H2HChallengeType) => {
    joinWeeklyPool(challengeType)
    refreshData()
  }
  
  const handleSubmitScore = (challenge: H2HChallenge) => {
    setSelectedChallenge(challenge)
    setShowSubmitModal(true)
  }
  
  if (!mounted) {
    return (
      <Card className={cn('bg-[#12151A] border-[#2A2F36]', className)}>
        <CardContent className="p-6 flex items-center justify-center min-h-[200px]">
          <div className="w-6 h-6 border-2 border-[#C1121F] border-t-transparent rounded-full animate-spin" />
        </CardContent>
      </Card>
    )
  }
  
  if (compact) {
    return (
      <Card className={cn('bg-[#12151A] border-[#2A2F36]', className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Swords className="w-5 h-5 text-[#C1121F]" />
              <CardTitle className="text-lg">Head-to-Head</CardTitle>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowCreateModal(true)}
              className="text-[#C1121F] hover:text-[#C1121F] hover:bg-[#C1121F]/10"
            >
              <Plus className="w-4 h-4 mr-1" />
              Challenge
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 rounded-lg bg-[#1A1F26]">
              <p className="text-xl font-bold text-[#E6E9EF]">{stats?.wins || 0}</p>
              <p className="text-[10px] text-[#6B7280]">Wins</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-[#1A1F26]">
              <p className="text-xl font-bold text-[#E6E9EF]">{stats?.totalChallenges || 0}</p>
              <p className="text-[10px] text-[#6B7280]">Battles</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-[#1A1F26]">
              <p className="text-xl font-bold text-amber-400">+{stats?.totalRewards || 0}</p>
              <p className="text-[10px] text-[#6B7280]">Score</p>
            </div>
          </div>
          
          {/* Pending challenges */}
          {pendingForMe.length > 0 && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <p className="text-sm font-medium text-amber-400 mb-2">
                {pendingForMe.length} Challenge{pendingForMe.length > 1 ? 's' : ''} Waiting
              </p>
              <Button
                size="sm"
                className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                onClick={() => handleAcceptChallenge(pendingForMe[0].id)}
              >
                View & Accept
              </Button>
            </div>
          )}
          
          {/* Active pool rank */}
          {stats?.currentPoolRank && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#1A1F26]">
              <div className="flex items-center gap-2">
                <Medal className="w-4 h-4 text-amber-400" />
                <span className="text-sm text-[#A4ACB8]">Weekly Pool Rank</span>
              </div>
              <span className="text-lg font-bold text-[#E6E9EF]">#{stats.currentPoolRank}</span>
            </div>
          )}
          
          {/* Empty state */}
          {activeChallenges.length === 0 && myPools.length === 0 && pendingForMe.length === 0 && (
            <div className="text-center py-4">
              <Swords className="w-8 h-8 text-[#3A3F46] mx-auto mb-2" />
              <p className="text-sm text-[#6B7280]">No active battles</p>
              <p className="text-xs text-[#4A4F56]">Challenge a friend or join a weekly pool</p>
            </div>
          )}
        </CardContent>
        
        <CreateChallengeModal 
          open={showCreateModal} 
          onClose={() => {
            setShowCreateModal(false)
            refreshData()
          }}
        />
      </Card>
    )
  }
  
  return (
    <div className={cn('space-y-6', className)}>
      {/* Header with stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#E6E9EF] flex items-center gap-2">
            <Swords className="w-6 h-6 text-[#C1121F]" />
            Head-to-Head
          </h1>
          <p className="text-[#A4ACB8] mt-1">
            Compete against friends or join weekly skill-matched pools
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-[#C1121F] hover:bg-[#A30F1A] text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Challenge
        </Button>
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-[#12151A] border-[#2A2F36]">
          <CardContent className="p-4 text-center">
            <Trophy className="w-5 h-5 text-amber-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-[#E6E9EF]">{stats?.wins || 0}</p>
            <p className="text-xs text-[#6B7280]">Wins</p>
          </CardContent>
        </Card>
        <Card className="bg-[#12151A] border-[#2A2F36]">
          <CardContent className="p-4 text-center">
            <Target className="w-5 h-5 text-[#C1121F] mx-auto mb-1" />
            <p className="text-2xl font-bold text-[#E6E9EF]">{stats?.totalChallenges || 0}</p>
            <p className="text-xs text-[#6B7280]">Total Battles</p>
          </CardContent>
        </Card>
        <Card className="bg-[#12151A] border-[#2A2F36]">
          <CardContent className="p-4 text-center">
            <Medal className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-[#E6E9EF]">{stats?.winRate || 0}%</p>
            <p className="text-xs text-[#6B7280]">Win Rate</p>
          </CardContent>
        </Card>
        <Card className="bg-[#12151A] border-[#2A2F36]">
          <CardContent className="p-4 text-center">
            <Crown className={cn('w-5 h-5 mx-auto mb-1', getTierColor(userTier))} />
            <p className="text-2xl font-bold text-[#E6E9EF] capitalize">{userTier}</p>
            <p className="text-xs text-[#6B7280]">Your Tier</p>
          </CardContent>
        </Card>
        <Card className="bg-[#12151A] border-[#2A2F36]">
          <CardContent className="p-4 text-center">
            <Swords className="w-5 h-5 text-purple-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-amber-400">+{stats?.totalRewards || 0}</p>
            <p className="text-xs text-[#6B7280]">Score Earned</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Pending Challenges Alert */}
      {pendingForMe.length > 0 && (
        <Card className="bg-amber-500/10 border-amber-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Swords className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="font-medium text-amber-400">
                    You have {pendingForMe.length} challenge{pendingForMe.length > 1 ? 's' : ''} waiting!
                  </p>
                  <p className="text-sm text-amber-400/70">
                    {pendingForMe[0].creatorName} challenged you to {H2H_CHALLENGE_CONFIGS[pendingForMe[0].challengeType].shortName}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDeclineChallenge(pendingForMe[0].id)}
                  className="text-[#6B7280] hover:text-[#E6E9EF]"
                >
                  <X className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleAcceptChallenge(pendingForMe[0].id)}
                  className="bg-amber-500 hover:bg-amber-600 text-white"
                >
                  <Check className="w-4 h-4 mr-1" />
                  Accept
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList className="bg-[#12151A] border border-[#2A2F36]">
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="pools">Weekly Pools</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        
        {/* Active Challenges */}
        <TabsContent value="active" className="space-y-4">
          {activeChallenges.length === 0 ? (
            <EmptyState
              icon={<Swords className="w-12 h-12 text-[#3A3F46]" />}
              title="No Active Challenges"
              description="Challenge a friend to compete or join a weekly pool to start battling."
              action={
                <Button onClick={() => setShowCreateModal(true)} className="bg-[#C1121F] hover:bg-[#A30F1A]">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Challenge
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {activeChallenges.map(challenge => (
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  onSubmitScore={() => handleSubmitScore(challenge)}
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* Weekly Pools */}
        <TabsContent value="pools" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Available pools to join */}
            {Object.entries(H2H_CHALLENGE_CONFIGS)
              .filter(([, config]) => config.poolEligible)
              .map(([type, config]) => {
                const existingPool = myPools.find(p => p.challengeType === type)
                return (
                  <PoolCard
                    key={type}
                    challengeType={type as H2HChallengeType}
                    config={config}
                    userTier={userTier}
                    joined={!!existingPool}
                    pool={existingPool}
                    onJoin={() => handleJoinPool(type as H2HChallengeType)}
                  />
                )
              })
            }
          </div>
        </TabsContent>
        
        {/* History */}
        <TabsContent value="history" className="space-y-4">
          {recentResults.length === 0 ? (
            <EmptyState
              icon={<Trophy className="w-12 h-12 text-[#3A3F46]" />}
              title="No Battle History"
              description="Complete challenges to see your results here."
            />
          ) : (
            <div className="space-y-3">
              {recentResults.map(challenge => (
                <ResultCard key={challenge.id} challenge={challenge} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      <CreateChallengeModal 
        open={showCreateModal} 
        onClose={() => {
          setShowCreateModal(false)
          refreshData()
        }}
      />
      
      {selectedChallenge && (
        <SubmitScoreModal
          open={showSubmitModal}
          challenge={selectedChallenge}
          onClose={() => {
            setShowSubmitModal(false)
            setSelectedChallenge(null)
            refreshData()
          }}
        />
      )}
    </div>
  )
}

// Helper components
function getTierColor(tier: string): string {
  switch (tier) {
    case 'diamond': return 'text-cyan-400'
    case 'platinum': return 'text-purple-400'
    case 'gold': return 'text-amber-400'
    case 'silver': return 'text-gray-300'
    default: return 'text-orange-400'
  }
}

function EmptyState({ 
  icon, 
  title, 
  description, 
  action 
}: { 
  icon: React.ReactNode
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <Card className="bg-[#12151A] border-[#2A2F36]">
      <CardContent className="py-12 text-center">
        <div className="flex justify-center mb-4">{icon}</div>
        <h3 className="text-lg font-semibold text-[#E6E9EF] mb-2">{title}</h3>
        <p className="text-sm text-[#6B7280] mb-4 max-w-sm mx-auto">{description}</p>
        {action}
      </CardContent>
    </Card>
  )
}

function ChallengeCard({ 
  challenge, 
  onSubmitScore 
}: { 
  challenge: H2HChallenge
  onSubmitScore: () => void
}) {
  const config = H2H_CHALLENGE_CONFIGS[challenge.challengeType]
  const user = getCurrentUser()
  const isCreator = challenge.creatorId === user.id
  const myScore = isCreator ? challenge.creatorScore : challenge.opponentScore
  const hasSubmitted = myScore !== undefined
  
  return (
    <Card className="bg-[#12151A] border-[#2A2F36]">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <Badge variant="outline" className="text-[#C1121F] border-[#C1121F]/30 mb-2">
              {challenge.matchType === 'friend' ? 'Friend Challenge' : 'Pool Match'}
            </Badge>
            <h3 className="font-semibold text-[#E6E9EF]">{config.name}</h3>
            <p className="text-sm text-[#6B7280]">{config.description}</p>
          </div>
          {config.timeLimit && (
            <div className="flex items-center gap-1 text-[#6B7280]">
              <Clock className="w-4 h-4" />
              <span className="text-sm">{config.timeLimit}s</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between p-3 rounded-lg bg-[#1A1F26] mb-3">
          <div className="text-center flex-1">
            <p className="text-xs text-[#6B7280]">You</p>
            <p className="text-lg font-bold text-[#E6E9EF]">
              {myScore !== undefined ? `${myScore} ${config.unit}` : '--'}
            </p>
          </div>
          <div className="px-3">
            <span className="text-xl font-bold text-[#4A4F56]">vs</span>
          </div>
          <div className="text-center flex-1">
            <p className="text-xs text-[#6B7280]">{isCreator ? challenge.opponentName : challenge.creatorName}</p>
            <p className="text-lg font-bold text-[#E6E9EF]">
              {(isCreator ? challenge.opponentScore : challenge.creatorScore) !== undefined 
                ? `${isCreator ? challenge.opponentScore : challenge.creatorScore} ${config.unit}` 
                : '--'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="text-xs text-[#6B7280]">
            Reward: <span className="text-amber-400">+{challenge.winnerReward} pts</span>
          </div>
          {!hasSubmitted && challenge.status === 'active' && (
            <Button size="sm" onClick={onSubmitScore} className="bg-[#C1121F] hover:bg-[#A30F1A]">
              Submit Score
            </Button>
          )}
          {hasSubmitted && (
            <Badge className="bg-emerald-500/20 text-emerald-400">Score Submitted</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function PoolCard({ 
  challengeType,
  config, 
  userTier,
  joined,
  pool,
  onJoin,
}: { 
  challengeType: H2HChallengeType
  config: typeof H2H_CHALLENGE_CONFIGS[H2HChallengeType]
  userTier: string
  joined: boolean
  pool?: WeeklyPool
  onJoin: () => void
}) {
  const standings = pool ? getPoolStandings(pool.id) : []
  const user = getCurrentUser()
  const myStanding = standings.find(s => s.userId === user.id)
  
  return (
    <Card className={cn(
      'bg-[#12151A] border-[#2A2F36]',
      joined && 'border-[#C1121F]/50'
    )}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-[#E6E9EF]">{config.shortName}</h3>
          <Badge className={cn('capitalize', getTierColor(userTier))}>
            {userTier} Tier
          </Badge>
        </div>
        
        <p className="text-sm text-[#6B7280] mb-3">{config.description}</p>
        
        {joined && myStanding ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 rounded-lg bg-[#1A1F26]">
              <span className="text-sm text-[#A4ACB8]">Your Rank</span>
              <span className="font-bold text-[#E6E9EF]">#{myStanding.rank || '-'}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-[#1A1F26]">
              <span className="text-sm text-[#A4ACB8]">Your Score</span>
              <span className="font-bold text-[#E6E9EF]">{myStanding.currentValue} {config.unit}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-[#1A1F26]">
              <span className="text-sm text-[#A4ACB8]">Participants</span>
              <span className="font-bold text-[#E6E9EF]">{standings.length}</span>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#6B7280]">Win Reward</span>
              <span className="text-amber-400">+{config.winnerReward} pts</span>
            </div>
            <Button 
              onClick={onJoin} 
              className="w-full bg-[#C1121F] hover:bg-[#A30F1A]"
            >
              Join Weekly Pool
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ResultCard({ challenge }: { challenge: H2HChallenge }) {
  const config = H2H_CHALLENGE_CONFIGS[challenge.challengeType]
  const user = getCurrentUser()
  const isWinner = challenge.winnerId === user.id
  const isDraw = challenge.isDraw
  
  return (
    <Card className="bg-[#12151A] border-[#2A2F36]">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center',
              isWinner ? 'bg-emerald-500/20' : isDraw ? 'bg-amber-500/20' : 'bg-[#1A1F26]'
            )}>
              {isWinner ? (
                <Trophy className="w-5 h-5 text-emerald-400" />
              ) : isDraw ? (
                <Medal className="w-5 h-5 text-amber-400" />
              ) : (
                <X className="w-5 h-5 text-[#6B7280]" />
              )}
            </div>
            <div>
              <p className="font-medium text-[#E6E9EF]">{config.shortName}</p>
              <p className="text-sm text-[#6B7280]">
                vs {challenge.creatorId === user.id ? challenge.opponentName : challenge.creatorName}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className={cn(
              'font-semibold',
              isWinner ? 'text-emerald-400' : isDraw ? 'text-amber-400' : 'text-[#6B7280]'
            )}>
              {isWinner ? 'Won' : isDraw ? 'Draw' : 'Lost'}
            </p>
            <p className="text-sm text-[#6B7280]">
              {challenge.creatorScore} - {challenge.opponentScore}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
