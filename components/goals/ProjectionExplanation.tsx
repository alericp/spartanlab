'use client'

import { Card } from '@/components/ui/card'
import { Info, Zap, TrendingUp, Clock } from 'lucide-react'

export function ProjectionExplanation() {
  return (
    <Card className="bg-[#1A1F26] border-[#2B313A] p-5">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-[#0F1115] rounded-lg">
          <Info className="w-5 h-5 text-[#A4ACB8]" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-[#E6E9EF] mb-2">How Projections Work</h3>
          <p className="text-sm text-[#A4ACB8] mb-4">
            Estimates are based on your current skill level, weighted strength, training 
            consistency, and experience. These are approximate ranges, not exact predictions.
          </p>
          
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex items-start gap-2 text-sm">
              <Zap className="w-4 h-4 text-[#C1121F] flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-[#E6E9EF] font-medium block">Strength</span>
                <span className="text-[#6B7280]">Weighted pull-up and dip support</span>
              </div>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-[#E6E9EF] font-medium block">Consistency</span>
                <span className="text-[#6B7280]">Recent training momentum</span>
              </div>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <Clock className="w-4 h-4 text-[#4F6D8A] flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-[#E6E9EF] font-medium block">Frequency</span>
                <span className="text-[#6B7280]">Training sessions per week</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
