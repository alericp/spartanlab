'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

export type TimerStatus = 'idle' | 'running' | 'paused' | 'complete'

export interface RestTimerState {
  timeRemaining: number
  totalTime: number
  status: TimerStatus
  progress: number // 0-100 percentage complete
}

export interface RestTimerControls {
  start: () => void
  pause: () => void
  resume: () => void
  reset: () => void
  restart: () => void
  setTime: (seconds: number) => void
  applyNewTime: (seconds: number) => void // Apply adjusted time without resetting status
  skip: () => void
}

export interface UseRestTimerReturn extends RestTimerState, RestTimerControls {
  formattedTime: string
  isActive: boolean
  isComplete: boolean
}

/**
 * Custom hook for managing workout rest timers
 * Supports start, pause, resume, reset, and auto-fill from prescribed rest time
 */
export function useRestTimer(initialSeconds: number = 0): UseRestTimerReturn {
  const [timeRemaining, setTimeRemaining] = useState(initialSeconds)
  const [totalTime, setTotalTime] = useState(initialSeconds)
  const [status, setStatus] = useState<TimerStatus>('idle')
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastTickRef = useRef<number>(Date.now())

  // Clear interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  // Timer countdown effect using wall clock for accuracy
  useEffect(() => {
    if (status !== 'running') {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    lastTickRef.current = Date.now()
    
    intervalRef.current = setInterval(() => {
      const now = Date.now()
      const elapsed = Math.floor((now - lastTickRef.current) / 1000)
      
      if (elapsed >= 1) {
        lastTickRef.current = now
        setTimeRemaining((prev) => {
          const newTime = Math.max(0, prev - elapsed)
          if (newTime === 0) {
            setStatus('complete')
          }
          return newTime
        })
      }
    }, 100) // Check frequently for accuracy

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [status])

  // Format time as MM:SS
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, [])

  // Start timer from current time
  const start = useCallback(() => {
    if (timeRemaining > 0) {
      setStatus('running')
    }
  }, [timeRemaining])

  // Pause the timer
  const pause = useCallback(() => {
    if (status === 'running') {
      setStatus('paused')
    }
  }, [status])

  // Resume from paused state
  const resume = useCallback(() => {
    if (status === 'paused' && timeRemaining > 0) {
      setStatus('running')
    }
  }, [status, timeRemaining])

  // Reset to original time
  const reset = useCallback(() => {
    setTimeRemaining(totalTime)
    setStatus('idle')
  }, [totalTime])

  // Restart timer (reset + start)
  const restart = useCallback(() => {
    setTimeRemaining(totalTime)
    setStatus('running')
  }, [totalTime])

  // Set new time (also resets the total)
  const setTime = useCallback((seconds: number) => {
    setTimeRemaining(seconds)
    setTotalTime(seconds)
    setStatus('idle')
  }, [])

  // Apply new adjusted time - updates time but preserves idle status
  // Used when RPE adjustment updates the recommended rest before timer starts
  const applyNewTime = useCallback((seconds: number) => {
    if (status === 'idle') {
      setTimeRemaining(seconds)
      setTotalTime(seconds)
    }
  }, [status])

  // Skip rest (set to complete)
  const skip = useCallback(() => {
    setTimeRemaining(0)
    setStatus('complete')
  }, [])

  // Calculate progress percentage
  const progress = totalTime > 0 ? ((totalTime - timeRemaining) / totalTime) * 100 : 0

  return {
    // State
    timeRemaining,
    totalTime,
    status,
    progress,
    formattedTime: formatTime(timeRemaining),
    isActive: status === 'running' || status === 'paused',
    isComplete: status === 'complete',
    // Controls
    start,
    pause,
    resume,
    reset,
    restart,
    setTime,
    applyNewTime,
    skip,
  }
}

/**
 * Format seconds to MM:SS display string
 */
export function formatRestTimeDisplay(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}
