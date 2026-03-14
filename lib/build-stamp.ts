// AUTH_IMPORT_GRAPH_V6
/**
 * Deployment Build Stamp
 * Used to verify which code version is running in production
 */

export const AUTH_BUILD_STAMP = 'auth-import-graph-v6'

/**
 * Log the build stamp once (call on app initialization)
 */
export function logBuildStamp(context: string = 'app'): void {
  console.log(`[SpartanLab] Build: ${AUTH_BUILD_STAMP} (${context})`)
}
