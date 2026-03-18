'use client'

import { useState } from 'react'
import { ChevronDown, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface FAQItem {
  question: string
  answer: string
}

interface FAQProps {
  title?: string
  faqs: FAQItem[]
  defaultOpen?: number[]
}

function FAQAccordionItem({ 
  faq, 
  isOpen, 
  onToggle 
}: { 
  faq: FAQItem
  isOpen: boolean
  onToggle: () => void 
}) {
  return (
    <div className="border border-[#2A2A2A] rounded-xl overflow-hidden bg-[#121212]">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-[#1A1A1A] transition-colors"
        aria-expanded={isOpen}
      >
        <span className="font-medium text-[#E6E9EF] pr-4">{faq.question}</span>
        <ChevronDown 
          className={cn(
            "w-5 h-5 text-[#A5A5A5] shrink-0 transition-transform duration-200",
            isOpen && "rotate-180"
          )} 
        />
      </button>
      <div 
        className={cn(
          "overflow-hidden transition-all duration-200",
          isOpen ? "max-h-96" : "max-h-0"
        )}
      >
        <div className="p-5 pt-0 text-[#A5A5A5] text-sm leading-relaxed border-t border-[#2A2A2A]">
          {faq.answer}
        </div>
      </div>
    </div>
  )
}

export function FAQ({ 
  title = "Frequently Asked Questions", 
  faqs,
  defaultOpen = [0]
}: FAQProps) {
  const [openItems, setOpenItems] = useState<number[]>(defaultOpen)

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    )
  }

  // Defensive guard: if faqs is undefined or not an array, return null
  if (!faqs || !Array.isArray(faqs) || faqs.length === 0) {
    return null
  }

  return (
    <section className="py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <HelpCircle className="w-6 h-6 text-[#E63946]" />
          <h2 className="text-2xl font-bold">{title}</h2>
        </div>
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <FAQAccordionItem
              key={index}
              faq={faq}
              isOpen={openItems.includes(index)}
              onToggle={() => toggleItem(index)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

// Export FAQ data type for schema generation
export type { FAQItem as FAQSchemaItem }
