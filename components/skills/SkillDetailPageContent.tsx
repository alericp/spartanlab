'use client'

/**
 * SkillDetailPageContent - Lightweight skill detail shell
 * 
 * This file contains ONLY lightweight imports for the skill detail shell.
 * Heavy detail sections are dynamically imported via next/dynamic.
 * This isolation prevents import-time crashes from affecting the detail shell.
 */

// =============================================================================
// DETAIL VIEW SAFE MODE FLAG
// Set to true to render only the lightweight shell without heavy components
// When true: NO heavy imports are loaded at all (true import isolation)
// When false: Heavy sections are dynamically loaded via next/dynamic
// =============================================================================
const SKILL_DETAIL_SAFE_MODE = true

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import { SKILL_PROGRESSIONS } from '@/lib/skill-progression-rules'
import { saveSkillProgression, getSkillProgressions } from '@/lib/data-service'

// Dynamically import heavy sections ONLY when safe mode is disabled
const SkillDetailHeavySections = dynamic(
  () => import('@/components/skills/detail/SkillDetailHeavySections').then(mod => mod.SkillDetailHeavySections),
  { 
    ssr: false,
    loading: () => (
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card className="bg-[#1A1A1A] border-[#3A3A3A] p-6 animate-pulse">
            <div className="h-6 bg-[#2A2A2A] rounded w-1/3 mb-4" />
            <div className="h-32 bg-[#2A2A2A] rounded" />
          </Card>
        </div>
        <div className="space-y-6">
          <Card className="bg-[#1A1A1A] border-[#3A3A3A] p-6 animate-pulse">
            <div className="h-6 bg-[#2A2A2A] rounded w-1/2 mb-4" />
            <div className="h-48 bg-[#2A2A2A] rounded" />
          </Card>
        </div>
      </div>
    )
  }
)

type SkillKey = keyof typeof SKILL_PROGRESSIONS

interface SkillDetailPageContentProps {
  skillKey: SkillKey
  onBack: () => void
}

export function SkillDetailPageContent({ skillKey, onBack }: SkillDetailPageContentProps) {
  const [currentLevel, setCurrentLevel] = useState<number>(0)
  const [targetLevel, setTargetLevel] = useState<number>(1)
  const [saving, setSaving] = useState(false)

  const skillDef = SKILL_PROGRESSIONS[skillKey]

  // Safely get max level
  const maxLevel = skillDef?.levels?.length ? skillDef.levels.length - 1 : 0

  // Load existing progression on mount
  useEffect(() => {
    try {
      const progressions = getSkillProgressions()
      const existing = progressions.find(p => p.skillName === skillKey)
      if (existing) {
        // Safely clamp level indices
        setCurrentLevel(Math.max(0, Math.min(existing.currentLevel, maxLevel)))
        setTargetLevel(Math.max(0, Math.min(existing.targetLevel, maxLevel)))
      }
    } catch (error) {
      console.error('[v0] Error loading progressions:', error)
    }
  }, [skillKey, maxLevel])

  const handleSaveProgression = () => {
    setSaving(true)
    try {
      saveSkillProgression(skillKey, currentLevel, targetLevel)
    } catch (error) {
      console.error('[v0] Error saving progression:', error)
    }
    setTimeout(() => setSaving(false), 500)
  }

  const handleLevelChange = (current: number, target: number) => {
    setCurrentLevel(current)
    setTargetLevel(target)
  }

  // Safely clamp level indices for rendering
  const safeCurrentLevel = Math.max(0, Math.min(currentLevel, maxLevel))
  const safeTargetLevel = Math.max(0, Math.min(targetLevel, maxLevel))
  const currentLevelDef = skillDef?.levels?.[safeCurrentLevel]

  // Guard against missing skill definition
  if (!skillDef || !skillDef.levels) {
    return (
      <div className="space-y-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[#A5A5A5] hover:text-[#F5F5F5] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to skills
        </button>
        <Card className="bg-[#1A1D23] border border-red-500/30 p-6 text-center">
          <p className="text-red-400">Skill definition not found for: {skillKey}</p>
        </Card>
      </div>
    )
  }

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
                      setTargetLevel(Math.min(index + 1, maxLevel))
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

      {/* Heavy Detail Sections - ONLY loaded when safe mode is false */}
      {!SKILL_DETAIL_SAFE_MODE && (
        <SkillDetailHeavySections
          skillKey={skillKey}
          currentLevel={safeCurrentLevel}
          targetLevel={safeTargetLevel}
          onLevelChange={handleLevelChange}
        />
      )}

      {/* Level Requirements Info - Lightweight, uses local skillDef only */}
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
