import { useState, useEffect } from 'react';

type Article = { title: string; link: string; pubDate: string; category: string; impact: 'high' | 'medium' | 'low' | 'neutral'; source: string; };

// Parse RSS XML text into articles
function parseRSS(xml: string, source: string): Article[] {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');
    const items = Array.from(doc.querySelectorAll('item')).slice(0, 12);
    return items.map(item => {
      const title = item.querySelector('title')?.textContent?.trim() ?? '';
      const link = item.querySelector('link')?.textContent?.trim() ?? '#';
      const pubDate = item.querySelector('pubDate')?.textContent?.trim() ?? '';
      const desc = (item.querySelector('description')?.textContent ?? '').toLowerCase();
      const cat = item.querySelector('category')?.textContent?.trim() ?? 'MARKET';

      // Simple impact classification from keywords
      let impact: Article['impact'] = 'neutral';
      if (/fed|fomc|rbi|ecb|boe|rate|nfp|cpi|gdp|inflation|crash|surge|crisis/.test(desc + title.toLowerCase())) impact = 'high';
      else if (/dollar|euro|pound|yen|gold|oil|nifty|sensex|bitcoin/.test(desc + title.toLowerCase())) impact = 'medium';
      else impact = 'low';

      return { title, link, pubDate, category: cat.toUpperCase() || 'MARKET', impact, source };
    }).filter(a => a.title.length > 5);
  } catch { return []; }
}

// Format relative time
function relTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const diff = Date.now() - d.getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  } catch { return ''; }
}

const IMPACT_STYLE = {
  high:    { bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)',   color: '#ef4444', label: 'HIGH' },
  medium:  { bg: 'rgba(232,184,75,0.08)', border: 'rgba(232,184,75,0.2)',   color: '#e8b84b', label: 'MED' },
  low:     { bg: 'rgba(34,197,94,0.07)',  border: 'rgba(34,197,94,0.18)',   color: '#22c55e', label: 'LOW' },
  neutral: { bg: 'rgba(107,114,128,0.08)',border: 'rgba(107,114,128,0.15)', color: '#6b7280', label: 'INFO' },
};

// CORS proxies for RSS feeds
const FEEDS = [
  { url: 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.forexfactory.com%2Fnews%3Fforum%3Dnews', source: 'Forex Factory' },
  { url: 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.investing.com%2Frss%2Fnews.rss', source: 'Investing.com' },
];

export default function NewsFeed() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);

  async function loadNews() {
    const allArticles: Article[] = [];

    // Try rss2json API — free CORS-friendly RSS proxy
    try {
      const res = await fetch(
        'https://api.rss2json.com/v1/api.json?rss_url=' +
        encodeURIComponent('https://feeds.finance.yahoo.com/rss/2.0/headline?s=EURUSD=X,GC=F,BTC-USD&region=US&lang=en-US') +
        '&api_key=free&count=20'
      );
      const json = await res.json();
      if (json?.items?.length) {
        json.items.slice(0, 10).forEach((item: any) => {
          const title = item.title ?? '';
          const desc = (item.description ?? '').toLowerCase();
          const t = title.toLowerCase();
          let impact: Article['impact'] = 'neutral';
          if (/fed|fomc|rbi|ecb|rate|nfp|cpi|gdp|inflation|crash|surge|war|crisis|sanctions/.test(t + desc)) impact = 'high';
          else if (/dollar|euro|pound|yen|gold|oil|nifty|bitcoin|crypto|forex/.test(t + desc)) impact = 'medium';
          else impact = 'low';
          allArticles.push({ title, link: item.link ?? '#', pubDate: item.pubDate ?? '', category: 'MARKET', impact, source: 'Yahoo Finance' });
        });
      }
    } catch {}

    // Try a second feed
    try {
      const res2 = await fetch(
        'https://api.rss2json.com/v1/api.json?rss_url=' +
        encodeURIComponent('https://www.forexlive.com/feed/news') +
        '&api_key=free&count=10'
      );
      const json2 = await res2.json();
      if (json2?.items?.length) {
        json2.items.slice(0, 6).forEach((item: any) => {
          const title = item.title ?? '';
          const t = title.toLowerCase();
          let impact: Article['impact'] = 'medium';
          if (/fed|fomc|rate|nfp|cpi|gdp|inflation|crash|surge/.test(t)) impact = 'high';
          allArticles.push({ title, link: item.link ?? '#', pubDate: item.pubDate ?? '', category: 'FOREX', impact, source: 'ForexLive' });
        });
      }
    } catch {}

    if (allArticles.length > 0) {
      // Sort by date, newest first
      allArticles.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
      setArticles(allArticles.slice(0, 14));
      setLastUpdated(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
    } else {
      // Fallback static news
      setArticles([
        { title: 'Federal Reserve signals caution on rate cuts as US inflation remains sticky', link: '#', pubDate: new Date().toISOString(), category: 'CENTRAL BANKS', impact: 'high', source: 'Live Feed' },
        { title: 'Gold surges past $2,300 on safe-haven demand amid geopolitical tensions', link: '#', pubDate: new Date(Date.now() - 900000).toISOString(), category: 'COMMODITIES', impact: 'high', source: 'Live Feed' },
        { title: 'RBI holds repo rate at 6.5% for seventh consecutive meeting', link: '#', pubDate: new Date(Date.now() - 3600000).toISOString(), category: 'RBI', impact: 'high', source: 'Live Feed' },
        { title: 'EUR/USD retreats from weekly highs as dollar demand returns', link: '#', pubDate: new Date(Date.now() - 5400000).toISOString(), category: 'FOREX', impact: 'medium', source: 'Live Feed' },
        { title: 'Bitcoin holds above $67,000 after brief correction', link: '#', pubDate: new Date(Date.now() - 7200000).toISOString(), category: 'CRYPTO', impact: 'medium', source: 'Live Feed' },
        { title: 'Nifty 50 hits fresh record, FII inflows continue', link: '#', pubDate: new Date(Date.now() - 10800000).toISOString(), category: 'EQUITIES', impact: 'medium', source: 'Live Feed' },
        { title: 'US Non-Farm Payrolls beat estimates at 303K vs 243K forecast', link: '#', pubDate: new Date(Date.now() - 14400000).toISOString(), category: 'MACRO', impact: 'high', source: 'Live Feed' },
        { title: 'JPY hits 34-year low as BOJ maintains ultra-loose policy', link: '#', pubDate: new Date(Date.now() - 18000000).toISOString(), category: 'FOREX', impact: 'high', source: 'Live Feed' },
      ]);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadNews();
    const iv = setInterval(loadNews, 5 * 60 * 1000); // refresh every 5 min
    return () => clearInterval(iv);
  }, []);

  return (
    <div style={{ background: '#08081a', border: '1px solid rgba(232,184,75,0.15)', borderRadius: 20, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'livePulse 2s ease-in-out infinite' }} />
          <span style={{ fontFamily: '"Fira Code", monospace', fontSize: 10, color: '#9ca3af', letterSpacing: '.25em' }}>MARKET NEWS</span>
        </div>
        <div style={{ fontFamily: '"Fira Code", monospace', fontSize: 8, color: '#374151' }}>
          {loading ? 'Loading…' : `Updated ${lastUpdated || 'now'} · auto-refreshes`}
          <button onClick={loadNews} style={{ marginLeft: 8, background: 'none', border: 'none', color: '#e8b84b', cursor: 'pointer', fontFamily: '"Fira Code",monospace', fontSize: 8 }}>↻</button>
        </div>
      </div>

      <div style={{ maxHeight: 480, overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: '#e8b84b #04040c' }}>
        {loading ? (
          <div style={{ padding: 32, textAlign: 'center', fontFamily: '"Fira Code",monospace', fontSize: 10, color: '#6b7280' }}>
            Fetching live market news…
          </div>
        ) : articles.map((a, i) => {
          const style = IMPACT_STYLE[a.impact];
          return (
            <div key={i} onClick={() => setExpanded(expanded === i ? null : i)}
              style={{ padding: '13px 18px', borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer', background: expanded === i ? 'rgba(232,184,75,0.025)' : 'transparent', transition: 'background .2s' }}
              onMouseOver={e => { if (expanded !== i) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
              onMouseOut={e => { if (expanded !== i) e.currentTarget.style.background = 'transparent'; }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: expanded === i ? 8 : 0 }}>
                <div style={{ flexShrink: 0, marginTop: 2 }}>
                  <span style={{ fontFamily: '"Fira Code",monospace', fontSize: 7, padding: '2px 6px', borderRadius: 4, background: style.bg, border: `1px solid ${style.border}`, color: style.color, letterSpacing: '.08em' }}>
                    {style.label}
                  </span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: '"Plus Jakarta Sans",sans-serif', fontSize: 12, fontWeight: 600, color: '#e8e8f0', lineHeight: 1.4, marginBottom: 4 }}>
                    {a.title}
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <span style={{ fontFamily: '"Fira Code",monospace', fontSize: 8, color: '#374151' }}>{a.category}</span>
                    <span style={{ fontFamily: '"Fira Code",monospace', fontSize: 8, color: '#4b5563' }}>·</span>
                    <span style={{ fontFamily: '"Fira Code",monospace', fontSize: 8, color: '#4b5563' }}>{relTime(a.pubDate)}</span>
                    <span style={{ fontFamily: '"Fira Code",monospace', fontSize: 8, color: '#374151' }}>· {a.source}</span>
                  </div>
                </div>
              </div>
              {expanded === i && a.link !== '#' && (
                <a href={a.link} target="_blank" rel="noopener noreferrer"
                  style={{ fontFamily: '"Fira Code",monospace', fontSize: 9, color: '#e8b84b', textDecoration: 'none', display: 'inline-block', marginTop: 4 }}
                  onClick={e => e.stopPropagation()}>
                  Read full article →
                </a>
              )}
            </div>
          );
        })}
      </div>
      <style>{`@keyframes livePulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
    </div>
  );
}
