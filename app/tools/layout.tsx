import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    template: '%s | SpartanLab Tools',
    default: 'Free Calisthenics Training Tools | SpartanLab',
  },
  description: 'Free calisthenics calculators and training tools. Front lever progression, weighted pull-up calculator, planche readiness test, and strength standards.',
}

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
