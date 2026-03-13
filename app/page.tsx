// AUTH RESTORATION TEST - Minimal page with ClerkProviderWrapper active
// Testing if auth routes work before restoring full landing page

import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-[#121212] text-[#F5F5F5] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">SpartanLab</h1>
        <p className="text-xl text-amber-500 font-mono mb-4">AUTH RESTORATION TEST</p>
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
        
        <p className="text-[#666] text-sm">If auth works, landing page can be restored next.</p>
      </div>
    </div>
  )
}
