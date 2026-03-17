import type { Metadata } from 'next'
import { TrainingProgramPage, type TrainingProgramData } from '@/components/marketing/TrainingProgramPage'

export const metadata: Metadata = {
  title: 'Front Lever Training Program | Structured Progression System',
  description: 'Structured front lever progression that builds the pulling strength, core compression, and scapular control you need. From tuck to full lever—programmed systematically.',
  keywords: [
    'front lever training program',
    'front lever progression',
    'how to front lever',
    'front lever workout plan',
    'front lever training plan',
    'front lever program',
  ],
  openGraph: {
    title: 'Front Lever Training Program | SpartanLab',
    description: 'Structured front lever progression that builds pulling strength and core compression.',
    type: 'website',
  },
  alternates: {
    canonical: 'https://spartanlab.io/front-lever-training-program',
  },
}

const programData: TrainingProgramData = {
  title: 'Front Lever Training Program',
  subtitle: 'Build the pulling strength, core compression, and scapular control for front lever.',
  description: 'The front lever is the definitive test of pulling skill. SpartanLab programs it systematically.',
  
  whatItIs: {
    summary: 'The front lever requires exceptional lat strength, core compression, and active scapular depression. Most athletes plateau at tuck or advanced tuck because they lack the pulling strength foundation. SpartanLab builds weighted pulling strength alongside skill work—the combination that actually produces front lever progress.',
    forWho: [
      'Want to achieve their first front lever hold',
      'Have been stuck at tuck or advanced tuck for months',
      'Need to build serious pulling strength',
      'Want structured progression instead of random attempts',
    ],
  },
  
  mistakes: [
    {
      title: 'Training the skill without building strength',
      description: 'Front lever is a strength skill. Without sufficient weighted pull-up strength, you\'ll plateau at advanced tuck forever.',
    },
    {
      title: 'Only training vertical pulling',
      description: 'Pull-ups alone don\'t transfer fully. Front lever requires horizontal pulling and straight-arm pulling work.',
    },
    {
      title: 'Neglecting core compression',
      description: 'The hollow body position under load is demanding. Weak core compression makes the lever position impossible.',
    },
    {
      title: 'Training to failure on holds',
      description: 'Static holds trained to failure create bad patterns. Quality reps at submaximal effort build better skill.',
    },
  ],
  
  howToTrain: {
    frequency: '2-3 front lever sessions per week. Additional pulling strength work supplements.',
    intensity: 'Skill holds at 60-80% max effort. Avoid grinding. Strength work follows progressive overload.',
    progression: 'Master each lever progression before advancing. Weighted pull-up targets guide readiness.',
    recovery: 'Lats and shoulders need 48-72 hours between hard sessions. Monitor grip fatigue.',
  },
  
  spartanlabApproach: [
    {
      title: 'Pulling Strength Analysis',
      description: 'Analyzes your weighted pull-up ratio and row strength. These metrics predict front lever progression readiness.',
    },
    {
      title: 'Core Compression Assessment',
      description: 'Evaluates your hollow body strength and L-sit capacity. Ensures you have the core foundation.',
    },
    {
      title: 'Scapular Strength Development',
      description: 'Programs scapular depression work—the missing piece for most athletes stuck at advanced tuck.',
    },
    {
      title: 'Progressive Skill Integration',
      description: 'Programs the right lever progression based on your current strength. Advances you when prerequisites are met.',
    },
  ],
  
  relatedPrograms: [
    {
      title: 'Front Lever Readiness Calculator',
      href: '/front-lever-readiness-calculator',
      description: 'Check if you meet the strength prerequisites.',
    },
    {
      title: 'Front Lever Requirements',
      href: '/front-lever-strength-requirements',
      description: 'Exact strength benchmarks for each progression.',
    },
    {
      title: 'Weighted Pull-Up Standards',
      href: '/weighted-pull-up-strength-standards',
      description: 'Build the pulling foundation that transfers.',
    },
  ],
  
  ctaText: 'Build My Front Lever Program',
}

export default function FrontLeverProgramPage() {
  return <TrainingProgramPage data={programData} />
}
