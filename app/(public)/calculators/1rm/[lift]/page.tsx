import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SITE_CONFIG, generateBreadcrumbSchema } from '@/lib/seo'
import { getLiftConfigFromSlug, getAllLiftSlugs } from '@/lib/strength/one-rep-max'
import { JsonLd } from '@/components/seo/JsonLd'
import OneRepMaxCalculator from '@/components/calculators/OneRepMaxCalculator'

// Static generation for all lift pages
export async function generateStaticParams() {
  return getAllLiftSlugs().map((lift) => ({
    lift,
  }))
}

// Dynamic metadata per lift
export async function generateMetadata({ params }: { params: Promise<{ lift: string }> }): Promise<Metadata> {
  const { lift } = await params
  const config = getLiftConfigFromSlug(lift)

  if (!config) {
    return {
      title: '1RM Calculator | SpartanLab',
    }
  }

  return {
    title: `${config.seoTitle} | Free Tool | SpartanLab`,
    description: config.seoDescription,
    keywords: [
      `${config.name.toLowerCase()} 1rm calculator`,
      `${config.name.toLowerCase()} one rep max`,
      `${config.slug.replace(/-/g, ' ')} calculator`,
      'epley formula',
      '1rm calculator',
      'one rep max calculator',
    ],
    alternates: {
      canonical: `${SITE_CONFIG.url}/calculators/1rm/${config.slug}`,
    },
    openGraph: {
      title: `${config.seoTitle} | SpartanLab`,
      description: config.seoDescription,
      url: `${SITE_CONFIG.url}/calculators/1rm/${config.slug}`,
      siteName: SITE_CONFIG.name,
      type: 'website',
    },
  }
}

export default async function LiftCalculatorPage({ params }: { params: Promise<{ lift: string }> }) {
  const { lift } = await params
  const config = getLiftConfigFromSlug(lift)

  if (!config) {
    notFound()
  }

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Calculators', url: '/calculators' },
    { name: '1RM Calculator', url: '/calculators/1rm' },
    { name: config.seoTitle, url: `/calculators/1rm/${config.slug}` },
  ])

  return (
    <>
      <JsonLd data={breadcrumbSchema} />
      <OneRepMaxCalculator config={config} />
    </>
  )
}
