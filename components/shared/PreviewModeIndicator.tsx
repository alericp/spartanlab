'use client'

// Preview Mode Indicator - Debug/testing controls
// PRODUCTION SAFE: Never renders for public users or non-owner users
// Only renders in preview mode for local development/testing

import { useState, useEffect } from 'react'
import { isPreviewMode, getModeInfo } from '@/lib/app-mode'
import { getCurrentPlan, setPreviewPlan, canSwitchPreviewPlan } from '@/lib/plan-source'
import type { SubscriptionPlan } from '@/types/domain'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Eye, ChevronDown } from 'lucide-react'

export function PreviewModeIndicator() {
  const [mounted, setMounted] = useState(false)
  const [currentPlan, setCurrentPlanState] = useState<SubscriptionPlan>('pro')
  const [shouldRender, setShouldRender] = useState(false)
  
  useEffect(() => {
    setMounted(true)
    
    // CRITICAL: Only render in preview mode
    // Never render in production - this keeps the public site clean
    const preview = isPreviewMode()
    if (!preview) {
      setShouldRender(false)
      return
    }
    
    // In preview mode, only show if user has started using the app
    const hasProfile = localStorage.getItem('athlete_profile')
    const hasWorkouts = localStorage.getItem('workouts')
    const hasPrograms = localStorage.getItem('saved_programs')
    const hasAppData = Boolean(hasProfile || hasWorkouts || hasPrograms)
    
    setShouldRender(hasAppData)
    setCurrentPlanState(getCurrentPlan())
  }, [])
  
  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) return null
  
  // Don't render if conditions aren't met (not preview mode, or no app data)
  if (!shouldRender) return null
  
  const modeInfo = getModeInfo()
  const canSwitch = canSwitchPreviewPlan()
  
  const handlePlanChange = (plan: SubscriptionPlan) => {
    setPreviewPlan(plan)
    setCurrentPlanState(plan)
    window.location.reload()
  }
  
  const planLabels: Record<SubscriptionPlan, string> = {
    free: 'Free',
    pro: 'Pro',
    elite: 'Pro',
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            className="bg-[#1A1A1A]/90 border-[#2A2A2A] text-[#A5A5A5] hover:text-white hover:bg-[#2A2A2A] backdrop-blur-sm shadow-lg"
          >
            <Eye className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
            <span className="text-xs">Preview</span>
            <span className="mx-1.5 text-[#3A3A3A]">|</span>
            <span className="text-xs text-amber-500">{planLabels[currentPlan]}</span>
            <ChevronDown className="h-3 w-3 ml-1 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="w-48 bg-[#1A1A1A] border-[#2A2A2A]"
        >
          <DropdownMenuLabel className="text-xs text-[#A5A5A5]">
            {modeInfo.displayName}
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-[#2A2A2A]" />
          
          {canSwitch && (
            <>
              <DropdownMenuLabel className="text-xs text-[#666]">
                Test Plan Access
              </DropdownMenuLabel>
              <DropdownMenuItem 
                onClick={() => handlePlanChange('free')}
                className={currentPlan === 'free' ? 'bg-[#2A2A2A]' : ''}
              >
                <span className="text-sm">Free Plan</span>
                {currentPlan === 'free' && <span className="ml-auto text-xs text-green-500">Active</span>}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handlePlanChange('pro')}
                className={(currentPlan === 'pro' || currentPlan === 'elite') ? 'bg-[#2A2A2A]' : ''}
              >
                <span className="text-sm">Pro Plan</span>
                {(currentPlan === 'pro' || currentPlan === 'elite') && <span className="ml-auto text-xs text-green-500">Active</span>}
              </DropdownMenuItem>
            </>
          )}
          
          <DropdownMenuSeparator className="bg-[#2A2A2A]" />
          <div className="px-2 py-1.5 text-xs text-[#666]">
            <div className="flex justify-between">
              <span>Auth:</span>
              <span className={modeInfo.authEnabled ? 'text-green-500' : 'text-[#666]'}>
                {modeInfo.authEnabled ? 'Enabled' : 'Mock'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Database:</span>
              <span className={modeInfo.dbEnabled ? 'text-green-500' : 'text-[#666]'}>
                {modeInfo.dbEnabled ? 'Connected' : 'Local'}
              </span>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
