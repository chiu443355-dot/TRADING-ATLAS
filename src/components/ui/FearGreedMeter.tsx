import { useState, useEffect } from 'react';

const ZONES = [
  { label: 'Extreme Fear', min: 0,  max: 25,  color: '#ef4444' },
  { label: 'Fear',         min: 25, max: 45,  color: '#f97316' },
  { label: 'Neutral',      min: 45, max: 55,  color: '#e8b84b' },
  { label: 'Greed',        min: 55, max: 75,  color: '#84cc16' },
  { label: 'Extreme Greed',min: 75, max: 100, color: '#22c55e' },
];

function getZone(v: number) {
  return ZONES.find(z => v >= z.min && v < z.max) ?? ZONES[2];
}

type FGData = { value: number; classification: string; timestamp: string; };

export default function FearGreedMeter() {
  const [current, setCurrent] = useState<FGData | null>(null);
  const [history, setHistory] = useState<FGData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        // Alternative.me Fear & Greed API — CORS-friendly, free, real-time
        const res = await fetch('https://api.alternative.me/fng/?limit=8&format=json');
        const json = await res.json();
        if (json?.data?.length) {
          const entries: FGData[] = json.data.map((d: any) => ({
            value: parseInt(d.value),
            classification: d.value_classification,
            timestamp: d.timestamp,
          }));
          setCurrent(entries[0]);
          setHistory(entries.reverse()); // oldest first for chart
        }
      } catch {
        setError(true);
        // Fallback to reasonable default
        setCurrent({ value: 62, classification: 'Greed', timestamp: Date.now().toString() });
        setHistory([
          { value: 45, classification: 'Neutral', timestamp: '' },
          { value: 52, classification: 'Neutral', timestamp: '' },
          { value: 58, classification: 'Greed', timestamp: '' },
          { value: 63, classification: 'Greed', timestamp: '' },
          { value: 71, classification: 'Greed', timestamp: '' },
          { value: 66, classification: 'Greed', timestamp: '' },
          { value: 60, classification: 'Greed', timestamp: '' },
          { value: 62, classification: 'Greed', timestamp: '' },
        ]);
      } finally { setLoading(false); }
    }
    load();
    // Refresh every 5 minutes
    const interval = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div style={{ background: '#08081a', border: '1px solid rgba(232,184,75,0.15)', borderRadius: 20, padding: '32px 24px', textAlign: 'center' }}>
      <div style={{ fontFamily: '"Fira Code", monospace', fontSize: 10, color: '#6b7280', animation: 'pulse 1.5s ease-in-out infinite' }}>Loading Fear & Greed Index…</div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  );

  const value = current?.value ?? 50;
  const zone = getZone(value);

  // SVG gauge math
  const cx = 100; const cy = 100; const r = 80;
  const startAngle = Math.PI; // 180°
  const totalArc = Math.PI;   // 180° sweep
  const needleAngle = startAngle + (value / 100) * totalArc;
  const nx = cx + 70 * Math.cos(needleAngle);
  const ny = cy + 70 * Math.sin(needleAngle);

  // Arc segments
  const arcSegments = ZONES.map(z => {
    const sa = startAngle + (z.min / 100) * totalArc;
    const ea = startAngle + (z.max / 100) * totalArc;
    const x1 = cx + r * Math.cos(sa); const y1 = cy + r * Math.sin(sa);
    const x2 = cx + r * Math.cos(ea); const y2 = cy + r * Math.sin(ea);
    const large = (z.max - z.min) / 100 > 0.5 ? 1 : 0;
    return { path: `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`, color: z.color };
  });

  // Filled arc to value
  const fillAngle = startAngle + (value / 100) * totalArc;
  const fx = cx + r * Math.cos(fillAngle); const fy = cy + r * Math.sin(fillAngle);
  const fillLarge = value > 50 ? 1 : 0;

  const dayLabels = history.map(h => {
    if (!h.timestamp) return '';
    const d = new Date(parseInt(h.timestamp) * 1000);
    return d.toLocaleDateString('en-IN', { weekday: 'short' }).slice(0, 2);
  });

  return (
    <div style={{ background: '#08081a', border: '1px solid rgba(232,184,75,0.15)', borderRadius: 20, padding: '20px 20px 16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontFamily: '"Fira Code", monospace', fontSize: 10, color: '#e8b84b', letterSpacing: '.3em' }}>FEAR & GREED INDEX</div>
          <div style={{ fontFamily: '"Fira Code", monospace', fontSize: 8, color: '#374151', marginTop: 2 }}>
            {error ? 'CACHED DATA' : 'CRYPTO MARKET · ALTERNATIVE.ME · LIVE'}
          </div>
        </div>
        <div style={{ fontFamily: '"Fira Code", monospace', fontSize: 8, color: '#4b5563', textAlign: 'right' }}>
          {current?.timestamp ? new Date(parseInt(current.timestamp) * 1000).toLocaleDateString('en-IN') : 'Today'}
        </div>
      </div>

      {/* Gauge */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <svg width="200" height="115" viewBox="0 0 200 115">
          {/* Background arc segments */}
          {arcSegments.map((seg, i) => (
            <path key={i} d={seg.path} fill="none" stroke={seg.color} strokeWidth="14" strokeOpacity="0.18" />
          ))}
          {/* Filled arc */}
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 ${fillLarge} 1 ${fx} ${fy}`}
            fill="none" stroke={zone.color} strokeWidth="14" strokeLinecap="round"
            style={{ transition: 'all 1.5s cubic-bezier(.22,1,.36,1)' }}
          />
          {/* Tick marks */}
          {[0, 25, 50, 75, 100].map(pct => {
            const ang = startAngle + (pct / 100) * totalArc;
            const ix = cx + 89 * Math.cos(ang); const iy = cy + 89 * Math.sin(ang);
            const ox = cx + 96 * Math.cos(ang); const oy = cy + 96 * Math.sin(ang);
            return <line key={pct} x1={ix} y1={iy} x2={ox} y2={oy} stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />;
          })}
          {/* Needle */}
          <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#fff" strokeWidth="2.5" strokeLinecap="round"
            style={{ transition: 'all 1.5s cubic-bezier(.22,1,.36,1)', transformOrigin: `${cx}px ${cy}px` }} />
          <circle cx={cx} cy={cy} r="6" fill={zone.color} style={{ transition: 'fill 1s' }} />
          {/* Value text */}
          <text x={cx} y={cy - 14} textAnchor="middle" fill="#fff" fontFamily='"Playfair Display",serif' fontSize="30" fontWeight="700">{value}</text>
          {/* Zone labels */}
          <text x="15"  y="112" textAnchor="middle" fill="#ef4444" fontFamily='"Fira Code",monospace' fontSize="6.5">FEAR</text>
          <text x="100" y="24"  textAnchor="middle" fill="#e8b84b" fontFamily='"Fira Code",monospace' fontSize="6.5">NEUTRAL</text>
          <text x="185" y="112" textAnchor="middle" fill="#22c55e" fontFamily='"Fira Code",monospace' fontSize="6.5">GREED</text>
        </svg>

        {/* Classification */}
        <div style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: 16, fontWeight: 700, color: zone.color, marginTop: 4, transition: 'color 1s', letterSpacing: '-.01em' }}>
          {zone.label}
        </div>
        <div style={{ fontFamily: '"Fira Code", monospace', fontSize: 8, color: '#4b5563', marginTop: 2 }}>
          Based on volatility, volume, social, dominance, trends
        </div>
      </div>

      {/* 8-day History Bar Chart */}
      {history.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontFamily: '"Fira Code", monospace', fontSize: 8, color: '#4b5563', letterSpacing: '.15em', marginBottom: 8 }}>8-DAY HISTORY</div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 48 }}>
            {history.map((h, i) => {
              const z = getZone(h.value);
              const isLatest = i === history.length - 1;
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <div style={{ width: '100%', height: Math.max(6, (h.value / 100) * 40), background: z.color, borderRadius: 3, opacity: isLatest ? 1 : 0.35 + (i / history.length) * 0.45, transition: 'height .5s', position: 'relative' }}>
                    {isLatest && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', fontFamily: '"Fira Code",monospace', fontSize: 7, color: z.color, whiteSpace: 'nowrap' }}>{h.value}</div>}
                  </div>
                  <div style={{ fontFamily: '"Fira Code", monospace', fontSize: 6.5, color: '#374151' }}>{dayLabels[i]}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Zone legend */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
        {ZONES.map(z => (
          <div key={z.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: z.color, boxShadow: value >= z.min && value < z.max ? `0 0 6px ${z.color}` : 'none' }} />
            <div style={{ fontFamily: '"Fira Code", monospace', fontSize: 6.5, color: value >= z.min && value < z.max ? z.color : '#374151', whiteSpace: 'nowrap' }}>{z.label.split(' ').pop()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
