'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from '@/components/LanguageProvider';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useLocale();

  const settingsNav = [
    {
      name: t('settings.account'),
      href: '/settings/account',
      icon: (
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
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ),
    },
    {
      name: t('settings.billing'),
      href: '/settings/billing',
      icon: (
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
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
      ),
    },
    {
      name: t('settings.legal'),
      href: '/settings/legal',
      icon: (
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
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground mb-2">{t('settings.title')}</h1>
        <p className="text-foreground-muted">{t('settings.desc')}</p>
      </div>

      <div className="flex gap-8">
        {/* Sidebar navigation */}
        <nav className="w-48 flex-shrink-0">
          <ul className="space-y-1">
            {settingsNav.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`
                      flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                      ${
                        isActive
                          ? 'bg-primary/10 text-primary-light'
                          : 'text-foreground-muted hover:text-foreground hover:bg-hover'
                      }
                    `}
                  >
                    {item.icon}
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Main content */}
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
