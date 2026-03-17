/**
 * Environment Variable Validation
 * 
 * Validates required environment variables at startup and logs warnings
 * for any missing configuration. This runs on the server side only.
 */

import 'server-only'

export interface EnvValidationResult {
  valid: boolean
  missingVars: string[]
  warnings: string[]
}

// Required environment variables for production
const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
] as const

// Optional but recommended environment variables
const RECOMMENDED_ENV_VARS = [
  'DATABASE_URL',
  'OWNER_EMAIL',
  'STRIPE_SECRET_KEY',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'RESEND_API_KEY',
] as const

/**
 * Validate all required environment variables
 */
export async function validateEnvironment(): Promise<EnvValidationResult> {
  const missingVars: string[] = []
  const warnings: string[] = []

  // Check required vars
  for (const varName of REQUIRED_ENV_VARS) {
    if (!process.env[varName]) {
      missingVars.push(varName)
    }
  }

  // Check recommended vars
  for (const varName of RECOMMENDED_ENV_VARS) {
    if (!process.env[varName]) {
      warnings.push(`${varName} is not set - some features may be unavailable`)
    }
  }

  // Log warnings in development
  if (process.env.NODE_ENV !== 'production') {
    if (missingVars.length > 0) {
      console.warn('[SpartanLab] Missing required environment variables:', missingVars.join(', '))
    }
    if (warnings.length > 0) {
      console.warn('[SpartanLab] Environment warnings:', warnings.join('; '))
    }
  }

  return {
    valid: missingVars.length === 0,
    missingVars,
    warnings,
  }
}

/**
 * Check if Clerk is properly configured
 */
export async function isClerkConfigured(): Promise<boolean> {
  return Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.CLERK_SECRET_KEY
  )
}

/**
 * Check if Stripe is properly configured
 */
export async function isStripeConfigured(): Promise<boolean> {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  )
}

/**
 * Check if database is properly configured
 */
export async function isDatabaseConfigured(): Promise<boolean> {
  return Boolean(process.env.DATABASE_URL)
}

/**
 * Check if owner email is configured
 */
export async function isOwnerConfigured(): Promise<boolean> {
  return Boolean(process.env.OWNER_EMAIL)
}

/**
 * Check if email service (Resend) is properly configured
 */
export async function isEmailConfigured(): Promise<boolean> {
  return Boolean(process.env.RESEND_API_KEY)
}

/**
 * Get configuration summary for debugging
 */
export async function getConfigSummary(): Promise<{
  clerk: boolean
  stripe: boolean
  database: boolean
  owner: boolean
  email: boolean
}> {
  return {
    clerk: await isClerkConfigured(),
    stripe: await isStripeConfigured(),
    database: await isDatabaseConfigured(),
    owner: await isOwnerConfigured(),
    email: await isEmailConfigured(),
  }
}
