import { Metadata } from 'next'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FrontLeverStrengthTest } from '@/components/tools/FrontLeverStrengthTest'
import { SpartanIcon } from '@/components/brand/SpartanLogo'
import { 
  ArrowLeft, 
  Target, 
  Dumbbell, 
  BookOpen,
  ArrowRight
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Front Lever Strength Test | SpartanLab',
  description: 'Test your front lever readiness with this interactive strength assessment. Evaluate your pull-up strength, weighted performance, and hold times to see how close you are to achieving the front lever.',
  keywords: ['front lever strength test', 'front lever readiness', 'front lever requirements', 'calisthenics strength test', 'can i do front lever'],
  openGraph: {
    title: 'Front Lever Strength Test | SpartanLab',
    description: 'Calculate your front lever readiness score and get personalized training recommendations.',
    type: 'website',
  },
}

export default function FrontLeverStrengthTestPage() {
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
                Front Lever Strength Test
              </h1>
              <p className="text-[#A4ACB8] text-sm">
                Estimate your front lever readiness
              </p>
            </div>
          </div>
          
          <p className="text-[#A4ACB8] leading-relaxed max-w-2xl">
            This interactive test evaluates your pulling strength, core stability, and leverage factors 
            to estimate how close you are to achieving the front lever. Get a readiness score from 0-100 
            and personalized recommendations for what to train next.
          </p>
        </div>
        
        {/* Calculator Component */}
        <Card className="bg-[#1A1F26] border-[#2B313A] p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6 text-[#E6E9EF] flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-[#C1121F]" />
            Enter Your Strength Metrics
          </h2>
          <FrontLeverStrengthTest showCTA={true} />
        </Card>
        
        {/* SEO Content Sections */}
        <div className="space-y-8 mb-12">
          <section>
            <h2 className="text-xl font-semibold text-[#E6E9EF] mb-4">
              What Strength Do You Need for Front Lever?
            </h2>
            <p className="text-[#A4ACB8] leading-relaxed mb-4">
              The front lever is one of the most impressive static holds in calisthenics. To achieve a solid 
              front lever, most athletes need approximately 15-20 strict pull-ups AND a +40-50% bodyweight 
              weighted pull-up. The front lever requires exceptional pulling strength, scapular depression 
              control, and core anti-extension stability.
            </p>
            <p className="text-[#A4ACB8] leading-relaxed">
              This test uses a weighted scoring model that evaluates your pulling endurance, weighted strength, 
              and current lever hold capacity to give you an accurate readiness assessment.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-[#E6E9EF] mb-4">
              How the Front Lever Score Works
            </h2>
            <ul className="space-y-3 text-[#A4ACB8]">
              <li className="flex items-start gap-2">
                <span className="text-[#C1121F] mt-1">1.</span>
                <span><strong className="text-[#E6E9EF]">Pull Strength (40%)</strong> - Your max pull-ups and weighted pull-up performance indicate raw pulling capacity</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#C1121F] mt-1">2.</span>
                <span><strong className="text-[#E6E9EF]">Core Strength (30%)</strong> - Estimated from pulling metrics, reflects anti-extension stability</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#C1121F] mt-1">3.</span>
                <span><strong className="text-[#E6E9EF]">Leverage Factor (30%)</strong> - Your current front lever hold time shows skill-specific readiness</span>
              </li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-[#E6E9EF] mb-4">
              Front Lever Progression Path
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="bg-[#0F1115] border-[#2B313A] p-4">
                <h3 className="font-medium text-[#E6E9EF] mb-2">Tuck Front Lever</h3>
                <p className="text-sm text-[#A4ACB8]">Knees tucked tight to chest, body horizontal. Target: 10-20 second holds.</p>
              </Card>
              <Card className="bg-[#0F1115] border-[#2B313A] p-4">
                <h3 className="font-medium text-[#E6E9EF] mb-2">Advanced Tuck</h3>
                <p className="text-sm text-[#A4ACB8]">Hips extended backward, thighs below horizontal. Target: 8-15 seconds.</p>
              </Card>
              <Card className="bg-[#0F1115] border-[#2B313A] p-4">
                <h3 className="font-medium text-[#E6E9EF] mb-2">Straddle Front Lever</h3>
                <p className="text-sm text-[#A4ACB8]">Both legs extended, spread wide for leverage. Target: 5-10 seconds.</p>
              </Card>
              <Card className="bg-[#0F1115] border-[#2B313A] p-4">
                <h3 className="font-medium text-[#E6E9EF] mb-2">Full Front Lever</h3>
                <p className="text-sm text-[#A4ACB8]">Legs together, body fully horizontal. Target: 3-8 seconds.</p>
              </Card>
            </div>
          </section>
        </div>
        
        {/* Related Links */}
        <div className="border-t border-[#2B313A] pt-8">
          <h3 className="font-semibold text-[#E6E9EF] mb-4">Related Resources</h3>
          <div className="flex flex-wrap gap-3">
            <Link href="/guides/front-lever-training">
              <Button variant="outline" className="border-[#2B313A] hover:bg-[#2B313A]">
                <BookOpen className="w-4 h-4 mr-2" />
                Front Lever Guide
              </Button>
            </Link>
            <Link href="/tools/front-lever-calculator">
              <Button variant="outline" className="border-[#2B313A] hover:bg-[#2B313A]">
                <Target className="w-4 h-4 mr-2" />
                Front Lever Calculator
              </Button>
            </Link>
            <Link href="/guides/calisthenics-strength-standards">
              <Button variant="outline" className="border-[#2B313A] hover:bg-[#2B313A]">
                <Dumbbell className="w-4 h-4 mr-2" />
                Strength Standards
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
