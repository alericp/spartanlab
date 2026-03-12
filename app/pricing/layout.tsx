import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SpartanLab Pricing | Calisthenics Training Platform',
  description: 'Explore SpartanLab pricing and unlock adaptive calisthenics training programs, strength analytics, and performance tracking.',
  keywords: 'calisthenics training intelligence, adaptive training engine, calisthenics program generator, calisthenics training platform',
}

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
