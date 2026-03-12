'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Navigation } from '@/components/shared/Navigation'
import { SkillSessionLogger } from '@/components/skills/SkillSessionLogger'
import { SkillSessionHistory } from '@/components/skills/SkillSessionHistory'
import { SkillReadinessCard } from '@/components/skills/SkillReadinessCard'
import { SkillEmptyState } from '@/components/skills/SkillEmptyState'
import {
  TrendingUp,
  Target,
  Activity,
  Clock,
  Crown,
} from 'lucide-react'
import Link from 'next/link'
import { hasProAccess } from '@/lib/feature-access'
import { PageHeader } from '@/components/shared/PageHeader'
import { SKILL_PROGRESSIONS, type EnhancedSkillDefinition } from '@/lib/skill-progression-rules'
import { getSkillSessions, getSessionsBySkill, seedSampleSessions } from '@/lib/skill-session-service'
import { generateSkillAnalysis } from '@/lib/skill-readiness-engine'
import { getStrengthRecords } from '@/lib/strength-service'
import { getAthleteProfile, saveSkillProgression, getSkillProgressions } from '@/lib/data-service'
import type { SkillAnalysis, SkillSession } from '@/types/skill-readiness'

type SkillKey = keyof typeof SKILL_PROGRESSIONS

export default function SkillsPage() {
  const [selectedSkill, setSelectedSkill] = useState<SkillKey | null>(null)
  const [currentLevel, setCurrentLevel] = useState<number>(0)
  const [targetLevel, setTargetLevel] = useState<number>(1)
  const [analysis, setAnalysis] = useState<SkillAnalysis | null>(null)
  const [sessions, setSessions] = useState<SkillSession[]>([])
  const [mounted, setMounted] = useState(false)
  const [saving, setSaving] = useState(false)

  // Load initial data
  useEffect(() => {
    setMounted(true)
    // Seed sample data for demo (only if no sessions exist)
    seedSampleSessions()
  }, [])

  // Load analysis when skill is selected
  const loadAnalysis = useCallback(() => {
    if (!selectedSkill) return
    
    const allSessions = getSkillSessions()
    const skillSessions = getSessionsBySkill(selectedSkill)
    const strengthRecords = getStrengthRecords()
    const profile = getAthleteProfile()
    
    setSessions(skillSessions)
    
    const newAnalysis = generateSkillAnalysis(
      allSessions,
      selectedSkill,
      currentLevel,
      targetLevel,
      strengthRecords,
      profile.bodyweight,
      profile.experienceLevel
    )
    
    setAnalysis(newAnalysis)
  }, [selectedSkill, currentLevel, targetLevel])

  useEffect(() => {
    if (selectedSkill) {
      loadAnalysis()
    }
  }, [selectedSkill, currentLevel, targetLevel, loadAnalysis])

  const handleSkillSelect = (skillKey: SkillKey) => {
    setSelectedSkill(skillKey)
    
    // Load existing progression if available
    const progressions = getSkillProgressions()
    const existing = progressions.find(p => p.skillName === skillKey)
    if (existing) {
      setCurrentLevel(existing.currentLevel)
      setTargetLevel(existing.targetLevel)
    } else {
      setCurrentLevel(0)
      setTargetLevel(1)
    }
  }

  const handleSaveProgression = () => {
    if (!selectedSkill) return
    setSaving(true)
    saveSkillProgression(selectedSkill, currentLevel, targetLevel)
    setTimeout(() => setSaving(false), 500)
  }

  const handleSessionSaved = () => {
    loadAnalysis()
  }

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

  const skillDef = selectedSkill ? SKILL_PROGRESSIONS[selectedSkill] : null

  return (
    <div className="min-h-screen bg-[#121212] text-[#F5F5F5]">
      <Navigation />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {!selectedSkill ? (
          <SkillSelectionView onSelect={handleSkillSelect} />
        ) : skillDef ? (
          <SkillDetailView
            skillKey={selectedSkill}
            skillDef={skillDef}
            currentLevel={currentLevel}
            targetLevel={targetLevel}
            analysis={analysis}
            sessions={sessions}
            saving={saving}
            onBack={() => setSelectedSkill(null)}
            onCurrentLevelChange={setCurrentLevel}
            onTargetLevelChange={setTargetLevel}
            onSaveProgression={handleSaveProgression}
            onSessionSaved={handleSessionSaved}
          />
        ) : null}
      </main>
    </div>
  )
}

// =============================================================================
// SKILL SELECTION VIEW
// =============================================================================

function SkillSelectionView({ onSelect }: { onSelect: (key: SkillKey) => void }) {
  const progressions = getSkillProgressions()
  const allSessions = getSkillSessions()
  
  const getSkillSummary = (skillKey: string) => {
    const prog = progressions.find(p => p.skillName === skillKey)
    const sessions = allSessions.filter(s => s.skillName === skillKey)
    const recentSessions = sessions.filter(s => {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return new Date(s.sessionDate) >= weekAgo
    })
    
    return {
      hasProgression: !!prog,
      currentLevel: prog?.currentLevel ?? 0,
      targetLevel: prog?.targetLevel ?? 1,
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
          const summary = getSkillSummary(key)
          
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

// =============================================================================
// SKILL DETAIL VIEW
// =============================================================================

interface SkillDetailViewProps {
  skillKey: SkillKey
  skillDef: EnhancedSkillDefinition
  currentLevel: number
  targetLevel: number
  analysis: SkillAnalysis | null
  sessions: SkillSession[]
  saving: boolean
  onBack: () => void
  onCurrentLevelChange: (level: number) => void
  onTargetLevelChange: (level: number) => void
  onSaveProgression: () => void
  onSessionSaved: () => void
}

function SkillDetailView({
  skillKey,
  skillDef,
  currentLevel,
  targetLevel,
  analysis,
  sessions,
  saving,
  onBack,
  onCurrentLevelChange,
  onTargetLevelChange,
  onSaveProgression,
  onSessionSaved,
}: SkillDetailViewProps) {
  const levelNames = skillDef.levels.map(l => l.name)
  const currentLevelDef = skillDef.levels[currentLevel]
  const hasSessionData = sessions.filter(s => s.level === currentLevel).length > 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-[#A5A5A5] hover:text-[#F5F5F5] mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to skills
          </button>
          <h2 className="text-3xl font-bold">{skillDef.name}</h2>
          <p className="text-[#A5A5A5]">{skillDef.description}</p>
        </div>
      </div>

      {/* Level Selection */}
      <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Current Level */}
          <div className="flex-1">
            <p className="text-sm text-[#A5A5A5] mb-3">Current Level</p>
            <div className="grid grid-cols-2 gap-2">
              {skillDef.levels.map((level, index) => (
                <Button
                  key={index}
                  variant={currentLevel === index ? 'default' : 'outline'}
                  size="sm"
                  className={
                    currentLevel === index
                      ? 'bg-[#E63946] hover:bg-[#D62828] text-white'
                      : 'border-[#3A3A3A] hover:bg-[#3A3A3A]'
                  }
                  onClick={() => {
                    onCurrentLevelChange(index)
                    if (index >= targetLevel) {
                      onTargetLevelChange(Math.min(index + 1, skillDef.levels.length - 1))
                    }
                  }}
                >
                  {level.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Target Level */}
          <div className="flex-1">
            <p className="text-sm text-[#A5A5A5] mb-3">Target Level</p>
            <div className="grid grid-cols-2 gap-2">
              {skillDef.levels.map((level, index) => (
                <Button
                  key={index}
                  variant={targetLevel === index ? 'default' : 'outline'}
                  size="sm"
                  disabled={index < currentLevel}
                  className={
                    targetLevel === index
                      ? 'bg-[#3A3A3A] border-[#E63946] text-[#E63946]'
                      : 'border-[#3A3A3A] hover:bg-[#3A3A3A] disabled:opacity-30'
                  }
                  onClick={() => onTargetLevelChange(index)}
                >
                  {level.name}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-[#3A3A3A]">
          <Button
            onClick={onSaveProgression}
            disabled={saving}
            className="bg-[#E63946] hover:bg-[#D62828]"
          >
            {saving ? 'Saving...' : 'Save Progression'}
          </Button>
        </div>
      </Card>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Column: Logging */}
        <div className="space-y-6">
          <SkillSessionLogger
            skillName={skillKey}
            levelName={currentLevelDef.name}
            levelIndex={currentLevel}
            onSessionSaved={onSessionSaved}
          />
          
          <SkillSessionHistory
            sessions={sessions.filter(s => s.level === currentLevel)}
            levelNames={levelNames}
            onSessionDeleted={onSessionSaved}
          />
        </div>

        {/* Right Column: Readiness Analysis */}
        <div className="space-y-6">
          {analysis && hasSessionData ? (
            <>
              <SkillReadinessCard
                analysis={analysis}
                levelName={currentLevelDef.name}
                targetLevelName={skillDef.levels[targetLevel].name}
              />
              {/* Pro upgrade hint for detailed progression */}
              {!hasProAccess() && (
                <Link href="/upgrade">
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-500/5 border border-amber-500/20 hover:bg-amber-500/10 transition-colors cursor-pointer">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                      <Crown className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#E6E9EF]">Unlock Skill Progression Intelligence</p>
                      <p className="text-xs text-[#6B7280]">See what is limiting your progress and when you will reach your next level</p>
                    </div>
                  </div>
                </Link>
              )}
            </>
          ) : (
            <SkillEmptyState type="no_sessions" skillName={skillDef.name} />
          )}
        </div>
      </div>

      {/* Level Requirements Info */}
      <Card className="bg-[#1A1A1A] border-[#3A3A3A] p-6">
        <h3 className="text-lg font-semibold mb-4">Level Requirements</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-[#A5A5A5] mb-1">Min Hold for Ownership</p>
            <p className="text-2xl font-bold">{currentLevelDef.minHoldForOwnership}s</p>
            <p className="text-xs text-[#5A5A5A]">4+ clean repeatable holds</p>
          </div>
          <div>
            <p className="text-sm text-[#A5A5A5] mb-1">Target Hold</p>
            <p className="text-2xl font-bold">{currentLevelDef.targetHold}s</p>
            <p className="text-xs text-[#5A5A5A]">Before progression</p>
          </div>
          <div>
            <p className="text-sm text-[#A5A5A5] mb-1">Support Exercise</p>
            <p className="text-lg font-bold">
              {skillDef.supportStrengthRequirements.primaryExercise.replace(/_/g, ' ')}
            </p>
            <p className="text-xs text-[#5A5A5A]">Primary strength indicator</p>
          </div>
          <div>
            <p className="text-sm text-[#A5A5A5] mb-1">Target Support 1RM</p>
            <p className="text-2xl font-bold">
              +{skillDef.supportStrengthRequirements.minOneRMPercent[currentLevel]}%
            </p>
            <p className="text-xs text-[#5A5A5A]">% of bodyweight added</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
