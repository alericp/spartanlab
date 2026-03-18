import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-service-server'

/**
 * GET /api/auth/owner-status
 * 
 * Returns whether the current authenticated user is the platform owner.
 * Used by OwnerOnly component for server-authoritative owner checks.
 * 
 * Uses the same owner email resolution logic as lib/owner-access.ts:
 * - Prefer OWNER_EMAIL (server-only, more secure)
 * - Fall back to NEXT_PUBLIC_OWNER_EMAIL (client-accessible)
 */

function getOwnerEmail(): string | null {
  // Server-side: prefer OWNER_EMAIL (more secure, not exposed to client)
  if (process.env.OWNER_EMAIL) {
    return process.env.OWNER_EMAIL
  }
  // Fallback: use public version
  if (process.env.NEXT_PUBLIC_OWNER_EMAIL) {
    return process.env.NEXT_PUBLIC_OWNER_EMAIL
  }
  return null
}

export async function GET() {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ isOwner: false })
    }
    
    const ownerEmail = getOwnerEmail()
    if (!ownerEmail) {
      return NextResponse.json({ isOwner: false })
    }
    
    // Normalize: trim whitespace and compare case-insensitively
    const normalizedUserEmail = user.email?.trim().toLowerCase()
    const normalizedOwnerEmail = ownerEmail.trim().toLowerCase()
    const isOwner = normalizedUserEmail === normalizedOwnerEmail
    
    return NextResponse.json({ isOwner })
  } catch {
    return NextResponse.json({ isOwner: false })
  }
}
