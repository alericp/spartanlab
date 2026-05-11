import Stripe from "stripe"

/**
 * Stripe API version constant
 * Update this when upgrading Stripe SDK
 */
const STRIPE_API_VERSION = "2025-02-24.acacia" as const

/**
 * Cached Stripe instance (request-time singleton)
 */
let cachedStripe: Stripe | null = null

/**
 * Get Stripe client instance (request-time safe)
 * 
 * This function is safe to call during build because it doesn't
 * initialize Stripe until first actual request. The STRIPE_SECRET_KEY
 * is only required when a Stripe route is actually called.
 * 
 * @throws Error if STRIPE_SECRET_KEY is not configured (at request time)
 * @returns Stripe client instance
 */
export function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY

  if (!secretKey) {
    throw new Error(
      "STRIPE_SECRET_KEY is not configured. Add it to the deployment environment before using Stripe billing routes."
    )
  }

  if (!cachedStripe) {
    cachedStripe = new Stripe(secretKey, {
      apiVersion: STRIPE_API_VERSION,
    })
  }

  return cachedStripe
}
