import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, type LucideIcon } from 'lucide-react'

interface RelatedFeatureCTAProps {
  icon: LucideIcon
  title: string
  description: string
  ctaText: string
  ctaHref: string
}

export function RelatedFeatureCTA({ icon: Icon, title, description, ctaText, ctaHref }: RelatedFeatureCTAProps) {
  return (
    <section className="py-16 px-4 sm:px-6 bg-[#1A1A1A] border-y border-[#2A2A2A]">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="flex-shrink-0">
            <div className="w-16 h-16 rounded-xl bg-[#E63946]/10 flex items-center justify-center">
              <Icon className="w-8 h-8 text-[#E63946]" />
            </div>
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-xl sm:text-2xl font-bold mb-2">{title}</h2>
            <p className="text-[#A5A5A5]">{description}</p>
          </div>
          <div className="flex-shrink-0">
            <Link href={ctaHref}>
              <Button size="lg" className="bg-[#E63946] hover:bg-[#D62828] gap-2">
                {ctaText}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
