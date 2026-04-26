export type Locale = 'en' | 'hi' | 'mr';
export const SUPPORTED_LOCALES: Locale[] = ['en', 'hi', 'mr'];
export const LOCALE_NAMES: Record<Locale, string> = { en: 'EN', hi: 'हिं', mr: 'मर' };

const cache: Partial<Record<Locale, Record<string, string>>> = {};

export async function loadLocale(locale: Locale): Promise<Record<string, string>> {
  if (cache[locale]) return cache[locale]!;
  try {
    const res = await fetch(`/locales/${locale}.json`);
    const strings = await res.json();
    cache[locale] = strings;
    return strings;
  } catch { return {}; }
}

export async function applyLocale(locale: Locale): Promise<void> {
  const strings = await loadLocale(locale);
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (key && strings[key]) el.textContent = strings[key];
  });
  document.documentElement.lang = locale;
  try { localStorage.setItem('wikwiz_locale', locale); } catch {}
}

export function detectLocale(): Locale {
  try {
    const url = new URLSearchParams(window.location.search).get('lang') as Locale | null;
    if (url && SUPPORTED_LOCALES.includes(url)) return url;
    const saved = localStorage.getItem('wikwiz_locale') as Locale | null;
    if (saved && SUPPORTED_LOCALES.includes(saved)) return saved;
    const browser = navigator.language.split('-')[0] as Locale;
    if (SUPPORTED_LOCALES.includes(browser)) return browser;
  } catch {}
  return 'en';
}
