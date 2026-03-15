// AUTH_PROD_UNBLOCK_V1
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Navigation } from '@/components/shared/Navigation'
import { PageHeader } from '@/components/shared/PageHeader'
import { Settings, Crown, Shield } from 'lucide-react'
import { SKILL_DEFINITIONS } from '@/lib/skills'
import { isOwner, getCurrentUserEmail } from '@/lib/owner-access'
import { PRICING, TRIAL } from '@/lib/billing/pricing'
import { hasProAccess } from '@/lib/feature-access'
import { useSubscriptionDisplay } from '@/lib/billing/subscription-status'
import Link from 'next/link'
import {
  getAthleteProfile,
  saveAthleteProfile,
  type AthleteProfile,
} from '@/lib/data-service'
import { UpdateMetricsCard } from '@/components/dashboard/UpdateMetricsCard'
import { Sparkles } from 'lucide-react'

// Subscription Billing Card - handles Pro and Trial states
function SubscriptionBillingCard() {
  const subscriptionInfo = useSubscriptionDisplay()
  
  const statusLabel = subscriptionInfo.isTrialing ? 'Trial Active' : 'Active'
  const statusDescription = subscriptionInfo.isTrialing 
    ? `${subscriptionInfo.trialDaysRemaining} day${subscriptionInfo.trialDaysRemaining !== 1 ? 's' : ''} remaining in your trial. You won't be charged until it ends.`
    : 'Full access to all training intelligence features.'
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-4 rounded-lg bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20">
        <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
          {subscriptionInfo.isTrialing ? (
            <Sparkles className="w-5 h-5 text-amber-400" />
          ) : (
            <Crown className="w-5 h-5 text-amber-400" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[#F5F5F5] font-medium">SpartanLab Pro</span>
            <span className="px-2 py-0.5 text-xs rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
              {statusLabel}
            </span>
          </div>
          <p className="text-sm text-[#A5A5A5]">
            {statusDescription}
          </p>
        </div>
      </div>
      <Button 
        variant="outline" 
        className="w-full border-[#3A3A3A] text-[#A5A5A5] hover:bg-[#2A2A2A]"
        onClick={async () => {
          try {
            const res = await fetch('/api/stripe/create-portal-session', { method: 'POST' })
            const data = await res.json()
            if (data.url) {
              window.location.href = data.url
            }
          } catch (error) {
            console.error('Portal error:', error)
          }
        }}
      >
        Manage Billing
      </Button>
      <p className="text-xs text-[#6B7280]">
        Billing questions?{' '}
        <a href="mailto:billing@spartanlab.app" className="text-[#A5A5A5] hover:text-[#F5F5F5] transition-colors">
          billing@spartanlab.app
        </a>
      </p>
    </div>
  )
}

export default function SettingsPage() {
  console.log("[AUTH_PROOF] settings auth-prod-unblock-v1")
  
  const [profile, setProfile] = useState<AthleteProfile | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [mounted, setMounted] = useState(false)

  const [bodyweight, setBodyweight] = useState('')
  const [experienceLevel, setExperienceLevel] = useState('beginner')
  const [trainingDays, setTrainingDays] = useState('3')
  const [primaryGoal, setPrimaryGoal] = useState('')

  useEffect(() => {
    setMounted(true)
    loadProfile()
  }, [])

  const loadProfile = () => {
    const data = getAthleteProfile()
    setProfile(data)
    setBodyweight(data.bodyweight?.toString() || '')
    setExperienceLevel(data.experienceLevel || 'beginner')
    setTrainingDays(data.trainingDaysPerWeek?.toString() || '3')
    setPrimaryGoal(data.primaryGoal || '')
  }

  const handleSave = () => {
    setSaving(true)
    setSaved(false)
    
    const updated = saveAthleteProfile({
      bodyweight: bodyweight ? parseFloat(bodyweight) : null,
      experienceLevel: experienceLevel as 'beginner' | 'intermediate' | 'advanced',
      trainingDaysPerWeek: parseInt(trainingDays),
      primaryGoal: primaryGoal || null,
    })
    
    setProfile(updated)
    setSaved(true)
    setSaving(false)
    
    setTimeout(() => setSaved(false), 2000)
  }

  // Loading state during hydration
  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#121212] text-[#F5F5F5]">
        <Navigation />
        <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
          <div className="animate-pulse">
            <div className="h-96 bg-[#2A2A2A] rounded"></div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#121212] text-[#F5F5F5]">
      <Navigation />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <PageHeader 
          title="Settings"
          description="Configure your training profile for accurate progress estimates"
          backHref="/dashboard"
          backLabel="Back to Dashboard"
          icon={<Settings className="w-5 h-5" />}
        />
        
        <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-8 space-y-8">
          <div>
            <h2 className="text-xl font-bold mb-2">Athlete Profile</h2>
          </div>

          {/* Bodyweight */}
          <div className="space-y-2">
            <Label className="text-[#F5F5F5]">Bodyweight (lbs)</Label>
            <Input
              type="number"
              placeholder="Enter your bodyweight"
              value={bodyweight}
              onChange={(e) => setBodyweight(e.target.value)}
              className="bg-[#1A1A1A] border-[#3A3A3A] text-[#F5F5F5] focus:border-[#E63946]"
            />
          </div>

          {/* Experience Level */}
          <div className="space-y-2">
            <Label className="text-[#F5F5F5]">Experience Level</Label>
            <Select value={experienceLevel} onValueChange={setExperienceLevel}>
              <SelectTrigger className="bg-[#1A1A1A] border-[#3A3A3A] text-[#F5F5F5]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#2A2A2A] border-[#3A3A3A]">
                <SelectItem value="beginner" className="text-[#F5F5F5] focus:bg-[#3A3A3A]">
                  Beginner (8-12 weeks per level)
                </SelectItem>
                <SelectItem value="intermediate" className="text-[#F5F5F5] focus:bg-[#3A3A3A]">
                  Intermediate (6-10 weeks per level)
                </SelectItem>
                <SelectItem value="advanced" className="text-[#F5F5F5] focus:bg-[#3A3A3A]">
                  Advanced (4-8 weeks per level)
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-[#A5A5A5] mt-1">
              This affects estimated time to reach your target levels
            </p>
          </div>

          {/* Training Days */}
          <div className="space-y-2">
            <Label className="text-[#F5F5F5]">Training Days Per Week</Label>
            <Select value={trainingDays} onValueChange={setTrainingDays}>
              <SelectTrigger className="bg-[#1A1A1A] border-[#3A3A3A] text-[#F5F5F5]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#2A2A2A] border-[#3A3A3A]">
                {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                  <SelectItem key={day} value={day.toString()} className="text-[#F5F5F5] focus:bg-[#3A3A3A]">
                    {day} day{day !== 1 ? 's' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Primary Goal */}
          <div className="space-y-2">
            <Label className="text-[#F5F5F5]">Primary Goal (Optional)</Label>
            <Select value={primaryGoal} onValueChange={setPrimaryGoal}>
              <SelectTrigger className="bg-[#1A1A1A] border-[#3A3A3A] text-[#F5F5F5]">
                <SelectValue placeholder="Select a goal" />
              </SelectTrigger>
              <SelectContent className="bg-[#2A2A2A] border-[#3A3A3A]">
                <SelectItem value="" className="text-[#A5A5A5] focus:bg-[#3A3A3A]">
                  None
                </SelectItem>
                {Object.entries(SKILL_DEFINITIONS).map(([key, def]) => (
                  <SelectItem key={key} value={key} className="text-[#F5F5F5] focus:bg-[#3A3A3A]">
                    {def.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Save Button */}
          <div className="pt-6 border-t border-[#3A3A3A]">
            <Button
              size="lg"
              className="w-full bg-[#E63946] hover:bg-[#D62828] text-white font-semibold"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                'Saving...'
              ) : saved ? (
                'Profile Saved!'
              ) : (
                'Save Profile'
              )}
            </Button>
          </div>
        </Card>
        
        {/* Strength & Skill Metrics Update */}
        <div className="mt-6">
          <UpdateMetricsCard onUpdate={loadProfile} />
        </div>
        
        {/* Subscription & Billing Section */}
        <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-8 mt-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-2">Subscription</h2>
          </div>
          
          {isOwner() ? (
            // Owner account display
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-amber-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[#F5F5F5] font-medium">Owner Account</span>
                    <span className="px-2 py-0.5 text-xs rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      Full Access
                    </span>
                  </div>
                  <p className="text-sm text-[#A5A5A5]">
                    Subscription not required. All Pro features unlocked.
                  </p>
                </div>
              </div>
              
              <div className="text-xs text-[#6B7280]">
                Logged in as: {getCurrentUserEmail() || 'Owner'}
              </div>
            </div>
          ) : hasProAccess() ? (
            // Pro subscriber display (includes trial users)
            <SubscriptionBillingCard />
          ) : (
            // Free user display
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-[#1A1A1A] border border-[#3A3A3A]">
                <div className="w-10 h-10 rounded-lg bg-[#2A2A2A] flex items-center justify-center">
                  <Crown className="w-5 h-5 text-[#6B7280]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[#F5F5F5] font-medium">Free Plan</span>
                  </div>
                  <p className="text-sm text-[#A5A5A5]">
                    Upgrade to Pro for deeper insights and adaptive programming.
                  </p>
                </div>
              </div>
              
              <Link href="/upgrade">
                <Button className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold">
                  <Crown className="w-4 h-4 mr-2" />
                  {TRIAL.ctaText}
                </Button>
              </Link>
              <p className="text-xs text-center text-[#6B7280] mt-2">
                {TRIAL.explanationShort}
              </p>
            </div>
          )}
        </Card>
      </main>
    </div>
  )
}
