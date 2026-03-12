'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Share2, Download, X, Check } from 'lucide-react'
import { StrengthScoreBreakdown, getLevelColor } from '@/lib/strength-score-engine'
import { SpartanIcon } from '@/components/brand/SpartanLogo'

interface ScoreShareCardProps {
  score: StrengthScoreBreakdown
  limiterLabel?: string
}

export function ScoreShareCard({ score, limiterLabel }: ScoreShareCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const levelColor = getLevelColor(score.level)

  const generateShareImage = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return null

    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    // Set canvas dimensions (optimized for social sharing)
    const width = 600
    const height = 400
    canvas.width = width
    canvas.height = height

    // Background
    ctx.fillStyle = '#0F1115'
    ctx.fillRect(0, 0, width, height)

    // Subtle gradient overlay
    const gradient = ctx.createLinearGradient(0, 0, width, height)
    gradient.addColorStop(0, 'rgba(193, 18, 31, 0.1)')
    gradient.addColorStop(1, 'rgba(15, 17, 21, 0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    // Left accent line
    ctx.fillStyle = levelColor
    ctx.fillRect(0, 0, 4, height)

    // Top section - Label
    ctx.font = '500 12px Inter, system-ui, sans-serif'
    ctx.fillStyle = '#A4ACB8'
    ctx.textAlign = 'left'
    ctx.fillText('SPARTAN STRENGTH SCORE', 40, 50)

    // Main score
    ctx.font = 'bold 96px Inter, system-ui, sans-serif'
    ctx.fillStyle = levelColor
    ctx.fillText(score.totalScore.toString(), 40, 150)

    // Level badge
    ctx.font = 'bold 24px Inter, system-ui, sans-serif'
    ctx.fillStyle = '#E6E9EF'
    ctx.fillText(score.level, 40, 190)

    // Divider line
    ctx.strokeStyle = '#2B313A'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(40, 220)
    ctx.lineTo(width - 40, 220)
    ctx.stroke()

    // Score breakdown section
    const breakdownY = 260
    const components = [
      { label: 'Skills', value: score.skillScore },
      { label: 'Strength', value: score.strengthScore },
      { label: 'Readiness', value: score.readinessScore },
      { label: 'Consistency', value: score.consistencyScore },
    ]

    const colWidth = (width - 80) / 4
    components.forEach((comp, i) => {
      const x = 40 + (colWidth * i)
      
      // Label
      ctx.font = '500 11px Inter, system-ui, sans-serif'
      ctx.fillStyle = '#6B7280'
      ctx.textAlign = 'left'
      ctx.fillText(comp.label.toUpperCase(), x, breakdownY)
      
      // Value
      ctx.font = 'bold 28px Inter, system-ui, sans-serif'
      ctx.fillStyle = comp.value >= 60 ? '#4ADE80' : comp.value >= 40 ? '#60A5FA' : '#A4ACB8'
      ctx.fillText(comp.value.toString(), x, breakdownY + 32)
    })

    // Primary limiter (if provided)
    if (limiterLabel) {
      ctx.font = '500 11px Inter, system-ui, sans-serif'
      ctx.fillStyle = '#6B7280'
      ctx.textAlign = 'left'
      ctx.fillText('PRIMARY LIMITER', 40, 330)
      
      ctx.font = '600 14px Inter, system-ui, sans-serif'
      ctx.fillStyle = '#C1121F'
      ctx.fillText(limiterLabel, 40, 350)
    }

    // Branding
    ctx.font = 'bold 14px Inter, system-ui, sans-serif'
    ctx.fillStyle = '#E6E9EF'
    ctx.textAlign = 'right'
    ctx.fillText('SpartanLab', width - 40, height - 30)
    
    ctx.font = '500 11px Inter, system-ui, sans-serif'
    ctx.fillStyle = '#6B7280'
    ctx.fillText('spartanlab.app', width - 40, height - 12)

    return canvas.toDataURL('image/png')
  }, [score, limiterLabel, levelColor])

  const handleDownload = useCallback(() => {
    const dataUrl = generateShareImage()
    if (!dataUrl) return

    const link = document.createElement('a')
    link.download = `spartan-score-${score.totalScore}.png`
    link.href = dataUrl
    link.click()
  }, [generateShareImage, score.totalScore])

  const handleCopyToClipboard = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) return

    generateShareImage()
    
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
      // Fallback: just download if clipboard fails
      handleDownload()
    }
  }, [generateShareImage, handleDownload])

  if (!score.hasEnoughData) return null

  return (
    <>
      {/* Share Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="text-[#A4ACB8] hover:text-[#E6E9EF] gap-2"
      >
        <Share2 className="w-4 h-4" />
        Share Score
      </Button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <Card className="bg-[#1A1F26] border-[#2B313A] w-full max-w-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#2B313A]">
              <div className="flex items-center gap-3">
                <SpartanIcon size={24} />
                <h3 className="font-semibold text-[#E6E9EF]">Share Your Score</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-[#A4ACB8] hover:text-[#E6E9EF]"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Preview */}
            <div className="p-6">
              {/* Visual Preview Card */}
              <div className="bg-[#0F1115] rounded-lg p-6 border border-[#2B313A] mb-6">
                {/* Left accent */}
                <div className="flex">
                  <div 
                    className="w-1 rounded-full mr-5 self-stretch"
                    style={{ backgroundColor: levelColor }}
                  />
                  
                  <div className="flex-1 space-y-5">
                    {/* Header */}
                    <p className="text-xs text-[#A4ACB8] uppercase tracking-wider">
                      Spartan Strength Score
                    </p>
                    
                    {/* Score */}
                    <div className="flex items-baseline gap-3">
                      <span 
                        className="text-6xl font-bold tabular-nums"
                        style={{ color: levelColor }}
                      >
                        {score.totalScore}
                      </span>
                      <span className="text-xl font-semibold text-[#E6E9EF]">
                        {score.level}
                      </span>
                    </div>

                    {/* Breakdown */}
                    <div className="grid grid-cols-4 gap-4 pt-4 border-t border-[#2B313A]">
                      {[
                        { label: 'Skills', value: score.skillScore },
                        { label: 'Strength', value: score.strengthScore },
                        { label: 'Readiness', value: score.readinessScore },
                        { label: 'Consistency', value: score.consistencyScore },
                      ].map((item) => (
                        <div key={item.label}>
                          <p className="text-[10px] text-[#6B7280] uppercase tracking-wider mb-1">
                            {item.label}
                          </p>
                          <p className={`text-xl font-bold ${
                            item.value >= 60 ? 'text-green-400' : 
                            item.value >= 40 ? 'text-blue-400' : 'text-[#A4ACB8]'
                          }`}>
                            {item.value}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Limiter */}
                    {limiterLabel && (
                      <div className="pt-4">
                        <p className="text-[10px] text-[#6B7280] uppercase tracking-wider mb-1">
                          Primary Limiter
                        </p>
                        <p className="text-sm font-medium text-[#C1121F]">
                          {limiterLabel}
                        </p>
                      </div>
                    )}

                    {/* Branding */}
                    <div className="flex items-center justify-between pt-4 border-t border-[#2B313A]">
                      <div className="flex items-center gap-2">
                        <SpartanIcon size={20} />
                        <span className="text-sm font-semibold text-[#E6E9EF]">SpartanLab</span>
                      </div>
                      <span className="text-xs text-[#6B7280]">spartanlab.app</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={handleDownload}
                  className="flex-1 bg-[#C1121F] hover:bg-[#A30F1A] text-white gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Image
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCopyToClipboard}
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
                      Copy to Clipboard
                    </>
                  )}
                </Button>
              </div>

              <p className="text-xs text-[#6B7280] text-center mt-4">
                Share your training progress on social media
              </p>
            </div>
          </Card>

          {/* Hidden canvas for image generation */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}
    </>
  )
}

// Compact share button for inline use
export function ShareScoreButton({ score, limiterLabel }: ScoreShareCardProps) {
  const [showModal, setShowModal] = useState(false)
  
  if (!score.hasEnoughData) return null
  
  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowModal(true)}
        className="text-[#A4ACB8] hover:text-[#E6E9EF] gap-2"
      >
        <Share2 className="w-4 h-4" />
        Share
      </Button>
      
      {showModal && (
        <ScoreShareModal 
          score={score} 
          limiterLabel={limiterLabel}
          onClose={() => setShowModal(false)} 
        />
      )}
    </>
  )
}

// Standalone modal component
function ScoreShareModal({ 
  score, 
  limiterLabel,
  onClose 
}: ScoreShareCardProps & { onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [copied, setCopied] = useState(false)
  const levelColor = getLevelColor(score.level)

  const generateShareImage = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return null

    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    const width = 600
    const height = 400
    canvas.width = width
    canvas.height = height

    // Background
    ctx.fillStyle = '#0F1115'
    ctx.fillRect(0, 0, width, height)

    // Gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height)
    gradient.addColorStop(0, 'rgba(193, 18, 31, 0.1)')
    gradient.addColorStop(1, 'rgba(15, 17, 21, 0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    // Accent line
    ctx.fillStyle = levelColor
    ctx.fillRect(0, 0, 4, height)

    // Label
    ctx.font = '500 12px system-ui, sans-serif'
    ctx.fillStyle = '#A4ACB8'
    ctx.textAlign = 'left'
    ctx.fillText('SPARTAN STRENGTH SCORE', 40, 50)

    // Score
    ctx.font = 'bold 96px system-ui, sans-serif'
    ctx.fillStyle = levelColor
    ctx.fillText(score.totalScore.toString(), 40, 150)

    // Level
    ctx.font = 'bold 24px system-ui, sans-serif'
    ctx.fillStyle = '#E6E9EF'
    ctx.fillText(score.level, 40, 190)

    // Divider
    ctx.strokeStyle = '#2B313A'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(40, 220)
    ctx.lineTo(width - 40, 220)
    ctx.stroke()

    // Breakdown
    const breakdownY = 260
    const components = [
      { label: 'Skills', value: score.skillScore },
      { label: 'Strength', value: score.strengthScore },
      { label: 'Readiness', value: score.readinessScore },
      { label: 'Consistency', value: score.consistencyScore },
    ]

    const colWidth = (width - 80) / 4
    components.forEach((comp, i) => {
      const x = 40 + (colWidth * i)
      ctx.font = '500 11px system-ui, sans-serif'
      ctx.fillStyle = '#6B7280'
      ctx.textAlign = 'left'
      ctx.fillText(comp.label.toUpperCase(), x, breakdownY)
      
      ctx.font = 'bold 28px system-ui, sans-serif'
      ctx.fillStyle = comp.value >= 60 ? '#4ADE80' : comp.value >= 40 ? '#60A5FA' : '#A4ACB8'
      ctx.fillText(comp.value.toString(), x, breakdownY + 32)
    })

    // Limiter
    if (limiterLabel) {
      ctx.font = '500 11px system-ui, sans-serif'
      ctx.fillStyle = '#6B7280'
      ctx.textAlign = 'left'
      ctx.fillText('PRIMARY LIMITER', 40, 330)
      
      ctx.font = '600 14px system-ui, sans-serif'
      ctx.fillStyle = '#C1121F'
      ctx.fillText(limiterLabel, 40, 350)
    }

    // Branding
    ctx.font = 'bold 14px system-ui, sans-serif'
    ctx.fillStyle = '#E6E9EF'
    ctx.textAlign = 'right'
    ctx.fillText('SpartanLab', width - 40, height - 30)
    
    ctx.font = '500 11px system-ui, sans-serif'
    ctx.fillStyle = '#6B7280'
    ctx.fillText('spartanlab.app', width - 40, height - 12)

    return canvas.toDataURL('image/png')
  }, [score, limiterLabel, levelColor])

  const handleDownload = useCallback(() => {
    const dataUrl = generateShareImage()
    if (!dataUrl) return

    const link = document.createElement('a')
    link.download = `spartan-score-${score.totalScore}.png`
    link.href = dataUrl
    link.click()
  }, [generateShareImage, score.totalScore])

  const handleCopy = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) return

    generateShareImage()
    
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
  }, [generateShareImage, handleDownload])

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <Card 
        className="bg-[#1A1F26] border-[#2B313A] w-full max-w-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-[#2B313A]">
          <div className="flex items-center gap-3">
            <SpartanIcon size={24} />
            <h3 className="font-semibold text-[#E6E9EF]">Share Your Score</h3>
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

        <div className="p-6">
          {/* Preview */}
          <div className="bg-[#0F1115] rounded-lg p-6 border border-[#2B313A] mb-6">
            <div className="flex">
              <div 
                className="w-1 rounded-full mr-5 self-stretch"
                style={{ backgroundColor: levelColor }}
              />
              
              <div className="flex-1 space-y-5">
                <p className="text-xs text-[#A4ACB8] uppercase tracking-wider">
                  Spartan Strength Score
                </p>
                
                <div className="flex items-baseline gap-3">
                  <span 
                    className="text-5xl sm:text-6xl font-bold tabular-nums"
                    style={{ color: levelColor }}
                  >
                    {score.totalScore}
                  </span>
                  <span className="text-lg sm:text-xl font-semibold text-[#E6E9EF]">
                    {score.level}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-3 sm:gap-4 pt-4 border-t border-[#2B313A]">
                  {[
                    { label: 'Skills', value: score.skillScore },
                    { label: 'Strength', value: score.strengthScore },
                    { label: 'Readiness', value: score.readinessScore },
                    { label: 'Consistency', value: score.consistencyScore },
                  ].map((item) => (
                    <div key={item.label}>
                      <p className="text-[10px] text-[#6B7280] uppercase tracking-wider mb-1">
                        {item.label}
                      </p>
                      <p className={`text-lg sm:text-xl font-bold ${
                        item.value >= 60 ? 'text-green-400' : 
                        item.value >= 40 ? 'text-blue-400' : 'text-[#A4ACB8]'
                      }`}>
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>

                {limiterLabel && (
                  <div className="pt-4">
                    <p className="text-[10px] text-[#6B7280] uppercase tracking-wider mb-1">
                      Primary Limiter
                    </p>
                    <p className="text-sm font-medium text-[#C1121F]">
                      {limiterLabel}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-[#2B313A]">
                  <div className="flex items-center gap-2">
                    <SpartanIcon size={18} />
                    <span className="text-sm font-semibold text-[#E6E9EF]">SpartanLab</span>
                  </div>
                  <span className="text-xs text-[#6B7280]">spartanlab.app</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleDownload}
              className="flex-1 bg-[#C1121F] hover:bg-[#A30F1A] text-white gap-2"
            >
              <Download className="w-4 h-4" />
              Download
            </Button>
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
            Share your training progress on social media
          </p>
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </Card>
    </div>
  )
}
