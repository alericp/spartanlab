'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MarketingHeader } from '@/components/marketing/MarketingHeader'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'
import { ArrowRight, Target, TrendingUp, Brain, Gauge, Cpu, Activity } from 'lucide-react'
import { Card } from '@/components/ui/card'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0F1115] text-[#E6E9EF]">
      <MarketingHeader />

      {/* Hero Section */}
      <section className="pt-32 pb-16 sm:pt-40 sm:pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
            About SpartanLab
          </h1>
          <p className="text-xl sm:text-2xl text-[#A4ACB8] max-w-2xl mx-auto">
            A smarter way to train calisthenics.
          </p>
        </div>
      </section>

      {/* Why SpartanLab Exists */}
      <section className="pb-20 sm:pb-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6">Why SpartanLab Exists</h2>
          <div className="space-y-4 text-[#A4ACB8] text-lg leading-relaxed">
            <p>
              Many athletes train calisthenics using generic programs or random workout routines.
            </p>
            <p>
              Without a structured system, progress often becomes slow and inconsistent.
            </p>
            <p className="text-[#E6E9EF]">
              Athletes frequently struggle to determine:
            </p>
            <ul className="space-y-3 ml-4">
              <li className="flex items-start gap-3">
                <span className="text-[#C1121F] mt-1">•</span>
                <span>Which exercises to prioritize</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#C1121F] mt-1">•</span>
                <span>When to progress to harder skills</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#C1121F] mt-1">•</span>
                <span>How to adjust training when progress stalls</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* A Data-Driven Training System */}
      <section className="py-20 sm:py-28 bg-[#1A1F26] border-y border-[#2B313A]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6">A Data-Driven Training System</h2>
          <div className="space-y-4 text-[#A4ACB8] text-lg leading-relaxed">
            <p>
              SpartanLab analyzes training performance using multiple performance sensors.
            </p>
            <p>
              Strength levels, skill progressions, and training consistency are used to identify the most effective exercises and progressions for each athlete.
            </p>
            <p>
              Instead of guessing what to train next, athletes receive training recommendations based on real performance data.
            </p>
          </div>
        </div>
      </section>
      
      {/* Adaptive Training Intelligence */}
      <section className="py-20 sm:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-start gap-5 mb-8">
            <div className="w-14 h-14 rounded-xl bg-[#C1121F]/20 flex items-center justify-center flex-shrink-0">
              <Cpu className="w-7 h-7 text-[#C1121F]" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">Adaptive Training Intelligence</h2>
              <p className="text-[#A4ACB8]">The core of the SpartanLab platform</p>
            </div>
          </div>
          <div className="space-y-4 text-[#A4ACB8] text-lg leading-relaxed">
            <p>
              The SpartanLab Adaptive Training Engine continuously analyzes training data.
            </p>
            <p>
              As athletes log workouts and strength improvements, the system adjusts training recommendations automatically.
            </p>
            <p>
              This allows athletes to progress through calisthenics skills using a structured and efficient approach.
            </p>
          </div>
        </div>
      </section>

      {/* Training Philosophy */}
      <section className="py-20 sm:py-28 bg-[#1A1F26] border-y border-[#2B313A]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6">Train With Data, Not Guesswork</h2>
          <div className="space-y-4 text-[#A4ACB8] text-lg leading-relaxed mb-8">
            <p>
              Calisthenics progress depends on consistent strength development, skill progression, and recovery management.
            </p>
            <p className="text-[#E6E9EF]">
              SpartanLab helps athletes understand:
            </p>
          </div>
          
          <div className="grid gap-6 sm:grid-cols-3">
            <Card className="bg-[#0F1115] border-[#2B313A] p-6">
              <div className="w-12 h-12 rounded-xl bg-[#C1121F]/10 flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-[#C1121F]" />
              </div>
              <h3 className="font-semibold mb-2">Strength Unlocks Skills</h3>
              <p className="text-sm text-[#A4ACB8]">
                Which strength levels unlock new skills and progressions
              </p>
            </Card>
            
            <Card className="bg-[#0F1115] border-[#2B313A] p-6">
              <div className="w-12 h-12 rounded-xl bg-[#C1121F]/10 flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-[#C1121F]" />
              </div>
              <h3 className="font-semibold mb-2">Address Weak Points</h3>
              <p className="text-sm text-[#A4ACB8]">
                Which exercises address your specific weak points
              </p>
            </Card>
            
            <Card className="bg-[#0F1115] border-[#2B313A] p-6">
              <div className="w-12 h-12 rounded-xl bg-[#C1121F]/10 flex items-center justify-center mb-4">
                <Activity className="w-6 h-6 text-[#C1121F]" />
              </div>
              <h3 className="font-semibold mb-2">Long-Term Progress</h3>
              <p className="text-sm text-[#A4ACB8]">
                How to structure training for sustainable long-term progress
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Start Training Smarter
          </h2>
          <p className="text-[#A4ACB8] max-w-xl mx-auto mb-8">
            Generate your first calisthenics training program and begin tracking your progress with SpartanLab.
          </p>
          <Link href="/programs">
            <Button size="lg" className="bg-[#C1121F] hover:bg-[#A30F1A] px-10 h-12">
              Start Training
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <p className="text-sm text-[#6B7280] mt-8">
            Questions? Reach us at{' '}
            <a href="mailto:hello@spartanlab.app" className="text-[#A4ACB8] hover:text-[#E6E9EF] transition-colors">
              hello@spartanlab.app
            </a>
          </p>
        </div>
      </section>

      <MarketingFooter />
    </div>
  )
}
