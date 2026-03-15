'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Lock, ArrowRight, Sparkles } from 'lucide-react'
import { getCurrentPlan } from '@/lib/plan-source'
import { TRIAL } from '@/lib/billing/pricing'
import type { SubscriptionPlan } from '@/types/domain'

interface FeatureLockedCardProps {
  feature: string
  requiredPlan: SubscriptionPlan
  description?: string
  className?: string
}

// Only show Free and Pro to users - Elite is merged into Pro
const PLAN_LABELS: Record<SubscriptionPlan, string> = {
  free: 'Free',
  pro: 'Pro',
  elite: 'Pro', // Legacy: Elite users shown as Pro
}

export function FeatureLockedCard({
  feature,
  requiredPlan,
  description,
  className = '',
}: FeatureLockedCardProps) {
  const currentPlan = getCurrentPlan()
  
  return (
    <Card className={`bg-[#1A1A1A] border-[#2A2A2A] p-8 text-center ${className}`}>
      <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#2A2A2A] flex items-center justify-center">
        <Lock className="w-8 h-8 text-[#A5A5A5]" />
      </div>
      
      <h3 className="text-xl font-bold mb-2">{feature}</h3>
      
      <p className="text-[#A5A5A5] mb-6 max-w-md mx-auto">
        {description || `This feature requires the ${PLAN_LABELS[requiredPlan]} plan or higher.`}
      </p>
      
      <div className="flex flex-col items-center gap-3">
        <span className="text-sm text-[#A5A5A5]">
          You are on the <span className="text-[#E63946] font-semibold">{PLAN_LABELS[currentPlan]}</span> plan
        </span>
        
        <Link href="/upgrade">
          <Button className="bg-[#E63946] hover:bg-[#D62828]">
            <Sparkles className="w-4 h-4 mr-2" />
            {TRIAL.ctaText}
          </Button>
        </Link>
        <p className="text-xs text-[#6B7280] mt-2">{TRIAL.explanationShort}</p>
      </div>
    </Card>
  )
}

/**
 * Wrapper component that shows children if feature is accessible,
 * or shows locked card if not
 */
interface FeatureGateProps {
  feature: keyof import('@/types/domain').FeatureAccess
  requiredPlan: SubscriptionPlan
  featureLabel: string
  description?: string
  children: React.ReactNode
}

export function FeatureGate({
  feature,
  requiredPlan,
  featureLabel,
  description,
  children,
}: FeatureGateProps) {
  // Use the hasFeatureAccess from plan-source
  const { hasFeatureAccess } = require('@/lib/plan-source')
  const hasAccess = hasFeatureAccess(feature)
  
  if (hasAccess) {
    return <>{children}</>
  }
  
  return (
    <FeatureLockedCard
      feature={featureLabel}
      requiredPlan={requiredPlan}
      description={description}
    />
  )
}
