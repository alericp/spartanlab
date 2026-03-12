'use client'

import { Card } from '@/components/ui/card'
import {
  type RecoverySignal,
  getRecoveryLevelColor,
  getRecoveryLevelBg,
} from '@/lib/recovery-engine'
import { Battery, BatteryMedium, BatteryLow } from 'lucide-react'

interface RecoverySignalCardProps {
  recovery: RecoverySignal
}

export function RecoverySignalCard({ recovery }: RecoverySignalCardProps) {
  const BatteryIcon = recovery.level === 'HIGH'
    ? Battery
    : recovery.level === 'MODERATE'
    ? BatteryMedium
    : BatteryLow

  const levelLabels = {
    HIGH: 'High Readiness',
    MODERATE: 'Moderate Readiness',
    LOW: 'Low Readiness',
  }

  const factorLabels = {
    volumeLoad: { low: 'Light', moderate: 'Moderate', high: 'Heavy' },
    trainingFrequency: { low: 'Low', moderate: 'Moderate', high: 'High' },
    recencyGap: { optimal: 'Optimal', short: 'Short', long: 'Extended' },
  }

  return (
    <Card className="bg-[#1E1E1E] border-[#3A3A3A] p-5">
      <h3 className="text-lg font-semibold text-[#F5F5F5] mb-4">Recovery Status</h3>
      
      {/* Main status */}
      <div className={`${getRecoveryLevelBg(recovery.level)} rounded-lg p-4 mb-4`}>
        <div className="flex items-center gap-3 mb-2">
          <BatteryIcon
            className="w-8 h-8"
            style={{ color: getRecoveryLevelColor(recovery.level) }}
          />
          <div>
            <div
              className="text-xl font-bold"
              style={{ color: getRecoveryLevelColor(recovery.level) }}
            >
              {levelLabels[recovery.level]}
            </div>
            <div className="text-sm text-[#A5A5A5]">Score: {recovery.score}/100</div>
          </div>
        </div>
        <p className="text-sm text-[#F5F5F5]">{recovery.message}</p>
      </div>

      {/* Contributing factors */}
      <div className="space-y-2">
        <div className="text-sm text-[#A5A5A5] mb-2">Contributing Factors</div>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-[#2A2A2A] rounded-lg p-3 text-center">
            <div className="text-xs text-[#A5A5A5] mb-1">Volume</div>
            <div className="text-sm font-medium text-[#F5F5F5]">
              {factorLabels.volumeLoad[recovery.factors.volumeLoad]}
            </div>
          </div>
          <div className="bg-[#2A2A2A] rounded-lg p-3 text-center">
            <div className="text-xs text-[#A5A5A5] mb-1">Frequency</div>
            <div className="text-sm font-medium text-[#F5F5F5]">
              {factorLabels.trainingFrequency[recovery.factors.trainingFrequency]}
            </div>
          </div>
          <div className="bg-[#2A2A2A] rounded-lg p-3 text-center">
            <div className="text-xs text-[#A5A5A5] mb-1">Rest Gap</div>
            <div className="text-sm font-medium text-[#F5F5F5]">
              {factorLabels.recencyGap[recovery.factors.recencyGap]}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
