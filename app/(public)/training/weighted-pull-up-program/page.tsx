import type { Metadata } from 'next'
import { TrainingProgramPage, type TrainingProgramData } from '@/components/marketing/TrainingProgramPage'

export const metadata: Metadata = {
  title: 'Weighted Pull-Up Program - Build Pulling Strength',
  description: 'Structured weighted pull-up programming for calisthenics athletes. Build the pulling strength foundation for front lever, muscle-up, and advanced skills. Streetlifting methodology.',
  keywords: [
    'weighted pull-up program',
    'weighted pull-ups',
    'weighted calisthenics',
    'streetlifting program',
    'pull-up strength',
    'calisthenics strength training',
    'weighted pull-up progression',
    'increase pull-up strength',
  ],
  openGraph: {
    title: 'Weighted Pull-Up Program - SpartanLab',
    description: 'Build pulling strength with structured weighted calisthenics programming.',
    type: 'website',
  },
}

const programData: TrainingProgramData = {
  title: 'Weighted Pull-Up Program',
  subtitle: 'Build raw pulling strength that transfers directly to calisthenics skills.',
  description: 'Weighted pull-ups are the foundation of pulling strength for front lever, muscle-up, and advanced calisthenics.',
  
  whatItIs: {
    summary: 'Weighted pull-ups build the absolute pulling strength needed for advanced calisthenics skills. A strong weighted pull-up directly predicts front lever and muscle-up readiness. This program uses streetlifting methodology to build max strength while supporting skill development.',
    forWho: [
      'Want to build pulling strength for advanced skills',
      'Are training for streetlifting competitions',
      'Need to increase their weighted pull-up max',
      'Want to support front lever or muscle-up progression',
    ],
  },
  
  mistakes: [
    {
      title: 'Adding weight too quickly',
      description: 'Tendons adapt slower than muscles. Rapid weight increases lead to elbow and shoulder issues.',
    },
    {
      title: 'Neglecting high rep work',
      description: 'Pure strength work without volume phases leads to plateau. Hypertrophy phases build capacity for heavier loads.',
    },
    {
      title: 'Poor technique under load',
      description: 'Kipping, partial reps, and momentum defeat the purpose. Strict form builds transferable strength.',
    },
    {
      title: 'Ignoring grip development',
      description: 'Grip often fails before back strength. Dedicated grip work prevents this bottleneck.',
    },
  ],
  
  howToTrain: {
    frequency: '2-3x per week for weighted work. Can include lighter pull-up variations on other days.',
    intensity: 'Periodized between strength (85-95% 1RM) and hypertrophy (65-80% 1RM) phases.',
    progression: 'Add weight in small increments (2.5-5lb). Build rep PRs before weight PRs.',
    recovery: 'Heavy pulling requires 48-72h recovery. Monitor elbow and shoulder health.',
  },
  
  spartanlabApproach: [
    {
      title: 'Strength Ratio Tracking',
      description: 'SpartanLab tracks your weighted pull-up relative to bodyweight to predict skill readiness and program appropriate loads.',
    },
    {
      title: 'Periodized Programming',
      description: 'Alternates between strength and hypertrophy phases. Builds capacity before testing max strength.',
    },
    {
      title: 'Skill Integration',
      description: 'Balances weighted work with skill practice. Ensures pulling strength supports front lever and muscle-up goals.',
    },
    {
      title: 'Fatigue Management',
      description: 'Monitors pulling volume across all exercises. Prevents overuse by tracking total load on pulling muscles.',
    },
  ],
  
  relatedPrograms: [
    {
      title: 'Front Lever Program',
      href: '/training/front-lever-program',
      description: 'Apply pulling strength to skills',
    },
    {
      title: 'Hybrid Strength Program',
      href: '/training/hybrid-strength-program',
      description: 'Combine weighted work with barbell',
    },
    {
      title: 'Calisthenics Program',
      href: '/training/calisthenics-program',
      description: 'Complete skill development',
    },
  ],
  
  ctaText: 'Start Your Weighted Pull-Up Program',
}

export default function WeightedPullUpProgramPage() {
  return <TrainingProgramPage data={programData} />
}
