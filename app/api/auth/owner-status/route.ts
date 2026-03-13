import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-service-server'

/**
 * GET /api/auth/owner-status
 * 
 * Returns whether the current authenticated user is the platform owner.
 * Used by OwnerOnly component for server-authoritative owner checks.
 */
export async function GET() {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ isOwner: false })
    }
    
    const ownerEmail = process.env.NEXT_PUBLIC_OWNER_EMAIL
    if (!ownerEmail) {
      return NextResponse.json({ isOwner: false })
    }
    
    const isOwner = user.email?.toLowerCase() === ownerEmail.toLowerCase()
    
    return NextResponse.json({ isOwner })
  } catch {
    return NextResponse.json({ isOwner: false })
  }
}
