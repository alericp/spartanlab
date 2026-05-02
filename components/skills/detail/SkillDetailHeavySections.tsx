'use client'

/**
 * SkillDetailHeavySections - Heavy skill detail content
 * 
 * This file contains ALL heavy imports for the skill detail view.
 * It is dynamically imported ONLY when SKILL_DETAIL_SAFE_MODE is false.
 * This isolation prevents import-time crashes from affecting the skill detail shell.
 */

import { useState, useEffect, useCallback } from 'react'
import { SkillSessionLogger } from '@/components/skills/SkillSessionLogger'
import { SkillSessionHistory } from '@/components/skills/SkillSessionHistory'
import { SkillReadinessCard } from '@/components/skills/SkillReadinessCard'
import { SkillEmptyState } from '@/components/skills/SkillEmptyState'
import { SkillRoadmapDisplay } from '@/components/roadmap'
import { type SkillRoadmapType, SKILL_ROADMAPS } from '@/lib/roadmap/skill-roadmap-service'
import { Crown } from 'lucide-react'
import Link from 'next/link'
import { hasProAccess } from '@/lib/feature-access'
import { SKILL_PROGRESSIONS } from '@/lib/skill-progression-rules'
import { getSkillSessions, getSessionsBySkill } from '@/lib/skill-session-service'
import { generateSkillAnalysis } from '@/lib/skill-readiness-engine'
import { getStrengthRecords } from '@/lib/strength-service'
import { getAthleteProfile } from '@/lib/data-service'
import type { SkillAnalysis, SkillSession } from '@/types/skill-readiness'

type SkillKey = keyof typeof SKILL_PROGRESSIONS

interface SkillDetailHeavySectionsProps {
  skillKey: SkillKey
  currentLevel: number
  targetLevel: number
  onLevelChange: (current: number, target: number) => void
}

export function SkillDetailHeavySections({
  skillKey,
  currentLevel,
  targetLevel,
  onLevelChange,
}: SkillDetailHeavySectionsProps) {
  const [analysis, setAnalysis] = useState<SkillAnalysis | null>(null)
  const [sessions, setSessions] = useState<SkillSession[]>([])

  const skillDef = SKILL_PROGRESSIONS[skillKey]

  // Safely clamp level indices
  const maxLevel = skillDef.levels.length - 1
  const safeCurrentLevel = Math.max(0, Math.min(currentLevel, maxLevel))
  const safeTargetLevel = Math.max(0, Math.min(targetLevel, maxLevel))
  
  const levelNames = skillDef.levels.map(l => l.name)
  const currentLevelDef = skillDef.levels[safeCurrentLevel]
  const targetLevelDef = skillDef.levels[safeTargetLevel]

  // Load analysis when skill/levels change
  const loadAnalysis = useCallback(() => {
    try {
      const allSessions = getSkillSessions()
      const skillSessions = getSessionsBySkill(skillKey)
      const strengthRecords = getStrengthRecords()
      // [PATTERN-BANK / NULLABILITY-OPTIONAL-OBJECT-DRIFT]
      // `getAthleteProfile()` returns `AthleteProfile | null` (it returns null
      // when running outside the browser, before storage is populated, or if
      // the stored payload fails to parse). `generateSkillAnalysis` already
      // accepts honestly optional inputs at this exact boundary:
      //   - bodyweight: number | null
      //   - experienceLevel: string = 'intermediate' (defaulted, so undefined
      //     is accepted and the canonical 'intermediate' default applies)
      // We therefore derive safe typed locals via optional chaining and pass
      // them through unchanged. No fake bodyweight, no fake experience level,
      // no `profile!`, no `as any`.
      const profile = getAthleteProfile()
      const bodyweight: number | null = profile?.bodyweight ?? null
      const experienceLevel: string | undefined = profile?.experienceLevel

      setSessions(skillSessions)

      const newAnalysis = generateSkillAnalysis(
        allSessions,
        skillKey,
        safeCurrentLevel,
        safeTargetLevel,
        strengthRecords,
        bodyweight,
        experienceLevel
      )
      
      setAnalysis(newAnalysis)
    } catch (error) {
      console.error('[v0] SkillDetailHeavySections loadAnalysis error:', error)
    }
  }, [skillKey, safeCurrentLevel, safeTargetLevel])

  useEffect(() => {
    loadAnalysis()
  }, [loadAnalysis])

  const handleSessionSaved = () => {
    loadAnalysis()
  }

  const hasSessionData = sessions.filter(s => s.level === safeCurrentLevel).length > 0

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Left Column: Logging */}
      <div className="space-y-6">
        <SkillSessionLogger
          skillName={skillKey}
          levelName={currentLevelDef?.name ?? 'Unknown'}
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
              levelName={currentLevelDef?.name ?? 'Unknown'}
              targetLevelName={targetLevelDef?.name ?? 'Unknown'}
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
                  const newTarget = level >= targetLevel 
                    ? Math.min(level + 1, skillDef.levels.length - 1)
                    : targetLevel
                  onLevelChange(level, newTarget)
                }}
              />
            )
          }
          return null
        })()}
      </div>
    </div>
  )
}
