'use client'

// Preview Mode Indicator - Shows when running without database
// Only renders in development when no DATABASE_URL is configured

import { useState, useEffect } from 'react'
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
import { isPreviewMode } from '@/lib/app-mode'

export function PreviewModeIndicator() {
  const [mounted, setMounted] = useState(false)
  const [currentPlan, setCurrentPlanState] = useState<SubscriptionPlan>('pro')
  const [shouldRender, setShouldRender] = useState(false)
  const [canSwitch, setCanSwitch] = useState(false)
  
  useEffect(() => {
    setMounted(true)
    
    try {
      // Only show in preview mode (no database)
      if (!isPreviewMode()) {
        setShouldRender(false)
        return
      }
      
      // Check if user has started using the app
      let hasAppData = false
      try {
        const hasProfile = localStorage.getItem('athlete_profile')
        const hasWorkouts = localStorage.getItem('workouts')
        const hasPrograms = localStorage.getItem('saved_programs')
        hasAppData = Boolean(hasProfile || hasWorkouts || hasPrograms)
      } catch {
        setShouldRender(false)
        return
      }
      
      setShouldRender(hasAppData)
      
      // Check if plan switching is available
      import('@/lib/plan-source').then(({ canSwitchPreviewPlan, getCurrentPlan }) => {
        setCanSwitch(canSwitchPreviewPlan())
        setCurrentPlanState(getCurrentPlan())
      }).catch(() => {
        // Module not available - that's fine
      })
    } catch {
      setShouldRender(false)
    }
  }, [])
  
  if (!mounted || !shouldRender) return null
  
  const handlePlanChange = (plan: SubscriptionPlan) => {
    try {
      import('@/lib/plan-source').then(({ setPreviewPlan }) => {
        setPreviewPlan(plan)
        setCurrentPlanState(plan)
        window.location.reload()
      }).catch(() => {})
    } catch {}
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
            Preview Mode (No Database)
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
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
