'use client'

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { type AchievementDefinition } from '@/lib/achievements/achievement-definitions'
import { AchievementBadge } from './achievement-badge'
import { X } from 'lucide-react'

// =============================================================================
// TYPES
// =============================================================================

interface QueuedAchievement {
  achievement: AchievementDefinition
  id: string
}

// =============================================================================
// GLOBAL NOTIFICATION QUEUE
// =============================================================================

let notificationQueue: QueuedAchievement[] = []
let notifyListeners: (() => void)[] = []

function addToQueue(achievement: AchievementDefinition) {
  const id = `${achievement.id}-${Date.now()}`
  notificationQueue.push({ achievement, id })
  notifyListeners.forEach(fn => fn())
}

function removeFromQueue(id: string) {
  notificationQueue = notificationQueue.filter(n => n.id !== id)
  notifyListeners.forEach(fn => fn())
}

function subscribe(listener: () => void) {
  notifyListeners.push(listener)
  return () => {
    notifyListeners = notifyListeners.filter(fn => fn !== listener)
  }
}

/**
 * Show achievement unlock notification
 * Call this when an achievement is unlocked
 */
export function showAchievementNotification(achievement: AchievementDefinition) {
  addToQueue(achievement)
}

/**
 * Show multiple achievement notifications
 */
export function showAchievementNotifications(achievements: AchievementDefinition[]) {
  // Stagger the notifications slightly
  achievements.forEach((achievement, index) => {
    setTimeout(() => addToQueue(achievement), index * 300)
  })
}

// =============================================================================
// SINGLE NOTIFICATION TOAST
// =============================================================================

interface AchievementToastProps {
  achievement: AchievementDefinition
  onDismiss: () => void
  className?: string
}

function AchievementToast({ achievement, onDismiss, className }: AchievementToastProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  
  useEffect(() => {
    // Animate in
    const enterTimer = setTimeout(() => setIsVisible(true), 50)
    
    // Auto dismiss after 5 seconds
    const dismissTimer = setTimeout(() => {
      handleDismiss()
    }, 5000)
    
    return () => {
      clearTimeout(enterTimer)
      clearTimeout(dismissTimer)
    }
  }, [])
  
  const handleDismiss = useCallback(() => {
    setIsExiting(true)
    setTimeout(() => {
      onDismiss()
    }, 300)
  }, [onDismiss])
  
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl bg-[#1A1D23] border border-[#2A2F38] shadow-2xl',
        'transition-all duration-300 ease-out',
        isVisible && !isExiting
          ? 'translate-x-0 opacity-100'
          : 'translate-x-full opacity-0',
        className
      )}
    >
      {/* Animated gradient border */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-amber-500/20 via-yellow-400/20 to-amber-500/20 animate-pulse" />
      
      <div className="relative p-4 bg-[#1A1D23]/95 rounded-xl">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 rounded-lg text-[#6B7280] hover:text-[#E6E9EF] hover:bg-[#2A2F38] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-amber-400 text-xs font-semibold uppercase tracking-wider">
            Achievement Unlocked
          </span>
        </div>
        
        {/* Achievement */}
        <div className="flex items-center gap-4">
          <AchievementBadge
            achievement={achievement}
            unlocked={true}
            size="lg"
          />
          
          <div className="flex-1 min-w-0 pr-4">
            <h3 className="font-semibold text-[#E6E9EF] mb-0.5">
              {achievement.name}
            </h3>
            <p className="text-sm text-[#9CA3AF]">
              {achievement.unlockMessage || achievement.description}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-amber-400 font-medium">
                +{achievement.pointValue} points
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// NOTIFICATION CONTAINER - MOUNT IN LAYOUT
// =============================================================================

export function AchievementNotificationContainer() {
  const [queue, setQueue] = useState<QueuedAchievement[]>([])
  
  useEffect(() => {
    // Initial sync
    setQueue([...notificationQueue])
    
    // Subscribe to changes
    const unsubscribe = subscribe(() => {
      setQueue([...notificationQueue])
    })
    
    return unsubscribe
  }, [])
  
  const handleDismiss = useCallback((id: string) => {
    removeFromQueue(id)
  }, [])
  
  if (queue.length === 0) return null
  
  // Only show the first notification (queue processes one at a time)
  const current = queue[0]
  
  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 sm:w-96">
      <AchievementToast
        key={current.id}
        achievement={current.achievement}
        onDismiss={() => handleDismiss(current.id)}
      />
    </div>
  )
}

// =============================================================================
// HOOK FOR COMPONENTS
// =============================================================================

/**
 * Hook to trigger achievement check and show notifications
 */
export function useAchievementNotifications() {
  const showNotifications = useCallback((achievements: AchievementDefinition[]) => {
    showAchievementNotifications(achievements)
  }, [])
  
  const showNotification = useCallback((achievement: AchievementDefinition) => {
    showAchievementNotification(achievement)
  }, [])
  
  return { showNotification, showNotifications }
}
