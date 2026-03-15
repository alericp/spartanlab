import { Metadata } from 'next'

/**
 * Dashboard layout with noindex metadata
 * Private app page - should not appear in search results
 */
export const metadata: Metadata = {
  title: 'Dashboard | SpartanLab',
  description: 'Your personalized training dashboard',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
