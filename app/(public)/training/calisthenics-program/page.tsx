import type { Metadata } from 'next'
import { TrainingProgramPage, type TrainingProgramData } from '@/components/marketing/TrainingProgramPage'

export const metadata: Metadata = {
  title: 'Calisthenics Program - Complete Bodyweight Training',
  description: 'Structured calisthenics programming for skill development, strength, and body control. Build front lever, planche, muscle-up, and handstand with adaptive training.',
  keywords: [
    'calisthenics program',
    'calisthenics workout plan',
    'bodyweight training program',
    'calisthenics training',
    'calisthenics skills',
    'bodyweight strength training',
    'calisthenics routine',
    'complete calisthenics program',
  ],
  openGraph: {
    title: 'Calisthenics Program - SpartanLab',
    description: 'Complete calisthenics programming for skill development and bodyweight strength.',
    type: 'website',
  },
}

const programData: TrainingProgramData = {
  title: 'Calisthenics Program',
  subtitle: 'Structured training for skill mastery, strength development, and complete body control.',
  description: 'Build toward front lever, planche, muscle-up, handstand, and advanced calisthenics skills with intelligent programming.',
  
  whatItIs: {
    summary: 'A complete calisthenics program develops multiple skills simultaneously while building the strength foundation to support them. This requires careful balancing of pushing, pulling, and core work with joint preparation. Random skill practice leads to plateau. Structured programming leads to progress.',
    forWho: [
      'Want to develop multiple calisthenics skills',
      'Need structure instead of random YouTube workouts',
      'Are serious about long-term skill progression',
      'Want joint-safe training that builds durability',
    ],
  },
  
  mistakes: [
    {
      title: 'Training everything at once',
      description: 'Trying to progress front lever, planche, muscle-up, and handstand simultaneously without prioritization leads to zero progress on all.',
    },
    {
      title: 'Skipping strength fundamentals',
      description: 'Skills require strength prerequisites. Without adequate pulling and pushing strength, skill practice is ineffective.',
    },
    {
      title: 'Ignoring joint preparation',
      description: 'Wrists, elbows, and shoulders take stress from calisthenics skills. Without conditioning, injuries limit training.',
    },
    {
      title: 'No periodization',
      description: 'Training at maximum intensity every session leads to burnout. Structured phases build sustainable progress.',
    },
  ],
  
  howToTrain: {
    frequency: '3-5x per week depending on experience. Beginners need more recovery. Advanced athletes can handle higher frequency.',
    intensity: 'Vary between skill practice (sub-max), strength work (high intensity), and conditioning (moderate intensity).',
    progression: 'Focus on 1-2 primary skills. Build strength prerequisites. Add skills as foundations are established.',
    recovery: 'Include deload weeks. Monitor joint health. Balance pushing and pulling volume.',
  },
  
  spartanlabApproach: [
    {
      title: 'Skill Readiness Analysis',
      description: 'SpartanLab analyzes your strength levels to determine which skills you are ready to train and what prerequisites are missing.',
    },
    {
      title: 'Constraint Detection',
      description: 'Identifies specific limiting factors (pulling strength, compression, mobility) and prioritizes training to solve them.',
    },
    {
      title: 'Balanced Programming',
      description: 'Ensures pushing and pulling volume is balanced. Integrates skill work with strength development.',
    },
    {
      title: 'Joint Integrity Protocols',
      description: 'Every session includes appropriate joint preparation for wrists, elbows, shoulders, and scapulae.',
    },
  ],
  
  relatedPrograms: [
    {
      title: 'Front Lever Program',
      href: '/training/front-lever-program',
      description: 'Focus on pulling skills',
    },
    {
      title: 'Planche Program',
      href: '/training/planche-program',
      description: 'Focus on pushing skills',
    },
    {
      title: 'Hybrid Strength Program',
      href: '/training/hybrid-strength-program',
      description: 'Add weighted strength',
    },
  ],
  
  ctaText: 'Build Your Calisthenics Program',
}

export default function CalisthenicsProgramPage() {
  return <TrainingProgramPage data={programData} />
}
