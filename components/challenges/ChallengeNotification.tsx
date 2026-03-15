'use client'

import { useState, useEffect } from 'react'
import { Trophy, X, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { type Challenge, CHALLENGE_CATEGORY_LABELS } from '@/lib/challenges/challenge-definitions'
import { popNextChallengeNotification } from '@/lib/challenges/challenge-engine'

export function ChallengeNotification() {
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  
  useEffect(() => {
    // Check for notifications on mount and periodically
    const checkNotifications = () => {
      const next = popNextChallengeNotification()
      if (next) {
        setChallenge(next)
        setIsVisible(true)
        setIsAnimating(true)
        
        // Auto-dismiss after 6 seconds
        setTimeout(() => {
          setIsVisible(false)
        }, 6000)
      }
    }
    
    // Initial check
    const timer = setTimeout(checkNotifications, 1000)
    
    // Periodic check
    const interval = setInterval(checkNotifications, 10000)
    
    return () => {
      clearTimeout(timer)
      clearInterval(interval)
    }
  }, [])
  
  const handleDismiss = () => {
    setIsVisible(false)
  }
  
  if (!challenge || !isVisible) return null
  
  return (
    <div 
      className={`fixed bottom-4 right-4 z-50 max-w-sm transition-all duration-500 ${
        isAnimating ? 'animate-in slide-in-from-bottom-5 fade-in' : ''
      }`}
    >
      <div className="bg-gradient-to-br from-[#1A1F26] to-[#0F1115] border border-amber-500/30 rounded-xl shadow-2xl shadow-amber-500/10 overflow-hidden">
        {/* Shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/5 to-transparent animate-shimmer" />
        
        {/* Content */}
        <div className="relative p-4">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
              <Trophy className="w-6 h-6 text-amber-400" />
            </div>
            
            {/* Text */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-medium text-amber-400 uppercase tracking-wide">
                  Challenge Complete
                </span>
              </div>
              <h3 className="font-semibold text-[#E6E9EF] truncate">
                {challenge.name}
              </h3>
              <p className="text-sm text-[#A4ACB8] mt-0.5">
                {CHALLENGE_CATEGORY_LABELS[challenge.category]} challenge completed
              </p>
              <div className="mt-2 text-xs text-amber-400 font-medium">
                {challenge.reward.label}
              </div>
            </div>
            
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-[#6B7280] hover:text-[#E6E9EF] hover:bg-[#2A2F36] -mt-1 -mr-1"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Progress bar animation */}
        <div className="h-1 bg-[#1A1F26]">
          <div 
            className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-[6000ms] ease-linear"
            style={{ width: isVisible ? '0%' : '100%' }}
          />
        </div>
      </div>
    </div>
  )
}
