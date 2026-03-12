import { Metadata } from 'next'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FrontLeverCalculator } from '@/components/tools/FrontLeverCalculator'
import { SpartanIcon } from '@/components/brand/SpartanLogo'
import { 
  ArrowLeft, 
  Target, 
  Dumbbell, 
  Activity,
  BookOpen,
  LayoutDashboard,
  ArrowRight
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Front Lever Progress Calculator | SpartanLab',
  description: 'Calculate your front lever readiness score based on pull-ups, weighted strength, and hold times. Find out how close you are to achieving the front lever and what to train next.',
  keywords: ['front lever calculator', 'front lever progression', 'front lever requirements', 'calisthenics', 'front lever readiness', 'how strong for front lever'],
  openGraph: {
    title: 'Front Lever Progress Calculator | SpartanLab',
    description: 'Calculate your front lever readiness and find out exactly what to train next.',
    type: 'website',
  },
}

export default function FrontLeverCalculatorPage() {
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
              <Target className="w-6 h-6 text-[#C1121F]" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#E6E9EF]">
                Front Lever Progress Calculator
              </h1>
              <p className="text-[#A4ACB8] text-sm">
                Calculate your readiness for the front lever
              </p>
            </div>
          </div>
          
          <p className="text-[#A4ACB8] leading-relaxed max-w-2xl">
            Estimate your readiness for the Front Lever using strength indicators used by advanced calisthenics athletes. 
            This calculator evaluates pulling strength, core strength, and skill progression ability to determine how close you are to achieving the Front Lever.
          </p>
        </div>
        
        {/* Calculator Component */}
        <Card className="bg-[#1A1F26] border-[#2B313A] p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6 text-[#E6E9EF] flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-[#C1121F]" />
            Enter Your Strength Metrics
          </h2>
          <FrontLeverCalculator showCTA={true} />
        </Card>
        
        {/* SEO Content Sections */}
        <div className="space-y-8 mb-12">
          <section>
            <h2 className="text-xl font-semibold text-[#E6E9EF] mb-4">
              What Strength Do You Need for Front Lever?
            </h2>
            <p className="text-[#A4ACB8] leading-relaxed mb-4">
              The front lever is one of the most impressive static holds in calisthenics, requiring exceptional pulling strength, 
              core stability, and body tension. Most athletes need approximately 15-20 strict pull-ups or a +40% bodyweight weighted pull-up 
              before attempting full front lever training.
            </p>
            <p className="text-[#A4ACB8] leading-relaxed">
              This calculator uses a weighted scoring model to evaluate your pulling endurance, weighted strength, core anti-extension ability, 
              lever progression holds, and horizontal pulling capacity. Each component contributes to your overall readiness score.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-[#E6E9EF] mb-4">
              How the Readiness Score Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#1A1F26] rounded-lg p-4 border border-[#2B313A]">
                <div className="text-[#6B7280] text-sm font-medium mb-1">0-40%</div>
                <div className="font-semibold text-[#E6E9EF] mb-1">Early Strength Stage</div>
                <p className="text-[#A4ACB8] text-sm">Build foundational pulling strength through pull-ups, rows, and core work.</p>
              </div>
              <div className="bg-[#1A1F26] rounded-lg p-4 border border-[#2B313A]">
                <div className="text-[#4F6D8A] text-sm font-medium mb-1">40-65%</div>
                <div className="font-semibold text-[#E6E9EF] mb-1">Intermediate Progress</div>
                <p className="text-[#A4ACB8] text-sm">Foundation built. Focus on weighted pull-ups and lever progressions.</p>
              </div>
              <div className="bg-[#1A1F26] rounded-lg p-4 border border-[#2B313A]">
                <div className="text-[#C1121F] text-sm font-medium mb-1">65-85%</div>
                <div className="font-semibold text-[#E6E9EF] mb-1">Advanced Preparation</div>
                <p className="text-[#A4ACB8] text-sm">Pulling strength is sufficient. Work on compression and lever holds.</p>
              </div>
              <div className="bg-[#1A1F26] rounded-lg p-4 border border-[#2B313A]">
                <div className="text-[#22C55E] text-sm font-medium mb-1">85-100%</div>
                <div className="font-semibold text-[#E6E9EF] mb-1">Front Lever Ready</div>
                <p className="text-[#A4ACB8] text-sm">You have the prerequisites. Focus on skill practice and progressive overload.</p>
              </div>
            </div>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-[#E6E9EF] mb-4">
              Key Prerequisites for Front Lever
            </h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3 text-[#A4ACB8]">
                <div className="w-1.5 h-1.5 rounded-full bg-[#C1121F] mt-2 flex-shrink-0" />
                <p><span className="text-[#E6E9EF] font-medium">Pulling Endurance:</span> 15-20+ strict pull-ups demonstrate the muscular endurance needed for sustained lever holds.</p>
              </div>
              <div className="flex items-start gap-3 text-[#A4ACB8]">
                <div className="w-1.5 h-1.5 rounded-full bg-[#C1121F] mt-2 flex-shrink-0" />
                <p><span className="text-[#E6E9EF] font-medium">Weighted Strength:</span> +40-50% bodyweight on weighted pull-ups indicates sufficient lat and bicep strength.</p>
              </div>
              <div className="flex items-start gap-3 text-[#A4ACB8]">
                <div className="w-1.5 h-1.5 rounded-full bg-[#C1121F] mt-2 flex-shrink-0" />
                <p><span className="text-[#E6E9EF] font-medium">Core Anti-Extension:</span> 15+ hanging leg raises show the core stability needed to maintain the lever position.</p>
              </div>
              <div className="flex items-start gap-3 text-[#A4ACB8]">
                <div className="w-1.5 h-1.5 rounded-full bg-[#C1121F] mt-2 flex-shrink-0" />
                <p><span className="text-[#E6E9EF] font-medium">Lever Skill:</span> 10-15s advanced tuck holds before progressing to one-leg or straddle variations.</p>
              </div>
            </div>
          </section>
        </div>
        
        {/* Internal Links */}
        <section className="mb-12">
          <h2 className="text-lg font-semibold text-[#E6E9EF] mb-4">Related Resources</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link 
              href="/guides/front-lever-training"
              className="bg-[#1A1F26] border border-[#2B313A] rounded-lg p-4 hover:border-[#C1121F]/50 transition-colors group"
            >
              <BookOpen className="w-5 h-5 text-[#C1121F] mb-2" />
              <div className="font-medium text-[#E6E9EF] group-hover:text-[#C1121F] transition-colors">Front Lever Guide</div>
              <p className="text-[#6B7280] text-sm">Complete training guide</p>
            </Link>
            
            <Link 
              href="/tools"
              className="bg-[#1A1F26] border border-[#2B313A] rounded-lg p-4 hover:border-[#C1121F]/50 transition-colors group"
            >
              <Activity className="w-5 h-5 text-[#C1121F] mb-2" />
              <div className="font-medium text-[#E6E9EF] group-hover:text-[#C1121F] transition-colors">Program Builder</div>
              <p className="text-[#6B7280] text-sm">Build your training plan</p>
            </Link>
            
            <Link 
              href="/training-dashboard"
              className="bg-[#1A1F26] border border-[#2B313A] rounded-lg p-4 hover:border-[#C1121F]/50 transition-colors group"
            >
              <LayoutDashboard className="w-5 h-5 text-[#C1121F] mb-2" />
              <div className="font-medium text-[#E6E9EF] group-hover:text-[#C1121F] transition-colors">Training Dashboard</div>
              <p className="text-[#6B7280] text-sm">Track your progress</p>
            </Link>
          </div>
        </section>
        
        {/* Final CTA */}
        <Card className="bg-gradient-to-br from-[#1A1F26] to-[#0F1115] border-[#C1121F]/30 p-8">
          <div className="text-center">
            <SpartanIcon className="w-12 h-12 text-[#C1121F] mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-[#E6E9EF] mb-3">
              Ready to Train for Your First Front Lever?
            </h2>
            <p className="text-[#A4ACB8] mb-6 max-w-lg mx-auto">
              SpartanLab&apos;s Adaptive Training Engine builds personalized programs based on your current strength level, 
              available equipment, and training schedule.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild className="bg-[#C1121F] hover:bg-[#A30F1A] text-white px-6">
                <Link href="/onboarding">
                  Generate My Training Program
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="border-[#2B313A] text-[#E6E9EF] hover:bg-[#1A1F26]">
                <Link href="/skills">
                  Track My Skills
                </Link>
              </Button>
            </div>
          </div>
        </Card>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-[#2B313A] mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[#6B7280]">
            <Link href="/" className="flex items-center gap-2 hover:text-[#E6E9EF] transition-colors">
              <SpartanIcon className="w-5 h-5 text-[#C1121F]" />
              <span>SpartanLab</span>
            </Link>
            <div className="flex gap-6">
              <Link href="/tools" className="hover:text-[#E6E9EF] transition-colors">Tools</Link>
              <Link href="/guides" className="hover:text-[#E6E9EF] transition-colors">Guides</Link>
              <Link href="/training-dashboard" className="hover:text-[#E6E9EF] transition-colors">Dashboard</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
