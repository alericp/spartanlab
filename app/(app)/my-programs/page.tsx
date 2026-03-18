'use client'

/**
 * Legacy /my-programs route
 * 
 * This route redirects to /program (the canonical current-program route).
 * Kept for backward compatibility with old links and bookmarks.
 */

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ProgramsPage() {
  const router = useRouter()
  
  // Redirect to canonical /program route
  useEffect(() => {
    router.replace('/program')
  }, [router])
  
  // Show loading state during redirect
  return (
    <div className="min-h-screen bg-[#121212] text-[#F5F5F5] flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[#C1121F] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#6B7280]">Redirecting to your program...</p>
      </div>
    </div>
  )
}
