'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Beaker, FlaskConical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useOwnerInit } from '@/hooks/useOwnerInit'
import { useEntitlement, setSimulationMode, type SimulationMode } from '@/hooks/useEntitlement'

/**
 * Owner Simulation Toggle
 * 
 * A bottom-right floating control visible only to the Platform Owner.
 * Allows testing Free/Pro states without modifying real billing data.
 * 
 * Uses Clerk auth to reliably detect the owner account.
 * 
 * Position: Bottom-right corner, above mobile nav safe area
 * z-index: 9999 to ensure it's always on top
 */
export function OwnerSimulationToggle() {
  // Initialize owner detection from Clerk user email
  const { isOwner, isLoaded, userEmail } = useOwnerInit()
  // Use the new entitlement hook (database-backed)
  const entitlement = useEntitlement()
  const [mounted, setMounted] = useState(false)
  const [expanded, setExpanded] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Listen for simulation changes from other tabs/components
  useEffect(() => {
    const handleChange = () => {
      // Revalidate entitlement when simulation changes
      entitlement.mutate()
    }
    
    window.addEventListener('entitlement-simulation-changed', handleChange)
    return () => {
      window.removeEventListener('entitlement-simulation-changed', handleChange)
    }
  }, [entitlement])
  
  // Only render for owner after auth is loaded
  if (!mounted || !isLoaded || !isOwner) return null
  
  // Get mode from entitlement hook
  const mode = entitlement.simulationMode
  // Real status from database (before simulation overlay)
  const realStatus = entitlement.plan || 'unknown'
  
  const handleModeChange = (newMode: SimulationMode) => {
    setSimulationMode(newMode)
    // Revalidate entitlement to pick up simulation change
    entitlement.mutate()
    // Force page refresh to update all feature gating (components using legacy hasProAccess)
    window.location.reload()
  }
  
  const isActive = mode !== 'off'
  
  // Collapsed state: Just show a small indicator button
  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className={cn(
          // Position: bottom-right, above mobile nav (bottom-24 = 96px)
          "fixed bottom-24 right-4 z-[9999]",
          // Size: Large enough to tap easily (min 44x44 for mobile)
          "w-12 h-12 rounded-full",
          // Flex center for icon
          "flex items-center justify-center",
          // Visual styling
          "border-2 shadow-xl transition-all",
          "active:scale-95",
          // State-based colors
          isActive 
            ? "bg-amber-600 border-amber-400 shadow-amber-500/30" 
            : "bg-[#1A1A1A] border-[#3A3A3A] hover:border-[#4A4A4A]",
        )}
        aria-label={`Simulation mode: ${mode}`}
      >
        <FlaskConical className={cn(
          "w-5 h-5",
          isActive ? "text-white" : "text-[#6B7280]"
        )} />
        {/* Active indicator dot */}
        {isActive && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 border-2 border-amber-600 flex items-center justify-center">
            <span className="text-[8px] font-bold text-amber-900">
              {mode === 'pro' ? 'P' : 'F'}
            </span>
          </span>
        )}
      </button>
    )
  }
  
  // Expanded state: Full toggle panel
  return (
    <div 
      className={cn(
        // Position: bottom-right, above mobile nav
        "fixed bottom-24 right-4 z-[9999]",
        // Layout
        "flex flex-col gap-2 p-3 rounded-xl",
        // Visual styling
        "border-2 shadow-xl backdrop-blur-md transition-all",
        isActive 
          ? "bg-amber-950/95 border-amber-600/70" 
          : "bg-[#1A1A1A]/95 border-[#3A3A3A]",
      )}
    >
      {/* Header row with close button */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Beaker className={cn(
            "w-4 h-4",
            isActive ? "text-amber-400" : "text-[#6B7280]"
          )} />
          <span className={cn(
            "text-sm font-semibold",
            isActive ? "text-amber-300" : "text-[#A5A5A5]"
          )}>
            Simulation
          </span>
        </div>
        <button
          onClick={() => setExpanded(false)}
          className="text-[#6B7280] hover:text-[#A5A5A5] text-lg leading-none px-1"
          aria-label="Collapse simulation panel"
        >
          &times;
        </button>
      </div>
      
      {/* Current status display */}
      {isActive && (
        <div className="text-xs text-amber-300/80 bg-amber-900/30 px-2 py-1 rounded">
          Simulating: <strong className="text-amber-200">{mode.toUpperCase()}</strong>
          <span className="text-amber-400/60 ml-2">(real: {realStatus})</span>
        </div>
      )}
      
      {/* Mode buttons - larger tap targets */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleModeChange('off')}
          className={cn(
            // Minimum tap target 44px
            "h-10 px-4 text-sm font-medium rounded-l-lg rounded-r-none flex-1",
            mode === 'off' 
              ? "bg-[#2A2A2A] text-[#F5F5F5] border border-[#4A4A4A]" 
              : "text-[#6B7280] hover:text-[#A5A5A5] hover:bg-[#2A2A2A]/50"
          )}
        >
          Off
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleModeChange('free')}
          className={cn(
            "h-10 px-4 text-sm font-medium rounded-none flex-1",
            mode === 'free' 
              ? "bg-[#2A2A2A] text-[#F5F5F5] border border-[#4A4A4A]" 
              : "text-[#6B7280] hover:text-[#A5A5A5] hover:bg-[#2A2A2A]/50"
          )}
        >
          Free
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleModeChange('pro')}
          className={cn(
            "h-10 px-4 text-sm font-medium rounded-r-lg rounded-l-none flex-1",
            mode === 'pro' 
              ? "bg-amber-600 text-white border border-amber-500" 
              : "text-[#6B7280] hover:text-[#A5A5A5] hover:bg-[#2A2A2A]/50"
          )}
        >
          Pro
        </Button>
      </div>
      
      {/* Help text */}
      <p className="text-[10px] text-[#6B7280] text-center">
        Owner-only test mode
      </p>
    </div>
  )
}
