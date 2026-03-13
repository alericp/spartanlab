/**
 * Environment Guard - Re-exports from auth-environment.ts
 * 
 * DEPRECATED: This file exists for backwards compatibility.
 * New code should import directly from @/lib/auth-environment
 * 
 * All environment detection logic is now consolidated in auth-environment.ts
 */

// Re-export everything from the single source of truth
export {
  // Domain checks
  PRODUCTION_AUTH_DOMAINS,
  isBrowser,
  getHostname,
  isProductionAuthDomain as isProductionDomain,
  isPreviewEnvironment as isPreviewDomain,
  isProductionDomainFromHostname,
  
  // Clerk checks
  getClerkPublishableKey,
  isClerkConfigured,
  isProductionClerkKey,
  isTestClerkKey,
  
  // Main gate
  shouldInitializeClerk as isAllowedClerkOrigin,
  shouldInitializeClerk,
  getAuthMode,
  shouldUsePreviewFallback as shouldRenderPreviewFallback,
  
  // Utilities
  safeJsonParse,
  safeFetchJson,
  
  // Types
  type AuthMode,
  type ProductionDomain,
} from './auth-environment'

// Legacy alias
export { isProductionAuthDomain as allowProductionAuthRuntime } from './auth-environment'

// Legacy interface - maintained for compatibility
export interface EnvironmentInfo {
  isProductionDomain: boolean
  isPreviewDomain: boolean
  isAllowedClerkOrigin: boolean
  shouldInitializeClerk: boolean
  hostname: string
}

/**
 * Get complete environment information
 * @deprecated Use individual functions from auth-environment instead
 */
export function getEnvironmentInfo(): EnvironmentInfo {
  const { 
    isProductionAuthDomain, 
    isPreviewEnvironment, 
    shouldInitializeClerk, 
    getHostname 
  } = require('./auth-environment')
  
  const isProd = isProductionAuthDomain()
  const isPreview = isPreviewEnvironment()
  const isAllowed = shouldInitializeClerk()
  
  return {
    isProductionDomain: isProd,
    isPreviewDomain: isPreview,
    isAllowedClerkOrigin: isAllowed,
    shouldInitializeClerk: isAllowed,
    hostname: getHostname(),
  }
}
