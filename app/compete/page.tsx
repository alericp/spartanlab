'use client'

import { useState, useEffect } from 'react'
import { PageContainer } from '@/components/layout'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { H2HPanel } from '@/components/h2h'
import { processWeeklyReset } from '@/lib/h2h/h2h-service'

function CompeteContent() {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
    // Process weekly reset on page load
    processWeeklyReset()
  }, [])
  
  if (!mounted) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-2 border-[#C1121F] border-t-transparent rounded-full animate-spin" />
        </div>
      </PageContainer>
    )
  }
  
  return (
    <PageContainer>
      <H2HPanel />
    </PageContainer>
  )
}

export default function CompetePage() {
  return (
    <AuthGuard>
      <CompeteContent />
    </AuthGuard>
  )
}
