'use client'

import { useState, useEffect } from 'react'
import { Navigation } from '@/components/shared/Navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  Calendar,
  ChevronRight,
  Zap,
  Clock,
} from 'lucide-react'
import Link from 'next/link'
import { type AdaptiveProgram } from '@/lib/adaptive-program-builder'
import { getProgramState } from '@/lib/program-state'
import {
  COMPLETIONS_UNAVAILABLE_EXPLANATION,
  resolveSavedProgramGuidance,
  shouldInferMissedSessions,
} from '@/lib/program/training-experience-guidance'

export default function WeekAdjustmentPage() {
  const [program, setProgram] = useState<AdaptiveProgram | null>(null)
  const [mounted, setMounted] = useState(false)
  // This page does not load a completion record. Null means misses stay unknown.
  const recordedCompletionIds: readonly string[] | null = null

  useEffect(() => {
    setMounted(true)
    
    // Use safe unified program state
    const { adaptiveProgram, hasUsableWorkoutProgram } = getProgramState()
    if (!hasUsableWorkoutProgram || !adaptiveProgram) return
    
    const prog = adaptiveProgram
    
    // Safety: Validate sessions array before proceeding
    if (!Array.isArray(prog.sessions) || prog.sessions.length === 0) {
      console.log('[WeekPage] Program has no valid sessions array')
      return
    }
    
    setProgram(prog)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-[#6A6A6A]">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="text-[#6A6A6A] hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold">Week Overview</h1>
            <p className="text-sm text-[#6A6A6A]">
              {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - Week Progress
            </p>
          </div>
        </div>

        {/* No Program State */}
        {!program && (
          <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-8 text-center">
            <Calendar className="w-12 h-12 mx-auto text-[#3A3A3A] mb-4" />
            <h2 className="text-lg font-semibold mb-2">No Active Program</h2>
            <p className="text-[#6A6A6A] mb-4">
              Generate a training program to see your week overview.
            </p>
            <Link href="/program">
              <Button className="bg-[#E63946] hover:bg-[#D62828]">
                Create Program
              </Button>
            </Link>
          </Card>
        )}

        {/* Saved schedule. Completions are not loaded here, so misses are not inferred. */}
        {program && !shouldInferMissedSessions(recordedCompletionIds) && (
          <div className="space-y-4">
            {(() => {
              const guidance = resolveSavedProgramGuidance(program)
              return (
                <Card className="bg-[#1A1A1A] border-[#3A3A3A] p-5">
                  <p className="text-sm font-medium">{guidance.headline}</p>
                  <p className="text-sm text-[#A5A5A5] mt-1">{guidance.explanation}</p>
                  <p className="text-xs text-[#6A6A6A] mt-2">{guidance.savedScheduleLabel}</p>
                  <p className="text-sm text-[#A5A5A5] mt-3">{COMPLETIONS_UNAVAILABLE_EXPLANATION}</p>
                </Card>
              )
            })()}

            <Card className="bg-[#2A2A2A] border-[#3A3A3A] overflow-hidden">
              <div className="p-4 border-b border-[#3A3A3A]">
                <h3 className="font-semibold">Saved schedule</h3>
              </div>
              
              <div className="divide-y divide-[#3A3A3A]">
                {program.sessions.map((session, idx) => (
                  <div
                    key={session.dayNumber}
                    className="p-4 flex items-center justify-between hover:bg-[#333] transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-[#1A1A1A] flex items-center justify-center text-sm font-mono text-[#6A6A6A]">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{session.focusLabel || `Day ${idx + 1}`}</span>
                          {session.isPrimary && (
                            <Zap className="w-4 h-4 text-[#E63946]" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[#6A6A6A]">
                          <Clock className="w-3 h-3" />
                          <span>~{typeof session.estimatedMinutes === 'number' ? session.estimatedMinutes : 45} min</span>
                          <span>•</span>
                          <span>{Array.isArray(session.exercises) ? session.exercises.length : 0} exercises</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[#6A6A6A]" />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
