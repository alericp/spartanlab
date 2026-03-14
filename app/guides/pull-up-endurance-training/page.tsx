import { Metadata } from 'next'
import Link from 'next/link'
import { Target, Dumbbell, Clock, Zap, Shield } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { BackNav } from '@/components/navigation/BackNav'

export const metadata: Metadata = {
  title: 'Pull-Up Endurance Training Guide | SpartanLab',
  description: 'Maximize your pull-up reps with structured endurance protocols. Ladders, density training, EMOM, and military test preparation strategies.',
  keywords: ['pull up endurance', 'increase pull up reps', 'pull up training', 'military pull up test', 'max pull ups', 'pull up ladder training'],
  openGraph: {
    title: 'Pull-Up Endurance Training Guide | SpartanLab',
    description: 'Build pull-up endurance with proven protocols for max reps and military test preparation.',
  },
}

const protocols = [
  {
    name: 'Ladder Training',
    description: 'Ascending rep ladders that build volume tolerance without hitting failure',
    structure: '1-2-3-4-5 ladder, repeat 2-4 times',
    rest: 'Equal to reps completed (5 reps = 5 breaths)',
    frequency: '3-4x per week',
    progression: 'Add rungs or full ladders',
    bestFor: 'Building total volume and fatigue resistance',
  },
  {
    name: 'Density Training',
    description: 'Accumulate maximum reps within a fixed time block',
    structure: '10-15 minute block',
    rest: 'As needed - goal is total volume',
    frequency: '2-3x per week',
    progression: 'Increase reps per block or reduce rest',
    bestFor: 'Work capacity and mental toughness',
  },
  {
    name: 'Grease the Groove',
    description: 'Multiple daily sub-maximal sets spread throughout the day',
    structure: '5-8 sets per day at 50-70% max',
    rest: 'Hours between sets',
    frequency: '5-6 days per week',
    progression: 'Gradually increase reps per set',
    bestFor: 'Skill practice and neural efficiency',
  },
  {
    name: 'Max Rep Waves',
    description: 'Alternating intensity waves building toward test peaks',
    structure: 'Week 1: 70%, Week 2: 80%, Week 3: 90%, Week 4: Test',
    rest: '2-3 minutes between sets',
    frequency: '2-3x per week',
    progression: 'Reset based on new max after test',
    bestFor: 'Peaking for specific tests or events',
  },
  {
    name: 'EMOM (Every Minute on the Minute)',
    description: 'Fixed rep sets performed at the start of each minute',
    structure: '10-20 minutes',
    rest: 'Remainder of each minute',
    frequency: '2-3x per week',
    progression: 'Increase reps per minute or duration',
    bestFor: 'Consistent pacing and time efficiency',
  },
  {
    name: 'Pyramid Training',
    description: 'Ascending then descending rep scheme with short rests',
    structure: '1-2-3-4-5-4-3-2-1 + max set finisher',
    rest: '30-60 seconds',
    frequency: '2-3x per week',
    progression: 'Extend pyramid peak',
    bestFor: 'Military test preparation',
  },
]

export default function PullUpEnduranceGuidePage() {
  return (
    <main className="min-h-screen bg-[#0D0F14] text-[#E6E9EF]">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <BackNav />
        
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 text-[#C1121F] text-sm font-medium mb-3">
            <Zap className="w-4 h-4" />
            <span>Endurance Training</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Pull-Up Endurance Training Guide
          </h1>
          <p className="text-lg text-[#A4ACB8] leading-relaxed">
            Building high-rep pull-up capacity requires different strategies than strength training. 
            This guide covers proven protocols for increasing your max reps, preparing for military tests, 
            and building work capacity.
          </p>
        </div>

        {/* Key Principles */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <Shield className="w-6 h-6 text-[#C1121F]" />
            Key Principles
          </h2>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="bg-[#1C1F26] border-[#2B313A] p-5">
              <h3 className="font-semibold text-white mb-2">Volume Over Intensity</h3>
              <p className="text-sm text-[#A4ACB8]">
                Endurance is built through accumulated volume, not maximal efforts. 
                Most sets should end before failure.
              </p>
            </Card>
            
            <Card className="bg-[#1C1F26] border-[#2B313A] p-5">
              <h3 className="font-semibold text-white mb-2">Quality Repetitions</h3>
              <p className="text-sm text-[#A4ACB8]">
                Each rep should be clean. Poor form under fatigue reinforces bad patterns 
                and limits long-term progress.
              </p>
            </Card>
            
            <Card className="bg-[#1C1F26] border-[#2B313A] p-5">
              <h3 className="font-semibold text-white mb-2">Consistency Beats Intensity</h3>
              <p className="text-sm text-[#A4ACB8]">
                Regular, moderate sessions build endurance faster than occasional 
                all-out efforts followed by long recovery.
              </p>
            </Card>
            
            <Card className="bg-[#1C1F26] border-[#2B313A] p-5">
              <h3 className="font-semibold text-white mb-2">Progressive Overload Still Applies</h3>
              <p className="text-sm text-[#A4ACB8]">
                Add volume, reduce rest, or increase frequency over time. 
                The stimulus must evolve for continued adaptation.
              </p>
            </Card>
          </div>
        </section>

        {/* Training Protocols */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <Dumbbell className="w-6 h-6 text-[#C1121F]" />
            Training Protocols
          </h2>
          
          <div className="space-y-4">
            {protocols.map((protocol, index) => (
              <Card key={index} className="bg-[#1C1F26] border-[#2B313A] p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#C1121F]/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-[#C1121F] font-bold">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-1">{protocol.name}</h3>
                    <p className="text-sm text-[#A4ACB8] mb-3">{protocol.description}</p>
                    
                    <div className="grid gap-2 sm:grid-cols-2 text-sm">
                      <div>
                        <span className="text-[#6B7280]">Structure: </span>
                        <span className="text-[#E6E9EF]">{protocol.structure}</span>
                      </div>
                      <div>
                        <span className="text-[#6B7280]">Rest: </span>
                        <span className="text-[#E6E9EF]">{protocol.rest}</span>
                      </div>
                      <div>
                        <span className="text-[#6B7280]">Frequency: </span>
                        <span className="text-[#E6E9EF]">{protocol.frequency}</span>
                      </div>
                      <div>
                        <span className="text-[#6B7280]">Progression: </span>
                        <span className="text-[#E6E9EF]">{protocol.progression}</span>
                      </div>
                    </div>
                    
                    <div className="mt-3 px-3 py-2 bg-[#2B313A] rounded text-sm">
                      <span className="text-[#6B7280]">Best for: </span>
                      <span className="text-[#C1121F]">{protocol.bestFor}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Military Test Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <Target className="w-6 h-6 text-[#C1121F]" />
            Military Test Preparation
          </h2>
          
          <Card className="bg-[#1C1F26] border-[#2B313A] p-6">
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-white mb-2">Test Requirements</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="bg-[#2B313A] rounded p-3">
                    <span className="text-white font-medium">Marine Corps PFT</span>
                    <p className="text-sm text-[#A4ACB8] mt-1">
                      Max dead hang pull-ups in 2 minutes. 23+ for maximum points.
                    </p>
                  </div>
                  <div className="bg-[#2B313A] rounded p-3">
                    <span className="text-white font-medium">Army ACFT</span>
                    <p className="text-sm text-[#A4ACB8] mt-1">
                      Leg tuck (being phased out) or plank. Different focus required.
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-white mb-2">8-Week Prep Protocol</h3>
                <ol className="space-y-2 text-[#A4ACB8] text-sm">
                  <li><span className="text-white">Weeks 1-2:</span> Establish baseline. Test max, then train at 60-70% with ladder protocol.</li>
                  <li><span className="text-white">Weeks 3-4:</span> Increase volume. Add density blocks and extend ladders.</li>
                  <li><span className="text-white">Weeks 5-6:</span> Build intensity. Include pyramid training and practice test pacing.</li>
                  <li><span className="text-white">Week 7:</span> Peak week. High-intensity, lower volume. Practice full test simulation.</li>
                  <li><span className="text-white">Week 8:</span> Taper and test. Reduce volume significantly before test day.</li>
                </ol>
              </div>
              
              <div>
                <h3 className="font-semibold text-white mb-2">Pacing Strategy</h3>
                <p className="text-[#A4ACB8] text-sm">
                  For a 2-minute max test, aim for roughly 60% of your max in the first minute, 
                  then push through fatigue in minute two. Going too hard early leads to rapid failure. 
                  Practice this pacing in training.
                </p>
              </div>
            </div>
          </Card>
        </section>

        {/* Sample Week */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <Clock className="w-6 h-6 text-[#C1121F]" />
            Sample Training Week
          </h2>
          
          <Card className="bg-[#1C1F26] border-[#2B313A] p-6">
            <p className="text-[#A4ACB8] mb-4 text-sm">
              Example week for intermediate athlete (current max: 15 pull-ups)
            </p>
            
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="bg-[#2B313A] rounded p-3">
                <span className="text-white font-medium">Monday</span>
                <p className="text-sm text-[#A4ACB8] mt-1">
                  Ladder: 1-2-3-4-5 x 3 rounds (45 total)
                </p>
              </div>
              <div className="bg-[#2B313A] rounded p-3">
                <span className="text-white font-medium">Tuesday</span>
                <p className="text-sm text-[#A4ACB8] mt-1">
                  GTG: 6 sets of 8 throughout day (48 total)
                </p>
              </div>
              <div className="bg-[#2B313A] rounded p-3">
                <span className="text-white font-medium">Wednesday</span>
                <p className="text-sm text-[#A4ACB8] mt-1">
                  Rest or light upper body
                </p>
              </div>
              <div className="bg-[#2B313A] rounded p-3">
                <span className="text-white font-medium">Thursday</span>
                <p className="text-sm text-[#A4ACB8] mt-1">
                  Density: 12 min block, accumulate reps
                </p>
              </div>
              <div className="bg-[#2B313A] rounded p-3">
                <span className="text-white font-medium">Friday</span>
                <p className="text-sm text-[#A4ACB8] mt-1">
                  GTG: 5 sets of 9 throughout day (45 total)
                </p>
              </div>
              <div className="bg-[#2B313A] rounded p-3">
                <span className="text-white font-medium">Weekend</span>
                <p className="text-sm text-[#A4ACB8] mt-1">
                  Rest or active recovery
                </p>
              </div>
            </div>
            
            <p className="text-[#6B7280] text-xs mt-4">
              Total weekly volume: ~180-200 pull-ups. Adjust based on recovery.
            </p>
          </Card>
        </section>

        {/* Common Mistakes */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Common Mistakes</h2>
          
          <div className="space-y-4">
            {[
              {
                mistake: 'Training to failure every session',
                fix: 'Save failure sets for test simulations. Most training should end with reps in reserve.',
              },
              {
                mistake: 'Neglecting strength work',
                fix: 'Include some weighted or difficult variations to maintain pulling strength.',
              },
              {
                mistake: 'Inconsistent training',
                fix: 'Endurance adapts to consistent stimulus. Train pull-ups 4-5x per week.',
              },
              {
                mistake: 'Same protocol every day',
                fix: 'Vary intensity and structure. Mix ladders, density, and GTG throughout the week.',
              },
              {
                mistake: 'No periodization',
                fix: 'Build volume first, then intensity. Taper before important tests.',
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
          <h3 className="text-xl font-bold text-white mb-2">Build Your Endurance</h3>
          <p className="text-[#A4ACB8] mb-4">
            Get a personalized program that builds pull-up endurance with the right protocols for your level.
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
