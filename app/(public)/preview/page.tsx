import { Metadata } from 'next'
import { Suspense } from 'react'
import { PreviewPageContent } from './PreviewPageContent'

export const metadata: Metadata = {
  title: 'Program Preview Generator | SpartanLab',
  description: 'See exactly what your personalized calisthenics program looks like. Generate a preview based on your goals, experience, and available time.',
  keywords: [
    'calisthenics program preview',
    'workout plan generator',
    'planche training program',
    'front lever program',
    'muscle up program',
    'personalized workout',
    'calisthenics training plan',
  ],
  openGraph: {
    title: 'Program Preview Generator | SpartanLab',
    description: 'See exactly what your personalized calisthenics program looks like before you commit.',
    type: 'website',
  },
}

function PreviewLoading() {
  return (
    <div className="min-h-screen bg-[#0F1115] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#C1121F] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function PreviewPage() {
  return (
    <Suspense fallback={<PreviewLoading />}>
      <PreviewPageContent />
    </Suspense>
  )
}
