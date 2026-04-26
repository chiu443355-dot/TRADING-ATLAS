import { useState, useEffect } from 'react';

export type Locale = 'en' | 'hi' | 'mr';
const SUPPORTED_LOCALES: Locale[] = ['en', 'hi', 'mr'];
const LOCALE_NAMES: Record<Locale, string> = { en: 'EN', hi: 'हिं', mr: 'मर' };
const cache: Partial<Record<Locale, Record<string, string>>> = {};

async function fetchLocale(locale: Locale): Promise<Record<string, string>> {
  if (cache[locale]) return cache[locale]!;
  try {
    const res = await fetch(`/locales/${locale}.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    cache[locale] = data;
    return data;
  } catch (e) { console.error('Locale load failed:', e); return {}; }
}

function applyStrings(strings: Record<string, string>, locale: Locale) {
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (key && strings[key] !== undefined) el.textContent = strings[key];
  });
  document.documentElement.lang = locale;
  try { localStorage.setItem('wikwiz_locale', locale); } catch {}
  window.dispatchEvent(new CustomEvent('wikwiz:locale', { detail: { locale, strings } }));
}

function detectLocale(): Locale {
  try {
    const urlParam = new URLSearchParams(window.location.search).get('lang') as Locale | null;
    if (urlParam && SUPPORTED_LOCALES.includes(urlParam)) return urlParam;
    const saved = localStorage.getItem('wikwiz_locale') as Locale | null;
    if (saved && SUPPORTED_LOCALES.includes(saved)) return saved;
    const browser = navigator.language.split('-')[0] as Locale;
    if (SUPPORTED_LOCALES.includes(browser)) return browser;
  } catch {}
  return 'en';
}

export default function LanguageSwitcher() {
  const [current, setCurrent] = useState<Locale>('en');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const detected = detectLocale();
    setCurrent(detected);
    if (detected !== 'en') {
      fetchLocale(detected).then(strings => {
        if (Object.keys(strings).length > 0) applyStrings(strings, detected);
      });
    }
  }, []);

  const handleSwitch = async (locale: Locale) => {
    if (locale === current || loading) return;
    setLoading(true);
    try {
      const strings = await fetchLocale(locale);
      if (Object.keys(strings).length > 0) {
        applyStrings(strings, locale);
        setCurrent(locale);
        const url = new URL(window.location.href);
        locale === 'en' ? url.searchParams.delete('lang') : url.searchParams.set('lang', locale);
        window.history.replaceState({}, '', url.toString());
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
      {SUPPORTED_LOCALES.map(locale => (
        <button
          key={locale}
          onClick={() => handleSwitch(locale)}
          disabled={loading}
          title={locale === 'en' ? 'English' : locale === 'hi' ? 'हिंदी' : 'मराठी'}
          style={{
            padding: '5px 11px',
            background: current === locale ? 'rgba(232,184,75,.18)' : 'transparent',
            border: `1px solid ${current === locale ? '#e8b84b' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 6,
            fontFamily: '"Fira Code", monospace',
            fontSize: 10,
            color: current === locale ? '#e8b84b' : '#6b7280',
            cursor: loading ? 'wait' : 'pointer',
            transition: 'all .2s',
            lineHeight: 1,
            fontWeight: current === locale ? '600' : '400',
          }}
        >
          {loading ? '···' : LOCALE_NAMES[locale]}
        </button>
      ))}
    </div>
  );
}
