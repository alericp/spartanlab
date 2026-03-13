import { Metadata } from 'next'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlancheStrengthCalculator } from '@/components/tools/PlancheStrengthCalculator'
import { SpartanIcon } from '@/components/brand/SpartanLogo'
import { 
  ArrowLeft, 
  Target, 
  Dumbbell, 
  BookOpen,
  ArrowRight
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Planche Strength Calculator | SpartanLab',
  description: 'Calculate your planche readiness score based on pushing strength, lean angle tolerance, and core compression. Find out which planche progression you should train.',
  keywords: ['planche calculator', 'planche readiness', 'planche requirements', 'planche strength test', 'calisthenics planche', 'tuck planche requirements'],
  openGraph: {
    title: 'Planche Strength Calculator | SpartanLab',
    description: 'Calculate your planche readiness and get your recommended progression level.',
    type: 'website',
  },
}

export default function PlancheStrengthCalculatorPage() {
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
                Planche Strength Calculator
              </h1>
              <p className="text-[#A4ACB8] text-sm">
                Estimate your planche readiness level
              </p>
            </div>
          </div>
          
          <p className="text-[#A4ACB8] leading-relaxed max-w-2xl">
            The planche is among the most demanding static holds in calisthenics. This calculator evaluates 
            your horizontal pushing strength, lean angle tolerance, and core compression to determine which 
            planche progression you are ready for - from tuck planche to full planche.
          </p>
        </div>
        
        {/* Calculator Component */}
        <Card className="bg-[#1A1F26] border-[#2B313A] p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6 text-[#E6E9EF] flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-[#C1121F]" />
            Enter Your Strength Metrics
          </h2>
          <PlancheStrengthCalculator showCTA={true} />
        </Card>
        
        {/* SEO Content Sections */}
        <div className="space-y-8 mb-12">
          <section>
            <h2 className="text-xl font-semibold text-[#E6E9EF] mb-4">
              What Strength Do You Need for Planche?
            </h2>
            <p className="text-[#A4ACB8] leading-relaxed mb-4">
              The planche requires exceptional pushing strength that most athletes underestimate. For a solid 
              tuck planche, you typically need a +25-35% bodyweight weighted dip. Advanced tuck requires +40-50% BW. 
              Straddle planche demands +55-65% BW, and full planche requires +75-90% BW weighted dip strength.
            </p>
            <p className="text-[#A4ACB8] leading-relaxed">
              Beyond raw strength, the planche requires significant shoulder protraction endurance, wrist 
              conditioning, and core compression strength. This calculator evaluates all these factors.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-[#E6E9EF] mb-4">
              How the Planche Score Works
            </h2>
            <ul className="space-y-3 text-[#A4ACB8]">
              <li className="flex items-start gap-2">
                <span className="text-[#C1121F] mt-1">1.</span>
                <span><strong className="text-[#E6E9EF]">Horizontal Pushing Strength (40%)</strong> - Your weighted dip and dip volume indicate pressing capacity</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#C1121F] mt-1">2.</span>
                <span><strong className="text-[#E6E9EF]">Lean Angle Tolerance (35%)</strong> - Your planche lean hold duration shows forward lean capacity</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#C1121F] mt-1">3.</span>
                <span><strong className="text-[#E6E9EF]">Core Compression Strength (25%)</strong> - Your pseudo planche push-up performance indicates compression ability</span>
              </li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-[#E6E9EF] mb-4">
              Planche Progression Path
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="bg-[#0F1115] border-[#2B313A] p-4">
                <h3 className="font-medium text-[#E6E9EF] mb-2">Tuck Planche</h3>
                <p className="text-sm text-[#A4ACB8]">Knees tucked, hips level with shoulders. Target: 8-15 second holds with full protraction.</p>
              </Card>
              <Card className="bg-[#0F1115] border-[#2B313A] p-4">
                <h3 className="font-medium text-[#E6E9EF] mb-2">Advanced Tuck Planche</h3>
                <p className="text-sm text-[#A4ACB8]">Hips extended backward, back flat. Target: 6-12 seconds with proper form.</p>
              </Card>
              <Card className="bg-[#0F1115] border-[#2B313A] p-4">
                <h3 className="font-medium text-[#E6E9EF] mb-2">Straddle Planche</h3>
                <p className="text-sm text-[#A4ACB8]">Legs spread wide, body horizontal. Target: 5-10 seconds is advanced level.</p>
              </Card>
              <Card className="bg-[#0F1115] border-[#2B313A] p-4">
                <h3 className="font-medium text-[#E6E9EF] mb-2">Full Planche</h3>
                <p className="text-sm text-[#A4ACB8]">Legs together, body horizontal. Target: 3-8 seconds is elite-level achievement.</p>
              </Card>
            </div>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-[#E6E9EF] mb-4">
              Key Exercises for Planche Development
            </h2>
            <ul className="space-y-2 text-[#A4ACB8]">
              <li className="flex items-start gap-2">
                <Dumbbell className="w-4 h-4 text-[#C1121F] mt-1 shrink-0" />
                <span><strong className="text-[#E6E9EF]">Planche Leans</strong> - Build forward lean tolerance progressively</span>
              </li>
              <li className="flex items-start gap-2">
                <Dumbbell className="w-4 h-4 text-[#C1121F] mt-1 shrink-0" />
                <span><strong className="text-[#E6E9EF]">Pseudo Planche Push-Ups</strong> - Develop pushing strength at lean angle</span>
              </li>
              <li className="flex items-start gap-2">
                <Dumbbell className="w-4 h-4 text-[#C1121F] mt-1 shrink-0" />
                <span><strong className="text-[#E6E9EF]">Weighted Dips</strong> - Build foundational pushing power</span>
              </li>
              <li className="flex items-start gap-2">
                <Dumbbell className="w-4 h-4 text-[#C1121F] mt-1 shrink-0" />
                <span><strong className="text-[#E6E9EF]">Tuck Planche Push-Ups</strong> - Dynamic strength in planche position</span>
              </li>
            </ul>
          </section>
        </div>
        
        {/* Related Links */}
        <div className="border-t border-[#2B313A] pt-8">
          <h3 className="font-semibold text-[#E6E9EF] mb-4">Related Resources</h3>
          <div className="flex flex-wrap gap-3">
            <Link href="/guides/planche-progression">
              <Button variant="outline" className="border-[#2B313A] hover:bg-[#2B313A]">
                <BookOpen className="w-4 h-4 mr-2" />
                Planche Guide
              </Button>
            </Link>
            <Link href="/tools/weighted-dip-calculator">
              <Button variant="outline" className="border-[#2B313A] hover:bg-[#2B313A]">
                <Dumbbell className="w-4 h-4 mr-2" />
                Weighted Dip Calculator
              </Button>
            </Link>
            <Link href="/guides/calisthenics-strength-standards">
              <Button variant="outline" className="border-[#2B313A] hover:bg-[#2B313A]">
                <Target className="w-4 h-4 mr-2" />
                Strength Standards
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
