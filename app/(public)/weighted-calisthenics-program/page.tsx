import type { Metadata } from 'next'
import { TrainingProgramPage, type TrainingProgramData } from '@/components/marketing/TrainingProgramPage'

export const metadata: Metadata = {
  title: 'Weighted Calisthenics Program | Build Serious Pulling & Pushing Strength',
  description: 'Structured weighted pull-up and weighted dip programming. Progressive overload meets calisthenics skill transfer. Build strength that matters.',
  keywords: [
    'weighted calisthenics program',
    'weighted pull-up program',
    'weighted dip program',
    'weighted calisthenics training',
    'streetlifting program',
    'weighted bodyweight training',
  ],
  openGraph: {
    title: 'Weighted Calisthenics Program | SpartanLab',
    description: 'Structured weighted pull-up and weighted dip programming with skill transfer.',
    type: 'website',
  },
  alternates: {
    canonical: 'https://spartanlab.io/weighted-calisthenics-program',
  },
}

const programData: TrainingProgramData = {
  title: 'Weighted Calisthenics Program',
  subtitle: 'Build serious pulling and pushing strength with structured weighted training.',
  description: 'Weighted calisthenics is the bridge between bodyweight skill and raw strength. SpartanLab programs it intelligently.',
  
  whatItIs: {
    summary: 'Weighted pull-ups and dips are the most effective strength builders for calisthenics athletes. They directly transfer to skills like muscle-ups, front lever, and planche. But most athletes add weight randomly without structure. SpartanLab applies progressive overload principles to weighted calisthenics, tracking your strength ratios and programming volume intelligently.',
    forWho: [
      'Want to build raw pulling and pushing strength',
      'Need weighted strength for advanced skill prerequisites',
      'Train for streetlifting or weighted calisthenics competition',
      'Want structured progressive overload, not random weight additions',
    ],
  },
  
  mistakes: [
    {
      title: 'Adding weight without a plan',
      description: 'Random weight increases lead to stagnation. Progressive overload requires systematic small jumps with proper deloads.',
    },
    {
      title: 'Neglecting rep ranges',
      description: 'Only training heavy singles ignores hypertrophy. Only training high reps ignores max strength. Both matter.',
    },
    {
      title: 'Ignoring skill transfer',
      description: 'Weighted strength should transfer to skills. If your front lever isn\'t improving despite weighted pull-up PRs, your programming is off.',
    },
    {
      title: 'Insufficient recovery',
      description: 'Heavy weighted work demands recovery. Training weighted pull-ups daily will destroy your elbows and shoulders.',
    },
  ],
  
  howToTrain: {
    frequency: '2-3 heavy weighted sessions per week. Light skill work can be added on separate days.',
    intensity: 'Periodized between strength (1-5 reps), hypertrophy (6-12 reps), and endurance (12+) phases.',
    progression: 'Add 2.5-5lbs when you hit rep targets. Deload every 4-6 weeks based on performance.',
    recovery: 'Heavy pulling and pushing need 48-72 hours between sessions. Monitor elbow and shoulder health.',
  },
  
  spartanlabApproach: [
    {
      title: 'Strength Ratio Tracking',
      description: 'The system tracks your weighted pull-up and dip strength relative to bodyweight—the metrics that matter for skill transfer.',
    },
    {
      title: 'Periodized Programming',
      description: 'Automatically cycles between strength, hypertrophy, and skill phases. No manual periodization required.',
    },
    {
      title: 'Skill Transfer Optimization',
      description: 'Programs weighted work alongside skill progressions. Your weighted strength directly feeds your front lever, planche, and muscle-up progress.',
    },
    {
      title: 'Competition Prep Mode',
      description: 'For streetlifters: peaking protocols that maximize your 1RM for competition day.',
    },
  ],
  
  relatedPrograms: [
    {
      title: 'Weighted Pull-Up Standards',
      href: '/weighted-pull-up-strength-standards',
      description: 'See where your pulling strength ranks.',
    },
    {
      title: 'Weighted Dip Standards',
      href: '/weighted-dip-strength-standards',
      description: 'Benchmark your pushing strength.',
    },
    {
      title: 'Streetlifting Standards',
      href: '/streetlifting-strength-standards',
      description: 'Competition-level weighted calisthenics benchmarks.',
    },
  ],
  
  ctaText: 'Build My Weighted Program',
}

export default function WeightedCalisthenicsPage() {
  return <TrainingProgramPage data={programData} />
}
