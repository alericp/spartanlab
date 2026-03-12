'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2, Calendar, Clock, CheckCircle2 } from 'lucide-react'
import { deleteSkillSession } from '@/lib/skill-session-service'
import type { SkillSession } from '@/types/skill-readiness'

interface SkillSessionHistoryProps {
  sessions: SkillSession[]
  levelNames: string[]
  onSessionDeleted: () => void
}

export function SkillSessionHistory({ 
  sessions, 
  levelNames,
  onSessionDeleted 
}: SkillSessionHistoryProps) {
  const handleDelete = (sessionId: string) => {
    if (confirm('Delete this session?')) {
      deleteSkillSession(sessionId)
      onSessionDeleted()
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    })
  }

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'clean': return 'bg-green-500'
      case 'shaky': return 'bg-yellow-500'
      case 'failed': return 'bg-red-500'
      default: return 'bg-[#3A3A3A]'
    }
  }

  if (sessions.length === 0) {
    return (
      <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-6">
        <div className="text-center py-8">
          <Clock className="w-12 h-12 mx-auto mb-4 text-[#3A3A3A]" />
          <p className="text-[#A5A5A5] mb-2">No sessions logged yet</p>
          <p className="text-sm text-[#5A5A5A]">
            Log your first skill session to see history here.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-6">
      <h3 className="text-lg font-semibold mb-4">Recent Sessions</h3>
      
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {sessions.slice(0, 10).map((session) => (
          <div 
            key={session.id}
            className="bg-[#1A1A1A] rounded-lg p-4 border border-[#3A3A3A]"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-medium">{levelNames[session.level] || `Level ${session.level}`}</p>
                <div className="flex items-center gap-2 text-sm text-[#A5A5A5] mt-1">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(session.sessionDate)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-xs text-[#A5A5A5]">Density</p>
                  <p className="text-lg font-bold text-[#E63946]">{session.sessionDensity}s</p>
                </div>
                <button
                  onClick={() => handleDelete(session.id)}
                  className="p-2 text-[#5A5A5A] hover:text-[#E63946] transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Sets display */}
            <div className="flex flex-wrap gap-2">
              {session.sets.map((set, i) => (
                <div 
                  key={i}
                  className="flex items-center gap-1 bg-[#2A2A2A] px-2 py-1 rounded"
                >
                  <span className="text-xs text-[#A5A5A5]">#{i + 1}</span>
                  <span className="text-sm font-medium">{set.holdSeconds}s</span>
                  <span 
                    className={`w-2 h-2 rounded-full ${getQualityColor(set.quality)}`}
                    title={set.quality}
                  />
                </div>
              ))}
            </div>

            {/* Session summary */}
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#3A3A3A] text-sm text-[#A5A5A5]">
              <span>{session.sets.length} sets</span>
              <span>Best: {Math.max(...session.sets.map(s => s.holdSeconds))}s</span>
              <span>Avg: {(session.sessionDensity / session.sets.length).toFixed(1)}s</span>
            </div>
          </div>
        ))}
      </div>

      {sessions.length > 10 && (
        <p className="text-center text-sm text-[#A5A5A5] mt-4">
          Showing 10 of {sessions.length} sessions
        </p>
      )}
    </Card>
  )
}
