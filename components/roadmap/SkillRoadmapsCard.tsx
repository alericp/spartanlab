'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Map, ChevronRight } from 'lucide-react'
import { SkillRoadmapSummary, SkillRoadmapDisplay } from './SkillRoadmapDisplay'
import { type SkillRoadmapType, getAllRoadmapSummaries } from '@/lib/roadmap/skill-roadmap-service'
import Link from 'next/link'

interface SkillRoadmapsCardProps {
  maxDisplay?: number
}

export function SkillRoadmapsCard({ maxDisplay = 4 }: SkillRoadmapsCardProps) {
  const [selectedSkill, setSelectedSkill] = useState<SkillRoadmapType | null>(null)
  const summaries = getAllRoadmapSummaries()
  
  // Sort by readiness score (highest first) and take top N
  const displayedSummaries = [...summaries]
    .sort((a, b) => b.readinessScore - a.readinessScore)
    .slice(0, maxDisplay)
  
  if (displayedSummaries.length === 0) {
    return null
  }

  return (
    <>
      <Card className="bg-[#12151A] border-[#2A2F36]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#C1121F]/20 flex items-center justify-center">
                <Map className="w-5 h-5 text-[#C1121F]" />
              </div>
              <div>
                <CardTitle className="text-[#E6E9EF] text-lg">
                  Skill Roadmaps
                </CardTitle>
                <p className="text-xs text-[#6B7280]">
                  Your progression path to advanced skills
                </p>
              </div>
            </div>
            <Link href="/my-skills">
              <Button variant="ghost" size="sm" className="text-[#A4ACB8] hover:text-[#E6E9EF]">
                View All
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {displayedSummaries.map((summary) => (
              <SkillRoadmapSummary
                key={summary.skillKey}
                skillKey={summary.skillKey}
                onClick={() => setSelectedSkill(summary.skillKey)}
              />
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Roadmap Detail Modal */}
      <Dialog open={!!selectedSkill} onOpenChange={() => setSelectedSkill(null)}>
        <DialogContent className="bg-[#12151A] border-[#2A2F36] max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader className="sr-only">
            <DialogTitle>Skill Roadmap Details</DialogTitle>
          </DialogHeader>
          {selectedSkill && (
            <SkillRoadmapDisplay skillKey={selectedSkill} />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
