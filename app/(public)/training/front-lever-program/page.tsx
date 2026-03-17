import type { Metadata } from 'next'
import { TrainingProgramPage, type TrainingProgramData } from '@/components/marketing/TrainingProgramPage'

export const metadata: Metadata = {
  title: 'Front Lever Program - Structured Training for Front Lever',
  description: 'Build your front lever with structured programming that analyzes your pulling strength, core compression, and shoulder stability. Adaptive training built from real calisthenics methodology.',
  keywords: [
    'front lever program',
    'front lever training',
    'front lever progression',
    'calisthenics front lever',
    'front lever workout',
    'how to front lever',
    'front lever training plan',
    'front lever prerequisites',
  ],
  openGraph: {
    title: 'Front Lever Program - SpartanLab',
    description: 'Structured front lever training that adapts to your pulling strength and core compression.',
    type: 'website',
  },
}

const programData: TrainingProgramData = {
  title: 'Front Lever Program',
  subtitle: 'Structured training for one of the most demanding pulling skills in calisthenics.',
  description: 'Build the pulling strength, core compression, and shoulder stability required for a solid front lever.',
  
  whatItIs: {
    summary: 'The front lever is a horizontal pulling hold that requires exceptional lat strength, core compression, and scapular control. Most athletes underestimate the pulling strength needed and overtrain the skill itself. This program builds the foundational strength systematically.',
    forWho: [
      'Want to achieve their first front lever hold',
      'Have been stuck at tuck or advanced tuck for months',
      'Need to build pulling strength for front lever prerequisites',
      'Want structured progression instead of random attempts',
    ],
  },
  
  mistakes: [
    {
      title: 'Training the skill too frequently',
      description: 'Front lever is neurologically demanding. Daily practice without adequate pulling strength leads to stagnation and shoulder issues.',
    },
    {
      title: 'Neglecting horizontal pulling strength',
      description: 'Vertical pulling (pull-ups) alone is not enough. Front lever requires strong horizontal pulling and straight-arm pulling strength.',
    },
    {
      title: 'Skipping core compression work',
      description: 'The ability to maintain a hollow body under load is essential. Weak compression makes the lever position impossible to hold.',
    },
    {
      title: 'Ignoring scapular depression strength',
      description: 'Active scapular depression is what keeps you horizontal. Without it, your hips will always drop.',
    },
  ],
  
  howToTrain: {
    frequency: '2-3x per week for skill practice. Pulling strength work can be higher frequency with proper recovery management.',
    intensity: 'Skill holds at 60-80% max effort. Strength work follows progressive overload with controlled intensity.',
    progression: 'Master each lever progression before advancing. Build pulling strength ratios (weighted pull-up targets) alongside skill work.',
    recovery: 'Shoulders and lats need 48-72h between heavy sessions. Monitor grip and forearm fatigue.',
  },
  
  spartanlabApproach: [
    {
      title: 'Pulling Strength Analysis',
      description: 'SpartanLab analyzes your pulling strength ratios to determine front lever readiness. Weighted pull-up strength is a key predictor.',
    },
    {
      title: 'Core Compression Assessment',
      description: 'Evaluates your hollow body strength and compression ability to ensure you have the foundation for lever positions.',
    },
    {
      title: 'Progressive Skill Integration',
      description: 'Programs the right lever progression based on your current strength. Advances you when prerequisites are met.',
    },
    {
      title: 'Fatigue-Aware Programming',
      description: 'Balances skill practice with strength work. Monitors pulling volume to prevent overuse and stagnation.',
    },
  ],
  
  relatedPrograms: [
    {
      title: 'Planche Program',
      href: '/training/planche-program',
      description: 'Build pushing strength for planche',
    },
    {
      title: 'Weighted Pull-Up Program',
      href: '/training/weighted-pull-up-program',
      description: 'Build pulling strength foundation',
    },
    {
      title: 'Calisthenics Program',
      href: '/training/calisthenics-program',
      description: 'Complete skill development',
    },
  ],
  
  ctaText: 'Start Your Front Lever Program',
}

export default function FrontLeverProgramPage() {
  return <TrainingProgramPage data={programData} />
}
