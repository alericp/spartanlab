'use client'

/**
 * ToolConversionCardClient - Client-only auth-aware conversion component
 * 
 * This component uses Clerk's useAuth() and must ONLY be loaded on client side.
 * It is dynamically imported by ToolConversionCard with ssr: false.
 */

import { useAuth } from '@clerk/nextjs'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  ChevronRight, 
  Sparkles, 
  Target, 
  TrendingUp, 
  Brain,
  Dumbbell,
  ArrowRight
} from 'lucide-react'
import { trackCTAClicked } from '@/lib/analytics'
import type { ToolContext, ToolDataPayload } from './tool-conversion-types'

// =============================================================================
// CONTEXT CONFIGURATIONS
// =============================================================================

const CONTEXT_CONFIG: Record<ToolContext, {
  headline: string
  description: string
  primaryCta: string
  secondaryCta: string
  secondaryHref: string
  icon: typeof Target
}> = {
  'front-lever': {
    headline: 'Turn This Into a Front Lever Program',
    description: 'SpartanLab analyzes your readiness score and limiting factors to create an adaptive front lever training program.',
    primaryCta: 'Generate My Front Lever Program',
    secondaryCta: 'View Front Lever Guide',
    secondaryHref: '/guides/front-lever-training',
    icon: Target,
  },
  'planche': {
    headline: 'Turn This Into a Planche Program',
    description: 'SpartanLab builds personalized planche progressions based on your pushing strength and lean capacity.',
    primaryCta: 'Generate My Planche Program',
    secondaryCta: 'View Planche Guide',
    secondaryHref: '/guides/planche-progression',
    icon: Target,
  },
  'muscle-up': {
    headline: 'Turn This Into a Muscle-Up Program',
    description: 'SpartanLab creates progressive muscle-up training targeting your transition strength and explosive power.',
    primaryCta: 'Generate My Muscle-Up Program',
    secondaryCta: 'View Muscle-Up Guide',
    secondaryHref: '/guides/muscle-up-training',
    icon: Dumbbell,
  },
  'iron-cross': {
    headline: 'Turn This Into a Ring Strength Program',
    description: 'SpartanLab develops advanced ring training programs based on your support strength and tendon readiness.',
    primaryCta: 'Generate My Ring Program',
    secondaryCta: 'View Iron Cross Guide',
    secondaryHref: '/guides/iron-cross-training',
    icon: Target,
  },
  'strength-standards': {
    headline: 'Turn This Into a Training Program',
    description: 'SpartanLab uses your strength profile to build balanced calisthenics programs that address your weak points.',
    primaryCta: 'Generate My Training Program',
    secondaryCta: 'Explore Skills',
    secondaryHref: '/skills',
    icon: TrendingUp,
  },
  'body-fat': {
    headline: 'Optimize Your Body Composition',
    description: 'SpartanLab creates training programs that improve your strength-to-weight ratio for better calisthenics performance.',
    primaryCta: 'Generate My Training Program',
    secondaryCta: 'View Strength Standards',
    secondaryHref: '/calisthenics-strength-standards',
    icon: TrendingUp,
  },
  'planche-lean': {
    headline: 'Progress Your Planche Lean',
    description: 'SpartanLab builds systematic planche progressions based on your lean capacity and supporting strength.',
    primaryCta: 'Generate My Planche Program',
    secondaryCta: 'View Planche Calculator',
    secondaryHref: '/planche-readiness-calculator',
    icon: Target,
  },
  'back-lever': {
    headline: 'Turn This Into a Back Lever Program',
    description: 'SpartanLab creates progressive back lever training based on your shoulder mobility and pulling strength.',
    primaryCta: 'Generate My Back Lever Program',
    secondaryCta: 'View Back Lever Guide',
    secondaryHref: '/guides/back-lever-training',
    icon: Target,
  },
  'handstand': {
    headline: 'Turn This Into a Handstand Program',
    description: 'SpartanLab develops personalized handstand training based on your balance, strength, and mobility.',
    primaryCta: 'Generate My Handstand Program',
    secondaryCta: 'View Handstand Guide',
    secondaryHref: '/guides/handstand-training',
    icon: Target,
  },
  'l-sit': {
    headline: 'Turn This Into a Core Program',
    description: 'SpartanLab creates progressive core training to build L-sit strength and compression power.',
    primaryCta: 'Generate My Core Program',
    secondaryCta: 'View L-Sit Guide',
    secondaryHref: '/exercises/l-sit',
    icon: Target,
  },
  'general': {
    headline: 'Turn This Result Into a Training Plan',
    description: 'SpartanLab analyzes your strength, skill readiness, and training constraints to generate adaptive calisthenics programs.',
    primaryCta: 'Build My SpartanLab Program',
    secondaryCta: 'Explore Features',
    secondaryHref: '/features',
    icon: Sparkles,
  },
}

const BENEFITS = [
  { icon: Brain, text: 'Personalized skill training' },
  { icon: TrendingUp, text: 'Progress tracking' },
  { icon: Sparkles, text: 'Smart progression logic' },
  { icon: Target, text: 'Weak-point detection' },
]

// =============================================================================
// PROPS
// =============================================================================

export interface ToolConversionCardClientProps {
  context: ToolContext
  toolData?: ToolDataPayload
  headline?: string
  description?: string
  primaryCtaText?: string
  secondaryCtaText?: string
  secondaryCtaHref?: string
  compact?: boolean
  className?: string
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ToolConversionCardClient({
  context,
  toolData,
  headline,
  description,
  primaryCtaText,
  secondaryCtaText,
  secondaryCtaHref,
  compact = false,
  className = '',
}: ToolConversionCardClientProps) {
  const { isLoaded, userId } = useAuth()
  const config = CONTEXT_CONFIG[context] || CONTEXT_CONFIG['general']
  
  // Build destination URL based on auth state
  // ROUTING FIX: Signed-in users go to /program (canonical authenticated route)
  // Signed-out users go to /onboarding to start the funnel
  const buildDestinationUrl = () => {
    // Signed-in users go directly to their program
    if (userId) {
      return '/program'
    }
    
    // Signed-out users go to onboarding with optional context params
    const baseUrl = '/onboarding'
    
    if (!toolData) return baseUrl
    
    // Encode relevant data as URL params for onboarding to prefill
    const params = new URLSearchParams()
    params.set('source', context)
    
    if (toolData.readinessScore !== undefined) {
      params.set('readiness', String(Math.round(toolData.readinessScore)))
    }
    if (toolData.maxPullUps !== undefined) {
      params.set('pullups', String(toolData.maxPullUps))
    }
    if (toolData.maxDips !== undefined) {
      params.set('dips', String(toolData.maxDips))
    }
    if (toolData.bodyweight !== undefined) {
      params.set('bw', String(toolData.bodyweight))
    }
    if (toolData.strengthLevel) {
      params.set('level', toolData.strengthLevel)
    }
    if (toolData.limitingFactors?.length) {
      params.set('limits', toolData.limitingFactors.slice(0, 3).join(','))
    }
    
    return `${baseUrl}?${params.toString()}`
  }
  
  const destinationUrl = buildDestinationUrl()
  const Icon = config.icon
  
  // Compact version for inline use
  if (compact) {
    return (
      <Card className={`bg-gradient-to-br from-[#C1121F]/10 to-[#C1121F]/5 border-[#C1121F]/20 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#C1121F]/20 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-[#C1121F]" />
              </div>
              <div>
                <p className="font-semibold text-[#E6E9EF] text-sm">
                  {headline || config.headline}
                </p>
                <p className="text-xs text-[#A4ACB8]">
                  {userId ? 'Go to program builder' : 'Create your free account'}
                </p>
              </div>
            </div>
            <Link href={destinationUrl}>
              <Button size="sm" className="bg-[#C1121F] hover:bg-[#A50E1A] text-white">
                {userId ? 'Open Program' : 'Get Started'}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  // Full version
  return (
    <Card className={`bg-gradient-to-br from-[#C1121F]/10 via-[#C1121F]/5 to-transparent border-[#C1121F]/20 overflow-hidden ${className}`}>
      <CardContent className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          {/* Left: Content */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#C1121F]/20 flex items-center justify-center">
                <Icon className="w-6 h-6 text-[#C1121F]" />
              </div>
              <h3 className="text-xl font-bold text-[#E6E9EF]">
                {headline || config.headline}
              </h3>
            </div>
            
            <p className="text-[#A4ACB8] mb-6 max-w-lg">
              {description || config.description}
            </p>
            
            {/* Benefits Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {BENEFITS.map((benefit, index) => (
                <div key={index} className="flex items-center gap-2">
                  <benefit.icon className="w-4 h-4 text-[#C1121F]" />
                  <span className="text-sm text-[#E6E9EF]">{benefit.text}</span>
                </div>
              ))}
            </div>
            
            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link 
                href={destinationUrl}
                onClick={() => trackCTAClicked(context, userId ? 'program' : 'onboarding')}
              >
                <Button className="bg-[#C1121F] hover:bg-[#A50E1A] text-white w-full sm:w-auto">
                  {userId ? 'Open Your Program' : (primaryCtaText || config.primaryCta)}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
              <Link 
                href={secondaryCtaHref || config.secondaryHref}
                onClick={() => trackCTAClicked(context, 'features')}
              >
                <Button 
                  variant="outline" 
                  className="border-[#2B313A] text-[#A4ACB8] hover:bg-[#1A1F26] hover:text-[#E6E9EF] w-full sm:w-auto"
                >
                  {secondaryCtaText || config.secondaryCta}
                </Button>
              </Link>
            </div>
            
            {/* Trust microcopy */}
            <p className="text-xs text-[#6B7280] mt-4">
              {userId 
                ? 'Your data from this calculator can be used to personalize your program.'
                : 'Used by athletes to structure calisthenics training intelligently. Free to start.'}
            </p>
          </div>
          
          {/* Right: Visual accent (hidden on mobile) */}
          <div className="hidden lg:block w-32 h-32 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[#C1121F]/20 to-transparent rounded-full blur-2xl" />
            <div className="absolute inset-4 border-2 border-[#C1121F]/30 rounded-full flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-[#C1121F]/50" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
