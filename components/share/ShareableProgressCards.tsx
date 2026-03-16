'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Share2, Download, X, Check, TrendingUp, Target, Dumbbell, Calendar, Flame, ChevronRight, Trophy } from 'lucide-react'
import { SpartanIcon } from '@/components/brand/SpartanLogo'

// =============================================================================
// TYPES
// =============================================================================

export type ShareCardType = 'strength' | 'skill' | 'spartan_score' | 'consistency'

export interface StrengthProgressCardData {
  type: 'strength'
  exerciseName: string
  beforeValue: number
  afterValue: number
  unit: string // 'lbs', 'kg', 'reps'
  timeframe?: string // e.g., "Last 30 days"
}

export interface SkillProgressCardData {
  type: 'skill'
  skillName: string
  beforeLevel: string
  afterLevel: string
  beforeIndex?: number
  afterIndex?: number
}

export interface SpartanScoreCardData {
  type: 'spartan_score'
  beforeScore?: number
  afterScore: number
  level: string
  levelColor: string
}

export interface ConsistencyCardData {
  type: 'consistency'
  streak?: number
  workoutsThisMonth: number
  monthName: string
}

export type ShareCardData = 
  | StrengthProgressCardData 
  | SkillProgressCardData 
  | SpartanScoreCardData 
  | ConsistencyCardData

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getCardTitle(data: ShareCardData): string {
  switch (data.type) {
    case 'strength':
      return `${data.exerciseName} Progress`
    case 'skill':
      return `${data.skillName} Progress`
    case 'spartan_score':
      return 'Spartan Score'
    case 'consistency':
      return 'Training Consistency'
    default:
      return 'Progress'
  }
}

function hasValidData(data: ShareCardData): boolean {
  switch (data.type) {
    case 'strength':
      return data.afterValue > 0
    case 'skill':
      return data.afterLevel !== data.beforeLevel || data.afterIndex !== undefined
    case 'spartan_score':
      return data.afterScore > 0
    case 'consistency':
      return (data.streak && data.streak > 0) || data.workoutsThisMonth > 0
    default:
      return false
  }
}

// =============================================================================
// CANVAS IMAGE GENERATION
// =============================================================================

function generateProgressCardImage(
  canvas: HTMLCanvasElement,
  data: ShareCardData
): string | null {
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  // Canvas dimensions (optimized for social sharing)
  const width = 600
  const height = 340
  canvas.width = width
  canvas.height = height

  // Background
  ctx.fillStyle = '#0F1115'
  ctx.fillRect(0, 0, width, height)

  // Subtle gradient overlay
  const gradient = ctx.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, 'rgba(193, 18, 31, 0.08)')
  gradient.addColorStop(1, 'rgba(15, 17, 21, 0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  // Left accent line
  const accentColor = data.type === 'spartan_score' 
    ? (data as SpartanScoreCardData).levelColor 
    : '#C1121F'
  ctx.fillStyle = accentColor
  ctx.fillRect(0, 0, 4, height)

  // Top label
  ctx.font = '500 11px system-ui, sans-serif'
  ctx.fillStyle = '#6B7280'
  ctx.textAlign = 'left'
  ctx.fillText(getCardTitle(data).toUpperCase(), 40, 45)

  // Render based on card type
  switch (data.type) {
    case 'strength':
      renderStrengthCard(ctx, data, width, height, accentColor)
      break
    case 'skill':
      renderSkillCard(ctx, data, width, height, accentColor)
      break
    case 'spartan_score':
      renderSpartanScoreCard(ctx, data, width, height)
      break
    case 'consistency':
      renderConsistencyCard(ctx, data, width, height, accentColor)
      break
  }

  // Branding footer
  ctx.font = 'bold 13px system-ui, sans-serif'
  ctx.fillStyle = '#E6E9EF'
  ctx.textAlign = 'right'
  ctx.fillText('SpartanLab', width - 40, height - 28)
  
  ctx.font = '500 10px system-ui, sans-serif'
  ctx.fillStyle = '#6B7280'
  ctx.fillText('spartanlab.app', width - 40, height - 12)

  // Tagline
  ctx.font = '400 10px system-ui, sans-serif'
  ctx.fillStyle = '#4B5563'
  ctx.textAlign = 'left'
  ctx.fillText('Train smarter. Progress with purpose.', 40, height - 18)

  return canvas.toDataURL('image/png')
}

function renderStrengthCard(
  ctx: CanvasRenderingContext2D,
  data: StrengthProgressCardData,
  width: number,
  _height: number,
  accentColor: string
) {
  const change = data.afterValue - data.beforeValue
  const changePercent = data.beforeValue > 0 
    ? Math.round((change / data.beforeValue) * 100) 
    : 0
  const isImprovement = change > 0

  // Progress values
  const centerY = 120

  // Before value
  ctx.font = '500 11px system-ui, sans-serif'
  ctx.fillStyle = '#6B7280'
  ctx.textAlign = 'left'
  ctx.fillText('BEFORE', 40, centerY - 35)
  
  ctx.font = 'bold 36px system-ui, sans-serif'
  ctx.fillStyle = '#A4ACB8'
  ctx.fillText(`${data.beforeValue > 0 ? (data.unit === 'lbs' ? '+' : '') + data.beforeValue : '—'}`, 40, centerY)

  // Arrow
  ctx.font = 'bold 28px system-ui, sans-serif'
  ctx.fillStyle = '#4B5563'
  ctx.textAlign = 'center'
  ctx.fillText('→', width / 2, centerY - 5)

  // After value
  ctx.font = '500 11px system-ui, sans-serif'
  ctx.fillStyle = '#6B7280'
  ctx.textAlign = 'right'
  ctx.fillText('NOW', width - 40, centerY - 35)
  
  ctx.font = 'bold 48px system-ui, sans-serif'
  ctx.fillStyle = accentColor
  ctx.fillText(`${data.unit === 'lbs' ? '+' : ''}${data.afterValue}`, width - 40, centerY)

  // Unit label
  ctx.font = '500 14px system-ui, sans-serif'
  ctx.fillStyle = '#6B7280'
  ctx.fillText(data.unit, width - 40, centerY + 22)

  // Change indicator
  if (data.beforeValue > 0) {
    ctx.font = 'bold 16px system-ui, sans-serif'
    ctx.fillStyle = isImprovement ? '#4ADE80' : '#F87171'
    ctx.textAlign = 'center'
    ctx.fillText(
      `${isImprovement ? '+' : ''}${change} ${data.unit} (${isImprovement ? '+' : ''}${changePercent}%)`,
      width / 2,
      centerY + 60
    )
  }

  // Timeframe
  if (data.timeframe) {
    ctx.font = '400 12px system-ui, sans-serif'
    ctx.fillStyle = '#4B5563'
    ctx.fillText(data.timeframe, width / 2, centerY + 85)
  }
}

function renderSkillCard(
  ctx: CanvasRenderingContext2D,
  data: SkillProgressCardData,
  width: number,
  _height: number,
  accentColor: string
) {
  const centerY = 115

  // Before level
  ctx.font = '500 11px system-ui, sans-serif'
  ctx.fillStyle = '#6B7280'
  ctx.textAlign = 'left'
  ctx.fillText('FROM', 40, centerY - 35)
  
  ctx.font = 'bold 28px system-ui, sans-serif'
  ctx.fillStyle = '#A4ACB8'
  ctx.fillText(data.beforeLevel, 40, centerY)

  // Arrow
  ctx.font = 'bold 28px system-ui, sans-serif'
  ctx.fillStyle = '#4B5563'
  ctx.textAlign = 'center'
  ctx.fillText('→', width / 2, centerY - 5)

  // After level
  ctx.font = '500 11px system-ui, sans-serif'
  ctx.fillStyle = '#6B7280'
  ctx.textAlign = 'right'
  ctx.fillText('TO', width - 40, centerY - 35)
  
  ctx.font = 'bold 32px system-ui, sans-serif'
  ctx.fillStyle = accentColor
  ctx.fillText(data.afterLevel, width - 40, centerY)

  // Level indicator dots
  const totalLevels = 5
  const currentLevel = data.afterIndex !== undefined ? data.afterIndex : 2
  const dotY = centerY + 55
  const dotSpacing = 20
  const dotsWidth = (totalLevels - 1) * dotSpacing
  const startX = (width - dotsWidth) / 2

  for (let i = 0; i < totalLevels; i++) {
    ctx.beginPath()
    ctx.arc(startX + i * dotSpacing, dotY, 5, 0, Math.PI * 2)
    ctx.fillStyle = i <= currentLevel ? accentColor : '#2B313A'
    ctx.fill()
  }

  // Progress label
  ctx.font = '500 12px system-ui, sans-serif'
  ctx.fillStyle = '#6B7280'
  ctx.textAlign = 'center'
  ctx.fillText(`Level ${currentLevel + 1} of ${totalLevels}`, width / 2, dotY + 28)
}

function renderSpartanScoreCard(
  ctx: CanvasRenderingContext2D,
  data: SpartanScoreCardData,
  width: number,
  _height: number
) {
  const centerY = 110
  const levelColor = data.levelColor

  if (data.beforeScore && data.beforeScore > 0) {
    // Show progress
    ctx.font = '500 11px system-ui, sans-serif'
    ctx.fillStyle = '#6B7280'
    ctx.textAlign = 'left'
    ctx.fillText('FROM', 40, centerY - 40)
    
    ctx.font = 'bold 42px system-ui, sans-serif'
    ctx.fillStyle = '#A4ACB8'
    ctx.fillText(data.beforeScore.toString(), 40, centerY)

    // Arrow
    ctx.font = 'bold 32px system-ui, sans-serif'
    ctx.fillStyle = '#4B5563'
    ctx.textAlign = 'center'
    ctx.fillText('→', width / 2, centerY - 10)

    // After score
    ctx.font = '500 11px system-ui, sans-serif'
    ctx.fillStyle = '#6B7280'
    ctx.textAlign = 'right'
    ctx.fillText('NOW', width - 40, centerY - 40)
    
    ctx.font = 'bold 56px system-ui, sans-serif'
    ctx.fillStyle = levelColor
    ctx.fillText(data.afterScore.toString(), width - 40, centerY)

    // Change
    const change = data.afterScore - data.beforeScore
    ctx.font = 'bold 18px system-ui, sans-serif'
    ctx.fillStyle = change > 0 ? '#4ADE80' : '#F87171'
    ctx.textAlign = 'center'
    ctx.fillText(`${change > 0 ? '+' : ''}${change} points`, width / 2, centerY + 55)
  } else {
    // Just show current score
    ctx.font = 'bold 72px system-ui, sans-serif'
    ctx.fillStyle = levelColor
    ctx.textAlign = 'center'
    ctx.fillText(data.afterScore.toString(), width / 2, centerY + 10)
  }

  // Level badge
  ctx.font = 'bold 18px system-ui, sans-serif'
  ctx.fillStyle = '#E6E9EF'
  ctx.textAlign = 'center'
  ctx.fillText(data.level, width / 2, centerY + 90)
}

function renderConsistencyCard(
  ctx: CanvasRenderingContext2D,
  data: ConsistencyCardData,
  width: number,
  _height: number,
  accentColor: string
) {
  const centerY = 100

  if (data.streak && data.streak > 0) {
    // Show streak
    ctx.font = 'bold 72px system-ui, sans-serif'
    ctx.fillStyle = accentColor
    ctx.textAlign = 'center'
    ctx.fillText(data.streak.toString(), width / 2, centerY + 10)

    ctx.font = '600 18px system-ui, sans-serif'
    ctx.fillStyle = '#E6E9EF'
    ctx.fillText('DAY STREAK', width / 2, centerY + 45)

    // Flame icon indicator (text-based)
    ctx.font = '500 13px system-ui, sans-serif'
    ctx.fillStyle = '#6B7280'
    ctx.fillText('Keep the momentum going', width / 2, centerY + 75)
  } else {
    // Show monthly workouts
    ctx.font = 'bold 64px system-ui, sans-serif'
    ctx.fillStyle = accentColor
    ctx.textAlign = 'center'
    ctx.fillText(data.workoutsThisMonth.toString(), width / 2, centerY + 5)

    ctx.font = '600 16px system-ui, sans-serif'
    ctx.fillStyle = '#E6E9EF'
    ctx.fillText(`WORKOUTS IN ${data.monthName.toUpperCase()}`, width / 2, centerY + 40)

    ctx.font = '500 13px system-ui, sans-serif'
    ctx.fillStyle = '#6B7280'
    ctx.fillText('Consistent training builds results', width / 2, centerY + 70)
  }
}

// =============================================================================
// SHARE PROGRESS CARD MODAL
// =============================================================================

interface ShareProgressModalProps {
  data: ShareCardData
  onClose: () => void
}

export function ShareProgressModal({ data, onClose }: ShareProgressModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [copied, setCopied] = useState(false)

  const generateImage = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return null
    return generateProgressCardImage(canvas, data)
  }, [data])

  const handleDownload = useCallback(() => {
    const dataUrl = generateImage()
    if (!dataUrl) return

    const typeLabel = data.type.replace('_', '-')
    const link = document.createElement('a')
    link.download = `spartanlab-${typeLabel}-progress.png`
    link.href = dataUrl
    link.click()
  }, [generateImage, data.type])

  const handleCopy = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) return

    generateImage()
    
    try {
      const blob = await new Promise<Blob | null>((resolve) => 
        canvas.toBlob(resolve, 'image/png')
      )
      
      if (blob) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ])
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch {
      handleDownload()
    }
  }, [generateImage, handleDownload])

  const handleNativeShare = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) return

    generateImage()

    try {
      const blob = await new Promise<Blob | null>((resolve) => 
        canvas.toBlob(resolve, 'image/png')
      )
      
      if (blob && navigator.share) {
        const file = new File([blob], 'spartanlab-progress.png', { type: 'image/png' })
        await navigator.share({
          files: [file],
          title: 'My SpartanLab Progress',
          text: 'Check out my training progress on SpartanLab!'
        })
      } else {
        handleDownload()
      }
    } catch {
      handleDownload()
    }
  }, [generateImage, handleDownload])

  const canNativeShare = typeof navigator !== 'undefined' && 'share' in navigator && 'canShare' in navigator

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <Card 
        className="bg-[#1A1F26] border-[#2B313A] w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2B313A]">
          <div className="flex items-center gap-3">
            <SpartanIcon size={22} />
            <h3 className="font-semibold text-[#E6E9EF]">Share Your Progress</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-[#A4ACB8] hover:text-[#E6E9EF]"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Preview */}
        <div className="p-5">
          <ShareCardPreview data={data} />

          {/* Actions */}
          <div className="flex gap-3 mt-5">
            {canNativeShare ? (
              <Button
                onClick={handleNativeShare}
                className="flex-1 bg-[#C1121F] hover:bg-[#A30F1A] text-white gap-2"
              >
                <Share2 className="w-4 h-4" />
                Share
              </Button>
            ) : (
              <Button
                onClick={handleDownload}
                className="flex-1 bg-[#C1121F] hover:bg-[#A30F1A] text-white gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleCopy}
              className="flex-1 border-[#2B313A] hover:bg-[#2B313A] gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-400" />
                  Copied!
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  Copy
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-[#6B7280] text-center mt-4">
            Share your training progress with others
          </p>
        </div>

        {/* Hidden canvas for image generation */}
        <canvas ref={canvasRef} className="hidden" />
      </Card>
    </div>
  )
}

// =============================================================================
// PREVIEW COMPONENT (HTML VERSION)
// =============================================================================

function ShareCardPreview({ data }: { data: ShareCardData }) {
  const accentColor = data.type === 'spartan_score' 
    ? (data as SpartanScoreCardData).levelColor 
    : '#C1121F'

  return (
    <div className="bg-[#0F1115] rounded-lg p-5 border border-[#2B313A]">
      <div className="flex">
        {/* Left accent */}
        <div 
          className="w-1 rounded-full mr-4 self-stretch"
          style={{ backgroundColor: accentColor }}
        />
        
        <div className="flex-1 space-y-4">
          {/* Header */}
          <p className="text-[10px] text-[#6B7280] uppercase tracking-wider">
            {getCardTitle(data)}
          </p>
          
          {/* Content based on type */}
          {data.type === 'strength' && (
            <StrengthPreview data={data} accentColor={accentColor} />
          )}
          {data.type === 'skill' && (
            <SkillPreview data={data} accentColor={accentColor} />
          )}
          {data.type === 'spartan_score' && (
            <SpartanScorePreview data={data} />
          )}
          {data.type === 'consistency' && (
            <ConsistencyPreview data={data} accentColor={accentColor} />
          )}

          {/* Branding */}
          <div className="flex items-center justify-between pt-3 border-t border-[#2B313A]">
            <div className="flex items-center gap-2">
              <SpartanIcon size={16} />
              <span className="text-xs font-semibold text-[#E6E9EF]">SpartanLab</span>
            </div>
            <span className="text-[10px] text-[#4B5563]">Train smarter. Progress with purpose.</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function StrengthPreview({ data, accentColor }: { data: StrengthProgressCardData; accentColor: string }) {
  const change = data.afterValue - data.beforeValue
  const changePercent = data.beforeValue > 0 ? Math.round((change / data.beforeValue) * 100) : 0
  const isImprovement = change > 0

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] text-[#6B7280] uppercase">Before</p>
          <p className="text-2xl font-bold text-[#A4ACB8]">
            {data.beforeValue > 0 ? `${data.unit === 'lbs' ? '+' : ''}${data.beforeValue}` : '—'}
          </p>
        </div>
        <ChevronRight className="w-6 h-6 text-[#4B5563]" />
        <div className="text-right">
          <p className="text-[10px] text-[#6B7280] uppercase">Now</p>
          <p className="text-3xl font-bold" style={{ color: accentColor }}>
            {data.unit === 'lbs' ? '+' : ''}{data.afterValue}
            <span className="text-sm text-[#6B7280] ml-1">{data.unit}</span>
          </p>
        </div>
      </div>
      {data.beforeValue > 0 && (
        <div className="text-center">
          <span className={`text-sm font-semibold ${isImprovement ? 'text-green-400' : 'text-red-400'}`}>
            {isImprovement ? '+' : ''}{change} {data.unit} ({isImprovement ? '+' : ''}{changePercent}%)
          </span>
        </div>
      )}
    </div>
  )
}

function SkillPreview({ data, accentColor }: { data: SkillProgressCardData; accentColor: string }) {
  const totalLevels = 5
  const currentLevel = data.afterIndex !== undefined ? data.afterIndex : 2

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] text-[#6B7280] uppercase">From</p>
          <p className="text-xl font-bold text-[#A4ACB8]">{data.beforeLevel}</p>
        </div>
        <ChevronRight className="w-6 h-6 text-[#4B5563]" />
        <div className="text-right">
          <p className="text-[10px] text-[#6B7280] uppercase">To</p>
          <p className="text-2xl font-bold" style={{ color: accentColor }}>{data.afterLevel}</p>
        </div>
      </div>
      <div className="flex justify-center gap-2 pt-2">
        {Array.from({ length: totalLevels }).map((_, i) => (
          <div 
            key={i}
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: i <= currentLevel ? accentColor : '#2B313A' }}
          />
        ))}
      </div>
      <p className="text-xs text-[#6B7280] text-center">
        Level {currentLevel + 1} of {totalLevels}
      </p>
    </div>
  )
}

function SpartanScorePreview({ data }: { data: SpartanScoreCardData }) {
  const levelColor = data.levelColor
  const change = data.beforeScore ? data.afterScore - data.beforeScore : 0

  return (
    <div className="space-y-3">
      {data.beforeScore && data.beforeScore > 0 ? (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-[#6B7280] uppercase">From</p>
            <p className="text-2xl font-bold text-[#A4ACB8]">{data.beforeScore}</p>
          </div>
          <ChevronRight className="w-6 h-6 text-[#4B5563]" />
          <div className="text-right">
            <p className="text-[10px] text-[#6B7280] uppercase">Now</p>
            <p className="text-4xl font-bold" style={{ color: levelColor }}>{data.afterScore}</p>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-5xl font-bold" style={{ color: levelColor }}>{data.afterScore}</p>
        </div>
      )}
      <p className="text-base font-semibold text-[#E6E9EF] text-center">{data.level}</p>
      {change !== 0 && (
        <p className={`text-sm font-medium text-center ${change > 0 ? 'text-green-400' : 'text-red-400'}`}>
          {change > 0 ? '+' : ''}{change} points
        </p>
      )}
    </div>
  )
}

function ConsistencyPreview({ data, accentColor }: { data: ConsistencyCardData; accentColor: string }) {
  return (
    <div className="space-y-2 text-center">
      {data.streak && data.streak > 0 ? (
        <>
          <div className="flex items-center justify-center gap-2">
            <Flame className="w-6 h-6" style={{ color: accentColor }} />
            <p className="text-4xl font-bold" style={{ color: accentColor }}>{data.streak}</p>
          </div>
          <p className="text-sm font-semibold text-[#E6E9EF]">DAY STREAK</p>
          <p className="text-xs text-[#6B7280]">Keep the momentum going</p>
        </>
      ) : (
        <>
          <div className="flex items-center justify-center gap-2">
            <Calendar className="w-5 h-5" style={{ color: accentColor }} />
            <p className="text-4xl font-bold" style={{ color: accentColor }}>{data.workoutsThisMonth}</p>
          </div>
          <p className="text-sm font-semibold text-[#E6E9EF]">WORKOUTS IN {data.monthName.toUpperCase()}</p>
          <p className="text-xs text-[#6B7280]">Consistent training builds results</p>
        </>
      )}
    </div>
  )
}

// =============================================================================
// SHARE BUTTON COMPONENT
// =============================================================================

interface ShareProgressButtonProps {
  data: ShareCardData
  variant?: 'default' | 'compact' | 'icon'
  className?: string
}

export function ShareProgressButton({ data, variant = 'default', className = '' }: ShareProgressButtonProps) {
  const [showModal, setShowModal] = useState(false)

  // Don't show if no valid data
  if (!hasValidData(data)) return null

  if (variant === 'icon') {
    return (
      <>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowModal(true)}
          className={`text-[#A4ACB8] hover:text-[#E6E9EF] ${className}`}
        >
          <Share2 className="w-4 h-4" />
        </Button>
        {showModal && <ShareProgressModal data={data} onClose={() => setShowModal(false)} />}
      </>
    )
  }

  if (variant === 'compact') {
    return (
      <>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowModal(true)}
          className={`text-[#A4ACB8] hover:text-[#E6E9EF] gap-1.5 text-xs ${className}`}
        >
          <Share2 className="w-3.5 h-3.5" />
          Share
        </Button>
        {showModal && <ShareProgressModal data={data} onClose={() => setShowModal(false)} />}
      </>
    )
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowModal(true)}
        className={`text-[#A4ACB8] hover:text-[#E6E9EF] gap-2 ${className}`}
      >
        <Share2 className="w-4 h-4" />
        Share Progress
      </Button>
      {showModal && <ShareProgressModal data={data} onClose={() => setShowModal(false)} />}
    </>
  )
}

// =============================================================================
// EMPTY STATE
// =============================================================================

export function ShareCardsEmptyState() {
  return (
    <div className="text-center py-8 px-4">
      <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#1A1F26] border border-[#2B313A] flex items-center justify-center">
        <Trophy className="w-6 h-6 text-[#6B7280]" />
      </div>
      <h3 className="text-sm font-semibold text-[#E6E9EF] mb-1">No Progress Cards Yet</h3>
      <p className="text-xs text-[#A4ACB8] max-w-xs mx-auto">
        Log more workouts and track your progress to unlock shareable progress cards.
      </p>
    </div>
  )
}

// =============================================================================
// PROGRESS CARDS SECTION (for dashboard integration)
// =============================================================================

interface ProgressCardsSectionProps {
  strengthData?: StrengthProgressCardData
  skillData?: SkillProgressCardData
  spartanScoreData?: SpartanScoreCardData
  consistencyData?: ConsistencyCardData
}

export function ProgressCardsSection({
  strengthData,
  skillData,
  spartanScoreData,
  consistencyData
}: ProgressCardsSectionProps) {
  const availableCards = [
    strengthData,
    skillData,
    spartanScoreData,
    consistencyData
  ].filter((card): card is ShareCardData => card !== undefined && hasValidData(card))

  if (availableCards.length === 0) {
    return <ShareCardsEmptyState />
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#E6E9EF]">Share Your Progress</h3>
        <span className="text-xs text-[#6B7280]">{availableCards.length} card{availableCards.length !== 1 ? 's' : ''} available</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {availableCards.map((card, index) => (
          <ShareableCardTile key={index} data={card} />
        ))}
      </div>
    </div>
  )
}

function ShareableCardTile({ data }: { data: ShareCardData }) {
  const [showModal, setShowModal] = useState(false)

  const getIcon = () => {
    switch (data.type) {
      case 'strength': return <Dumbbell className="w-4 h-4" />
      case 'skill': return <Target className="w-4 h-4" />
      case 'spartan_score': return <TrendingUp className="w-4 h-4" />
      case 'consistency': return <Calendar className="w-4 h-4" />
    }
  }

  const getLabel = () => {
    switch (data.type) {
      case 'strength': return (data as StrengthProgressCardData).exerciseName
      case 'skill': return (data as SkillProgressCardData).skillName
      case 'spartan_score': return 'Spartan Score'
      case 'consistency': return 'Consistency'
    }
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 p-3 bg-[#1A1F26] hover:bg-[#1A1F26]/80 rounded-lg border border-[#2B313A] hover:border-[#3A3A3A] transition-colors text-left"
      >
        <div className="w-8 h-8 rounded-lg bg-[#0F1115] flex items-center justify-center text-[#C1121F]">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-[#A4ACB8] truncate">{getLabel()}</p>
          <p className="text-[10px] text-[#6B7280]">Tap to share</p>
        </div>
        <Share2 className="w-3.5 h-3.5 text-[#6B7280]" />
      </button>
      {showModal && <ShareProgressModal data={data} onClose={() => setShowModal(false)} />}
    </>
  )
}
