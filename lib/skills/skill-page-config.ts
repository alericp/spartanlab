/**
 * Skill Page Configuration System
 * 
 * Config-driven approach for SEO skill landing pages.
 * Each skill entry contains all metadata and content sections needed for rendering.
 * 
 * To add a new skill:
 * 1. Add an entry to SKILL_CONFIGS with all required fields
 * 2. The dynamic route will automatically pick it up
 */

import { Target, Dumbbell, Zap, Trophy, Activity } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// =============================================================================
// TYPES
// =============================================================================

export interface ProgressionStage {
  name: string
  hold?: string
  reps?: string
  description: string
}

export interface KeyMuscle {
  name: string
  role: string
}

export interface CommonMistake {
  title: string
  description: string
}

export interface TrainingResource {
  title: string
  href: string
  description: string
}

export interface RelatedSkill {
  slug: string
  title: string
  description: string
}

export interface SkillConfig {
  // Core metadata
  slug: string
  title: string
  category: 'Pulling' | 'Pushing' | 'Transition' | 'Core' | 'Weighted'
  difficulty: string
  icon: LucideIcon
  
  // SEO
  seoTitle: string
  seoDescription: string
  keywords: string[]
  
  // Content
  intro: string
  tags: string[]
  
  // Prerequisites
  prereqs: string[]
  
  // Key demands/muscles
  keyMuscles: KeyMuscle[]
  
  // Progression roadmap
  progressionStages: ProgressionStage[]
  
  // Common mistakes
  commonMistakes: CommonMistake[]
  
  // Training resources (internal links)
  trainingResources: TrainingResource[]
  
  // Related skills for internal linking
  relatedSkills: RelatedSkill[]
  
  // CTA customization
  readinessCalculatorHref?: string
  progressionGuideHref?: string
  oneRmCalculatorHref?: string
}

// =============================================================================
// SKILL CONFIGURATIONS
// =============================================================================

export const SKILL_CONFIGS: Record<string, SkillConfig> = {
  'weighted-pull-up': {
    slug: 'weighted-pull-up',
    title: 'Weighted Pull-Up',
    category: 'Weighted',
    difficulty: 'Intermediate',
    icon: Dumbbell,
    
    seoTitle: 'Weighted Pull-Up Training Hub | Progression & Standards | SpartanLab',
    seoDescription: 'Master weighted pull-ups with structured progressions, strength standards, and 1RM calculator. Build elite pulling strength with personalized programming.',
    keywords: ['weighted pull-up', 'weighted pull-up progression', 'weighted pull-up standards', 'pull-up strength', 'weighted calisthenics'],
    
    intro: 'The weighted pull-up is the foundation of elite pulling strength. Adding external load to pull-ups builds the raw pulling power needed for advanced skills like front lever and one-arm pull-up while developing significant upper body muscle mass.',
    tags: ['Weighted Strength', 'Pulling Focus', 'Lat Development'],
    
    prereqs: ['10+ strict pull-ups', 'Good scapular control', 'No shoulder impingement'],
    
    keyMuscles: [
      { name: 'Latissimus Dorsi', role: 'Primary puller' },
      { name: 'Biceps Brachii', role: 'Elbow flexion' },
      { name: 'Rear Deltoids', role: 'Shoulder extension support' },
      { name: 'Grip / Forearms', role: 'Weight support' },
    ],
    
    progressionStages: [
      { name: 'Bodyweight Mastery', reps: '12-15 reps', description: 'Build base before adding weight' },
      { name: 'Light Load', reps: '+10-25 lbs x 5-8', description: 'Begin progressive overload' },
      { name: 'Moderate Load', reps: '+25-50 lbs x 5', description: 'Build strength foundation' },
      { name: 'Heavy Load', reps: '+50-75 lbs x 3-5', description: 'Approach advanced territory' },
      { name: 'Elite Load', reps: '+75-100+ lbs', description: 'Elite weighted pulling strength' },
    ],
    
    commonMistakes: [
      { title: 'Kipping or Swinging', description: 'Using momentum instead of strict pulling strength.' },
      { title: 'Incomplete ROM', description: 'Not reaching full hang at bottom or chin over bar at top.' },
      { title: 'Adding Weight Too Fast', description: 'Progressive overload should be gradual to avoid injury.' },
      { title: 'Neglecting Grip Training', description: 'Grip often limits weighted pull-up potential.' },
    ],
    
    trainingResources: [
      { title: 'Weighted Pull-Up Guide', href: '/guides/weighted-pull-up-training', description: 'Complete training methodology' },
      { title: 'Pull-Up Strength Standards', href: '/pull-up-strength-standards', description: 'See where you rank' },
      { title: 'Weighted Pull-Up Program', href: '/training/weighted-pull-up-program', description: 'Structured program' },
    ],
    
    relatedSkills: [
      { slug: 'one-arm-pull-up', title: 'One-Arm Pull-Up', description: 'Ultimate pulling strength' },
      { slug: 'front-lever', title: 'Front Lever', description: 'Horizontal pulling skill' },
      { slug: 'muscle-up', title: 'Muscle-Up', description: 'Transition skill' },
    ],
    
    readinessCalculatorHref: '/calculators/pull-up-strength-score',
    oneRmCalculatorHref: '/calculators/1rm/weighted-pull-up',
  },
  
  'weighted-dip': {
    slug: 'weighted-dip',
    title: 'Weighted Dip',
    category: 'Weighted',
    difficulty: 'Intermediate',
    icon: Dumbbell,
    
    seoTitle: 'Weighted Dip Training Hub | Progression & Standards | SpartanLab',
    seoDescription: 'Master weighted dips with structured progressions, strength standards, and personalized training. Build elite pushing strength for advanced skills.',
    keywords: ['weighted dip', 'weighted dip progression', 'weighted dip standards', 'dip strength', 'tricep strength'],
    
    intro: 'The weighted dip is the king of upper body pushing exercises. Adding external load builds the tricep and chest strength necessary for advanced skills like planche push-ups and handstand push-ups while developing significant upper body mass.',
    tags: ['Weighted Strength', 'Pushing Focus', 'Tricep Development'],
    
    prereqs: ['15+ strict dips', 'Healthy shoulders', 'No anterior shoulder pain'],
    
    keyMuscles: [
      { name: 'Triceps Brachii', role: 'Primary elbow extension' },
      { name: 'Pectoralis Major', role: 'Chest pressing support' },
      { name: 'Anterior Deltoids', role: 'Shoulder flexion' },
      { name: 'Core Stabilizers', role: 'Body control' },
    ],
    
    progressionStages: [
      { name: 'Bodyweight Mastery', reps: '15-20 reps', description: 'Build base before adding weight' },
      { name: 'Light Load', reps: '+10-25 lbs x 8-10', description: 'Begin progressive overload' },
      { name: 'Moderate Load', reps: '+25-50 lbs x 5-8', description: 'Build strength foundation' },
      { name: 'Heavy Load', reps: '+50-90 lbs x 3-5', description: 'Approach advanced territory' },
      { name: 'Elite Load', reps: '+90-135+ lbs', description: 'Elite weighted pushing strength' },
    ],
    
    commonMistakes: [
      { title: 'Excessive Forward Lean', description: 'Shifts load too much to chest, stressing shoulders.' },
      { title: 'Shallow Depth', description: 'Not going to 90 degrees or below reduces effectiveness.' },
      { title: 'Flared Elbows', description: 'Elbows should track with body, not flare out excessively.' },
      { title: 'Shrugged Shoulders', description: 'Keep shoulders depressed throughout the movement.' },
    ],
    
    trainingResources: [
      { title: 'Weighted Dip Guide', href: '/guides/weighted-dip-training', description: 'Complete training methodology' },
      { title: 'Calisthenics Strength Standards', href: '/calisthenics-strength-standards', description: 'See where you rank' },
      { title: 'Weighted Dip Program', href: '/weighted-calisthenics-program', description: 'Structured program' },
    ],
    
    relatedSkills: [
      { slug: 'handstand-push-up', title: 'Handstand Push-Up', description: 'Vertical pressing power' },
      { slug: 'planche', title: 'Planche', description: 'Ultimate pushing skill' },
      { slug: 'muscle-up', title: 'Muscle-Up', description: 'Push-pull transition' },
    ],
    
    oneRmCalculatorHref: '/calculators/1rm/weighted-dip',
  },
  
  'one-arm-pull-up': {
    slug: 'one-arm-pull-up',
    title: 'One-Arm Pull-Up',
    category: 'Pulling',
    difficulty: 'Elite',
    icon: Trophy,
    
    seoTitle: 'One-Arm Pull-Up Training Hub | Progression Guide | SpartanLab',
    seoDescription: 'Master the one-arm pull-up with structured progressions and training methodology. Build elite unilateral pulling strength.',
    keywords: ['one arm pull-up', 'one arm pull-up progression', 'OAP training', 'unilateral pull-up', 'advanced calisthenics'],
    
    intro: 'The one-arm pull-up is the ultimate display of pulling strength in calisthenics. This elite skill requires years of dedicated training, exceptional relative strength, and bulletproof tendons. Only a small percentage of trained athletes ever achieve a clean one-arm pull-up.',
    tags: ['Elite Skill', 'Unilateral', 'Relative Strength'],
    
    prereqs: ['20+ strict pull-ups', '+50% BW weighted pull-up', 'Strong grip', 'Healthy elbows'],
    
    keyMuscles: [
      { name: 'Latissimus Dorsi', role: 'Primary unilateral puller' },
      { name: 'Biceps Brachii', role: 'Elbow flexion under extreme load' },
      { name: 'Brachialis', role: 'Deep elbow flexor support' },
      { name: 'Grip / Forearms', role: 'Single-hand support' },
    ],
    
    progressionStages: [
      { name: 'Weighted Pull-Up Base', reps: '+50-75% BW x 5', description: 'Build raw pulling strength' },
      { name: 'Archer Pull-Ups', reps: '5-8 each arm', description: 'Begin unilateral emphasis' },
      { name: 'Assisted One-Arm', reps: 'Band or finger assist', description: 'Train the movement pattern' },
      { name: 'One-Arm Negatives', hold: '5-8 second descent', description: 'Eccentric strength building' },
      { name: 'Full One-Arm Pull-Up', reps: '1 clean rep', description: 'Achievement unlocked' },
    ],
    
    commonMistakes: [
      { title: 'Rushing Progressions', description: 'This skill requires years - patience prevents injury.' },
      { title: 'Ignoring Weighted Base', description: 'Need significant weighted pull-up strength first.' },
      { title: 'Neglecting Elbow Health', description: 'Tendon prep is critical - dont skip prehab.' },
      { title: 'Using Body English', description: 'Kipping or twisting defeats the purpose.' },
    ],
    
    trainingResources: [
      { title: 'One-Arm Pull-Up Guide', href: '/guides/one-arm-pull-up-training', description: 'Complete training methodology' },
      { title: 'Weighted Pull-Up Standards', href: '/weighted-pull-up-strength-standards', description: 'Check your base strength' },
      { title: 'Pull-Up Strength Score', href: '/calculators/pull-up-strength-score', description: 'Assess your current level' },
    ],
    
    relatedSkills: [
      { slug: 'weighted-pull-up', title: 'Weighted Pull-Up', description: 'Build the strength base' },
      { slug: 'front-lever', title: 'Front Lever', description: 'Horizontal pulling power' },
      { slug: 'muscle-up', title: 'Muscle-Up', description: 'Explosive pulling strength' },
    ],
  },
  
  'back-lever': {
    slug: 'back-lever',
    title: 'Back Lever',
    category: 'Pulling',
    difficulty: 'Intermediate-Advanced',
    icon: Target,
    
    seoTitle: 'Back Lever Training Hub | Progression Guide | SpartanLab',
    seoDescription: 'Master the back lever with structured progressions and training methodology. Build straight-arm pulling strength and shoulder flexibility.',
    keywords: ['back lever', 'back lever progression', 'back lever training', 'straight arm strength', 'calisthenics skills'],
    
    intro: 'The back lever is a foundational straight-arm skill that builds the pulling strength and shoulder conditioning needed for more advanced moves. It requires significant shoulder extension mobility and teaches body tension in an inverted position.',
    tags: ['Straight-Arm', 'Pulling Focus', 'Shoulder Mobility'],
    
    prereqs: ['8+ strict pull-ups', 'German hang comfort', 'Shoulder extension mobility', 'Good body tension'],
    
    keyMuscles: [
      { name: 'Latissimus Dorsi', role: 'Primary pulling and extension' },
      { name: 'Posterior Deltoids', role: 'Shoulder extension support' },
      { name: 'Biceps (long head)', role: 'Shoulder flexion control' },
      { name: 'Core / Glutes', role: 'Body line maintenance' },
    ],
    
    progressionStages: [
      { name: 'German Hang', hold: '30-60s', description: 'Build shoulder extension and comfort' },
      { name: 'Skin the Cat', reps: '5-8 controlled', description: 'Dynamic shoulder mobility' },
      { name: 'Tuck Back Lever', hold: '15-30s', description: 'First static hold progression' },
      { name: 'Advanced Tuck', hold: '10-20s', description: 'Hips slightly extended' },
      { name: 'Straddle Back Lever', hold: '5-10s', description: 'Legs spread for leverage' },
      { name: 'Full Back Lever', hold: '3-5s', description: 'Legs together, body straight' },
    ],
    
    commonMistakes: [
      { title: 'Rushing German Hang', description: 'Need solid shoulder extension before progressing.' },
      { title: 'Piked Hips', description: 'Body line should be straight from shoulders to feet.' },
      { title: 'Bent Arms', description: 'Arms must remain locked throughout the hold.' },
      { title: 'Ignoring Bicep Health', description: 'Long head of bicep is stressed - condition gradually.' },
    ],
    
    trainingResources: [
      { title: 'Back Lever Guide', href: '/guides/back-lever-training', description: 'Complete training methodology' },
      { title: 'German Hang Progression', href: '/exercises/arch-hang', description: 'Build shoulder flexibility' },
      { title: 'Straight-Arm Standards', href: '/calisthenics-strength-standards', description: 'Strength benchmarks' },
    ],
    
    relatedSkills: [
      { slug: 'front-lever', title: 'Front Lever', description: 'Horizontal pulling counterpart' },
      { slug: 'planche', title: 'Planche', description: 'Pushing straight-arm hold' },
      { slug: 'muscle-up', title: 'Muscle-Up', description: 'Transition skill' },
    ],
  },
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function getSkillConfig(slug: string): SkillConfig | undefined {
  return SKILL_CONFIGS[slug]
}

export function getAllSkillSlugs(): string[] {
  return Object.keys(SKILL_CONFIGS)
}

export function getSkillsByCategory(category: SkillConfig['category']): SkillConfig[] {
  return Object.values(SKILL_CONFIGS).filter(skill => skill.category === category)
}

// Skills that should appear in the main hub (can be customized)
export function getFeaturedSkills(): SkillConfig[] {
  return [
    SKILL_CONFIGS['weighted-pull-up'],
    SKILL_CONFIGS['weighted-dip'],
    SKILL_CONFIGS['one-arm-pull-up'],
    SKILL_CONFIGS['back-lever'],
  ].filter(Boolean)
}
