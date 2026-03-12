/**
 * SpartanLab Brand Color System
 * 
 * Premium dark athletic interface palette
 * Use these constants for consistent styling across the application
 */

// Primary Brand Color - Spartan Red
// Use for: primary buttons, key highlights, score indicators, brand accents
export const SPARTAN_RED = '#C1121F'
export const SPARTAN_RED_HOVER = '#A30F1A'
export const SPARTAN_RED_LIGHT = '#C1121F20' // 12.5% opacity for backgrounds

// Neutral Backgrounds
export const CHARCOAL_BLACK = '#0F1115'  // Main background, app canvas
export const DEEP_STEEL = '#1A1F26'      // Cards, panels, containers
export const MUTED_STEEL = '#2B313A'     // Borders, separators, inactive elements

// Text Colors
export const TEXT_PRIMARY = '#E6E9EF'    // Headings, primary text, key values
export const TEXT_SECONDARY = '#A4ACB8'  // Descriptions, metadata, helper text
export const TEXT_TERTIARY = '#6B7280'   // Disabled, placeholder text

// Accent Color - Steel Blue (use sparingly)
export const STEEL_BLUE = '#4F6D8A'      // Charts, informational highlights

// Semantic Colors
export const SUCCESS = '#22C55E'         // Success states, positive trends
export const WARNING = '#F59E0B'         // Warning states, caution
export const ERROR = '#C1121F'           // Error states (same as brand red)
export const INFO = '#4F6D8A'            // Info states (same as steel blue)

// Chart Colors - Disciplined palette
export const CHART_COLORS = {
  primary: SPARTAN_RED,
  secondary: STEEL_BLUE,
  tertiary: TEXT_SECONDARY,
  quaternary: MUTED_STEEL,
  quinary: TEXT_PRIMARY,
} as const

// Level Colors (for Spartan Score, skill levels)
export const LEVEL_COLORS = {
  elite: '#FFD700',      // Gold
  advanced: SPARTAN_RED, // Brand red
  intermediate: '#60A5FA', // Blue
  developing: TEXT_SECONDARY,
  beginner: TEXT_TERTIARY,
} as const

// Trend Colors
export const TREND_COLORS = {
  improving: '#22C55E',
  stable: STEEL_BLUE,
  plateauing: '#F59E0B',
  regressing: SPARTAN_RED,
} as const

/**
 * Legacy color mapping
 * Maps old colors to new palette for migration reference
 * 
 * OLD -> NEW
 * #E63946 -> #C1121F (Spartan Red - more premium, less neon)
 * #121212 -> #0F1115 (Charcoal Black - deeper, more premium)
 * #2A2A2A -> #1A1F26 (Deep Steel - cooler, more modern)
 * #3A3A3A -> #2B313A (Muted Steel - better contrast)
 * #A5A5A5 -> #A4ACB8 (Text Secondary - slightly cooler)
 * #F5F5F5 -> #E6E9EF (Text Primary - slightly warmer)
 */
export const LEGACY_COLOR_MAP = {
  '#E63946': SPARTAN_RED,
  '#121212': CHARCOAL_BLACK,
  '#2A2A2A': DEEP_STEEL,
  '#3A3A3A': MUTED_STEEL,
  '#A5A5A5': TEXT_SECONDARY,
  '#F5F5F5': TEXT_PRIMARY,
  '#4A4A4A': MUTED_STEEL,
  '#5A5A5A': MUTED_STEEL,
  '#6A6A6A': TEXT_TERTIARY,
  '#808080': TEXT_SECONDARY,
} as const

// Tailwind class helpers
export const TAILWIND_COLORS = {
  // Backgrounds
  bgBase: 'bg-[#0F1115]',
  bgCard: 'bg-[#1A1F26]',
  bgMuted: 'bg-[#2B313A]',
  
  // Text
  textPrimary: 'text-[#E6E9EF]',
  textSecondary: 'text-[#A4ACB8]',
  textTertiary: 'text-[#6B7280]',
  
  // Brand
  textRed: 'text-[#C1121F]',
  bgRed: 'bg-[#C1121F]',
  borderRed: 'border-[#C1121F]',
  
  // Borders
  borderMuted: 'border-[#2B313A]',
  
  // Accent
  textBlue: 'text-[#4F6D8A]',
  bgBlue: 'bg-[#4F6D8A]',
} as const
