'use client'

import { Card } from '@/components/ui/card'
import { Trophy, Dumbbell, Target, Flame, Zap } from 'lucide-react'
import type { PRVault } from '@/lib/pr-vault-engine'

interface PRVaultSectionProps {
  vault: PRVault
}

export function PRVaultSection({ vault }: PRVaultSectionProps) {
  const hasSkillPRs = vault.skillPRs.some(p => p.hasData)
  const hasStrengthPRs = vault.strengthPRs.some(p => p.hasData)
  const hasTrainingPRs = vault.trainingPRs.some(p => p.hasData)
  const hasBarbellPRs = vault.barbellPRs?.some(p => p.hasData) ?? false
  const hasStreetliftingTotal = vault.streetliftingTotal?.hasData ?? false
  
  if (!hasSkillPRs && !hasStrengthPRs && !hasTrainingPRs && !hasBarbellPRs) {
    return (
      <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-[#1A1A1A] flex items-center justify-center">
            <Trophy className="w-5 h-5 text-[#E63946]" />
          </div>
          <h2 className="text-lg font-semibold">PR Vault</h2>
        </div>
        <p className="text-sm text-[#6A6A6A]">
          Log more sessions to unlock your personal records vault.
        </p>
      </Card>
    )
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-[#1A1A1A] flex items-center justify-center">
          <Trophy className="w-5 h-5 text-amber-500" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">PR Vault</h2>
          <p className="text-xs text-[#6A6A6A]">{vault.totalPRs} personal records tracked</p>
        </div>
      </div>
      
      {/* Skill PRs */}
      {hasSkillPRs && (
        <div className="grid gap-3 sm:grid-cols-2">
          {vault.skillPRs.filter(p => p.hasData).map(pr => (
            <Card 
              key={pr.skillName}
              className="bg-[#2A2A2A] border-[#3A3A3A] p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-[#E63946]" />
                  <span className="text-sm font-medium">{pr.skillLabel}</span>
                </div>
                <span className="text-xs text-[#6A6A6A]">{pr.bestLevelName}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{pr.bestHoldSeconds}s</span>
                <span className="text-xs text-[#6A6A6A]">best hold</span>
              </div>
              {pr.dateAchieved && (
                <p className="text-xs text-[#6A6A6A] mt-2">
                  {new Date(pr.dateAchieved).toLocaleDateString()}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
      
      {/* Weighted Calisthenics PRs */}
      {hasStrengthPRs && (
        <div className="grid gap-3 sm:grid-cols-3">
          {vault.strengthPRs.filter(p => p.hasData).map(pr => (
            <Card 
              key={pr.exercise}
              className="bg-[#2A2A2A] border-[#3A3A3A] p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <Dumbbell className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium">{pr.exerciseLabel}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">+{pr.bestWeightAdded}</span>
                <span className="text-xs text-[#6A6A6A]">x {pr.bestReps}</span>
              </div>
              <div className="flex items-center gap-3 mt-2 text-xs text-[#6A6A6A]">
                <span>1RM: {pr.bestOneRM}</span>
                {pr.relativeStrength && (
                  <span className="text-blue-400">{pr.relativeStrength}x BW</span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
      
      {/* Barbell PRs (Hybrid Strength) */}
      {hasBarbellPRs && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium text-[#AAAAAA]">Barbell Strength</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {vault.barbellPRs?.filter(p => p.hasData).map(pr => (
              <Card 
                key={pr.exercise}
                className="bg-[#2A2A2A] border-[#3A3A3A] p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Dumbbell className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-medium">{pr.exerciseLabel}</span>
                  </div>
                  <span className="text-xs text-[#6A6A6A]">{pr.variant}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{pr.bestWeight}</span>
                  <span className="text-xs text-[#6A6A6A]">kg x {pr.bestReps}</span>
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs text-[#6A6A6A]">
                  <span>Est. 1RM: {pr.estimated1RM}kg</span>
                  {pr.relativeStrength && (
                    <span className="text-amber-400">{pr.relativeStrength}x BW</span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
      
      {/* Streetlifting Total */}
      {hasStreetliftingTotal && vault.streetliftingTotal && (
        <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-4">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium">Streetlifting Total</span>
          </div>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-3xl font-bold">{vault.streetliftingTotal.total}</span>
            <span className="text-xs text-[#6A6A6A]">kg combined</span>
          </div>
          <div className="grid grid-cols-3 gap-3 text-xs text-[#6A6A6A]">
            <div>
              <span className="block text-[#AAAAAA]">W. Pull-Up</span>
              <span>{vault.streetliftingTotal.weightedPullUp1RM ?? '-'} kg</span>
            </div>
            <div>
              <span className="block text-[#AAAAAA]">W. Dip</span>
              <span>{vault.streetliftingTotal.weightedDip1RM ?? '-'} kg</span>
            </div>
            <div>
              <span className="block text-[#AAAAAA]">Deadlift</span>
              <span>{vault.streetliftingTotal.deadlift1RM ?? '-'} kg</span>
            </div>
          </div>
        </Card>
      )}
      
      {/* Training PRs */}
      {hasTrainingPRs && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {vault.trainingPRs.filter(p => p.hasData).map(pr => (
            <Card 
              key={pr.type}
              className="bg-[#2A2A2A] border-[#3A3A3A] p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-4 h-4 text-orange-400" />
                <span className="text-xs text-[#6A6A6A]">{pr.label}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold">{pr.value}</span>
                <span className="text-xs text-[#6A6A6A]">{pr.unit}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
