import { neon } from '@neondatabase/serverless'
import { isPreviewMode } from './app-mode'

// Safe Neon client - only initializes if DATABASE_URL exists
let sqlClient: any = null
let initialized = false

const initializeClient = () => {
  if (initialized || isPreviewMode()) {
    return
  }

  if (process.env.DATABASE_URL) {
    try {
      sqlClient = neon(process.env.DATABASE_URL)
      initialized = true
    } catch (error) {
      console.error('[SpartanLab] Failed to initialize DB client:', error)
      initialized = true // Mark as initialized to avoid repeated attempts
    }
  }
  initialized = true
}

/**
 * Check if database is available and configured
 */
export async function isDatabaseAvailable(): Promise<boolean> {
  if (isPreviewMode()) {
    return false
  }
  return Boolean(process.env.DATABASE_URL)
}

/**
 * Get the Neon SQL client
 */
export async function getSqlClient() {
  if (!initialized) {
    initializeClient()
  }
  return sqlClient
}

/**
 * Execute a parameterized query safely
 */
export async function query<T>(
  sql: TemplateStringsArray | string,
  params: any[] = []
): Promise<T[]> {
  if (isPreviewMode()) {
    return []
  }

  const client = await getSqlClient()
  if (!client) {
    return []
  }

  try {
    if (typeof sql === 'string') {
      // String query with params - use client.query() for conventional parameterized calls
      // Note: neon() returns a function that can be used as tagged template OR via .query()
      const result = await client.query(sql, params)
      // client.query() returns { rows: T[], ... } - extract rows array
      return (result?.rows ?? result) as T[]
    } else {
      // Template string (will be handled by neon's sql`` function)
      return [] // This path shouldn't normally happen
    }
  } catch (error) {
    console.error('[SpartanLab DB Error]', error)
    return []
  }
}

/**
 * Execute a single row query
 */
export async function queryOne<T>(
  sql: string,
  params: any[] = []
): Promise<T | null> {
  const results = await query<T>(sql, params)
  return results?.[0] || null
}

/**
 * Check if database connection is working
 */
export async function isDatabaseConnected(): Promise<boolean> {
  if (isPreviewMode()) {
    return false
  }

  try {
    const client = await getSqlClient()
    if (!client) return false

    const result = await query('SELECT 1 as ping')
    return result.length > 0
  } catch {
    return false
  }
}

// =============================================================================
// SCHEMA READINESS GUARDS
// =============================================================================

// Cache for schema readiness checks (to avoid repeated queries)
let programHistorySchemaReady: boolean | null = null
let schemaCheckTimestamp = 0
const SCHEMA_CHECK_TTL = 30000 // 30 seconds

/**
 * Check if the program_history table exists in the database
 * This prevents 500 errors when the schema hasn't been migrated yet
 * 
 * Results are cached briefly to avoid repeated queries
 */
export async function isProgramHistorySchemaReady(): Promise<boolean> {
  if (isPreviewMode()) {
    return false
  }

  // Return cached result if still valid
  if (programHistorySchemaReady !== null && Date.now() - schemaCheckTimestamp < SCHEMA_CHECK_TTL) {
    return programHistorySchemaReady
  }

  try {
    const client = await getSqlClient()
    if (!client) {
      programHistorySchemaReady = false
      schemaCheckTimestamp = Date.now()
      return false
    }

    // Query information_schema to check if table exists
    const result = await client`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'program_history'
      ) as exists
    `

    programHistorySchemaReady = result[0]?.exists === true
    schemaCheckTimestamp = Date.now()
    
    if (!programHistorySchemaReady) {
      console.log('[DB] program_history schema not ready - history features will be unavailable')
    }
    
    return programHistorySchemaReady
  } catch (error) {
    console.error('[DB] Error checking schema readiness:', error)
    programHistorySchemaReady = false
    schemaCheckTimestamp = Date.now()
    return false
  }
}

/**
 * Check if all history tables exist
 * Checks: program_history, workout_session_history, personal_record_history
 */
export async function isFullHistorySchemaReady(): Promise<{
  ready: boolean
  programHistory: boolean
  workoutHistory: boolean
  prHistory: boolean
}> {
  if (isPreviewMode()) {
    return { ready: false, programHistory: false, workoutHistory: false, prHistory: false }
  }

  try {
    const client = await getSqlClient()
    if (!client) {
      return { ready: false, programHistory: false, workoutHistory: false, prHistory: false }
    }

    const result = await client`
      SELECT 
        EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'program_history') as program_history,
        EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'workout_session_history') as workout_history,
        EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'personal_record_history') as pr_history
    `

    const programHistory = result[0]?.program_history === true
    const workoutHistory = result[0]?.workout_history === true
    const prHistory = result[0]?.pr_history === true

    return {
      ready: programHistory && workoutHistory && prHistory,
      programHistory,
      workoutHistory,
      prHistory,
    }
  } catch (error) {
    console.error('[DB] Error checking full history schema:', error)
    return { ready: false, programHistory: false, workoutHistory: false, prHistory: false }
  }
}

/**
 * Reset schema cache - call when schema might have changed (e.g., after migrations)
 */
export function resetSchemaCache(): void {
  programHistorySchemaReady = null
  schemaCheckTimestamp = 0
}

/**
 * Get the Neon SQL client
 * Returns null if database is not available
 */
export async function getDb() {
  if (!initialized) {
    initializeClient()
  }
  return sqlClient
}

