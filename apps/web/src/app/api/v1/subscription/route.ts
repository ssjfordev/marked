/**
 * Subscription API - Get current user's subscription
 *
 * GET /api/v1/subscription - Returns subscription plan and status
 */

import { createServiceClient } from '@/lib/supabase/server';
import { requireAuth, success, handleError } from '@/lib/api';

export async function GET() {
  try {
    const user = await requireAuth();
    const supabase = createServiceClient();

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    return success({
      plan: subscription?.plan ?? 'free',
      status: subscription?.status ?? 'active',
      currentPeriodEnd: subscription?.current_period_end ?? null,
      hasStripeCustomer: !!subscription?.stripe_customer_id,
    });
  } catch (err) {
    return handleError(err);
  }
}
