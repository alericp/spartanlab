import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Brain, Target, Clock, Dumbbell, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BackNav } from '@/components/navigation/BackNav'

export const metadata: Metadata = {
  title: 'Calisthenics Skill Cycles | SpartanLab',
  description: 'Learn how to structure skill-focused training cycles for planche, front lever, handstand, and muscle-up development. Complete guide to periodized skill training.',
  keywords: ['calisthenics skill cycle', 'planche training cycle', 'front lever program', 'handstand training structure', 'skill periodization'],
}

export default function SkillCyclesGuidePage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <BackNav href="/guides" label="Guides" />

        <article className="prose prose-invert max-w-none">
          <header className="mb-12 not-prose">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Brain className="w-4 h-4" />
              <span>Programming</span>
              <span className="mx-2">•</span>
              <span>10 min read</span>
            </div>
            <h1 className="text-4xl font-bold mb-4">Calisthenics Skill Cycles</h1>
            <p className="text-xl text-muted-foreground">
              Structure your skill-focused training for planche, front lever, handstand, and muscle-up development with periodized skill cycles.
            </p>
          </header>

          {/* What is a Skill Cycle */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
              <Target className="w-6 h-6 text-primary" />
              What is a Skill Cycle?
            </h2>
            <p className="text-muted-foreground mb-6">
              A skill cycle is a focused training phase that prioritizes movement pattern development over strength or muscle gains. The goal is to maximize skill exposure while managing fatigue to preserve motor learning quality.
            </p>
            
            <Card className="p-6 bg-card/50 border-border mb-6">
              <h3 className="font-semibold mb-4">Key Characteristics</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    <strong className="text-foreground">High skill exposure</strong> - Frequent practice of the target movement pattern
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    <strong className="text-foreground">Moderate support strength</strong> - Enough to maintain foundation without interference
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    <strong className="text-foreground">Low fatigue accumulation</strong> - Protect motor learning quality
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    <strong className="text-foreground">Technique repetition</strong> - Quality over quantity approach
                  </span>
                </li>
              </ul>
            </Card>
          </section>

          {/* When to Use Skill Cycles */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
              <Clock className="w-6 h-6 text-primary" />
              When to Use Skill Cycles
            </h2>
            
            <div className="grid gap-4 md:grid-cols-2 mb-6">
              <Card className="p-5 bg-card/50 border-border">
                <h3 className="font-semibold text-green-400 mb-3">Good Times for Skill Cycles</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Learning a new skill (planche, front lever, handstand)</li>
                  <li>• Breaking through a skill plateau</li>
                  <li>• Technique needs refinement</li>
                  <li>• After building a strength base</li>
                  <li>• When you have consistent training time</li>
                </ul>
              </Card>
              
              <Card className="p-5 bg-card/50 border-border">
                <h3 className="font-semibold text-yellow-400 mb-3">Not Ideal Times</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Lacking prerequisite strength</li>
                  <li>• During high life stress periods</li>
                  <li>• When recovery is compromised</li>
                  <li>• If joint issues are present</li>
                  <li>• When building muscle is priority</li>
                </ul>
              </Card>
            </div>
          </section>

          {/* Skill Cycle Structure */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
              <Dumbbell className="w-6 h-6 text-primary" />
              Skill Cycle Structure
            </h2>
            
            <Card className="p-6 bg-card/50 border-border mb-6">
              <h3 className="font-semibold mb-4">Typical Parameters</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Duration</p>
                  <p className="font-semibold">6-8 weeks</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Frequency</p>
                  <p className="font-semibold">3-5 sessions/week</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Session Length</p>
                  <p className="font-semibold">45-75 minutes</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Skill Work Volume</p>
                  <p className="font-semibold">40-60% of session</p>
                </div>
              </div>
            </Card>

            <h3 className="text-xl font-semibold mb-4">Volume Distribution</h3>
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-4">
                <span className="text-sm w-32">Skill Work</span>
                <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                  <div className="bg-primary h-full" style={{ width: '45%' }} />
                </div>
                <span className="text-sm font-mono w-12">45%</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm w-32">Support Strength</span>
                <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                  <div className="bg-blue-500 h-full" style={{ width: '35%' }} />
                </div>
                <span className="text-sm font-mono w-12">35%</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm w-32">Hypertrophy</span>
                <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                  <div className="bg-purple-500 h-full" style={{ width: '10%' }} />
                </div>
                <span className="text-sm font-mono w-12">10%</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm w-32">Mobility</span>
                <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                  <div className="bg-green-500 h-full" style={{ width: '10%' }} />
                </div>
                <span className="text-sm font-mono w-12">10%</span>
              </div>
            </div>
          </section>

          {/* Skill-Specific Cycles */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Skill-Specific Cycles</h2>
            
            <div className="space-y-6">
              {/* Planche */}
              <Card className="p-6 bg-card/50 border-border">
                <h3 className="font-semibold text-lg mb-3">Planche Skill Cycle</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Focus on positional strength and lean mechanics with high frequency exposure.
                </p>
                <div className="grid gap-4 sm:grid-cols-2 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">Key Exercises</p>
                    <ul className="text-foreground">
                      <li>• Planche leans</li>
                      <li>• Tuck planche holds</li>
                      <li>• Pseudo planche push-ups</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Session Placement</p>
                    <p className="text-foreground">First after warm-up, when fresh</p>
                    <p className="text-muted-foreground mt-2 mb-1">Rest Periods</p>
                    <p className="text-foreground">2-3 minutes between sets</p>
                  </div>
                </div>
              </Card>

              {/* Front Lever */}
              <Card className="p-6 bg-card/50 border-border">
                <h3 className="font-semibold text-lg mb-3">Front Lever Skill Cycle</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Emphasize scapular depression and bodyline control with pulling support.
                </p>
                <div className="grid gap-4 sm:grid-cols-2 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">Key Exercises</p>
                    <ul className="text-foreground">
                      <li>• Front lever holds</li>
                      <li>• Front lever raises</li>
                      <li>• Ice cream makers</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Session Placement</p>
                    <p className="text-foreground">Early in session</p>
                    <p className="text-muted-foreground mt-2 mb-1">Rest Periods</p>
                    <p className="text-foreground">2-3 minutes between sets</p>
                  </div>
                </div>
              </Card>

              {/* Handstand */}
              <Card className="p-6 bg-card/50 border-border">
                <h3 className="font-semibold text-lg mb-3">Handstand Skill Cycle</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  High frequency balance practice with short, focused sessions.
                </p>
                <div className="grid gap-4 sm:grid-cols-2 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">Key Exercises</p>
                    <ul className="text-foreground">
                      <li>• Wall handstand holds</li>
                      <li>• Kick-up practice</li>
                      <li>• Heel pulls from wall</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Session Structure</p>
                    <p className="text-foreground">10-15 min daily practice</p>
                    <p className="text-muted-foreground mt-2 mb-1">Frequency</p>
                    <p className="text-foreground">5-7 days/week</p>
                  </div>
                </div>
              </Card>

              {/* Muscle-Up */}
              <Card className="p-6 bg-card/50 border-border">
                <h3 className="font-semibold text-lg mb-3">Muscle-Up Skill Cycle</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Focus on transition timing and explosive pulling coordination.
                </p>
                <div className="grid gap-4 sm:grid-cols-2 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">Key Exercises</p>
                    <ul className="text-foreground">
                      <li>• Explosive pull-ups</li>
                      <li>• Transition drills</li>
                      <li>• High pulls</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Session Placement</p>
                    <p className="text-foreground">First exercise after warm-up</p>
                    <p className="text-muted-foreground mt-2 mb-1">Frequency</p>
                    <p className="text-foreground">3-4 sessions/week</p>
                  </div>
                </div>
              </Card>
            </div>
          </section>

          {/* Key Principles */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-primary" />
              Key Principles
            </h2>
            
            <div className="space-y-4">
              <Card className="p-5 bg-card/50 border-border">
                <h3 className="font-semibold mb-2">1. Skill Work When Fresh</h3>
                <p className="text-muted-foreground text-sm">
                  Always perform skill work at the beginning of your session after warm-up. Neural fatigue degrades motor learning quality.
                </p>
              </Card>
              
              <Card className="p-5 bg-card/50 border-border">
                <h3 className="font-semibold mb-2">2. Quality Over Quantity</h3>
                <p className="text-muted-foreground text-sm">
                  Stop sets before form breaks down. A clean 5-second hold teaches more than a shaky 8-second hold.
                </p>
              </Card>
              
              <Card className="p-5 bg-card/50 border-border">
                <h3 className="font-semibold mb-2">3. Frequent Short Exposures</h3>
                <p className="text-muted-foreground text-sm">
                  Multiple shorter sessions often outperform fewer longer sessions for skill acquisition.
                </p>
              </Card>
              
              <Card className="p-5 bg-card/50 border-border">
                <h3 className="font-semibold mb-2">4. Support the Skill</h3>
                <p className="text-muted-foreground text-sm">
                  Include strength work that directly supports your skill goal. For planche, include pushing; for front lever, include pulling.
                </p>
              </Card>
            </div>
          </section>

          {/* What Comes Next */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
              <ArrowRight className="w-6 h-6 text-primary" />
              What Comes Next?
            </h2>
            <p className="text-muted-foreground mb-6">
              After completing a skill cycle, consider transitioning to:
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="p-4 bg-card/50 border-border text-center">
                <h4 className="font-semibold mb-2">Strength Cycle</h4>
                <p className="text-xs text-muted-foreground">Build raw strength to support further skill progress</p>
              </Card>
              <Card className="p-4 bg-card/50 border-border text-center">
                <h4 className="font-semibold mb-2">Hypertrophy Cycle</h4>
                <p className="text-xs text-muted-foreground">Add muscle mass to provide structural support</p>
              </Card>
              <Card className="p-4 bg-card/50 border-border text-center">
                <h4 className="font-semibold mb-2">Mixed Cycle</h4>
                <p className="text-xs text-muted-foreground">Maintain skill while developing other qualities</p>
              </Card>
            </div>
          </section>

          {/* CTA */}
          <section className="not-prose">
            <Card className="p-8 bg-primary/10 border-primary/20 text-center">
              <h2 className="text-2xl font-bold mb-3">Ready to Start a Skill Cycle?</h2>
              <p className="text-muted-foreground mb-6">
                SpartanLab automatically structures your training based on your skill goals and current level.
              </p>
              <Link href="/onboarding">
                <Button size="lg" className="gap-2">
                  Build Your Program
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </Card>
          </section>
        </article>
      </div>
    </main>
  )
}
