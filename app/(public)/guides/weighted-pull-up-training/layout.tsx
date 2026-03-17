import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Weighted Pull-Up Strength Guide | SpartanLab',
  description: 'Learn how to build weighted pull-up strength with proven calisthenics exercises, progressions, and training advice. Includes strength standards and exercise techniques.',
  keywords: ['weighted pull-up training', 'how to increase pull-up strength', 'weighted pull-up progression', 'calisthenics pulling strength', 'pull-up strength standards'],
  openGraph: {
    title: 'Weighted Pull-Up Strength Guide | SpartanLab',
    description: 'Learn how to build weighted pull-up strength with proven calisthenics exercises, progressions, and training advice.',
    type: 'article',
  },
}

export default function WeightedPullUpGuideLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
