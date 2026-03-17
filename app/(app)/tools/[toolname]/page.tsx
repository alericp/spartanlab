import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AdaptiveEngineBadge, SignalIndicator, ENGINE_MESSAGES } from '@/components/shared/AdaptiveEngineBadge'
import { PostActionUpgradePrompt, UPGRADE_TRIGGERS } from '@/components/premium/PremiumFeature'
import { SkillProgressSensor } from '@/components/tools/SkillProgressSensor'
import { StrengthCalculator } from '@/components/tools/StrengthCalculator'
import { FrontLeverStrengthTest } from '@/components/tools/FrontLeverStrengthTest'
import { PlancheStrengthCalculator } from '@/components/tools/PlancheStrengthCalculator'
import { SpartanIcon } from '@/components/brand/SpartanLogo'
import { Calculator, Target, Dumbbell, Trophy, ArrowRight, ArrowLeft, Zap, LayoutDashboard, Activity, Calendar } from 'lucide-react'

// Tool definitions for SEO
const TOOLS: Record<string, {
  title: string
  metaTitle: string
  description: string
  longDescription: string
  icon: typeof Calculator
  relatedSkill: string
  features: string[]
  appRoute: string
  hasSensor: boolean
  hasStrengthCalc?: 'weighted_pull_up' | 'weighted_dip'
  customComponent?: 'front-lever-strength-test' | 'planche-strength-calculator'
  seoSections?: {
    h2: string
    content: string
  }[]
}> = {
  // Note: 'front-lever-calculator' has a dedicated page at /tools/front-lever-calculator/page.tsx
  'front-lever-progression': {
    title: 'Front Lever Progression Tracker',
    metaTitle: 'Front Lever Progression Tracker - Track Your Skill Development',
    description: 'Track your front lever progression from tuck to full. Monitor hold times and get recommendations based on your current skill level.',
    longDescription: 'The front lever is one of the most impressive static holds in calisthenics. This tracker helps you monitor your progression through each level and provides guidance on when you are ready to advance.',
    icon: Target,
    relatedSkill: 'front_lever',
    features: [
      'Track tuck, advanced tuck, one-leg, straddle, and full front lever progress',
      'Monitor hold time improvements over time',
      'Identify when you are ready to progress',
      'Get progression-specific training recommendations',
    ],
    appRoute: '/skills',
    hasSensor: true,
    seoSections: [
      {
        h2: 'Front Lever Progression Levels Explained',
        content: 'The front lever progression follows a systematic path from Tuck Front Lever (knees tucked to chest) through Advanced Tuck (hips extended), One-Leg (one leg extended), Straddle (legs spread wide), and finally Full Front Lever (legs together, body horizontal). Each progression increases the lever arm length, requiring significantly more pulling strength and core stability.',
      },
      {
        h2: 'How Long Should You Hold Each Front Lever Progression?',
        content: 'For optimal progression, aim to hold each level for 8-15 seconds with good form before advancing. Tuck front lever ownership requires 10-20 second holds. Advanced tuck needs 8-15 seconds. One-leg and straddle positions require 5-12 second holds. Full front lever mastery begins at 3-8 seconds. Quality always trumps duration—clean, controlled holds build better strength than shaky maximum attempts.',
      },
      {
        h2: 'When to Progress to the Next Front Lever Level',
        content: 'You are ready to progress when you can perform 4+ clean holds at the minimum duration for your current level, train the skill 2-3 times per week consistently, and your pulling strength supports the next level (roughly +30-70% bodyweight on weighted pull-ups depending on progression). If you are stuck, focus on front lever rows, scapular depression strength, and core anti-extension work.',
      },
    ],
  },
  'planche-readiness': {
    title: 'Planche Readiness Test',
    metaTitle: 'Planche Readiness Test - Evaluate Your Prerequisites',
    description: 'Evaluate your planche prerequisites and identify weak points. Get a clear path to your first tuck planche and beyond.',
    longDescription: 'The planche requires exceptional pushing strength, shoulder stability, and body tension. This readiness test evaluates your current capabilities across multiple prerequisites to determine which planche progression you are ready for and what needs work.',
    icon: Calculator,
    relatedSkill: 'planche',
    features: [
      'Assess tuck, advanced tuck, straddle, and full planche readiness',
      'Evaluate pushing strength prerequisites',
      'Track progression readiness over time',
      'Get targeted exercise recommendations',
    ],
    appRoute: '/skills',
    hasSensor: true,
    seoSections: [
      {
        h2: 'Planche Progression Levels Explained',
        content: 'The planche follows a demanding progression from Tuck Planche (knees tucked, hips level with shoulders) through Advanced Tuck (hips extended backward), Straddle Planche (legs spread horizontally), to Full Planche (legs together, body horizontal). Each level dramatically increases the moment arm your shoulders must overcome, requiring exceptional pushing strength and anterior deltoid development.',
      },
      {
        h2: 'Planche Hold Time Benchmarks',
        content: 'Tuck planche mastery requires 8-15 second holds with full shoulder protraction. Advanced tuck needs 6-12 seconds. Straddle planche ownership begins at 5-10 seconds with proper form. Full planche is elite-level, with 3-8 second holds representing significant achievement. Always prioritize proper lean and protraction over hold duration.',
      },
      {
        h2: 'Prerequisites for Planche Training',
        content: 'Strong planche foundation requires weighted dip strength (20-65% bodyweight added depending on progression), solid pseudo planche push-up depth, and significant planche lean hold capacity. Your scapular protraction strength and wrist conditioning are equally important. Most athletes underestimate the pushing strength required—if your weighted dip is weak, prioritize that before excessive planche leans.',
      },
    ],
  },
  'weighted-pullup-calculator': {
    title: 'Weighted Pull-Up Calculator',
    metaTitle: 'Weighted Pull-Up Calculator - 1RM & Relative Strength',
    description: 'Calculate your estimated 1RM and relative strength ratio for weighted pull-ups. See how your strength compares to calisthenics standards.',
    longDescription: 'Weighted pull-up strength is foundational for advanced calisthenics skills like front lever and muscle-up. This calculator uses proven formulas to estimate your one-rep max and relative strength ratio, helping you track progress and set realistic goals.',
    icon: Dumbbell,
    relatedSkill: 'weighted_pull_up',
    features: [
      'Calculate estimated 1RM from any rep range',
      'See your relative strength (added weight / bodyweight)',
      'Compare to calisthenics strength standards',
      'Track strength progression over time',
    ],
    appRoute: '/strength',
    hasSensor: false,
    hasStrengthCalc: 'weighted_pull_up' as const,
    seoSections: [
      {
        h2: 'Why Weighted Pull-Up Strength Matters',
        content: 'Weighted pull-up strength directly correlates with advanced calisthenics skill acquisition. Athletes with +50% bodyweight pull-up strength typically unlock front lever progressions faster. Those with +70%+ often have the foundation for full front lever and one-arm chin-up training. Building weighted pull-up strength is one of the most transferable investments in calisthenics.',
      },
      {
        h2: 'Calisthenics Weighted Pull-Up Standards',
        content: 'Beginner: bodyweight to +10%. Intermediate: +25-40% bodyweight. Advanced: +50-70% bodyweight. Elite: +80-100%+ bodyweight. These standards assume strict form with full range of motion, dead hang to chin over bar. Kipping, half reps, or body English significantly reduce the training effect.',
      },
    ],
  },
  'strength-standards': {
    title: 'Calisthenics Strength Standards',
    metaTitle: 'Calisthenics Strength Standards - Benchmark Your Level',
    description: 'See how your strength compares to calisthenics benchmarks. Understand what strength levels are needed for advanced skills.',
    longDescription: 'Calisthenics strength standards help you understand where you are in your training journey. This tool shows you the pulling, pushing, and core strength benchmarks for beginner through elite level athletes, and how these relate to skill progressions.',
    icon: Trophy,
    relatedSkill: 'general',
    features: [
      'Benchmark pulling strength (rows, pull-ups, weighted pull-ups)',
      'Benchmark pushing strength (dips, push-ups, weighted dips)',
      'See skill prerequisites at each level',
      'Understand the strength-skill relationship',
    ],
    appRoute: '/performance',
    hasSensor: false,
    seoSections: [
      {
        h2: 'Pulling Strength Standards for Calisthenics',
        content: 'Pulling strength forms the foundation of many advanced skills. Beginner: 5+ strict pull-ups. Intermediate: 12+ pull-ups or +25% BW weighted. Advanced: 20+ pull-ups or +50% BW weighted. Elite: one-arm chin-up negatives or +80% BW weighted. Front lever and muscle-up require intermediate to advanced pulling strength as prerequisites.',
      },
      {
        h2: 'Pushing Strength Standards for Calisthenics',
        content: 'Pushing strength supports planche, handstand push-up, and ring work. Beginner: 20+ push-ups, 5+ dips. Intermediate: 30+ diamond push-ups, +25% BW weighted dips. Advanced: handstand push-ups against wall, +50% BW weighted dips. Elite: freestanding HSPU, +80% BW weighted dips, or straddle planche holds.',
      },
    ],
  },
  'muscle-up-progression': {
    title: 'Muscle-Up Progression Calculator',
    metaTitle: 'Muscle-Up Progression Calculator - Track Your Path',
    description: 'Track your muscle-up progression from assisted to strict to weighted. Get personalized recommendations based on your current level.',
    longDescription: 'The muscle-up combines pulling strength with an explosive transition phase. This calculator helps you assess your readiness for each muscle-up progression and identifies what is limiting your progress.',
    icon: Zap,
    relatedSkill: 'muscle_up',
    features: [
      'Assess band-assisted, jumping, strict, and weighted muscle-up readiness',
      'Evaluate pulling and dip strength prerequisites',
      'Identify transition technique limitations',
      'Get progression-specific training recommendations',
    ],
    appRoute: '/skills',
    hasSensor: true,
    seoSections: [
      {
        h2: 'Muscle-Up Progression Path',
        content: 'The muscle-up progression moves from Band Assisted (using resistance band for support) through Jumping Muscle-Up (using leg drive from box), Strict Muscle-Up (no kip, controlled transition), to Weighted Muscle-Up (added load). Each stage requires increasingly precise technique and strength through the transition phase.',
      },
      {
        h2: 'Prerequisites for Your First Strict Muscle-Up',
        content: 'Most athletes need 12-15 strict pull-ups and 20+ dips before attempting strict muscle-ups. High pull capacity (chin to chest level) is critical. Weighted pull-up strength of +35-50% bodyweight correlates strongly with muscle-up acquisition. The transition is often technique-limited—practice false grip and explosive high pulls.',
      },
    ],
  },
  'hspu-progression': {
    title: 'Handstand Push-Up Progression Calculator',
    metaTitle: 'HSPU Progression Calculator - Track Your Vertical Press',
    description: 'Track your handstand push-up progression from wall-supported to freestanding. Assess your readiness and get training recommendations.',
    longDescription: 'The handstand push-up represents the pinnacle of vertical pressing strength in calisthenics. This calculator helps you assess your current progression level and identify what is needed to advance.',
    icon: Target,
    relatedSkill: 'handstand_pushup',
    features: [
      'Assess wall HSPU, partial ROM freestanding, strict wall, and freestanding HSPU readiness',
      'Evaluate pressing strength prerequisites',
      'Track handstand hold time requirements',
      'Get balance and strength recommendations',
    ],
    appRoute: '/skills',
    hasSensor: true,
    seoSections: [
      {
        h2: 'Handstand Push-Up Progression Levels',
        content: 'HSPU progression moves from Wall Supported HSPU (back to wall, full ROM) through Partial ROM Freestanding (half depth, no wall), Strict Wall HSPU (chest to wall, no kipping), to Freestanding HSPU (full depth, no support). Balance and pressing strength develop in parallel—neglecting either stalls progress.',
      },
      {
        h2: 'Prerequisites for Freestanding Handstand Push-Ups',
        content: 'Freestanding HSPU requires 30+ second freestanding handstand hold, 8-10 strict wall HSPU with good ROM, and solid pike push-up strength. Weighted dip strength of +50%+ bodyweight provides the pressing foundation. Most athletes should master 45-60 second wall handstands before serious HSPU training.',
      },
    ],
  },
  'weighted-dip-calculator': {
    title: 'Weighted Dip Strength Calculator',
    metaTitle: 'Weighted Dip Calculator - 1RM & Relative Strength',
    description: 'Calculate your estimated 1RM and relative strength ratio for weighted dips. Essential for planche and HSPU prerequisites.',
    longDescription: 'Weighted dip strength is a key indicator of pushing power in calisthenics. This calculator helps you estimate your one-rep max and understand how your dip strength correlates with advanced skills like planche and handstand push-ups.',
    icon: Dumbbell,
    relatedSkill: 'weighted_dip',
    features: [
      'Calculate estimated 1RM from any rep range',
      'See your relative strength (added weight / bodyweight)',
      'Compare to planche and HSPU prerequisites',
      'Track strength progression over time',
    ],
    appRoute: '/strength',
    hasSensor: false,
    hasStrengthCalc: 'weighted_dip' as const,
    seoSections: [
      {
        h2: 'Why Weighted Dip Strength Matters for Calisthenics',
        content: 'Weighted dip strength directly correlates with pushing skill acquisition. Athletes with +30% bodyweight dips typically have the foundation for tuck planche. Those with +50%+ often unlock advanced tuck and begin straddle planche work. Strong weighted dips also support handstand push-up progression and ring work.',
      },
      {
        h2: 'Calisthenics Weighted Dip Standards',
        content: 'Beginner: bodyweight to +15%. Intermediate: +25-40% bodyweight. Advanced: +50-65% bodyweight. Elite: +75-100%+ bodyweight. These standards assume full ROM dips with proper form—chest to bar level, full lockout, no excessive forward lean or kipping.',
      },
    ],
  },
  'calisthenics-program-builder': {
    title: 'Calisthenics Program Builder',
    metaTitle: 'Free Calisthenics Program Builder - Generate Your Training Plan',
    description: 'Generate a personalized calisthenics training program based on your skill level, goals, and available equipment.',
    longDescription: 'This program builder creates customized calisthenics training plans based on your current abilities, skill goals, and training preferences. Get a structured approach to building strength and mastering advanced skills.',
    icon: Calendar,
    relatedSkill: 'general',
    features: [
      'Generate programs for beginner to advanced athletes',
      'Target specific skills like front lever, planche, muscle-up',
      'Adjust for training frequency and equipment availability',
      'Get progressive overload recommendations',
    ],
    appRoute: '/programs',
    hasSensor: false,
    seoSections: [
      {
        h2: 'How to Structure a Calisthenics Program',
        content: 'Effective calisthenics programs balance skill work, strength training, and recovery. Skill work (front lever, planche holds) is best done fresh at the start of sessions. Strength work (weighted pull-ups, dips, rows) builds the foundation. Most athletes benefit from 3-5 training days per week with adequate rest between similar movement patterns.',
      },
      {
        h2: 'Progressive Overload in Calisthenics',
        content: 'Unlike weight training where you add plates, calisthenics progression comes from leverage changes (tuck to straddle), range of motion increases, tempo manipulation, and added external load. A good program systematically progresses these variables while managing fatigue and preventing overuse injuries.',
      },
    ],
  },
  'front-lever-strength-test': {
    title: 'Front Lever Strength Test',
    metaTitle: 'Front Lever Strength Test - Calculate Your Readiness Score',
    description: 'Test your front lever readiness with this interactive strength assessment. Get a score from 0-100 based on pulling strength and hold times.',
    longDescription: 'This comprehensive strength test evaluates your front lever readiness by analyzing your pull-up max, weighted pull-up strength, bodyweight, and current hold times. Get a detailed score breakdown and personalized recommendations for progression.',
    icon: Target,
    relatedSkill: 'front_lever',
    features: [
      'Calculate your Front Lever Strength Score (0-100)',
      'Evaluate pull strength ratio and core requirements',
      'Get recommended progression level (Tuck, Advanced Tuck, Straddle, Full)',
      'Receive personalized training recommendations',
      'Link directly to program builder for training plans',
    ],
    appRoute: '/skills',
    hasSensor: false,
    customComponent: 'front-lever-strength-test' as const,
    seoSections: [
      {
        h2: 'What Makes a Good Front Lever Strength Score?',
        content: 'A score of 0-39 indicates early stage readiness—focus on building pull-up volume and weighted pull-up strength before serious front lever training. Scores of 40-59 suggest intermediate readiness suitable for tuck and advanced tuck work. Scores of 60-79 indicate advanced readiness for straddle front lever training. Scores of 80+ suggest you have the strength foundation for full front lever work.',
      },
      {
        h2: 'Key Factors in Front Lever Readiness',
        content: 'Front lever readiness depends on three main factors: pulling strength (measured by weighted pull-ups), core anti-extension strength (measured by hold times), and leverage efficiency (affected by bodyweight and arm length). Athletes with +50% bodyweight pull-ups and 15+ second tuck holds typically have the foundation for straddle front lever training.',
      },
      {
        h2: 'How to Improve Your Front Lever Score',
        content: 'Focus on the factor limiting your score most. If pulling strength is low, prioritize weighted pull-ups and front lever rows. If core strength is the limiter, work on dragon flags and hollow body progressions. If leverage is the issue, band-assisted front lever work helps build specific strength at longer lever lengths.',
      },
    ],
  },
  'planche-strength-calculator': {
    title: 'Planche Strength Calculator',
    metaTitle: 'Planche Strength Calculator - Calculate Your Readiness Score',
    description: 'Calculate your planche readiness based on pushing strength, lean angle tolerance, and core compression. Get a score from 0-100.',
    longDescription: 'This planche calculator evaluates your readiness by analyzing pseudo planche push-up capacity, planche lean hold times, weighted dip strength, and bodyweight. Get a detailed assessment of your horizontal pushing strength and progression recommendations.',
    icon: Calculator,
    relatedSkill: 'planche',
    features: [
      'Calculate your Planche Readiness Score (0-100)',
      'Evaluate horizontal pushing strength and lean tolerance',
      'Assess core compression and protraction strength',
      'Get recommended progression (Tuck, Advanced Tuck, Straddle, Full)',
      'Receive targeted training recommendations',
    ],
    appRoute: '/skills',
    hasSensor: false,
    customComponent: 'planche-strength-calculator' as const,
    seoSections: [
      {
        h2: 'Understanding Your Planche Readiness Score',
        content: 'Scores of 0-39 indicate foundational work is needed—focus on pseudo planche push-ups, weighted dips, and planche leans. Scores of 40-59 suggest readiness for tuck planche training. Scores of 60-79 indicate potential for advanced tuck and early straddle work. Scores of 80+ suggest the strength foundation for straddle planche and beyond.',
      },
      {
        h2: 'Planche Strength Prerequisites',
        content: 'The planche requires exceptional pushing strength. Key benchmarks include: 20+ pseudo planche push-ups with deep lean, 30+ second planche lean holds, weighted dips at +40-60% bodyweight, and solid scapular protraction strength. Athletes who rush into planche training without these foundations often develop shoulder issues.',
      },
      {
        h2: 'Improving Your Planche Readiness',
        content: 'Target your weakest area first. For pushing strength, emphasize weighted dips and pseudo planche push-ups. For lean tolerance, gradually increase planche lean depth and duration. For core compression, work L-sit progressions and pike compressions. Wrist conditioning is equally important—neglect it at your peril.',
      },
    ],
  },
}

type Props = {
  params: Promise<{ toolname: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { toolname } = await params
  const tool = TOOLS[toolname]
  
  if (!tool) {
    return {
      title: 'Tool Not Found',
    }
  }
  
  return {
    title: tool.metaTitle,
    description: tool.description,
    openGraph: {
      title: tool.metaTitle,
      description: tool.description,
      type: 'website',
    },
  }
}

export function generateStaticParams() {
  return Object.keys(TOOLS).map((toolname) => ({
    toolname,
  }))
}

export default async function ToolPage({ params }: Props) {
  const { toolname } = await params
  const tool = TOOLS[toolname]
  
  if (!tool) {
    notFound()
  }
  
  const Icon = tool.icon
  
  return (
    <div className="min-h-screen bg-[#0F1115]">
      {/* Sticky Navigation */}
      <nav className="px-4 py-3 border-b border-[#2B313A]/50 sticky top-0 z-40 bg-[#0F1115]/95 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link 
            href="/tools"
            className="inline-flex items-center gap-2 text-sm text-[#A4ACB8] hover:text-[#E6E9EF] transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            <span>All Tools</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <SpartanIcon size={24} />
              <span className="font-semibold text-[#E6E9EF] hidden sm:block">SpartanLab</span>
            </Link>
            <Button asChild size="sm" className="bg-[#C1121F] hover:bg-[#A30F1A]">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </div>
        </div>
      </nav>
      
      <main className="px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb - visible on larger screens */}
          <div className="hidden sm:flex items-center gap-2 text-sm text-[#6B7280] mb-8">
            <Link href="/landing" className="hover:text-[#A4ACB8] transition-colors">Home</Link>
            <span>/</span>
            <Link href="/tools" className="hover:text-[#A4ACB8] transition-colors">Tools</Link>
            <span>/</span>
            <span className="text-[#A4ACB8]">{tool.title}</span>
          </div>
          
          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-xl bg-[#C1121F]/10 flex items-center justify-center">
                <Icon className="w-7 h-7 text-[#C1121F]" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-[#E6E9EF]">{tool.title}</h1>
                <p className="text-[#6B7280] text-sm mt-1">Free calisthenics training tool</p>
              </div>
            </div>
            <p className="text-lg text-[#A4ACB8] leading-relaxed max-w-2xl">
              {tool.longDescription}
            </p>
          </div>
          
          {/* Features */}
          <Card className="bg-[#1A1F26] border-[#2B313A] p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 text-[#E6E9EF]">What This Tool Does</h2>
            <ul className="space-y-3">
              {tool.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-3 text-[#A4ACB8]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#C1121F] mt-2 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </Card>
          
          {/* Interactive Skill Progress Sensor or Strength Calculator or Custom Component or Placeholder */}
          {tool.customComponent === 'front-lever-strength-test' ? (
            <div className="mb-8">
              <FrontLeverStrengthTest />
            </div>
          ) : tool.customComponent === 'planche-strength-calculator' ? (
            <div className="mb-8">
              <PlancheStrengthCalculator />
            </div>
          ) : tool.hasSensor ? (
            <Card className="bg-[#1A1F26] border-[#2B313A] p-6 mb-8">
              <h2 className="text-xl font-semibold mb-6 text-[#E6E9EF]">Skill Progress Sensor</h2>
              <SkillProgressSensor 
                initialSkill={tool.relatedSkill} 
                showProUpgrade={true}
              />
            </Card>
          ) : tool.hasStrengthCalc ? (
            <Card className="bg-[#1A1F26] border-[#2B313A] p-6 mb-8">
              <h2 className="text-xl font-semibold mb-6 text-[#E6E9EF]">Strength Calculator</h2>
              <StrengthCalculator 
                exerciseType={tool.hasStrengthCalc}
                showProUpgrade={true}
              />
            </Card>
          ) : (
            <Card className="bg-[#0F1115] border-[#2B313A] border-dashed p-12 mb-8">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-[#1A1F26] flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-8 h-8 text-[#6B7280]" />
                </div>
                <h3 className="text-lg font-medium mb-2 text-[#E6E9EF]">Tool Interface</h3>
                <p className="text-[#6B7280] text-sm mb-6 max-w-md mx-auto">
                  This tool is available in the full SpartanLab app with additional features like progress tracking and personalized recommendations.
                </p>
                <Button asChild className="bg-[#C1121F] hover:bg-[#A30F1A]">
                  <Link href={tool.appRoute}>
                    Open Full Tool in App
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </Card>
          )}
          
          {/* SEO Content Sections */}
          {tool.seoSections && tool.seoSections.length > 0 && (
            <div className="space-y-8 mb-12">
              {tool.seoSections.map((section, i) => (
                <div key={i}>
                  <h2 className="text-xl font-semibold mb-3 text-[#E6E9EF]">{section.h2}</h2>
                  <p className="text-[#A4ACB8] leading-relaxed">{section.content}</p>
                </div>
              ))}
            </div>
          )}

          {/* Platform Funnel CTA - Primary */}
          <Card className="bg-gradient-to-br from-[#C1121F]/15 via-[#1A1F26] to-[#1A1F26] border-[#C1121F]/30 p-8 mb-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-3 text-[#E6E9EF]">
                Want a Full Program Based on Your Results?
              </h2>
              <p className="text-[#A4ACB8] mb-6 max-w-lg mx-auto">
                Use the SpartanLab Adaptive Training Engine to generate a personalized calisthenics program that adjusts automatically as you progress.
              </p>
              <Button asChild size="lg" className="bg-[#C1121F] hover:bg-[#A30F1A]">
                <Link href="/my-programs">
                  Generate Program
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>
          </Card>

          {/* Signal Indicator */}
          <div className="flex items-center justify-center py-3 px-4 rounded-lg bg-[#1A1F26]/30 border border-[#2B313A]/50 mb-8">
            <SignalIndicator message={ENGINE_MESSAGES.toolSignal} />
          </div>

          {/* Internal Linking - Explore More */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 text-[#E6E9EF]">Continue Your Training Journey</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <Link href="/my-programs">
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
              <Link href="/my-skills">
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
              <Link href="/dashboard">
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
          </div>

          {/* Adaptive Engine CTA */}
          <AdaptiveEngineBadge variant="cta" />

          {/* Back link */}
          <div className="mt-12 flex items-center justify-between">
            <Link 
              href="/tools" 
              className="inline-flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#A4ACB8] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              View all free tools
            </Link>
            <Link 
              href="/landing" 
              className="inline-flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#A4ACB8] transition-colors"
            >
              Learn about SpartanLab
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="px-4 py-8 border-t border-[#2B313A] mt-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-sm text-[#6B7280]">
            <p>Part of the SpartanLab Calisthenics Training Decision Engine</p>
            <div className="flex items-center gap-6">
              <Link href="/tools" className="hover:text-[#E6E9EF] transition-colors">All Tools</Link>
              <Link href="/my-programs" className="hover:text-[#E6E9EF] transition-colors">Program Builder</Link>
              <Link href="/my-skills" className="hover:text-[#E6E9EF] transition-colors">Skill Tracker</Link>
              <Link href="/dashboard" className="hover:text-[#E6E9EF] transition-colors">Dashboard</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
