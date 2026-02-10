import Image from 'next/image';
import Link from 'next/link';
import { signInWithGoogle } from '@/lib/auth/actions';
import { createT } from '@/i18n';

export const dynamic = 'force-dynamic';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; extension?: string }>;
}) {
  const params = await searchParams;
  const redirectTo = params.redirect;
  const fromExtension = params.extension === 'true';
  const { t } = await createT();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-bg">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          {/* Logo */}
          <Link href="/dashboard" className="inline-block hover:opacity-80 transition-opacity">
            <Image
              src="/logos/marked-logo-full.png"
              alt="Marked"
              width={160}
              height={40}
              unoptimized
              className="dark:hidden h-10 w-auto mx-auto mb-4"
            />
            <Image
              src="/logos/marked-logo-full-white.png"
              alt="Marked"
              width={160}
              height={40}
              unoptimized
              className="hidden dark:block h-10 w-auto mx-auto mb-4"
            />
          </Link>
          <p className="mt-3 text-foreground-muted">{t('login.tagline')}</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-8">
          <form
            action={async () => {
              'use server';
              await signInWithGoogle(redirectTo, fromExtension);
            }}
          >
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-surface px-6 py-3.5 text-foreground font-medium shadow-sm transition-all hover:bg-surface-hover hover:border-border-hover focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <GoogleIcon />
              <span>{t('login.continueWithGoogle')}</span>
            </button>
          </form>

          <div className="mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-foreground-faint uppercase tracking-wide">
              {t('login.secureLogin')}
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="mt-6 flex items-center justify-center gap-4 text-foreground-muted">
            <div className="flex items-center gap-1.5">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <span className="text-xs">{t('login.encrypted')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <span className="text-xs">{t('login.private')}</span>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-foreground-muted">
          {t('login.terms')
            .replace(
              '{termsLink}',
              `<a href="/terms" class="text-primary-light hover:underline">${t('login.termsOfService')}</a>`
            )
            .replace(
              '{privacyLink}',
              `<a href="/privacy" class="text-primary-light hover:underline">${t('login.privacyPolicy')}</a>`
            )
            .split(/(<a[^>]*>.*?<\/a>)/)
            .map((part, i) =>
              part.startsWith('<a') ? (
                <span key={i} dangerouslySetInnerHTML={{ __html: part }} />
              ) : (
                <span key={i}>{part}</span>
              )
            )}
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
