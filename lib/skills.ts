// Skill progression definitions and ladder for each skill
// Legacy format for backward compatibility
// See skill-progression-rules.ts for enhanced definitions with readiness data

import { SKILL_PROGRESSIONS } from './skill-progression-rules'

export type SkillCategory = 
  | 'pull' 
  | 'push' 
  | 'transition'
  | 'compression'
  | 'flexibility'

export type CompressionSkill = 
  | 'l_sit'
  | 'v_sit'
  | 'i_sit'

export type CompressionLevel =
  | 'none'
  | 'tuck_l_sit'
  | 'l_sit'
  | 'advanced_l_sit'
  | 'v_sit_entry'
  | 'v_sit'
  | 'i_sit_entry'
  | 'i_sit'

export const SKILL_DEFINITIONS = {
  planche: {
    name: 'Planche',
    category: 'push' as SkillCategory,
    levels: SKILL_PROGRESSIONS.planche.levels.map(l => l.name),
    description: 'Master the horizontal hold progression',
  },
  front_lever: {
    name: 'Front Lever',
    category: 'pull' as SkillCategory,
    levels: SKILL_PROGRESSIONS.front_lever.levels.map(l => l.name),
    description: 'Complete horizontal front body hold',
  },
  back_lever: {
    name: 'Back Lever',
    category: 'pull' as SkillCategory,
    levels: ['German Hang', 'Tuck Back Lever', 'Advanced Tuck', 'One Leg', 'Straddle', 'Full Back Lever'],
    description: 'Horizontal pulling hold with arms behind body',
  },
  muscle_up: {
    name: 'Muscle Up',
    category: 'transition' as SkillCategory,
    levels: SKILL_PROGRESSIONS.muscle_up.levels.map(l => l.name),
    description: 'Explosive bar transition skill',
  },
  handstand_pushup: {
    name: 'Handstand Pushup',
    category: 'push' as SkillCategory,
    levels: SKILL_PROGRESSIONS.handstand_pushup.levels.map(l => l.name),
    description: 'Vertical pressing strength',
  },
  weighted_strength: {
    name: 'Weighted Strength',
    category: 'pull' as SkillCategory,
    levels: ['Beginner', 'Intermediate', 'Advanced', 'Elite'],
    description: 'Weighted calisthenics focus',
  },
  l_sit: {
    name: 'L-Sit',
    category: 'compression' as SkillCategory,
    levels: ['Tuck L-Sit', 'L-Sit Hold', 'Advanced L-Sit', 'V-Sit Entry'],
    description: 'Core compression strength and hip flexor endurance',
  },
  v_sit: {
    name: 'V-Sit',
    category: 'compression' as SkillCategory,
    levels: ['V-Sit Entry', 'V-Sit Hold', 'I-Sit Entry'],
    description: 'Advanced core compression with full leg extension',
  },
  i_sit: {
    name: 'I-Sit',
    category: 'compression' as SkillCategory,
    levels: ['I-Sit Entry', 'I-Sit Hold', 'I-Sit Mastery'],
    description: 'Elite compression strength - complete vertical body hold',
  },
  // Flexibility Skills
  pancake: {
    name: 'Pancake',
    category: 'flexibility' as SkillCategory,
    levels: ['Seated Straddle', 'Supported Pancake', 'Active Pancake', 'Deep Pancake', 'Compression Pancake'],
    description: 'Forward fold with legs wide - essential for compression and straddle skills',
  },
  toe_touch: {
    name: 'Toe Touch',
    category: 'flexibility' as SkillCategory,
    levels: ['Standing Reach', 'Palms to Shins', 'Palms to Floor', 'Chest to Thigh', 'Deep Fold'],
    description: 'Standing forward fold - foundation for pike compression and hamstring flexibility',
  },
  front_splits: {
    name: 'Front Splits',
    category: 'flexibility' as SkillCategory,
    levels: ['Lunge Mobility', 'Half Split', 'Elevated Split', 'Deep Split Prep', 'Full Front Split'],
    description: 'Full leg split front-to-back - key for hip flexor and hamstring mobility',
  },
  side_splits: {
    name: 'Side Splits',
    category: 'flexibility' as SkillCategory,
    levels: ['Horse Stance', 'Frog Mobility', 'Elevated Middle Split', 'Deep Split Prep', 'Full Side Split'],
    description: 'Full leg split side-to-side - essential for straddle skills and hip mobility',
  },
  dragon_flag: {
    name: 'Dragon Flag',
    category: 'compression' as SkillCategory,
    levels: ['Tuck Hold', 'Advanced Tuck', 'Negatives', 'Assisted Full', 'Full Dragon Flag'],
    description: 'Advanced anti-extension core and compression strength',
  },
  one_arm_pull_up: {
    name: 'One-Arm Pull-Up',
    category: 'pull' as SkillCategory,
    levels: ['Weighted Pull-Up', 'Archer Pull-Up', 'Assisted One-Arm', 'Negative One-Arm', 'Full One-Arm Pull-Up'],
    description: 'Ultimate unilateral pulling strength',
  },
  one_arm_push_up: {
    name: 'One-Arm Push-Up',
    category: 'push' as SkillCategory,
    levels: ['Elevated One-Arm', 'Archer Push-Up', 'Negative One-Arm', 'Full One-Arm Push-Up'],
    description: 'Unilateral pressing strength with core anti-rotation',
  },
  planche_push_up: {
    name: 'Planche Push-Up',
    category: 'push' as SkillCategory,
    levels: ['Pseudo Planche Push-Up', 'Tuck Planche Push-Up', 'Advanced Tuck Push-Up', 'Straddle Planche Push-Up', 'Full Planche Push-Up'],
    description: 'Pressing from planche position - combines planche hold with dynamic pressing',
  },
  iron_cross: {
    name: 'Iron Cross',
    category: 'transition' as SkillCategory,
    levels: ['Ring Support', 'RTO Support', 'Assisted Cross Hold', 'Partial Cross', 'Full Iron Cross'],
    description: 'Elite ring strength skill requiring extreme straight-arm pressing',
  },
};

export type SkillKey = keyof typeof SKILL_DEFINITIONS;

// Get level value (1-indexed) for progress calculation
export function getLevelValue(skillKey: SkillKey, levelIndex: number): number {
  return levelIndex + 1;
}

// Calculate progress score: (current / target) * 100
export function calculateProgressScore(
  currentLevelIndex: number,
  targetLevelIndex: number
): number {
  const currentValue = currentLevelIndex + 1;
  const targetValue = targetLevelIndex + 1;
  return (currentValue / targetValue) * 100;
}

// Estimate weeks to next level based on experience
export function estimateWeeksToNextLevel(experienceLevel: string): number {
  switch (experienceLevel) {
    case 'beginner':
      return 10; // 8-12 weeks average
    case 'intermediate':
      return 8; // 6-10 weeks average
    case 'advanced':
      return 6; // 4-8 weeks average
    default:
      return 10;
  }
}

// Get all skills
export function getAllSkills() {
  return Object.entries(SKILL_DEFINITIONS).map(([key, def]) => ({
    key: key as SkillKey,
    ...def,
  }));
}

// Get skill by key
export function getSkillByKey(key: SkillKey) {
  return SKILL_DEFINITIONS[key];
}
