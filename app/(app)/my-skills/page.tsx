'use client'

/**
 * My Skills Page - Import-isolated skill tracking route
 * 
 * This file contains ONLY lightweight imports for the skill selection view.
 * The heavy detail view (SkillDetailPageContent) is dynamically imported
 * ONLY when a skill is selected, preventing import-time crashes from
 * affecting the skill selection grid.
 */

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Navigation } from '@/components/shared/Navigation'
import { Target } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { SKILL_PROGRESSIONS, type EnhancedSkillDefinition } from '@/lib/skill-progression-rules'
import { getSkillSessions, seedSampleSessions } from '@/lib/skill-session-service'
import { getSkillProgressions } from '@/lib/data-service'

type SkillKey = keyof typeof SKILL_PROGRESSIONS

// =============================================================================
// DYNAMIC IMPORT - Heavy detail view loaded only when needed
// =============================================================================

const SkillDetailPageContent = dynamic(
  () => import('@/components/skills/SkillDetailPageContent').then(mod => mod.SkillDetailPageContent),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-[#2A2A2A] rounded w-1/4"></div>
        <div className="h-32 bg-[#2A2A2A] rounded"></div>
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="h-64 bg-[#2A2A2A] rounded"></div>
          <div className="h-64 bg-[#2A2A2A] rounded"></div>
        </div>
      </div>
    ),
  }
)

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export default function SkillsPage() {
  const [selectedSkill, setSelectedSkill] = useState<SkillKey | null>(null)
  const [mounted, setMounted] = useState(false)

  // Load initial data
  useEffect(() => {
    setMounted(true)
    // Seed sample data for demo (only if no sessions exist)
    seedSampleSessions()
  }, [])

  // Loading state
  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#121212] text-[#F5F5F5]">
        <Navigation />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-10 bg-[#2A2A2A] rounded w-1/3"></div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="h-48 bg-[#2A2A2A] rounded"></div>
              <div className="h-48 bg-[#2A2A2A] rounded"></div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#121212] text-[#F5F5F5]">
      <Navigation />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {!selectedSkill ? (
          <SkillSelectionView onSelect={setSelectedSkill} />
        ) : (
          <SkillDetailPageContent
            skillKey={selectedSkill}
            onBack={() => setSelectedSkill(null)}
          />
        )}
      </main>
    </div>
  )
}

// =============================================================================
// SKILL SELECTION VIEW - Lightweight, no heavy imports
// =============================================================================

function SkillSelectionView({ onSelect }: { onSelect: (key: SkillKey) => void }) {
  const progressions = getSkillProgressions()
  const allSessions = getSkillSessions()
  
  const getSkillSummary = (skillKey: string, def: EnhancedSkillDefinition) => {
    const prog = progressions.find(p => p.skillName === skillKey)
    const sessions = allSessions.filter(s => s.skillName === skillKey)
    const recentSessions = sessions.filter(s => {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return new Date(s.sessionDate) >= weekAgo
    })
    
    // Safely clamp level indices to valid range
    const maxLevel = def.levels.length - 1
    const rawCurrentLevel = prog?.currentLevel ?? 0
    const rawTargetLevel = prog?.targetLevel ?? 1
    const safeCurrentLevel = Math.max(0, Math.min(rawCurrentLevel, maxLevel))
    const safeTargetLevel = Math.max(0, Math.min(rawTargetLevel, maxLevel))
    
    return {
      hasProgression: !!prog,
      currentLevel: safeCurrentLevel,
      targetLevel: safeTargetLevel < safeCurrentLevel ? Math.min(safeCurrentLevel + 1, maxLevel) : safeTargetLevel,
      progressScore: prog?.progressScore ?? 0,
      totalSessions: sessions.length,
      weeklyDensity: recentSessions.reduce((sum, s) => sum + s.sessionDensity, 0),
    }
  }

  return (
    <div>
      <PageHeader 
        title="Skill Progression"
        description="Track your skill work and get personalized readiness analysis"
        backHref="/dashboard"
        backLabel="Back to Dashboard"
        icon={<Target className="w-5 h-5" />}
      />
      
      <div className="grid md:grid-cols-2 gap-6">
        {Object.entries(SKILL_PROGRESSIONS).map(([key, def]) => {
          const summary = getSkillSummary(key, def)
          
          return (
            <Card
              key={key}
              className="bg-[#2A2A2A] border-[#3A3A3A] p-6 cursor-pointer hover:border-[#E63946] transition-colors"
              onClick={() => onSelect(key as SkillKey)}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold">{def.name}</h3>
                  <p className="text-[#A5A5A5] text-sm mt-1">{def.description}</p>
                </div>
                {summary.totalSessions > 0 && (
                  <div className="bg-[#E63946]/10 text-[#E63946] px-2 py-1 rounded text-xs font-medium">
                    {summary.totalSessions} sessions
                  </div>
                )}
              </div>

              {summary.hasProgression ? (
                <div className="space-y-3 pt-4 border-t border-[#3A3A3A]">
                  {/* Current and Target levels */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-2.5 rounded-lg bg-[#1A1A1A] border border-[#3A3A3A]/50">
                      <p className="text-xs text-[#5A5A5A] mb-0.5">Current</p>
                      <p className="text-sm font-semibold text-[#F5F5F5]">{def.levels[summary.currentLevel].name}</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#E63946]/5 border border-[#E63946]/20">
                      <p className="text-xs text-[#5A5A5A] mb-0.5">Target</p>
                      <p className="text-sm font-semibold text-[#E63946]">{def.levels[summary.targetLevel].name}</p>
                    </div>
                  </div>
                  
                  {/* Premium Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#5A5A5A]">Progress</span>
                      <span className="font-semibold text-[#E63946]">{Math.min(100, summary.progressScore)}%</span>
                    </div>
                    <div className="relative h-2.5 rounded-full bg-[#1A1A1A] overflow-hidden border border-[#3A3A3A]/30">
                      {/* Track texture */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#3A3A3A]/10 to-transparent" />
                      {/* Progress fill */}
                      <div
                        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#C1121F]/70 to-[#E63946] transition-all duration-500 ease-out"
                        style={{ width: `${Math.min(100, summary.progressScore)}%` }}
                      >
                        {/* Shine effect */}
                        <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-transparent rounded-full" />
                        {/* Pulse indicator */}
                        {summary.progressScore > 5 && (
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse shadow-lg shadow-[#E63946]/40" />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {summary.weeklyDensity > 0 && (
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-[#5A5A5A]">Weekly Training</span>
                      <span className="font-medium text-[#A5A5A5]">{summary.weeklyDensity}s density</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="pt-4 border-t border-[#3A3A3A]">
                  <div className="flex items-center gap-2 text-sm text-[#5A5A5A]">
                    <Target className="w-4 h-4 text-[#E63946]/50" />
                    <span>Not yet tracked — tap to begin</span>
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
