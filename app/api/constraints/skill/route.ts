import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { 
  getSkillConstraints, 
  getAllSkillConstraints,
  getConstraintContextForRoadmap,
  type SkillType,
} from '@/lib/constraint-integration'
import { requireProAccess } from '@/lib/server/require-pro'

export async function GET(request: NextRequest) {
  try {
    // Pro feature enforcement - skill constraint analysis is Pro-only
    const denied = await requireProAccess()
    if (denied) return denied
    
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const skill = searchParams.get('skill') as SkillType | null
    const includeRoadmap = searchParams.get('roadmap') === 'true'
    
    // If specific skill requested
    if (skill) {
      const validSkills: SkillType[] = ['front_lever', 'back_lever', 'planche', 'hspu', 'muscle_up', 'l_sit']
      
      if (!validSkills.includes(skill)) {
        return NextResponse.json(
          { error: 'Invalid skill. Valid skills: ' + validSkills.join(', ') },
          { status: 400 }
        )
      }
      
      const constraints = getSkillConstraints(skill)
      
      if (includeRoadmap) {
        const roadmapContext = getConstraintContextForRoadmap(skill)
        return NextResponse.json({
          constraints,
          roadmap: roadmapContext,
        })
      }
      
      return NextResponse.json(constraints)
    }
    
    // Return all skill constraints
    const allConstraints = getAllSkillConstraints()
    return NextResponse.json(allConstraints)
  } catch (error) {
    console.error('[Skill Constraints API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to get skill constraints' },
      { status: 500 }
    )
  }
}
