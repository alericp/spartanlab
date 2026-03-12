'use client'

import { useState, useEffect, useCallback } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface UsePWAReturn {
  isInstallable: boolean
  isInstalled: boolean
  isIOS: boolean
  promptInstall: () => Promise<boolean>
  dismissInstallPrompt: () => void
  hasUserDismissed: boolean
}

const PWA_DISMISSED_KEY = 'spartanlab_pwa_dismissed'
const PWA_DISMISSED_TIMESTAMP_KEY = 'spartanlab_pwa_dismissed_at'
const DISMISS_COOLDOWN_DAYS = 7

export function usePWA(): UsePWAReturn {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [hasUserDismissed, setHasUserDismissed] = useState(false)

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      const isIOSStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true
      setIsInstalled(isStandalone || isIOSStandalone)
    }

    // Check if iOS
    const checkIOS = () => {
      const userAgent = window.navigator.userAgent.toLowerCase()
      const isIOSDevice = /iphone|ipad|ipod/.test(userAgent)
      const isIOSWebkit = /webkit/.test(userAgent) && !/chrome/.test(userAgent)
      setIsIOS(isIOSDevice && isIOSWebkit)
    }

    // Check if user has dismissed the prompt recently
    const checkDismissed = () => {
      const dismissed = localStorage.getItem(PWA_DISMISSED_KEY)
      const dismissedAt = localStorage.getItem(PWA_DISMISSED_TIMESTAMP_KEY)
      
      if (dismissed === 'true' && dismissedAt) {
        const dismissedDate = new Date(parseInt(dismissedAt, 10))
        const now = new Date()
        const daysSinceDismiss = (now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24)
        
        if (daysSinceDismiss < DISMISS_COOLDOWN_DAYS) {
          setHasUserDismissed(true)
        } else {
          // Reset after cooldown
          localStorage.removeItem(PWA_DISMISSED_KEY)
          localStorage.removeItem(PWA_DISMISSED_TIMESTAMP_KEY)
        }
      }
    }

    checkInstalled()
    checkIOS()
    checkDismissed()

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
    }

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setInstallPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)')
    const handleDisplayModeChange = () => {
      setIsInstalled(mediaQuery.matches)
    }
    mediaQuery.addEventListener('change', handleDisplayModeChange)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      mediaQuery.removeEventListener('change', handleDisplayModeChange)
    }
  }, [])

  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!installPrompt) {
      return false
    }

    try {
      await installPrompt.prompt()
      const { outcome } = await installPrompt.userChoice
      
      if (outcome === 'accepted') {
        setInstallPrompt(null)
        return true
      }
      return false
    } catch {
      return false
    }
  }, [installPrompt])

  const dismissInstallPrompt = useCallback(() => {
    setHasUserDismissed(true)
    localStorage.setItem(PWA_DISMISSED_KEY, 'true')
    localStorage.setItem(PWA_DISMISSED_TIMESTAMP_KEY, Date.now().toString())
  }, [])

  return {
    isInstallable: !!installPrompt && !isInstalled && !hasUserDismissed,
    isInstalled,
    isIOS: isIOS && !isInstalled && !hasUserDismissed,
    promptInstall,
    dismissInstallPrompt,
    hasUserDismissed,
  }
}

// Service Worker Registration
export function registerServiceWorker(): void {
  if (typeof window === 'undefined') return
  
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[PWA] Service Worker registered:', registration.scope)
          
          // Check for updates periodically
          setInterval(() => {
            registration.update()
          }, 60 * 60 * 1000) // Check every hour
        })
        .catch((error) => {
          console.log('[PWA] Service Worker registration failed:', error)
        })
    })
  }
}
