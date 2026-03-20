/**
 * PublicProgramCTA - Public-route safe CTA component for SEO program pages
 * 
 * IMPORTANT: This component is used in prerendered public routes.
 * DO NOT add Clerk hooks (useAuth, useUser, etc.) here.
 * DO NOT add any auth-aware logic here.
 * 
 * This is a pure presentational component that accepts explicit props only.
 * All routing goes to the public builder funnel.
 */

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

interface AuthAwareProgramCTAProps {
  /** Headline for the CTA section */
  headline?: string
  /** Description text */
  description?: string
  /** Text for CTA button */
  ctaText?: string
  /** URL for the CTA (defaults to public builder) */
  href?: string
  /** The skill/program context (e.g., "planche", "front lever") - used in description */
  skillContext?: string
  // Legacy props for backward compatibility - ignored in public-safe version
  signedOutCtaText?: string
  signedInCtaText?: string
  signedOutHref?: string
}

export function AuthAwareProgramCTA({
  headline = 'Want a Personalized Version?',
  description = 'Use the SpartanLab Program Builder to generate a custom program based on your current strength level, available equipment, and training schedule.',
  ctaText = 'Build Your Custom Program',
  href = '/calisthenics-program-builder',
  // Legacy prop fallbacks
  signedOutCtaText,
  signedOutHref,
}: AuthAwareProgramCTAProps) {
  // Use legacy props if provided for backward compatibility
  const finalHref = href || signedOutHref || '/calisthenics-program-builder'
  const finalCtaText = ctaText || signedOutCtaText || 'Build Your Custom Program'
  
  return (
    <section className="bg-gradient-to-r from-[#C1121F]/20 to-[#1C1F26] border border-[#C1121F]/30 rounded-xl p-8 text-center">
      <h2 className="text-2xl font-bold text-white mb-3">
        {headline}
      </h2>
      <p className="text-[#A5A5A5] mb-6 max-w-xl mx-auto">
        {description}
      </p>
      <Link href={finalHref}>
        <Button className="bg-[#C1121F] hover:bg-[#A50E1A] text-white">
          {finalCtaText}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </Link>
    </section>
  )
}
