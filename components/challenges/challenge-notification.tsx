'use client'

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import {
  type Challenge,
  getChallengeById,
} from '@/lib/challenges/challenge-definitions'
import { Trophy, X, Sparkles } from 'lucide-react'

// =============================================================================
// [PRE-AB6 BUILD GREEN GATE / CHALLENGE NOTIFICATION CONTRACT]
// This helper previously typed its queue against ChallengeDefinition (the
// template/source type), but it actually consumes renderable fields like
// `id`, `name`, and `reward.label` that only exist on the hydrated
// `Challenge` type. Worse, every caller (QuickLogModal, WorkoutLogForm,
// useWorkoutSession) feeds it the `string[]` of completed challenge IDs
// returned by `onTrainingEventForChallenges()`, not full objects.
//
// Fix: accept `Challenge | string` per call, resolve IDs through
// `getChallengeById`, store only hydrated Challenge in the queue, and
// render via authoritative `ChallengeReward` fields. No source-type
// weakening, no fake `id?: string` on ChallengeDefinition, no `as any`.
// =============================================================================

export type ChallengeNotificationInput = Challenge | string

interface QueuedChallenge {
  challenge: Challenge
  id: string
}

let notificationQueue: QueuedChallenge[] = []
let notifyListeners: (() => void)[] = []

/**
 * Resolve a `Challenge | string` input into a hydrated Challenge,
 * or null if the ID cannot be matched to an active challenge.
 * Unresolved IDs are silently skipped — the notification queue is
 * a best-effort UI surface, not a source of truth, so a stale or
 * archived ID must not throw or render an empty toast.
 */
function resolveChallenge(input: ChallengeNotificationInput): Challenge | null {
  if (typeof input === 'string') {
    return getChallengeById(input)
  }
  return input
}

function addToQueue(input: ChallengeNotificationInput) {
  const challenge = resolveChallenge(input)
  if (!challenge) return

  const toastId = `${challenge.id}-${Date.now()}`
  notificationQueue.push({ challenge, id: toastId })
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
 * Show challenge completion notification.
 * Accepts either a hydrated Challenge or a challenge ID string.
 */
export function showChallengeNotification(input: ChallengeNotificationInput) {
  addToQueue(input)
}

/**
 * Show multiple challenge notifications.
 * Accepts an array of hydrated Challenges or challenge ID strings —
 * matches the `string[]` return shape of `onTrainingEventForChallenges()`.
 */
export function showChallengeNotifications(inputs: ChallengeNotificationInput[]) {
  inputs.forEach((input, index) => {
    setTimeout(() => addToQueue(input), index * 500)
  })
}

// =============================================================================
// SINGLE NOTIFICATION TOAST
// =============================================================================

interface ChallengeToastProps {
  challenge: Challenge
  onDismiss: () => void
}

/**
 * Format a challenge reward into a short secondary line.
 * Uses ONLY the authoritative ChallengeReward fields:
 * `type`, `value`, `label` (lib/challenges/challenge-definitions.ts:25-29).
 * No invented `rewardName` / `pointBonus` fields.
 */
function formatRewardSecondary(reward: Challenge['reward']): string {
  return reward.label
}

/**
 * Format a small accent line that highlights the reward's quantitative
 * payoff when the reward type carries a numeric meaning. `score_boost`
 * encodes the Spartan Score delta in `reward.value`. Other types
 * (`badge`, `achievement_unlock`) carry an opaque ID in `value`, so
 * surfacing it as `+N points` would be misleading — we suppress.
 */
function formatRewardAccent(reward: Challenge['reward']): string | null {
  if (reward.type === 'score_boost') {
    return `+${reward.value} Spartan Score`
  }
  return null
}

function ChallengeToast({ challenge, onDismiss }: ChallengeToastProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  const handleDismiss = useCallback(() => {
    setIsExiting(true)
    setTimeout(() => onDismiss(), 300)
  }, [onDismiss])

  useEffect(() => {
    const enterTimer = setTimeout(() => setIsVisible(true), 50)
    const dismissTimer = setTimeout(() => handleDismiss(), 6000)

    return () => {
      clearTimeout(enterTimer)
      clearTimeout(dismissTimer)
    }
  }, [handleDismiss])

  const rewardSecondary = formatRewardSecondary(challenge.reward)
  const rewardAccent = formatRewardAccent(challenge.reward)

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
          aria-label="Dismiss challenge notification"
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
              {rewardSecondary}
            </p>
            {rewardAccent && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-amber-400 font-medium">
                  {rewardAccent}
                </span>
              </div>
            )}
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
