import { Metadata } from 'next'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PullUpStrengthCalculator } from '@/components/tools/PullUpStrengthCalculator'
import { SpartanIcon } from '@/components/brand/SpartanLogo'
import { 
  ArrowLeft, 
  Dumbbell, 
  Target,
  TrendingUp,
  ArrowRight,
  CheckCircle2
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Pull-Up Strength Standards Calculator | SpartanLab',
  description: 'Find out how your pull-up strength compares to calisthenics standards. Calculate your strength level from beginner to elite and get personalized training recommendations.',
  keywords: ['pull-up strength standards', 'how many pull ups is good', 'average pull ups male', 'elite pull ups', 'pull up test', 'calisthenics strength'],
  openGraph: {
    title: 'Pull-Up Strength Standards Calculator | SpartanLab',
    description: 'Calculate your pull-up strength level and see how you compare to calisthenics athletes worldwide.',
    type: 'website',
  },
}

export default function PullUpStrengthCalculatorPage() {
  return (
    <div className="min-h-screen bg-[#0F1115]">
      {/* Header */}
      <header className="border-b border-[#2B313A] bg-[#0F1115]/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link 
            href="/tools" 
            className="flex items-center gap-2 text-[#A4ACB8] hover:text-[#E6E9EF] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">All Tools</span>
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <SpartanIcon className="w-6 h-6 text-[#C1121F]" />
            <span className="font-bold text-[#E6E9EF]">SpartanLab</span>
          </Link>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        {/* Page Title & Intro */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#C1121F]/10 flex items-center justify-center">
              <Dumbbell className="w-6 h-6 text-[#C1121F]" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#E6E9EF]">
                Pull-Up Strength Standards Calculator
              </h1>
              <p className="text-[#A4ACB8] text-sm">
                Measure your pulling strength against calisthenics standards
              </p>
            </div>
          </div>
          
          <p className="text-[#A4ACB8] leading-relaxed max-w-2xl">
            How many pull-ups is good? Find out where you stand among calisthenics athletes. 
            This calculator evaluates your pull-up strength, classifies your level from beginner to elite, 
            and provides training guidance to help you reach your next milestone.
          </p>
        </div>
        
        {/* Calculator Component */}
        <Card className="bg-[#1A1F26] border-[#2B313A] p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6 text-[#E6E9EF] flex items-center gap-2">
            <Target className="w-5 h-5 text-[#C1121F]" />
            Enter Your Pull-Up Stats
          </h2>
          <PullUpStrengthCalculator showCTA={true} />
        </Card>
        
        {/* Strength Standards Reference */}
        <Card className="bg-[#1A1F26] border-[#2B313A] p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6 text-[#E6E9EF] flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#C1121F]" />
            Pull-Up Strength Standards
          </h2>
          
          <p className="text-[#A4ACB8] text-sm mb-6">
            These standards are based on strict pull-up form (dead hang, chin over bar, no kipping).
          </p>
          
          <div className="space-y-3">
            {[
              { level: 'Beginner', range: '0-3 reps', description: 'Building foundational pulling strength', color: 'slate' },
              { level: 'Intermediate', range: '4-9 reps', description: 'Solid baseline, ready for progressive overload', color: 'blue' },
              { level: 'Advanced', range: '10-17 reps', description: 'Strong puller, can train weighted variations', color: 'emerald' },
              { level: 'Elite', range: '18-25 reps', description: 'Exceptional pulling endurance and strength', color: 'amber' },
              { level: 'Master', range: '25+ reps', description: 'Top-tier calisthenics athlete', color: 'purple' },
            ].map((standard) => (
              <div 
                key={standard.level}
                className={`flex items-center justify-between p-4 rounded-lg bg-${standard.color}-500/5 border border-${standard.color}-500/20`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full bg-${standard.color}-400`} />
                  <div>
                    <span className="font-semibold text-[#E6E9EF]">{standard.level}</span>
                    <span className="text-[#6B7280] mx-2">-</span>
                    <span className="text-[#A4ACB8]">{standard.range}</span>
                  </div>
                </div>
                <span className="text-xs text-[#6B7280] hidden sm:block">{standard.description}</span>
              </div>
            ))}
          </div>
        </Card>
        
        {/* Training Tips */}
        <Card className="bg-[#1A1F26] border-[#2B313A] p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6 text-[#E6E9EF]">
            How to Improve Your Pull-Up Strength
          </h2>
          
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { tip: 'Train pull-ups 3-4x per week', detail: 'Frequency builds neural adaptation' },
              { tip: 'Add weighted pull-ups', detail: 'Progressive overload for strength gains' },
              { tip: 'Include high-rep sets', detail: 'Build muscular endurance' },
              { tip: 'Practice dead hangs', detail: 'Improve grip strength and shoulder health' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-lg bg-[#0F1115]">
                <CheckCircle2 className="w-5 h-5 text-[#C1121F] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-[#E6E9EF] text-sm">{item.tip}</p>
                  <p className="text-xs text-[#6B7280]">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
        
        {/* Related Tools */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 text-[#E6E9EF]">Related Tools</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Link href="/tools/weighted-pullup-calculator">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Dumbbell className="w-5 h-5 text-[#C1121F]" />
                    <span className="font-medium text-[#E6E9EF]">Weighted Pull-Up Calculator</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#6B7280]" />
                </div>
              </Card>
            </Link>
            <Link href="/tools/front-lever-calculator">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Target className="w-5 h-5 text-[#C1121F]" />
                    <span className="font-medium text-[#E6E9EF]">Front Lever Calculator</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#6B7280]" />
                </div>
              </Card>
            </Link>
          </div>
        </div>
        
        {/* Final CTA */}
        <Card className="bg-gradient-to-br from-[#1A1F26] to-[#0F1115] border-[#C1121F]/30 p-8 text-center">
          <h2 className="text-2xl font-bold text-[#E6E9EF] mb-3">
            Ready to Build Elite Pulling Strength?
          </h2>
          <p className="text-[#A4ACB8] mb-6 max-w-lg mx-auto">
            SpartanLab creates adaptive calisthenics training programs based on your current strength level. 
            Get workouts that evolve as you progress.
          </p>
          <Button asChild className="bg-[#C1121F] hover:bg-[#A30F1A] text-white px-8 py-3 font-semibold">
            <Link href="/sign-up">
              Start Training Free
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </Card>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-[#2B313A] py-8 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <SpartanIcon className="w-5 h-5 text-[#C1121F]" />
            <span className="font-bold text-[#E6E9EF]">SpartanLab</span>
          </Link>
          <p className="text-[#6B7280] text-sm">
            The adaptive calisthenics training platform
          </p>
        </div>
      </footer>
    </div>
  )
}
