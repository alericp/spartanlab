'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Beaker } from 'lucide-react'
import { cn } from '@/lib/utils'
import { isOwnerAccount } from '@/lib/feature-access'
import { 
  getSimulationMode, 
  setSimulationMode, 
  type SimulationMode,
  getRealSubscriptionStatus,
} from '@/lib/billing/subscription-status'

/**
 * Owner Simulation Toggle
 * 
 * A small, discreet bottom-screen control visible only to the Platform Owner.
 * Allows testing Free/Pro states without modifying real billing data.
 */
export function OwnerSimulationToggle() {
  const [isOwner, setIsOwner] = useState(false)
  const [mode, setMode] = useState<SimulationMode>('off')
  const [realStatus, setRealStatus] = useState<string>('free')
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
    setIsOwner(isOwnerAccount())
    setMode(getSimulationMode())
    setRealStatus(getRealSubscriptionStatus())
    
    // Listen for simulation changes from other tabs/components
    const handleChange = (e: CustomEvent<SimulationMode>) => {
      setMode(e.detail)
    }
    
    window.addEventListener('simulation-mode-changed', handleChange as EventListener)
    return () => {
      window.removeEventListener('simulation-mode-changed', handleChange as EventListener)
    }
  }, [])
  
  // Only render for owner
  if (!mounted || !isOwner) return null
  
  const handleModeChange = (newMode: SimulationMode) => {
    setSimulationMode(newMode)
    setMode(newMode)
    // Force page refresh to update all feature gating
    window.location.reload()
  }
  
  const isActive = mode !== 'off'
  
  return (
    <div 
      className={cn(
        "fixed bottom-20 left-1/2 -translate-x-1/2 z-50",
        "flex items-center gap-1 px-2 py-1 rounded-full",
        "border shadow-lg backdrop-blur-sm transition-all",
        // Subtle styling - not distracting
        isActive 
          ? "bg-amber-950/90 border-amber-700/50" 
          : "bg-[#1A1A1A]/90 border-[#3A3A3A]/50",
        // Mobile-friendly sizing
        "text-xs sm:text-sm"
      )}
    >
      {/* Indicator icon */}
      <Beaker className={cn(
        "w-3 h-3 sm:w-3.5 sm:h-3.5",
        isActive ? "text-amber-400" : "text-[#6B7280]"
      )} />
      
      {/* Label */}
      <span className={cn(
        "font-medium mr-1",
        isActive ? "text-amber-300" : "text-[#6B7280]"
      )}>
        Sim:
      </span>
      
      {/* Mode buttons */}
      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleModeChange('off')}
          className={cn(
            "h-5 px-1.5 text-[10px] sm:text-xs rounded-l-full rounded-r-none",
            mode === 'off' 
              ? "bg-[#2A2A2A] text-[#F5F5F5]" 
              : "text-[#6B7280] hover:text-[#A5A5A5] hover:bg-transparent"
          )}
        >
          Off
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleModeChange('free')}
          className={cn(
            "h-5 px-1.5 text-[10px] sm:text-xs rounded-none",
            mode === 'free' 
              ? "bg-[#2A2A2A] text-[#F5F5F5]" 
              : "text-[#6B7280] hover:text-[#A5A5A5] hover:bg-transparent"
          )}
        >
          Free
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleModeChange('pro')}
          className={cn(
            "h-5 px-1.5 text-[10px] sm:text-xs rounded-r-full rounded-l-none",
            mode === 'pro' 
              ? "bg-amber-600/80 text-amber-100" 
              : "text-[#6B7280] hover:text-[#A5A5A5] hover:bg-transparent"
          )}
        >
          Pro
        </Button>
      </div>
      
      {/* Real status indicator (subtle) */}
      {isActive && (
        <span className="text-[9px] sm:text-[10px] text-[#6B7280] ml-1 hidden sm:inline">
          (real: {realStatus})
        </span>
      )}
    </div>
  )
}
