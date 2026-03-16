'use client'

import React, { useEffect, useState } from 'react'
import { SkillReadinessBars } from './SkillReadinessBars'
import type { SkillReadinessData } from '@/lib/readiness-service'

export interface SkillReadinessModuleProps {
  athleteId?: string
  skills?: ('front_lever' | 'planche' | 'hspu' | 'muscle_up' | 'l_sit')[]
}

const SKILL_CONFIG: Record<string, { label: string; components: string[] }> = {
  front_lever: {
    label: 'Front Lever',
    components: [
      'Pull Strength',
      'Compression',
      'Scapular Control',
      'Straight Arm Strength',
    ],
  },
  planche: {
    label: 'Planche',
    components: [
      'Push Strength',
      'Compression',
      'Anterior Shoulder',
      'Wrist Mobility',
    ],
  },
  hspu: {
    label: 'Handstand Push-up',
    components: ['Shoulder Strength', 'Core Stability', 'Balance', 'Wrist Strength'],
  },
  muscle_up: {
    label: 'Muscle-up',
    components: ['Pull Strength', 'Dip Strength', 'Transition', 'Body Control'],
  },
  l_sit: {
    label: 'L-sit',
    components: ['Hip Flexor Strength', 'Core Compression', 'Arm Strength', 'Mobility'],
  },
}

const COMPONENT_COLORS: Record<string, string> = {
  'Pull Strength': '#E63946',
  'Push Strength': '#E63946',
  'Compression': '#F77F00',
  'Scapular Control': '#06D6A0',
  'Straight Arm Strength': '#457B9D',
  'Anterior Shoulder': '#F77F00',
  'Wrist Mobility': '#A8DADC',
  'Shoulder Strength': '#E63946',
  'Core Stability': '#06D6A0',
  'Balance': '#FFD60A',
  'Wrist Strength': '#A8DADC',
  'Dip Strength': '#E63946',
  'Transition': '#F77F00',
  'Body Control': '#06D6A0',
  'Hip Flexor Strength': '#E63946',
  'Core Compression': '#F77F00',
  'Arm Strength': '#457B9D',
  'Mobility': '#A8DADC',
}

/**
 * Skill Readiness Module
 *
 * Displays readiness visualization for multiple skills.
 * Fetches readiness data from the backend and renders visual breakdowns.
 */
export function SkillReadinessModule({
  athleteId,
  skills = ['front_lever', 'planche', 'hspu', 'muscle_up', 'l_sit'],
}: SkillReadinessModuleProps) {
  const [readinessData, setReadinessData] = useState<Map<string, SkillReadinessData>>(
    new Map()
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!athleteId) {
      setLoading(false)
      return
    }

    const fetchReadiness = async () => {
      try {
        const response = await fetch(`/api/readiness?athleteId=${athleteId}`)
        if (!response.ok) throw new Error('Failed to fetch readiness')

        const data: SkillReadinessData[] = await response.json()
        const map = new Map(data.map((d) => [d.skill, d]))
        setReadinessData(map)
      } catch (err) {
        console.error('[SkillReadinessModule] Error fetching readiness:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchReadiness()
  }, [athleteId])

  if (!athleteId) {
    return (
      <div className="p-4 bg-[#0F0F0F] rounded-lg border border-[#2A2A2A] text-center text-[#A5A5A5]">
        No athlete data available
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {skills.map((skill) => (
          <div
            key={skill}
            className="h-48 bg-[#0F0F0F] rounded-lg border border-[#2A2A2A] animate-pulse"
          />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-[#1A1A1A] rounded-lg border border-[#E63946]/30 text-[#E63946]">
        Error loading readiness data: {error}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {skills.map((skill) => {
        const data = readinessData.get(skill)

        if (!data) {
          return (
            <div key={skill} className="p-4 bg-[#0F0F0F] rounded-lg border border-[#2A2A2A]">
              <p className="text-sm text-[#A5A5A5]">
                No readiness data for {SKILL_CONFIG[skill]?.label || skill}
              </p>
            </div>
          )
        }

        const config = SKILL_CONFIG[skill]
        const components = [
          { label: 'Pull Strength', score: data.pullStrengthScore },
          { label: 'Compression', score: data.compressionScore },
          { label: 'Scapular Control', score: data.scapularControlScore },
          { label: 'Straight Arm', score: data.straightArmScore },
        ].map((comp) => ({
          ...comp,
          color: COMPONENT_COLORS[comp.label] || '#457B9D',
        }))

        return (
          <SkillReadinessBars
            key={skill}
            skill={skill}
            readinessScore={data.readinessScore}
            components={components}
            limitingFactor={data.limitingFactor}
          />
        )
      })}
    </div>
  )
}
