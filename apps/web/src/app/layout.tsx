import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { DM_Sans, Geist_Mono } from 'next/font/google';
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics';
import { ThemeProvider } from '@/components/ThemeProvider';
import { LanguageProvider } from '@/components/LanguageProvider';
import { COOKIE_NAME, DEFAULT_LOCALE, type Locale } from '@/i18n/types';
import './globals.css';

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Marked - Smart Bookmark Manager',
  description: 'Save, organize, and find your bookmarks with ease',
  icons: {
    icon: '/logos/marked-favicon.png',
    apple: '/logos/apple-touch-icon.png',
  },
};

// Script to prevent flash of wrong theme + dev build info
const themeScript = `
  (function() {
    var theme = localStorage.getItem('theme') || 'system';
    var resolved = theme;
    if (theme === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.classList.add(resolved);
  })();
`;

// Script to prevent flash of wrong locale (reads cookie before hydration)
const localeScript = `
  (function() {
    var m = document.cookie.match(/NEXT_LOCALE=([^;]+)/);
    if (m && m[1]) document.documentElement.lang = m[1];
  })();
`;

const buildInfoScript =
  process.env.ENV === 'development'
    ? `console.log('%c[Marked] commit: ${process.env.NEXT_PUBLIC_COMMIT_HASH} | built: ${process.env.NEXT_PUBLIC_BUILD_TIME}', 'color: #059669; font-weight: bold;');`
    : '';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get(COOKIE_NAME)?.value;
  const locale: Locale =
    localeCookie === 'en' ? 'en' : localeCookie === 'ko' ? 'ko' : DEFAULT_LOCALE;

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: localeScript }} />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {buildInfoScript && <script dangerouslySetInnerHTML={{ __html: buildInfoScript }} />}
      </head>
      <body className={`${dmSans.variable} ${geistMono.variable} antialiased`}>
        <LanguageProvider initialLocale={locale}>
          <ThemeProvider>{children}</ThemeProvider>
        </LanguageProvider>
        <GoogleAnalytics />
      </body>
    </html>
  );
}
