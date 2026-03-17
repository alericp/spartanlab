import type { Metadata } from 'next'
import { TrainingProgramPage, type TrainingProgramData } from '@/components/marketing/TrainingProgramPage'

export const metadata: Metadata = {
  title: 'Hybrid Strength Program | Calisthenics + Barbell Training Combined',
  description: 'Combine calisthenics skills with barbell strength training. Intelligent programming that makes both systems work together, not against each other.',
  keywords: [
    'hybrid strength program',
    'calisthenics and weights',
    'barbell and bodyweight',
    'hybrid training program',
    'combined strength training',
    'calisthenics powerlifting',
  ],
  openGraph: {
    title: 'Hybrid Strength Program | SpartanLab',
    description: 'Combine calisthenics skills with barbell strength. Intelligent programming for hybrid athletes.',
    type: 'website',
  },
  alternates: {
    canonical: 'https://spartanlab.io/hybrid-strength-program',
  },
}

const programData: TrainingProgramData = {
  title: 'Hybrid Strength Program',
  subtitle: 'Combine calisthenics skills with barbell strength—intelligently.',
  description: 'Most athletes choose sides. Hybrid training takes the best from both worlds when programmed correctly.',
  
  whatItIs: {
    summary: 'Hybrid training combines calisthenics skills (front lever, planche, muscle-up) with barbell strength work (deadlift, overhead press, rows). The challenge is that both systems demand recovery, and random combination leads to overtraining. SpartanLab programs hybrid training with intelligent volume distribution—you get stronger at both without burning out.',
    forWho: [
      'Want to build barbell strength while maintaining calisthenics skills',
      'Need deadlift and squat strength for overall athleticism',
      'Want a balanced physique that performs across domains',
      'Are willing to train 4-5 days per week with proper structure',
    ],
  },
  
  mistakes: [
    {
      title: 'Treating both systems as separate',
      description: 'Adding a random powerlifting program to your calisthenics routine creates volume overload. They must be integrated.',
    },
    {
      title: 'Ignoring overlap',
      description: 'Weighted pull-ups and barbell rows both tax pulling. Deadlifts and front lever both demand lat strength. Programming must account for overlap.',
    },
    {
      title: 'Prioritizing everything equally',
      description: 'You can\'t peak for front lever, muscle-up, AND a deadlift PR simultaneously. Periodization requires priority phases.',
    },
    {
      title: 'Neglecting recovery math',
      description: 'Two demanding systems means twice the recovery demand. Sleep, nutrition, and deloads become non-negotiable.',
    },
  ],
  
  howToTrain: {
    frequency: '4-5 sessions per week with dedicated pushing, pulling, and lower body days. Skills integrated into upper body days.',
    intensity: 'Barbell work follows progressive overload. Skill work stays submaximal except during peaking phases.',
    progression: 'Primary lifts progress weekly in strength phases. Skills progress when prerequisites are met.',
    recovery: 'At least 2 full rest days per week. Deload every 4-6 weeks. Monitor CNS fatigue.',
  },
  
  spartanlabApproach: [
    {
      title: 'Volume Distribution',
      description: 'The system calculates total pulling, pushing, and leg volume across both barbell and bodyweight work. Nothing gets overlooked.',
    },
    {
      title: 'Priority Phasing',
      description: 'Choose your current priority (skill acquisition, barbell strength, or balanced). The system adjusts volume accordingly.',
    },
    {
      title: 'Transfer Tracking',
      description: 'Monitors how your barbell strength transfers to calisthenics and vice versa. Deadlift going up but front lever stagnating? The system flags it.',
    },
    {
      title: 'Integrated Periodization',
      description: 'Both systems are periodized together. Strength phases, hypertrophy phases, and skill peaking phases all coordinate.',
    },
  ],
  
  relatedPrograms: [
    {
      title: 'Deadlift Standards',
      href: '/deadlift-strength-standards',
      description: 'See where your pulling power ranks.',
    },
    {
      title: 'Hybrid vs Pure Calisthenics',
      href: '/weighted-calisthenics-vs-powerlifting',
      description: 'Compare training systems.',
    },
    {
      title: 'Front Lever Requirements',
      href: '/front-lever-strength-requirements',
      description: 'Pulling strength needed for front lever.',
    },
  ],
  
  ctaText: 'Build My Hybrid Program',
}

export default function HybridStrengthProgramPage() {
  return <TrainingProgramPage data={programData} />
}
