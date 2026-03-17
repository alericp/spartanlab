import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { queryOne } from "@/lib/db";

/**
 * POST /api/stripe/create-portal-session
 * 
 * Creates a Stripe Customer Portal session for managing billing.
 * 
 * Requirements:
 * - User must be authenticated
 * - User must have a stripe_customer_id in the database
 * 
 * Returns:
 * - 200: { url: string } - Redirect to Stripe portal
 * - 401: Not authenticated
 * - 404: No Stripe customer found (user needs to subscribe first)
 * - 500: Stripe API error
 */
export async function POST() {
  try {
    // Check if user is authenticated
    const { userId } = await auth();
    
    if (!userId) {
      console.log("[Billing Portal] Rejected: No userId in auth session");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get the Stripe customer ID from database
    const user = await queryOne<{ stripe_customer_id: string | null; subscription_plan: string | null }>(
      'SELECT stripe_customer_id, subscription_plan FROM users WHERE clerk_id = $1',
      [userId]
    );

    if (!user) {
      console.log(`[Billing Portal] User not found in database: ${userId}`);
      return NextResponse.json(
        { error: "User account not found. Please contact support." },
        { status: 404 }
      );
    }

    if (!user.stripe_customer_id) {
      console.log(`[Billing Portal] No Stripe customer for user: ${userId}, plan: ${user.subscription_plan}`);
      return NextResponse.json(
        { error: "No billing account found. Please subscribe first." },
        { status: 404 }
      );
    }

    // Get the app URL for redirects
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://spartanlab.app";

    // Create Stripe Customer Portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${appUrl}/settings`,
    });

    console.log(`[Billing Portal] Session created for user: ${userId}, customer: ${user.stripe_customer_id}`);
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[Billing Portal] Stripe API error:", error);
    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 }
    );
  }
}
