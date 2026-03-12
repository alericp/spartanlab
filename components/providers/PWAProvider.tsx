'use client'

import { useEffect } from 'react'
import { registerServiceWorker } from '@/hooks/use-pwa'

export function PWAProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Register service worker on mount
    registerServiceWorker()
  }, [])

  return <>{children}</>
}
