// =============================================================================
// U.S. NAVY BODY FAT CALCULATOR
// =============================================================================
// Implements the U.S. Navy body fat estimation formula
// This is one of the most accurate circumference-based methods available

import type { Sex } from './athlete-profile'
export type { Sex }

export interface MaleBodyFatInputs {
  sex: 'male'
  heightInches: number
  neckInches: number
  waistInches: number
}

export interface FemaleBodyFatInputs {
  sex: 'female'
  heightInches: number
  neckInches: number
  waistInches: number
  hipInches: number
}

export type BodyFatInputs = MaleBodyFatInputs | FemaleBodyFatInputs

export interface BodyFatResult {
  bodyFatPercent: number
  category: BodyFatCategory
  description: string
}

export type BodyFatCategory = 
  | 'essential'
  | 'athletes'
  | 'fitness'
  | 'average'
  | 'above_average'

// Body fat categories by sex
const MALE_CATEGORIES: { max: number; category: BodyFatCategory; description: string }[] = [
  { max: 6, category: 'essential', description: 'Essential fat (very lean)' },
  { max: 13, category: 'athletes', description: 'Athletes (lean/athletic)' },
  { max: 17, category: 'fitness', description: 'Fitness (fit)' },
  { max: 24, category: 'average', description: 'Average' },
  { max: 100, category: 'above_average', description: 'Above average' },
]

const FEMALE_CATEGORIES: { max: number; category: BodyFatCategory; description: string }[] = [
  { max: 14, category: 'essential', description: 'Essential fat (very lean)' },
  { max: 20, category: 'athletes', description: 'Athletes (lean/athletic)' },
  { max: 24, category: 'fitness', description: 'Fitness (fit)' },
  { max: 31, category: 'average', description: 'Average' },
  { max: 100, category: 'above_average', description: 'Above average' },
]

/**
 * Calculate body fat percentage using U.S. Navy method
 * 
 * Male formula:
 * BF% = 86.010 × log10(waist - neck) - 70.041 × log10(height) + 36.76
 * 
 * Female formula:
 * BF% = 163.205 × log10(waist + hip - neck) - 97.684 × log10(height) - 78.387
 */
export function calculateBodyFat(inputs: BodyFatInputs): BodyFatResult {
  let bodyFatPercent: number

  if (inputs.sex === 'male') {
    const { heightInches, neckInches, waistInches } = inputs
    
    // Validate inputs
    if (waistInches <= neckInches) {
      throw new Error('Waist measurement must be larger than neck measurement')
    }
    
    bodyFatPercent = 
      86.010 * Math.log10(waistInches - neckInches) - 
      70.041 * Math.log10(heightInches) + 
      36.76
  } else {
    const { heightInches, neckInches, waistInches, hipInches } = inputs
    
    // Validate inputs
    if (waistInches + hipInches <= neckInches) {
      throw new Error('Combined waist and hip must be larger than neck measurement')
    }
    
    bodyFatPercent = 
      163.205 * Math.log10(waistInches + hipInches - neckInches) - 
      97.684 * Math.log10(heightInches) - 
      78.387
  }

  // Clamp to reasonable range and round to 1 decimal
  bodyFatPercent = Math.max(2, Math.min(50, bodyFatPercent))
  bodyFatPercent = Math.round(bodyFatPercent * 10) / 10

  // Get category
  const categories = inputs.sex === 'male' ? MALE_CATEGORIES : FEMALE_CATEGORIES
  const { category, description } = categories.find(c => bodyFatPercent <= c.max) || categories[categories.length - 1]

  return {
    bodyFatPercent,
    category,
    description,
  }
}

/**
 * Convert centimeters to inches
 */
export function cmToInches(cm: number): number {
  return cm / 2.54
}

/**
 * Convert inches to centimeters
 */
export function inchesToCm(inches: number): number {
  return inches * 2.54
}

/**
 * Validate measurement is reasonable
 */
export function isValidMeasurement(value: number, type: 'height' | 'neck' | 'waist' | 'hip'): boolean {
  const ranges: Record<string, { min: number; max: number }> = {
    height: { min: 48, max: 96 },      // 4ft to 8ft in inches
    neck: { min: 10, max: 30 },        // 10 to 30 inches
    waist: { min: 20, max: 70 },       // 20 to 70 inches
    hip: { min: 25, max: 70 },         // 25 to 70 inches
  }
  
  const range = ranges[type]
  return value >= range.min && value <= range.max
}

// Measurement instructions for the UI
export const MEASUREMENT_INSTRUCTIONS = {
  neck: {
    title: 'Neck',
    instruction: 'Measure just below your larynx (Adam\'s apple) with the tape horizontal.',
    tip: 'Keep the tape snug but not tight. Look straight ahead.',
  },
  waist: {
    title: 'Waist',
    instruction: 'Measure at the narrowest point of your torso, typically at or just above your navel.',
    tip: 'Relax and don\'t suck in your stomach. Keep the tape horizontal.',
  },
  hip: {
    title: 'Hips',
    instruction: 'Measure at the widest point of your hips and buttocks.',
    tip: 'Stand with feet together. Keep the tape horizontal all the way around.',
  },
}
