/**
 * SEO Funnel Configuration
 * 
 * Defines the SEO page hierarchy and internal linking structure for SpartanLab.
 * Eliminates keyword cannibalization by assigning unique intents to each page.
 * 
 * HIERARCHY STRUCTURE:
 * 
 * SKILL HUB PAGES (Parent)
 *   /skills/[skill]
 *   Intent: Comprehensive skill overview, links to all resources
 *   
 *   → READINESS CALCULATOR (Child)
 *     /[skill]-readiness-calculator  
 *     Intent: Assessment tool, primary SEO landing page for "am I ready" queries
 *     
 *   → PROGRESSION GUIDE (Child)
 *     /[skill]-progression
 *     Intent: Step-by-step progression breakdown, "how to progress" queries
 *     
 *   → TRAINING GUIDE (Child)
 *     /guides/[skill]-training
 *     Intent: Deep training methodology, "how to train" queries
 *     
 *   → TRAINING PROGRAM (Child)
 *     /programs/[skill]-program
 *     Intent: Structured program template, "program" queries
 *     
 *   → STRENGTH STANDARDS (Related)
 *     /calisthenics-strength-standards
 *     Intent: Benchmark comparison, "how strong" queries
 * 
 * PAGES TO CONSOLIDATE (CANONICAL REDIRECTS):
 * - /tools/front-lever-calculator → /front-lever-readiness-calculator
 * - /front-lever-training-guide → /guides/front-lever-training  
 * - Similar patterns for planche, muscle-up, etc.
 */

export type SkillSlug = 
  | 'front-lever'
  | 'planche' 
  | 'muscle-up'
  | 'handstand-push-up'
  | 'back-lever'
  | 'l-sit'
  | 'one-arm-pull-up'
  | 'iron-cross'

export type PageIntent = 
  | 'hub'           // Skill overview hub
  | 'calculator'    // Readiness assessment
  | 'progression'   // Step-by-step progression
  | 'training'      // Deep training methodology
  | 'program'       // Structured program
  | 'exercises'     // Exercise deep-dive
  | 'standards'     // Strength benchmarks
  | 'comparison'    // Skill comparisons

export interface SEOPageConfig {
  slug: string
  intent: PageIntent
  canonicalPath: string
  title: string
  h1: string
  primaryKeyword: string
  secondaryKeywords: string[]
  metaDescription: string
  parentPage?: string
  childPages?: string[]
  relatedPages: string[]
  conversionCTA: {
    text: string
    href: string
    context: string
  }
}

export interface SkillHubConfig {
  skill: SkillSlug
  displayName: string
  hubPath: string
  pages: {
    calculator: string
    progression: string
    training: string
    program: string
  }
  relatedExercises: string[]
  strengthStandardsSection: string
}

// =============================================================================
// SKILL HUB CONFIGURATIONS
// =============================================================================

export const SKILL_HUBS: Record<SkillSlug, SkillHubConfig> = {
  'front-lever': {
    skill: 'front-lever',
    displayName: 'Front Lever',
    hubPath: '/skills/front-lever',
    pages: {
      calculator: '/front-lever-readiness-calculator',
      progression: '/front-lever-progression',
      training: '/guides/front-lever-training',
      program: '/programs/front-lever-program',
    },
    relatedExercises: [
      '/exercises/front-lever-row',
      '/exercises/arch-hang',
      '/exercises/pull-up',
      '/exercises/hollow-body-hold',
    ],
    strengthStandardsSection: 'pulling',
  },
  'planche': {
    skill: 'planche',
    displayName: 'Planche',
    hubPath: '/skills/planche',
    pages: {
      calculator: '/planche-readiness-calculator',
      progression: '/planche-progression',
      training: '/guides/planche-progression',
      program: '/programs/planche-program',
    },
    relatedExercises: [
      '/exercises/pseudo-planche-push-up',
      '/exercises/planche-lean',
    ],
    strengthStandardsSection: 'pushing',
  },
  'muscle-up': {
    skill: 'muscle-up',
    displayName: 'Muscle Up',
    hubPath: '/skills/muscle-up',
    pages: {
      calculator: '/muscle-up-readiness-calculator',
      progression: '/muscle-up-progression',
      training: '/guides/muscle-up-training',
      program: '/programs/muscle-up-program',
    },
    relatedExercises: [
      '/exercises/pull-up',
      '/exercises/dip',
    ],
    strengthStandardsSection: 'pulling',
  },
  'handstand-push-up': {
    skill: 'handstand-push-up',
    displayName: 'Handstand Push Up',
    hubPath: '/skills/handstand-push-up',
    pages: {
      calculator: '/hspu-readiness-calculator',
      progression: '/guides/handstand-push-up-progression',
      training: '/guides/handstand-training',
      program: '/programs/handstand-push-up-program',
    },
    relatedExercises: [],
    strengthStandardsSection: 'pushing',
  },
  'back-lever': {
    skill: 'back-lever',
    displayName: 'Back Lever',
    hubPath: '/skills/back-lever',
    pages: {
      calculator: '/back-lever-readiness-calculator',
      progression: '/guides/back-lever-training',
      training: '/guides/back-lever-training',
      program: '/programs/back-lever-program',
    },
    relatedExercises: [],
    strengthStandardsSection: 'pulling',
  },
  'l-sit': {
    skill: 'l-sit',
    displayName: 'L-Sit',
    hubPath: '/skills/l-sit',
    pages: {
      calculator: '/l-sit-readiness-calculator',
      progression: '/exercises/l-sit',
      training: '/exercises/l-sit',
      program: '/programs/core-program',
    },
    relatedExercises: [
      '/exercises/hollow-body-hold',
    ],
    strengthStandardsSection: 'core',
  },
  'one-arm-pull-up': {
    skill: 'one-arm-pull-up',
    displayName: 'One Arm Pull Up',
    hubPath: '/skills/one-arm-pull-up',
    pages: {
      calculator: '/one-arm-pull-up-calculator',
      progression: '/guides/one-arm-pull-up-training',
      training: '/guides/one-arm-pull-up-training',
      program: '/programs/one-arm-pull-up-program',
    },
    relatedExercises: [
      '/exercises/pull-up',
    ],
    strengthStandardsSection: 'pulling',
  },
  'iron-cross': {
    skill: 'iron-cross',
    displayName: 'Iron Cross',
    hubPath: '/skills/iron-cross',
    pages: {
      calculator: '/iron-cross-readiness-calculator',
      progression: '/guides/iron-cross-training',
      training: '/guides/iron-cross-training',
      program: '/programs/iron-cross-program',
    },
    relatedExercises: [],
    strengthStandardsSection: 'rings',
  },
}

// =============================================================================
// CANONICAL URL REDIRECTS
// =============================================================================

/**
 * Pages that should redirect to canonical versions to eliminate duplication
 */
export const CANONICAL_REDIRECTS: Record<string, string> = {
  // Calculator duplicates
  '/tools/front-lever-calculator': '/front-lever-readiness-calculator',
  '/tools/planche-strength-calculator': '/planche-readiness-calculator',
  '/tools/front-lever-strength-test': '/front-lever-readiness-calculator',
  
  // Training guide duplicates
  '/front-lever-training-guide': '/guides/front-lever-training',
  '/planche-training-guide': '/guides/planche-progression',
  
  // Old calculator paths
  '/calculators/skill-readiness-score': '/front-lever-readiness-calculator',
}

// =============================================================================
// PAGE INTENT DEFINITIONS
// =============================================================================

/**
 * Defines what queries each page type should target
 */
export const PAGE_INTENT_KEYWORDS: Record<PageIntent, string[]> = {
  hub: ['guide', 'tutorial', 'learn', 'master', 'complete guide'],
  calculator: ['calculator', 'test', 'check', 'assessment', 'ready', 'readiness', 'requirements'],
  progression: ['progression', 'progressions', 'steps', 'stages', 'how to progress'],
  training: ['training', 'how to train', 'exercises', 'workout', 'routine'],
  program: ['program', 'plan', 'schedule', 'weekly', 'template'],
  exercises: ['exercise', 'how to do', 'technique', 'form'],
  standards: ['standards', 'benchmarks', 'requirements', 'how strong', 'strength'],
  comparison: ['vs', 'versus', 'compared', 'difference', 'which is'],
}

// =============================================================================
// INTERNAL LINKING MATRIX
// =============================================================================

/**
 * Defines strategic internal links for each page type
 */
export function getInternalLinks(skill: SkillSlug, currentIntent: PageIntent): Array<{
  href: string
  label: string
  priority: 'high' | 'medium' | 'low'
}> {
  const hub = SKILL_HUBS[skill]
  if (!hub) return []
  
  const links: Array<{ href: string; label: string; priority: 'high' | 'medium' | 'low' }> = []
  
  // Always link to hub unless we're on the hub
  if (currentIntent !== 'hub') {
    links.push({ href: hub.hubPath, label: `${hub.displayName} Hub`, priority: 'medium' })
  }
  
  // Calculator is high priority from content pages
  if (currentIntent !== 'calculator') {
    links.push({ 
      href: hub.pages.calculator, 
      label: `${hub.displayName} Readiness Calculator`, 
      priority: currentIntent === 'hub' ? 'high' : 'medium' 
    })
  }
  
  // Progression from training/program pages
  if (currentIntent !== 'progression' && ['training', 'program', 'hub'].includes(currentIntent)) {
    links.push({ href: hub.pages.progression, label: `${hub.displayName} Progressions`, priority: 'medium' })
  }
  
  // Training guide from calculator results
  if (currentIntent !== 'training' && ['calculator', 'hub'].includes(currentIntent)) {
    links.push({ href: hub.pages.training, label: `${hub.displayName} Training Guide`, priority: 'high' })
  }
  
  // Program is conversion-focused - high priority from most places
  if (currentIntent !== 'program') {
    links.push({ href: hub.pages.program, label: `${hub.displayName} Program`, priority: 'high' })
  }
  
  // Link to onboarding for personalized program
  links.push({ href: '/onboarding', label: 'Generate Personalized Program', priority: 'high' })
  
  // Strength standards from calculator
  if (currentIntent === 'calculator') {
    links.push({ href: '/calisthenics-strength-standards', label: 'Strength Standards', priority: 'medium' })
  }
  
  return links
}

// =============================================================================
// CONVERSION CTAs
// =============================================================================

export const CONVERSION_CTAS = {
  fromCalculator: {
    primary: {
      text: 'Generate Your Personalized Training Program',
      href: '/onboarding',
      context: 'Based on your readiness score, SpartanLab can create a customized program targeting your specific limiting factors.',
    },
    secondary: {
      text: 'View Training Guide',
      href: '', // Filled dynamically
      context: 'Learn the exercises and methodology for this skill.',
    },
  },
  fromGuide: {
    primary: {
      text: 'Check Your Readiness',
      href: '', // Filled dynamically
      context: 'Find out exactly where you stand and what to train next.',
    },
    secondary: {
      text: 'Get a Structured Program',
      href: '/onboarding',
      context: 'Let SpartanLab build your personalized training plan.',
    },
  },
  fromProgram: {
    primary: {
      text: 'Start Your Adaptive Program',
      href: '/onboarding',
      context: 'SpartanLab adapts your program based on your progress and recovery.',
    },
    secondary: {
      text: 'Check Your Readiness First',
      href: '', // Filled dynamically
      context: 'Assess your current strength levels.',
    },
  },
}

// =============================================================================
// SEO AUDIT UTILITIES
// =============================================================================

export function detectCannibalization(pages: Array<{ path: string; title: string; keywords: string[] }>): Array<{
  page1: string
  page2: string
  overlappingKeywords: string[]
  severity: 'high' | 'medium' | 'low'
}> {
  const issues: Array<{
    page1: string
    page2: string
    overlappingKeywords: string[]
    severity: 'high' | 'medium' | 'low'
  }> = []
  
  for (let i = 0; i < pages.length; i++) {
    for (let j = i + 1; j < pages.length; j++) {
      const overlapping = pages[i].keywords.filter(k => pages[j].keywords.includes(k))
      if (overlapping.length >= 3) {
        issues.push({
          page1: pages[i].path,
          page2: pages[j].path,
          overlappingKeywords: overlapping,
          severity: overlapping.length >= 5 ? 'high' : overlapping.length >= 3 ? 'medium' : 'low',
        })
      }
    }
  }
  
  return issues
}

/**
 * Generates the recommended page structure for a skill
 */
export function generateSkillPageStructure(skill: SkillSlug): {
  pages: Array<{ path: string; intent: PageIntent; uniqueKeywords: string[] }>
  linkingStrategy: Array<{ from: string; to: string; anchorText: string }>
} {
  const hub = SKILL_HUBS[skill]
  const name = hub.displayName.toLowerCase()
  
  return {
    pages: [
      {
        path: hub.hubPath,
        intent: 'hub',
        uniqueKeywords: [`${name}`, `${name} guide`, `learn ${name}`, `master ${name}`],
      },
      {
        path: hub.pages.calculator,
        intent: 'calculator',
        uniqueKeywords: [`${name} calculator`, `${name} readiness`, `${name} requirements`, `am I ready for ${name}`],
      },
      {
        path: hub.pages.progression,
        intent: 'progression',
        uniqueKeywords: [`${name} progression`, `${name} progressions`, `${name} stages`],
      },
      {
        path: hub.pages.training,
        intent: 'training',
        uniqueKeywords: [`${name} training`, `how to train ${name}`, `${name} exercises`],
      },
      {
        path: hub.pages.program,
        intent: 'program',
        uniqueKeywords: [`${name} program`, `${name} workout plan`, `${name} training plan`],
      },
    ],
    linkingStrategy: [
      { from: hub.hubPath, to: hub.pages.calculator, anchorText: 'Check your readiness' },
      { from: hub.hubPath, to: hub.pages.progression, anchorText: 'View progressions' },
      { from: hub.hubPath, to: hub.pages.training, anchorText: 'Training guide' },
      { from: hub.hubPath, to: hub.pages.program, anchorText: 'Get a program' },
      { from: hub.pages.calculator, to: hub.pages.training, anchorText: 'Learn how to train' },
      { from: hub.pages.calculator, to: '/onboarding', anchorText: 'Generate personalized program' },
      { from: hub.pages.progression, to: hub.pages.calculator, anchorText: 'Check your level' },
      { from: hub.pages.training, to: hub.pages.calculator, anchorText: 'Assess your readiness' },
      { from: hub.pages.training, to: '/onboarding', anchorText: 'Get your program' },
      { from: hub.pages.program, to: '/onboarding', anchorText: 'Start adaptive training' },
    ],
  }
}
