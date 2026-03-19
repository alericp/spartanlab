'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Clock,
  Battery,
  BatteryLow,
  BatteryMedium,
  Play,
} from 'lucide-react'
import Link from 'next/link'
import { type AdaptiveSession } from '@/lib/adaptive-program-builder'
import { getProgramState } from '@/lib/program-state'
import {
  calculateSessionAdjustment,
  inferWellnessFromRecovery,
  type WellnessState,
  type SessionAdjustment,
} from '@/lib/daily-adjustment-engine'
import { InsightExplanation, generateAdjustmentExplanation } from '@/components/shared/InsightExplanation'
import { AdaptiveEngineBadge, ENGINE_MESSAGES } from '@/components/shared/AdaptiveEngineBadge'
import { useIsPremium, PremiumFeatureLockCard, ProBadge } from '@/components/premium/PremiumFeature'

export function TodayAdjustmentWidget() {
  const [currentSession, setCurrentSession] = useState<AdaptiveSession | null>(null)
  const [adjustment, setAdjustment] = useState<SessionAdjustment | null>(null)
  const [wellnessState, setWellnessState] = useState<WellnessState>('normal')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Use safe unified program state
    const { adaptiveProgram, hasUsableWorkoutProgram } = getProgramState()
    if (!hasUsableWorkoutProgram || !adaptiveProgram) {
      setCurrentSession(null)
      return
    }
    const program = adaptiveProgram
    
    // Safety: Validate sessions array exists
    if (!Array.isArray(program.sessions) || program.sessions.length === 0) {
      console.log('[TodayAdjustmentWidget] No sessions array')
      setCurrentSession(null)
      return
    }
    
    // Get today's session
    const today = new Date().getDay()
    const sessionIdx = Math.min(today === 0 ? 6 : today - 1, program.sessions.length - 1)
    const session = program.sessions[sessionIdx] || program.sessions[0]
    
    // Safety: Validate session object and exercises array
    if (!session || typeof session !== 'object' || !Array.isArray(session.exercises)) {
      console.log('[TodayAdjustmentWidget] Invalid session structure')
      setCurrentSession(null)
      return
    }
    
    setCurrentSession(session)
    
    // Infer wellness
    const inferredWellness = inferWellnessFromRecovery()
    setWellnessState(inferredWellness)
    
    // Calculate adjustment with safe defaults
    const estimatedMinutes = typeof session.estimatedMinutes === 'number' ? session.estimatedMinutes : 45
    const adj = calculateSessionAdjustment(session, {
      wellnessState: inferredWellness,
      availableMinutes: estimatedMinutes,
      plannedMinutes: estimatedMinutes,
    })
    setAdjustment(adj)
  }, [])

  if (!mounted) return null
  
  // No program state
  if (!currentSession) {
    return (
      <Card className="bg-[#1A1F26] border-[#2B313A] p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-[#6B7280] uppercase tracking-wider mb-1">Today&apos;s Session</p>
            <p className="font-semibold text-[#A4ACB8]">No Active Program</p>
          </div>
          <Link href="/program">
            <Button size="sm" className="bg-[#C1121F] hover:bg-[#A30F1A] text-white">
              Create
            </Button>
          </Link>
        </div>
      </Card>
    )
  }

  return (
    <Card className="bg-[#1A1F26] border-[#2B313A] p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <WellnessIcon state={wellnessState} />
            <p className="text-xs text-[#6B7280] uppercase tracking-wider">Today&apos;s Session</p>
            <ProBadge size="sm" />
          </div>
          
          <p className="font-bold text-lg text-[#E6E9EF] mb-1">{currentSession.focusLabel || 'Today\'s Session'}</p>
          
          <div className="flex items-center gap-3 text-sm text-[#6B7280]">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              ~{typeof currentSession.estimatedMinutes === 'number' ? currentSession.estimatedMinutes : 45} min
            </span>
            <span>{Array.isArray(currentSession.exercises) ? currentSession.exercises.length : 0} exercises</span>
          </div>
          
          {adjustment?.wasAdjusted && (
            <div className="mt-3 p-2 rounded bg-amber-500/10 border border-amber-500/20">
              <p className="text-xs text-amber-400">
                {adjustment.label}: {adjustment.whatToCut.length > 0 ? `${adjustment.whatToCut.length} exercises can be cut if needed` : 'Volume adjusted based on state'}
              </p>
            </div>
          )}
        </div>
        
        <div className="shrink-0">
          <Link href="/today">
            <Button className="bg-[#C1121F] hover:bg-[#A30F1A] text-white">
              <Play className="w-4 h-4 mr-1.5" />
              Start
            </Button>
          </Link>
        </div>
      </div>

      {/* Explanation Layer */}
      <InsightExplanation
        explanation={generateAdjustmentExplanation(
          wellnessState,
          adjustment?.wasAdjusted ?? false,
          adjustment?.adjustmentPercent
        )}
        variant="bordered"
        className="mt-4"
      />

      {/* Engine Branding */}
      <div className="mt-3 pt-3 border-t border-[#2B313A]/50">
        <AdaptiveEngineBadge variant="minimal" message={ENGINE_MESSAGES.adjustment} />
      </div>
    </Card>
  )
}

function WellnessIcon({ state }: { state: WellnessState }) {
  switch (state) {
    case 'fresh':
      return <Battery className="w-4 h-4 text-green-400" />
    case 'normal':
      return <BatteryMedium className="w-4 h-4 text-amber-400" />
    case 'fatigued':
      return <BatteryLow className="w-4 h-4 text-orange-400" />
  }
}
