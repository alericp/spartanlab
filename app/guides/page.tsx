import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, ArrowLeft, Target, Dumbbell, Trophy, Zap, GraduationCap, BookOpen, Brain, Sparkles, Flame, Shield } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BackNav } from '@/components/navigation/BackNav'

export const metadata: Metadata = {
  title: 'Calisthenics Training Guides | SpartanLab',
  description: 'Explore 25+ SpartanLab calisthenics guides covering front lever, planche, muscle-up, HSPU progressions, strength requirements, and complete training programs from beginner to advanced.',
  keywords: ['calisthenics training guides', 'front lever guide', 'planche progression guide', 'muscle-up training guide', 'calisthenics strength standards', 'calisthenics program', 'HSPU progression', 'calisthenics strength requirements'],
  openGraph: {
    title: 'Calisthenics Training Guides | SpartanLab',
    description: 'Explore 25+ SpartanLab calisthenics guides covering front lever, planche, muscle-up, HSPU progressions, strength requirements, and complete training programs.',
  },
}

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
    slug: 'front-lever-progression',
    title: 'Front Lever Progression Guide',
    description: 'Master the front lever from tuck to full with clear benchmarks and prerequisite strength standards.',
    icon: Target,
    category: 'Skill Progression',
    readTime: '8 min read',
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
    slug: 'calisthenics-strength-standards',
    title: 'Calisthenics Strength Standards',
    description: 'Benchmark your pulling and pushing strength against calisthenics standards from beginner to elite.',
    icon: Trophy,
    category: 'Strength',
    readTime: '6 min read',
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
    slug: 'weighted-pull-up-standards',
    title: 'Weighted Pull-Up Standards',
    description: 'Learn the weighted pull-up benchmarks that correlate with advanced skill acquisition.',
    icon: Dumbbell,
    category: 'Strength',
    readTime: '5 min read',
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
    slug: 'pull-up-strength-progressions',
    title: 'Pull-Up Strength Progressions',
    description: 'From beginner to advanced pulling strength. Complete exercise library with progressions for all levels.',
    icon: Dumbbell,
    category: 'Strength',
    readTime: '12 min read',
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
    slug: 'muscle-up-progression',
    title: 'Muscle-Up Progression Guide',
    description: 'Progress from your first muscle-up to weighted reps. Prerequisites, technique cues, and common mistakes.',
    icon: Zap,
    category: 'Skill Progression',
    readTime: '7 min read',
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
    slug: 'calisthenics-training-program',
    title: 'Calisthenics Training Program Guide',
    description: 'Structure your calisthenics training for consistent progress. Learn programming principles that work.',
    icon: GraduationCap,
    category: 'Programming',
    readTime: '12 min read',
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
    slug: 'strength-cycles-guide',
    title: 'Calisthenics Strength Cycles',
    description: 'Master weighted calisthenics and build raw strength with structured strength cycles.',
    icon: Dumbbell,
    category: 'Programming',
    readTime: '10 min read',
  },
  {
    slug: 'hypertrophy-cycles-guide',
    title: 'Calisthenics Hypertrophy Cycles',
    description: 'Build muscle mass with calisthenics using structured hypertrophy training cycles.',
    icon: Flame,
    category: 'Programming',
    readTime: '10 min read',
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
  {
    slug: 'calisthenics-periodization',
    title: 'Calisthenics Periodization Guide',
    description: 'Learn how to structure training cycles with mesocycles, deloads, and skill blocks for optimal progress.',
    icon: GraduationCap,
    category: 'Programming',
    readTime: '10 min read',
  },
  {
    slug: 'hspu-progression',
    title: 'Handstand Push-Up Guide',
    description: 'Progress from wall HSPU to freestanding. Learn prerequisites, technique, and training tips.',
    icon: Target,
    category: 'Skill Progression',
    readTime: '8 min read',
  },
  {
    slug: 'l-sit-training',
    title: 'L-Sit Training Guide',
    description: 'Master L-sit progression from tucked holds to full extension. Build core compression strength and readiness for advanced skills.',
    icon: Target,
    category: 'Compression Skills',
    readTime: '10 min read',
    featured: true,
  },
  {
    slug: 'v-sit-progression',
    title: 'V-Sit Progression Guide',
    description: 'Progress toward V-sit mastery. Understand prerequisites, compression requirements, and training strategies.',
    icon: Target,
    category: 'Compression Skills',
    readTime: '8 min read',
  },
  {
    slug: 'compression-strength-guide',
    title: 'Compression Strength Guide',
    description: 'Build core compression strength for L-sit, V-sit, and advanced calisthenics skills. Exercises and programming principles.',
    icon: Target,
    category: 'Compression Skills',
    readTime: '12 min read',
  },
  // Strength Requirements Guides
  {
    slug: 'front-lever-strength-requirements',
    title: 'Front Lever Strength Requirements',
    description: 'Detailed strength benchmarks for each front lever progression level. Know exactly how strong you need to be.',
    icon: Dumbbell,
    category: 'Strength',
    readTime: '8 min read',
  },
  {
    slug: 'planche-strength-requirements',
    title: 'Planche Strength Requirements',
    description: 'Detailed strength benchmarks for planche progressions. Weighted dip, PPPU, and core requirements.',
    icon: Dumbbell,
    category: 'Strength',
    readTime: '8 min read',
  },
  {
    slug: 'muscle-up-strength-requirements',
    title: 'Muscle-Up Strength Requirements',
    description: 'Pulling, pushing, and explosive power requirements for strict muscle-ups on bar and rings.',
    icon: Dumbbell,
    category: 'Strength',
    readTime: '8 min read',
  },
  {
    slug: 'hspu-strength-requirements',
    title: 'HSPU Strength Requirements',
    description: 'Pressing, core, and balance prerequisites for wall and freestanding handstand push-ups.',
    icon: Dumbbell,
    category: 'Strength',
    readTime: '8 min read',
  },
  // Program Guides
  {
    slug: 'calisthenics-beginner-program',
    title: 'Calisthenics Beginner Program',
    description: 'Complete beginner program with exercises, sets, reps, and progression guidelines for new athletes.',
    icon: GraduationCap,
    category: 'Programming',
    readTime: '10 min read',
    featured: true,
  },
  {
    slug: 'calisthenics-intermediate-program',
    title: 'Calisthenics Intermediate Program',
    description: 'Intermediate program introducing skill work and weighted training. Bridge to advanced skills.',
    icon: GraduationCap,
    category: 'Programming',
    readTime: '10 min read',
  },
  {
    slug: 'calisthenics-advanced-program',
    title: 'Calisthenics Advanced Program',
    description: 'Advanced programming for elite skill mastery. Periodization, specialization, and recovery strategies.',
    icon: GraduationCap,
    category: 'Programming',
    readTime: '12 min read',
  },
  // Flexibility & Mobility Guides
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
  // Military Fitness Prep Guides
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
  {
    slug: 'marine-cft-prep',
    title: 'Marine Corps CFT Prep Guide',
    description: 'Train for the Combat Fitness Test with movement to contact, ammo lift, and maneuver under fire preparation.',
    icon: Shield,
    category: 'Military Prep',
    readTime: '12 min read',
  },
  {
    slug: 'army-acft-prep',
    title: 'Army ACFT Prep Guide',
    description: 'Complete guide to the Army Combat Fitness Test. All six events with training strategies and programming.',
    icon: Shield,
    category: 'Military Prep',
    readTime: '15 min read',
  },
  {
    slug: 'navy-prt-prep',
    title: 'Navy PRT Prep Guide',
    description: 'Prepare for the Navy Physical Readiness Test with push-up, plank, and cardio training strategies.',
    icon: Shield,
    category: 'Military Prep',
    readTime: '10 min read',
  },
  {
    slug: 'air-force-pt-prep',
    title: 'Air Force PT Test Prep Guide',
    description: 'Complete preparation guide for the Air Force Physical Training Test. Push-ups, sit-ups, and 1.5-mile run.',
    icon: Shield,
    category: 'Military Prep',
    readTime: '10 min read',
  },
  {
    slug: 'boot-camp-readiness',
    title: 'Boot Camp Readiness Guide',
    description: 'Prepare physically for any military basic training. Build the fitness foundation needed to succeed from day one.',
    icon: Shield,
    category: 'Military Prep',
    readTime: '12 min read',
    featured: true,
  },
]

export default function GuidesPage() {
  const featuredGuides = GUIDES.filter(g => g.featured)

  return (
    <div className="min-h-screen bg-[#0F1115]">
      {/* Back Navigation */}
      <nav className="px-4 py-3 border-b border-[#2B313A]/50 sticky top-0 z-40 bg-[#0F1115]/95 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto">
          <BackNav to="dashboard" />
        </div>
      </nav>
      
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

          {/* Footer Links */}
          <div className="mt-12 pt-8 border-t border-[#2B313A]">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[#6B7280]">
              <p>Explore more SpartanLab training resources</p>
              <div className="flex items-center gap-6">
                <Link href="/tools" className="hover:text-[#E6E9EF] transition-colors">Free Tools</Link>
                <Link href="/programs" className="hover:text-[#E6E9EF] transition-colors">Program Builder</Link>
                <Link href="/results" className="hover:text-[#E6E9EF] transition-colors">Results</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
