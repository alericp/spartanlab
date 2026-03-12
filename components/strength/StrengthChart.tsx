'use client'

import { Card } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import type { StrengthRecord } from '@/lib/strength-service'

interface StrengthChartProps {
  records: StrengthRecord[]
}

export function StrengthChart({ records }: StrengthChartProps) {
  // Sort by date ascending for chart
  const sortedRecords = [...records].sort(
    (a, b) => new Date(a.dateLogged).getTime() - new Date(b.dateLogged).getTime()
  )

  const chartData = sortedRecords.map((record) => ({
    date: new Date(record.dateLogged).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    oneRM: record.estimatedOneRM,
  }))

  if (records.length < 2) {
    return (
      <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-6">
        <h3 className="text-lg font-semibold mb-4">Progress Chart</h3>
        <div className="h-48 flex items-center justify-center">
          <p className="text-[#A5A5A5] text-sm">
            Log at least 2 records to see your progress chart
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-6">
      <h3 className="text-lg font-semibold mb-4">Progress Chart</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <XAxis 
              dataKey="date" 
              stroke="#A5A5A5" 
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: '#3A3A3A' }}
            />
            <YAxis 
              stroke="#A5A5A5" 
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: '#3A3A3A' }}
              tickFormatter={(value) => `+${value}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1A1A1A',
                border: '1px solid #3A3A3A',
                borderRadius: '8px',
                color: '#F5F5F5',
              }}
              formatter={(value: number) => [`+${value} lbs`, 'Est 1RM']}
            />
            <Line
              type="monotone"
              dataKey="oneRM"
              stroke="#E63946"
              strokeWidth={2}
              dot={{ fill: '#E63946', strokeWidth: 0, r: 4 }}
              activeDot={{ fill: '#E63946', strokeWidth: 0, r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
