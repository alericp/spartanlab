import type { Metadata } from 'next'
import { TrainingProgramPage, type TrainingProgramData } from '@/components/marketing/TrainingProgramPage'

export const metadata: Metadata = {
  title: 'Muscle-Up Training Program | From Zero to Your First Rep',
  description: 'Structured muscle-up progression that builds the pulling power, transition strength, and technique you need. Stop random attempts—train systematically.',
  keywords: [
    'muscle-up training program',
    'muscle-up progression',
    'how to muscle-up',
    'muscle-up workout plan',
    'bar muscle-up program',
    'ring muscle-up training',
  ],
  openGraph: {
    title: 'Muscle-Up Training Program | SpartanLab',
    description: 'Structured muscle-up progression that builds pulling power and transition strength.',
    type: 'website',
  },
  alternates: {
    canonical: 'https://spartanlab.io/muscle-up-training-program',
  },
}

const programData: TrainingProgramData = {
  title: 'Muscle-Up Training Program',
  subtitle: 'Build the pulling power, transition strength, and technique for your first muscle-up.',
  description: 'The muscle-up is the gateway skill to upper-level calisthenics. SpartanLab programs it systematically.',
  
  whatItIs: {
    summary: 'The muscle-up combines a high pull with an explosive transition and dip. Most athletes fail because they lack the pulling height, transition strength, or both. Random kipping attempts don\'t build these qualities—structured training does. SpartanLab analyzes your pulling strength and programs the exact progressions you need.',
    forWho: [
      'Want to achieve their first strict bar or ring muscle-up',
      'Have been stuck attempting muscle-ups without success',
      'Need to build explosive pulling power',
      'Want a clear progression path, not random YouTube tips',
    ],
  },
  
  mistakes: [
    {
      title: 'Attempting before ready',
      description: 'If you can\'t do 10+ clean pull-ups and pull to your chest, you\'re not ready. Attempting anyway just ingrains bad patterns.',
    },
    {
      title: 'Neglecting high pulls',
      description: 'Regular pull-ups to chin height don\'t build muscle-up strength. You need explosive pulling to sternum or higher.',
    },
    {
      title: 'Ignoring the transition',
      description: 'The transition from pull to dip is the hardest part. It requires specific strength that must be trained directly.',
    },
    {
      title: 'Relying on momentum',
      description: 'Kipping muscle-ups look impressive but don\'t build the strength for strict reps or weighted work.',
    },
  ],
  
  howToTrain: {
    frequency: '3-4 sessions per week. 2 pulling-focused days, 1-2 skill practice days.',
    intensity: 'High pulls at maximum effort. Transition work at controlled intensity. Avoid fatigue-masked practice.',
    progression: 'Build to chest-to-bar pulls → negative transitions → assisted muscle-ups → strict reps.',
    recovery: 'Explosive pulling is demanding. 48+ hours between hard pulling sessions. Monitor elbow health.',
  },
  
  spartanlabApproach: [
    {
      title: 'Readiness Assessment',
      description: 'The system evaluates your pulling strength, weighted pull-up ratio, and dip strength to determine muscle-up readiness.',
    },
    {
      title: 'Pulling Power Development',
      description: 'Programs explosive high pulls and weighted pull-ups to build the pulling height required for the transition.',
    },
    {
      title: 'Transition Strength Training',
      description: 'Specific exercises targeting the transition phase—the point where most athletes fail.',
    },
    {
      title: 'Skill Integration',
      description: 'Once prerequisites are met, integrates full muscle-up attempts with proper volume. Tracks progress toward your first rep.',
    },
  ],
  
  relatedPrograms: [
    {
      title: 'Muscle-Up Readiness Calculator',
      href: '/muscle-up-readiness-calculator',
      description: 'Check if you meet the strength prerequisites.',
    },
    {
      title: 'Muscle-Up Requirements',
      href: '/muscle-up-strength-requirements',
      description: 'Exact strength benchmarks for muscle-up.',
    },
    {
      title: 'Weighted Pull-Up Standards',
      href: '/weighted-pull-up-strength-standards',
      description: 'Build the pulling strength that transfers.',
    },
  ],
  
  ctaText: 'Build My Muscle-Up Program',
}

export default function MuscleUpProgramPage() {
  return <TrainingProgramPage data={programData} />
}
