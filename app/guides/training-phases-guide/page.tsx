import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, GraduationCap, ArrowRight, RefreshCw, TrendingUp, Calendar, CheckCircle, AlertTriangle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BackNav } from '@/components/navigation/BackNav'

export const metadata: Metadata = {
  title: 'How to Structure Training Phases | SpartanLab',
  description: 'Learn how to transition between skill, strength, and hypertrophy cycles for long-term calisthenics progress. Complete periodization guide.',
  keywords: ['calisthenics periodization', 'training phases', 'program design', 'long-term progress calisthenics', 'training cycle transitions'],
}

export default function TrainingPhasesGuidePage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <BackNav href="/guides" label="Guides" />

        <article className="prose prose-invert max-w-none">
          <header className="mb-12 not-prose">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <GraduationCap className="w-4 h-4" />
              <span>Programming</span>
              <span className="mx-2">•</span>
              <span>12 min read</span>
            </div>
            <h1 className="text-4xl font-bold mb-4">How to Structure Training Phases</h1>
            <p className="text-xl text-muted-foreground">
              Move beyond random workouts with periodized training that builds skills, strength, and muscle systematically.
            </p>
          </header>

          {/* Why Periodization */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-primary" />
              Why Training in Phases?
            </h2>
            <p className="text-muted-foreground mb-6">
              Your body adapts best when training focuses on specific qualities for dedicated periods. Trying to maximize everything simultaneously leads to mediocre results in all areas.
            </p>
            
            <div className="grid gap-4 md:grid-cols-2 mb-6">
              <Card className="p-5 bg-card/50 border-border">
                <h3 className="font-semibold text-green-400 mb-3">Benefits of Periodization</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Focused adaptation to specific stimuli</li>
                  <li>• Prevents plateaus through variation</li>
                  <li>• Manages fatigue accumulation</li>
                  <li>• Allows for strategic peaking</li>
                  <li>• Sustainable long-term progress</li>
                </ul>
              </Card>
              
              <Card className="p-5 bg-card/50 border-border">
                <h3 className="font-semibold text-red-400 mb-3">Problems Without Periodization</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Stagnation after initial gains</li>
                  <li>• Overtraining or undertraining</li>
                  <li>• Conflicting training signals</li>
                  <li>• No clear progress direction</li>
                  <li>• Frustration and inconsistency</li>
                </ul>
              </Card>
            </div>
          </section>

          {/* The Four Main Cycle Types */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-primary" />
              The Four Main Cycle Types
            </h2>
            
            <div className="space-y-6">
              <Card className="p-6 bg-card/50 border-border">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-semibold text-lg">Skill Cycle</h3>
                  <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">6-8 weeks</span>
                </div>
                <p className="text-muted-foreground text-sm mb-4">
                  Prioritizes movement pattern development. High frequency skill exposure with controlled fatigue.
                </p>
                <div className="grid gap-2 sm:grid-cols-3 text-xs">
                  <div className="bg-muted/50 p-2 rounded">
                    <span className="text-muted-foreground">Volume Focus</span>
                    <p className="font-semibold">Skill Work 45%</p>
                  </div>
                  <div className="bg-muted/50 p-2 rounded">
                    <span className="text-muted-foreground">Intensity</span>
                    <p className="font-semibold">Moderate</p>
                  </div>
                  <div className="bg-muted/50 p-2 rounded">
                    <span className="text-muted-foreground">Best For</span>
                    <p className="font-semibold">Learning Skills</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-card/50 border-border">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-semibold text-lg">Strength Cycle</h3>
                  <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">6-8 weeks</span>
                </div>
                <p className="text-muted-foreground text-sm mb-4">
                  Prioritizes progressive overload and neural adaptations. Low reps, high intensity, long rest.
                </p>
                <div className="grid gap-2 sm:grid-cols-3 text-xs">
                  <div className="bg-muted/50 p-2 rounded">
                    <span className="text-muted-foreground">Volume Focus</span>
                    <p className="font-semibold">Strength Work 70%</p>
                  </div>
                  <div className="bg-muted/50 p-2 rounded">
                    <span className="text-muted-foreground">Intensity</span>
                    <p className="font-semibold">High</p>
                  </div>
                  <div className="bg-muted/50 p-2 rounded">
                    <span className="text-muted-foreground">Best For</span>
                    <p className="font-semibold">Max Strength</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-card/50 border-border">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-semibold text-lg">Hypertrophy Cycle</h3>
                  <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">6 weeks</span>
                </div>
                <p className="text-muted-foreground text-sm mb-4">
                  Prioritizes muscle growth and structural development. Moderate-high volume with controlled tempo.
                </p>
                <div className="grid gap-2 sm:grid-cols-3 text-xs">
                  <div className="bg-muted/50 p-2 rounded">
                    <span className="text-muted-foreground">Volume Focus</span>
                    <p className="font-semibold">Hypertrophy 65%</p>
                  </div>
                  <div className="bg-muted/50 p-2 rounded">
                    <span className="text-muted-foreground">Intensity</span>
                    <p className="font-semibold">Moderate</p>
                  </div>
                  <div className="bg-muted/50 p-2 rounded">
                    <span className="text-muted-foreground">Best For</span>
                    <p className="font-semibold">Building Muscle</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-card/50 border-border">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-semibold text-lg">Endurance Cycle</h3>
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">6 weeks</span>
                </div>
                <p className="text-muted-foreground text-sm mb-4">
                  Prioritizes work capacity and fatigue tolerance. High reps, shorter rest, conditioning focus.
                </p>
                <div className="grid gap-2 sm:grid-cols-3 text-xs">
                  <div className="bg-muted/50 p-2 rounded">
                    <span className="text-muted-foreground">Volume Focus</span>
                    <p className="font-semibold">Endurance 50%</p>
                  </div>
                  <div className="bg-muted/50 p-2 rounded">
                    <span className="text-muted-foreground">Intensity</span>
                    <p className="font-semibold">Low-Moderate</p>
                  </div>
                  <div className="bg-muted/50 p-2 rounded">
                    <span className="text-muted-foreground">Best For</span>
                    <p className="font-semibold">Max Reps / Tests</p>
                  </div>
                </div>
              </Card>
            </div>
          </section>

          {/* Common Phase Sequences */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
              <RefreshCw className="w-6 h-6 text-primary" />
              Common Phase Sequences
            </h2>
            
            <div className="space-y-6">
              <Card className="p-6 bg-card/50 border-border">
                <h3 className="font-semibold text-lg mb-4">Classic Skill Development Path</h3>
                <div className="flex items-center gap-2 flex-wrap text-sm mb-4">
                  <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded">Hypertrophy</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded">Strength</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  <span className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded">Skill</span>
                </div>
                <p className="text-muted-foreground text-sm">
                  Build the muscle first, then express it as strength, then apply that strength to skills. This is the most effective path for most people learning advanced movements.
                </p>
              </Card>

              <Card className="p-6 bg-card/50 border-border">
                <h3 className="font-semibold text-lg mb-4">Skill Plateau Breaker</h3>
                <div className="flex items-center gap-2 flex-wrap text-sm mb-4">
                  <span className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded">Skill</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded">Hypertrophy</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  <span className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded">Skill</span>
                </div>
                <p className="text-muted-foreground text-sm">
                  When stuck on a skill, sometimes you need more muscle. A hypertrophy phase builds structural support, then you return to skill work with new capacity.
                </p>
              </Card>

              <Card className="p-6 bg-card/50 border-border">
                <h3 className="font-semibold text-lg mb-4">Competition Preparation</h3>
                <div className="flex items-center gap-2 flex-wrap text-sm mb-4">
                  <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded">Strength</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded">Peak</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  <span className="bg-gray-500/20 text-gray-400 px-3 py-1 rounded">Deload</span>
                </div>
                <p className="text-muted-foreground text-sm">
                  For streetlifting or max testing. Build strength, then taper volume while maintaining intensity to peak for the event, then recover fully.
                </p>
              </Card>

              <Card className="p-6 bg-card/50 border-border">
                <h3 className="font-semibold text-lg mb-4">Endurance to Strength</h3>
                <div className="flex items-center gap-2 flex-wrap text-sm mb-4">
                  <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded">Endurance</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded">Strength</span>
                </div>
                <p className="text-muted-foreground text-sm">
                  Convert work capacity into strength gains. The endurance phase builds tolerance, the strength phase uses that base to push heavier loads.
                </p>
              </Card>
            </div>
          </section>

          {/* Managing Transitions */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Managing Transitions</h2>
            
            <div className="space-y-4">
              <Card className="p-5 bg-card/50 border-border">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Use Transition Weeks</h3>
                    <p className="text-muted-foreground text-sm">
                      When changing emphasis dramatically (e.g., hypertrophy to strength), add a 1-week transition with moderate volume to let your body adapt.
                    </p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-5 bg-card/50 border-border">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Maintain Other Qualities</h3>
                    <p className="text-muted-foreground text-sm">
                      During a focused phase, include minimal maintenance work for other qualities. Skill during strength cycles, strength during skill cycles.
                    </p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-5 bg-card/50 border-border">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Listen to Recovery Signals</h3>
                    <p className="text-muted-foreground text-sm">
                      If you feel run down, insert a deload week. Forced deloads every 4-6 weeks are standard, but listen to your body.
                    </p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-5 bg-card/50 border-border">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Track Phase-Appropriate Metrics</h3>
                    <p className="text-muted-foreground text-sm">
                      During strength cycles, track loads. During skill cycles, track hold times. During hypertrophy, track rep progression at given weights.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </section>

          {/* Common Mistakes */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-yellow-500" />
              Common Mistakes
            </h2>
            
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="p-5 bg-card/50 border-border border-yellow-500/20">
                <h3 className="font-semibold text-yellow-400 mb-2">Switching Too Often</h3>
                <p className="text-muted-foreground text-sm">
                  Phases need 4-8 weeks minimum for adaptation. Switching weekly prevents meaningful progress.
                </p>
              </Card>
              
              <Card className="p-5 bg-card/50 border-border border-yellow-500/20">
                <h3 className="font-semibold text-yellow-400 mb-2">Doing Everything Always</h3>
                <p className="text-muted-foreground text-sm">
                  Trying to maximize strength, skill, and endurance simultaneously dilutes all results.
                </p>
              </Card>
              
              <Card className="p-5 bg-card/50 border-border border-yellow-500/20">
                <h3 className="font-semibold text-yellow-400 mb-2">Skipping Deloads</h3>
                <p className="text-muted-foreground text-sm">
                  Fatigue accumulates. Without strategic recovery weeks, performance declines and injury risk increases.
                </p>
              </Card>
              
              <Card className="p-5 bg-card/50 border-border border-yellow-500/20">
                <h3 className="font-semibold text-yellow-400 mb-2">Wrong Phase for Goals</h3>
                <p className="text-muted-foreground text-sm">
                  If you want max strength, dont run endless endurance phases. Match your phase to your priority.
                </p>
              </Card>
            </div>
          </section>

          {/* Sample Year Plan */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Sample Year Plan</h2>
            <p className="text-muted-foreground mb-6">
              Example periodization for someone building toward a front lever:
            </p>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-4 p-3 bg-blue-500/10 rounded">
                <span className="font-mono w-24">Jan-Feb</span>
                <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-xs">Hypertrophy</span>
                <span className="text-muted-foreground">Build back and pulling muscle</span>
              </div>
              <div className="flex items-center gap-4 p-3 bg-red-500/10 rounded">
                <span className="font-mono w-24">Mar-Apr</span>
                <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded text-xs">Strength</span>
                <span className="text-muted-foreground">Heavy weighted pulls</span>
              </div>
              <div className="flex items-center gap-4 p-3 bg-purple-500/10 rounded">
                <span className="font-mono w-24">May-Jun</span>
                <span className="bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded text-xs">Skill</span>
                <span className="text-muted-foreground">Front lever progression focus</span>
              </div>
              <div className="flex items-center gap-4 p-3 bg-gray-500/10 rounded">
                <span className="font-mono w-24">July</span>
                <span className="bg-gray-500/20 text-gray-400 px-2 py-0.5 rounded text-xs">Deload</span>
                <span className="text-muted-foreground">Active recovery</span>
              </div>
              <div className="flex items-center gap-4 p-3 bg-blue-500/10 rounded">
                <span className="font-mono w-24">Aug-Sep</span>
                <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-xs">Hypertrophy</span>
                <span className="text-muted-foreground">Address weak points</span>
              </div>
              <div className="flex items-center gap-4 p-3 bg-purple-500/10 rounded">
                <span className="font-mono w-24">Oct-Nov</span>
                <span className="bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded text-xs">Skill</span>
                <span className="text-muted-foreground">Push for full front lever</span>
              </div>
              <div className="flex items-center gap-4 p-3 bg-green-500/10 rounded">
                <span className="font-mono w-24">Dec</span>
                <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded text-xs">Mixed</span>
                <span className="text-muted-foreground">Maintain and recover</span>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="not-prose">
            <Card className="p-8 bg-primary/10 border-primary/20 text-center">
              <h2 className="text-2xl font-bold mb-3">Let SpartanLab Structure Your Training</h2>
              <p className="text-muted-foreground mb-6">
                Our coaching engine automatically applies periodization principles based on your goals and progress.
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
