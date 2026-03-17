import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PRICING } from "@/lib/billing/pricing";

/**
 * POST /api/stripe/create-checkout-session
 * 
 * Creates a Stripe Checkout session for Pro subscription with trial.
 * 
 * Flow:
 * 1. User must be authenticated
 * 2. Creates checkout session with 7-day trial
 * 3. Card is collected upfront but not charged until trial ends
 * 4. On success, webhook syncs subscription to database
 * 
 * Returns:
 * - 200: { url: string } - Redirect to Stripe Checkout
 * - 401: Not authenticated
 * - 500: Stripe API error
 */
export async function POST() {
  try {
    // Check if user is authenticated
    const { userId } = await auth();
    
    if (!userId) {
      console.log("[Checkout] Rejected: No userId in auth session");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get the app URL for redirects
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://spartanlab.app";

    console.log(`[Checkout] Creating session for user: ${userId}`);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: process.env.STRIPE_PRO_PRICE_ID!,
          quantity: 1,
        },
      ],
      // Enable 7-day free trial - card collected upfront, first charge after trial ends
      subscription_data: {
        trial_period_days: PRICING.pro.trialDays,
        metadata: {
          userId,
        },
      },
      success_url: `${appUrl}/dashboard?upgrade=success&trial=started`,
      cancel_url: `${appUrl}/pricing`,
      metadata: {
        userId,
      },
    });

    console.log(`[Checkout] Session created: ${session.id} for user: ${userId}`);
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[Checkout] Stripe API error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
