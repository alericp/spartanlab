import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Weighted Dip Training Guide | SpartanLab',
  description: 'Learn how to build weighted dip strength with proven calisthenics exercises, strength progressions, and expert training advice.',
  keywords: ['weighted dips', 'weighted dip training', 'how to increase dip strength', 'weighted dip progression', 'calisthenics pushing strength'],
  openGraph: {
    title: 'Weighted Dip Training Guide | SpartanLab',
    description: 'Learn how to build weighted dip strength with proven calisthenics exercises and strength progressions.',
    type: 'article',
  },
}

export default function WeightedDipGuideLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
