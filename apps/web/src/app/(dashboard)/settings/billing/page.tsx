import { requireUser } from '@/lib/auth/actions';
import { createServiceClient } from '@/lib/supabase/server';
import { BillingClient } from './BillingClient';

export default async function BillingPage() {
  const user = await requireUser();
  const supabase = createServiceClient();

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  return (
    <BillingClient
      currentPlan={subscription?.plan ?? 'free'}
      status={subscription?.status ?? 'active'}
      currentPeriodEnd={subscription?.current_period_end ?? null}
      hasStripeCustomer={!!subscription?.stripe_customer_id}
    />
  );
}
