'use client'

import { AlertTriangle, XCircle } from 'lucide-react'

export interface Mistake {
  title: string
  description: string
}

interface CommonMistakesProps {
  title?: string
  mistakes: Mistake[]
  variant?: 'grid' | 'list'
}

export function CommonMistakes({ 
  title = "Common Training Mistakes", 
  mistakes,
  variant = 'grid'
}: CommonMistakesProps) {
  if (variant === 'list') {
    return (
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="w-6 h-6 text-[#E63946]" />
            <h2 className="text-2xl font-bold">{title}</h2>
          </div>
          <div className="space-y-3">
            {mistakes.map((mistake) => (
              <div 
                key={mistake.title} 
                className="flex items-start gap-3 p-4 bg-[#1A1A1A] rounded-xl border border-[#2A2A2A]"
              >
                <XCircle className="w-5 h-5 text-[#E63946] mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-semibold text-[#E6E9EF] mb-1">{mistake.title}</h3>
                  <p className="text-sm text-[#A5A5A5]">{mistake.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <AlertTriangle className="w-6 h-6 text-[#E63946]" />
          <h2 className="text-2xl font-bold">{title}</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {mistakes.map((mistake) => (
            <div 
              key={mistake.title} 
              className="p-5 bg-[#1A1A1A] rounded-xl border border-[#2A2A2A]"
            >
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-4 h-4 text-[#E63946]" />
                <h3 className="font-semibold text-[#E6E9EF]">{mistake.title}</h3>
              </div>
              <p className="text-sm text-[#A5A5A5]">{mistake.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
