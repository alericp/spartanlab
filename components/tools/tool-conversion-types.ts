/**
 * Tool Conversion Card Types
 * 
 * Shared types for ToolConversionCard and ToolConversionCardStatic.
 * This file is auth-free and safe to import in any context.
 * 
 * IMPORTANT: This file should NEVER import from files that use Clerk hooks
 * or any auth-aware dependencies. Keep it pure TypeScript types only.
 */

export type ToolContext = 
  | 'front-lever'
  | 'planche'
  | 'muscle-up'
  | 'iron-cross'
  | 'strength-standards'
  | 'body-fat'
  | 'planche-lean'
  | 'back-lever'
  | 'handstand'
  | 'l-sit'
  | 'general'

export interface ToolDataPayload {
  // Common metrics
  maxPullUps?: number
  maxDips?: number
  maxPushUps?: number
  weightedPullUp?: number
  weightedDip?: number
  bodyweight?: number
  hollowHold?: number
  lSitHold?: number
  
  // Skill-specific
  frontLeverHold?: number
  plancheLeanHold?: number
  plancheLeanDistance?: number
  tuckFrontLeverHold?: number
  ringSupport?: number
  wallHandstand?: number
  
  // Results
  readinessScore?: number
  classification?: string
  limitingFactors?: string[]
  bodyFatPercentage?: number
  strengthLevel?: string
}

export interface ToolConversionCardProps {
  /** Tool context for customized messaging */
  context: ToolContext
  /** Optional tool data to pass to onboarding */
  toolData?: ToolDataPayload
  /** Custom headline override */
  headline?: string
  /** Custom description override */
  description?: string
  /** Custom primary CTA text */
  primaryCtaText?: string
  /** Custom secondary CTA text */
  secondaryCtaText?: string
  /** Custom secondary CTA href */
  secondaryCtaHref?: string
  /** Show compact version */
  compact?: boolean
  /** Custom class name */
  className?: string
}
