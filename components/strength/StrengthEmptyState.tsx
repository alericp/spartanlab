'use client'

import { Card } from '@/components/ui/card'
import { Dumbbell, User, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface StrengthEmptyStateProps {
  hasData: boolean
  hasBodyweight: boolean
}

export function StrengthEmptyState({ hasData, hasBodyweight }: StrengthEmptyStateProps) {
  if (!hasData) {
    return (
      <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2A2A2A] to-[#1A1A1A] border border-[#3A3A3A] text-[#E63946] mb-5">
          <Dumbbell className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-semibold text-[#F5F5F5] mb-2">No strength records yet</h3>
        <p className="text-sm text-[#A5A5A5] max-w-sm mx-auto mb-6 leading-relaxed">
          Log weighted pull-ups, dips, or muscle-up strength to unlock support-strength analysis.
        </p>
        <p className="text-xs text-[#6A6A6A] mb-4">
          Select an exercise above to begin logging.
        </p>
      </Card>
    )
  }

  if (!hasBodyweight) {
    return (
      <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-[#1A1A1A] flex items-center justify-center flex-shrink-0">
            <User className="w-6 h-6 text-[#E63946]" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-1">Add Bodyweight for Better Analysis</h3>
            <p className="text-sm text-[#A5A5A5] mb-3">
              Your strength records are being tracked, but relative strength analysis 
              requires your bodyweight. This unlocks skill-support mapping and tier classifications.
            </p>
            <Link href="/profile">
              <Button 
                variant="outline" 
                size="sm"
                className="border-[#E63946] text-[#E63946] hover:bg-[#E63946]/10"
              >
                Update Profile
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    )
  }

  return null
}

interface TrendEmptyStateProps {
  recordCount: number
}

export function TrendEmptyState({ recordCount }: TrendEmptyStateProps) {
  const needed = 3 - recordCount

  if (recordCount >= 3) return null

  return (
    <div className="flex items-center gap-2 text-xs text-[#6A6A6A] bg-[#1A1A1A] rounded-lg p-3">
      <TrendingUp className="w-4 h-4" />
      <span>
        {needed > 0 
          ? `Log ${needed} more session${needed > 1 ? 's' : ''} to unlock trend analysis.`
          : 'Building trend data...'}
      </span>
    </div>
  )
}
