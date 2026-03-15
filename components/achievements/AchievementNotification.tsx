'use client'

import { useState, useEffect, useCallback } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AchievementBadge } from './AchievementBadge'
import { 
  popNextNotification, 
  markAchievementSeen,
  hasUnseenAchievements,
} from '@/lib/achievements'
import { type Achievement, TIER_COLORS } from '@/lib/achievements/achievement-definitions'

interface AchievementNotificationProps {
  onDismiss?: () => void
}

export function AchievementNotification({ onDismiss }: AchievementNotificationProps) {
  const [achievement, setAchievement] = useState<Achievement | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimatingOut, setIsAnimatingOut] = useState(false)
  
  const checkForNotifications = useCallback(() => {
    if (!hasUnseenAchievements()) return
    
    const next = popNextNotification()
    if (next) {
      setAchievement(next)
      setIsVisible(true)
      markAchievementSeen(next.id)
    }
  }, [])
  
  // Check for notifications on mount and periodically
  useEffect(() => {
    checkForNotifications()
    
    // Listen for achievement unlock events
    const handleAchievementUnlock = () => {
      setTimeout(checkForNotifications, 100)
    }
    
    window.addEventListener('spartanlab:achievement_unlocked', handleAchievementUnlock)
    
    return () => {
      window.removeEventListener('spartanlab:achievement_unlocked', handleAchievementUnlock)
    }
  }, [checkForNotifications])
  
  const handleDismiss = useCallback(() => {
    setIsAnimatingOut(true)
    setTimeout(() => {
      setIsVisible(false)
      setIsAnimatingOut(false)
      setAchievement(null)
      onDismiss?.()
      
      // Check for more notifications
      setTimeout(checkForNotifications, 500)
    }, 300)
  }, [checkForNotifications, onDismiss])
  
  // Auto-dismiss after 5 seconds
  useEffect(() => {
    if (!isVisible || !achievement) return
    
    const timer = setTimeout(handleDismiss, 5000)
    return () => clearTimeout(timer)
  }, [isVisible, achievement, handleDismiss])
  
  if (!isVisible || !achievement) return null
  
  const tierColors = TIER_COLORS[achievement.tier]
  
  return (
    <div 
      className={cn(
        'fixed bottom-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-300',
        isAnimatingOut 
          ? 'opacity-0 translate-y-4' 
          : 'opacity-100 translate-y-0'
      )}
    >
      <div className={cn(
        'flex items-center gap-4 px-5 py-4 rounded-xl border shadow-xl backdrop-blur-sm',
        'bg-[#1A1F26]/95 border-[#2B313A]',
        tierColors.glow
      )}>
        {/* Badge */}
        <AchievementBadge 
          achievement={achievement} 
          size="md" 
          showName={false}
        />
        
        {/* Content */}
        <div className="flex flex-col min-w-0">
          <span className="text-xs uppercase tracking-wider text-amber-400 font-medium mb-0.5">
            Achievement Unlocked
          </span>
          <span className="text-[#E6E9EF] font-semibold truncate">
            {achievement.name}
          </span>
          <span className="text-xs text-[#6B7280] truncate">
            {achievement.description}
          </span>
        </div>
        
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="p-1.5 rounded-lg hover:bg-[#2B313A] transition-colors text-[#6B7280] hover:text-[#A4ACB8]"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// Hook to trigger achievement check
export function useAchievementCheck() {
  const triggerCheck = useCallback(() => {
    // Dispatch custom event to notify the notification component
    window.dispatchEvent(new CustomEvent('spartanlab:achievement_unlocked'))
  }, [])
  
  return { triggerCheck }
}
