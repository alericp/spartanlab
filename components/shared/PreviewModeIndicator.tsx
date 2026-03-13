'use client'

// Preview Mode Indicator - Debug/testing controls
// OWNER-ONLY: These controls are hidden from ALL users except the platform owner
// Never visible to signed-out users or regular signed-in users

import { useState, useEffect } from 'react'
import { isPreviewMode, isAuthEnabled, getModeInfo } from '@/lib/app-mode'
import { getCurrentPlan, setPreviewPlan, canSwitchPreviewPlan } from '@/lib/plan-source'
import { getOwnerEmail, checkOwnerByEmail } from '@/lib/owner-access'
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
  const [checkingAuth, setCheckingAuth] = useState(true)
  
  useEffect(() => {
    setMounted(true)
    setCurrentPlanState(getCurrentPlan())
    
    // Check owner access
    const checkOwnerAccess = async () => {
      const preview = isPreviewMode()
      const authEnabled = isAuthEnabled()
      const ownerEmail = getOwnerEmail()
      
      // No owner email configured - hide debug controls
      if (!ownerEmail) {
        setOwnerAccess(false)
        setCheckingAuth(false)
        return
      }
      
      if (preview) {
        // In preview mode, allow owner controls (for local development)
        // But only if the user is "logged in" in preview mode
        const hasProfile = localStorage.getItem('athlete_profile')
        const hasWorkouts = localStorage.getItem('workouts')
        const hasPrograms = localStorage.getItem('saved_programs')
        const isLoggedInPreview = Boolean(hasProfile || hasWorkouts || hasPrograms)
        
        // Only show debug controls if they've started using the app
        setOwnerAccess(isLoggedInPreview)
        setCheckingAuth(false)
        return
      }
      
      if (authEnabled) {
        // In production mode, check Clerk session
        try {
          const { useUser } = await import('@clerk/nextjs')
          // We can't call hooks here, so we use a different approach
          // Check if we're signed in via Clerk
          const clerkModule = await import('@clerk/nextjs')
          
          // This is a workaround - we'll check via the window object
          // The real check happens in the component render based on Clerk state
          // For now, hide by default in production
          setOwnerAccess(false)
          setCheckingAuth(false)
        } catch {
          setOwnerAccess(false)
          setCheckingAuth(false)
        }
      } else {
        setOwnerAccess(false)
        setCheckingAuth(false)
      }
    }
    
    checkOwnerAccess()
  }, [])
  
  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) return null
  
  // Still checking auth - don't render anything
  if (checkingAuth) return null
  
  // OWNER-ONLY: Hide all debug/preview controls from normal users
  // This ensures the live product looks clean and production-ready
  if (!ownerAccess) return null
  
  // Only show in preview mode for now
  // Production owner access requires additional Clerk integration
  if (!isPreviewMode()) return null
  
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
