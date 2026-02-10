'use client';

import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import ko from '@/i18n/messages/ko';
import en from '@/i18n/messages/en';
import { COOKIE_NAME, type Locale } from '@/i18n/types';
import type { MessageKeys } from '@/i18n/messages/ko';

const messages: Record<Locale, Record<string, string | readonly string[]>> = { ko, en };

type Params = Record<string, string | number>;

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKeys, params?: Params) => string;
  tArray: (key: MessageKeys) => readonly string[];
}

const LanguageContext = createContext<LanguageContextType>({
  locale: 'ko',
  setLocale: () => {},
  t: (key) => key,
  tArray: (key) => [key],
});

type Messages = Record<string, string | readonly string[]>;

function translateFn(msgs: Messages, key: MessageKeys, params?: Params): string {
  const text = msgs[key];
  if (Array.isArray(text)) return text.join(', ');
  if (!text || typeof text !== 'string') return key;
  if (!params) return text;
  let result = text;
  for (const [k, v] of Object.entries(params)) {
    result = result.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
  }
  return result;
}

export function LanguageProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    // Update cookie
    document.cookie = `${COOKIE_NAME}=${newLocale};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
    // Update HTML lang attribute
    document.documentElement.lang = newLocale;
    // Persist to DB for logged-in users (fire and forget)
    fetch('/api/v1/user/preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: newLocale }),
    }).catch(() => {});
  }, []);

  const t = useCallback(
    (key: MessageKeys, params?: Params) => {
      const msgs = messages[locale] ?? messages.ko;
      return translateFn(msgs, key, params);
    },
    [locale]
  );

  const tArray = useCallback(
    (key: MessageKeys): readonly string[] => {
      const msgs = messages[locale] ?? messages.ko;
      const val = msgs[key];
      if (Array.isArray(val)) return val;
      return [typeof val === 'string' ? val : key];
    },
    [locale]
  );

  const value = useMemo(() => ({ locale, setLocale, t, tArray }), [locale, setLocale, t, tArray]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLocale() {
  return useContext(LanguageContext);
}
