-- Add subscription_status column to users table
-- This tracks the Stripe subscription status (active, trialing, canceled, etc.)
-- While subscription_plan tracks free vs pro, this tracks the actual Stripe state

-- Add subscription_status column (default to NULL for existing users)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT NULL;

-- Add trial_ends_at column to track trial expiration
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Update existing Pro users to have 'active' status (they have a subscription_id)
UPDATE users 
SET subscription_status = 'active' 
WHERE stripe_subscription_id IS NOT NULL 
  AND subscription_plan = 'pro'
  AND subscription_status IS NULL;

-- Verify the migration
SELECT 
  COUNT(*) as total_users,
  COUNT(subscription_status) as users_with_status,
  COUNT(stripe_subscription_id) as users_with_stripe
FROM users;
