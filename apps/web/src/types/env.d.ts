declare namespace NodeJS {
  interface ProcessEnv {
    // Supabase
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: string;
    SUPABASE_SECRET_KEY: string;

    // Auth
    NEXT_PUBLIC_AUTH_PROVIDER: string;

    // App
    NEXT_PUBLIC_APP_URL: string;
    NEXT_PUBLIC_MAINTENANCE_MODE?: string;

    // Stripe (optional until Epic G)
    STRIPE_SECRET_KEY?: string;
    STRIPE_WEBHOOK_SECRET?: string;
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?: string;
    NEXT_PUBLIC_STRIPE_PRICE_PRO?: string;
    NEXT_PUBLIC_STRIPE_PRICE_AI_PRO?: string;

    // Analytics (optional until Epic H)
    NEXT_PUBLIC_GA4_MEASUREMENT_ID?: string;

    // Sentry (optional)
    SENTRY_AUTH_TOKEN?: string;
    NEXT_PUBLIC_SENTRY_DSN?: string;
    SENTRY_DSN?: string;

    // Worker
    WORKER_INSTANCE_ID?: string;
    WORKER_CONCURRENCY?: string;
    WORKER_DOMAIN_CONCURRENCY?: string;

    // AI Services (optional)
    AI_PROVIDER?: string;
    AI_MAX_TOKENS?: string;
    AI_TEMPERATURE?: string;
    AI_TIMEOUT?: string;
    OPENAI_API_KEY?: string;
    OPENAI_MODEL?: string;
    ANTHROPIC_API_KEY?: string;
    ANTHROPIC_MODEL?: string;
  }
}
