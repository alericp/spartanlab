import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, ArrowRight, Zap, CheckCircle2, AlertTriangle, Dumbbell, Clock, Calendar, Target } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Muscle-Up Training Guide | SpartanLab',
  description: 'Learn how to train the muscle-up with step-by-step progressions, exercises, and calisthenics strength benchmarks. Complete guide from pull-ups to your first muscle-up.',
  keywords: ['how to do a muscle-up', 'muscle-up training', 'muscle-up progression', 'muscle-up tutorial', 'learn muscle-up', 'calisthenics muscle-up'],
  openGraph: {
    title: 'Muscle-Up Training Guide | SpartanLab',
    description: 'Learn how to train the muscle-up with step-by-step progressions, exercises, and calisthenics strength benchmarks.',
    type: 'article',
  },
}

// Progression data
const PROGRESSIONS = [
  {
    name: 'Strict Pull-Ups',
    difficulty: 'Foundation',
    reps: '10-12 reps',
    description: 'Full range of motion pull-ups with controlled tempo. The fundamental pulling strength that everything else builds upon.',
    whyItMatters: 'Without solid pull-up strength, you cannot generate enough height to transition over the bar.',
    image: '/guides/muscle-up/pullup.jpg',
  },
  {
    name: 'Chest-to-Bar Pull-Ups',
    difficulty: 'Intermediate',
    reps: '8-10 reps',
    description: 'Pull-ups that finish with chest touching the bar. Requires significantly more pulling power than chin-over-bar.',
    whyItMatters: 'Teaches the pulling height needed to create space for the transition phase.',
    image: '/guides/muscle-up/chest-to-bar.jpg',
  },
  {
    name: 'Explosive Pull-Ups',
    difficulty: 'Intermediate',
    reps: '6-8 reps',
    description: 'High-speed pull-ups generating maximum upward momentum. Hands may release briefly at the top.',
    whyItMatters: 'The muscle-up requires explosive power, not just strength. This trains the rate of force development.',
    image: '/guides/muscle-up/explosive-pullup.jpg',
  },
  {
    name: 'Transition Drills',
    difficulty: 'Advanced',
    reps: '5-8 reps',
    description: 'Practicing the "over the bar" transition from various assistance heights or with bands. The most technical phase of the muscle-up.',
    whyItMatters: 'The transition is where most athletes fail. Isolated practice builds the motor pattern.',
    image: '/guides/muscle-up/transition-drill.jpg',
  },
  {
    name: 'Full Muscle-Up',
    difficulty: 'Advanced',
    reps: '1-5 reps',
    description: 'Complete movement from dead hang to support position above the bar. Combines explosive pull, transition, and dip.',
    whyItMatters: 'The culmination of pulling strength, explosive power, and technical skill.',
    image: '/guides/muscle-up/full-muscle-up.jpg',
  },
]

// Exercises data
const EXERCISES = [
  {
    name: 'Explosive Pull-Ups',
    description: 'Pull as fast and high as possible from dead hang. Focus on generating maximum upward velocity rather than controlled tempo.',
    cues: ['Dead hang start', 'Pull explosively', 'Drive elbows down hard', 'Aim for chest height'],
    sets: '4-5',
    reps: '5-8',
    image: '/guides/muscle-up/explosive-pullups.jpg',
  },
  {
    name: 'Chest-to-Bar Pull-Ups',
    description: 'Pull-ups finishing with chest contacting the bar. Develops the pulling height needed for muscle-up transition.',
    cues: ['Full range of motion', 'Pull to sternum level', 'Slight lean back at top', 'Control the negative'],
    sets: '3-4',
    reps: '6-10',
    image: '/guides/muscle-up/chest-to-bar.jpg',
  },
  {
    name: 'Weighted Pull-Ups',
    description: 'Pull-ups with added external load. Builds the raw pulling strength that makes bodyweight pull-ups explosive.',
    cues: ['Use dip belt or vest', 'Full range of motion', 'Controlled tempo', 'Progressive overload'],
    sets: '4-5',
    reps: '5-8',
    image: '/guides/muscle-up/weighted-pullups.jpg',
  },
  {
    name: 'Straight Bar Dips',
    description: 'Dips performed on a straight bar rather than parallel bars. Mimics the support position of the muscle-up.',
    cues: ['Lean slightly forward', 'Elbows track back', 'Full lockout at top', 'Chest to bar depth'],
    sets: '3-4',
    reps: '8-12',
    image: '/guides/muscle-up/straight-bar-dips.jpg',
  },
  {
    name: 'Muscle-Up Negatives',
    description: 'Jump or assist to the top position, then lower through the transition with control. Builds eccentric strength through the hardest phase.',
    cues: ['Start in support', 'Slow controlled descent', 'Feel the transition point', '3-5 second negative'],
    sets: '3-4',
    reps: '3-5',
    image: '/guides/muscle-up/muscle-up-negatives.jpg',
  },
]

// Mistakes data
const MISTAKES = [
  {
    mistake: 'Insufficient pulling height',
    explanation: 'If you cannot pull high enough, there is no room to transition over the bar. Focus on explosive and chest-to-bar pull-ups before attempting muscle-ups.',
  },
  {
    mistake: 'Trying to "jump" into the movement',
    explanation: 'Using a kip or swing before having the strength leads to poor technique and potential injury. Build the pulling power first.',
  },
  {
    mistake: 'Poor transition technique',
    explanation: 'The transition requires a specific wrist and elbow movement. Many athletes get stuck because they do not know how to roll over the bar.',
  },
  {
    mistake: 'Weak dip strength',
    explanation: 'Even if you complete the transition, weak dip strength means you cannot press out of the bottom position. Train straight bar dips.',
  },
]

// Muscles data
const MUSCLES = [
  { name: 'Latissimus Dorsi', role: 'Primary pulling muscles that initiate and power the pull-up phase' },
  { name: 'Biceps', role: 'Assist the pull and flex the elbows during the pulling phase' },
  { name: 'Upper Back', role: 'Traps, rhomboids, and rear delts stabilize and complete the pull' },
  { name: 'Chest', role: 'Assists during the transition and supports the dip phase' },
  { name: 'Triceps', role: 'Primary movers for the dip/press-out portion above the bar' },
  { name: 'Core', role: 'Stabilizes the body throughout the movement and controls swing' },
]

// Strength benchmarks
const BENCHMARKS = [
  { exercise: 'Strict Pull-Ups', benchmark: '10-12 reps', importance: 'Baseline pulling strength' },
  { exercise: 'Chest-to-Bar Pull-Ups', benchmark: '8-10 reps', importance: 'Required pulling height' },
  { exercise: 'Weighted Pull-Ups', benchmark: '+20-30% BW', importance: 'Explosive power reserve' },
  { exercise: 'Straight Bar Dips', benchmark: '10-15 reps', importance: 'Transition and press-out strength' },
]

export default function MuscleUpTrainingGuide() {
  return (
    <div className="min-h-screen bg-[#0F1115]">
      {/* Sticky Back Navigation */}
      <nav className="px-4 py-3 border-b border-[#2B313A]/50 sticky top-0 z-40 bg-[#0F1115]/95 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link 
            href="/guides"
            className="inline-flex items-center gap-2 text-sm text-[#A4ACB8] hover:text-[#E6E9EF] transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            <span>All Guides</span>
          </Link>
          <span className="text-xs text-[#6B7280]">12 min read</span>
        </div>
      </nav>

      {/* Main Content */}
      <main className="px-4 py-12 sm:py-16">
        <article className="max-w-4xl mx-auto">
          {/* Title Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#C1121F]/10 border border-[#C1121F]/20 mb-6">
              <Zap className="w-4 h-4 text-[#C1121F]" />
              <span className="text-xs text-[#C1121F] font-medium">Skill Progression</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#E6E9EF] mb-4 text-balance">
              Muscle-Up Training Guide
            </h1>
            <p className="text-lg text-[#A4ACB8] max-w-2xl mx-auto text-pretty">
              Learn how to build the strength, technique, and pulling power required to achieve your first muscle-up.
            </p>
          </div>

          {/* Introduction */}
          <section className="mb-16">
            <div className="prose prose-invert max-w-none">
              <p className="text-[#A4ACB8] leading-relaxed text-lg mb-4">
                The muscle-up is one of the most iconic calisthenics skills. It combines a powerful pull-up with a transition over the bar into a dip, creating a complete upper body movement that demonstrates real functional strength.
              </p>
              <p className="text-[#A4ACB8] leading-relaxed mb-4">
                Many athletes struggle with the muscle-up because it requires both pulling strength and proper technique. Unlike a standard pull-up, you must generate enough height to get your chest above the bar, then rotate your wrists and body to complete the transition.
              </p>
              <p className="text-[#A4ACB8] leading-relaxed">
                With the right progressions and exercises, most athletes can learn their first muscle-up. This guide explains the strength requirements, progressions, and exercises used by experienced calisthenics athletes.
              </p>
            </div>
          </section>

          {/* Muscles Used Section */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-[#E6E9EF] mb-6">Muscles Used in the Muscle-Up</h2>
            <p className="text-[#A4ACB8] mb-6">
              The muscle-up is a compound movement that engages nearly every muscle in the upper body. Understanding which muscles drive each phase helps you target weaknesses in training.
            </p>
            
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Muscle Diagram */}
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-[#1A1F26] border border-[#2B313A]">
                <Image
                  src="/guides/muscle-up/muscle-diagram.jpg"
                  alt="Muscle-Up Muscle Activation Diagram"
                  fill
                  className="object-cover"
                />
              </div>
              
              {/* Muscle List */}
              <div className="space-y-3">
                {MUSCLES.map((muscle) => (
                  <div key={muscle.name} className="p-3 rounded-lg bg-[#1A1F26] border border-[#2B313A]">
                    <h4 className="font-medium text-[#E6E9EF] text-sm">{muscle.name}</h4>
                    <p className="text-xs text-[#6B7280] mt-1">{muscle.role}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Progression Levels Section */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-[#E6E9EF] mb-6">Muscle-Up Progression Levels</h2>
            <p className="text-[#A4ACB8] mb-8">
              Progressing to a muscle-up requires building strength through specific stages. Each progression develops a component of the full movement.
            </p>
            
            <div className="space-y-6">
              {PROGRESSIONS.map((prog, index) => (
                <Card key={prog.name} className="bg-[#1A1F26] border-[#2B313A] overflow-hidden">
                  <div className="flex flex-col sm:flex-row">
                    {/* Image */}
                    <div className="relative w-full sm:w-48 h-48 sm:h-auto flex-shrink-0 bg-[#0F1115]">
                      <Image
                        src={prog.image}
                        alt={prog.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    
                    {/* Content */}
                    <div className="p-5 flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-xs font-medium text-[#6B7280]">Stage {index + 1}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          prog.difficulty === 'Foundation' ? 'bg-emerald-500/10 text-emerald-400' :
                          prog.difficulty === 'Intermediate' ? 'bg-amber-500/10 text-amber-400' :
                          'bg-[#C1121F]/10 text-[#C1121F]'
                        }`}>
                          {prog.difficulty}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-[#E6E9EF] mb-2">{prog.name}</h3>
                      <p className="text-sm text-[#A4ACB8] mb-3">{prog.description}</p>
                      <div className="flex flex-wrap gap-4 text-xs">
                        <div>
                          <span className="text-[#6B7280]">Target: </span>
                          <span className="text-[#E6E9EF]">{prog.reps}</span>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-[#2B313A]">
                        <p className="text-xs text-[#6B7280]">
                          <span className="text-amber-400">Why it matters:</span> {prog.whyItMatters}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* Best Exercises Section */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-[#E6E9EF] mb-6">Best Exercises for Muscle-Up Strength</h2>
            <p className="text-[#A4ACB8] mb-8">
              These exercises build the specific strength needed for each phase of the muscle-up. Include them in your training to accelerate progress.
            </p>
            
            <div className="grid sm:grid-cols-2 gap-4">
              {EXERCISES.map((exercise) => (
                <Card key={exercise.name} className="bg-[#1A1F26] border-[#2B313A] overflow-hidden">
                  {/* Exercise Image */}
                  <div className="relative h-40 bg-[#0F1115]">
                    <Image
                      src={exercise.image}
                      alt={exercise.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  
                  {/* Exercise Content */}
                  <div className="p-4">
                    <h3 className="font-semibold text-[#E6E9EF] mb-2">{exercise.name}</h3>
                    <p className="text-xs text-[#A4ACB8] mb-3">{exercise.description}</p>
                    
                    {/* Key Cues */}
                    <div className="mb-3">
                      <p className="text-[10px] text-[#6B7280] uppercase tracking-wider mb-1.5">Key Cues</p>
                      <div className="flex flex-wrap gap-1">
                        {exercise.cues.map((cue) => (
                          <span key={cue} className="text-[10px] px-2 py-0.5 rounded bg-[#0F1115] text-[#A4ACB8]">
                            {cue}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    {/* Sets/Reps */}
                    <div className="flex gap-4 text-xs pt-3 border-t border-[#2B313A]">
                      <div>
                        <span className="text-[#6B7280]">Sets: </span>
                        <span className="text-[#E6E9EF]">{exercise.sets}</span>
                      </div>
                      <div>
                        <span className="text-[#6B7280]">Reps: </span>
                        <span className="text-[#E6E9EF]">{exercise.reps}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* Common Mistakes Section */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-[#E6E9EF] mb-6">Common Muscle-Up Mistakes</h2>
            <p className="text-[#A4ACB8] mb-6">
              Avoid these common errors that slow progress and can lead to injury.
            </p>
            
            <div className="space-y-4">
              {MISTAKES.map((item) => (
                <div key={item.mistake} className="flex gap-4 p-4 rounded-lg bg-[#1A1F26] border border-[#2B313A]">
                  <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-[#E6E9EF] mb-1">{item.mistake}</h4>
                    <p className="text-sm text-[#A4ACB8]">{item.explanation}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Strength Benchmarks Section */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-[#E6E9EF] mb-6">How Strong You Need to Be</h2>
            <p className="text-[#A4ACB8] mb-6">
              These benchmarks indicate readiness to begin serious muscle-up training. Meeting these standards means you have the strength foundation; you just need to develop the technique.
            </p>
            
            <Card className="bg-[#1A1F26] border-[#2B313A] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#2B313A]">
                      <th className="text-left p-4 text-[#6B7280] font-medium">Exercise</th>
                      <th className="text-left p-4 text-[#6B7280] font-medium">Benchmark</th>
                      <th className="text-left p-4 text-[#6B7280] font-medium">Why It Matters</th>
                    </tr>
                  </thead>
                  <tbody>
                    {BENCHMARKS.map((item) => (
                      <tr key={item.exercise} className="border-b border-[#2B313A] last:border-0">
                        <td className="p-4 text-[#E6E9EF] font-medium">{item.exercise}</td>
                        <td className="p-4 text-[#C1121F] font-medium">{item.benchmark}</td>
                        <td className="p-4 text-[#A4ACB8]">{item.importance}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Pro Tip */}
            <div className="mt-6 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-emerald-400 mb-1">Pro Tip</p>
                  <p className="text-sm text-[#A4ACB8]">
                    If you can do 5 explosive pull-ups where your hands leave the bar, you likely have the power for a muscle-up. At that point, the barrier is technique, not strength.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Training Frequency Section */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-[#E6E9EF] mb-6">How Often to Train Muscle-Up</h2>
            <p className="text-[#A4ACB8] mb-6">
              Muscle-up training should balance skill practice with strength building. Recovery is essential for the connective tissue in your elbows and shoulders.
            </p>
            
            <div className="grid sm:grid-cols-3 gap-4">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 text-center">
                <Calendar className="w-6 h-6 text-[#C1121F] mx-auto mb-2" />
                <p className="text-2xl font-bold text-[#E6E9EF]">2-3x</p>
                <p className="text-xs text-[#6B7280]">Sessions per week</p>
              </Card>
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 text-center">
                <Zap className="w-6 h-6 text-[#C1121F] mx-auto mb-2" />
                <p className="text-2xl font-bold text-[#E6E9EF]">Fresh</p>
                <p className="text-xs text-[#6B7280]">Skill work first in session</p>
              </Card>
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 text-center">
                <Clock className="w-6 h-6 text-[#C1121F] mx-auto mb-2" />
                <p className="text-2xl font-bold text-[#E6E9EF]">48-72h</p>
                <p className="text-xs text-[#6B7280]">Recovery between sessions</p>
              </Card>
            </div>

            <div className="mt-6 p-4 rounded-lg bg-[#1A1F26] border border-[#2B313A]">
              <h4 className="font-medium text-[#E6E9EF] mb-2">Sample Weekly Structure</h4>
              <ul className="space-y-2 text-sm text-[#A4ACB8]">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#C1121F] mt-0.5 flex-shrink-0" />
                  <span><strong className="text-[#E6E9EF]">Day 1:</strong> Explosive pull-ups, transition drills, straight bar dips</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#C1121F] mt-0.5 flex-shrink-0" />
                  <span><strong className="text-[#E6E9EF]">Day 2:</strong> Rest or lower body</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#C1121F] mt-0.5 flex-shrink-0" />
                  <span><strong className="text-[#E6E9EF]">Day 3:</strong> Weighted pull-ups, chest-to-bar, muscle-up attempts</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#C1121F] mt-0.5 flex-shrink-0" />
                  <span><strong className="text-[#E6E9EF]">Day 4-5:</strong> Rest or other training</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#C1121F] mt-0.5 flex-shrink-0" />
                  <span><strong className="text-[#E6E9EF]">Day 6:</strong> Full muscle-up practice (if ready), negatives, accessory work</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Tool Integration Section */}
          <section className="mb-16">
            <Card className="bg-gradient-to-br from-[#1A1F26] to-[#0F1115] border-[#2B313A] p-8">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-[#C1121F]/10 flex items-center justify-center flex-shrink-0">
                  <Target className="w-8 h-8 text-[#C1121F]" />
                </div>
                <div className="text-center sm:text-left flex-1">
                  <h2 className="text-xl font-bold text-[#E6E9EF] mb-2">Test Your Muscle-Up Readiness</h2>
                  <p className="text-[#A4ACB8] mb-4">
                    Use the SpartanLab Muscle-Up Readiness Test to analyze your pulling strength and determine whether you are ready to begin muscle-up training.
                  </p>
                  <Button asChild className="bg-[#C1121F] hover:bg-[#A30F1A]">
                    <Link href="/tools/muscle-up-readiness">
                      Open Muscle-Up Readiness Test
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          </section>

          {/* Platform Funnel Section */}
          <section className="mb-16">
            <Card className="bg-gradient-to-br from-[#C1121F]/15 via-[#1A1F26] to-[#1A1F26] border-[#C1121F]/30 p-8 text-center">
              <Dumbbell className="w-12 h-12 text-[#C1121F] mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-[#E6E9EF] mb-3">Generate a Muscle-Up Training Program</h2>
              <p className="text-[#A4ACB8] mb-6 max-w-lg mx-auto">
                SpartanLab can generate a training program based on your pulling strength, skill progressions, and available equipment. The Adaptive Training Engine adjusts your workouts automatically as your strength improves.
              </p>
              <Button asChild size="lg" className="bg-[#C1121F] hover:bg-[#A30F1A]">
                <Link href="/programs">
                  Generate Program
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </Card>
          </section>

          {/* Related Guides */}
          <section className="mb-12">
            <h2 className="text-xl font-bold text-[#E6E9EF] mb-4">Related Guides</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <Link href="/guides/weighted-pull-up-standards">
                <Card className="bg-[#1A1F26] border-[#2B313A] p-4 h-full hover:border-[#C1121F]/50 transition-all cursor-pointer">
                  <Dumbbell className="w-5 h-5 text-[#C1121F] mb-2" />
                  <h3 className="font-medium text-[#E6E9EF] text-sm mb-1">Weighted Pull-Up Standards</h3>
                  <p className="text-xs text-[#6B7280]">Benchmarks that correlate with skill acquisition</p>
                </Card>
              </Link>
              <Link href="/guides/front-lever-training">
                <Card className="bg-[#1A1F26] border-[#2B313A] p-4 h-full hover:border-[#C1121F]/50 transition-all cursor-pointer">
                  <Target className="w-5 h-5 text-[#C1121F] mb-2" />
                  <h3 className="font-medium text-[#E6E9EF] text-sm mb-1">Front Lever Training</h3>
                  <p className="text-xs text-[#6B7280]">Build pulling strength for advanced skills</p>
                </Card>
              </Link>
              <Link href="/guides/calisthenics-strength-standards">
                <Card className="bg-[#1A1F26] border-[#2B313A] p-4 h-full hover:border-[#C1121F]/50 transition-all cursor-pointer">
                  <Target className="w-5 h-5 text-[#C1121F] mb-2" />
                  <h3 className="font-medium text-[#E6E9EF] text-sm mb-1">Strength Standards</h3>
                  <p className="text-xs text-[#6B7280]">Know where you stand</p>
                </Card>
              </Link>
            </div>
          </section>

          {/* Back to Guides */}
          <div className="flex items-center justify-between pt-8 border-t border-[#2B313A]">
            <Link 
              href="/guides" 
              className="inline-flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#A4ACB8] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              All Guides
            </Link>
            <Link 
              href="/tools" 
              className="inline-flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#A4ACB8] transition-colors"
            >
              Free Tools
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </article>
      </main>

      {/* Footer */}
      <footer className="px-4 py-8 border-t border-[#2B313A]">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-sm text-[#6B7280]">
            <p>Part of the SpartanLab Calisthenics Training Intelligence Platform</p>
            <div className="flex items-center gap-6">
              <Link href="/guides" className="hover:text-[#E6E9EF] transition-colors">All Guides</Link>
              <Link href="/tools" className="hover:text-[#E6E9EF] transition-colors">Tools</Link>
              <Link href="/programs" className="hover:text-[#E6E9EF] transition-colors">Programs</Link>
              <Link href="/dashboard" className="hover:text-[#E6E9EF] transition-colors">Dashboard</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
