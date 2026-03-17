/**
 * ToolConversionCard - SSR-safe wrapper for conversion funnel component
 * 
 * This wrapper is safe to render during SSR/prerender because it uses
 * next/dynamic with ssr: false to load the auth-aware client component.
 * 
 * The actual Clerk useAuth() hook only runs on the client side.
 */

import dynamic from 'next/dynamic'
import { Card, CardContent } from '@/components/ui/card'
import { Sparkles
} from 'lucide-react'

// =============================================================================
// TYPES (exported for consumers and client component)
// =============================================================================

export type ToolContext = 
  | 'front-lever'
  | 'planche'
  | 'muscle-up'
  | 'iron-cross'
  | 'strength-standards'
  | 'body-fat'
  | 'planche-lean'
  | 'back-lever'
  | 'handstand'
  | 'l-sit'
  | 'general'

export interface ToolDataPayload {
  // Common metrics
  maxPullUps?: number
  maxDips?: number
  maxPushUps?: number
  weightedPullUp?: number
  weightedDip?: number
  bodyweight?: number
  hollowHold?: number
  lSitHold?: number
  
  // Skill-specific
  frontLeverHold?: number
  plancheLeanHold?: number
  plancheLeanDistance?: number
  tuckFrontLeverHold?: number
  ringSupport?: number
  wallHandstand?: number
  
  // Results
  readinessScore?: number
  classification?: string
  limitingFactors?: string[]
  bodyFatPercentage?: number
  strengthLevel?: string
}

export interface ToolConversionCardProps {
  /** Tool context for customized messaging */
  context: ToolContext
  /** Optional tool data to pass to onboarding */
  toolData?: ToolDataPayload
  /** Custom headline override */
  headline?: string
  /** Custom description override */
  description?: string
  /** Custom primary CTA text */
  primaryCtaText?: string
  /** Custom secondary CTA text */
  secondaryCtaText?: string
  /** Custom secondary CTA href */
  secondaryCtaHref?: string
  /** Show compact version */
  compact?: boolean
  /** Custom class name */
  className?: string
}

// =============================================================================
// DYNAMIC CLIENT COMPONENT (ssr: false prevents auth hooks during prerender)
// =============================================================================

const ToolConversionCardClient = dynamic(
  () => import('./ToolConversionCardClient').then(mod => mod.ToolConversionCardClient),
  { 
    ssr: false,
    loading: () => <ToolConversionCardSkeleton />
  }
)

// =============================================================================
// LOADING SKELETON (shown during client hydration)
// =============================================================================

function ToolConversionCardSkeleton() {
  return (
    <Card className="bg-gradient-to-br from-[#C1121F]/10 via-[#C1121F]/5 to-transparent border-[#C1121F]/20 overflow-hidden">
      <CardContent className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#C1121F]/20 flex items-center justify-center animate-pulse">
                <Sparkles className="w-6 h-6 text-[#C1121F]/50" />
              </div>
              <div className="h-7 w-64 bg-[#2B313A] rounded animate-pulse" />
            </div>
            <div className="h-5 w-full max-w-lg bg-[#2B313A]/50 rounded animate-pulse mb-2" />
            <div className="h-5 w-3/4 max-w-md bg-[#2B313A]/50 rounded animate-pulse mb-6" />
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-5 w-32 bg-[#2B313A]/30 rounded animate-pulse" />
              ))}
            </div>
            <div className="flex gap-3">
              <div className="h-10 w-48 bg-[#C1121F]/30 rounded animate-pulse" />
              <div className="h-10 w-32 bg-[#2B313A]/30 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// =============================================================================
// MAIN EXPORT (SSR-safe wrapper)
// =============================================================================

export function ToolConversionCard(props: ToolConversionCardProps) {
  // Dynamically loaded client component handles all auth logic
  return <ToolConversionCardClient {...props} />
}
