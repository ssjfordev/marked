/**
 * Stripe client
 *
 * Note: Requires the `stripe` package to be installed:
 * npm install stripe
 */

// Type definitions for Stripe (subset of what we use)
interface StripeCustomer {
  id: string;
}

interface StripeCheckoutSession {
  id: string;
  url: string | null;
  subscription?: string;
  metadata?: Record<string, string>;
}

interface StripePortalSession {
  id: string;
  url: string;
}

interface StripeSubscription {
  id: string;
  customer: string;
  status: string;
  current_period_end: number;
}

interface StripeEvent {
  type: string;
  data: {
    object: StripeCheckoutSession | StripeSubscription;
  };
}

interface StripeClient {
  customers: {
    create: (params: { email?: string; metadata?: Record<string, string> }) => Promise<StripeCustomer>;
  };
  checkout: {
    sessions: {
      create: (params: {
        customer: string;
        payment_method_types: string[];
        line_items: { price: string; quantity: number }[];
        mode: string;
        success_url: string;
        cancel_url: string;
        metadata?: Record<string, string>;
      }) => Promise<StripeCheckoutSession>;
    };
  };
  billingPortal: {
    sessions: {
      create: (params: { customer: string; return_url: string }) => Promise<StripePortalSession>;
    };
  };
  subscriptions: {
    retrieve: (id: string) => Promise<StripeSubscription>;
  };
  webhooks: {
    constructEvent: (body: string, signature: string, secret: string) => StripeEvent;
  };
}

// Dynamic import of Stripe to avoid build-time errors if not installed
let stripeClient: StripeClient | null = null;

async function getStripe(): Promise<StripeClient> {
  if (stripeClient) return stripeClient;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Stripe = require('stripe').default || require('stripe');
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2024-12-18.acacia',
      typescript: true,
    });
    return stripeClient as unknown as StripeClient;
  } catch {
    throw new Error('Stripe package not installed. Run: npm install stripe');
  }
}

// Lazy-loaded stripe instance
export const stripe = {
  customers: {
    create: async (params: { email?: string; metadata?: Record<string, string> }) => {
      const client = await getStripe();
      return client.customers.create(params);
    },
  },
  checkout: {
    sessions: {
      create: async (params: {
        customer: string;
        payment_method_types: string[];
        line_items: { price: string; quantity: number }[];
        mode: string;
        success_url: string;
        cancel_url: string;
        metadata?: Record<string, string>;
      }) => {
        const client = await getStripe();
        return client.checkout.sessions.create(params);
      },
    },
  },
  billingPortal: {
    sessions: {
      create: async (params: { customer: string; return_url: string }) => {
        const client = await getStripe();
        return client.billingPortal.sessions.create(params);
      },
    },
  },
  subscriptions: {
    retrieve: async (id: string) => {
      const client = await getStripe();
      return client.subscriptions.retrieve(id);
    },
  },
  webhooks: {
    constructEvent: (body: string, signature: string, secret: string) => {
      // This is sync in Stripe SDK, so we need to handle it differently
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Stripe = require('stripe').default || require('stripe');
      const stripeSync = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2024-12-18.acacia',
      });
      return stripeSync.webhooks.constructEvent(body, signature, secret) as StripeEvent;
    },
  },
};

export const STRIPE_PRICES = {
  pro_monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || 'price_pro_monthly',
  pro_yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID || 'price_pro_yearly',
} as const;

export type PlanType = 'free' | 'pro' | 'lifetime';
