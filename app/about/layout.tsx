import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About SpartanLab | Calisthenics Training Platform',
  description: 'Learn how SpartanLab helps calisthenics athletes train smarter using data-driven programming and adaptive training recommendations.',
  keywords: 'calisthenics training system, calisthenics training platform, adaptive calisthenics training',
}

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
