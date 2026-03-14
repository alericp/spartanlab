// AUTH_PROD_UNBLOCK_V1
/**
 * Deployment Build Stamp
 * Used to verify which code version is running in production
 */

export const AUTH_BUILD_STAMP = 'auth-prod-unblock-v1'

/**
 * Log the build stamp once (call on app initialization)
 */
export function logBuildStamp(context: string = 'app'): void {
  console.log(`[SpartanLab] Build: ${AUTH_BUILD_STAMP} (${context})`)
}
