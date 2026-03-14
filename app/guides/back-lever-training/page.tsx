import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, AlertTriangle, Target, Dumbbell, Clock, Calendar, ChevronRight, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export const metadata: Metadata = {
  title: 'Back Lever Training Guide | SpartanLab',
  description: 'Complete guide to back lever development. Learn the progression from german hang to full back lever with proper mobility work, support exercises, and programming.',
  keywords: ['back lever', 'back lever progression', 'back lever training', 'calisthenics back lever', 'how to back lever'],
}

export default function BackLeverTrainingGuidePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Navigation */}
        <Link href="/guides" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Guides
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="secondary">Skill Progression</Badge>
            <Badge variant="outline">Straight-Arm</Badge>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-3">Back Lever Training Guide</h1>
          <p className="text-lg text-muted-foreground">
            Complete guide to back lever development. From german hang mobility to full back lever holds with proper progression and tendon safety.
          </p>
          <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> 12 min read</span>
            <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Updated March 2026</span>
          </div>
        </div>

        {/* What is Back Lever */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">What is the Back Lever?</h2>
          <p className="text-muted-foreground mb-4">
            The back lever is a straight-arm gymnastics hold where the body is held horizontal with the face pointing down. 
            Unlike the front lever which uses pulling mechanics, the back lever demands significant shoulder extension mobility 
            and places unique demands on the bicep tendons.
          </p>
          <p className="text-muted-foreground mb-4">
            The back lever complements front lever development and builds shoulder extension strength that transfers to many 
            other skills. It's often easier to achieve than the front lever for athletes with good shoulder mobility, but 
            requires careful progression to protect the bicep tendons.
          </p>
        </section>

        {/* Prerequisites */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">Prerequisites</h2>
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Bicep Tendon Safety</AlertTitle>
            <AlertDescription>
              Back lever places significant stress on the bicep tendons. Never train through discomfort in this area. 
              Build mobility gradually and respect tendon adaptation timelines.
            </AlertDescription>
          </Alert>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Required
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>German hang 30 seconds (comfortable)</li>
                  <li>5 controlled skin the cats</li>
                  <li>Hollow body hold 30 seconds</li>
                  <li>No bicep tendon discomfort</li>
                  <li>Basic ring or bar access</li>
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-500" />
                  Helpful
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>Front lever tuck hold 10 seconds</li>
                  <li>L-sit hold 15 seconds</li>
                  <li>Ring support hold 30 seconds</li>
                  <li>8+ strict pull-ups</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Progression Ladder */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">Back Lever Progression</h2>
          <p className="text-muted-foreground mb-6">
            Progress through each stage before moving forward. Quality and comfort take priority over speed.
          </p>
          
          <div className="space-y-4">
            {[
              {
                stage: 'Foundation',
                exercises: ['German Hang Holds', 'Skin the Cat', 'Inverted Hang', 'Ring Support'],
                target: 'German hang 30s, 5 skin the cats',
                duration: '2-4 weeks',
                notes: 'Build mobility and tendon tolerance. Do not rush this stage.',
              },
              {
                stage: 'Tuck Back Lever',
                exercises: ['Tuck Back Lever Holds', 'Partial Back Lever', 'German Hang'],
                target: 'Tuck back lever 20 seconds',
                duration: '3-6 weeks',
                notes: 'Knees tightly tucked. Arms completely straight. Horizontal body.',
              },
              {
                stage: 'Advanced Tuck',
                exercises: ['Advanced Tuck Holds', 'Back Lever Negatives', 'Band Assisted Work'],
                target: 'Advanced tuck 15 seconds',
                duration: '4-8 weeks',
                notes: 'Open hip angle while keeping shins tucked. Maintain flat back.',
              },
              {
                stage: 'Straddle Back Lever',
                exercises: ['One Leg Back Lever', 'Straddle Holds', 'Negatives'],
                target: 'Straddle back lever 12 seconds',
                duration: '4-8 weeks',
                notes: 'Wide straddle reduces leverage. Keep legs at or above horizontal.',
              },
              {
                stage: 'Full Back Lever',
                exercises: ['Full Back Lever Holds', 'Extended Holds', 'Dynamic Variations'],
                target: 'Full back lever 10+ seconds',
                duration: '6-12+ weeks',
                notes: 'Legs together, body horizontal, perfect form. Build duration gradually.',
              },
            ].map((level, index) => (
              <Card key={level.stage}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-bold">
                        {index + 1}
                      </span>
                      {level.stage}
                    </CardTitle>
                    <Badge variant="outline">{level.duration}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Key Exercises</p>
                      <div className="flex flex-wrap gap-1">
                        {level.exercises.map(ex => (
                          <Badge key={ex} variant="secondary" className="text-xs">{ex}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Target</p>
                      <p className="text-sm">{level.target}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Notes</p>
                      <p className="text-sm text-muted-foreground">{level.notes}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Support Exercises */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">Essential Support Exercises</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">German Hang Holds</CardTitle>
                <CardDescription>Primary mobility work</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  3-5 sets of 20-45 seconds. Build shoulder extension mobility and bicep tendon tolerance.
                </p>
                <Badge variant="outline" className="text-xs">Daily or every session</Badge>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Skin the Cat</CardTitle>
                <CardDescription>Dynamic mobility and control</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  3-4 sets of 3-5 reps. Control throughout the full range. Don't rush.
                </p>
                <Badge variant="outline" className="text-xs">2-3x per week</Badge>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Front Lever Progressions</CardTitle>
                <CardDescription>Complementary straight-arm work</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  4-6 sets of 5-15 seconds. Builds straight-arm pulling that transfers to back lever.
                </p>
                <Badge variant="outline" className="text-xs">2-3x per week</Badge>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Hollow Body Holds</CardTitle>
                <CardDescription>Core and body tension</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  3-4 sets of 30-60 seconds. Essential for maintaining body line during holds.
                </p>
                <Badge variant="outline" className="text-xs">3-4x per week</Badge>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Common Mistakes */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">Common Mistakes</h2>
          <div className="space-y-3">
            {[
              {
                mistake: 'Bending the elbows',
                fix: 'Back lever requires completely straight arms. If arms bend, regress to an easier progression.',
              },
              {
                mistake: 'Rushing past foundation work',
                fix: 'German hang mobility and tendon adaptation take time. Spend adequate time in foundation phase.',
              },
              {
                mistake: 'Ignoring bicep tendon signals',
                fix: 'Any bicep discomfort is a warning sign. Back off immediately and focus on gradual adaptation.',
              },
              {
                mistake: 'Training through poor form',
                fix: 'End sets before form breaks down. Quality holds are more productive than grinding ugly reps.',
              },
              {
                mistake: 'Excessive lower back arch',
                fix: 'Maintain a relatively flat back. Core engagement prevents hyperextension.',
              },
              {
                mistake: 'Combining too much straight-arm work',
                fix: 'If training front lever and back lever together, reduce volume on each to manage fatigue.',
              },
            ].map((item) => (
              <Card key={item.mistake}>
                <CardContent className="pt-4">
                  <div className="flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium mb-1">{item.mistake}</p>
                      <p className="text-sm text-muted-foreground">{item.fix}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Programming */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">Programming & Frequency</h2>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Training Frequency</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-muted-foreground">
                  <li><span className="font-medium text-foreground">Optimal:</span> 3 sessions per week</li>
                  <li><span className="font-medium text-foreground">Minimum:</span> 2 sessions per week</li>
                  <li><span className="font-medium text-foreground">Maximum:</span> 4 sessions per week (advanced)</li>
                  <li><span className="font-medium text-foreground">Rest:</span> At least 1 day between back lever sessions</li>
                  <li><span className="font-medium text-foreground">Deload:</span> Every 4-6 weeks</li>
                </ul>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Session Placement</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-muted-foreground">
                  <li>Place back lever work early in session when fresh</li>
                  <li>Include mobility prep (german hang) before skill work</li>
                  <li>If combining with front lever, reduce volume on each</li>
                  <li>Avoid heavy pulling before back lever skill work</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sample Session Structure</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="font-medium">Warm-up</span>
                    <span className="text-muted-foreground text-sm">8-10 min</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="font-medium">Mobility Prep (German Hang)</span>
                    <span className="text-muted-foreground text-sm">5-8 min</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="font-medium">Back Lever Skill Block</span>
                    <span className="text-muted-foreground text-sm">15-20 min</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="font-medium">Support Strength</span>
                    <span className="text-muted-foreground text-sm">12-15 min</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="font-medium">Core / Accessory</span>
                    <span className="text-muted-foreground text-sm">8-10 min</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA */}
        <section className="mb-10">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Ready to train?</h3>
                  <p className="text-muted-foreground">
                    Generate a personalized program with back lever progressions built in.
                  </p>
                </div>
                <Button asChild>
                  <Link href="/generate">
                    Generate Program <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Related Guides */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Related Guides</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { slug: 'front-lever-training', title: 'Front Lever Training', description: 'Complementary straight-arm pulling skill' },
              { slug: 'iron-cross-training', title: 'Iron Cross Training', description: 'Advanced ring skill progression' },
              { slug: 'weighted-pull-up-training', title: 'Weighted Pull-Up Training', description: 'Build pulling strength foundation' },
              { slug: 'calisthenics-strength-standards', title: 'Strength Standards', description: 'Benchmark your pulling strength' },
            ].map((guide) => (
              <Link key={guide.slug} href={`/guides/${guide.slug}`}>
                <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{guide.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{guide.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
