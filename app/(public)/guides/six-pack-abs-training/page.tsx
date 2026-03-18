'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  ArrowRight, 
  ArrowLeft, 
  Target, 
  Dumbbell,
  CheckCircle2,
  AlertTriangle,
  Info,
  Utensils,
  Flame,
  Activity,
  Calendar,
  LayoutDashboard,
  ChevronRight
} from 'lucide-react'

// Muscle data
const coreMuscles = [
  {
    name: 'Rectus Abdominis',
    role: 'The "six-pack" muscle. Flexes the spine and maintains posture.',
  },
  {
    name: 'Obliques',
    role: 'Internal and external obliques rotate the torso and provide lateral stability.',
  },
  {
    name: 'Transverse Abdominis',
    role: 'The deepest core muscle. Stabilizes the spine and compresses the abdomen.',
  },
  {
    name: 'Hip Flexors',
    role: 'Connect the core to the legs. Essential for leg raise movements.',
  },
]

// Skill transfer data
const skillTransfers = [
  {
    skill: 'Front Lever',
    explanation: 'Core tension maintains horizontal body position under the bar.',
  },
  {
    skill: 'Planche',
    explanation: 'Hollow body position requires constant abdominal engagement.',
  },
  {
    skill: 'L-Sit',
    explanation: 'Hip flexor and lower ab strength holds the legs elevated.',
  },
  {
    skill: 'Dragon Flag',
    explanation: 'Full body tension through the core controls the lowering phase.',
  },
]

// Exercises data
const exercises = [
  {
    name: 'Hanging Leg Raises',
    description: 'Hang from a bar and raise straight legs to horizontal or higher. One of the most effective exercises for lower abs and hip flexors.',
    cues: ['Dead hang with shoulders engaged', 'Raise legs with control, no swing', 'Lower slowly to full extension'],
    sets: '3-4 sets of 8-12 reps',
    image: '/guides/abs-dragonflag/hanging-leg-raises.jpg',
  },
  {
    name: 'L-Sit Hold',
    description: 'Support your body on parallettes or the floor with legs extended straight in front. Builds compression strength and hip flexor endurance.',
    cues: ['Push shoulders down and away', 'Point toes and squeeze quads', 'Maintain posterior pelvic tilt'],
    sets: '4-6 sets of 10-30 second holds',
    image: '/guides/abs-dragonflag/l-sit-hold.jpg',
  },
  {
    name: 'Hollow Body Hold',
    description: 'Lie on your back with arms overhead and legs extended, creating a banana shape. The foundation for most gymnastics and calisthenics core work.',
    cues: ['Press lower back into floor', 'Tuck chin slightly', 'Squeeze glutes and point toes'],
    sets: '3-4 sets of 20-45 seconds',
    image: '/guides/abs-dragonflag/hollow-body-hold.jpg',
  },
  {
    name: 'Dragon Flag Progressions',
    description: 'Lie on a bench, grip behind your head, and lower your body in a straight line. The ultimate calisthenics core exercise.',
    cues: ['Grip the bench firmly behind head', 'Keep body rigid from shoulders to toes', 'Lower with control, no sagging'],
    sets: '3-5 sets of 3-8 reps or negatives',
    image: '/guides/abs-dragonflag/dragon-flag-exercise.jpg',
  },
  {
    name: 'Reverse Crunches',
    description: 'Lie on your back and curl your hips toward your chest, lifting your lower back off the floor. Targets the lower portion of the rectus abdominis.',
    cues: ['Keep upper back pressed into floor', 'Curl hips, dont just lift legs', 'Control the lowering phase'],
    sets: '3-4 sets of 12-20 reps',
    image: '/guides/abs-dragonflag/reverse-crunches.jpg',
  },
]

// Dragon flag progressions
const dragonFlagProgressions = [
  {
    name: 'Bent-Knee Dragon Flag',
    description: 'Start with knees bent to reduce leverage. Focus on maintaining a straight line from shoulders to knees.',
    difficulty: 'Intermediate',
    benchmark: 'Hold for 3-5 seconds at bottom',
    image: '/guides/abs-dragonflag/bent-dragon-flag.jpg',
  },
  {
    name: 'Negative Dragon Flag',
    description: 'Start at the top position and lower slowly with straight legs. Eccentric training builds the strength for full reps.',
    difficulty: 'Advanced',
    benchmark: '5-8 second controlled descent',
    image: '/guides/abs-dragonflag/dragon-flag-negative.jpg',
  },
  {
    name: 'Full Dragon Flag',
    description: 'Complete the full movement with straight legs, lowering and raising with control. An elite display of core strength.',
    difficulty: 'Elite',
    benchmark: '5-8 controlled reps',
    image: '/guides/abs-dragonflag/full-dragon-flag.jpg',
  },
]

// Common mistakes
const commonMistakes = [
  {
    mistake: 'Using Momentum Instead of Control',
    explanation: 'Swinging or kipping reduces core activation. Every rep should be controlled through the full range of motion.',
  },
  {
    mistake: 'Ignoring Lower Core Engagement',
    explanation: 'Many athletes over-develop upper abs while neglecting lower abs and hip flexors. Include leg raises and reverse crunches.',
  },
  {
    mistake: 'Progressing Too Quickly',
    explanation: 'Attempting dragon flags before building foundational strength leads to poor form and potential injury. Master hollow holds first.',
  },
  {
    mistake: 'Holding Your Breath',
    explanation: 'Proper breathing maintains intra-abdominal pressure. Exhale during the effort phase of each movement.',
  },
]

export default function SixPackAbsGuidePage() {
  return (
    <div className="min-h-screen bg-[#0F1115] text-[#E6E9EF]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0F1115]/95 backdrop-blur-md border-b border-[#2B313A]">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/guides" className="flex items-center gap-2 text-sm text-[#A4ACB8] hover:text-[#E6E9EF] transition-colors">
            <ArrowLeft className="w-4 h-4" />
            All Guides
          </Link>
          <Link href="/programs">
            <Button size="sm" className="bg-[#C1121F] hover:bg-[#A30F1A] text-white">
              Generate Program
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="mb-12">
          <div className="flex items-center gap-2 text-sm text-[#C1121F] mb-4">
            <Target className="w-4 h-4" />
            <span>Core Training</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-balance">
            Six Pack Abs Training Guide
          </h1>
          <p className="text-lg text-[#A4ACB8] leading-relaxed max-w-2xl">
            Learn how to develop strong abdominal muscles and progress toward advanced calisthenics core exercises like the dragon flag.
          </p>
        </div>

        {/* Introduction */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">The Truth About Visible Abs</h2>
          <div className="prose prose-invert max-w-none">
            <p className="text-[#A4ACB8] leading-relaxed mb-4">
              There is a well-known principle in fitness:
            </p>
            <blockquote className="border-l-4 border-[#C1121F] pl-4 py-2 my-6 bg-[#1A1F26]/50 rounded-r-lg">
              <p className="text-lg text-[#E6E9EF] italic">
                "Abs are built in the gym, but revealed in the kitchen."
              </p>
            </blockquote>
            <p className="text-[#A4ACB8] leading-relaxed mb-4">
              This means two things: First, you need to train your abdominal muscles to make them stronger and larger. Second, your body fat percentage determines whether those muscles are visible.
            </p>
            <p className="text-[#A4ACB8] leading-relaxed">
              This guide focuses on the training side. Strong abs are not just about aesthetics. They are essential for calisthenics performance, supporting advanced skills like front levers, planches, and dragon flags.
            </p>
          </div>
        </section>

        {/* Muscle Anatomy */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">How Abdominal Muscles Work</h2>
          
          {/* Muscle Diagram */}
          <div className="relative w-full h-64 sm:h-80 rounded-xl overflow-hidden bg-[#1A1F26] border border-[#2B313A] mb-6">
            <Image
              src="/guides/abs-dragonflag/core-muscles.jpg"
              alt="Core Muscle Anatomy Diagram"
              fill
              className="object-cover"
            />
          </div>

          {/* Muscle Cards */}
          <div className="grid sm:grid-cols-2 gap-4">
            {coreMuscles.map((muscle) => (
              <Card key={muscle.name} className="bg-[#1A1F26] border-[#2B313A] p-4">
                <h3 className="font-semibold text-[#E6E9EF] mb-2">{muscle.name}</h3>
                <p className="text-sm text-[#A4ACB8]">{muscle.role}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Why Core Strength Matters */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Why Core Strength Matters in Calisthenics</h2>
          <p className="text-[#A4ACB8] leading-relaxed mb-6">
            Strong abs are the foundation of advanced calisthenics skills. Here is how core strength transfers to specific movements:
          </p>
          
          <div className="grid sm:grid-cols-2 gap-4">
            {skillTransfers.map((item) => (
              <Card key={item.skill} className="bg-[#1A1F26] border-[#2B313A] p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#C1121F]/10 flex items-center justify-center flex-shrink-0">
                    <Activity className="w-5 h-5 text-[#C1121F]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#E6E9EF] mb-1">{item.skill}</h3>
                    <p className="text-sm text-[#A4ACB8]">{item.explanation}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Exercises */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Best Calisthenics Exercises for Abs</h2>
          <p className="text-[#A4ACB8] leading-relaxed mb-6">
            These exercises build functional core strength that transfers directly to calisthenics skills.
          </p>
          
          <div className="space-y-6">
            {exercises.map((exercise) => (
              <Card key={exercise.name} className="bg-[#1A1F26] border-[#2B313A] overflow-hidden">
                <div className="flex flex-col sm:flex-row">
                  {/* Image */}
                  <div className="relative w-full sm:w-48 h-48 sm:h-auto flex-shrink-0 bg-[#0F1115]">
                    <Image
                      src={exercise.image}
                      alt={exercise.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  
                  {/* Content */}
                  <div className="p-5 flex-1">
                    <h3 className="text-lg font-semibold text-[#E6E9EF] mb-2">{exercise.name}</h3>
                    <p className="text-sm text-[#A4ACB8] mb-4">{exercise.description}</p>
                    
                    {/* Cues */}
                    <div className="space-y-1.5 mb-4">
                      {exercise.cues.map((cue, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                          <span className="text-xs text-[#A4ACB8]">{cue}</span>
                        </div>
                      ))}
                    </div>
                    
                    {/* Sets */}
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0F1115] border border-[#2B313A]">
                      <Dumbbell className="w-3.5 h-3.5 text-[#C1121F]" />
                      <span className="text-xs text-[#A4ACB8]">{exercise.sets}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Dragon Flag Progression */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Dragon Flag Progression</h2>
          <p className="text-[#A4ACB8] leading-relaxed mb-6">
            The dragon flag is one of the most impressive and challenging core exercises in calisthenics. Made famous by Bruce Lee, it requires exceptional abdominal strength and full body tension. Progress through these levels systematically.
          </p>
          
          <div className="space-y-4">
            {dragonFlagProgressions.map((prog, index) => (
              <Card key={prog.name} className="bg-[#1A1F26] border-[#2B313A] overflow-hidden">
                <div className="flex flex-col sm:flex-row">
                  {/* Image */}
                  <div className="relative w-full sm:w-56 h-48 sm:h-auto flex-shrink-0 bg-[#0F1115]">
                    <Image
                      src={prog.image}
                      alt={prog.name}
                      fill
                      className="object-cover"
                    />
                    {/* Level badge */}
                    <div className="absolute top-3 left-3 px-2 py-1 rounded bg-[#0F1115]/80 border border-[#2B313A]">
                      <span className="text-xs text-[#A4ACB8]">Level {index + 1}</span>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-5 flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-[#E6E9EF]">{prog.name}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        prog.difficulty === 'Intermediate' ? 'bg-amber-500/20 text-amber-400' :
                        prog.difficulty === 'Advanced' ? 'bg-orange-500/20 text-orange-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {prog.difficulty}
                      </span>
                    </div>
                    <p className="text-sm text-[#A4ACB8] mb-4">{prog.description}</p>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <Target className="w-4 h-4 text-[#C1121F]" />
                      <span className="text-[#E6E9EF]">Benchmark:</span>
                      <span className="text-[#A4ACB8]">{prog.benchmark}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Common Mistakes */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Common Core Training Mistakes</h2>
          <div className="space-y-4">
            {commonMistakes.map((item) => (
              <Card key={item.mistake} className="bg-[#1A1F26] border-[#2B313A] p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#E6E9EF] mb-1">{item.mistake}</h3>
                    <p className="text-sm text-[#A4ACB8]">{item.explanation}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Nutrition Section */}
        <section className="mb-12">
          <Card className="bg-gradient-to-br from-[#1A1F26] to-[#0F1115] border-[#2B313A] p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <Utensils className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-3">Nutrition and Visible Abs</h2>
                <p className="text-[#A4ACB8] leading-relaxed mb-4">
                  Training builds abdominal muscle, but body fat levels determine visibility. Most people need to reach 12-15% body fat (men) or 18-22% (women) before abdominal definition becomes visible.
                </p>
                <blockquote className="border-l-4 border-amber-500/50 pl-4 py-1 mb-4">
                  <p className="text-[#E6E9EF] italic">
                    "Abs are built in the gym, but revealed in the kitchen."
                  </p>
                </blockquote>
                <p className="text-[#A4ACB8] leading-relaxed mb-4">
                  Consistent training combined with appropriate nutrition helps reveal abdominal definition over time.
                </p>
                <div className="flex items-start gap-2 p-3 rounded-lg bg-[#0F1115]/50 border border-[#2B313A]/50">
                  <Info className="w-4 h-4 text-[#6B7280] mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-[#6B7280]">
                    SpartanLab focuses on training performance and exercise programming. Nutrition strategies should be personalized based on individual needs and goals.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Tool CTA */}
        <section className="mb-12">
          <Card className="bg-[#1A1F26] border-[#2B313A] p-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#C1121F]/20 to-[#C1121F]/5 flex items-center justify-center flex-shrink-0">
                <Flame className="w-8 h-8 text-[#C1121F]" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-xl font-semibold mb-2">Analyze Your Core Strength</h2>
                <p className="text-[#A4ACB8]">
                  SpartanLab training tools help analyze your strength levels and recommend exercises based on your current ability.
                </p>
              </div>
              <Button asChild className="bg-[#C1121F] hover:bg-[#A30F1A] whitespace-nowrap">
                <Link href="/tools">
                  Analyze My Core Strength
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </Card>
        </section>

        {/* Platform CTA */}
        <section className="mb-12">
          <Card className="bg-gradient-to-br from-[#C1121F]/15 via-[#1A1F26] to-[#1A1F26] border-[#C1121F]/30 p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-3 text-[#E6E9EF]">
                Generate a Core Training Program
              </h2>
              <p className="text-[#A4ACB8] mb-6 max-w-lg mx-auto">
                SpartanLab can generate a calisthenics program based on your current strength level, skill goals, and training schedule. The Adaptive Training Engine adjusts your workouts automatically as your strength improves.
              </p>
              <Button asChild size="lg" className="bg-[#C1121F] hover:bg-[#A30F1A]">
                <Link href="/programs">
                  Generate Program
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>
          </Card>
        </section>

        {/* Related Guides */}
        <section className="mb-12">
          <h2 className="text-lg font-semibold mb-4 text-[#E6E9EF]">Related Guides</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <Link href="/guides/front-lever-training">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 h-full hover:border-[#C1121F]/50 transition-all cursor-pointer group">
                <h3 className="font-medium text-[#E6E9EF] group-hover:text-[#C1121F] transition-colors mb-1">Front Lever Training</h3>
                <p className="text-xs text-[#6B7280]">Core strength for horizontal pulling</p>
              </Card>
            </Link>
            <Link href="/guides/planche-progression">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 h-full hover:border-[#C1121F]/50 transition-all cursor-pointer group">
                <h3 className="font-medium text-[#E6E9EF] group-hover:text-[#C1121F] transition-colors mb-1">Planche Progression</h3>
                <p className="text-xs text-[#6B7280]">Hollow body for pushing skills</p>
              </Card>
            </Link>
            <Link href="/guides/calisthenics-strength-standards">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 h-full hover:border-[#C1121F]/50 transition-all cursor-pointer group">
                <h3 className="font-medium text-[#E6E9EF] group-hover:text-[#C1121F] transition-colors mb-1">Strength Standards</h3>
                <p className="text-xs text-[#6B7280]">Benchmark your overall strength</p>
              </Card>
            </Link>
          </div>
        </section>

        {/* Internal Linking */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 text-[#E6E9EF]">Continue Your Training Journey</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <Link href="/programs">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 h-full hover:border-[#C1121F]/50 transition-all cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#0F1115] flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-[#C1121F]" />
                  </div>
                  <div>
                    <h3 className="font-medium text-[#E6E9EF] group-hover:text-[#C1121F] transition-colors">Program Builder</h3>
                    <p className="text-xs text-[#6B7280]">Generate a personalized program</p>
                  </div>
                </div>
              </Card>
            </Link>
            <Link href="/skills">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 h-full hover:border-[#C1121F]/50 transition-all cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#0F1115] flex items-center justify-center flex-shrink-0">
                    <Activity className="w-5 h-5 text-[#C1121F]" />
                  </div>
                  <div>
                    <h3 className="font-medium text-[#E6E9EF] group-hover:text-[#C1121F] transition-colors">Skill Tracker</h3>
                    <p className="text-xs text-[#6B7280]">Track your skill progression</p>
                  </div>
                </div>
              </Card>
            </Link>
            <Link href="/sign-in?redirect_url=/dashboard">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 h-full hover:border-[#C1121F]/50 transition-all cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#0F1115] flex items-center justify-center flex-shrink-0">
                    <LayoutDashboard className="w-5 h-5 text-[#C1121F]" />
                  </div>
                  <div>
                    <h3 className="font-medium text-[#E6E9EF] group-hover:text-[#C1121F] transition-colors">Training Dashboard</h3>
                    <p className="text-xs text-[#6B7280]">View all training intelligence</p>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        </section>

        {/* Back/Forward Navigation */}
        <div className="flex items-center justify-between pt-8 border-t border-[#2B313A]">
          <Link 
            href="/guides" 
            className="inline-flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#A4ACB8] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            All Guides
          </Link>
          <Link 
            href="/landing" 
            className="inline-flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#A4ACB8] transition-colors"
          >
            Learn about SpartanLab
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-4 py-8 border-t border-[#2B313A] mt-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-sm text-[#6B7280]">
            <p>Part of the SpartanLab Calisthenics Training Decision Engine</p>
            <div className="flex items-center gap-6">
              <Link href="/guides" className="hover:text-[#E6E9EF] transition-colors">Guides</Link>
              <Link href="/tools" className="hover:text-[#E6E9EF] transition-colors">Tools</Link>
              <Link href="/programs" className="hover:text-[#E6E9EF] transition-colors">Programs</Link>
              <Link href="/sign-in?redirect_url=/dashboard" className="hover:text-[#E6E9EF] transition-colors">Dashboard</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
