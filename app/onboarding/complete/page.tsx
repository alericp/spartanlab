// =============================================================================
// ROUTE CONFIGURATION - SERVER COMPONENT WRAPPER
// =============================================================================
// This page is a SIDE-EFFECT route that runs generateFirstProgram() on mount.
// It must NOT be cached, prefetched as stale content, or treated as static.
//
// Architecture:
// - This file is a SERVER COMPONENT wrapper (no 'use client')
// - It exports route-level config to prevent prerendering
// - All interactive logic lives in OnboardingCompleteClient (client component)
//
// This pattern ensures Next.js App Router treats the route as dynamic
// and does not serve stale prerendered content for this side-effect flow.

import OnboardingCompleteClient from '@/components/onboarding/OnboardingCompleteClient'

// Route segment config: force dynamic rendering, no caching
// This prevents ISR/prerender behavior that was causing duplicate generation issues
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Metadata for the page
export const metadata = {
  title: 'Completing Setup | SpartanLab',
  description: 'Generating your personalized training program',
}

/**
 * Onboarding Complete Page - Server Wrapper
 * 
 * This is a minimal server component that:
 * 1. Declares route-level dynamic behavior via exports above
 * 2. Renders the client component containing all interactive logic
 * 
 * The client component (OnboardingCompleteClient) handles:
 * - Program generation via generateFirstProgram()
 * - Idempotency guards (ref + sessionStorage)
 * - UI states (generating, ready, error)
 * - Navigation after success
 */
export default function OnboardingCompletePage() {
  return <OnboardingCompleteClient />
}
