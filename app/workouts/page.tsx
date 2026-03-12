'use client'

import { useState, useEffect } from 'react'
import { Navigation } from '@/components/shared/Navigation'
import { WorkoutLogForm } from '@/components/workouts/WorkoutLogForm'
import { RecentWorkoutsList } from '@/components/workouts/RecentWorkoutsList'
import { WorkoutAnalyticsCards } from '@/components/workouts/WorkoutAnalyticsCards'
import { Button } from '@/components/ui/button'
import { Plus, ChevronDown, ChevronUp, ClipboardList } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { WorkoutHistoryEmptyState } from '@/components/shared/EmptyStates'
import {
  getRecentWorkoutLogs,
  type WorkoutLog,
} from '@/lib/workout-log-service'
import {
  getWorkoutAnalytics,
  type WorkoutAnalytics,
} from '@/lib/workout-analytics'

export default function WorkoutsPage() {
  const [mounted, setMounted] = useState(false)
  const [workouts, setWorkouts] = useState<WorkoutLog[]>([])
  const [analytics, setAnalytics] = useState<WorkoutAnalytics | null>(null)
  const [showForm, setShowForm] = useState(false)

  const loadData = () => {
    setWorkouts(getRecentWorkoutLogs(20))
    setAnalytics(getWorkoutAnalytics())
  }

  useEffect(() => {
    setMounted(true)
    loadData()
  }, [])

  const handleSave = (log: WorkoutLog) => {
    loadData()
    setShowForm(false)
  }

  const handleDelete = (id: string) => {
    loadData()
  }

  // Loading state
  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#121212] text-[#F5F5F5]">
        <Navigation />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-[#2A2A2A] rounded w-1/3"></div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="h-24 bg-[#2A2A2A] rounded"></div>
              <div className="h-24 bg-[#2A2A2A] rounded"></div>
              <div className="h-24 bg-[#2A2A2A] rounded"></div>
              <div className="h-24 bg-[#2A2A2A] rounded"></div>
            </div>
            <div className="h-64 bg-[#2A2A2A] rounded"></div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#121212] text-[#F5F5F5]">
      <Navigation />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="space-y-6">
          {/* Header */}
          <PageHeader 
            title="Workout Log"
            description="Track training sessions and build your performance history"
            backHref="/dashboard"
            backLabel="Back to Dashboard"
            icon={<ClipboardList className="w-5 h-5" />}
            actions={
              <Button
                onClick={() => setShowForm(!showForm)}
                className={showForm ? 'bg-[#3A3A3A] hover:bg-[#4A4A4A]' : 'bg-[#E63946] hover:bg-[#D62828]'}
              >
                {showForm ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-2" />
                    Hide Form
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Log Workout
                  </>
                )}
              </Button>
            }
          />

          {/* Analytics Summary */}
          {analytics && analytics.totalWorkouts > 0 && <WorkoutAnalyticsCards analytics={analytics} />}

          {/* Log Form (collapsible) */}
          {showForm && (
            <WorkoutLogForm
              onSave={handleSave}
              onCancel={() => setShowForm(false)}
            />
          )}

          {/* Empty State or Recent Workouts */}
          {workouts.length === 0 && !showForm ? (
            <WorkoutHistoryEmptyState />
          ) : (
            <div>
              <h2 className="text-lg font-semibold mb-4">Recent Sessions</h2>
              <RecentWorkoutsList
                workouts={workouts}
                onDelete={handleDelete}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
