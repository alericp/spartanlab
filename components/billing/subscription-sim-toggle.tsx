'use client'

/**
 * Subscription Simulation Toggle
 * 
 * Owner-only control for testing Free/Pro states.
 * Small, discreet, bottom-positioned.
 */

import { useState, useEffect } from 'react'
import { isOwnerAccount } from '@/lib/feature-access'
import { 
  getSimulationMode, 
  setSimulationMode, 
  type SimulationMode 
} from '@/lib/billing/subscription-simulation'
import { cn } from '@/lib/utils'
import { FlaskConical } from 'lucide-react'

export function SubscriptionSimToggle() {
  const [isOwner, setIsOwner] = useState(false)
  const [mode, setMode] = useState<SimulationMode>('off')
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    // Check owner status
    const ownerStatus = isOwnerAccount()
    setIsOwner(ownerStatus)
    
    if (ownerStatus) {
      setMode(getSimulationMode())
    }
    
    // Listen for simulation changes
    const handleChange = (e: CustomEvent<{ mode: SimulationMode }>) => {
      setMode(e.detail.mode)
    }
    
    window.addEventListener('simulation-changed', handleChange as EventListener)
    return () => {
      window.removeEventListener('simulation-changed', handleChange as EventListener)
    }
  }, [])

  // Only render for owner
  if (!isOwner) return null

  const handleModeChange = (newMode: SimulationMode) => {
    setSimulationMode(newMode)
    setMode(newMode)
    // Refresh page to apply new state
    window.location.reload()
  }

  const getModeLabel = () => {
    switch (mode) {
      case 'free': return 'Free'
      case 'pro': return 'Pro'
      default: return 'Real'
    }
  }

  const getModeColor = () => {
    switch (mode) {
      case 'free': return 'bg-zinc-600'
      case 'pro': return 'bg-amber-600'
      default: return 'bg-zinc-700'
    }
  }

  return (
    <div className="fixed bottom-20 right-4 z-50 md:bottom-4">
      {/* Expanded panel */}
      {isExpanded && (
        <div className="mb-2 bg-zinc-900 border border-zinc-700 rounded-lg p-3 shadow-lg min-w-[140px]">
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2 font-medium">
            Test Mode
          </div>
          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => handleModeChange('off')}
              className={cn(
                "px-3 py-1.5 rounded text-xs font-medium transition-colors text-left",
                mode === 'off' 
                  ? "bg-zinc-700 text-white" 
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              )}
            >
              Real State
            </button>
            <button
              onClick={() => handleModeChange('free')}
              className={cn(
                "px-3 py-1.5 rounded text-xs font-medium transition-colors text-left",
                mode === 'free' 
                  ? "bg-zinc-600 text-white" 
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              )}
            >
              Sim: Free
            </button>
            <button
              onClick={() => handleModeChange('pro')}
              className={cn(
                "px-3 py-1.5 rounded text-xs font-medium transition-colors text-left",
                mode === 'pro' 
                  ? "bg-amber-600 text-white" 
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              )}
            >
              Sim: Pro
            </button>
          </div>
        </div>
      )}

      {/* Toggle pill */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium",
          "shadow-lg border border-zinc-700 transition-all",
          getModeColor(),
          "text-white hover:opacity-90"
        )}
      >
        <FlaskConical className="w-3 h-3" />
        <span>{getModeLabel()}</span>
      </button>
    </div>
  )
}
