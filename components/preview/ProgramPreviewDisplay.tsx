'use client'

import Link from 'next/link'
import { Calendar, Clock, Target, Zap, ChevronRight, CheckCircle2, Dumbbell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { type PreviewProgram, type PreviewInput } from '@/lib/preview/preview-engine'

interface ProgramPreviewDisplayProps {
  program: PreviewProgram
  input: PreviewInput
  onReset?: () => void
}

export function ProgramPreviewDisplay({
  program,
  input,
  onReset,
}: ProgramPreviewDisplayProps) {
  // Build onboarding URL with prefilled values
  const onboardingParams = new URLSearchParams({
    goal: input.primaryGoal,
    ...(input.secondaryGoal && { secondary: input.secondaryGoal }),
    level: input.experienceLevel,
    duration: input.sessionDuration.toString(),
    from: 'preview',
  })

  return (
    <div className="space-y-6">
      {/* Program Header */}
      <div className="text-center space-y-2">
        <Badge className="bg-[#C1121F]/20 text-[#C1121F] border-[#C1121F]/30">
          Your Preview Program
        </Badge>
        <h2 className="text-2xl font-bold text-[#E6E9EF]">{program.title}</h2>
        <p className="text-[#A5A5A5]">{program.subtitle}</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3 bg-[#1A1A1A] border-[#2A2A2A] text-center">
          <Calendar className="w-5 h-5 mx-auto text-[#C1121F] mb-1" />
          <div className="text-lg font-bold text-[#E6E9EF]">{program.weeklyDays}</div>
          <div className="text-xs text-[#6B7280]">days/week</div>
        </Card>
        <Card className="p-3 bg-[#1A1A1A] border-[#2A2A2A] text-center">
          <Clock className="w-5 h-5 mx-auto text-[#4F6D8A] mb-1" />
          <div className="text-lg font-bold text-[#E6E9EF]">{program.sessionLength}</div>
          <div className="text-xs text-[#6B7280]">min/session</div>
        </Card>
        <Card className="p-3 bg-[#1A1A1A] border-[#2A2A2A] text-center col-span-2">
          <Zap className="w-5 h-5 mx-auto text-[#F59E0B] mb-1" />
          <div className="text-sm font-medium text-[#E6E9EF]">{program.trainingStyle}</div>
          <div className="text-xs text-[#6B7280]">training approach</div>
        </Card>
      </div>

      {/* Key Features */}
      <Card className="p-4 bg-[#1A1A1A] border-[#2A2A2A]">
        <h3 className="text-sm font-medium text-[#E6E9EF] mb-3 flex items-center gap-2">
          <Target className="w-4 h-4 text-[#C1121F]" />
          Program Features
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {program.keyFeatures.map((feature, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm text-[#A5A5A5]">
              <CheckCircle2 className="w-4 h-4 text-[#22C55E] flex-shrink-0" />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Focus Explanation */}
      <Card className="p-4 bg-gradient-to-br from-[#C1121F]/5 to-[#4F6D8A]/5 border-[#2A2A2A]">
        <p className="text-sm text-[#D0D0D0] leading-relaxed">
          {program.focusExplanation}
        </p>
      </Card>

      {/* Weekly Structure */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-[#E6E9EF] flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#4F6D8A]" />
          Weekly Structure Preview
        </h3>
        <div className="space-y-2">
          {program.sessions.map((session) => (
            <Card
              key={session.dayNumber}
              className="p-4 bg-[#1A1A1A] border-[#2A2A2A] hover:border-[#3A3A3A] transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#C1121F]/20 flex items-center justify-center">
                    <span className="text-sm font-bold text-[#C1121F]">{session.dayNumber}</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-[#E6E9EF]">{session.emphasis}</div>
                    <div className="text-xs text-[#6B7280]">{session.duration}</div>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs border-[#3A3A3A] text-[#A5A5A5]">
                  {session.exercises.length} exercises
                </Badge>
              </div>

              {/* Exercise List */}
              <div className="space-y-1.5 pl-11">
                {session.exercises.map((exercise, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-sm py-1 border-l-2 border-[#2A2A2A] pl-3"
                  >
                    <div className="flex items-center gap-2">
                      <Dumbbell className="w-3 h-3 text-[#6B7280]" />
                      <span className="text-[#D0D0D0]">{exercise.name}</span>
                      {exercise.note && (
                        <span className="text-xs text-[#6B7280]">({exercise.note})</span>
                      )}
                    </div>
                    <span className="text-xs text-[#A5A5A5]">
                      {exercise.sets}×{exercise.repsOrTime}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <Card className="p-6 bg-gradient-to-r from-[#C1121F]/10 to-[#4F6D8A]/10 border-[#C1121F]/30">
        <div className="text-center space-y-4">
          <div>
            <h3 className="text-lg font-bold text-[#E6E9EF]">
              Unlock Your Full Adaptive Program
            </h3>
            <p className="text-sm text-[#A5A5A5] mt-1">
              Get detailed progressions, auto-adjusting difficulty, and personalized coaching
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              asChild
              className="bg-[#C1121F] hover:bg-[#A10E1A] text-white font-medium px-6"
            >
              <Link href={`/onboarding?${onboardingParams.toString()}`}>
                <span className="flex items-center gap-2">
                  Start My Personalized Plan
                  <ChevronRight className="w-4 h-4" />
                </span>
              </Link>
            </Button>
            {onReset && (
              <Button
                variant="outline"
                onClick={onReset}
                className="border-[#3A3A3A] text-[#A5A5A5] hover:bg-[#1A1A1A]"
              >
                Try Different Options
              </Button>
            )}
          </div>

          <div className="flex items-center justify-center gap-4 text-xs text-[#6B7280]">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-[#22C55E]" />
              No credit card required
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-[#22C55E]" />
              2-minute setup
            </span>
          </div>
        </div>
      </Card>
    </div>
  )
}
