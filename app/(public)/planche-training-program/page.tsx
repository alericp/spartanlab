import type { Metadata } from 'next'
import { TrainingProgramPage, type TrainingProgramData } from '@/components/marketing/TrainingProgramPage'

export const metadata: Metadata = {
  title: 'Planche Training Program | Custom Progression System',
  description: 'Structured planche progression that builds the pushing strength, straight-arm power, and lean you need. From tuck to full planche—programmed intelligently.',
  keywords: [
    'planche training program',
    'planche progression',
    'how to planche',
    'planche workout plan',
    'straddle planche program',
    'planche training plan',
  ],
  openGraph: {
    title: 'Planche Training Program | SpartanLab',
    description: 'Structured planche progression that builds pushing strength and straight-arm power.',
    type: 'website',
  },
  alternates: {
    canonical: 'https://spartanlab.io/planche-training-program',
  },
}

const programData: TrainingProgramData = {
  title: 'Planche Training Program',
  subtitle: 'Build the pushing strength, straight-arm power, and lean control for planche.',
  description: 'The planche is the ultimate pushing skill. SpartanLab programs it with the patience and structure it demands.',
  
  whatItIs: {
    summary: 'The planche requires exceptional pushing strength, shoulder stability, and straight-arm conditioning. Most athletes underestimate the timeline (years, not months) and overtrain the skill itself. SpartanLab builds the foundational strength systematically while programming skill work at sustainable volumes. You\'ll progress faster by training smarter.',
    forWho: [
      'Want to achieve tuck, straddle, or full planche',
      'Have been stuck at the same progression for months',
      'Need to build straight-arm strength foundation',
      'Want structured long-term programming, not random attempts',
    ],
  },
  
  mistakes: [
    {
      title: 'Training planche daily',
      description: 'Planche work is extremely demanding on wrists, shoulders, and connective tissue. Daily practice leads to injury and stagnation.',
    },
    {
      title: 'Neglecting weighted pushing',
      description: 'Planche requires serious pushing strength. Weighted dips build the foundation. Bodyweight-only training is too slow.',
    },
    {
      title: 'Ignoring straight-arm conditioning',
      description: 'Bent-arm strength doesn\'t transfer fully to straight-arm holds. Specific conditioning is required.',
    },
    {
      title: 'Expecting fast progress',
      description: 'Planche is a multi-year skill for most athletes. Programs promising fast results are lying.',
    },
  ],
  
  howToTrain: {
    frequency: '2-3 planche-specific sessions per week. Additional pushing strength work can supplement.',
    intensity: 'Skill holds at 60-80% max effort. Avoid training to failure on static holds. Strength work follows progressive overload.',
    progression: 'Master each lean progression before advancing. Weighted dip targets guide when you\'re ready for harder leans.',
    recovery: 'Wrists and shoulders need careful management. 48-72 hours between hard sessions. Include prehab work.',
  },
  
  spartanlabApproach: [
    {
      title: 'Pushing Strength Analysis',
      description: 'Analyzes your weighted dip ratio and horizontal pushing strength. These metrics predict planche readiness.',
    },
    {
      title: 'Straight-Arm Conditioning',
      description: 'Programs planche leans, pseudo planche push-ups, and other straight-arm work with appropriate volume.',
    },
    {
      title: 'Wrist & Shoulder Health',
      description: 'Integrates mobility and prehab work. Monitors for overuse signals. Sustainable training, not reckless attempts.',
    },
    {
      title: 'Progressive Skill Integration',
      description: 'Programs the right planche progression based on your strength. Advances you when prerequisites are met.',
    },
  ],
  
  relatedPrograms: [
    {
      title: 'Planche Readiness Calculator',
      href: '/planche-readiness-calculator',
      description: 'Check if you meet the strength prerequisites.',
    },
    {
      title: 'Planche Requirements',
      href: '/planche-strength-requirements',
      description: 'Exact strength benchmarks for each progression.',
    },
    {
      title: 'Weighted Dip Standards',
      href: '/weighted-dip-strength-standards',
      description: 'Build the pushing foundation that transfers.',
    },
  ],
  
  ctaText: 'Build My Planche Program',
}

export default function PlancheProgramPage() {
  return <TrainingProgramPage data={programData} />
}
