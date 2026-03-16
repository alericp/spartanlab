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
import { PageContainer } from '@/components/layout'
import { PageHeader } from '@/components/shared/PageHeader'
import { Settings, Crown, Shield, Target, Sparkles, AlertTriangle, Dumbbell } from 'lucide-react'
import { SKILL_DEFINITIONS } from '@/lib/skills'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  JOINT_CAUTION_LABELS, 
  type JointCaution,
  type EquipmentType,
  WEAKEST_AREA_LABELS,
  type WeakestArea,
} from '@/lib/athlete-profile'
import { useOwnerInit } from '@/hooks/useOwnerInit'
import { PRICING, TRIAL } from '@/lib/billing/pricing'
import { hasProAccess } from '@/lib/feature-access'
import { useSubscriptionDisplay } from '@/lib/billing/subscription-status'
import Link from 'next/link'
import {
  getAthleteProfile,
  saveAthleteProfile,
  type AthleteProfile,
} from '@/lib/data-service'
import { hasSignificantProfileChange, getProfileChangeDescription } from '@/lib/profile-sync-service'
import { getActiveProgram, clearActiveProgram } from '@/lib/program-service'
import { UpdateMetricsCard } from '@/components/dashboard/UpdateMetricsCard'
import { useToast } from '@/hooks/use-toast'

// Subscription Billing Card - handles Pro, Trial, and Free states with graceful error handling
function SubscriptionBillingCard() {
  const subscriptionInfo = useSubscriptionDisplay()
  const [billingStatus, setBillingStatus] = useState<'idle' | 'loading' | 'error' | 'no-account'>('idle')
  const [billingMessage, setBillingMessage] = useState('')
  
  // Free user - show upgrade CTA instead of billing management
  if (subscriptionInfo.status === 'free' && !subscriptionInfo.isOwner) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-4 rounded-lg bg-[#1A1A1A] border border-[#3A3A3A]">
          <div className="w-10 h-10 rounded-lg bg-[#3A3A3A] flex items-center justify-center">
            <Shield className="w-5 h-5 text-[#6B7280]" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[#F5F5F5] font-medium">Free Plan</span>
            </div>
            <p className="text-sm text-[#A5A5A5]">
              Basic features for getting started with your training.
            </p>
          </div>
        </div>
        <Link href="/pricing">
          <Button className="w-full bg-[#E63946] hover:bg-[#D62828] text-white">
            <Sparkles className="w-4 h-4 mr-2" />
            Upgrade to Pro
          </Button>
        </Link>
      </div>
    )
  }
  
  const statusLabel = subscriptionInfo.isTrialing ? 'Trial Active' : 'Active'
  const statusDescription = subscriptionInfo.isTrialing 
    ? `${subscriptionInfo.trialDaysRemaining} day${subscriptionInfo.trialDaysRemaining !== 1 ? 's' : ''} remaining in your trial. You won't be charged until it ends.`
    : 'Full access to all training intelligence features.'
  
  const handleManageBilling = async () => {
    setBillingStatus('loading')
    setBillingMessage('')
    
    try {
      const res = await fetch('/api/stripe/create-portal-session', { method: 'POST' })
      const data = await res.json()
      
      if (res.ok && data.url) {
        window.location.href = data.url
        return
      }
      
      // Handle specific error cases gracefully
      if (res.status === 404 || data.error?.includes('No billing account')) {
        setBillingStatus('no-account')
        setBillingMessage('Your billing account is being set up. This usually happens automatically after your first payment.')
      } else {
        setBillingStatus('error')
        setBillingMessage('Unable to open billing portal. Please try again or contact support.')
      }
    } catch (error) {
      console.error('Portal error:', error)
      setBillingStatus('error')
      setBillingMessage('Connection error. Please check your internet and try again.')
    }
  }
  
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
      
      {/* Billing status message */}
      {billingStatus === 'no-account' && (
        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <p className="text-sm text-blue-400">{billingMessage}</p>
        </div>
      )}
      {billingStatus === 'error' && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-sm text-red-400">{billingMessage}</p>
        </div>
      )}
      
      {/* Trial users may not have a billing account yet */}
      {subscriptionInfo.isTrialing ? (
        <>
          <Button 
            variant="outline" 
            className="w-full border-[#3A3A3A] text-[#6B7280] cursor-not-allowed opacity-60"
            disabled
          >
            Manage Billing
          </Button>
          <p className="text-xs text-[#6B7280]">
            Billing will activate after your trial ends. No payment required during trial.
          </p>
        </>
      ) : (
        <>
          <Button 
            variant="outline" 
            className="w-full border-[#3A3A3A] text-[#A5A5A5] hover:bg-[#2A2A2A]"
            onClick={handleManageBilling}
            disabled={billingStatus === 'loading'}
          >
            {billingStatus === 'loading' ? 'Opening Billing...' : 'Manage Billing'}
          </Button>
          <p className="text-xs text-[#6B7280]">
            Billing questions?{' '}
            <a href="mailto:billing@spartanlab.app" className="text-[#A5A5A5] hover:text-[#F5F5F5] transition-colors">
              billing@spartanlab.app
            </a>
          </p>
        </>
      )}
    </div>
  )
}

export default function SettingsPage() {
  console.log("[AUTH_PROOF] settings auth-prod-unblock-v1")
  
  // Initialize owner detection from Clerk auth
  const { isOwner } = useOwnerInit()
  const { toast } = useToast()
  
  const [profile, setProfile] = useState<AthleteProfile | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [mounted, setMounted] = useState(false)

  const [bodyweight, setBodyweight] = useState('')
  const [experienceLevel, setExperienceLevel] = useState('beginner')
  const [trainingDays, setTrainingDays] = useState('3')
  const [sessionLength, setSessionLength] = useState('60')
  const [primaryGoal, setPrimaryGoal] = useState('none')
  const [equipment, setEquipment] = useState<EquipmentType[]>([])
  const [jointCautions, setJointCautions] = useState<JointCaution[]>([])
  const [weakestArea, setWeakestArea] = useState<WeakestArea | 'none'>('none')

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
    setSessionLength(data.sessionLengthMinutes?.toString() || '60')
    setPrimaryGoal(data.primaryGoal || 'none')
    setEquipment(data.equipmentAvailable || [])
    setJointCautions(data.jointCautions || [])
    setWeakestArea(data.weakestArea || 'none')
  }

  const handleSave = () => {
    setSaving(true)
    setSaved(false)
    
    // Store previous profile for comparison
    const previousProfile = profile
    
    const updated = saveAthleteProfile({
      bodyweight: bodyweight ? parseFloat(bodyweight) : null,
      experienceLevel: experienceLevel as 'beginner' | 'intermediate' | 'advanced',
      trainingDaysPerWeek: parseInt(trainingDays),
      sessionLengthMinutes: parseInt(sessionLength) as 30 | 45 | 60 | 90,
      primaryGoal: primaryGoal === 'none' ? null : primaryGoal,
      equipmentAvailable: equipment,
      jointCautions: jointCautions,
      weakestArea: weakestArea === 'none' ? null : weakestArea,
    })
    
    setProfile(updated)
    setSaved(true)
    setSaving(false)
    
    // Check if changes require program regeneration
    if (previousProfile && hasSignificantProfileChange(previousProfile, updated)) {
      const activeProgram = getActiveProgram()
      if (activeProgram) {
        // Clear the active program to trigger regeneration on next visit
        clearActiveProgram()
        
        // Get description of what changed for better user messaging
        const changeDescription = getProfileChangeDescription(previousProfile, updated)
        
        toast({
          title: 'Program Updated',
          description: changeDescription 
            ? `Your program will be regenerated to match your new ${changeDescription}.`
            : 'Your training program will be regenerated to match your new settings.',
          duration: 5000,
        })
      }
    }
    
    setTimeout(() => setSaved(false), 2000)
  }

  // Loading state during hydration
  if (!mounted) {
    return (
      <PageContainer maxWidth="md">
        <div className="animate-pulse">
          <div className="h-96 bg-[#2A2A2A] rounded"></div>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer maxWidth="md">
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

          {/* Session Length */}
          <div className="space-y-2">
            <Label className="text-[#F5F5F5]">Session Duration</Label>
            <Select value={sessionLength} onValueChange={setSessionLength}>
              <SelectTrigger className="bg-[#1A1A1A] border-[#3A3A3A] text-[#F5F5F5]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#2A2A2A] border-[#3A3A3A]">
                <SelectItem value="30" className="text-[#F5F5F5] focus:bg-[#3A3A3A]">
                  30 min focused session
                </SelectItem>
                <SelectItem value="45" className="text-[#F5F5F5] focus:bg-[#3A3A3A]">
                  45 min balanced session
                </SelectItem>
                <SelectItem value="60" className="text-[#F5F5F5] focus:bg-[#3A3A3A]">
                  60 min complete session
                </SelectItem>
                <SelectItem value="90" className="text-[#F5F5F5] focus:bg-[#3A3A3A]">
                  90 min extended session
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-[#A5A5A5] mt-1">
              Changing this will regenerate your program
            </p>
          </div>

          {/* Primary Goal */}
          <div className="space-y-2">
            <Label className="text-[#F5F5F5]">Primary Goal (Optional)</Label>
            <Select value={primaryGoal} onValueChange={setPrimaryGoal}>
              <SelectTrigger className="bg-[#1A1A1A] border-[#3A3A3A] text-[#F5F5F5]">
                <SelectValue placeholder="Select a goal" />
              </SelectTrigger>
              <SelectContent className="bg-[#2A2A2A] border-[#3A3A3A]">
                <SelectItem value="none" className="text-[#A5A5A5] focus:bg-[#3A3A3A]">
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

          {/* Equipment Available */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-[#A5A5A5]" />
              <Label className="text-[#F5F5F5]">Equipment Available</Label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'pullup_bar' as const, label: 'Pull-up Bar' },
                { key: 'dip_bars' as const, label: 'Dip Bars' },
                { key: 'rings' as const, label: 'Rings' },
                { key: 'parallettes' as const, label: 'Parallettes' },
                { key: 'resistance_bands' as const, label: 'Resistance Bands' },
                { key: 'weights' as const, label: 'Weights (for loading)' },
              ].map((item) => (
                <div 
                  key={item.key}
                  className="flex items-center gap-2 p-3 rounded-lg bg-[#1A1A1A] border border-[#3A3A3A]"
                >
                  <Checkbox
                    id={`equip-${item.key}`}
                    checked={equipment.includes(item.key)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setEquipment([...equipment, item.key])
                      } else {
                        setEquipment(equipment.filter(e => e !== item.key))
                      }
                    }}
                    className="border-[#3A3A3A] data-[state=checked]:bg-[#E63946] data-[state=checked]:border-[#E63946]"
                  />
                  <label 
                    htmlFor={`equip-${item.key}`}
                    className="text-sm text-[#A5A5A5] cursor-pointer"
                  >
                    {item.label}
                  </label>
                </div>
              ))}
            </div>
            <p className="text-xs text-[#6B7280]">
              Your program will be adjusted based on available equipment.
            </p>
          </div>

          {/* Joint Cautions */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <Label className="text-[#F5F5F5]">Joint Cautions (Optional)</Label>
            </div>
            <p className="text-xs text-[#A5A5A5]">
              Flag any joints that need extra care. Your program will modify exercises accordingly.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(Object.keys(JOINT_CAUTION_LABELS) as JointCaution[]).map((joint) => (
                <div 
                  key={joint}
                  className="flex items-center gap-2 p-3 rounded-lg bg-[#1A1A1A] border border-[#3A3A3A]"
                >
                  <Checkbox
                    id={`joint-${joint}`}
                    checked={jointCautions.includes(joint)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setJointCautions([...jointCautions, joint])
                      } else {
                        setJointCautions(jointCautions.filter(j => j !== joint))
                      }
                    }}
                    className="border-[#3A3A3A] data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                  />
                  <label 
                    htmlFor={`joint-${joint}`}
                    className="text-sm text-[#A5A5A5] cursor-pointer"
                  >
                    {JOINT_CAUTION_LABELS[joint]}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Weakest Area */}
          <div className="space-y-2">
            <Label className="text-[#F5F5F5]">Weakest Area (Optional)</Label>
            <Select value={weakestArea} onValueChange={(v) => setWeakestArea(v as WeakestArea | 'none')}>
              <SelectTrigger className="bg-[#1A1A1A] border-[#3A3A3A] text-[#F5F5F5]">
                <SelectValue placeholder="Select your weakest area" />
              </SelectTrigger>
              <SelectContent className="bg-[#2A2A2A] border-[#3A3A3A]">
                <SelectItem value="none" className="text-[#A5A5A5] focus:bg-[#3A3A3A]">
                  None / Not sure
                </SelectItem>
                {(Object.keys(WEAKEST_AREA_LABELS) as WeakestArea[]).map((area) => (
                  <SelectItem key={area} value={area} className="text-[#F5F5F5] focus:bg-[#3A3A3A]">
                    {WEAKEST_AREA_LABELS[area]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-[#A5A5A5]">
              Your training will emphasize work on your identified weakness.
            </p>
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
        
        {/* Redo Onboarding Section */}
        <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-8 mt-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold mb-2">Training Profile</h2>
            <p className="text-sm text-[#A5A5A5]">
              Want to update your goals, skills, or training preferences? You can re-run the full onboarding process.
            </p>
          </div>
          
          <Link href="/onboarding">
            <Button 
              variant="outline" 
              className="w-full border-[#3A3A3A] text-[#A5A5A5] hover:bg-[#2A2A2A] hover:text-[#F5F5F5]"
            >
              <Target className="w-4 h-4 mr-2" />
              Update Training Goals
            </Button>
          </Link>
          <p className="text-xs text-[#6B7280] mt-2">
            This will walk you through your goals, skill levels, and training schedule again.
          </p>
        </Card>
        
        {/* Subscription & Billing Section */}
        <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-8 mt-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold mb-2">Subscription & Billing</h2>
            <p className="text-sm text-[#A5A5A5]">
              Manage your SpartanLab subscription and billing details.
            </p>
          </div>
          <SubscriptionBillingCard />
        </Card>
    </PageContainer>
  )
}
