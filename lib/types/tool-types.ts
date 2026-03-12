/**
 * SpartanLab SEO Tool Framework Types
 * 
 * This module defines the types for creating SEO-friendly interactive tools
 * that funnel organic traffic into the SpartanLab platform.
 */

import type { LucideIcon } from 'lucide-react'

/**
 * Tool category for organizing tools on the index page
 */
export type ToolCategory = 
  | 'Skill Sensor' 
  | 'Strength Calculator' 
  | 'Benchmarks'
  | 'Program Generator'
  | 'Pro Intelligence'
  | 'Pro Analytics'
  | 'Pro Projections'
  | 'Pro Insights'

/**
 * SEO content section for tool pages
 */
export interface SeoSection {
  /** H2 heading for the section */
  h2: string
  /** Body content - will be rendered as a paragraph */
  content: string
}

/**
 * Interactive component type for tool pages
 */
export type ToolInteractiveType = 
  | { type: 'skill-sensor'; skillKey: string }
  | { type: 'strength-calculator'; exerciseType: 'weighted_pull_up' | 'weighted_dip' }
  | { type: 'program-builder' }
  | { type: 'none'; ctaRoute: string }

/**
 * Complete tool definition
 */
export interface ToolDefinition {
  /** URL slug for the tool (e.g., 'front-lever-calculator') */
  slug: string
  
  /** Display title for the tool */
  title: string
  
  /** Meta title for SEO (shows in browser tab and search results) */
  metaTitle: string
  
  /** Short description for meta tags and cards */
  description: string
  
  /** Longer description for the hero section */
  longDescription: string
  
  /** Lucide icon component */
  icon: LucideIcon
  
  /** Related skill key for linking to skill tracker */
  relatedSkill: string
  
  /** Feature list for the "What This Tool Does" section */
  features: string[]
  
  /** Primary CTA route in the app */
  appRoute: string
  
  /** Tool category for organization */
  category: ToolCategory
  
  /** Whether to feature this tool prominently */
  featured?: boolean
  
  /** Interactive component configuration */
  interactive: ToolInteractiveType
  
  /** SEO content sections */
  seoSections?: SeoSection[]
  
  /** Keywords for meta tags (optional) */
  keywords?: string[]
}

/**
 * Tool input field definition for custom tool forms
 */
export interface ToolInputField {
  /** Field identifier */
  id: string
  
  /** Display label */
  label: string
  
  /** Input type */
  type: 'number' | 'select' | 'text' | 'range'
  
  /** Placeholder text */
  placeholder?: string
  
  /** Unit suffix (e.g., 'lbs', 'seconds', 'reps') */
  unit?: string
  
  /** Options for select fields */
  options?: { value: string | number; label: string }[]
  
  /** Min/max for number/range inputs */
  min?: number
  max?: number
  step?: number
  
  /** Help text shown below the input */
  helpText?: string
}

/**
 * Tool result section definition
 */
export interface ToolResultSection {
  /** Section title */
  title: string
  
  /** Result value to display */
  value: string | number
  
  /** Unit or suffix */
  unit?: string
  
  /** Description or context */
  description?: string
  
  /** Highlight color (for levels/status) */
  color?: string
}

/**
 * CTA configuration for tool pages
 */
export interface ToolCTA {
  /** CTA heading */
  heading: string
  
  /** CTA description */
  description: string
  
  /** Button text */
  buttonText: string
  
  /** Button route */
  buttonRoute: string
  
  /** Whether this is the primary (highlighted) CTA */
  primary?: boolean
}

/**
 * Related resource link
 */
export interface RelatedResource {
  /** Link text */
  text: string
  
  /** Link route */
  route: string
  
  /** Optional description */
  description?: string
}

/**
 * Complete tool page props
 */
export interface ToolPageProps {
  tool: ToolDefinition
  relatedTools?: ToolDefinition[]
  relatedResources?: RelatedResource[]
}

/**
 * Tool calculation result (generic)
 */
export interface ToolCalculationResult {
  /** Whether calculation was successful */
  success: boolean
  
  /** Error message if calculation failed */
  error?: string
  
  /** Result sections to display */
  sections?: ToolResultSection[]
  
  /** Focus areas or recommendations */
  focusAreas?: string[]
  
  /** Next step recommendation */
  nextStep?: string
  
  /** Overall score (0-100) if applicable */
  score?: number
  
  /** Level/status label */
  level?: string
  
  /** Level color */
  levelColor?: string
}
