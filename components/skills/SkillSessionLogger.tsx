'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { Plus, Minus, X } from 'lucide-react'
import { saveSkillSession } from '@/lib/skill-session-service'
import type { SkillSet, HoldQuality } from '@/types/skill-readiness'

interface SkillSessionLoggerProps {
  skillName: string
  levelName: string
  levelIndex: number
  onSessionSaved: () => void
}

interface SetInput {
  id: number
  holdSeconds: string
  quality: HoldQuality
}

export function SkillSessionLogger({ 
  skillName, 
  levelName, 
  levelIndex,
  onSessionSaved 
}: SkillSessionLoggerProps) {
  const [sets, setSets] = useState<SetInput[]>([
    { id: 1, holdSeconds: '', quality: 'clean' },
    { id: 2, holdSeconds: '', quality: 'clean' },
    { id: 3, holdSeconds: '', quality: 'clean' },
  ])
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [saving, setSaving] = useState(false)

  const addSet = () => {
    if (sets.length >= 8) return
    const newId = Math.max(...sets.map(s => s.id)) + 1
    setSets([...sets, { id: newId, holdSeconds: '', quality: 'clean' }])
  }

  const removeSet = (id: number) => {
    if (sets.length <= 1) return
    setSets(sets.filter(s => s.id !== id))
  }

  const updateSet = (id: number, field: 'holdSeconds' | 'quality', value: string | HoldQuality) => {
    setSets(sets.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ))
  }

  const validSets = sets.filter(s => parseFloat(s.holdSeconds) > 0)
  const totalDensity = validSets.reduce((sum, s) => sum + (parseFloat(s.holdSeconds) || 0), 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (validSets.length === 0) return
    
    setSaving(true)
    
    try {
      const setsData: SkillSet[] = validSets.map(s => ({
        holdSeconds: parseFloat(s.holdSeconds),
        quality: s.quality,
      }))
      
      saveSkillSession({
        skillName,
        level: levelIndex,
        sets: setsData,
        sessionDate: date,
      })
      
      // Reset form
      setSets([
        { id: 1, holdSeconds: '', quality: 'clean' },
        { id: 2, holdSeconds: '', quality: 'clean' },
        { id: 3, holdSeconds: '', quality: 'clean' },
      ])
      setDate(new Date().toISOString().split('T')[0])
      onSessionSaved()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-6">
      <h3 className="text-lg font-semibold mb-1">Log Session</h3>
      <p className="text-sm text-[#A5A5A5] mb-6">{levelName}</p>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Date */}
        <Field>
          <FieldLabel htmlFor="session-date">Date</FieldLabel>
          <Input
            id="session-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-[#1A1A1A] border-[#3A3A3A] text-[#F5F5F5]"
          />
        </Field>

        {/* Sets */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <FieldLabel>Sets</FieldLabel>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addSet}
              disabled={sets.length >= 8}
              className="border-[#3A3A3A] hover:bg-[#3A3A3A] h-8 px-2"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>
          
          <div className="space-y-2">
            {sets.map((set, index) => (
              <div key={set.id} className="flex items-center gap-2">
                <span className="text-sm text-[#A5A5A5] w-8">#{index + 1}</span>
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  max="120"
                  placeholder="sec"
                  value={set.holdSeconds}
                  onChange={(e) => updateSet(set.id, 'holdSeconds', e.target.value)}
                  className="bg-[#1A1A1A] border-[#3A3A3A] text-[#F5F5F5] w-20"
                />
                <div className="flex gap-1">
                  {(['clean', 'shaky', 'failed'] as const).map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => updateSet(set.id, 'quality', q)}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        set.quality === q
                          ? q === 'clean' 
                            ? 'bg-green-600 text-white'
                            : q === 'shaky'
                            ? 'bg-yellow-600 text-white'
                            : 'bg-red-600 text-white'
                          : 'bg-[#1A1A1A] text-[#A5A5A5] hover:bg-[#3A3A3A]'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
                {sets.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSet(set.id)}
                    className="p-1 text-[#A5A5A5] hover:text-[#E63946] transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Preview */}
        {validSets.length > 0 && (
          <div className="bg-[#1A1A1A] rounded-lg p-4 border border-[#3A3A3A]">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-[#A5A5A5] mb-1">Session Density</p>
                <p className="text-2xl font-bold text-[#E63946]">{totalDensity}s</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-[#A5A5A5] mb-1">Valid Sets</p>
                <p className="text-2xl font-bold">{validSets.length}</p>
              </div>
            </div>
          </div>
        )}

        <Button 
          type="submit" 
          disabled={saving || validSets.length === 0}
          className="w-full bg-[#E63946] hover:bg-[#D62828] disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Log Session'}
        </Button>
      </form>
    </Card>
  )
}
