'use client'

import { Trophy, Info } from 'lucide-react'
import { PageContainer } from '@/components/layout'
import { LeaderboardTabs } from '@/components/leaderboards/LeaderboardTabs'

export default function LeaderboardPage() {
  return (
    <PageContainer>
        <div className="space-y-6 py-4">
          {/* Header */}
          <div className="px-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#E6E9EF]">Leaderboard</h1>
                <p className="text-sm text-[#A4ACB8]">Compete with fellow Spartans</p>
              </div>
            </div>
          </div>
          
          {/* Info banner - explains fair competition */}
          <div className="px-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-[#1A1F26] border border-[#2B313A]">
              <Info className="w-4 h-4 text-[#6B7280] mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="text-xs text-[#A4ACB8]">
                  <span className="font-medium">Weekly rankings</span> give everyone a fresh start each Monday.
                  <span className="font-medium"> Monthly rankings</span> reward consistent training.
                  <span className="font-medium"> All-time</span> celebrates long-term dedication.
                </p>
                <p className="text-xs text-[#6B7280]">
                  Every workout, achievement, and skill progression earns you Spartan Score.
                </p>
              </div>
            </div>
          </div>
          
          {/* Leaderboard tabs */}
          <div className="px-4">
            <LeaderboardTabs 
              defaultCategory="global_spartan_score"
              showAllCategories={true}
            />
          </div>
          
          {/* How scoring works */}
          <div className="px-4">
            <div className="bg-[#141820] rounded-xl border border-[#2B313A] p-4">
              <h3 className="font-semibold text-[#E6E9EF] mb-3">How Rankings Work</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                    1
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#E6E9EF]">Spartan Score</p>
                    <p className="text-xs text-[#6B7280]">
                      Your overall performance score combining strength (30%), skill mastery (30%), 
                      readiness (15%), consistency (15%), and achievements (10%).
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                    2
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#E6E9EF]">Consistency</p>
                    <p className="text-xs text-[#6B7280]">
                      Your current training streak. Log workouts regularly to maintain and extend your streak.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                    3
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#E6E9EF]">Skill Rankings</p>
                    <p className="text-xs text-[#6B7280]">
                      Your progression level in each skill. Advance through progressions to climb the skill-specific leaderboards.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageContainer>
  )
}
