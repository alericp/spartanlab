'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Sparkles, Zap } from 'lucide-react'
import { ProgramPreviewForm } from '@/components/preview/ProgramPreviewForm'
import { ProgramPreviewDisplay } from '@/components/preview/ProgramPreviewDisplay'
import {
  generatePreviewProgram,
  type PreviewProgram,
  type PreviewInput,
  type PreviewGoal,
} from '@/lib/preview/preview-engine'

export function PreviewPageContent() {
  const searchParams = useSearchParams()
  const [preview, setPreview] = useState<PreviewProgram | null>(null)
  const [input, setInput] = useState<PreviewInput | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  // Get initial goal from URL params (from skill pages, calculators, etc.)
  const initialGoal = (searchParams.get('goal') as PreviewGoal) || undefined

  // Auto-generate if all params provided
  useEffect(() => {
    const goal = searchParams.get('goal') as PreviewGoal
    const level = searchParams.get('level')
    const duration = searchParams.get('duration')
    
    if (goal && level && duration) {
      const autoInput: PreviewInput = {
        primaryGoal: goal,
        secondaryGoal: (searchParams.get('secondary') as PreviewGoal) || undefined,
        experienceLevel: level as 'beginner' | 'intermediate' | 'advanced',
        sessionDuration: parseInt(duration) as 30 | 45 | 60,
        equipment: (searchParams.get('equipment') as 'basic' | 'weighted' | 'full') || 'weighted',
      }
      handleGenerate(autoInput)
    }
  // Only run on mount with initial params
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleGenerate = (formInput: PreviewInput) => {
    setIsGenerating(true)
    // Small delay for perceived value
    setTimeout(() => {
      const program = generatePreviewProgram(formInput)
      setPreview(program)
      setInput(formInput)
      setIsGenerating(false)
      // Scroll to top of preview
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 500)
  }

  const handleReset = () => {
    setPreview(null)
    setInput(null)
  }

  return (
    <div className="min-h-screen bg-[#0F1115]">
      {/* Header */}
      <header className="border-b border-[#1A1A1A] bg-[#0F1115]/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/tools"
            className="flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#A5A5A5] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Tools
          </Link>
          <Link href="/" className="text-lg font-bold text-[#E6E9EF]">
            SpartanLab
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C1121F]/10 border border-[#C1121F]/20 text-[#C1121F] text-sm mb-4">
            <Sparkles className="w-4 h-4" />
            Program Preview
          </div>
          <h1 className="text-3xl font-bold text-[#E6E9EF] mb-2">
            See Your Program Before You Commit
          </h1>
          <p className="text-[#A5A5A5] max-w-xl mx-auto">
            Generate a realistic preview of your personalized training plan in seconds.
            No signup required.
          </p>
        </div>

        {/* Main Content */}
        {preview && input ? (
          <ProgramPreviewDisplay
            program={preview}
            input={input}
            onReset={handleReset}
          />
        ) : (
          <div className="max-w-2xl mx-auto">
            <ProgramPreviewForm
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
              initialGoal={initialGoal}
            />

            {/* Trust Indicators */}
            <div className="mt-8 pt-8 border-t border-[#1A1A1A]">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-[#C1121F]">150+</div>
                  <div className="text-xs text-[#6B7280]">Exercise Library</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#C1121F]">8</div>
                  <div className="text-xs text-[#6B7280]">Skill Pathways</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#C1121F]">100%</div>
                  <div className="text-xs text-[#6B7280]">Adaptive</div>
                </div>
              </div>
            </div>

            {/* How It Works */}
            <div className="mt-8 space-y-4">
              <h2 className="text-lg font-semibold text-[#E6E9EF] text-center">
                How Preview Works
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] text-center">
                  <div className="w-8 h-8 rounded-full bg-[#C1121F]/20 flex items-center justify-center mx-auto mb-2">
                    <span className="text-sm font-bold text-[#C1121F]">1</span>
                  </div>
                  <div className="text-sm font-medium text-[#E6E9EF]">Select Your Goal</div>
                  <div className="text-xs text-[#6B7280] mt-1">Planche, Front Lever, or more</div>
                </div>
                <div className="p-4 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] text-center">
                  <div className="w-8 h-8 rounded-full bg-[#C1121F]/20 flex items-center justify-center mx-auto mb-2">
                    <span className="text-sm font-bold text-[#C1121F]">2</span>
                  </div>
                  <div className="text-sm font-medium text-[#E6E9EF]">Set Your Level</div>
                  <div className="text-xs text-[#6B7280] mt-1">Experience and time available</div>
                </div>
                <div className="p-4 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] text-center">
                  <div className="w-8 h-8 rounded-full bg-[#C1121F]/20 flex items-center justify-center mx-auto mb-2">
                    <Zap className="w-4 h-4 text-[#C1121F]" />
                  </div>
                  <div className="text-sm font-medium text-[#E6E9EF]">See Your Plan</div>
                  <div className="text-xs text-[#6B7280] mt-1">Instant preview generation</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1A1A1A] py-6 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center text-xs text-[#6B7280]">
          <p>
            Preview programs are simplified examples. Full programs include detailed progressions,
            auto-adjusting difficulty, and personalized coaching based on your complete profile.
          </p>
        </div>
      </footer>
    </div>
  )
}
