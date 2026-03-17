import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, ArrowLeft, Target, Dumbbell, Trophy, Zap, GraduationCap, BookOpen, Brain, Sparkles, Flame, Shield } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SITE_CONFIG } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Calisthenics Training Guides | Skill Progressions & Programming | SpartanLab',
  description: 'Expert calisthenics guides for front lever, planche, muscle-up, handstand, and weighted calisthenics. Complete progressions, strength requirements, and programming principles.',
  keywords: ['calisthenics training guides', 'front lever guide', 'planche progression', 'muscle-up training', 'weighted pull-up training', 'calisthenics programming', 'skill progression'],
  alternates: {
    canonical: `${SITE_CONFIG.url}/guides`,
  },
  openGraph: {
    title: 'Calisthenics Training Guides | SpartanLab',
    description: 'Expert calisthenics guides for front lever, planche, muscle-up, handstand, and weighted calisthenics training.',
    url: `${SITE_CONFIG.url}/guides`,
    siteName: SITE_CONFIG.name,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Calisthenics Training Guides | SpartanLab',
    description: 'Expert calisthenics guides for front lever, planche, muscle-up, and weighted calisthenics training.',
  },
}

// Only include guides that have real corresponding pages
// Pages verified: testing, front-lever-training, planche-progression, handstand-training, iron-cross-training,
// back-lever-training, weighted-pull-up-training, one-arm-pull-up-training, pull-up-endurance-training,
// weighted-dip-training, muscle-up-training, handstand-push-up-progression, six-pack-abs-training,
// skill-cycles-guide, training-phases-guide, pancake-flexibility, toe-touch-flexibility, front-splits-flexibility,
// side-splits-flexibility, flexibility-vs-mobility, splits-mobility, pancake-mobility, military-fitness-prep, marine-pft-prep

const GUIDES = [
  {
    slug: 'testing',
    title: 'How to Test Your Metrics',
    description: 'Learn how to properly test your strength, skill, and flexibility benchmarks for accurate training programs.',
    icon: GraduationCap,
    category: 'Testing',
    readTime: '10 min read',
    featured: true,
  },
  {
    slug: 'front-lever-training',
    title: 'Front Lever Training Guide',
    description: 'Complete training guide with progressions, exercises, muscle diagrams, and programming advice for the front lever.',
    icon: Target,
    category: 'Skill Progression',
    readTime: '15 min read',
    featured: true,
  },
  {
    slug: 'planche-progression',
    title: 'Planche Progression Guide',
    description: 'Complete planche training guide with progressions, exercises, muscle diagrams, and programming advice from lean to full planche.',
    icon: Target,
    category: 'Skill Progression',
    readTime: '12 min read',
    featured: true,
  },
  {
    slug: 'handstand-training',
    title: 'Handstand Training Guide',
    description: 'Master the freestanding handstand with proper balance practice, strength progressions, and intelligent training structure.',
    icon: Target,
    category: 'Skill Progression',
    readTime: '12 min read',
    featured: true,
  },
  {
    slug: 'iron-cross-training',
    title: 'Iron Cross Training Guide',
    description: 'Complete guide to iron cross training. Prerequisites, foundational progressions, tendon safety, and long-term programming.',
    icon: Target,
    category: 'Elite Skills',
    readTime: '15 min read',
    featured: true,
  },
  {
    slug: 'back-lever-training',
    title: 'Back Lever Training Guide',
    description: 'Complete guide to back lever development. German hang mobility, progression ladder, support exercises, and tendon safety.',
    icon: Target,
    category: 'Skill Progression',
    readTime: '12 min read',
    featured: true,
  },
  {
    slug: 'weighted-pull-up-training',
    title: 'Weighted Pull-Up Strength Guide',
    description: 'Complete guide to building pulling strength with weighted pull-ups. Includes strength levels, exercises, and programming.',
    icon: Dumbbell,
    category: 'Strength',
    readTime: '10 min read',
    featured: true,
  },
  {
    slug: 'one-arm-pull-up-training',
    title: 'One-Arm Pull-Up Training Guide',
    description: 'Complete guide to achieving the one-arm pull-up. Prerequisites, progressions, training structure, and common mistakes.',
    icon: Target,
    category: 'Elite Skills',
    readTime: '15 min read',
    featured: true,
  },
  {
    slug: 'pull-up-endurance-training',
    title: 'Pull-Up Endurance Training Guide',
    description: 'Maximize your pull-up reps with structured endurance protocols. Ladders, density work, and military test preparation.',
    icon: Zap,
    category: 'Endurance',
    readTime: '10 min read',
  },
  {
    slug: 'weighted-dip-training',
    title: 'Weighted Dip Training Guide',
    description: 'Complete guide to building pushing strength with weighted dips. Includes strength levels, exercises, and programming.',
    icon: Dumbbell,
    category: 'Strength',
    readTime: '10 min read',
    featured: true,
  },
  {
    slug: 'muscle-up-training',
    title: 'Muscle-Up Training Guide',
    description: 'Complete muscle-up training guide with progressions, exercises, strength benchmarks, and technique tips.',
    icon: Zap,
    category: 'Skill Progression',
    readTime: '12 min read',
    featured: true,
  },
  {
    slug: 'handstand-push-up-progression',
    title: 'Handstand Push-Up Progression Guide',
    description: 'Master the HSPU from pike push-ups to freestanding with progressions, exercises, and training advice.',
    icon: Target,
    category: 'Skill Progression',
    readTime: '12 min read',
    featured: true,
  },
  {
    slug: 'six-pack-abs-training',
    title: 'Six Pack Abs Training Guide',
    description: 'Build strong abs with calisthenics exercises and dragon flag progressions. Includes nutrition context.',
    icon: Target,
    category: 'Core Training',
    readTime: '10 min read',
    featured: true,
  },
  {
    slug: 'skill-cycles-guide',
    title: 'Calisthenics Skill Cycles',
    description: 'Learn how to structure skill-focused training cycles for planche, front lever, handstand, and muscle-up development.',
    icon: Brain,
    category: 'Programming',
    readTime: '10 min read',
    featured: true,
  },
  {
    slug: 'training-phases-guide',
    title: 'How to Structure Training Phases',
    description: 'Learn how to transition between skill, strength, and hypertrophy cycles for long-term progress.',
    icon: GraduationCap,
    category: 'Programming',
    readTime: '12 min read',
    featured: true,
  },
  // Flexibility & Mobility Guides (verified pages exist)
  {
    slug: 'pancake-flexibility',
    title: 'Pancake Flexibility Guide',
    description: 'Master the pancake stretch with SpartanLab\'s 15-second exposure method. Short holds, multiple angles, frequent training.',
    icon: Flame,
    category: 'Flexibility',
    readTime: '8 min read',
    featured: true,
  },
  {
    slug: 'toe-touch-flexibility',
    title: 'Toe Touch Flexibility Guide',
    description: 'Improve your forward fold with the SpartanLab approach. 15-second holds, low soreness, trainable daily.',
    icon: Flame,
    category: 'Flexibility',
    readTime: '7 min read',
  },
  {
    slug: 'front-splits-flexibility',
    title: 'Front Splits Flexibility Guide',
    description: 'Progress toward front splits using short exposure holds and frequent practice. The SpartanLab philosophy.',
    icon: Flame,
    category: 'Flexibility',
    readTime: '8 min read',
  },
  {
    slug: 'side-splits-flexibility',
    title: 'Side Splits Flexibility Guide',
    description: 'Develop middle split range with 15-second exposures and multiple movement angles.',
    icon: Flame,
    category: 'Flexibility',
    readTime: '8 min read',
  },
  {
    slug: 'flexibility-vs-mobility',
    title: 'Flexibility vs Mobility Explained',
    description: 'Understand the difference between flexibility and mobility training. When to use each approach.',
    icon: Flame,
    category: 'Flexibility',
    readTime: '6 min read',
    featured: true,
  },
  {
    slug: 'splits-mobility',
    title: 'Splits Mobility Training Guide',
    description: 'Build strength and control in deep split positions. Loaded stretching, RPE-based progression.',
    icon: Flame,
    category: 'Mobility',
    readTime: '9 min read',
  },
  {
    slug: 'pancake-mobility',
    title: 'Pancake Mobility Guide',
    description: 'Build active compression strength for V-sit and straddle skills. Loaded pancake work, active holds.',
    icon: Flame,
    category: 'Mobility',
    readTime: '8 min read',
  },
  // Military Fitness Prep Guides (verified pages exist)
  {
    slug: 'military-fitness-prep',
    title: 'Military Fitness Test Prep Guide',
    description: 'Complete guide to preparing for military fitness tests. Covers all branches, training principles, and test-specific strategies.',
    icon: Shield,
    category: 'Military Prep',
    readTime: '15 min read',
    featured: true,
  },
  {
    slug: 'marine-pft-prep',
    title: 'Marine Corps PFT Prep Guide',
    description: 'Comprehensive preparation for the Marine Corps Physical Fitness Test. Pull-ups, plank, and 3-mile run strategies.',
    icon: Shield,
    category: 'Military Prep',
    readTime: '12 min read',
  },
]

export default function GuidesPage() {
  const featuredGuides = GUIDES.filter(g => g.featured)

  return (
    <div className="min-h-screen bg-[#0F1115]">
      {/* Header */}
      <div className="px-4 py-16 sm:py-20 border-b border-[#2B313A]">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#C1121F]/10 border border-[#C1121F]/20 mb-6">
            <BookOpen className="w-4 h-4 text-[#C1121F]" />
            <span className="text-xs font-medium text-[#C1121F]">Training Knowledge</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-[#E6E9EF] mb-6">
            SpartanLab Training Guides
          </h1>
          <p className="text-lg text-[#A4ACB8] max-w-3xl mx-auto leading-relaxed">
            Learn the science of calisthenics training with step-by-step guides covering strength development, 
            skill progressions, and advanced techniques.
          </p>
        </div>
      </div>

      <div className="px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Introduction */}
          <div className="max-w-3xl mx-auto text-center mb-16">
            <p className="text-[#A4ACB8] leading-relaxed">
              These guides explain the principles behind calisthenics training and help athletes understand 
              how to develop strength, skill, and control. Each guide covers progressions, exercises, and 
              training concepts used by experienced calisthenics athletes.
            </p>
          </div>

          {/* Featured Guides */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <Sparkles className="w-5 h-5 text-[#C1121F]" />
              <h2 className="text-xl font-semibold text-[#E6E9EF]">Featured Guides</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredGuides.map((guide) => {
                const Icon = guide.icon
                return (
                  <Link key={guide.slug} href={`/guides/${guide.slug}`}>
                    <Card className="h-full bg-gradient-to-br from-[#1A1F26] to-[#0F1115] border-[#C1121F]/20 p-6 hover:border-[#C1121F]/50 transition-all group relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#C1121F]/10 to-transparent pointer-events-none" />
                      <div className="relative">
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-12 h-12 rounded-xl bg-[#C1121F]/10 flex items-center justify-center">
                            <Icon className="w-6 h-6 text-[#C1121F]" />
                          </div>
                          <span className="text-xs text-[#6B7280] bg-[#0F1115] px-2 py-1 rounded">{guide.readTime}</span>
                        </div>
                        <p className="text-xs text-[#C1121F] font-medium mb-2">{guide.category}</p>
                        <h3 className="text-lg font-semibold text-[#E6E9EF] mb-2 group-hover:text-[#C1121F] transition-colors">
                          {guide.title}
                        </h3>
                        <p className="text-sm text-[#A4ACB8] mb-4 line-clamp-2">
                          {guide.description}
                        </p>
                        <div className="flex items-center text-sm text-[#C1121F] font-medium">
                          Read guide
                          <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* All Guides */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <BookOpen className="w-5 h-5 text-[#A4ACB8]" />
              <h2 className="text-xl font-semibold text-[#E6E9EF]">All Training Guides</h2>
              <span className="text-sm text-[#6B7280]">({GUIDES.length} guides)</span>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {GUIDES.map((guide) => {
                const Icon = guide.icon
                return (
                  <Link key={guide.slug} href={`/guides/${guide.slug}`}>
                    <Card className="h-full bg-[#1A1F26] border-[#2B313A] p-5 hover:border-[#C1121F]/40 transition-colors group">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-[#0F1115] flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-[#C1121F]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-xs text-[#6B7280]">{guide.category}</p>
                            <span className="text-[#2B313A]">•</span>
                            <p className="text-xs text-[#6B7280]">{guide.readTime}</p>
                          </div>
                          <h3 className="text-sm font-semibold text-[#E6E9EF] mb-1 group-hover:text-[#C1121F] transition-colors line-clamp-1">
                            {guide.title}
                          </h3>
                          <p className="text-xs text-[#A4ACB8] line-clamp-2">
                            {guide.description}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* CTA Section */}
          <Card className="bg-gradient-to-br from-[#C1121F]/10 via-[#1A1F26] to-[#1A1F26] border-[#C1121F]/20 p-8 sm:p-12">
            <div className="max-w-2xl mx-auto text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#C1121F]/10 flex items-center justify-center mx-auto mb-6">
                <Brain className="w-7 h-7 text-[#C1121F]" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#E6E9EF] mb-4">
                Train Smarter with SpartanLab
              </h2>
              <p className="text-[#A4ACB8] mb-4 leading-relaxed">
                SpartanLab analyzes your training data and generates programs based on your strength level, 
                skill progressions, and recovery signals.
              </p>
              <p className="text-[#A4ACB8] mb-8 leading-relaxed">
                Instead of guessing what to train next, the Adaptive Training Engine builds a program 
                designed for your current ability.
              </p>
              <Button asChild size="lg" className="bg-[#C1121F] hover:bg-[#A30F1A]">
                <Link href="/programs">
                  Generate Training Program
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>
          </Card>

          {/* Strength Requirements */}
          <div className="mt-12 pt-8 border-t border-[#2B313A]">
            <h2 className="text-lg font-semibold text-[#E6E9EF] mb-4">Strength Requirements</h2>
            <div className="grid sm:grid-cols-4 gap-4 mb-8">
              <Link href="/front-lever-strength-requirements">
                <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-all h-full">
                  <h3 className="font-medium text-[#E6E9EF] text-sm mb-1">Front Lever</h3>
                  <p className="text-xs text-[#6B7280]">Pulling strength needed</p>
                </Card>
              </Link>
              <Link href="/planche-strength-requirements">
                <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-all h-full">
                  <h3 className="font-medium text-[#E6E9EF] text-sm mb-1">Planche</h3>
                  <p className="text-xs text-[#6B7280]">Pushing strength needed</p>
                </Card>
              </Link>
              <Link href="/muscle-up-strength-requirements">
                <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-all h-full">
                  <h3 className="font-medium text-[#E6E9EF] text-sm mb-1">Muscle-Up</h3>
                  <p className="text-xs text-[#6B7280]">Explosive strength needed</p>
                </Card>
              </Link>
              <Link href="/hspu-strength-requirements">
                <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-all h-full">
                  <h3 className="font-medium text-[#E6E9EF] text-sm mb-1">HSPU</h3>
                  <p className="text-xs text-[#6B7280]">Pressing strength needed</p>
                </Card>
              </Link>
            </div>
          </div>

          {/* Related Resources */}
          <div className="pt-8 border-t border-[#2B313A]">
            <h2 className="text-lg font-semibold text-[#E6E9EF] mb-4">Related Resources</h2>
            <div className="grid sm:grid-cols-4 gap-4 mb-8">
              <Link href="/calculators">
                <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-all h-full">
                  <h3 className="font-medium text-[#E6E9EF] text-sm mb-1">Readiness Calculators</h3>
                  <p className="text-xs text-[#6B7280]">Test your skill prerequisites</p>
                </Card>
              </Link>
              <Link href="/calisthenics-strength-standards">
                <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-all h-full">
                  <h3 className="font-medium text-[#E6E9EF] text-sm mb-1">Strength Standards</h3>
                  <p className="text-xs text-[#6B7280]">Benchmark your level</p>
                </Card>
              </Link>
              <Link href="/programs">
                <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-all h-full">
                  <h3 className="font-medium text-[#E6E9EF] text-sm mb-1">Training Programs</h3>
                  <p className="text-xs text-[#6B7280]">Structured skill programs</p>
                </Card>
              </Link>
              <Link href="/training">
                <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-all h-full">
                  <h3 className="font-medium text-[#E6E9EF] text-sm mb-1">Training Hub</h3>
                  <p className="text-xs text-[#6B7280]">Browse all training options</p>
                </Card>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
