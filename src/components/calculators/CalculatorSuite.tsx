import { useState, useCallback, useRef } from 'react';
import { buildShareResult, copyToClipboard } from '../../lib/viral';

function formatNum(n: number, prefix = '', suffix = ''): string {
  if (isNaN(n)) return `${prefix}0${suffix}`;
  const abs = Math.abs(n);
  let formatted: string;
  if (abs >= 1_000_000_000) formatted = (n / 1_000_000_000).toFixed(2) + 'B';
  else if (abs >= 1_000_000) formatted = (n / 1_000_000).toFixed(2) + 'M';
  else if (abs >= 100_000) formatted = n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  else if (abs >= 1000) formatted = n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  else formatted = n.toLocaleString('en-IN', { maximumFractionDigits: 4, minimumFractionDigits: 2 });
  return `${prefix}${formatted}${suffix}`;
}

const inp: React.CSSProperties = {
  background: '#0c0c1e', border: '1px solid rgba(255,255,255,0.08)', color: '#e8e8f0',
  fontFamily: '"Fira Code", monospace', fontSize: 14, padding: '11px 14px',
  borderRadius: 8, outline: 'none', width: '100%',
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontFamily: '"Fira Code", monospace', fontSize: 9, color: '#6b7280', letterSpacing: '.15em', textTransform: 'uppercase' }}>{label}</div>
      {children}
    </div>
  );
}

function Res({ value, label, color }: { value: string; label: string; color?: string }) {
  const len = value.length;
  const fontSize = len > 12 ? 16 : len > 9 ? 20 : len > 7 ? 22 : 26;
  return (
    <div style={{ textAlign: 'center', padding: '4px 2px' }}>
      <div style={{ fontFamily: '"Playfair Display", serif', fontSize, color: color ?? '#e8b84b', lineHeight: 1.2, wordBreak: 'break-all', minHeight: 34, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {value}
      </div>
      <div style={{ fontFamily: '"Fira Code", monospace', fontSize: 9, color: '#6b7280', marginTop: 5, letterSpacing: '.1em' }}>{label}</div>
    </div>
  );
}

const resGrid: React.CSSProperties = {
  background: '#0c0c1e', borderRadius: 12, padding: '20px 16px',
  display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '12px 8px',
};

function SharePanel({ share, xpFn }: { share: { text: string; whatsapp: string; twitter: string }; xpFn: () => void }) {
  const [copied, setCopied] = useState(false);
  const [xpShown, setXpShown] = useState(false);

  const handleCopy = async () => {
    await copyToClipboard(share.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    xpFn(); setXpShown(true);
  };

  return (
    <div style={{ gridColumn: '1/-1', border: '1px solid rgba(232,184,75,.2)', borderRadius: 12, background: 'rgba(232,184,75,.03)', padding: 18, marginTop: 8 }}>
      <div style={{ fontFamily: '"Fira Code", monospace', fontSize: 9, color: '#e8b84b', letterSpacing: '.25em', marginBottom: 10 }}>🧠 SHAREABLE RESULT</div>
      <pre style={{ background: '#04040c', borderRadius: 8, padding: 12, fontFamily: '"Fira Code", monospace', fontSize: 10, color: '#9ca3af', lineHeight: 1.7, border: '1px solid rgba(255,255,255,0.06)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginBottom: 12, maxHeight: 160, overflowY: 'auto' }}>
        {share.text}
      </pre>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <a href={share.whatsapp} target="_blank" rel="noopener noreferrer" onClick={() => { xpFn(); setXpShown(true); }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: '#25d366', color: '#000', fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
          WhatsApp
        </a>
        <a href={share.twitter} target="_blank" rel="noopener noreferrer" onClick={() => { xpFn(); setXpShown(true); }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: '#1d9bf0', color: '#fff', fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
          Post on X
        </a>
        <button onClick={handleCopy}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: '#0c0c1e', color: copied ? '#22c55e' : '#e8e8f0', border: `1px solid ${copied ? '#22c55e' : 'rgba(255,255,255,0.08)'}`, fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
          {copied ? '✓ Copied!' : '📋 Copy'}
        </button>
      </div>
      {xpShown && <div style={{ fontFamily: '"Fira Code", monospace', fontSize: 9, color: '#22c55e', marginTop: 8 }}>✓ +25 XP earned!</div>}
    </div>
  );
}

function RiskReward({ onShare }: { onShare: () => void }) {
  const [acc, setAcc] = useState(1000);
  const [rp, setRp] = useState(1);
  const [sl, setSl] = useState(20);
  const [tp, setTp] = useState(40);
  const risk = acc * rp / 100;
  const ratio = tp / sl;
  const reward = risk * ratio;
  const be = Math.round(100 / (1 + ratio));
  const share = buildShareResult('rr', { risk: risk.toFixed(2), reward: reward.toFixed(2), ratio: ratio.toFixed(2), breakeven: be, account: acc });
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14 }}>
        <Field label="Account ($)"><input type="number" style={inp} value={acc} onChange={e => setAcc(+e.target.value)} /></Field>
        <Field label="Risk Per Trade (%)"><input type="number" style={inp} value={rp} step={0.1} onChange={e => setRp(+e.target.value)} /></Field>
        <Field label="Stop Loss (pips)"><input type="number" style={inp} value={sl} onChange={e => setSl(+e.target.value)} /></Field>
        <Field label="Take Profit (pips)"><input type="number" style={inp} value={tp} onChange={e => setTp(+e.target.value)} /></Field>
      </div>
      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '20px 0' }} />
      <div style={resGrid}>
        <Res value={formatNum(risk, '$')} label="$ at Risk" color="#ef4444" />
        <Res value={formatNum(reward, '$')} label="$ Target" color="#22c55e" />
        <Res value={`1:${ratio.toFixed(2)}`} label="R:R Ratio" color="#38bdf8" />
        <Res value={`${be}%`} label="Breakeven Win%" color="#a78bfa" />
        <div style={{ gridColumn: '1/-1' }}>
          <div style={{ fontFamily: '"Fira Code", monospace', fontSize: 9, color: '#6b7280', marginBottom: 6 }}>Risk Level</div>
          <div style={{ height: 4, background: '#04040c', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(rp * 10, 100)}%`, borderRadius: 99, background: 'linear-gradient(90deg,#e8b84b,#f5d07a)', transition: 'width .9s cubic-bezier(.22,1,.36,1)' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: '"Fira Code", monospace', fontSize: 9, color: '#374151', marginTop: 4 }}>
            <span>Conservative</span>
            <span>{rp <= 1 ? 'Optimal ✓' : rp <= 2 ? 'Moderate' : rp <= 4 ? 'Aggressive' : 'Dangerous ✗'}</span>
            <span>Dangerous</span>
          </div>
        </div>
        <SharePanel share={{ text: share.copyText, whatsapp: share.whatsapp, twitter: share.twitter }} xpFn={onShare} />
      </div>
    </div>
  );
}

function PositionSize({ onShare }: { onShare: () => void }) {
  const [acc, setAcc] = useState(1000);
  const [rp, setRp] = useState(1);
  const [sl, setSl] = useState(20);
  const [pv, setPv] = useState(10);
  const risk = acc * rp / 100;
  const pipDollarPerUnit = pv / 100000;
  const units = Math.round(risk / (sl * pipDollarPerUnit));
  const lots = units / 100000;
  const ppv = units * pipDollarPerUnit;
  const share = buildShareResult('position', { account: acc, riskPct: rp, lots: lots.toFixed(3), ppv: ppv.toFixed(2), risk: risk.toFixed(2) });
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14 }}>
        <Field label="Account ($)"><input type="number" style={inp} value={acc} onChange={e => setAcc(+e.target.value)} /></Field>
        <Field label="Risk %"><input type="number" style={inp} value={rp} step={0.1} onChange={e => setRp(+e.target.value)} /></Field>
        <Field label="Stop Loss (pips)"><input type="number" style={inp} value={sl} onChange={e => setSl(+e.target.value)} /></Field>
        <Field label="Pair Type">
          <select style={{ ...inp, cursor: 'pointer' }} value={pv} onChange={e => setPv(+e.target.value)}>
            <option value={10}>EUR/USD, GBP/USD, AUD/USD</option>
            <option value={9.1}>USD/JPY, EUR/JPY</option>
            <option value={7.5}>USD/CAD</option>
          </select>
        </Field>
      </div>
      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '20px 0' }} />
      <div style={resGrid}>
        <Res value={formatNum(risk, '$')} label="$ at Risk" color="#ef4444" />
        <Res value={lots.toFixed(3)} label="Lot Size" color="#38bdf8" />
        <Res value={formatNum(units)} label="Units" color="#22c55e" />
        <Res value={formatNum(ppv, '$')} label="$ per Pip" color="#a78bfa" />
        <SharePanel share={{ text: share.copyText, whatsapp: share.whatsapp, twitter: share.twitter }} xpFn={onShare} />
      </div>
    </div>
  );
}

function PipValue({ onShare }: { onShare: () => void }) {
  const [pairPv, setPairPv] = useState(10);
  const [lot, setLot] = useState(10000);
  const [pips, setPips] = useState(50);
  const [inrRate, setInrRate] = useState(83.47);
  const perPip = (lot / 100000) * pairPv;
  const total = perPip * pips;
  const inr = Math.round(total * inrRate);
  const share = buildShareResult('pip', { pair: 'EUR/USD', pips, perPip: perPip.toFixed(2), total: total.toFixed(2), inr: inr.toLocaleString('en-IN') });
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14 }}>
        <Field label="Pair Type"><select style={{ ...inp, cursor: 'pointer' }} value={pairPv} onChange={e => setPairPv(+e.target.value)}>
          <option value={10}>EUR/USD, GBP/USD (Major)</option>
          <option value={9.1}>USD/JPY (JPY pair)</option>
        </select></Field>
        <Field label="Lot Size"><select style={{ ...inp, cursor: 'pointer' }} value={lot} onChange={e => setLot(+e.target.value)}>
          <option value={100000}>Standard (1.0)</option>
          <option value={10000}>Mini (0.1)</option>
          <option value={1000}>Micro (0.01)</option>
        </select></Field>
        <Field label="Pips Moved"><input type="number" style={inp} value={pips} onChange={e => setPips(+e.target.value)} /></Field>
        <Field label="USD/INR Rate"><input type="number" style={inp} value={inrRate} step={0.1} onChange={e => setInrRate(+e.target.value)} /></Field>
      </div>
      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '20px 0' }} />
      <div style={resGrid}>
        <Res value={formatNum(perPip, '$')} label="Per Pip" />
        <Res value={formatNum(total, '$')} label="Total P&L ($)" color="#22c55e" />
        <Res value={formatNum(inr, '₹')} label="Total P&L (₹)" color="#38bdf8" />
        <SharePanel share={{ text: share.copyText, whatsapp: share.whatsapp, twitter: share.twitter }} xpFn={onShare} />
      </div>
    </div>
  );
}

function Compounding({ onShare }: { onShare: () => void }) {
  const [start, setStart] = useState(1000);
  const [rate, setRate] = useState(5);
  const [months, setMonths] = useState(24);
  const [contrib, setContrib] = useState(0);
  let val = start;
  const points: number[] = [start];
  for (let i = 0; i < months; i++) { val = val * (1 + rate / 100) + contrib; points.push(val); }
  const profit = val - start - contrib * months;
  const mult = start > 0 ? val / start : 0;
  const W = 500; const H = 80;
  const minV = Math.min(...points); const maxV = Math.max(...points); const range = maxV - minV || 1;
  const pts = points.map((v, i) => `${(i / (points.length - 1)) * (W - 20) + 10},${H - 4 - ((v - minV) / range) * (H - 12)}`).join(' ');
  const share = buildShareResult('compound', { start, final: Math.round(val), rate, months, multiple: mult.toFixed(2) });
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14 }}>
        <Field label="Starting Capital ($)"><input type="number" style={inp} value={start} onChange={e => setStart(+e.target.value)} /></Field>
        <Field label="Monthly Return (%)"><input type="number" style={inp} value={rate} step={0.5} onChange={e => setRate(+e.target.value)} /></Field>
        <Field label="Months"><input type="number" style={inp} value={months} min={1} max={360} onChange={e => setMonths(+e.target.value)} /></Field>
        <Field label="Monthly Contribution ($)"><input type="number" style={inp} value={contrib} onChange={e => setContrib(+e.target.value)} /></Field>
      </div>
      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '20px 0' }} />
      <div style={resGrid}>
        <Res value={formatNum(val, '$')} label="Final Value" color="#22c55e" />
        <Res value={(profit >= 0 ? '+' : '') + formatNum(Math.abs(profit), '$')} label="Profit" />
        <Res value={`${mult.toFixed(2)}×`} label="Growth Multiple" color="#38bdf8" />
        <div style={{ gridColumn: '1/-1' }}>
          <div style={{ fontFamily: '"Fira Code", monospace', fontSize: 9, color: '#6b7280', marginBottom: 6 }}>Compound Growth Curve</div>
          <div style={{ background: '#04040c', borderRadius: 8, height: 80, overflow: 'hidden' }}>
            <svg width="100%" height="80" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
              <defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e8b84b" stopOpacity="0.3" /><stop offset="100%" stopColor="#e8b84b" stopOpacity="0" /></linearGradient></defs>
              <polygon points={`${pts} ${W - 10},${H} 10,${H}`} fill="url(#cg)" />
              <polyline points={pts} fill="none" stroke="#e8b84b" strokeWidth="2" />
            </svg>
          </div>
        </div>
        <SharePanel share={{ text: share.copyText, whatsapp: share.whatsapp, twitter: share.twitter }} xpFn={onShare} />
      </div>
    </div>
  );
}

function WinRate({ onShare }: { onShare: () => void }) {
  const [wr, setWr] = useState(55);
  const [rr, setRr] = useState(2);
  const [trades, setTrades] = useState(20);
  const [risk, setRisk] = useState(10);
  const wins = Math.round(trades * wr / 100);
  const losses = trades - wins;
  const pnl = wins * risk * rr - losses * risk;
  const edge = (wr / 100) * rr - (1 - wr / 100);
  const exp = edge * risk;
  const prog = Math.min(Math.max((edge * 100 + 20) / 40 * 100, 0), 100);
  const share = buildShareResult('winrate', { wr, rr, trades, pnl: (pnl >= 0 ? '+' : '') + '$' + Math.abs(pnl).toFixed(0), edge: (edge * 100).toFixed(2) });
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14 }}>
        <Field label="Win Rate (%)"><input type="number" style={inp} value={wr} min={1} max={99} onChange={e => setWr(+e.target.value)} /></Field>
        <Field label="Risk:Reward"><input type="number" style={inp} value={rr} step={0.5} min={0.5} onChange={e => setRr(+e.target.value)} /></Field>
        <Field label="Number of Trades"><input type="number" style={inp} value={trades} min={1} onChange={e => setTrades(+e.target.value)} /></Field>
        <Field label="Risk per Trade ($)"><input type="number" style={inp} value={risk} onChange={e => setRisk(+e.target.value)} /></Field>
      </div>
      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '20px 0' }} />
      <div style={resGrid}>
        <Res value={String(wins)} label="Expected Wins" color="#22c55e" />
        <Res value={String(losses)} label="Expected Losses" color="#ef4444" />
        <Res value={(pnl >= 0 ? '+' : '') + formatNum(Math.abs(pnl), '$')} label="Expected P&L" color={pnl >= 0 ? '#22c55e' : '#ef4444'} />
        <Res value={`${edge >= 0 ? '+' : ''}${(edge * 100).toFixed(2)}%`} label="Edge %" color={edge >= 0 ? '#38bdf8' : '#ef4444'} />
        <Res value={formatNum(exp, '$')} label="Per-Trade Expectancy" color="#a78bfa" />
        <div style={{ gridColumn: '1/-1' }}>
          <div style={{ fontFamily: '"Fira Code", monospace', fontSize: 9, color: '#6b7280', marginBottom: 6 }}>System Quality</div>
          <div style={{ height: 4, background: '#04040c', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${prog}%`, borderRadius: 99, background: 'linear-gradient(90deg,#e8b84b,#f5d07a)', transition: 'width .9s' }} />
          </div>
        </div>
        <SharePanel share={{ text: share.copyText, whatsapp: share.whatsapp, twitter: share.twitter }} xpFn={onShare} />
      </div>
    </div>
  );
}

const TABS = [
  { id: 'rr', label: 'RISK/REWARD' },
  { id: 'pos', label: 'POSITION' },
  { id: 'pip', label: 'PIP VALUE' },
  { id: 'comp', label: 'COMPOUND' },
  { id: 'winrate', label: 'WIN RATE' },
];

export default function CalculatorSuite() {
  const [active, setActive] = useState('rr');
  const [xpGained, setXpGained] = useState(0);
  const handleShare = useCallback(() => {
    setXpGained(x => x + 25);
    window.dispatchEvent(new CustomEvent('wikwiz:xp', { detail: { amount: 25, reason: 'share' } }));
  }, []);

  return (
    <div style={{ background: '#08081a', border: '1px solid rgba(232,184,75,0.15)', borderRadius: 20, overflow: 'hidden', margin: '24px 0' }}>
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActive(tab.id)} style={{
            flex: '1 0 auto', minWidth: 100, padding: '14px 12px',
            fontFamily: '"Fira Code", monospace', fontSize: 9, letterSpacing: '.08em', textAlign: 'center',
            cursor: 'pointer', color: active === tab.id ? '#e8b84b' : '#6b7280',
            border: 'none', background: active === tab.id ? 'rgba(232,184,75,.06)' : 'transparent',
            borderBottom: `2px solid ${active === tab.id ? '#e8b84b' : 'transparent'}`, whiteSpace: 'nowrap',
          }}>
            {tab.label}
          </button>
        ))}
      </div>
      <div style={{ padding: '24px 20px' }}>
        {active === 'rr' && <RiskReward onShare={handleShare} />}
        {active === 'pos' && <PositionSize onShare={handleShare} />}
        {active === 'pip' && <PipValue onShare={handleShare} />}
        {active === 'comp' && <Compounding onShare={handleShare} />}
        {active === 'winrate' && <WinRate onShare={handleShare} />}
      </div>
      {xpGained > 0 && (
        <div style={{ padding: '6px 20px 14px', fontFamily: '"Fira Code", monospace', fontSize: 9, color: '#22c55e', letterSpacing: '.1em' }}>
          🎯 Total XP from sharing: +{xpGained}
        </div>
      )}
    </div>
  );
}
