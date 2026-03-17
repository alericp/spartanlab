import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Six Pack Abs Training Guide | SpartanLab',
  description: 'Learn how to build strong abdominal muscles with calisthenics exercises and dragon flag progressions. Complete guide to core training for calisthenics athletes.',
  keywords: ['six pack abs training', 'calisthenics abs workout', 'dragon flag exercise', 'dragon flag progression', 'core training calisthenics'],
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
