'use client'

/**
 * AuthAwareProgramCTA - Auth-aware CTA for public program pages
 * 
 * Routes signed-in users to /program (canonical authenticated route)
 * Routes signed-out users to the public builder funnel
 * Shows a subtle bridge message for signed-in users explaining the page context
 */

import { useAuth } from '@clerk/nextjs'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Info } from 'lucide-react'

interface AuthAwareProgramCTAProps {
  /** Headline for the CTA section */
  headline?: string
  /** Description text */
  description?: string
  /** Text for signed-out CTA button */
  signedOutCtaText?: string
  /** Text for signed-in CTA button */
  signedInCtaText?: string
  /** URL for signed-out users (public builder funnel) */
  signedOutHref?: string
  /** The skill/program context (e.g., "planche", "front lever") */
  skillContext?: string
}

export function AuthAwareProgramCTA({
  headline = 'Want a Personalized Version?',
  description = 'Use the SpartanLab Program Builder to generate a custom program based on your current strength level, available equipment, and training schedule.',
  signedOutCtaText = 'Build Your Custom Program',
  signedInCtaText = 'Open Your Program',
  signedOutHref = '/calisthenics-program-builder',
  skillContext,
}: AuthAwareProgramCTAProps) {
  const { isLoaded, userId } = useAuth()
  
  // Signed-in users go to /program (canonical authenticated route)
  const href = userId ? '/program' : signedOutHref
  const ctaText = userId ? signedInCtaText : signedOutCtaText
  
  return (
    <section className="bg-gradient-to-r from-[#C1121F]/20 to-[#1C1F26] border border-[#C1121F]/30 rounded-xl p-8 text-center">
      {/* Bridge message for signed-in users */}
      {isLoaded && userId && (
        <div className="flex items-center justify-center gap-2 text-sm text-[#A5A5A5] mb-4">
          <Info className="w-4 h-4 text-[#6B7280]" />
          <span>
            This is a general {skillContext ? `${skillContext} ` : ''}guide. Your personalized program is in the app.
          </span>
        </div>
      )}
      
      <h2 className="text-2xl font-bold text-white mb-3">
        {userId ? 'Access Your Personalized Program' : headline}
      </h2>
      <p className="text-[#A5A5A5] mb-6 max-w-xl mx-auto">
        {userId 
          ? 'Your SpartanLab program is tailored to your strength level, goals, and available equipment.'
          : description
        }
      </p>
      <Link href={href}>
        <Button className="bg-[#C1121F] hover:bg-[#A50E1A] text-white">
          {ctaText}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </Link>
    </section>
  )
}
