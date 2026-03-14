import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Target, AlertTriangle, CheckCircle, Dumbbell, Clock, Zap } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { BackNav } from '@/components/navigation/BackNav'

export const metadata: Metadata = {
  title: 'One-Arm Pull-Up Training Guide | SpartanLab',
  description: 'Complete guide to achieving the one-arm pull-up. Learn prerequisites, progressions, training structure, support exercises, and common mistakes to avoid.',
  keywords: ['one arm pull up', 'one arm pullup progression', 'unilateral pulling', 'calisthenics strength', 'advanced pull up training'],
  openGraph: {
    title: 'One-Arm Pull-Up Training Guide | SpartanLab',
    description: 'Master the one-arm pull-up with structured progressions and intelligent programming.',
  },
}

export default function OneArmPullUpGuidePage() {
  return (
    <main className="min-h-screen bg-[#0D0F14] text-[#E6E9EF]">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <BackNav />
        
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 text-[#C1121F] text-sm font-medium mb-3">
            <Target className="w-4 h-4" />
            <span>Elite Skills</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            One-Arm Pull-Up Training Guide
          </h1>
          <p className="text-lg text-[#A4ACB8] leading-relaxed">
            The one-arm pull-up is an elite display of unilateral pulling strength. This guide covers 
            the prerequisites, progressive stages, support work, and training structure needed to achieve this skill.
          </p>
        </div>

        {/* Prerequisites Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-[#C1121F]" />
            Prerequisites
          </h2>
          <p className="text-[#A4ACB8] mb-6">
            Before starting one-arm pull-up training, you need a solid foundation. Attempting this skill 
            without adequate preparation increases injury risk and slows progress.
          </p>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="bg-[#1C1F26] border-[#2B313A] p-5">
              <h3 className="font-semibold text-white mb-2">Pulling Strength</h3>
              <ul className="space-y-2 text-sm text-[#A4ACB8]">
                <li className="flex items-start gap-2">
                  <span className="text-[#C1121F] mt-0.5">&#10003;</span>
                  15+ strict pull-ups
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#C1121F] mt-0.5">&#10003;</span>
                  Weighted pull-up at +50% bodyweight (5 reps)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#C1121F] mt-0.5">&#10003;</span>
                  OR +75% bodyweight for 1 rep
                </li>
              </ul>
            </Card>
            
            <Card className="bg-[#1C1F26] border-[#2B313A] p-5">
              <h3 className="font-semibold text-white mb-2">Grip & Stability</h3>
              <ul className="space-y-2 text-sm text-[#A4ACB8]">
                <li className="flex items-start gap-2">
                  <span className="text-[#C1121F] mt-0.5">&#10003;</span>
                  20+ second single-arm dead hang (each arm)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#C1121F] mt-0.5">&#10003;</span>
                  Strong scapular depression under load
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#C1121F] mt-0.5">&#10003;</span>
                  8+ archer pull-ups each side
                </li>
              </ul>
            </Card>
          </div>
          
          <Card className="bg-[#C1121F]/10 border-[#C1121F]/30 p-4 mt-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-[#C1121F] flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-white mb-1">Important</h4>
                <p className="text-sm text-[#A4ACB8]">
                  One-arm pulling places significant stress on the elbow and bicep tendons. Ensure you have 
                  at least 8 weeks of progressive weighted pulling before attempting unilateral work. Progress 
                  gradually and stop if you experience sharp pain.
                </p>
              </div>
            </div>
          </Card>
        </section>

        {/* Progression Stages */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <Zap className="w-6 h-6 text-[#C1121F]" />
            Progression Stages
          </h2>
          
          <div className="space-y-4">
            {[
              {
                stage: 1,
                name: 'Archer Pull-Ups',
                description: 'Wide grip pull-up pulling to one side while keeping the other arm straight',
                target: '8+ reps each side',
                cues: ['Assisting arm stays straight', 'Full range of motion', 'Alternate sides each set'],
              },
              {
                stage: 2,
                name: 'Typewriter Pull-Ups',
                description: 'Pull to top position then traverse side to side while maintaining height',
                target: '6+ traverses each direction',
                cues: ['Keep chin above bar during traverse', 'Control the movement', 'Complete range'],
              },
              {
                stage: 3,
                name: 'Assisted One-Arm Pull-Ups',
                description: 'Single arm pull with band or minimal finger assistance',
                target: '5+ reps each arm with light assistance',
                cues: ['Minimal assistance', 'Anti-rotation core engagement', 'Full range maintained'],
              },
              {
                stage: 4,
                name: 'One-Arm Negatives',
                description: 'Controlled one-arm lowering from top position',
                target: '6+ second controlled negatives each arm',
                cues: ['5-8 second descent', 'Resist rotation throughout', 'Full extension at bottom'],
              },
              {
                stage: 5,
                name: 'Partial One-Arm Pull-Ups',
                description: 'Single arm pulling through reduced range of motion',
                target: '3+ reps each arm from 90-degree position',
                cues: ['Start from bent arm', 'Gradually increase range', 'Control throughout'],
              },
              {
                stage: 6,
                name: 'Full One-Arm Pull-Up',
                description: 'Complete pull-up using only one arm',
                target: 'Achieved',
                cues: ['Dead hang start', 'Core prevents rotation', 'Chin clears bar', 'Controlled descent'],
              },
            ].map((progression) => (
              <Card key={progression.stage} className="bg-[#1C1F26] border-[#2B313A] p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#C1121F]/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-[#C1121F] font-bold">{progression.stage}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-1">{progression.name}</h3>
                    <p className="text-sm text-[#A4ACB8] mb-3">{progression.description}</p>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div>
                        <span className="text-[#6B7280]">Target: </span>
                        <span className="text-[#C1121F]">{progression.target}</span>
                      </div>
                    </div>
                    <div className="mt-3">
                      <span className="text-xs text-[#6B7280]">Key cues:</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {progression.cues.map((cue, i) => (
                          <span key={i} className="text-xs px-2 py-1 bg-[#2B313A] rounded text-[#A4ACB8]">
                            {cue}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Support Exercises */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <Dumbbell className="w-6 h-6 text-[#C1121F]" />
            Support Exercises
          </h2>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="bg-[#1C1F26] border-[#2B313A] p-5">
              <h3 className="font-semibold text-white mb-3">Essential</h3>
              <ul className="space-y-3 text-sm">
                <li className="text-[#A4ACB8]">
                  <span className="text-white">Weighted Pull-Ups</span>
                  <br />4-6 x 3-5 @ +50-75% BW, 2-3x/week
                </li>
                <li className="text-[#A4ACB8]">
                  <span className="text-white">Single-Arm Dead Hang</span>
                  <br />3-4 x max hold each arm, 3x/week
                </li>
                <li className="text-[#A4ACB8]">
                  <span className="text-white">Archer Pull-Ups</span>
                  <br />4-5 x 4-6 each side, 2x/week
                </li>
              </ul>
            </Card>
            
            <Card className="bg-[#1C1F26] border-[#2B313A] p-5">
              <h3 className="font-semibold text-white mb-3">Recommended</h3>
              <ul className="space-y-3 text-sm">
                <li className="text-[#A4ACB8]">
                  <span className="text-white">Lockoff Holds</span>
                  <br />3-4 x 5-10s each position, 2x/week
                </li>
                <li className="text-[#A4ACB8]">
                  <span className="text-white">Core Anti-Rotation</span>
                  <br />Pallof press 3-4 x 8-12, 2-3x/week
                </li>
                <li className="text-[#A4ACB8]">
                  <span className="text-white">Towel Pull-Ups</span>
                  <br />3-4 x 5-8 for grip, 1-2x/week
                </li>
              </ul>
            </Card>
          </div>
        </section>

        {/* Training Structure */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <Clock className="w-6 h-6 text-[#C1121F]" />
            Training Structure
          </h2>
          
          <Card className="bg-[#1C1F26] border-[#2B313A] p-6">
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-white mb-2">Frequency</h3>
                <p className="text-[#A4ACB8]">
                  2-3 sessions per week with at least 48 hours between sessions. One-arm pulling is 
                  neurologically demanding and requires adequate recovery.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-white mb-2">Session Structure</h3>
                <ol className="space-y-2 text-[#A4ACB8]">
                  <li>1. Warm-up with shoulder mobility and light pulling (5 min)</li>
                  <li>2. Specific prep - active hangs, scapular pulls (3-5 min)</li>
                  <li>3. One-arm progression work - primary focus (15-20 min)</li>
                  <li>4. Support strength - weighted pulls or rows (10-15 min)</li>
                  <li>5. Grip and accessory work (5-10 min)</li>
                </ol>
              </div>
              
              <div>
                <h3 className="font-semibold text-white mb-2">Sample Week</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="bg-[#2B313A] rounded p-3">
                    <span className="text-white font-medium">Day 1</span>
                    <p className="text-sm text-[#A4ACB8] mt-1">
                      OAP progression + Weighted pulls + Grip
                    </p>
                  </div>
                  <div className="bg-[#2B313A] rounded p-3">
                    <span className="text-white font-medium">Day 2</span>
                    <p className="text-sm text-[#A4ACB8] mt-1">
                      Rest or light upper body
                    </p>
                  </div>
                  <div className="bg-[#2B313A] rounded p-3">
                    <span className="text-white font-medium">Day 3</span>
                    <p className="text-sm text-[#A4ACB8] mt-1">
                      OAP progression + Rows + Core
                    </p>
                  </div>
                  <div className="bg-[#2B313A] rounded p-3">
                    <span className="text-white font-medium">Day 4</span>
                    <p className="text-sm text-[#A4ACB8] mt-1">
                      Rest or pushing work
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Common Mistakes */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Common Mistakes</h2>
          
          <div className="space-y-4">
            {[
              {
                mistake: 'Progressing too quickly',
                fix: 'Spend adequate time at each stage. Tendon adaptation takes longer than muscle adaptation.',
              },
              {
                mistake: 'Neglecting weighted pull-up base',
                fix: 'Maintain and build weighted pulling strength alongside unilateral work.',
              },
              {
                mistake: 'Ignoring arm imbalances',
                fix: 'Always start sets with your weaker arm and match volume between sides.',
              },
              {
                mistake: 'Poor eccentric control',
                fix: 'Control the negative phase of every rep. This builds strength and protects tendons.',
              },
              {
                mistake: 'Excessive rotation',
                fix: 'Engage core throughout to prevent spinning. Anti-rotation work is essential.',
              },
            ].map((item, i) => (
              <Card key={i} className="bg-[#1C1F26] border-[#2B313A] p-4">
                <div className="flex items-start gap-3">
                  <span className="text-[#C1121F] font-bold">&#10005;</span>
                  <div>
                    <span className="text-white">{item.mistake}</span>
                    <p className="text-sm text-[#A4ACB8] mt-1">{item.fix}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA */}
        <Card className="bg-gradient-to-r from-[#C1121F]/20 to-[#780000]/20 border-[#C1121F]/30 p-6 text-center">
          <h3 className="text-xl font-bold text-white mb-2">Ready to Start Training?</h3>
          <p className="text-[#A4ACB8] mb-4">
            Get a personalized program that builds toward the one-arm pull-up with proper progression and support work.
          </p>
          <Link 
            href="/generate-program" 
            className="inline-flex items-center gap-2 bg-[#C1121F] hover:bg-[#A10E1A] text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Generate Your Program
          </Link>
        </Card>
      </div>
    </main>
  )
}
