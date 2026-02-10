import { cookies } from 'next/headers';
import ko from './messages/ko';
import en from './messages/en';
import { COOKIE_NAME, DEFAULT_LOCALE, type Locale } from './types';
import type { MessageKeys } from './messages/ko';

export type { Locale, MessageKeys };
export { COOKIE_NAME, DEFAULT_LOCALE, LOCALES } from './types';

type Messages = Record<string, string | readonly string[]>;

const messages: Record<Locale, Messages> = { ko, en };

export function getMessages(locale: Locale) {
  return messages[locale] ?? messages[DEFAULT_LOCALE];
}

type Params = Record<string, string | number>;

export function translate(msgs: Messages, key: MessageKeys, params?: Params): string {
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

export function translateArray(msgs: Messages, key: MessageKeys): readonly string[] {
  const val = msgs[key];
  if (Array.isArray(val)) return val;
  return [typeof val === 'string' ? val : key];
}

/** Server-side: reads locale from cookie */
export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const val = cookieStore.get(COOKIE_NAME)?.value;
  if (val === 'ko' || val === 'en') return val;
  return DEFAULT_LOCALE;
}

/** Server-side: creates a t() function bound to the current locale */
export async function createT() {
  const locale = await getLocale();
  const msgs = getMessages(locale);
  return {
    t: (key: MessageKeys, params?: Params) => translate(msgs, key, params),
    tArray: (key: MessageKeys) => translateArray(msgs, key),
    locale,
  };
}
