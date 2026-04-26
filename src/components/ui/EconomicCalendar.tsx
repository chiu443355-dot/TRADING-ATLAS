import { useState } from 'react';

type Impact = 'high' | 'medium' | 'low';
type Event = {
  time: string; currency: string; name: string;
  impact: Impact; previous: string; forecast: string; actual?: string;
};

const EVENTS: Event[] = [
  { time: '14:00 IST', currency: 'INR', name: 'RBI Monetary Policy Statement', impact: 'high', previous: '6.50%', forecast: '6.50%', actual: '6.50%' },
  { time: '18:00 IST', currency: 'USD', name: 'FOMC Meeting Minutes', impact: 'high', previous: '—', forecast: '—' },
  { time: '18:30 IST', currency: 'USD', name: 'Non-Farm Payrolls (NFP)', impact: 'high', previous: '303K', forecast: '243K' },
  { time: '19:00 IST', currency: 'USD', name: 'US CPI (YoY)', impact: 'high', previous: '3.2%', forecast: '3.4%', actual: '3.5%' },
  { time: '14:30 IST', currency: 'EUR', name: 'ECB Interest Rate Decision', impact: 'high', previous: '4.50%', forecast: '4.50%' },
  { time: '11:30 IST', currency: 'GBP', name: 'UK GDP (MoM)', impact: 'medium', previous: '0.1%', forecast: '0.1%' },
  { time: '09:00 IST', currency: 'INR', name: 'India Manufacturing PMI', impact: 'medium', previous: '59.1', forecast: '58.8', actual: '59.1' },
  { time: '20:30 IST', currency: 'USD', name: 'US Unemployment Claims', impact: 'medium', previous: '212K', forecast: '215K' },
  { time: '22:00 IST', currency: 'USD', name: 'ISM Non-Manufacturing PMI', impact: 'medium', previous: '52.6', forecast: '52.8' },
  { time: '15:00 IST', currency: 'JPY', name: 'Bank of Japan Policy Rate', impact: 'high', previous: '0.10%', forecast: '0.10%' },
  { time: '11:00 IST', currency: 'AUD', name: 'RBA Meeting Minutes', impact: 'low', previous: '—', forecast: '—' },
  { time: '16:30 IST', currency: 'CAD', name: 'Canada CPI (MoM)', impact: 'low', previous: '0.6%', forecast: '0.5%' },
];

const IMPACT_COLORS: Record<Impact, string> = {
  high: '#ef4444', medium: '#f59e0b', low: '#22c55e'
};

const CURRENCY_FLAGS: Record<string, string> = {
  USD: '🇺🇸', EUR: '🇪🇺', GBP: '🇬🇧', JPY: '🇯🇵',
  INR: '🇮🇳', AUD: '🇦🇺', CAD: '🇨🇦', CNY: '🇨🇳'
};

export default function EconomicCalendar() {
  const [filter, setFilter] = useState<Impact | 'all'>('all');

  const filtered = filter === 'all' ? EVENTS : EVENTS.filter(e => e.impact === filter);

  return (
    <div style={{ background: '#08081a', border: '1px solid rgba(232,184,75,0.15)', borderRadius: 20, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: '"Fira Code", monospace', fontSize: 10, color: '#e8b84b', letterSpacing: '.3em', marginBottom: 2 }}>ECONOMIC CALENDAR</div>
          <div style={{ fontFamily: '"Fira Code", monospace', fontSize: 9, color: '#4b5563' }}>IST TIMEZONE · THIS WEEK</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['all', 'high', 'medium', 'low'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '5px 12px', borderRadius: 6, border: `1px solid ${filter === f ? (f === 'all' ? '#e8b84b' : IMPACT_COLORS[f as Impact]) : 'rgba(255,255,255,0.08)'}`,
              background: filter === f ? (f === 'all' ? 'rgba(232,184,75,0.1)' : `${IMPACT_COLORS[f as Impact]}15`) : 'transparent',
              color: filter === f ? (f === 'all' ? '#e8b84b' : IMPACT_COLORS[f as Impact]) : '#6b7280',
              fontFamily: '"Fira Code", monospace', fontSize: 9, cursor: 'pointer', letterSpacing: '.1em', textTransform: 'uppercase',
            }}>
              {f === 'all' ? 'All' : f}
            </button>
          ))}
        </div>
      </div>

      {/* Table header */}
      <div style={{ display: 'grid', gridTemplateColumns: '80px 50px 1fr 60px 80px 80px 80px', gap: 8, padding: '10px 20px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        {['TIME', 'CCY', 'EVENT', 'IMPACT', 'PREV', 'FCST', 'ACTUAL'].map(h => (
          <div key={h} style={{ fontFamily: '"Fira Code", monospace', fontSize: 8, color: '#4b5563', letterSpacing: '.15em' }}>{h}</div>
        ))}
      </div>

      {/* Events */}
      <div style={{ maxHeight: 360, overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: '#e8b84b #04040c' }}>
        {filtered.map((ev, i) => (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: '80px 50px 1fr 60px 80px 80px 80px', gap: 8,
            padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.03)',
            background: ev.actual ? 'rgba(255,255,255,0.01)' : 'transparent',
            transition: 'background .2s',
          }}
            onMouseOver={e => (e.currentTarget.style.background = 'rgba(232,184,75,0.03)')}
            onMouseOut={e => (e.currentTarget.style.background = ev.actual ? 'rgba(255,255,255,0.01)' : 'transparent')}
          >
            <div style={{ fontFamily: '"Fira Code", monospace', fontSize: 10, color: '#6b7280' }}>{ev.time}</div>
            <div style={{ fontFamily: '"Fira Code", monospace', fontSize: 10, color: '#9ca3af' }}>
              {CURRENCY_FLAGS[ev.currency] || ''} {ev.currency}
            </div>
            <div style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: 12, color: '#e8e8f0', lineHeight: 1.3 }}>{ev.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {[1, 2, 3].map(n => (
                <div key={n} style={{
                  width: 6, height: 6, borderRadius: 1,
                  background: n <= (ev.impact === 'high' ? 3 : ev.impact === 'medium' ? 2 : 1) ? IMPACT_COLORS[ev.impact] : 'rgba(255,255,255,0.1)',
                }} />
              ))}
            </div>
            <div style={{ fontFamily: '"Fira Code", monospace', fontSize: 10, color: '#6b7280' }}>{ev.previous}</div>
            <div style={{ fontFamily: '"Fira Code", monospace', fontSize: 10, color: '#9ca3af' }}>{ev.forecast}</div>
            <div style={{ fontFamily: '"Fira Code", monospace', fontSize: 10, color: ev.actual ? (parseFloat(ev.actual) > parseFloat(ev.forecast) ? '#22c55e' : '#ef4444') : '#4b5563' }}>
              {ev.actual || '—'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
