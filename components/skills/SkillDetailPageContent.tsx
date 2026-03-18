'use client'

/**
 * SkillDetailPageContent - Heavy skill detail implementation
 * 
 * This file contains ALL heavy imports for the skill detail view.
 * It is dynamically imported by the my-skills page ONLY when a skill is selected.
 * This isolation prevents import-time crashes from affecting the skill selection view.
 */

// =============================================================================
// DETAIL VIEW SAFE MODE FLAG
// Set to true to render only the lightweight shell without heavy components
// =============================================================================
const SKILL_DETAIL_SAFE_MODE = true

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { SkillSessionLogger } from '@/components/skills/SkillSessionLogger'
import { SkillSessionHistory } from '@/components/skills/SkillSessionHistory'
import { SkillReadinessCard } from '@/components/skills/SkillReadinessCard'
import { SkillEmptyState } from '@/components/skills/SkillEmptyState'
import { SkillRoadmapDisplay } from '@/components/roadmap'
import { type SkillRoadmapType, SKILL_ROADMAPS } from '@/lib/roadmap/skill-roadmap-service'
import { ArrowLeft, Crown } from 'lucide-react'
import Link from 'next/link'
import { hasProAccess } from '@/lib/feature-access'
import { SKILL_PROGRESSIONS, type EnhancedSkillDefinition } from '@/lib/skill-progression-rules'
import { getSkillSessions, getSessionsBySkill } from '@/lib/skill-session-service'
import { generateSkillAnalysis } from '@/lib/skill-readiness-engine'
import { getStrengthRecords } from '@/lib/strength-service'
import { getAthleteProfile, saveSkillProgression, getSkillProgressions } from '@/lib/data-service'
import type { SkillAnalysis, SkillSession } from '@/types/skill-readiness'

type SkillKey = keyof typeof SKILL_PROGRESSIONS

interface SkillDetailPageContentProps {
  skillKey: SkillKey
  onBack: () => void
}

export function SkillDetailPageContent({ skillKey, onBack }: SkillDetailPageContentProps) {
  const [currentLevel, setCurrentLevel] = useState<number>(0)
  const [targetLevel, setTargetLevel] = useState<number>(1)
  const [analysis, setAnalysis] = useState<SkillAnalysis | null>(null)
  const [sessions, setSessions] = useState<SkillSession[]>([])
  const [saving, setSaving] = useState(false)

  const skillDef = SKILL_PROGRESSIONS[skillKey]

  // Load existing progression on mount
  useEffect(() => {
    const progressions = getSkillProgressions()
    const existing = progressions.find(p => p.skillName === skillKey)
    if (existing) {
      // Safely clamp level indices
      const maxLevel = skillDef.levels.length - 1
      setCurrentLevel(Math.max(0, Math.min(existing.currentLevel, maxLevel)))
      setTargetLevel(Math.max(0, Math.min(existing.targetLevel, maxLevel)))
    }
  }, [skillKey, skillDef.levels.length])

  // Load analysis when skill/levels change - ONLY when not in safe mode
  const loadAnalysis = useCallback(() => {
    if (SKILL_DETAIL_SAFE_MODE) {
      // In safe mode, skip all heavy analysis/service calls
      return
    }
    
    const allSessions = getSkillSessions()
    const skillSessions = getSessionsBySkill(skillKey)
    const strengthRecords = getStrengthRecords()
    const profile = getAthleteProfile()
    
    setSessions(skillSessions)
    
    const newAnalysis = generateSkillAnalysis(
      allSessions,
      skillKey,
      currentLevel,
      targetLevel,
      strengthRecords,
      profile.bodyweight,
      profile.experienceLevel
    )
    
    setAnalysis(newAnalysis)
  }, [skillKey, currentLevel, targetLevel])

  useEffect(() => {
    if (!SKILL_DETAIL_SAFE_MODE) {
      loadAnalysis()
    }
  }, [loadAnalysis])

  const handleSaveProgression = () => {
    setSaving(true)
    saveSkillProgression(skillKey, currentLevel, targetLevel)
    setTimeout(() => setSaving(false), 500)
  }

  const handleSessionSaved = () => {
    loadAnalysis()
  }

  // Safely clamp level indices for rendering
  const maxLevel = skillDef.levels.length - 1
  const safeCurrentLevel = Math.max(0, Math.min(currentLevel, maxLevel))
  const safeTargetLevel = Math.max(0, Math.min(targetLevel, maxLevel))
  
  const levelNames = skillDef.levels.map(l => l.name)
  const currentLevelDef = skillDef.levels[safeCurrentLevel]
  const targetLevelDef = skillDef.levels[safeTargetLevel]
  const hasSessionData = sessions.filter(s => s.level === safeCurrentLevel).length > 0

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
                    setCurrentLevel(index)
                    if (index >= targetLevel) {
                      setTargetLevel(Math.min(index + 1, skillDef.levels.length - 1))
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
                  onClick={() => setTargetLevel(index)}
                >
                  {level.name}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-[#3A3A3A]">
          <Button
            onClick={handleSaveProgression}
            disabled={saving}
            className="bg-[#E63946] hover:bg-[#D62828]"
          >
            {saving ? 'Saving...' : 'Save Progression'}
          </Button>
        </div>
      </Card>

      {/* Safe Mode Confirmation */}
      {SKILL_DETAIL_SAFE_MODE && (
        <Card className="bg-[#1A1D23] border border-green-500/30 p-6 text-center">
          <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-green-500/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-[#E6E9EF] mb-1">Detail Shell Working</h3>
          <p className="text-sm text-[#6B7280]">
            Safe mode is active. The lightweight detail shell rendered successfully.
          </p>
          <p className="text-xs text-[#4B5563] mt-2 font-mono">
            SKILL_DETAIL_SAFE_MODE = true (set to false for full detail view)
          </p>
        </Card>
      )}

      {/* Main Content Grid - ONLY when not in safe mode */}
      {!SKILL_DETAIL_SAFE_MODE && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column: Logging */}
          <div className="space-y-6">
            <SkillSessionLogger
              skillName={skillKey}
              levelName={currentLevelDef.name}
              levelIndex={safeCurrentLevel}
              onSessionSaved={handleSessionSaved}
            />
            
            <SkillSessionHistory
              sessions={sessions.filter(s => s.level === safeCurrentLevel)}
              levelNames={levelNames}
              onSessionDeleted={handleSessionSaved}
            />
          </div>

          {/* Right Column: Readiness Analysis */}
          <div className="space-y-6">
            {analysis && hasSessionData ? (
              <>
                <SkillReadinessCard
                  analysis={analysis}
                  levelName={currentLevelDef.name}
                  targetLevelName={targetLevelDef.name}
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
            
            {/* Skill Roadmap - show if roadmap exists for this skill */}
            {(() => {
              // Map skill key to roadmap type
              const roadmapKeyMap: Record<string, SkillRoadmapType> = {
                'front_lever': 'front-lever',
                'frontLever': 'front-lever',
                'planche': 'planche',
                'muscle_up': 'muscle-up',
                'muscleUp': 'muscle-up',
                'hspu': 'hspu',
                'handstand_pushup': 'hspu',
              }
              const roadmapKey = roadmapKeyMap[skillKey]
              if (roadmapKey && SKILL_ROADMAPS[roadmapKey]) {
                return (
                  <SkillRoadmapDisplay 
                    skillKey={roadmapKey}
                    onLevelSelect={(level) => {
                      setCurrentLevel(level)
                      if (level >= targetLevel) {
                        setTargetLevel(Math.min(level + 1, skillDef.levels.length - 1))
                      }
                    }}
                  />
                )
              }
              return null
            })()}
          </div>
        </div>
      )}

      {/* Level Requirements Info */}
      {currentLevelDef && (
        <Card className="bg-[#1A1A1A] border-[#3A3A3A] p-6">
          <h3 className="text-lg font-semibold mb-4">Level Requirements</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-[#A5A5A5] mb-1">Min Hold for Ownership</p>
              <p className="text-2xl font-bold">{currentLevelDef.minHoldForOwnership ?? 0}s</p>
              <p className="text-xs text-[#5A5A5A]">4+ clean repeatable holds</p>
            </div>
            <div>
              <p className="text-sm text-[#A5A5A5] mb-1">Target Hold</p>
              <p className="text-2xl font-bold">{currentLevelDef.targetHold ?? 0}s</p>
              <p className="text-xs text-[#5A5A5A]">Before progression</p>
            </div>
            <div>
              <p className="text-sm text-[#A5A5A5] mb-1">Support Exercise</p>
              <p className="text-lg font-bold">
                {skillDef.supportStrengthRequirements?.primaryExercise?.replace(/_/g, ' ') ?? 'N/A'}
              </p>
              <p className="text-xs text-[#5A5A5A]">Primary strength indicator</p>
            </div>
            <div>
              <p className="text-sm text-[#A5A5A5] mb-1">Target Support 1RM</p>
              <p className="text-2xl font-bold">
                +{skillDef.supportStrengthRequirements?.minOneRMPercent?.[safeCurrentLevel] ?? 0}%
              </p>
              <p className="text-xs text-[#5A5A5A]">% of bodyweight added</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
