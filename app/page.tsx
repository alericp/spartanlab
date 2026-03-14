// DEPLOYMENT VERIFICATION - Unique build marker
// BUILD_ID: DEPLOY-2024-MAR-13-ISOLATION-TEST
// If you see navbar/skeleton, this deploy has NOT reached production yet

import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-[#121212] text-[#F5F5F5] flex items-center justify-center">
      <div className="text-center p-8">
        <h1 className="text-4xl font-bold mb-4">SpartanLab</h1>
        
        {/* UNIQUE MARKER - If you don't see this, deploy is stale */}
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6">
          <p className="text-xl text-red-400 font-mono font-bold">BUILD: DEPLOY-2024-MAR-13-ISOLATION</p>
          <p className="text-red-300 text-sm mt-2">If you see navbar/skeleton instead of this, clear cache or check deployment status</p>
        </div>
        
        <p className="text-[#A5A5A5] mb-6">ClerkProviderWrapper is now active. Test auth routes below.</p>
        
        <div className="flex gap-4 justify-center mb-8">
          <Link 
            href="/sign-in" 
            className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors"
          >
            Test Sign In
          </Link>
          <Link 
            href="/sign-up" 
            className="px-6 py-3 bg-[#2A2A2A] hover:bg-[#3A3A3A] text-white rounded-lg font-medium transition-colors"
          >
            Test Sign Up
          </Link>
        </div>
        
        <p className="text-[#666] text-sm">This page has NO navbar, NO skeleton. Just static content.</p>
        <p className="text-[#666] text-sm mt-2">If you see skeleton cards, the old code is still cached somewhere.</p>
      </div>
    </div>
  )
}
