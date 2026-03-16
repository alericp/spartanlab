/**
 * SEO Skill Clusters Map
 * 
 * Defines relationships between skills, guides, and tools for internal linking.
 * This enables strong topic clusters for SEO and improved user engagement.
 */

export interface RelatedLink {
  title: string
  href: string
  description?: string
}

export interface SkillCluster {
  relatedSkills: RelatedLink[]
  relatedGuides: RelatedLink[]
  relatedTools: RelatedLink[]
}

export const SKILL_CLUSTERS: Record<string, SkillCluster> = {
  'front-lever': {
    relatedSkills: [
      { title: 'Planche Hub', href: '/skills/planche', description: 'Master the pushing counterpart' },
      { title: 'Muscle-Up Hub', href: '/skills/muscle-up', description: 'Build explosive pulling power' },
      { title: 'HSPU Hub', href: '/skills/handstand-push-up', description: 'Vertical pressing power' },
      { title: 'Back Lever Guide', href: '/guides/back-lever-training', description: 'Train the reverse hold' },
    ],
    relatedGuides: [
      { title: 'Front Lever Training Guide', href: '/front-lever-training-guide', description: 'Complete training methodology' },
      { title: 'Front Lever Program', href: '/programs/front-lever-program', description: '12-24 week structured plan' },
      { title: 'Strength Standards', href: '/calisthenics-strength-standards', description: 'Check your readiness benchmarks' },
      { title: 'Weighted Pull-Up Training', href: '/guides/weighted-pull-up-training', description: 'Build pulling foundation' },
    ],
    relatedTools: [
      { title: 'Front Lever Readiness Calculator', href: '/front-lever-readiness-calculator', description: 'Test your readiness score' },
      { title: 'Generate Your Program', href: '/onboarding', description: 'Personalized training plan' },
      { title: 'Body Fat Calculator', href: '/body-fat-calculator', description: 'Optimize your body composition' },
    ],
  },
  
  'planche': {
    relatedSkills: [
      { title: 'Front Lever Hub', href: '/skills/front-lever', description: 'Master the pulling counterpart' },
      { title: 'HSPU Hub', href: '/skills/handstand-push-up', description: 'Vertical pushing power' },
      { title: 'Muscle-Up Hub', href: '/skills/muscle-up', description: 'Combine push and pull' },
      { title: 'Handstand Training', href: '/guides/handstand-training', description: 'Build overhead pushing strength' },
    ],
    relatedGuides: [
      { title: 'Planche Training Guide', href: '/planche-training-guide', description: 'Complete training methodology' },
      { title: 'Planche Program', href: '/programs/planche-program', description: '12-24 week structured plan' },
      { title: 'Strength Standards', href: '/calisthenics-strength-standards', description: 'Check your readiness benchmarks' },
      { title: 'Weighted Dip Training', href: '/guides/weighted-dip-training', description: 'Build pushing foundation' },
    ],
    relatedTools: [
      { title: 'Planche Readiness Calculator', href: '/planche-readiness-calculator', description: 'Test your readiness score' },
      { title: 'Generate Your Program', href: '/onboarding', description: 'Personalized training plan' },
      { title: 'Body Fat Calculator', href: '/body-fat-calculator', description: 'Lower body fat aids planche' },
    ],
  },
  
  'muscle-up': {
    relatedSkills: [
      { title: 'Front Lever Hub', href: '/skills/front-lever', description: 'Build pulling strength' },
      { title: 'Planche Hub', href: '/skills/planche', description: 'Build pushing strength' },
      { title: 'HSPU Hub', href: '/skills/handstand-push-up', description: 'Vertical pressing' },
      { title: 'One-Arm Pull-Up', href: '/guides/one-arm-pull-up-training', description: 'Peak pulling power' },
    ],
    relatedGuides: [
      { title: 'Muscle-Up Training Guide', href: '/guides/muscle-up-training', description: 'Complete training methodology' },
      { title: 'Muscle-Up Program', href: '/programs/muscle-up-program', description: '12-24 week structured plan' },
      { title: 'Strength Standards', href: '/calisthenics-strength-standards', description: 'Check your readiness benchmarks' },
      { title: 'Pull-Up Strength Guide', href: '/guides/pull-up-strength', description: 'Foundation for muscle-ups' },
    ],
    relatedTools: [
      { title: 'Muscle-Up Readiness Calculator', href: '/muscle-up-readiness-calculator', description: 'Test your readiness score' },
      { title: 'Generate Your Program', href: '/onboarding', description: 'Personalized training plan' },
      { title: 'Body Fat Calculator', href: '/body-fat-calculator', description: 'Optimize power-to-weight ratio' },
    ],
  },
  
  'handstand': {
    relatedSkills: [
      { title: 'HSPU Progression', href: '/guides/hspu-progression', description: 'Add strength to your handstand' },
      { title: 'Planche Progression', href: '/planche-progression', description: 'Horizontal pushing mastery' },
      { title: 'Press to Handstand', href: '/guides/press-to-handstand', description: 'The ultimate entry' },
    ],
    relatedGuides: [
      { title: 'Handstand Balance Drills', href: '/guides/handstand-balance', description: 'Master freestanding holds' },
      { title: 'Wrist Preparation', href: '/guides/wrist-preparation', description: 'Essential injury prevention' },
      { title: 'Shoulder Mobility', href: '/guides/shoulder-mobility', description: 'Achieve optimal positioning' },
      { title: 'Core Compression Training', href: '/guides/core-compression-training', description: 'Control in inverted positions' },
    ],
    relatedTools: [
      { title: 'Program Builder', href: '/calisthenics-program-builder', description: 'Build your training plan' },
    ],
  },
  
  'back-lever': {
    relatedSkills: [
      { title: 'Front Lever Progression', href: '/front-lever-progression', description: 'The pulling counterpart' },
      { title: 'German Hang Guide', href: '/guides/german-hang', description: 'Build shoulder extension' },
      { title: 'Planche Progression', href: '/planche-progression', description: 'Another static hold challenge' },
    ],
    relatedGuides: [
      { title: 'Shoulder Mobility', href: '/guides/shoulder-mobility', description: 'Essential flexibility' },
      { title: 'Straight-Arm Strength', href: '/guides/straight-arm-strength', description: 'Hold positions under tension' },
      { title: 'Ring Training Guide', href: '/guides/ring-training', description: 'Progress on rings' },
    ],
    relatedTools: [
      { title: 'Program Builder', href: '/calisthenics-program-builder', description: 'Build your training plan' },
    ],
  },
  
  'one-arm-pull-up': {
    relatedSkills: [
      { title: 'Front Lever Progression', href: '/front-lever-progression', description: 'Another elite pulling skill' },
      { title: 'Muscle-Up Training', href: '/guides/muscle-up-training', description: 'Explosive pulling power' },
      { title: 'Weighted Pull-Ups', href: '/guides/weighted-pull-up-progression', description: 'Build the strength foundation' },
    ],
    relatedGuides: [
      { title: 'Pull-Up Strength Guide', href: '/guides/pull-up-strength', description: 'Master the basics first' },
      { title: 'Grip Strength Training', href: '/guides/grip-strength', description: 'Critical for one-arm work' },
      { title: 'Archer Pull-Up Guide', href: '/guides/archer-pull-ups', description: 'Key progression exercise' },
    ],
    relatedTools: [
      { title: 'Program Builder', href: '/calisthenics-program-builder', description: 'Build your training plan' },
    ],
  },
}

// Guide clusters for guide pages (merged with reference page clusters)
export const GUIDE_CLUSTERS: Record<string, SkillCluster> = {
  'pull-up-strength': {
    relatedSkills: [
      { title: 'Front Lever Progression', href: '/front-lever-progression' },
      { title: 'Muscle-Up Training', href: '/guides/muscle-up-training' },
      { title: 'One-Arm Pull-Up', href: '/guides/one-arm-pull-up' },
    ],
    relatedGuides: [
      { title: 'Weighted Pull-Up Progression', href: '/guides/weighted-pull-up-progression' },
      { title: 'Chest-to-Bar Pull-Ups', href: '/guides/chest-to-bar-pull-ups' },
      { title: 'Grip Strength Training', href: '/guides/grip-strength' },
    ],
    relatedTools: [
      { title: 'Program Builder', href: '/calisthenics-program-builder' },
    ],
  },
  
  'core-compression-training': {
    relatedSkills: [
      { title: 'Front Lever Progression', href: '/front-lever-progression' },
      { title: 'Planche Progression', href: '/planche-progression' },
      { title: 'L-Sit Progression', href: '/guides/l-sit-progression' },
      { title: 'V-Sit Progression', href: '/guides/v-sit-progression' },
    ],
    relatedGuides: [
      { title: 'Six Pack Training', href: '/guides/six-pack-abs' },
      { title: 'Hollow Body Training', href: '/guides/hollow-body-training' },
      { title: 'Pike Compression', href: '/guides/pike-compression' },
    ],
    relatedTools: [
      { title: 'Program Builder', href: '/calisthenics-program-builder' },
      { title: 'Body Fat Calculator', href: '/body-fat-calculator' },
    ],
  },
  
  'weighted-pull-up-progression': {
    relatedSkills: [
      { title: 'Front Lever Progression', href: '/front-lever-progression' },
      { title: 'One-Arm Pull-Up', href: '/guides/one-arm-pull-up' },
      { title: 'Muscle-Up Training', href: '/guides/muscle-up-training' },
    ],
    relatedGuides: [
      { title: 'Pull-Up Strength Guide', href: '/guides/pull-up-strength' },
      { title: 'Grip Strength Training', href: '/guides/grip-strength' },
      { title: 'Back Training Guide', href: '/guides/back-training' },
    ],
    relatedTools: [
      { title: 'Program Builder', href: '/calisthenics-program-builder' },
    ],
  },
  
  'pancake-mobility': {
    relatedSkills: [
      { title: 'Front Lever Progression', href: '/front-lever-progression' },
      { title: 'L-Sit Progression', href: '/guides/l-sit-progression' },
      { title: 'V-Sit Progression', href: '/guides/v-sit-progression' },
    ],
    relatedGuides: [
      { title: 'Hip Mobility Guide', href: '/guides/hip-mobility' },
      { title: 'Pike Compression', href: '/guides/pike-compression' },
      { title: 'Straddle Flexibility', href: '/guides/straddle-flexibility' },
    ],
    relatedTools: [
      { title: 'Program Builder', href: '/calisthenics-program-builder' },
    ],
  },
  
  'six-pack-abs': {
    relatedSkills: [
      { title: 'L-Sit Progression', href: '/guides/l-sit-progression' },
      { title: 'Front Lever Progression', href: '/front-lever-progression' },
      { title: 'Dragon Flag', href: '/guides/dragon-flag' },
    ],
    relatedGuides: [
      { title: 'Core Compression Training', href: '/guides/core-compression-training' },
      { title: 'Hollow Body Training', href: '/guides/hollow-body-training' },
      { title: 'Ab Wheel Progression', href: '/guides/ab-wheel-progression' },
    ],
    relatedTools: [
      { title: 'Body Fat Calculator', href: '/body-fat-calculator' },
      { title: 'Program Builder', href: '/calisthenics-program-builder' },
    ],
  },
  
  // Strength standards reference page cluster
  'calisthenics-strength-standards': {
    relatedSkills: [
      { title: 'Front Lever Hub', href: '/skills/front-lever', description: 'Test your pulling strength' },
      { title: 'Planche Hub', href: '/skills/planche', description: 'Test your pushing strength' },
      { title: 'Muscle-Up Hub', href: '/skills/muscle-up', description: 'Combine strength and skill' },
      { title: 'HSPU Hub', href: '/skills/handstand-push-up', description: 'Balance and control skills' },
    ],
    relatedGuides: [
      { title: 'Weighted Pull-Up Progression', href: '/guides/weighted-pull-up-progression', description: 'Build pulling strength' },
      { title: 'Weighted Dip Progression', href: '/guides/weighted-dip-progression', description: 'Build pushing strength' },
      { title: 'Core Compression Training', href: '/guides/core-compression-training', description: 'Essential core strength' },
    ],
    relatedTools: [
      { title: 'Program Builder', href: '/calisthenics-program-builder', description: 'Build your training plan' },
      { title: 'Body Fat Calculator', href: '/body-fat-calculator', description: 'Optimize body composition' },
    ],
  },
}

// Skill Hub clusters for hub pages
export const SKILL_HUB_CLUSTERS: Record<string, SkillCluster> = {
  'front-lever-hub': {
    relatedSkills: [
      { title: 'Planche Hub', href: '/skills/planche', description: 'The pushing counterpart' },
      { title: 'Muscle-Up Hub', href: '/skills/muscle-up', description: 'Explosive pulling power' },
      { title: 'HSPU Hub', href: '/skills/handstand-push-up', description: 'Vertical pressing' },
    ],
    relatedGuides: [
      { title: 'Front Lever Progression', href: '/front-lever-progression', description: 'Full progression guide' },
      { title: 'Strength Standards', href: '/calisthenics-strength-standards', description: 'Check your benchmarks' },
    ],
    relatedTools: [
      { title: 'Readiness Calculator', href: '/front-lever-readiness-calculator', description: 'Test your readiness' },
      { title: 'Program Builder', href: '/calisthenics-program-builder', description: 'Build your plan' },
    ],
  },
  'planche-hub': {
    relatedSkills: [
      { title: 'Front Lever Hub', href: '/skills/front-lever', description: 'The pulling counterpart' },
      { title: 'HSPU Hub', href: '/skills/handstand-push-up', description: 'Vertical pressing' },
      { title: 'Muscle-Up Hub', href: '/skills/muscle-up', description: 'Combined strength' },
    ],
    relatedGuides: [
      { title: 'Planche Progression', href: '/planche-progression', description: 'Full progression guide' },
      { title: 'Strength Standards', href: '/calisthenics-strength-standards', description: 'Check your benchmarks' },
    ],
    relatedTools: [
      { title: 'Readiness Calculator', href: '/planche-readiness-calculator', description: 'Test your readiness' },
      { title: 'Program Builder', href: '/calisthenics-program-builder', description: 'Build your plan' },
    ],
  },
  'muscle-up-hub': {
    relatedSkills: [
      { title: 'Front Lever Hub', href: '/skills/front-lever', description: 'Build pulling strength' },
      { title: 'Planche Hub', href: '/skills/planche', description: 'Build pushing strength' },
      { title: 'HSPU Hub', href: '/skills/handstand-push-up', description: 'Vertical pressing' },
    ],
    relatedGuides: [
      { title: 'Muscle-Up Training', href: '/guides/muscle-up-training', description: 'Full training guide' },
      { title: 'Strength Standards', href: '/calisthenics-strength-standards', description: 'Check your benchmarks' },
    ],
    relatedTools: [
      { title: 'Readiness Calculator', href: '/muscle-up-readiness-calculator', description: 'Test your readiness' },
      { title: 'Program Builder', href: '/calisthenics-program-builder', description: 'Build your plan' },
    ],
  },
  'hspu-hub': {
    relatedSkills: [
      { title: 'Planche Hub', href: '/skills/planche', description: 'Horizontal pushing' },
      { title: 'Muscle-Up Hub', href: '/skills/muscle-up', description: 'Combined strength' },
      { title: 'Front Lever Hub', href: '/skills/front-lever', description: 'Pulling counterpart' },
    ],
    relatedGuides: [
      { title: 'Handstand Training', href: '/guides/handstand-training', description: 'Build balance first' },
      { title: 'Strength Standards', href: '/calisthenics-strength-standards', description: 'Check your benchmarks' },
    ],
    relatedTools: [
      { title: 'Program Builder', href: '/calisthenics-program-builder', description: 'Build your plan' },
    ],
  },
}

// Tool clusters for tool pages
export const TOOL_CLUSTERS: Record<string, SkillCluster> = {
  'body-fat-calculator': {
    relatedSkills: [
      { title: 'Front Lever Progression', href: '/front-lever-progression', description: 'Lower body fat aids lever skills' },
      { title: 'Planche Progression', href: '/planche-progression', description: 'Body composition matters' },
      { title: 'Muscle-Up Training', href: '/guides/muscle-up-training', description: 'Optimize power-to-weight' },
    ],
    relatedGuides: [
      { title: 'Calisthenics Nutrition', href: '/guides/calisthenics-nutrition', description: 'Fuel your training' },
      { title: 'Body Recomposition', href: '/guides/body-recomposition', description: 'Build muscle, lose fat' },
      { title: 'Training for Fat Loss', href: '/guides/fat-loss-training', description: 'Effective programming' },
    ],
    relatedTools: [
      { title: 'Program Builder', href: '/calisthenics-program-builder', description: 'Build your training plan' },
    ],
  },
  
  'calisthenics-program-builder': {
    relatedSkills: [
      { title: 'Front Lever Progression', href: '/front-lever-progression', description: 'Add this skill to your program' },
      { title: 'Planche Progression', href: '/planche-progression', description: 'Train pushing skills' },
      { title: 'Muscle-Up Training', href: '/guides/muscle-up-training', description: 'Include explosive work' },
      { title: 'Handstand Training', href: '/guides/handstand-training', description: 'Balance and control' },
    ],
    relatedGuides: [
      { title: 'Beginner Calisthenics', href: '/guides/beginner-calisthenics', description: 'Start your journey' },
      { title: 'Training Volume Guide', href: '/guides/training-volume', description: 'Optimize your workload' },
      { title: 'Recovery and Deloads', href: '/guides/recovery-deloads', description: 'Manage fatigue' },
      { title: 'Skill Training Frequency', href: '/guides/skill-training-frequency', description: 'How often to train skills' },
    ],
    relatedTools: [
      { title: 'Body Fat Calculator', href: '/body-fat-calculator', description: 'Track your composition' },
    ],
  },
}

/**
 * Get related content for a skill page
 */
export function getSkillCluster(skillSlug: string): SkillCluster | null {
  return SKILL_CLUSTERS[skillSlug] || null
}

/**
 * Get related content for a guide page
 */
export function getGuideCluster(guideSlug: string): SkillCluster | null {
  return GUIDE_CLUSTERS[guideSlug] || null
}

/**
 * Get related content for a tool page
 */
export function getToolCluster(toolSlug: string): SkillCluster | null {
  return TOOL_CLUSTERS[toolSlug] || null
}
