'use server'

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
      // String query with params
      const result = await client(sql, params)
      return result as T[]
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

/**
 * Get the Neon SQL client (sync wrapper for tagged template usage)
 * Returns null if database is not available
 */
export function getDb() {
  if (!initialized) {
    initializeClient()
  }
  return sqlClient
}

