import { Card } from '@/components/ui/card'
import type { User, AthleteProfile } from '@/lib/data-service'
import { SKILL_DEFINITIONS } from '@/lib/skills'

interface AthleteOverviewCardProps {
  user: User
  profile: AthleteProfile
}

export function AthleteOverviewCard({ user, profile }: AthleteOverviewCardProps) {
  const goalName = profile.primaryGoal
    ? (SKILL_DEFINITIONS as Record<string, { name: string }>)[profile.primaryGoal]?.name || profile.primaryGoal
    : null

  return (
    <Card className="bg-gradient-to-br from-[#2A2A2A] to-[#1A1A1A] border-[#3A3A3A] p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            {user.username}
          </h1>
          <p className="text-[#A5A5A5]">
            <span className="capitalize">{profile.experienceLevel}</span>
            {' Athlete'}
            {/*
              [PRE-AB6 BUILD GREEN GATE / SCHEDULE CONTRACT]
              AthleteProfile.trainingDaysPerWeek is numeric only
              (lib/data-service.ts:53). Flexible-schedule truth lives on
              the separate optional `scheduleMode` field
              (lib/data-service.ts:62). The previous code compared the
              numeric field to the string 'flexible', which TS correctly
              flagged as a no-overlap comparison. The corrected branch
              reads scheduleMode for flexible mode and falls back to
              numeric days/week display for static schedules.
            */}
            {profile.scheduleMode === 'flexible' ? (
              <span className="text-[#6A6A6A]"> • Flexible schedule</span>
            ) : (
              profile.trainingDaysPerWeek > 0 && (
                <span className="text-[#6A6A6A]"> • {profile.trainingDaysPerWeek} days/week</span>
              )
            )}
          </p>
          {goalName && (
            <p className="text-sm text-[#E63946]">
              Primary Goal: {goalName}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-[#6A6A6A] uppercase tracking-wider">Bodyweight</p>
            <p className="text-xl font-semibold">
              {profile.bodyweight ? `${profile.bodyweight} lbs` : '—'}
            </p>
          </div>
          <div className="w-16 h-16 rounded-xl bg-[#E63946] flex items-center justify-center text-2xl font-bold">
            {user.username.charAt(0)}
          </div>
        </div>
      </div>
      <p className="text-sm text-[#6A6A6A] mt-4 border-t border-[#3A3A3A] pt-4">
        Track skills, build strength, train with structure.
      </p>
    </Card>
  )
}
