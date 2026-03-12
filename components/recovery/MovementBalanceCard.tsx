'use client'

import { Card } from '@/components/ui/card'
import { type MovementBalance } from '@/lib/volume-analyzer'
import { ArrowRight } from 'lucide-react'

interface MovementBalanceCardProps {
  balance: MovementBalance
}

export function MovementBalanceCard({ balance }: MovementBalanceCardProps) {
  const total = balance.pushSets + balance.pullSets
  const pushPercent = total > 0 ? Math.round((balance.pushSets / total) * 100) : 50
  const pullPercent = 100 - pushPercent

  // Determine balance status
  let status: 'balanced' | 'push-heavy' | 'pull-heavy' = 'balanced'
  if (balance.ratio > 1.3) status = 'push-heavy'
  else if (balance.ratio < 0.7) status = 'pull-heavy'

  return (
    <Card className="bg-[#1E1E1E] border-[#3A3A3A] p-5">
      <h3 className="text-lg font-semibold text-[#F5F5F5] mb-4">Push / Pull Balance</h3>
      
      {total === 0 ? (
        <div className="text-center py-6 text-[#A5A5A5]">
          <p>No push/pull data this week.</p>
          <p className="text-sm mt-1">Log exercises to see balance.</p>
        </div>
      ) : (
        <>
          {/* Visual balance bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-[#E63946] font-medium">Push: {balance.pushSets}</span>
              <span className="text-[#4ECDC4] font-medium">Pull: {balance.pullSets}</span>
            </div>
            <div className="h-4 bg-[#2A2A2A] rounded-full overflow-hidden flex">
              <div
                className="h-full bg-[#E63946] transition-all duration-500"
                style={{ width: `${pushPercent}%` }}
              />
              <div
                className="h-full bg-[#4ECDC4] transition-all duration-500"
                style={{ width: `${pullPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-[#A5A5A5] mt-1">
              <span>{pushPercent}%</span>
              <span>{pullPercent}%</span>
            </div>
          </div>

          {/* Ratio display */}
          <div className="flex items-center justify-center gap-2 mb-4 py-3 bg-[#2A2A2A] rounded-lg">
            <span className="text-[#E63946] font-bold">{balance.ratio.toFixed(1)}</span>
            <ArrowRight className="w-4 h-4 text-[#A5A5A5]" />
            <span className="text-[#4ECDC4] font-bold">1.0</span>
            <span className="text-xs text-[#A5A5A5] ml-2">push:pull ratio</span>
          </div>

          {/* Insight */}
          <div className={`p-3 rounded-lg text-sm ${
            status === 'balanced'
              ? 'bg-green-500/10 text-green-400'
              : status === 'push-heavy'
              ? 'bg-red-500/10 text-red-400'
              : 'bg-yellow-500/10 text-yellow-400'
          }`}>
            {balance.insight}
          </div>
        </>
      )}
    </Card>
  )
}
