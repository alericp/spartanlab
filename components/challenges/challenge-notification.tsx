'use client'

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { type ChallengeDefinition } from '@/lib/challenges/challenge-definitions'
import { Trophy, X, Sparkles } from 'lucide-react'

// =============================================================================
// GLOBAL NOTIFICATION QUEUE
// =============================================================================

interface QueuedChallenge {
  challenge: ChallengeDefinition
  id: string
}

let notificationQueue: QueuedChallenge[] = []
let notifyListeners: (() => void)[] = []

function addToQueue(challenge: ChallengeDefinition) {
  const id = `${challenge.id}-${Date.now()}`
  notificationQueue.push({ challenge, id })
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
 * Show challenge completion notification
 */
export function showChallengeNotification(challenge: ChallengeDefinition) {
  addToQueue(challenge)
}

/**
 * Show multiple challenge notifications
 */
export function showChallengeNotifications(challenges: ChallengeDefinition[]) {
  challenges.forEach((challenge, index) => {
    setTimeout(() => addToQueue(challenge), index * 500)
  })
}

// =============================================================================
// SINGLE NOTIFICATION TOAST
// =============================================================================

interface ChallengeToastProps {
  challenge: ChallengeDefinition
  onDismiss: () => void
}

function ChallengeToast({ challenge, onDismiss }: ChallengeToastProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  
  useEffect(() => {
    const enterTimer = setTimeout(() => setIsVisible(true), 50)
    const dismissTimer = setTimeout(() => handleDismiss(), 6000)
    
    return () => {
      clearTimeout(enterTimer)
      clearTimeout(dismissTimer)
    }
  }, [])
  
  const handleDismiss = useCallback(() => {
    setIsExiting(true)
    setTimeout(() => onDismiss(), 300)
  }, [onDismiss])
  
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl bg-[#1A1D23] border border-amber-500/30 shadow-2xl',
        'transition-all duration-300 ease-out',
        isVisible && !isExiting
          ? 'translate-x-0 opacity-100'
          : 'translate-x-full opacity-0'
      )}
    >
      {/* Animated gradient border */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-amber-500/20 via-yellow-400/10 to-amber-500/20 animate-pulse" />
      
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
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-amber-400 text-xs font-semibold uppercase tracking-wider">
            Challenge Complete
          </span>
        </div>
        
        {/* Content */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/30 to-amber-600/20 flex items-center justify-center border border-amber-500/30">
            <Trophy className="w-6 h-6 text-amber-400" />
          </div>
          
          <div className="flex-1 min-w-0 pr-4">
            <h3 className="font-semibold text-[#E6E9EF] mb-0.5">
              {challenge.name}
            </h3>
            <p className="text-sm text-[#9CA3AF]">
              {challenge.reward.rewardName}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-amber-400 font-medium">
                +{challenge.reward.pointBonus} points
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// NOTIFICATION CONTAINER
// =============================================================================

export function ChallengeNotificationContainer() {
  const [queue, setQueue] = useState<QueuedChallenge[]>([])
  
  useEffect(() => {
    setQueue([...notificationQueue])
    const unsubscribe = subscribe(() => setQueue([...notificationQueue]))
    return unsubscribe
  }, [])
  
  const handleDismiss = useCallback((id: string) => {
    removeFromQueue(id)
  }, [])
  
  if (queue.length === 0) return null
  
  const current = queue[0]
  
  return (
    <div className="fixed bottom-20 right-4 z-50 w-80 sm:w-96">
      <ChallengeToast
        key={current.id}
        challenge={current.challenge}
        onDismiss={() => handleDismiss(current.id)}
      />
    </div>
  )
}
