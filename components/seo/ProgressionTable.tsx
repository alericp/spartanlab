'use client'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export interface ProgressionLevel {
  level: string
  holdTime: string
  requirement: string
  nextGoal: string
}

interface ProgressionTableProps {
  title?: string
  levels: ProgressionLevel[]
}

export function ProgressionTable({ title = "Progression Standards", levels }: ProgressionTableProps) {
  return (
    <section className="py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">{title}</h2>
        <div className="rounded-xl border border-[#2A2A2A] overflow-hidden bg-[#121212]">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-[#2A2A2A] bg-[#1A1A1A]">
                <TableHead className="text-[#E6E9EF] font-semibold">Skill Level</TableHead>
                <TableHead className="text-[#E6E9EF] font-semibold">Hold Time / Reps</TableHead>
                <TableHead className="text-[#E6E9EF] font-semibold hidden sm:table-cell">Primary Requirement</TableHead>
                <TableHead className="text-[#E6E9EF] font-semibold hidden md:table-cell">Next Goal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {levels.map((level, index) => (
                <TableRow 
                  key={level.level} 
                  className={`border-b border-[#2A2A2A] ${index % 2 === 0 ? 'bg-[#121212]' : 'bg-[#161616]'}`}
                >
                  <TableCell className="font-medium text-[#E6E9EF]">{level.level}</TableCell>
                  <TableCell className="text-[#A5A5A5]">{level.holdTime}</TableCell>
                  <TableCell className="text-[#A5A5A5] hidden sm:table-cell">{level.requirement}</TableCell>
                  <TableCell className="text-[#A5A5A5] hidden md:table-cell">{level.nextGoal}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </section>
  )
}
