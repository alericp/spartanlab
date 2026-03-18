'use client'

/**
 * First Session Page - Import-Isolated Entry Point
 * 
 * TRUE IMPORT ISOLATION: This page contains NO heavy imports at the top level.
 * Heavy services are only loaded when FIRST_SESSION_SAFE_MODE is false,
 * via dynamic import. This prevents import-time crashes from affecting the shell.
 */

import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Play, CheckCircle2 } from 'lucide-react'

// =============================================================================
// FIRST SESSION SAFE MODE - Diagnostic isolation flag
// When true, renders a minimal shell WITHOUT loading heavy services
// When false, dynamically imports the full heavy content
// =============================================================================
const FIRST_SESSION_SAFE_MODE = true

// Heavy content - ONLY loaded when safe mode is disabled
const FirstSessionHeavyContent = !FIRST_SESSION_SAFE_MODE 
  ? dynamic(() => import('@/components/first-session/FirstSessionHeavyContent'), {
      ssr: false,
      loading: () => (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )
    })
  : null

// =============================================================================
// SAFE MODE SHELL - Minimal diagnostic component
// =============================================================================

function FirstSessionSafeShell() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fromOnboarding = searchParams.get('from') === 'onboarding'

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="bg-card border-border p-6 max-w-md w-full">
        {/* Safe Mode Confirmation */}
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6 text-center">
          <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-1">
            First Session Route Working
          </h2>
          <p className="text-sm text-muted-foreground">
            Safe mode active. Navigation from dashboard succeeded.
          </p>
          <p className="text-xs text-muted-foreground mt-2 font-mono">
            FIRST_SESSION_SAFE_MODE = true
          </p>
        </div>
        
        {/* Diagnostic Info */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Route</span>
            <span className="text-foreground font-mono">/first-session</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">From Onboarding</span>
            <span className="text-foreground">{fromOnboarding ? 'Yes' : 'No'}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Heavy Services</span>
            <span className="text-amber-400">Not Loaded (Safe Mode)</span>
          </div>
        </div>
        
        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={() => router.push('/workout/session?day=1&first=true')}
            className="w-full bg-primary hover:bg-primary/90"
          >
            <Play className="w-4 h-4 mr-2" />
            Continue to Workout Session
          </Button>
          <Button
            onClick={() => router.push('/dashboard')}
            variant="outline"
            className="w-full"
          >
            Back to Dashboard
          </Button>
        </div>
      </Card>
    </div>
  )
}

// =============================================================================
// PAGE EXPORT
// =============================================================================

export default function FirstSessionPage() {
  // Safe mode: render minimal shell
  if (FIRST_SESSION_SAFE_MODE) {
    return (
      <Suspense fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <FirstSessionSafeShell />
      </Suspense>
    )
  }

  // Normal mode: load heavy content dynamically
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      {FirstSessionHeavyContent && <FirstSessionHeavyContent />}
    </Suspense>
  )
}
