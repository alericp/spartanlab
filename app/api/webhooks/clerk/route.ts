import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { sendWelcomeEmail } from '@/lib/email-service'

// Clerk webhook secret for signature verification
const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

interface ClerkUserCreatedEvent {
  type: 'user.created'
  data: {
    id: string
    email_addresses: Array<{
      email_address: string
      id: string
    }>
    first_name: string | null
    last_name: string | null
    username: string | null
  }
}

interface ClerkUserDeletedEvent {
  type: 'user.deleted'
  data: {
    id: string
    deleted: boolean
  }
}

type ClerkWebhookEvent = ClerkUserCreatedEvent | ClerkUserDeletedEvent | { type: string; data: unknown }

export async function POST(request: Request) {
  // Verify webhook secret is configured
  if (!CLERK_WEBHOOK_SECRET) {
    console.error('[Clerk Webhook] CLERK_WEBHOOK_SECRET not configured')
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    )
  }

  // Get headers for signature verification
  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error('[Clerk Webhook] Missing svix headers')
    return NextResponse.json(
      { error: 'Missing webhook signature headers' },
      { status: 400 }
    )
  }

  // Get the body
  const payload = await request.text()

  // Verify the webhook signature
  const wh = new Webhook(CLERK_WEBHOOK_SECRET)
  let event: ClerkWebhookEvent

  try {
    event = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as ClerkWebhookEvent
  } catch (err) {
    console.error('[Clerk Webhook] Signature verification failed:', err)
    return NextResponse.json(
      { error: 'Invalid webhook signature' },
      { status: 400 }
    )
  }

  console.log('[Clerk Webhook] Received event:', event.type)

  // Handle different event types
  switch (event.type) {
    case 'user.created': {
      const { data } = event as ClerkUserCreatedEvent
      const email = data.email_addresses?.[0]?.email_address
      const name = data.first_name || data.username || undefined

      if (email) {
        console.log('[Clerk Webhook] New user created:', email)
        
        // Send welcome email
        const result = await sendWelcomeEmail({ email, name })
        
        if (!result.success) {
          console.error('[Clerk Webhook] Failed to send welcome email:', result.error)
        }
      }
      break
    }

    case 'user.deleted': {
      const { data } = event as ClerkUserDeletedEvent
      console.log('[Clerk Webhook] User deleted:', data.id)
      // Could handle user deletion cleanup here if needed
      break
    }

    default:
      console.log('[Clerk Webhook] Unhandled event type:', event.type)
  }

  return NextResponse.json({ received: true }, { status: 200 })
}
