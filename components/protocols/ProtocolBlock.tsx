'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Shield, Clock, Info } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { ProtocolRecommendation, JointIntegrityProtocol } from '@/lib/protocols/joint-integrity-protocol'
import { JOINT_REGION_LABELS } from '@/lib/protocols/joint-integrity-protocol'

// =============================================================================
// SINGLE PROTOCOL CARD
// =============================================================================

interface ProtocolCardProps {
  protocol: JointIntegrityProtocol
  reason?: string
  defaultExpanded?: boolean
  compact?: boolean
}

export function ProtocolCard({ 
  protocol, 
  reason, 
  defaultExpanded = false,
  compact = false 
}: ProtocolCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  if (compact) {
    return (
      <div className="p-3 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#E63946]" />
            <span className="text-sm font-medium text-[#F5F5F5]">{protocol.name}</span>
          </div>
          <Badge variant="outline" className="border-[#3A3A3A] text-[#A5A5A5] text-xs">
            {protocol.durationMinutes} min
          </Badge>
        </div>
        {reason && (
          <p className="text-xs text-[#6A6A6A] mt-1 ml-6">{reason}</p>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-[#2A2A2A] bg-[#1A1A1A] overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#2A2A2A]/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Shield className="w-4 h-4 text-[#E63946]" />
          <div className="text-left">
            <p className="text-sm font-medium text-[#F5F5F5]">{protocol.name}</p>
            <p className="text-xs text-[#6A6A6A] flex items-center gap-2">
              <Clock className="w-3 h-3" />
              {protocol.durationMinutes} min
              <span className="text-[#4F6D8A]">|</span>
              <span className="text-[#4F6D8A]">{JOINT_REGION_LABELS[protocol.jointRegion]}</span>
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-[#6A6A6A]" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[#6A6A6A]" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
          {reason && (
            <p className="text-xs text-[#E63946]/80 italic flex items-center gap-1">
              <Info className="w-3 h-3" />
              {reason}
            </p>
          )}

          <div className="space-y-2">
            {protocol.exercises.map((exercise, idx) => (
              <div 
                key={idx}
                className="flex items-center justify-between py-2 px-3 rounded bg-[#0A0A0A]"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#E63946] font-mono w-4">{idx + 1}</span>
                  <span className="text-sm text-[#E6E9EF]">{exercise.name}</span>
                </div>
                <span className="text-xs text-[#A5A5A5]">{exercise.prescription}</span>
              </div>
            ))}
          </div>

          {protocol.coachingNotes && (
            <p className="text-xs text-[#6A6A6A] italic pl-2 border-l-2 border-[#E63946]/30">
              {protocol.coachingNotes}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// PROTOCOL BLOCK FOR WARMUP INTEGRATION
// =============================================================================

interface ProtocolBlockProps {
  recommendations: ProtocolRecommendation[]
  explanations?: string[]
  defaultExpanded?: boolean
}

export function ProtocolBlock({ 
  recommendations, 
  explanations,
  defaultExpanded = false 
}: ProtocolBlockProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  if (recommendations.length === 0) {
    return null
  }

  const totalMinutes = recommendations.reduce((sum, r) => sum + r.protocol.durationMinutes, 0)

  return (
    <div className="rounded-lg border border-[#E63946]/20 bg-[#E63946]/5">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#E63946]" />
          <span className="text-sm font-medium text-[#E63946]">
            Joint Integrity Protocols
          </span>
          <span className="text-xs text-[#A5A5A5]">
            ({recommendations.length} {recommendations.length === 1 ? 'protocol' : 'protocols'}, ~{totalMinutes} min)
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-[#E63946]" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[#E63946]" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
          {explanations && explanations.length > 0 && (
            <div className="text-xs text-[#A5A5A5] space-y-1">
              {explanations.map((exp, idx) => (
                <p key={idx}>{exp}</p>
              ))}
            </div>
          )}

          <div className="space-y-2">
            {recommendations.map((rec) => (
              <ProtocolCard
                key={rec.protocol.id}
                protocol={rec.protocol}
                reason={rec.reason}
                defaultExpanded={recommendations.length === 1}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// INLINE PROTOCOL RECOMMENDATION
// =============================================================================

interface InlineProtocolRecommendationProps {
  protocolId: string
  protocolName: string
  reason: string
  onViewProtocol?: (id: string) => void
}

export function InlineProtocolRecommendation({
  protocolId,
  protocolName,
  reason,
  onViewProtocol
}: InlineProtocolRecommendationProps) {
  return (
    <div className="flex items-start gap-2 p-3 rounded-lg bg-[#E63946]/5 border border-[#E63946]/20">
      <Shield className="w-4 h-4 text-[#E63946] mt-0.5 shrink-0" />
      <div className="flex-1">
        <p className="text-sm text-[#F5F5F5]">
          <span className="font-medium">{protocolName}</span> recommended
        </p>
        <p className="text-xs text-[#A5A5A5] mt-0.5">{reason}</p>
        {onViewProtocol && (
          <button
            onClick={() => onViewProtocol(protocolId)}
            className="text-xs text-[#E63946] hover:text-[#E63946]/80 mt-1 underline"
          >
            View Protocol
          </button>
        )}
      </div>
    </div>
  )
}

export default ProtocolBlock
