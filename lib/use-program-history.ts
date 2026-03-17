'use client'

/**
 * Client-side hook for managing program history
 * 
 * Provides easy access to:
 * - Save program to history
 * - Get program history
 * - Get active program
 */

import { useState, useCallback } from 'react'
import type { AdaptiveProgram } from './adaptive-program-builder'
import type { GenerationReason } from './program-history-versioning'
import type { ProgramHistory } from '@/types/history'

interface ProgramHistoryState {
  activeProgram: ProgramHistory | null
  archivedPrograms: ProgramHistory[]
  totalVersions: number
  isLoading: boolean
  error: string | null
}

interface SaveProgramResult {
  success: boolean
  programHistoryId: string | null
  versionNumber: number
  reasonSummary: string
  error?: string
}

/**
 * Hook for program history operations
 */
export function useProgramHistory() {
  const [state, setState] = useState<ProgramHistoryState>({
    activeProgram: null,
    archivedPrograms: [],
    totalVersions: 0,
    isLoading: false,
    error: null,
  })

  /**
   * Fetch program history from API
   */
  const fetchHistory = useCallback(async (): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      const response = await fetch('/api/program/history')
      
      if (!response.ok) {
        throw new Error('Failed to fetch program history')
      }
      
      const data = await response.json()
      
      setState(prev => ({
        ...prev,
        activeProgram: data.activeProgram ?? null,
        archivedPrograms: data.archivedPrograms ?? [],
        totalVersions: data.totalVersions ?? 0,
        isLoading: false,
      }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }))
    }
  }, [])

  /**
   * Save a program to history (creates new version, archives current if exists)
   */
  const saveProgram = useCallback(async (
    program: AdaptiveProgram,
    reason?: GenerationReason,
    isInitial?: boolean
  ): Promise<SaveProgramResult> => {
    try {
      const response = await fetch('/api/program/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          program,
          reason,
          isInitial,
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        return {
          success: false,
          programHistoryId: null,
          versionNumber: 0,
          reasonSummary: '',
          error: errorData.error || 'Failed to save program',
        }
      }
      
      const data = await response.json()
      
      // Refresh history after save
      await fetchHistory()
      
      return {
        success: true,
        programHistoryId: data.programHistoryId,
        versionNumber: data.versionNumber,
        reasonSummary: data.reasonSummary,
      }
    } catch (error) {
      return {
        success: false,
        programHistoryId: null,
        versionNumber: 0,
        reasonSummary: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }, [fetchHistory])

  /**
   * Save the initial program after onboarding
   * Call this after user authentication is confirmed
   */
  const saveInitialProgram = useCallback(async (
    program: AdaptiveProgram
  ): Promise<SaveProgramResult> => {
    return saveProgram(program, 'onboarding_initial_generation', true)
  }, [saveProgram])

  /**
   * Save a new program version (archives current, creates new)
   */
  const saveNewProgramVersion = useCallback(async (
    program: AdaptiveProgram,
    reason: GenerationReason
  ): Promise<SaveProgramResult> => {
    return saveProgram(program, reason, false)
  }, [saveProgram])

  return {
    ...state,
    fetchHistory,
    saveProgram,
    saveInitialProgram,
    saveNewProgramVersion,
  }
}

/**
 * Utility to check if program history should be saved
 * Used to determine if we need to sync localStorage program to database
 */
export async function shouldSyncProgramToHistory(): Promise<boolean> {
  try {
    // Check if we have a program in localStorage
    if (typeof window === 'undefined') return false
    
    const storedProgram = localStorage.getItem('spartanlab_first_program')
    if (!storedProgram) return false
    
    // Check if we already have an active program in history
    const response = await fetch('/api/program/history')
    if (!response.ok) return false
    
    const data = await response.json()
    
    // If no active program in history, we should sync
    return !data.activeProgram
  } catch {
    return false
  }
}

/**
 * Sync localStorage program to database history
 * Call this after user signs in to ensure program is persisted
 */
export async function syncProgramToHistory(): Promise<SaveProgramResult | null> {
  try {
    if (typeof window === 'undefined') return null
    
    const storedProgram = localStorage.getItem('spartanlab_first_program')
    if (!storedProgram) return null
    
    // Check if sync is needed
    const shouldSync = await shouldSyncProgramToHistory()
    if (!shouldSync) return null
    
    const program = JSON.parse(storedProgram)
    
    // Save to history
    const response = await fetch('/api/program/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        program,
        isInitial: true,
      }),
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      return {
        success: false,
        programHistoryId: null,
        versionNumber: 0,
        reasonSummary: '',
        error: errorData.error || 'Failed to sync program',
      }
    }
    
    const data = await response.json()
    return {
      success: true,
      programHistoryId: data.programHistoryId,
      versionNumber: data.versionNumber,
      reasonSummary: data.reasonSummary,
    }
  } catch (error) {
    return {
      success: false,
      programHistoryId: null,
      versionNumber: 0,
      reasonSummary: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
