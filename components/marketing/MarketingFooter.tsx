'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { SpartanIcon } from '@/components/brand/SpartanLogo'

export function MarketingFooter() {
  // Use static year for SSR, update on client to avoid hydration mismatch
  const [year, setYear] = useState(2024)
  
  useEffect(() => {
    setYear(new Date().getFullYear())
  }, [])
  return (
    <footer className="border-t border-[#2B313A] bg-[#0F1115]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <SpartanIcon size={30} />
              <span className="text-lg font-bold tracking-tight text-[#E6E9EF]">SpartanLab</span>
            </Link>
            <p className="text-sm text-[#A4ACB8] max-w-sm mb-4">
              The Calisthenics Training Decision Engine. Analyzes your training data and tells you exactly what to train next.
            </p>
            <p className="text-xs text-[#6B7280]">
              Like having a coach analyzing your training 24/7.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-sm font-semibold mb-4 text-[#E6E9EF]">Platform</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/how-it-works" className="text-sm text-[#A4ACB8] hover:text-[#E6E9EF] transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/tools" className="text-sm text-[#A4ACB8] hover:text-[#E6E9EF] transition-colors">
                  Free Tools
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-sm text-[#A4ACB8] hover:text-[#E6E9EF] transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-sm text-[#A4ACB8] hover:text-[#E6E9EF] transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-sm text-[#A4ACB8] hover:text-[#E6E9EF] transition-colors">
                  Open App
                </Link>
              </li>
            </ul>
          </div>

          {/* Training Guides / SEO Links */}
          <div>
            <h4 className="text-sm font-semibold mb-4 text-[#E6E9EF]">Training Guides</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/guides/front-lever-progression" className="text-sm text-[#A4ACB8] hover:text-[#E6E9EF] transition-colors">
                  Front Lever Guide
                </Link>
              </li>
              <li>
                <Link href="/guides/planche-progression" className="text-sm text-[#A4ACB8] hover:text-[#E6E9EF] transition-colors">
                  Planche Guide
                </Link>
              </li>
              <li>
                <Link href="/guides/muscle-up-progression" className="text-sm text-[#A4ACB8] hover:text-[#E6E9EF] transition-colors">
                  Muscle-Up Guide
                </Link>
              </li>
              <li>
                <Link href="/guides/calisthenics-strength-standards" className="text-sm text-[#A4ACB8] hover:text-[#E6E9EF] transition-colors">
                  Strength Standards
                </Link>
              </li>
              <li>
                <Link href="/guides/calisthenics-training-program" className="text-sm text-[#A4ACB8] hover:text-[#E6E9EF] transition-colors">
                  Programming Guide
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-[#2B313A] flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-[#6B7280]">
            &copy; {year} SpartanLab. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/terms" className="text-xs text-[#6B7280] hover:text-[#A4ACB8] transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="text-xs text-[#6B7280] hover:text-[#A4ACB8] transition-colors">
              Privacy
            </Link>
            <a 
              href="mailto:support@spartanlab.app" 
              className="text-xs text-[#6B7280] hover:text-[#A4ACB8] transition-colors"
            >
              support@spartanlab.app
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
