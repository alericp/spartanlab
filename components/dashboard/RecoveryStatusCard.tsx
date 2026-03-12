'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  type RecoverySignal,
  getRecoveryLevelColor,
} from '@/lib/recovery-engine'
import { type MovementBalance } from '@/lib/volume-analyzer'
import { Activity, ArrowRight } from 'lucide-react'
import { InsightExplanation, generateRecoveryExplanation } from '@/components/shared/InsightExplanation'
import { AdaptiveEngineBadge, ENGINE_MESSAGES } from '@/components/shared/AdaptiveEngineBadge'

interface RecoveryStatusCardProps {
  recovery: RecoverySignal
  balance: MovementBalance
}

export function RecoveryStatusCard({ recovery, balance }: RecoveryStatusCardProps) {
  const levelLabels = {
    HIGH: 'High Readiness',
    MODERATE: 'Moderate Readiness',
    LOW: 'Low Readiness',
  }

  // Generate compact insight
  let balanceNote = ''
  if (balance.pushSets > 0 || balance.pullSets > 0) {
    if (balance.ratio > 1.3) {
      balanceNote = 'Push volume elevated'
    } else if (balance.ratio < 0.7) {
      balanceNote = 'Pull volume elevated'
    } else {
      balanceNote = 'Good push/pull balance'
    }
  }

  return (
    <Card className="bg-[#1A1F26] border-[#2B313A] p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-[#C1121F]" />
          <h3 className="text-lg font-semibold text-[#E6E9EF]">Recovery Status</h3>
        </div>
        <Link href="/recovery">
          <Button variant="ghost" size="sm" className="text-[#A4ACB8] hover:text-[#E6E9EF]">
            View Details
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {/* Readiness */}
        <div className="bg-[#0F1115] rounded-lg p-4 border border-[#2B313A]">
          <div className="text-xs text-[#6B7280] uppercase tracking-wider mb-1">Readiness</div>
          <div
            className="text-lg font-bold"
            style={{ color: getRecoveryLevelColor(recovery.level) }}
          >
            {levelLabels[recovery.level]}
          </div>
          <div className="text-xs text-[#A4ACB8] mt-1">Score: {recovery.score}</div>
        </div>

        {/* Volume Load */}
        <div className="bg-[#0F1115] rounded-lg p-4 border border-[#2B313A]">
          <div className="text-xs text-[#6B7280] uppercase tracking-wider mb-1">Volume Load</div>
          <div className="text-lg font-bold text-[#E6E9EF] capitalize">
            {recovery.factors.volumeLoad}
          </div>
          <div className="text-xs text-[#A4ACB8] mt-1">This week</div>
        </div>

        {/* Balance */}
        <div className="bg-[#0F1115] rounded-lg p-4 border border-[#2B313A]">
          <div className="text-xs text-[#6B7280] uppercase tracking-wider mb-1">Movement Balance</div>
          <div className="text-lg font-bold text-[#E6E9EF]">
            {balance.ratio.toFixed(1)}:1
          </div>
          <div className="text-xs text-[#A4ACB8] mt-1">{balanceNote || 'Push:Pull'}</div>
        </div>
      </div>

      {/* Explanation Layer */}
      <InsightExplanation
        explanation={generateRecoveryExplanation(
          recovery.level,
          recovery.factors.volumeLoad,
          balance.pushSets + balance.pullSets > 0 ? Math.round((balance.pushSets + balance.pullSets) / 7) : 0
        )}
        variant="bordered"
      />

      {/* Engine Branding */}
      <div className="mt-3 pt-3 border-t border-[#2B313A]/50">
        <AdaptiveEngineBadge variant="minimal" message={ENGINE_MESSAGES.recovery} />
      </div>
    </Card>
  )
}
