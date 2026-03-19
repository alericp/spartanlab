'use client'

import { useState, useEffect } from 'react'
import { Navigation } from '@/components/shared/Navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Calendar,
  Check,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Zap,
  Clock,
} from 'lucide-react'
import Link from 'next/link'
import { type AdaptiveProgram } from '@/lib/adaptive-program-builder'
import { getProgramState } from '@/lib/program-state'
import {
  calculateWeekState,
  calculateWeekAdjustment,
  getQuickWeekStatus,
  type WeekAdjustment,
  type QuickWeekStatus,
} from '@/lib/week-reschedule-engine'
import { getWeekAdjustmentExplanation } from '@/lib/adjustment-explanation-engine'

export default function WeekAdjustmentPage() {
  const [program, setProgram] = useState<AdaptiveProgram | null>(null)
  const [weekAdjustment, setWeekAdjustment] = useState<WeekAdjustment | null>(null)
  const [weekStatus, setWeekStatus] = useState<QuickWeekStatus | null>(null)
  const [completedSessionIds, setCompletedSessionIds] = useState<string[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Use safe unified program state
    const { adaptiveProgram, hasUsableWorkoutProgram } = getProgramState()
    if (!hasUsableWorkoutProgram || !adaptiveProgram) return
    
    const prog = adaptiveProgram
    setProgram(prog)
    
    // In a real app, this would come from localStorage or a database
    const completed: string[] = []
    setCompletedSessionIds(completed)
    
    const state = calculateWeekState(prog, completed)
    const adjustment = calculateWeekAdjustment(prog, state)
    const status = getQuickWeekStatus(prog, completed)
    
    setWeekAdjustment(adjustment)
    setWeekStatus(status)
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

        {/* Main Content */}
        {program && weekStatus && weekAdjustment && (
          <div className="space-y-4">
            {/* Week Status Card */}
            <Card className={`border p-5 ${
              weekStatus.isOnTrack 
                ? 'bg-green-500/5 border-green-500/20' 
                : weekStatus.urgency === 'high'
                  ? 'bg-red-500/5 border-red-500/20'
                  : 'bg-yellow-500/5 border-yellow-500/20'
            }`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {weekStatus.isOnTrack ? (
                      <Check className="w-5 h-5 text-green-400" />
                    ) : (
                      <AlertTriangle className={`w-5 h-5 ${
                        weekStatus.urgency === 'high' ? 'text-red-400' : 'text-yellow-400'
                      }`} />
                    )}
                    <span className={`font-semibold ${
                      weekStatus.isOnTrack 
                        ? 'text-green-400' 
                        : weekStatus.urgency === 'high'
                          ? 'text-red-400'
                          : 'text-yellow-400'
                    }`}>
                      {weekStatus.isOnTrack ? 'On Track' : weekAdjustment.label}
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-4 text-center">
                  <div>
                    <p className="text-xl font-bold text-green-400">{weekStatus.completedCount}</p>
                    <p className="text-xs text-[#6A6A6A]">Done</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-[#A5A5A5]">{weekStatus.remainingCount}</p>
                    <p className="text-xs text-[#6A6A6A]">Remaining</p>
                  </div>
                  {weekStatus.missedCount > 0 && (
                    <div>
                      <p className="text-xl font-bold text-red-400">{weekStatus.missedCount}</p>
                      <p className="text-xs text-[#6A6A6A]">Missed</p>
                    </div>
                  )}
                </div>
              </div>
              
              <p className="text-sm text-[#A5A5A5]">
                {weekAdjustment.explanation}
              </p>
            </Card>

            {/* Adjustment Details */}
            {weekAdjustment.wasAdjusted && (
              <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-5">
                <h3 className="font-semibold mb-4">Week Adjustment</h3>
                
                {/* Preserved Sessions */}
                {weekAdjustment.priorityPreserved.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-[#6A6A6A] uppercase tracking-wider mb-2">Preserved Priority Sessions</p>
                    <div className="flex flex-wrap gap-2">
                      {weekAdjustment.priorityPreserved.map(session => (
                        <Badge key={session} className="bg-green-500/10 text-green-400 border-green-500/20">
                          {session}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Dropped Sessions */}
                {weekAdjustment.droppedSessions.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-[#6A6A6A] uppercase tracking-wider mb-2">Dropped This Week</p>
                    <div className="flex flex-wrap gap-2">
                      {weekAdjustment.droppedSessions.map(session => (
                        <Badge key={session} variant="outline" className="text-red-400 border-red-500/30">
                          {session}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Merged Sessions */}
                {weekAdjustment.mergedSessions.length > 0 && (
                  <div>
                    <p className="text-xs text-[#6A6A6A] uppercase tracking-wider mb-2">Merged Work</p>
                    {weekAdjustment.mergedSessions.map((merge, idx) => (
                      <div key={idx} className="p-3 rounded bg-[#1A1A1A] mb-2">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm text-[#A5A5A5]">{merge.from}</span>
                          <ChevronRight className="w-4 h-4 text-[#6A6A6A]" />
                          <span className="text-sm font-medium">{merge.into}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {merge.exercises.map(ex => (
                            <span key={ex} className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400">
                              {ex}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* Schedule View */}
            <Card className="bg-[#2A2A2A] border-[#3A3A3A] overflow-hidden">
              <div className="p-4 border-b border-[#3A3A3A]">
                <h3 className="font-semibold">
                  {weekAdjustment.wasAdjusted ? 'Adjusted Schedule' : 'Current Schedule'}
                </h3>
              </div>
              
              <div className="divide-y divide-[#3A3A3A]">
                {weekAdjustment.adjustedSchedule.map((session, idx) => (
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
                          <span className="font-medium">{session.focusLabel}</span>
                          {session.isPrimary && (
                            <Zap className="w-4 h-4 text-[#E63946]" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[#6A6A6A]">
                          <Clock className="w-3 h-3" />
                          <span>~{session.estimatedMinutes} min</span>
                          <span>•</span>
                          <span>{session.exercises.length} exercises</span>
                        </div>
                      </div>
                    </div>
                    
                    {completedSessionIds.includes(`${program.id}-day-${session.dayNumber}`) ? (
                      <Badge className="bg-green-500/10 text-green-400">
                        <Check className="w-3 h-3 mr-1" />
                        Done
                      </Badge>
                    ) : (
                      <ChevronRight className="w-5 h-5 text-[#6A6A6A]" />
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* Science Explanation */}
            <Card className="bg-[#1A1A1A] border-[#2A2A2A] p-4">
              <p className="text-xs text-[#6A6A6A] uppercase tracking-wider mb-2">Why This Approach</p>
              <p className="text-sm text-[#A5A5A5]">
                {getWeekAdjustmentExplanation(
                  weekAdjustment.type,
                  weekStatus.missedCount,
                  weekStatus.remainingCount
                ).scienceBasis}
              </p>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
