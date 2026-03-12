'use client'

// Preview Mode Indicator - Debug/testing controls
// OWNER-ONLY: These controls are hidden from normal users for production cleanliness
// Only the platform owner can see preview mode, plan switching, and debug labels

import { useState, useEffect } from 'react'
import { isPreviewMode, getModeInfo } from '@/lib/app-mode'
import { getCurrentPlan, setPreviewPlan, canSwitchPreviewPlan } from '@/lib/plan-source'
import { isOwner } from '@/lib/owner-access'
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
  const [ownerAccess, setOwnerAccess] = useState(false)
  
  useEffect(() => {
    setMounted(true)
    setCurrentPlanState(getCurrentPlan())
    setOwnerAccess(isOwner())
  }, [])
  
  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) return null
  
  // OWNER-ONLY: Hide all debug/preview controls from normal users
  // This ensures the live product looks clean and production-ready
  if (!ownerAccess) return null
  
  // Only show in preview mode (redundant check, but kept for safety)
  if (!isPreviewMode()) return null
  
  const modeInfo = getModeInfo()
  const canSwitch = canSwitchPreviewPlan()
  
  const handlePlanChange = (plan: SubscriptionPlan) => {
    setPreviewPlan(plan)
    setCurrentPlanState(plan)
    // Trigger a page refresh to apply new plan access
    window.location.reload()
  }
  
  // Only show Free and Pro to users - Elite is merged into Pro
  const planLabels: Record<SubscriptionPlan, string> = {
    free: 'Free',
    pro: 'Pro',
    elite: 'Pro', // Legacy: Elite users shown as Pro
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
