import { Resend } from 'resend'

// Initialize Resend client
const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY)
  : null

// Email addresses
const FROM_ADDRESS = 'SpartanLab <hello@spartanlab.app>'
const SUPPORT_EMAIL = 'support@spartanlab.app'
const BILLING_EMAIL = 'billing@spartanlab.app'

// Base URL for links
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://spartanlab.app'

/**
 * Check if email service is configured
 */
export function isEmailEnabled(): boolean {
  return !!resend
}

/**
 * Send welcome email to new users
 */
export async function sendWelcomeEmail(params: {
  email: string
  name?: string
}): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.warn('[Email] Resend not configured - skipping welcome email')
    return { success: false, error: 'Email service not configured' }
  }

  const { email, name } = params
  const firstName = name || 'Athlete'

  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: email,
      subject: 'Welcome to SpartanLab',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0F1115; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0F1115; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 480px; background-color: #1A1F26; border-radius: 12px; border: 1px solid #2B313A;">
          <tr>
            <td style="padding: 40px 32px;">
              <!-- Logo -->
              <div style="text-align: center; margin-bottom: 32px;">
                <span style="font-size: 24px; font-weight: bold; color: #C1121F;">SpartanLab</span>
              </div>
              
              <!-- Content -->
              <h1 style="color: #F5F5F5; font-size: 24px; font-weight: 600; margin: 0 0 16px 0; text-align: center;">
                Welcome, ${firstName}
              </h1>
              
              <p style="color: #A4ACB8; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">
                You're now part of SpartanLab — the adaptive training platform for serious calisthenics athletes.
              </p>
              
              <p style="color: #A4ACB8; font-size: 15px; line-height: 1.6; margin: 0 0 32px 0; text-align: center;">
                Start by setting up your training profile and generating your first adaptive program.
              </p>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin-bottom: 32px;">
                <a href="${BASE_URL}/dashboard" style="display: inline-block; background-color: #C1121F; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                  Go to Dashboard
                </a>
              </div>
              
              <!-- Divider -->
              <div style="border-top: 1px solid #2B313A; margin: 32px 0;"></div>
              
              <!-- Footer -->
              <p style="color: #6B7280; font-size: 13px; line-height: 1.5; margin: 0; text-align: center;">
                Questions? Reach us at <a href="mailto:${SUPPORT_EMAIL}" style="color: #A4ACB8; text-decoration: underline;">${SUPPORT_EMAIL}</a>
              </p>
            </td>
          </tr>
        </table>
        
        <!-- Bottom text -->
        <p style="color: #4B5563; font-size: 12px; margin-top: 24px; text-align: center;">
          SpartanLab — Train Smarter, Not Harder
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
      `.trim(),
    })

    if (error) {
      console.error('[Email] Failed to send welcome email:', error)
      return { success: false, error: error.message }
    }

    console.log('[Email] Welcome email sent to:', email)
    return { success: true }
  } catch (err) {
    console.error('[Email] Error sending welcome email:', err)
    return { success: false, error: 'Failed to send email' }
  }
}

/**
 * Send Pro upgrade confirmation email
 */
export async function sendProUpgradeEmail(params: {
  email: string
  name?: string
}): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.warn('[Email] Resend not configured - skipping Pro upgrade email')
    return { success: false, error: 'Email service not configured' }
  }

  const { email, name } = params
  const firstName = name || 'Athlete'

  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: email,
      subject: 'Welcome to SpartanLab Pro',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0F1115; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0F1115; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 480px; background-color: #1A1F26; border-radius: 12px; border: 1px solid #2B313A;">
          <tr>
            <td style="padding: 40px 32px;">
              <!-- Logo -->
              <div style="text-align: center; margin-bottom: 32px;">
                <span style="font-size: 24px; font-weight: bold; color: #C1121F;">SpartanLab</span>
                <span style="display: inline-block; background: linear-gradient(135deg, #F59E0B, #D97706); color: #0F1115; font-size: 11px; font-weight: 700; padding: 4px 8px; border-radius: 4px; margin-left: 8px; vertical-align: middle;">PRO</span>
              </div>
              
              <!-- Content -->
              <h1 style="color: #F5F5F5; font-size: 24px; font-weight: 600; margin: 0 0 16px 0; text-align: center;">
                You're Pro, ${firstName}
              </h1>
              
              <p style="color: #A4ACB8; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">
                Your SpartanLab Pro subscription is now active. You have full access to the Adaptive Training Engine and all advanced features.
              </p>
              
              <div style="background-color: #1A1F26; border: 1px solid #2B313A; border-radius: 8px; padding: 20px; margin-bottom: 32px;">
                <p style="color: #F5F5F5; font-size: 14px; font-weight: 600; margin: 0 0 12px 0;">Your Pro features include:</p>
                <ul style="color: #A4ACB8; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                  <li>Adaptive Training Engine</li>
                  <li>Advanced Analytics</li>
                  <li>Progress Projections</li>
                  <li>Unlimited Programs</li>
                </ul>
              </div>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin-bottom: 32px;">
                <a href="${BASE_URL}/dashboard" style="display: inline-block; background-color: #C1121F; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                  Go to Dashboard
                </a>
              </div>
              
              <!-- Divider -->
              <div style="border-top: 1px solid #2B313A; margin: 32px 0;"></div>
              
              <!-- Footer -->
              <p style="color: #6B7280; font-size: 13px; line-height: 1.5; margin: 0; text-align: center;">
                Billing questions? Contact <a href="mailto:${BILLING_EMAIL}" style="color: #A4ACB8; text-decoration: underline;">${BILLING_EMAIL}</a>
              </p>
            </td>
          </tr>
        </table>
        
        <!-- Bottom text -->
        <p style="color: #4B5563; font-size: 12px; margin-top: 24px; text-align: center;">
          SpartanLab — Train Smarter, Not Harder
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
      `.trim(),
    })

    if (error) {
      console.error('[Email] Failed to send Pro upgrade email:', error)
      return { success: false, error: error.message }
    }

    console.log('[Email] Pro upgrade email sent to:', email)
    return { success: true }
  } catch (err) {
    console.error('[Email] Error sending Pro upgrade email:', err)
    return { success: false, error: 'Failed to send email' }
  }
}

/**
 * Send payment failure notification email
 */
export async function sendPaymentFailedEmail(params: {
  email: string
  name?: string
}): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.warn('[Email] Resend not configured - skipping payment failed email')
    return { success: false, error: 'Email service not configured' }
  }

  const { email, name } = params
  const firstName = name || 'there'

  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: email,
      subject: 'Action Required: Payment Issue with SpartanLab',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0F1115; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0F1115; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 480px; background-color: #1A1F26; border-radius: 12px; border: 1px solid #2B313A;">
          <tr>
            <td style="padding: 40px 32px;">
              <!-- Logo -->
              <div style="text-align: center; margin-bottom: 32px;">
                <span style="font-size: 24px; font-weight: bold; color: #C1121F;">SpartanLab</span>
              </div>
              
              <!-- Content -->
              <h1 style="color: #F5F5F5; font-size: 24px; font-weight: 600; margin: 0 0 16px 0; text-align: center;">
                Payment Issue
              </h1>
              
              <p style="color: #A4ACB8; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">
                Hi ${firstName}, we couldn't process your latest payment for SpartanLab Pro. Please update your payment method to keep your Pro access active.
              </p>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin-bottom: 32px;">
                <a href="${BASE_URL}/settings" style="display: inline-block; background-color: #C1121F; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                  Update Payment Method
                </a>
              </div>
              
              <!-- Divider -->
              <div style="border-top: 1px solid #2B313A; margin: 32px 0;"></div>
              
              <!-- Footer -->
              <p style="color: #6B7280; font-size: 13px; line-height: 1.5; margin: 0; text-align: center;">
                Need help? Contact <a href="mailto:${BILLING_EMAIL}" style="color: #A4ACB8; text-decoration: underline;">${BILLING_EMAIL}</a>
              </p>
            </td>
          </tr>
        </table>
        
        <!-- Bottom text -->
        <p style="color: #4B5563; font-size: 12px; margin-top: 24px; text-align: center;">
          SpartanLab — Train Smarter, Not Harder
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
      `.trim(),
    })

    if (error) {
      console.error('[Email] Failed to send payment failed email:', error)
      return { success: false, error: error.message }
    }

    console.log('[Email] Payment failed email sent to:', email)
    return { success: true }
  } catch (err) {
    console.error('[Email] Error sending payment failed email:', err)
    return { success: false, error: 'Failed to send email' }
  }
}

/**
 * Send subscription cancelled confirmation email
 */
export async function sendSubscriptionCancelledEmail(params: {
  email: string
  name?: string
}): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.warn('[Email] Resend not configured - skipping cancellation email')
    return { success: false, error: 'Email service not configured' }
  }

  const { email, name } = params
  const firstName = name || 'there'

  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: email,
      subject: 'Your SpartanLab Pro subscription has been cancelled',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0F1115; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0F1115; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 480px; background-color: #1A1F26; border-radius: 12px; border: 1px solid #2B313A;">
          <tr>
            <td style="padding: 40px 32px;">
              <!-- Logo -->
              <div style="text-align: center; margin-bottom: 32px;">
                <span style="font-size: 24px; font-weight: bold; color: #C1121F;">SpartanLab</span>
              </div>
              
              <!-- Content -->
              <h1 style="color: #F5F5F5; font-size: 24px; font-weight: 600; margin: 0 0 16px 0; text-align: center;">
                Subscription Cancelled
              </h1>
              
              <p style="color: #A4ACB8; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">
                Hi ${firstName}, your SpartanLab Pro subscription has been cancelled. You'll continue to have access to free features.
              </p>
              
              <p style="color: #A4ACB8; font-size: 15px; line-height: 1.6; margin: 0 0 32px 0; text-align: center;">
                Changed your mind? You can resubscribe anytime to regain full access to Pro features.
              </p>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin-bottom: 32px;">
                <a href="${BASE_URL}/pricing" style="display: inline-block; background-color: #C1121F; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                  Resubscribe to Pro
                </a>
              </div>
              
              <!-- Divider -->
              <div style="border-top: 1px solid #2B313A; margin: 32px 0;"></div>
              
              <!-- Footer -->
              <p style="color: #6B7280; font-size: 13px; line-height: 1.5; margin: 0; text-align: center;">
                Questions? Contact <a href="mailto:${SUPPORT_EMAIL}" style="color: #A4ACB8; text-decoration: underline;">${SUPPORT_EMAIL}</a>
              </p>
            </td>
          </tr>
        </table>
        
        <!-- Bottom text -->
        <p style="color: #4B5563; font-size: 12px; margin-top: 24px; text-align: center;">
          SpartanLab — Train Smarter, Not Harder
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
      `.trim(),
    })

    if (error) {
      console.error('[Email] Failed to send cancellation email:', error)
      return { success: false, error: error.message }
    }

    console.log('[Email] Cancellation email sent to:', email)
    return { success: true }
  } catch (err) {
    console.error('[Email] Error sending cancellation email:', err)
    return { success: false, error: 'Failed to send email' }
  }
}
