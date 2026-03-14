/**
 * Deployment Build Stamp
 * Used to verify which code version is running in production
 */

export const AUTH_BUILD_STAMP = 'auth-normalized-v1-native-clerk-only'

/**
 * Log the build stamp once (call on app initialization)
 */
export function logBuildStamp(context: string = 'app'): void {
  console.log(`[SpartanLab] Build: ${AUTH_BUILD_STAMP} (${context})`)
}
