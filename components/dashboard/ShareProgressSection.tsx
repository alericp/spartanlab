'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Share2, Trophy, TrendingUp, Target, Dumbbell, Calendar, Flame, ChevronRight } from 'lucide-react'
import { getAvailableShareCards, hasEnoughDataForShareCards, type AvailableShareCards } from '@/lib/share-card-data-service'
import { ShareProgressButton, ShareCardsEmptyState, type ShareCardData } from '@/components/share/ShareableProgressCards'

export function ShareProgressSection() {
  const [cards, setCards] = useState<AvailableShareCards | null>(null)
  const [dataStatus, setDataStatus] = useState<ReturnType<typeof hasEnoughDataForShareCards> | null>(null)

  useEffect(() => {
    setCards(getAvailableShareCards())
    setDataStatus(hasEnoughDataForShareCards())
  }, [])

  if (!cards || !dataStatus) {
    return (
      <Card className="bg-[#1A1F26] border-[#2B313A] p-5">
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-32 bg-[#2B313A] rounded" />
          <div className="h-20 bg-[#2B313A] rounded" />
        </div>
      </Card>
    )
  }

  if (!cards.hasAnyCards) {
    return (
      <Card className="bg-[#1A1F26] border-[#2B313A] p-5">
        <div className="flex items-center gap-2 mb-4">
          <Share2 className="w-4 h-4 text-[#C1121F]" />
          <h3 className="text-sm font-semibold text-[#E6E9EF]">Share Your Progress</h3>
        </div>
        <ShareCardsEmptyState />
        <p className="text-xs text-[#6B7280] text-center mt-2">
          {dataStatus.suggestion}
        </p>
      </Card>
    )
  }

  return (
    <Card className="bg-[#1A1F26] border-[#2B313A] p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Share2 className="w-4 h-4 text-[#C1121F]" />
          <h3 className="text-sm font-semibold text-[#E6E9EF]">Share Your Progress</h3>
        </div>
        <span className="text-xs text-[#6B7280]">{cards.allCards.length} card{cards.allCards.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {cards.spartanScore && (
          <ShareCardTile 
            data={cards.spartanScore}
            icon={<TrendingUp className="w-4 h-4" />}
            label="Spartan Score"
            value={cards.spartanScore.afterScore.toString()}
            sublabel={cards.spartanScore.level}
            accentColor={cards.spartanScore.levelColor}
          />
        )}
        
        {cards.strength && (
          <ShareCardTile 
            data={cards.strength}
            icon={<Dumbbell className="w-4 h-4" />}
            label={cards.strength.exerciseName}
            value={`+${cards.strength.afterValue}`}
            sublabel={cards.strength.unit}
            accentColor="#C1121F"
          />
        )}
        
        {cards.skill && (
          <ShareCardTile 
            data={cards.skill}
            icon={<Target className="w-4 h-4" />}
            label={cards.skill.skillName}
            value={cards.skill.afterLevel}
            sublabel={`Level ${(cards.skill.afterIndex || 0) + 1}`}
            accentColor="#C1121F"
          />
        )}
        
        {cards.consistency && (
          <ShareCardTile 
            data={cards.consistency}
            icon={cards.consistency.streak ? <Flame className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
            label={cards.consistency.streak ? 'Day Streak' : cards.consistency.monthName}
            value={(cards.consistency.streak || cards.consistency.workoutsThisMonth).toString()}
            sublabel={cards.consistency.streak ? 'days' : 'workouts'}
            accentColor="#C1121F"
          />
        )}
      </div>

      <p className="text-[10px] text-[#4B5563] text-center mt-4">
        Tap a card to share your training progress
      </p>
    </Card>
  )
}

interface ShareCardTileProps {
  data: ShareCardData
  icon: React.ReactNode
  label: string
  value: string
  sublabel: string
  accentColor: string
}

function ShareCardTile({ data, icon, label, value, sublabel, accentColor }: ShareCardTileProps) {
  const [showShare, setShowShare] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowShare(true)}
        className="flex flex-col p-3 bg-[#0F1115] hover:bg-[#0F1115]/80 rounded-lg border border-[#2B313A] hover:border-[#3A3A3A] transition-all text-left group"
      >
        <div className="flex items-center justify-between w-full mb-2">
          <div 
            className="w-7 h-7 rounded-md flex items-center justify-center"
            style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
          >
            {icon}
          </div>
          <Share2 className="w-3 h-3 text-[#4B5563] opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        
        <p className="text-[10px] text-[#6B7280] truncate w-full">{label}</p>
        
        <div className="flex items-baseline gap-1 mt-0.5">
          <span className="text-lg font-bold" style={{ color: accentColor }}>{value}</span>
          <span className="text-[10px] text-[#6B7280]">{sublabel}</span>
        </div>
      </button>

      {showShare && (
        <ShareModalWrapper data={data} onClose={() => setShowShare(false)} />
      )}
    </>
  )
}

// Lazy import the modal to avoid circular dependencies
function ShareModalWrapper({ data, onClose }: { data: ShareCardData; onClose: () => void }) {
  const [Modal, setModal] = useState<React.ComponentType<{ data: ShareCardData; onClose: () => void }> | null>(null)

  useEffect(() => {
    import('@/components/share/ShareableProgressCards').then(mod => {
      setModal(() => mod.ShareProgressModal)
    })
  }, [])

  if (!Modal) return null
  return <Modal data={data} onClose={onClose} />
}

// =============================================================================
// COMPACT SHARE PROMPT (for milestone moments)
// =============================================================================

interface SharePromptProps {
  title: string
  data: ShareCardData
  onDismiss?: () => void
}

export function SharePrompt({ title, data, onDismiss }: SharePromptProps) {
  return (
    <div className="flex items-center justify-between p-3 bg-[#1A1F26] rounded-lg border border-[#2B313A]">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-[#C1121F]/10 flex items-center justify-center">
          <Trophy className="w-4 h-4 text-[#C1121F]" />
        </div>
        <div>
          <p className="text-sm font-medium text-[#E6E9EF]">{title}</p>
          <p className="text-xs text-[#A4ACB8]">Share your achievement</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <ShareProgressButton data={data} variant="compact" />
        {onDismiss && (
          <button 
            onClick={onDismiss}
            className="text-xs text-[#6B7280] hover:text-[#A4ACB8]"
          >
            Later
          </button>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// INLINE SHARE BUTTON FOR USE IN OTHER COMPONENTS
// =============================================================================

interface InlineShareProps {
  label?: string
  data: ShareCardData
}

export function InlineShareButton({ label = 'Share', data }: InlineShareProps) {
  return (
    <ShareProgressButton data={data} variant="compact" className="text-[#A4ACB8]" />
  )
}
