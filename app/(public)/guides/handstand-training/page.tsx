import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Clock, Target, AlertTriangle, CheckCircle, Dumbbell, Brain } from 'lucide-react'
import { SITE_CONFIG, generateFAQSchema, generateHowToSchema, generateBreadcrumbSchema } from '@/lib/seo'
import { JsonLdMultiple } from '@/components/seo/JsonLd'
import { ProgressionTable } from '@/components/seo/ProgressionTable'
import { FAQ } from '@/components/seo/FAQ'
import { RelatedContent } from '@/components/seo/RelatedContent'
import { getSkillCluster } from '@/lib/seo/skill-clusters'

export const metadata: Metadata = {
  title: 'Handstand Training Guide | SpartanLab',
  description: 'Complete guide to freestanding handstand training. Balance practice, strength progressions, and training frequency recommendations.',
  keywords: ['handstand training', 'freestanding handstand', 'handstand tutorial', 'balance training', 'calisthenics', 'handstand progression'],
  alternates: {
    canonical: `${SITE_CONFIG.url}/guides/handstand-training`,
  },
  openGraph: {
    title: 'Handstand Training Guide | SpartanLab',
    description: 'Complete guide to freestanding handstand training. Balance practice, strength progressions, and training frequency recommendations.',
    url: `${SITE_CONFIG.url}/guides/handstand-training`,
    siteName: SITE_CONFIG.name,
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Handstand Training Guide | SpartanLab',
    description: 'Master the freestanding handstand with proper balance practice.',
  },
}

// Progression table data
const progressionLevels = [
  { level: 'Wall Handstand', holdTime: '30-60 seconds', requirement: 'Basic shoulder strength', nextGoal: 'Develop body alignment' },
  { level: 'Chest-to-Wall', holdTime: '30-45 seconds', requirement: 'Shoulder flexibility', nextGoal: 'Begin balance drills' },
  { level: 'Heel Pulls', holdTime: '5-10 pulls', requirement: 'Wall stability', nextGoal: 'Develop balance feel' },
  { level: 'Kick-Up Attempts', holdTime: '15-30 attempts/day', requirement: 'Reliable kick-up', nextGoal: 'Achieve freestanding' },
  { level: 'Freestanding Hold', holdTime: '10-30 seconds', requirement: 'Balance control', nextGoal: 'Extend hold time' },
]

// FAQ data
const faqs = [
  { question: 'How long does it take to learn a freestanding handstand?', answer: 'Most dedicated practitioners achieve a 10-30 second freestanding handstand in 6-18 months. Daily practice of 10-15 minutes is more effective than longer, less frequent sessions. Wall work builds strength, but balance requires freestanding attempts.' },
  { question: 'Should I train handstand every day?', answer: 'Yes, daily balance practice (10-15 minutes) is ideal for developing the neurological adaptations needed. However, heavy pressing/strength work should be limited to 3x per week to allow recovery. Separate balance work from strength work for best results.' },
  { question: 'Do I need to be strong to do a handstand?', answer: 'Basic strength is needed (10+ push-ups, 30+ second plank), but handstands are primarily a balance skill. Many people overthink strength requirements. Start wall practice early and build strength alongside balance development.' },
  { question: 'Is handstand harder than front lever or planche?', answer: 'Handstand is primarily a balance skill, while front lever and planche are primarily strength skills. A basic handstand is achievable faster than front lever, but a perfectly controlled, long-duration handstand takes years of refinement.' },
]

// JSON-LD schemas
const jsonLdSchemas = [
  generateHowToSchema({
    name: 'Handstand Training Guide',
    description: 'Master the freestanding handstand with balance practice, strength progressions, and training structure.',
    url: `${SITE_CONFIG.url}/guides/handstand-training`,
    steps: [
      { name: 'Wall Handstand', description: 'Build foundational shoulder strength and body alignment against the wall.' },
      { name: 'Chest-to-Wall Practice', description: 'Develop proper alignment with chest facing the wall to correct banana back.' },
      { name: 'Heel Pull Drills', description: 'Practice pulling heels away from wall to develop balance awareness.' },
      { name: 'Kick-Up Practice', description: 'Develop a reliable kick-up technique for consistent entry.' },
      { name: 'Freestanding Holds', description: 'Build balance endurance through daily freestanding practice.' },
    ],
    totalTime: 'P1Y',
  }),
  generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Guides', url: '/guides' },
    { name: 'Handstand Training', url: '/guides/handstand-training' },
  ]),
  generateFAQSchema(faqs),
]

export default function HandstandTrainingGuidePage() {
  return (
    <main className="min-h-screen bg-[#0F1115] text-[#E6E9EF]">
      <JsonLdMultiple schemas={jsonLdSchemas} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Back Link */}
        <Link 
          href="/guides" 
          className="inline-flex items-center gap-2 text-[#6B7280] hover:text-[#A4ACB8] mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Guides
        </Link>

        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-[#C1121F]/20 text-[#C1121F]">
              Balance Skill
            </span>
            <span className="flex items-center gap-1 text-xs text-[#6B7280]">
              <Clock className="w-3 h-3" />
              12 min read
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Handstand Training Guide
          </h1>
          <p className="text-lg text-[#A4ACB8]">
            Master the freestanding handstand with proper balance practice, strength progressions, 
            and intelligent training structure.
          </p>
        </header>

        {/* Key Principles */}
        <section className="mb-12 bg-[#1C1F26] border border-[#2B313A] rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-[#C1121F]" />
            Key Training Principles
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-white">Frequent Short Practice</h3>
                <p className="text-sm text-[#A4ACB8]">
                  10-15 minutes daily beats 1-hour weekly sessions. Neural adaptation requires frequency.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-white">Quality Over Quantity</h3>
                <p className="text-sm text-[#A4ACB8]">
                  End practice on a good rep. Fatigue degrades balance quality and builds bad habits.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-white">Place Early in Session</h3>
                <p className="text-sm text-[#A4ACB8]">
                  Balance work requires a fresh nervous system. Do it after warmup, before strength.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-white">Separate Balance and Strength</h3>
                <p className="text-sm text-[#A4ACB8]">
                  Handstand balance and HSPU strength are different skills. Train them accordingly.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Progression Overview */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-white mb-6">Progression Overview</h2>
          <div className="space-y-4">
            {[
              {
                level: 'Level 1',
                name: 'Wall Handstand',
                target: '60 seconds',
                description: 'Build shoulder strength and alignment against the wall. Focus on stacked joints and hollow body.',
              },
              {
                level: 'Level 2',
                name: 'Heel Pulls / Kick-Ups',
                target: '10-20 second holds',
                description: 'Practice leaving the wall and finding balance. Develop consistent kick-up technique.',
              },
              {
                level: 'Level 3',
                name: 'Freestanding Hold',
                target: '30 seconds',
                description: 'Reliable freestanding balance with finger corrections. Shape refinement begins.',
              },
              {
                level: 'Level 4',
                name: 'Solid Freestanding',
                target: '60+ seconds',
                description: 'Consistent, relaxed holds. Ready for press-to-handstand and advanced variations.',
              },
            ].map((progression, index) => (
              <div 
                key={index}
                className="bg-[#1C1F26] border border-[#2B313A] rounded-lg p-5"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="text-xs text-[#C1121F] font-medium">{progression.level}</span>
                    <h3 className="text-lg font-semibold text-white">{progression.name}</h3>
                  </div>
                  <span className="text-sm text-[#6B7280]">Target: {progression.target}</span>
                </div>
                <p className="text-sm text-[#A4ACB8]">{progression.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Balance vs Strength */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-white mb-6">Balance Work vs Strength Work</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="bg-[#1C1F26] border border-[#2B313A] rounded-lg p-5">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-400" />
                Balance Practice
              </h3>
              <ul className="space-y-2 text-sm text-[#A4ACB8]">
                <li>• Placed immediately after warmup</li>
                <li>• 10-15 minutes maximum duration</li>
                <li>• Short attempts (under 30 seconds)</li>
                <li>• Full rest between attempts</li>
                <li>• 4-6x per week frequency</li>
                <li>• End on a good rep</li>
              </ul>
            </div>
            <div className="bg-[#1C1F26] border border-[#2B313A] rounded-lg p-5">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-orange-400" />
                Strength Work
              </h3>
              <ul className="space-y-2 text-sm text-[#A4ACB8]">
                <li>• Wall HSPU, pike push-ups, deficit work</li>
                <li>• Can be placed later in session</li>
                <li>• Skip if heavy pushing already programmed</li>
                <li>• Or move to separate session / pull day</li>
                <li>• 2-3x per week frequency</li>
                <li>• Progressive overload applies</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Common Mistakes */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-white mb-6">Common Mistakes</h2>
          <div className="space-y-4">
            {[
              {
                mistake: 'Practicing to failure',
                correction: 'Stop before quality degrades. Fatigue builds bad movement patterns.',
              },
              {
                mistake: 'Long infrequent sessions',
                correction: 'Frequent short practice (10-15 min) beats occasional long sessions.',
              },
              {
                mistake: 'Ignoring wrist prep',
                correction: 'Always warm up wrists before handstand practice.',
              },
              {
                mistake: 'Rushing wall departure',
                correction: 'Master wall alignment before attempting freestanding.',
              },
              {
                mistake: 'Inconsistent kick-up',
                correction: 'Develop one reliable kick-up technique before varying.',
              },
            ].map((item, index) => (
              <div 
                key={index}
                className="flex items-start gap-4 bg-[#1C1F26] border border-[#2B313A] rounded-lg p-4"
              >
                <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-white">{item.mistake}</h3>
                  <p className="text-sm text-[#A4ACB8]">{item.correction}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Sample Week */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-white mb-6">Sample Training Week</h2>
          <div className="bg-[#1C1F26] border border-[#2B313A] rounded-lg overflow-hidden">
            <div className="grid grid-cols-7 text-center text-xs font-medium text-[#6B7280] border-b border-[#2B313A]">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                <div key={day} className="py-2 border-r border-[#2B313A] last:border-r-0">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 text-center text-xs">
              {[
                { balance: true, strength: true },
                { balance: true, strength: false },
                { balance: true, strength: true },
                { balance: true, strength: false },
                { balance: true, strength: true },
                { balance: true, strength: false },
                { balance: false, strength: false },
              ].map((day, i) => (
                <div key={i} className="py-3 border-r border-[#2B313A] last:border-r-0 space-y-1">
                  {day.balance && (
                    <span className="block text-blue-400">Balance</span>
                  )}
                  {day.strength && (
                    <span className="block text-orange-400">Strength</span>
                  )}
                  {!day.balance && !day.strength && (
                    <span className="block text-[#6B7280]">Rest</span>
                  )}
                </div>
              ))}
            </div>
          </div>
          <p className="text-sm text-[#6B7280] mt-3">
            Balance: 10-15 min after warmup | Strength: Wall HSPU or pike progressions on push days
          </p>
        </section>

        {/* Progression Standards Table */}
        <ProgressionTable 
          title="Handstand Progression Standards" 
          levels={progressionLevels} 
        />

        {/* FAQ Section */}
        <FAQ 
          title="Handstand FAQ" 
          faqs={faqs} 
          defaultOpen={[0]} 
        />

        {/* CTA */}
        <section className="bg-gradient-to-r from-[#C1121F]/20 to-[#1C1F26] border border-[#C1121F]/30 rounded-lg p-6 text-center mb-12">
          <h2 className="text-xl font-semibold text-white mb-2">
            Ready to Build Your Handstand?
          </h2>
          <p className="text-[#A4ACB8] mb-4">
            SpartanLab automatically integrates handstand training into your program with proper placement and frequency.
          </p>
          <Link
            href="/programs"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#C1121F] text-white font-medium rounded-lg hover:bg-[#A50E1A] transition-colors"
          >
            Build Your Program
          </Link>
        </section>

        {/* Related Content */}
        {getSkillCluster('handstand') && (
          <RelatedContent 
            cluster={getSkillCluster('handstand')!} 
            title="Continue Your Training"
          />
        )}
      </div>
    </main>
  )
}
