import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/client';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

interface CheckoutSession {
  metadata?: { user_id?: string };
  subscription?: string;
}

interface Subscription {
  id: string;
  customer: string;
  status: string;
  current_period_end: number;
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: { type: string; data: { object: CheckoutSession | Subscription } };

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createServiceClient();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as CheckoutSession;
      const userId = session.metadata?.user_id;

      if (userId && session.subscription) {
        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(session.subscription);

        await supabase
          .from('subscriptions')
          .update({
            plan: 'pro',
            status: 'active',
            stripe_subscription_id: subscription.id,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);
      }
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Subscription;
      const customerId = subscription.customer;

      // Find user by customer ID
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_customer_id', customerId)
        .single();

      if (sub) {
        const status =
          subscription.status === 'active'
            ? 'active'
            : subscription.status === 'trialing'
              ? 'trialing'
              : subscription.status === 'past_due'
                ? 'past_due'
                : 'canceled';

        await supabase
          .from('subscriptions')
          .update({
            status,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', sub.user_id);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Subscription;
      const customerId = subscription.customer;

      // Find user by customer ID
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_customer_id', customerId)
        .single();

      if (sub) {
        await supabase
          .from('subscriptions')
          .update({
            plan: 'free',
            status: 'canceled',
            stripe_subscription_id: null,
            current_period_end: null,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', sub.user_id);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
