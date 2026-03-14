import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Clock, AlertTriangle, CheckCircle, Shield, Dumbbell, Target, AlertCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Iron Cross Training Guide | SpartanLab',
  description: 'Complete guide to iron cross training. Prerequisites, foundational progressions, tendon safety, and long-term programming.',
}

export default function IronCrossTrainingGuidePage() {
  return (
    <main className="min-h-screen bg-[#0F1115] text-[#E6E9EF]">
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
              Elite Skill
            </span>
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-yellow-500/20 text-yellow-500">
              Advanced
            </span>
            <span className="flex items-center gap-1 text-xs text-[#6B7280]">
              <Clock className="w-3 h-3" />
              15 min read
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Iron Cross Training Guide
          </h1>
          <p className="text-lg text-[#A4ACB8]">
            The iron cross is one of gymnastics most iconic strength skills. This guide covers 
            safe progression from foundational work to the full position.
          </p>
        </header>

        {/* Safety Warning */}
        <section className="mb-12 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-lg font-semibold text-yellow-500 mb-2">
                Important Safety Notice
              </h2>
              <p className="text-[#A4ACB8]">
                Iron Cross requires significant tendon strength and straight-arm conditioning. 
                Progressions must begin conservatively to protect connective tissue. Rushing this 
                skill risks serious bicep and elbow tendon injuries that can take months to heal.
              </p>
              <p className="text-sm text-[#6B7280] mt-3">
                Training timeline: 1-3+ years depending on baseline strength and consistency.
              </p>
            </div>
          </div>
        </section>

        {/* Prerequisites */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#C1121F]" />
            Prerequisites Before Starting
          </h2>
          <p className="text-[#A4ACB8] mb-6">
            All of these should be achieved before beginning iron cross specific work. 
            Missing prerequisites increase injury risk significantly.
          </p>
          <div className="space-y-4">
            {[
              {
                requirement: 'Straight Arm Strength Experience',
                detail: '3+ months of dedicated straight arm work (planche leans, support holds)',
                importance: 'critical',
              },
              {
                requirement: 'Planche Progression',
                detail: 'Tuck planche 8+ second hold achieved',
                importance: 'critical',
              },
              {
                requirement: 'Front Lever Progression',
                detail: 'Tuck front lever 10+ second hold achieved',
                importance: 'critical',
              },
              {
                requirement: 'Ring Support Mastery',
                detail: '30+ seconds with full external rotation (turned-out rings)',
                importance: 'critical',
              },
              {
                requirement: 'Shoulder Health',
                detail: 'No current shoulder injuries or pain in overhead/cross-body positions',
                importance: 'critical',
              },
            ].map((prereq, index) => (
              <div 
                key={index}
                className="flex items-start gap-4 bg-[#1C1F26] border border-[#2B313A] rounded-lg p-4"
              >
                <AlertCircle className="w-5 h-5 text-[#C1121F] flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-white">{prereq.requirement}</h3>
                  <p className="text-sm text-[#A4ACB8]">{prereq.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Foundational Progressions */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-white mb-6">Foundational Progressions</h2>
          <p className="text-[#A4ACB8] mb-6">
            If prerequisites arent met, start here. These exercises build the tendon strength 
            and stability needed for safe cross training.
          </p>
          <div className="space-y-4">
            {[
              {
                name: 'Ring Support Hold',
                description: 'Static hold at top of ring dip position',
                purpose: 'Build ring stability and shoulder positioning',
                frequency: '3x per week',
                target: '45+ seconds with full turn-out',
              },
              {
                name: 'Ring Support with Turn Out',
                description: 'Ring support with maximum external rotation',
                purpose: 'Develop rotator cuff strength and ring control',
                frequency: '3x per week',
                target: '30+ seconds with elbows fully locked',
              },
              {
                name: 'German Hang',
                description: 'Inverted hang with arms behind body',
                purpose: 'Build shoulder flexibility and bicep tendon tolerance',
                frequency: '2x per week',
                target: '20+ seconds with straight arms',
              },
              {
                name: 'Straight Arm Conditioning',
                description: 'Planche leans, support holds, and straight arm strength',
                purpose: 'Prepare connective tissue for straight arm loading',
                frequency: '3x per week',
                target: 'Consistent training without discomfort',
              },
              {
                name: 'Ring Stabilization Holds',
                description: 'Various ring positions emphasizing stability',
                purpose: 'Develop proprioception and control on rings',
                frequency: '3x per week',
                target: 'Minimal ring shake during holds',
              },
            ].map((exercise, index) => (
              <div 
                key={index}
                className="bg-[#1C1F26] border border-[#2B313A] rounded-lg p-5"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-white">{exercise.name}</h3>
                  <span className="text-xs text-[#6B7280]">{exercise.frequency}</span>
                </div>
                <p className="text-sm text-[#A4ACB8] mb-2">{exercise.description}</p>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-[#6B7280]">Purpose: <span className="text-[#A4ACB8]">{exercise.purpose}</span></span>
                </div>
                <div className="mt-2 text-xs text-[#C1121F]">Target: {exercise.target}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Cross-Specific Progressions */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-white mb-6">Cross-Specific Progressions</h2>
          <p className="text-[#A4ACB8] mb-6">
            Only begin these once all prerequisites are met and foundational work is solid.
          </p>
          <div className="space-y-4">
            {[
              {
                level: 'Level 1',
                name: 'Cross Pull Negatives',
                target: '5-8 second descent',
                description: 'From support, slowly lower outward toward cross position. Use spotter or band assistance initially.',
              },
              {
                level: 'Level 2',
                name: 'Band-Assisted Cross Holds',
                target: '5-10 second holds',
                description: 'Use resistance band for assistance. Progress to lighter bands over months, not weeks.',
              },
              {
                level: 'Level 3',
                name: 'Partial Cross Holds',
                target: '3-5 seconds at various angles',
                description: 'Hold at increasing angles toward horizontal. Never force end range.',
              },
              {
                level: 'Level 4',
                name: 'Full Iron Cross',
                target: '3-8 seconds',
                description: 'Horizontal arm position with full control. Continue building time under tension.',
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

        {/* Injury Prevention */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-white mb-6">Injury Prevention</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="bg-[#1C1F26] border border-[#2B313A] rounded-lg p-5">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Do
              </h3>
              <ul className="space-y-2 text-sm text-[#A4ACB8]">
                <li>• Progress over months, not weeks</li>
                <li>• Stop immediately if you feel elbow/bicep pain</li>
                <li>• Warm up thoroughly before every session</li>
                <li>• Keep volume low (quality over quantity)</li>
                <li>• Take deload weeks regularly</li>
                <li>• Listen to your body</li>
              </ul>
            </div>
            <div className="bg-[#1C1F26] border border-[#2B313A] rounded-lg p-5">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Dont
              </h3>
              <ul className="space-y-2 text-sm text-[#A4ACB8]">
                <li>• Rush to remove band assistance</li>
                <li>• Train through pain or discomfort</li>
                <li>• Skip prerequisite progressions</li>
                <li>• Train cross when fatigued</li>
                <li>• Ignore warning signs from tendons</li>
                <li>• Compare your timeline to others</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Session Structure */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-white mb-6">Session Structure</h2>
          <div className="bg-[#1C1F26] border border-[#2B313A] rounded-lg p-6">
            <p className="text-[#A4ACB8] mb-4">
              Iron cross training requires extended sessions (90-120 minutes) due to long rest requirements. 
              Heres a recommended structure:
            </p>
            <ol className="space-y-3">
              {[
                { step: 'Warm-up', time: '15-20 min', detail: 'General + shoulder-specific + ring prep' },
                { step: 'Ring Support Work', time: '10-15 min', detail: 'Support holds, turn-out practice' },
                { step: 'Straight Arm Conditioning', time: '15-20 min', detail: 'Planche leans, front lever work' },
                { step: 'Cross-Specific Work', time: '20-30 min', detail: 'Low volume, full rest between sets' },
                { step: 'Support Strength', time: '15-20 min', detail: 'Ring dips, push work' },
                { step: 'Cool-down', time: '10 min', detail: 'Stretching, shoulder care' },
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-4">
                  <span className="w-6 h-6 rounded-full bg-[#C1121F]/20 text-[#C1121F] text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{item.step}</span>
                      <span className="text-xs text-[#6B7280]">({item.time})</span>
                    </div>
                    <p className="text-sm text-[#A4ACB8]">{item.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Frequency */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-white mb-6">Training Frequency</h2>
          <div className="bg-[#1C1F26] border border-[#2B313A] rounded-lg p-6">
            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <h3 className="font-semibold text-white mb-2">Foundational Phase</h3>
                <p className="text-sm text-[#A4ACB8]">3x per week ring support and straight arm work</p>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-2">Cross-Specific Phase</h3>
                <p className="text-sm text-[#A4ACB8]">2x per week max for cross attempts</p>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-2">Recovery</h3>
                <p className="text-sm text-[#A4ACB8]">Deload every 4-6 weeks minimum</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-gradient-to-r from-[#C1121F]/20 to-[#1C1F26] border border-[#C1121F]/30 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-white mb-2">
            Build Your Foundation First
          </h2>
          <p className="text-[#A4ACB8] mb-4">
            SpartanLab automatically checks your readiness and builds appropriate foundational 
            progressions before introducing cross-specific work.
          </p>
          <Link
            href="/programs"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#C1121F] text-white font-medium rounded-lg hover:bg-[#A50E1A] transition-colors"
          >
            Build Your Program
          </Link>
        </section>
      </div>
    </main>
  )
}
