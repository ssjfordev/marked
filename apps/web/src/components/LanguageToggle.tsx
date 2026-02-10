'use client';

import { useLocale } from './LanguageProvider';
import { useState, useRef, useEffect } from 'react';

export function LanguageToggle() {
  const { locale, setLocale, t } = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-center w-8 h-8 rounded-lg text-foreground-secondary hover:bg-hover transition-colors cursor-pointer"
        title={t('language.toggle')}
      >
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
            d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5a17.92 17.92 0 01-8.716-2.247m0 0A9 9 0 013 12c0-1.605.42-3.113 1.157-4.418"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-36 rounded-lg border border-border bg-surface p-1 shadow-lg z-50">
          <button
            onClick={() => {
              setLocale('ko');
              setOpen(false);
            }}
            className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors cursor-pointer ${
              locale === 'ko'
                ? 'bg-hover text-foreground'
                : 'text-foreground-secondary hover:bg-hover'
            }`}
          >
            <span className="text-base">🇰🇷</span>
            {t('language.ko')}
          </button>
          <button
            onClick={() => {
              setLocale('en');
              setOpen(false);
            }}
            className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors cursor-pointer ${
              locale === 'en'
                ? 'bg-hover text-foreground'
                : 'text-foreground-secondary hover:bg-hover'
            }`}
          >
            <span className="text-base">🇺🇸</span>
            {t('language.en')}
          </button>
        </div>
      )}
    </div>
  );
}
