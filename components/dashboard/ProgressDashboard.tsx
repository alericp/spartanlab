'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Area, AreaChart } from 'recharts'
import { TrendingUp, TrendingDown, Minus, Target, Dumbbell, Zap, Calendar, Trophy } from 'lucide-react'
import {
  getProgressDashboardData,
  type ProgressDashboardData,
  type StrengthProgressData,
  type SkillProgressData,
} from '@/lib/progress-data-service'

// =============================================================================
// CHART COMPONENTS
// =============================================================================

interface StrengthProgressChartProps {
  data: StrengthProgressData
}

function StrengthProgressChart({ data }: StrengthProgressChartProps) {
  const chartData = data.dataPoints.map(point => ({
    date: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: point.value,
  }))

  if (!data.hasData || chartData.length < 2) {
    return (
      <div className="h-32 flex items-center justify-center">
        <p className="text-[#6B6B6B] text-sm text-center">
          Log more sessions to track progress
        </p>
      </div>
    )
  }

  return (
    <div className="h-32">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id={`gradient-${data.exercise}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#E63946" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#E63946" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="date" 
            stroke="#6B6B6B" 
            fontSize={10}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis 
            stroke="#6B6B6B" 
            fontSize={10}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `+${v}`}
            width={35}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1A1A1A',
              border: '1px solid #3A3A3A',
              borderRadius: '6px',
              fontSize: '12px',
            }}
            formatter={(value: number) => [`+${value} lbs`, 'Est 1RM']}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#E63946"
            strokeWidth={2}
            fill={`url(#gradient-${data.exercise})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

interface SkillProgressChartProps {
  data: SkillProgressData
}

function SkillProgressChart({ data }: SkillProgressChartProps) {
  const chartData = data.dataPoints.map(point => ({
    date: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    level: point.value,
    label: point.label,
  }))

  if (!data.hasData || chartData.length < 2) {
    return (
      <div className="h-32 flex items-center justify-center">
        <p className="text-[#6B6B6B] text-sm text-center">
          Log skill sessions to track progress
        </p>
      </div>
    )
  }

  return (
    <div className="h-32">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <XAxis 
            dataKey="date" 
            stroke="#6B6B6B" 
            fontSize={10}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis 
            stroke="#6B6B6B" 
            fontSize={10}
            tickLine={false}
            axisLine={false}
            domain={[0, 5]}
            ticks={[1, 2, 3, 4, 5]}
            width={20}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1A1A1A',
              border: '1px solid #3A3A3A',
              borderRadius: '6px',
              fontSize: '12px',
            }}
            formatter={(value) => [String(value), 'Level']}
          />
          <Line
            type="stepAfter"
            dataKey="level"
            stroke="#60A5FA"
            strokeWidth={2}
            dot={{ fill: '#60A5FA', strokeWidth: 0, r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

interface ConsistencyChartProps {
  weeklyData: { week: string; workouts: number; targetMet: boolean }[]
}

function ConsistencyChart({ weeklyData }: ConsistencyChartProps) {
  if (weeklyData.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center">
        <p className="text-[#6B6B6B] text-sm text-center">
          Log workouts to track consistency
        </p>
      </div>
    )
  }

  return (
    <div className="h-32">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={weeklyData}>
          <XAxis 
            dataKey="week" 
            stroke="#6B6B6B" 
            fontSize={10}
            tickLine={false}
            axisLine={false}
            interval={2}
          />
          <YAxis 
            stroke="#6B6B6B" 
            fontSize={10}
            tickLine={false}
            axisLine={false}
            domain={[0, 7]}
            ticks={[0, 3, 6]}
            width={20}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1A1A1A',
              border: '1px solid #3A3A3A',
              borderRadius: '6px',
              fontSize: '12px',
            }}
            formatter={(value: number) => [value, 'Workouts']}
          />
          <Bar
            dataKey="workouts"
            fill="#10B981"
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

interface SpartanScoreChartProps {
  dataPoints: { date: string; value: number }[]
}

function SpartanScoreChart({ dataPoints }: SpartanScoreChartProps) {
  const chartData = dataPoints.map(point => ({
    date: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    score: point.value,
  }))

  if (chartData.length < 2) {
    return (
      <div className="h-32 flex items-center justify-center">
        <p className="text-[#6B6B6B] text-sm text-center">
          Track more data to see score history
        </p>
      </div>
    )
  }

  return (
    <div className="h-32">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="gradient-score" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="date" 
            stroke="#6B6B6B" 
            fontSize={10}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis 
            stroke="#6B6B6B" 
            fontSize={10}
            tickLine={false}
            axisLine={false}
            domain={[0, 1000]}
            ticks={[0, 250, 500, 750, 1000]}
            width={35}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1A1A1A',
              border: '1px solid #3A3A3A',
              borderRadius: '6px',
              fontSize: '12px',
            }}
            formatter={(value: number) => [value, 'Spartan Score']}
          />
          <Area
            type="monotone"
            dataKey="score"
            stroke="#F59E0B"
            strokeWidth={2}
            fill="url(#gradient-score)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// =============================================================================
// METRIC CARD
// =============================================================================

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  change?: number
  icon: React.ReactNode
  color: string
  children?: React.ReactNode
}

function MetricCard({ title, value, subtitle, change, icon, color, children }: MetricCardProps) {
  return (
    <Card className="bg-[#1E1E1E] border-[#2A2A2A] p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg`} style={{ backgroundColor: `${color}20` }}>
            <div style={{ color }}>{icon}</div>
          </div>
          <span className="text-sm font-medium text-[#A5A5A5]">{title}</span>
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium ${
            change > 0 ? 'text-emerald-400' : change < 0 ? 'text-red-400' : 'text-[#6B6B6B]'
          }`}>
            {change > 0 ? <TrendingUp className="w-3 h-3" /> : 
             change < 0 ? <TrendingDown className="w-3 h-3" /> : 
             <Minus className="w-3 h-3" />}
            {change > 0 ? '+' : ''}{change}%
          </div>
        )}
      </div>
      <div className="mb-3">
        <p className="text-2xl font-bold text-[#F5F5F5]">{value}</p>
        {subtitle && <p className="text-xs text-[#6B6B6B] mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </Card>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

interface ProgressDashboardProps {
  className?: string
}

export function ProgressDashboard({ className }: ProgressDashboardProps) {
  const [data, setData] = useState<ProgressDashboardData | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const progressData = getProgressDashboardData()
    setData(progressData)
  }, [])

  // Find the best strength exercise to display
  const primaryStrength = useMemo(() => {
    if (!data) return null
    return data.strength.find(s => s.hasData) || data.strength[0]
  }, [data])

  // Find a skill with data to display
  const primarySkill = useMemo(() => {
    if (!data) return null
    return data.skills.find(s => s.hasData) || data.skills[0]
  }, [data])

  if (!mounted || !data) {
    return (
      <div className={`space-y-4 ${className || ''}`}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-48 bg-[#1E1E1E] rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const hasAnyData = data.consistency.hasData || 
                     data.spartanScore.hasData || 
                     data.strength.some(s => s.hasData) || 
                     data.skills.some(s => s.hasData)

  if (!hasAnyData) {
    return (
      <Card className={`bg-[#1E1E1E] border-[#2A2A2A] p-8 ${className || ''}`}>
        <div className="text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#2A2A2A] flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-[#6B6B6B]" />
          </div>
          <h3 className="text-lg font-semibold text-[#F5F5F5]">Start Tracking Your Progress</h3>
          <p className="text-sm text-[#A5A5A5] max-w-md mx-auto">
            Log workouts, track skills, and record strength to see your progress visualized over time.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <div className={`space-y-4 ${className || ''}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Spartan Score */}
        <MetricCard
          title="Spartan Score"
          value={data.spartanScore.currentScore}
          subtitle={`Peak: ${data.spartanScore.peakScore}`}
          icon={<Trophy className="w-4 h-4" />}
          color="#F59E0B"
        >
          <SpartanScoreChart dataPoints={data.spartanScore.dataPoints} />
        </MetricCard>

        {/* Training Consistency */}
        <MetricCard
          title="Weekly Training"
          value={`${data.consistency.averagePerWeek.toFixed(1)}`}
          subtitle={`${data.consistency.totalWorkouts} total workouts`}
          icon={<Calendar className="w-4 h-4" />}
          color="#10B981"
        >
          <ConsistencyChart weeklyData={data.consistency.weeklyData} />
        </MetricCard>

        {/* Strength Progress */}
        {primaryStrength && (
          <MetricCard
            title={primaryStrength.exerciseLabel}
            value={primaryStrength.hasData ? `+${primaryStrength.currentValue} lbs` : '—'}
            subtitle={primaryStrength.hasData ? `Started at +${primaryStrength.startValue} lbs` : 'No data yet'}
            change={primaryStrength.hasData ? primaryStrength.changePercent : undefined}
            icon={<Dumbbell className="w-4 h-4" />}
            color="#E63946"
          >
            <StrengthProgressChart data={primaryStrength} />
          </MetricCard>
        )}

        {/* Skill Progress */}
        {primarySkill && (
          <MetricCard
            title={primarySkill.skillLabel}
            value={primarySkill.hasData ? primarySkill.currentLevelName : '—'}
            subtitle={primarySkill.hasData ? `Level ${primarySkill.currentLevel + 1}` : 'No data yet'}
            icon={<Zap className="w-4 h-4" />}
            color="#60A5FA"
          >
            <SkillProgressChart data={primarySkill} />
          </MetricCard>
        )}
      </div>

      {/* Additional strength exercises if they have data */}
      {data.strength.filter(s => s.hasData && s.exercise !== primaryStrength?.exercise).length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.strength
            .filter(s => s.hasData && s.exercise !== primaryStrength?.exercise)
            .map(strength => (
              <MetricCard
                key={strength.exercise}
                title={strength.exerciseLabel}
                value={`+${strength.currentValue} lbs`}
                subtitle={`+${strength.change} lbs gain`}
                change={strength.changePercent}
                icon={<Dumbbell className="w-4 h-4" />}
                color="#E63946"
              >
                <StrengthProgressChart data={strength} />
              </MetricCard>
            ))}
        </div>
      )}
    </div>
  )
}

// Compact version for dashboard sidebar
export function ProgressDashboardCompact() {
  const [data, setData] = useState<ProgressDashboardData | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const progressData = getProgressDashboardData()
    setData(progressData)
  }, [])

  if (!mounted || !data) {
    return <div className="h-24 bg-[#1E1E1E] rounded-lg animate-pulse" />
  }

  const hasData = data.consistency.hasData || data.spartanScore.hasData

  if (!hasData) {
    return (
      <Card className="bg-[#1E1E1E] border-[#2A2A2A] p-4">
        <p className="text-sm text-[#6B6B6B] text-center">
          Log workouts to track progress
        </p>
      </Card>
    )
  }

  return (
    <Card className="bg-[#1E1E1E] border-[#2A2A2A] p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-[#6B6B6B]">Spartan Score</p>
          <p className="text-xl font-bold text-[#F5F5F5]">{data.spartanScore.currentScore}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-[#6B6B6B]">This Week</p>
          <p className="text-xl font-bold text-[#F5F5F5]">
            {data.consistency.weeklyData[data.consistency.weeklyData.length - 1]?.workouts || 0}
            <span className="text-sm text-[#6B6B6B] font-normal ml-1">workouts</span>
          </p>
        </div>
      </div>
    </Card>
  )
}
