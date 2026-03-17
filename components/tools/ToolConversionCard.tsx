'use client'

/**
 * ToolConversionCard - Auth-aware conversion funnel component
 * 
 * This component uses Clerk's useAuth() hook to show different CTAs based on
 * whether the user is logged in. It uses next/dynamic with ssr: false.
 * 
 * IMPORTANT: Do NOT use this component in public SEO pages that need to be
 * statically prerendered. Instead, use ToolConversionCardStatic for those pages.
 * 
 * Use this component:
 * - In authenticated app screens
 * - In client-only contexts
 * - Where auth-aware behavior is needed (different CTA for logged-in users)
 * 
 * Use ToolConversionCardStatic instead:
 * - In public SEO pages (/calisthenics-strength-standards, calculators, etc.)
 * - In pages that need to be statically prerendered
 * - Where auth state doesn't affect the CTA behavior
 */

import dynamic from 'next/dynamic'
import { Card, CardContent } from '@/components/ui/card'
import { Sparkles } from 'lucide-react'

// Import types from separate auth-free file
import type { ToolConversionCardProps } from './tool-conversion-types'

// Re-export types for consumers
export type { ToolContext, ToolDataPayload, ToolConversionCardProps } from './tool-conversion-types'

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
