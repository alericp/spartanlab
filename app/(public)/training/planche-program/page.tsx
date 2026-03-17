import type { Metadata } from 'next'
import { TrainingProgramPage, type TrainingProgramData } from '@/components/marketing/TrainingProgramPage'

export const metadata: Metadata = {
  title: 'Planche Program - Structured Planche Training',
  description: 'Build your planche with structured programming that develops pushing strength, straight-arm conditioning, and wrist preparation. Adaptive training built from real calisthenics methodology.',
  keywords: [
    'planche program',
    'planche training',
    'planche progression',
    'calisthenics planche',
    'planche workout',
    'how to planche',
    'planche training plan',
    'straddle planche',
    'tuck planche',
  ],
  openGraph: {
    title: 'Planche Program - SpartanLab',
    description: 'Structured planche training that develops pushing strength and straight-arm conditioning.',
    type: 'website',
  },
}

const programData: TrainingProgramData = {
  title: 'Planche Program',
  subtitle: 'The most demanding pushing skill in calisthenics, requiring years of dedicated preparation.',
  description: 'Build the straight-arm strength, pushing power, and joint conditioning required for planche.',
  
  whatItIs: {
    summary: 'The planche is a horizontal pushing hold that demands exceptional straight-arm strength, shoulder protraction power, and wrist conditioning. It requires longer preparation than most skills due to connective tissue adaptation. This program builds the foundation systematically over time.',
    forWho: [
      'Want to build toward their first planche hold',
      'Need to develop straight-arm strength foundations',
      'Have plateaued at tuck planche or earlier progressions',
      'Want joint-safe progression that protects wrists and elbows',
    ],
  },
  
  mistakes: [
    {
      title: 'Rushing the progressions',
      description: 'Tendons adapt slower than muscles. Jumping to harder progressions before connective tissue is ready leads to wrist and elbow injuries.',
    },
    {
      title: 'Neglecting planche lean work',
      description: 'Planche leans build the specific shoulder angle strength. Skipping this foundation makes harder progressions impossible.',
    },
    {
      title: 'Insufficient straight-arm conditioning',
      description: 'Bent-arm strength does not transfer directly. Straight-arm pressing and holds are essential prerequisites.',
    },
    {
      title: 'Ignoring wrist preparation',
      description: 'Wrists take significant load in planche. Without proper conditioning, wrist pain limits progress.',
    },
  ],
  
  howToTrain: {
    frequency: '2-3x per week for skill practice. Straight-arm conditioning can be trained more frequently with lower intensity.',
    intensity: 'Planche leans and holds at sub-maximal effort. Build time under tension before adding difficulty.',
    progression: 'Master wrist conditioning and planche leans. Progress through tuck, advanced tuck, straddle over months or years.',
    recovery: 'Wrists and elbows need adequate rest. Monitor for any pain signals and back off when needed.',
  },
  
  spartanlabApproach: [
    {
      title: 'Pushing Strength Analysis',
      description: 'SpartanLab analyzes your pushing strength and straight-arm conditioning to determine appropriate progressions.',
    },
    {
      title: 'Wrist Health Monitoring',
      description: 'Tracks wrist preparation exercises and flags when volume may be too high for joint recovery.',
    },
    {
      title: 'Long-Term Periodization',
      description: 'Programs planche work with realistic timelines. Builds strength phases that support skill acquisition.',
    },
    {
      title: 'Joint Integrity Protocols',
      description: 'Integrates wrist, elbow, and shoulder preparation into every session to protect joints during advancement.',
    },
  ],
  
  relatedPrograms: [
    {
      title: 'Front Lever Program',
      href: '/training/front-lever-program',
      description: 'Build pulling strength balance',
    },
    {
      title: 'Weighted Dip Program',
      href: '/training/weighted-pull-up-program',
      description: 'Build pushing strength foundation',
    },
    {
      title: 'Calisthenics Program',
      href: '/training/calisthenics-program',
      description: 'Complete skill development',
    },
  ],
  
  ctaText: 'Start Your Planche Program',
}

export default function PlancheProgramPage() {
  return <TrainingProgramPage data={programData} />
}
