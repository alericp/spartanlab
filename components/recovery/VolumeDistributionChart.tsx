'use client'

import { Card } from '@/components/ui/card'
import { type VolumeDistribution } from '@/lib/volume-analyzer'

interface VolumeDistributionChartProps {
  distribution: VolumeDistribution[]
}

const CATEGORY_COLORS: Record<string, string> = {
  push: '#E63946',
  pull: '#4ECDC4',
  core: '#FFE66D',
  legs: '#95E1D3',
  skill: '#DDA0DD',
  mobility: '#87CEEB',
}

export function VolumeDistributionChart({ distribution }: VolumeDistributionChartProps) {
  const hasData = distribution.some(d => d.sets > 0)
  const maxSets = Math.max(...distribution.map(d => d.sets), 1)

  if (!hasData) {
    return (
      <Card className="bg-[#1E1E1E] border-[#3A3A3A] p-5">
        <h3 className="text-lg font-semibold text-[#F5F5F5] mb-4">Volume Distribution</h3>
        <div className="text-center py-8 text-[#A5A5A5]">
          <p>No volume data this week.</p>
          <p className="text-sm mt-1">Log workouts to see distribution.</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="bg-[#1E1E1E] border-[#3A3A3A] p-5">
      <h3 className="text-lg font-semibold text-[#F5F5F5] mb-4">Volume Distribution</h3>
      
      <div className="space-y-3">
        {distribution.map((item) => (
          <div key={item.category}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-[#A5A5A5]">{item.label}</span>
              <span className="text-sm font-medium text-[#F5F5F5]">
                {item.sets} sets ({item.percentage}%)
              </span>
            </div>
            <div className="h-3 bg-[#2A2A2A] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(item.sets / maxSets) * 100}%`,
                  backgroundColor: CATEGORY_COLORS[item.category],
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
