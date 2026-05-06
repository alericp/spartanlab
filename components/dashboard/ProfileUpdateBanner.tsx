'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { X, Sparkles, ArrowRight, RefreshCw } from 'lucide-react'

/**
 * ProfileUpdateBanner - Notification when new profile fields/skills are available
 * 
 * Shows when:
 * 1. User's profile schema version is behind current engine requirements
 * 2. New skills or options have been added that user hasn't seen
 * 
 * Dismissal:
 * - Can be dismissed for the session
 * - Automatically clears when profile is updated to current schema
 */

const BANNER_DISMISSED_KEY = 'spartanlab_profile_update_dismissed'

// Type for completeness status (imported dynamically to avoid module-level crashes)
interface ProfileCompletenessStatus {
  isCompleteForCurrentEngine: boolean
  profileSchemaVersion: number
  targetSchemaVersion: number
  missingGroups: string[]
  suggestedOnboardingSection: string | null
  hasNewSkillsAvailable: boolean
  newSkillsAvailableCount: number
}

// [profile-completeness] ISSUE F: Type for missing field group links
interface MissingFieldGroupLink {
  group: string
  label: string
  deepLink: {
    path: string
    section: string
    query: Record<string, string>
  }
  priority: 'required' | 'recommended' | 'optional'
}

function ProfileUpdateBannerInner() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const [status, setStatus] = useState<ProfileCompletenessStatus | null>(null)
  const [hasOnboarded, setHasOnboarded] = useState(false)
  // [profile-completeness] ISSUE F: Track missing field group links for targeted surfacing
  const [missingLinks, setMissingLinks] = useState<MissingFieldGroupLink[]>([])

  useEffect(() => {
    setMounted(true)
    
    // Load completeness status dynamically
    const loadStatus = async () => {
      try {
        const module = await import('@/lib/canonical-profile-service')
        const completenessStatus = module.getProfileCompletenessStatus()
        setStatus(completenessStatus)
        setHasOnboarded(module.hasValidCanonicalProfile())
        
        // [profile-completeness] ISSUE F: Load targeted surfacing links
        if (module.getMissingFieldGroupLinks) {
          const links = module.getMissingFieldGroupLinks()
          setMissingLinks(links)
          console.log('[profile-completeness] Missing field groups for surfacing:', links)
        }
        
        console.log('[ProfileUpdateBanner] Loaded status:', completenessStatus)
      } catch (err) {
        console.error('[ProfileUpdateBanner] Failed to load completeness status:', err)
      }
    }
    
    loadStatus()
    
    // Check session dismissal
    try {
      if (typeof window !== 'undefined') {
        const dismissed = sessionStorage.getItem(BANNER_DISMISSED_KEY)
        if (dismissed === 'true') {
          setIsDismissed(true)
        }
      }
    } catch (err) {
      console.error('[ProfileUpdateBanner] sessionStorage check failed:', err)
    }
  }, [])

  const handleDismiss = () => {
    setIsDismissed(true)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(BANNER_DISMISSED_KEY, 'true')
    }
  }

  const handleUpdateProfile = (specificGroup?: MissingFieldGroupLink) => {
    // [profile-completeness] ISSUE F: Use targeted deep link if available
    if (specificGroup?.deepLink) {
      const { path, query } = specificGroup.deepLink
      const searchParams = new URLSearchParams(query)
      router.push(`${path}?${searchParams.toString()}`)
      console.log('[profile-completeness] Navigating to specific section:', specificGroup.group)
      return
    }
    
    // Fallback: Deep-link to onboarding with suggested section
    const section = status?.suggestedOnboardingSection || 'skill_selection'
    router.push(`/onboarding?section=${section}&mode=update`)
  }

  // Don't render conditions
  if (!mounted) return null
  if (isDismissed) return null
  if (!hasOnboarded) return null // Don't show for users who haven't completed onboarding
  if (!status) return null
  if (status.isCompleteForCurrentEngine) return null // Profile is up to date

  // Determine message based on what's missing
  let title = 'New Training Options Available'
  let message = 'Update your profile to access the latest features and improvements.'
  
  if (status.hasNewSkillsAvailable) {
    title = 'New Skill Goals Available'
    message = `${status.newSkillsAvailableCount} new skills have been added to SpartanLab. Update your profile to select them.`
  } else if (status.missingGroups.length > 0) {
    title = 'Complete Your Profile'
    message = 'Some profile sections need your attention for optimal programming.'
  }

  return (
    <div className="relative bg-gradient-to-r from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-xl p-4 mb-4">
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-[#6B7280] hover:text-[#A4ACB8] transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5 text-blue-400" />
        </div>
        <div className="flex-1 pr-6">
          <h3 className="text-[#E6E9EF] font-semibold mb-1">
            {title}
          </h3>
          <p className="text-sm text-[#A4ACB8] mb-3">
            {message}
          </p>
          
          {/* What's new - brief list */}
          {status.hasNewSkillsAvailable && (
            <div className="bg-[#0F1115]/50 rounded-md p-3 mb-3 border border-blue-500/10">
              <p className="text-xs text-blue-400 font-medium mb-2">New Skills Include</p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2 py-0.5 bg-blue-500/10 text-[#A4ACB8] rounded">One-Arm Pull-Up</span>
                <span className="px-2 py-0.5 bg-blue-500/10 text-[#A4ACB8] rounded">One-Arm Push-Up</span>
                <span className="px-2 py-0.5 bg-blue-500/10 text-[#A4ACB8] rounded">Dragon Flag</span>
                <span className="px-2 py-0.5 bg-blue-500/10 text-[#A4ACB8] rounded">Planche Push-Up</span>
              </div>
            </div>
          )}
          
          {/* [profile-completeness] ISSUE F: Show specific missing sections for targeted access */}
          {!status.hasNewSkillsAvailable && missingLinks.length > 0 && (
            <div className="bg-[#0F1115]/50 rounded-md p-3 mb-3 border border-blue-500/10">
              <p className="text-xs text-blue-400 font-medium mb-2">Sections to Complete</p>
              <div className="flex flex-wrap gap-2 text-xs">
                {missingLinks.slice(0, 4).map((link) => (
                  <button
                    key={link.group}
                    onClick={() => handleUpdateProfile(link)}
                    className={`px-2 py-0.5 rounded text-left transition-colors ${
                      link.priority === 'required' 
                        ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30' 
                        : 'bg-blue-500/10 text-[#A4ACB8] hover:bg-blue-500/20'
                    }`}
                  >
                    {link.label}
                    {link.priority === 'required' && <span className="ml-1 text-[10px]">*</span>}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex flex-wrap gap-2">
            <Button 
              size="sm" 
              className="bg-blue-500 hover:bg-blue-600 text-white font-medium"
              onClick={() => handleUpdateProfile()}
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              Update Profile
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              className="border-[#2B313A] text-[#A4ACB8] hover:bg-[#2B313A]"
              onClick={handleDismiss}
            >
              Maybe Later
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Exported wrapper with Suspense boundary
export function ProfileUpdateBanner() {
  return (
    <Suspense fallback={null}>
      <ProfileUpdateBannerInner />
    </Suspense>
  )
}
