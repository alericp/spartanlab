import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight } from 'lucide-react'

interface SeoHeroProps {
  title: string
  subtitle: string
  ctaText?: string
  ctaHref?: string
  secondaryCtaText?: string
  secondaryCtaHref?: string
  badge?: string
}

export function SeoHero({ title, subtitle, ctaText, ctaHref, secondaryCtaText, secondaryCtaHref, badge }: SeoHeroProps) {
  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto text-center">
        {badge && (
          <Badge variant="outline" className="mb-4 text-[#C1121F] border-[#C1121F]/30 bg-[#C1121F]/10">
            {badge}
          </Badge>
        )}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-balance mb-6">
          {title}
        </h1>
        <p className="text-lg sm:text-xl text-[#A5A5A5] max-w-2xl mx-auto mb-8 text-pretty">
          {subtitle}
        </p>
        {(ctaText && ctaHref) && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={ctaHref}>
              <Button size="lg" className="bg-[#E63946] hover:bg-[#D62828] gap-2">
                {ctaText}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            {secondaryCtaText && secondaryCtaHref && (
              <Link href={secondaryCtaHref}>
                <Button size="lg" variant="outline" className="border-[#3A3A3A] hover:bg-[#2A2A2A]">
                  {secondaryCtaText}
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
