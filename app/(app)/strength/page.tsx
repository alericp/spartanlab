'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Dumbbell, TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Navigation } from '@/components/shared/Navigation'
import { StrengthLogger } from '@/components/strength/StrengthLogger'
import { StrengthHistory } from '@/components/strength/StrengthHistory'
import { StrengthChart } from '@/components/strength/StrengthChart'
import { StrengthAnalysisCard } from '@/components/strength/StrengthAnalysisCard'
import { StrengthSupportPanel } from '@/components/strength/StrengthSupportPanel'
import { StrengthEmptyState } from '@/components/strength/StrengthEmptyState'
import {
  EXERCISE_DEFINITIONS,
  getRecordsByExercise,
  getStrengthRecords,
  type ExerciseType,
  type StrengthRecord,
} from '@/lib/strength-service'
import { getAthleteProfile, type AthleteProfile } from '@/lib/data-service'
import { 
  generateStrengthAnalysis, 
  type StrengthAnalysisSummary,
  getTierColor,
  getTrendStatusColor,
} from '@/lib/strength-guidance-engine'

export default function StrengthPage() {
  const [selectedExercise, setSelectedExercise] = useState<ExerciseType | null>(null)
  const [records, setRecords] = useState<StrengthRecord[]>([])
  const [allRecords, setAllRecords] = useState<StrengthRecord[]>([])
  const [profile, setProfile] = useState<AthleteProfile | null>(null)
  const [analysis, setAnalysis] = useState<StrengthAnalysisSummary | null>(null)
  const [mounted, setMounted] = useState(false)

  const loadData = useCallback(() => {
    const allRecs = getStrengthRecords()
    const prof = getAthleteProfile()
    
    setAllRecords(allRecs)
    setProfile(prof)
    setAnalysis(generateStrengthAnalysis(allRecs, prof))
    
    if (selectedExercise) {
      setRecords(getRecordsByExercise(selectedExercise))
    }
  }, [selectedExercise])

  useEffect(() => {
    setMounted(true)
    loadData()
  }, [loadData])

  useEffect(() => {
    if (selectedExercise) {
      setRecords(getRecordsByExercise(selectedExercise))
    }
  }, [selectedExercise])

  const handleRecordChange = () => {
    loadData()
  }

  const selectedExerciseDef = selectedExercise 
    ? EXERCISE_DEFINITIONS.find(e => e.id === selectedExercise) 
    : null

  const selectedAnalysis = selectedExercise && analysis
    ? analysis.exercises[selectedExercise]
    : null

  // Loading state
  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#121212] text-[#F5F5F5]">
        <Navigation />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-12 bg-[#2A2A2A] rounded w-1/3"></div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="h-40 bg-[#2A2A2A] rounded"></div>
              <div className="h-40 bg-[#2A2A2A] rounded"></div>
              <div className="h-40 bg-[#2A2A2A] rounded"></div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Get trend icon helper
  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'improving': return TrendingUp
      case 'regressing': return TrendingDown
      case 'stable': return Minus
      default: return AlertCircle
    }
  }

  return (
    <div className="min-h-screen bg-[#121212] text-[#F5F5F5]">
      <Navigation />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Page Header with context navigation */}
        {selectedExercise ? (
          <>
            <button
              onClick={() => setSelectedExercise(null)}
              className="flex items-center gap-2 text-[#A5A5A5] hover:text-[#F5F5F5] mb-4 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              Back to overview
            </button>
            <div className="mb-8">
              <h2 className="text-3xl sm:text-4xl font-bold mb-2">
                {selectedExerciseDef?.name}
              </h2>
              <p className="text-[#A5A5A5]">{selectedExerciseDef?.description}</p>
            </div>
          </>
        ) : (
          <PageHeader 
            title="Weighted Strength"
            description="Relative strength analysis, skill-support mapping, and progress trends"
            backHref="/dashboard"
            backLabel="Back to Dashboard"
            icon={<Dumbbell className="w-5 h-5" />}
          />
        )}

        {/* Overview Mode */}
        {!selectedExercise && (
          <div className="space-y-8">
            {/* Empty State or Bodyweight Warning */}
            <StrengthEmptyState 
              hasData={analysis?.hasData ?? false} 
              hasBodyweight={analysis?.hasBodyweight ?? false}
            />

            {/* Exercise Selection Cards */}
            <div className="grid md:grid-cols-3 gap-4">
              {EXERCISE_DEFINITIONS.map((exercise) => {
                const exerciseAnalysis = analysis?.exercises[exercise.id]
                const TrendIcon = exerciseAnalysis 
                  ? getTrendIcon(exerciseAnalysis.trend.direction)
                  : AlertCircle

                // [PRE-AB6 BUILD GREEN GATE / STEP-5A-OMEGA] Stable
                //   narrowed locals for the JSX subtree. `relativeMetrics`
                //   is nullable on `StrengthExerciseAnalysis`, so direct
                //   reads like `exerciseAnalysis.relativeMetrics.oneRMRatio`
                //   inside JSX cannot be narrowed by an earlier `?.x !== null`
                //   check. Coalescing `relativeMetrics` to `null` once and
                //   pre-deriving a strict numeric `relativeOneRMRatio`
                //   gives the renderer a real `number | null` it can
                //   narrow against. No casts, no non-null assertions, no
                //   widening, no fake defaults — UI behavior preserved
                //   (Relative row still shows iff oneRMRatio is a real
                //   number; tier badge still shows iff tier exists).
                const relativeMetrics = exerciseAnalysis?.relativeMetrics ?? null
                const relativeOneRMRatio =
                  typeof relativeMetrics?.oneRMRatio === 'number'
                    ? relativeMetrics.oneRMRatio
                    : null

                return (
                  <Card
                    key={exercise.id}
                    onClick={() => setSelectedExercise(exercise.id)}
                    className="bg-[#2A2A2A] border-[#3A3A3A] p-5 cursor-pointer hover:border-[#E63946] transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-lg bg-[#1A1A1A] flex items-center justify-center">
                        <Dumbbell className="w-5 h-5 text-[#E63946]" />
                      </div>
                      {relativeMetrics?.tier && (
                        <span className={`text-xs font-medium ${getTierColor(relativeMetrics.tier)}`}>
                          {relativeMetrics.tierLabel}
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-semibold mb-1">{exercise.name}</h3>
                    
                    {exerciseAnalysis ? (
                      <div className="space-y-2">
                        {/* Best Recent / 1RM */}
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs text-[#6A6A6A]">Best Recent</span>
                          <span className="text-lg font-bold text-[#E63946]">
                            {exerciseAnalysis.recentPerformance.bestRecent
                              ? `+${exerciseAnalysis.recentPerformance.bestRecent.weightAdded}×${exerciseAnalysis.recentPerformance.bestRecent.reps}`
                              : exerciseAnalysis.recentPerformance.bestAllTime
                                ? `+${exerciseAnalysis.recentPerformance.bestAllTime.weightAdded}×${exerciseAnalysis.recentPerformance.bestAllTime.reps}`
                                : '—'}
                          </span>
                        </div>

                        {/* Relative Strength */}
                        {relativeOneRMRatio !== null && (
                          <div className="flex items-baseline justify-between">
                            <span className="text-xs text-[#6A6A6A]">Relative</span>
                            <span className="text-sm font-medium">
                              {(relativeOneRMRatio * 100).toFixed(0)}% BW
                            </span>
                          </div>
                        )}

                        {/* Trend */}
                        <div className="flex items-center gap-1.5 pt-1">
                          <TrendIcon className={`w-3.5 h-3.5 ${getTrendStatusColor(exerciseAnalysis.trend.direction)}`} />
                          <span className={`text-xs ${getTrendStatusColor(exerciseAnalysis.trend.direction)}`}>
                            {exerciseAnalysis.trend.label}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-[#6A6A6A]">No records yet</p>
                    )}
                  </Card>
                )
              })}
            </div>

            {/* Skill Support Panel (only if we have data) */}
            {analysis && analysis.hasData && (
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-3">
                  <StrengthSupportPanel
                    skillSupport={analysis.skillSupport}
                    pushPullBalance={analysis.pushPullBalance}
                    weakPoint={analysis.weakPoint}
                    primaryRecommendation={analysis.primaryRecommendation}
                    secondaryRecommendations={analysis.secondaryRecommendations}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Exercise Detail View */}
        {selectedExercise && selectedExerciseDef && (
          <div className="space-y-6">
            {/* Analysis Card */}
            {selectedAnalysis && (
              <StrengthAnalysisCard 
                analysis={selectedAnalysis}
                hasBodyweight={analysis?.hasBodyweight ?? false}
              />
            )}

            {/* Stats Row (legacy, simplified) */}
            {!selectedAnalysis && (
              <div className="grid md:grid-cols-3 gap-4">
                <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-5">
                  <p className="text-[#A5A5A5] text-sm mb-1">Total Logs</p>
                  <p className="text-3xl font-bold">{records.length}</p>
                </Card>
                <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-5">
                  <p className="text-[#A5A5A5] text-sm mb-1">Best 1RM</p>
                  <p className="text-3xl font-bold text-[#E63946]">
                    {records.length > 0
                      ? `+${Math.max(...records.map(r => r.estimatedOneRM))} lbs`
                      : '—'}
                  </p>
                </Card>
                <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-5">
                  <p className="text-[#A5A5A5] text-sm mb-1">Latest</p>
                  <p className="text-3xl font-bold">
                    {records[0]
                      ? `+${records[0].weightAdded} × ${records[0].reps}`
                      : '—'}
                  </p>
                </Card>
              </div>
            )}

            {/* Chart */}
            {records.length > 0 && (
              <StrengthChart records={records} />
            )}

            {/* Log Form and History */}
            <div className="grid lg:grid-cols-2 gap-6">
              <StrengthLogger
                exercise={selectedExercise}
                exerciseName={selectedExerciseDef.name}
                onRecordSaved={handleRecordChange}
              />
              <StrengthHistory
                records={records}
                onRecordDeleted={handleRecordChange}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
