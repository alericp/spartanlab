'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Redirect from old /prs path to /history/prs
 */
export default function PRsRedirectPage() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace('/history/prs')
  }, [router])
  
  return (
    <div className="min-h-screen bg-[#0F1115] flex items-center justify-center">
      <p className="text-[#A4ACB8]">Redirecting to PR Archive...</p>
    </div>
  )
}
