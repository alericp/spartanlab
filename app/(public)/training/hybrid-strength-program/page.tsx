import type { Metadata } from 'next'
import { TrainingProgramPage, type TrainingProgramData } from '@/components/marketing/TrainingProgramPage'

export const metadata: Metadata = {
  title: 'Hybrid Strength Program - Calisthenics + Barbell Training',
  description: 'Combine calisthenics skills with barbell strength training. Weighted calisthenics, deadlift integration, and hybrid programming for complete strength development.',
  keywords: [
    'hybrid strength training',
    'calisthenics and weights',
    'hybrid calisthenics program',
    'streetlifting training',
    'deadlift calisthenics',
    'weighted calisthenics program',
    'barbell and bodyweight',
    'hybrid workout program',
  ],
  openGraph: {
    title: 'Hybrid Strength Program - SpartanLab',
    description: 'Combine calisthenics skills with barbell strength for complete athletic development.',
    type: 'website',
  },
}

const programData: TrainingProgramData = {
  title: 'Hybrid Strength Program',
  subtitle: 'Combine calisthenics skill development with barbell and weighted strength training.',
  description: 'Build complete strength by integrating deadlifts, weighted calisthenics, and skill work in a balanced program.',
  
  whatItIs: {
    summary: 'Hybrid strength training combines the skill mastery of calisthenics with the raw strength development of barbell training. Weighted pull-ups, weighted dips, and deadlifts build force production that transfers to skills. This program integrates both modalities without creating fatigue interference.',
    forWho: [
      'Want to combine calisthenics with barbell training',
      'Are interested in streetlifting competitions',
      'Want to build overall strength without sacrificing skills',
      'Need structured integration of multiple training modalities',
    ],
  },
  
  mistakes: [
    {
      title: 'Too much volume from both modalities',
      description: 'Adding full barbell programs to full calisthenics programs leads to overtraining. Integration requires reduction from both.',
    },
    {
      title: 'Poor exercise placement',
      description: 'Heavy deadlifts before skill practice impairs performance. Exercise order and day placement matters.',
    },
    {
      title: 'Ignoring fatigue interference',
      description: 'Barbell pulling affects calisthenics pulling recovery. Without managing overlap, progress stalls.',
    },
    {
      title: 'Losing skill focus',
      description: 'Barbell work is easier to quantify. Athletes often drift toward strength numbers and neglect skill development.',
    },
  ],
  
  howToTrain: {
    frequency: '4-5x per week total. Skill days, strength days, and hybrid days can be structured based on priorities.',
    intensity: 'Periodize barbell work. Keep skill practice sub-maximal. Avoid max effort on both in same session.',
    progression: 'Progress weighted calisthenics and barbell lifts independently. Monitor skill performance for interference.',
    recovery: 'Barbell posterior chain work affects pulling recovery. Space heavy sessions appropriately.',
  },
  
  spartanlabApproach: [
    {
      title: 'Modality Integration',
      description: 'SpartanLab programs barbell and calisthenics work with awareness of fatigue overlap. Prevents interference between modalities.',
    },
    {
      title: 'Strength Ratio Tracking',
      description: 'Monitors weighted calisthenics and barbell numbers to ensure balanced development across movement patterns.',
    },
    {
      title: 'Skill Protection',
      description: 'Ensures calisthenics skill development remains primary. Barbell work supports but does not override skill focus.',
    },
    {
      title: 'Periodization Alignment',
      description: 'Aligns strength phases and skill phases. Builds strength during accumulation, tests skills during realization.',
    },
  ],
  
  relatedPrograms: [
    {
      title: 'Weighted Pull-Up Program',
      href: '/training/weighted-pull-up-program',
      description: 'Focus on weighted pulling',
    },
    {
      title: 'Calisthenics Program',
      href: '/training/calisthenics-program',
      description: 'Pure calisthenics focus',
    },
    {
      title: 'Front Lever Program',
      href: '/training/front-lever-program',
      description: 'Skill-specific development',
    },
  ],
  
  ctaText: 'Build Your Hybrid Strength Program',
}

export default function HybridStrengthProgramPage() {
  return <TrainingProgramPage data={programData} />
}
