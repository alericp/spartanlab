'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MarketingHeader } from '@/components/marketing/MarketingHeader'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'
import { Check, ArrowRight } from 'lucide-react'

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    description: 'Access training tools and guides',
    cta: 'Start Free',
    ctaVariant: 'outline' as const,
    ctaLink: '/sign-up',
    featured: false,
    features: [
      'Access to SpartanLab training tools',
      'Front Lever Calculator',
      'Planche Strength Calculator',
      'Muscle-Up Readiness Test',
      'Calisthenics strength guides',
      'Basic progress tracking'
    ]
  },
  {
    name: 'Pro',
    price: '$15',
    period: '/month',
    description: 'Full Adaptive Training Engine access',
    cta: 'Upgrade to Pro',
    ctaVariant: 'default' as const,
    ctaLink: '/sign-up',
    featured: true,
    features: [
      'Adaptive Training Engine',
      'Personalized calisthenics programs',
      'Workout tracking database',
      'Progress analytics and strength trends',
      'Fatigue detection and training adjustments',
      'Skill progression tracking'
    ]
  }
]

const FAQ = [
  {
    question: 'Can I try the platform before subscribing?',
    answer: 'Yes. The free tier gives you access to training tools, calculators, and guides. You can explore the platform before upgrading to Pro for full access.'
  },
  {
    question: 'What payment methods will you accept?',
    answer: 'We will support all major credit cards and debit cards through Stripe when payments are enabled.'
  },
  {
    question: 'Can I switch plans later?',
    answer: 'Absolutely. You can upgrade or downgrade your plan at any time. Changes take effect at your next billing cycle.'
  },
  {
    question: 'Is there a yearly discount?',
    answer: 'Yearly billing with a discount will be available at launch. Subscribe to updates to be notified.'
  },
  {
    question: 'What happens to my data if I downgrade?',
    answer: 'Your training data is always preserved. Downgrading only limits access to certain features, not your history.'
  },
  {
    question: 'How do I contact billing support?',
    answer: 'For billing questions, refunds, or invoice requests, email billing@spartanlab.app.'
  }
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#121212] text-[#F5F5F5]">
      <MarketingHeader />

      {/* Hero Section */}
      <section className="pt-32 pb-16 sm:pt-40 sm:pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6 text-balance">
            SpartanLab Pricing
          </h1>
          <p className="text-lg sm:text-xl text-[#A5A5A5] max-w-2xl mx-auto">
            Train smarter with data-driven calisthenics programming and performance tracking.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20 sm:pb-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-8">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`bg-[#1A1A1A] rounded-xl p-6 sm:p-8 relative ${
                  plan.featured
                    ? 'border-2 border-[#E63946] md:-mt-4 md:mb-4'
                    : 'border border-[#2A2A2A]'
                }`}
              >
                {plan.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-[#E63946] text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-1">{plan.name}</h3>
                  <p className="text-sm text-[#A5A5A5]">{plan.description}</p>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-[#A5A5A5]">{plan.period}</span>
                  </div>
                </div>

                <Link href={plan.ctaLink} className="block mb-8">
                  <Button
                    variant={plan.featured ? 'default' : 'outline'}
                    className={`w-full h-12 ${
                      plan.featured
                        ? 'bg-[#E63946] hover:bg-[#D62828]'
                        : 'border-[#3A3A3A] hover:bg-[#2A2A2A]'
                    }`}
                  >
                    {plan.cta}
                    {plan.featured && <ArrowRight className="w-4 h-4 ml-2" />}
                  </Button>
                </Link>

                <div className="space-y-4">
                  <p className="text-xs font-medium text-[#A5A5A5] uppercase tracking-wider">
                    What is included
                  </p>
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className={`w-4 h-4 mt-0.5 shrink-0 ${
                          plan.featured ? 'text-[#E63946]' : 'text-[#A5A5A5]'
                        }`} />
                        <span className="text-sm text-[#F5F5F5]">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-[#A5A5A5] mt-8">
            All plans include mobile access. Pricing is subject to change before launch.
          </p>
          <p className="text-center text-xs text-[#6B7280] mt-3">
            Subscriptions renew automatically until canceled. Cancel anytime. See our{' '}
            <Link href="/terms" className="text-[#A5A5A5] hover:text-[#F5F5F5] transition-colors underline underline-offset-2">Terms of Service</Link>
            {' '}and{' '}
            <Link href="/privacy" className="text-[#A5A5A5] hover:text-[#F5F5F5] transition-colors underline underline-offset-2">Privacy Policy</Link>
            . Billing questions?{' '}
            <a href="mailto:billing@spartanlab.app" className="text-[#A5A5A5] hover:text-[#F5F5F5] transition-colors underline underline-offset-2">billing@spartanlab.app</a>
          </p>
        </div>
      </section>

      {/* Why Upgrade Section */}
      <section className="py-20 sm:py-28 bg-[#1A1A1A] border-y border-[#2A2A2A]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6">
            Why Upgrade to SpartanLab Pro?
          </h2>
          <p className="text-[#A5A5A5] text-center max-w-2xl mx-auto mb-12">
            Most athletes rely on generic workout programs. SpartanLab Pro analyzes your strength levels, training schedule, and progress data to generate a program tailored to your current ability.
          </p>
          
          <div className="grid sm:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-[#E63946]/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-[#E63946]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Personalized Programming</h3>
              <p className="text-sm text-[#A5A5A5]">Programs built specifically for your strength level and goals</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-[#E63946]/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-[#E63946]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Adaptive Adjustments</h3>
              <p className="text-sm text-[#A5A5A5]">Workouts automatically adjust as your strength improves</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-[#E63946]/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-[#E63946]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Data-Driven Decisions</h3>
              <p className="text-sm text-[#A5A5A5]">Train smarter instead of guessing what to do next</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Built for Athletes */}
      <section className="py-20 sm:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6">
            Built for Calisthenics Athletes
          </h2>
          <p className="text-[#A5A5A5] max-w-2xl mx-auto mb-4">
            SpartanLab was designed to help athletes develop real strength and progress toward advanced calisthenics skills.
          </p>
          <p className="text-[#A5A5A5] max-w-2xl mx-auto">
            Instead of following generic programs, athletes receive training recommendations based on real performance data.
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 sm:py-28 bg-[#1A1A1A] border-y border-[#2A2A2A]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>

          <div className="space-y-8">
            {FAQ.map((item) => (
              <div key={item.question}>
                <h3 className="text-lg font-semibold mb-2">{item.question}</h3>
                <p className="text-[#A5A5A5]">
                  {item.answer.includes('billing@spartanlab.app') ? (
                    <>
                      {'For billing questions, refunds, or invoice requests, email '}
                      <a
                        href="mailto:billing@spartanlab.app"
                        className="text-[#F5F5F5] hover:text-white transition-colors underline underline-offset-2"
                      >
                        billing@spartanlab.app
                      </a>
                      .
                    </>
                  ) : (
                    item.answer
                  )}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Start Training Smarter
          </h2>
          <p className="text-[#A5A5A5] max-w-xl mx-auto mb-8">
            Generate your first training program and begin tracking your progress today.
          </p>
          <Link href="/dashboard">
            <Button size="lg" className="bg-[#E63946] hover:bg-[#D62828] px-10 h-12">
              Start Free
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  )
}
