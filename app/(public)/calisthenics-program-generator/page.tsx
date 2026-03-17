import type { Metadata } from 'next'
import { TrainingProgramPage, type TrainingProgramData } from '@/components/marketing/TrainingProgramPage'

export const metadata: Metadata = {
  title: 'Calisthenics Program Generator | Build Your Custom Plan in Seconds',
  description: 'Generate a personalized calisthenics program based on your strength level, goals, and schedule. Adaptive training that evolves with your progress.',
  keywords: [
    'calisthenics program generator',
    'custom calisthenics program',
    'calisthenics workout builder',
    'bodyweight program generator',
    'personalized calisthenics plan',
    'calisthenics training program',
  ],
  openGraph: {
    title: 'Calisthenics Program Generator | SpartanLab',
    description: 'Generate a personalized calisthenics program based on your strength level and goals.',
    type: 'website',
  },
  alternates: {
    canonical: 'https://spartanlab.io/calisthenics-program-generator',
  },
}

const programData: TrainingProgramData = {
  title: 'Calisthenics Program Generator',
  subtitle: 'Build your personalized training plan in seconds, not hours.',
  description: 'Stop guessing. SpartanLab analyzes your current strength, skill level, and goals to generate a program that actually fits you.',
  
  whatItIs: {
    summary: 'Most calisthenics programs are static templates that ignore your starting point. They assume everyone has the same strength, mobility, and recovery capacity. SpartanLab\'s program generator creates a truly personalized plan by analyzing your inputs and building training that matches your current level—then adapts as you progress.',
    forWho: [
      'Want a program built specifically for their strength level',
      'Are tired of generic "one-size-fits-all" workout plans',
      'Need training that adapts to their schedule and equipment',
      'Want intelligent progression, not random exercise lists',
    ],
  },
  
  mistakes: [
    {
      title: 'Following programs designed for someone else',
      description: 'A program built for an advanced athlete will destroy a beginner. A program for beginners will bore intermediates. Generic templates ignore this completely.',
    },
    {
      title: 'No progression logic',
      description: 'Static programs tell you what to do today, but not how to progress tomorrow. Without built-in progression, you plateau.',
    },
    {
      title: 'Ignoring recovery capacity',
      description: 'More volume is not always better. Programs that ignore your recovery status lead to overtraining and injury.',
    },
    {
      title: 'Wrong exercise selection',
      description: 'Exercises must match your current strength. Attempting muscle-ups when you can\'t do 10 clean pull-ups is wasted effort.',
    },
  ],
  
  howToTrain: {
    frequency: 'Optimal frequency depends on your recovery capacity and goals. Most athletes thrive on 3-5 sessions per week with intelligent rest distribution.',
    intensity: 'SpartanLab calibrates intensity to your strength level. Skill work stays submaximal. Strength work follows progressive overload.',
    progression: 'Every exercise has a clear progression path. The system advances you when you hit targets, not when time passes.',
    recovery: 'Volume auto-adjusts based on performance signals. Deload weeks are programmed intelligently, not arbitrarily.',
  },
  
  spartanlabApproach: [
    {
      title: 'Strength Analysis',
      description: 'Input your current pull-up, dip, and core metrics. The system maps your strength profile to determine starting points.',
    },
    {
      title: 'Goal-Specific Programming',
      description: 'Whether you want skills, strength, or hypertrophy, the generator builds training that prioritizes your actual goal.',
    },
    {
      title: 'Schedule Integration',
      description: 'Tell the system how many days you can train. It distributes volume intelligently across your available sessions.',
    },
    {
      title: 'Adaptive Progression',
      description: 'As you log workouts, the system tracks your progress and adjusts difficulty. No manual program editing required.',
    },
  ],
  
  relatedPrograms: [
    {
      title: 'Strength Requirements',
      href: '/front-lever-strength-requirements',
      description: 'Check if you meet the prerequisites for advanced skills.',
    },
    {
      title: 'Strength Standards',
      href: '/calisthenics-strength-standards',
      description: 'Benchmark your current level against community standards.',
    },
    {
      title: 'Readiness Calculators',
      href: '/calculators',
      description: 'Test your readiness for specific skills before training them.',
    },
  ],
  
  ctaText: 'Generate My Program',
}

export default function CalisthenicsGeneratorPage() {
  return <TrainingProgramPage data={programData} />
}
