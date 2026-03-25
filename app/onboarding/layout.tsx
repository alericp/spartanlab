import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from '@/components/ui/toaster'
import { OwnerBootstrapProvider } from '@/components/providers/OwnerBootstrapProvider'

/**
 * Onboarding Layout - Provides ClerkProvider + OwnerBootstrapProvider for onboarding pages
 * 
 * [PHASE 16I] CRITICAL FIX:
 * OnboardingCompleteClient uses useOwnerBootstrap() which requires OwnerBootstrapProvider.
 * Without this provider, ownerLoaded stays false forever, isEntitlementReady never becomes true,
 * and the pre-generation gate never releases - causing infinite loading.
 * 
 * Provider hierarchy:
 * - ClerkProvider (auth context)
 *   - OwnerBootstrapProvider (owner/entitlement bootstrap)
 *     - children (onboarding pages)
 *     - Toaster
 */
export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // [PHASE 16I] Diagnostic: Provider mount audit
  console.log('[phase16i-onboarding-provider-mounted-audit]', {
    ClerkProvider: true,
    OwnerBootstrapProvider: true,
    timestamp: new Date().toISOString(),
  })
  
  return (
    <ClerkProvider>
      <OwnerBootstrapProvider>
        {children}
        <Toaster />
      </OwnerBootstrapProvider>
    </ClerkProvider>
  )
}
