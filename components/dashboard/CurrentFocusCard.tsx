import { Card } from '@/components/ui/card'
import { Focus } from 'lucide-react'
import type { CurrentFocus } from '@/lib/dashboard-service'

interface CurrentFocusCardProps {
  focus: CurrentFocus
}

export function CurrentFocusCard({ focus }: CurrentFocusCardProps) {
  return (
    <Card className="bg-[#1A1F26] border-[#2B313A] p-5">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-[#C1121F]/10 flex items-center justify-center shrink-0">
          <Focus className="w-5 h-5 text-[#C1121F]" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
            Current Focus
          </h3>
          <p className="text-[#E6E9EF] leading-relaxed">
            {focus.mainFocus}
          </p>
          {focus.supportingFocus && (
            <p className="text-sm text-[#6B7280]">
              {focus.supportingFocus}
            </p>
          )}
        </div>
      </div>
    </Card>
  )
}
