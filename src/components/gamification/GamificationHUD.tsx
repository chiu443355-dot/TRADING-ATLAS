import { useState, useEffect } from 'react';
import { loadState, saveState, addXP, updateStreak, checkStreakBadges, BADGES, type UserState, type Badge } from '../../lib/gamification';

function BadgeToast({ badge, onClose }: { badge: Badge; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  const colors: Record<string, string> = { common: '#22c55e', rare: '#38bdf8', legendary: '#a78bfa' };
  return (
    <div style={{ position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', background: '#08081a', border: '1px solid rgba(232,184,75,.35)', borderRadius: 20, padding: '18px 28px', display: 'flex', alignItems: 'center', gap: 16, zIndex: 1000, whiteSpace: 'nowrap', boxShadow: '0 20px 60px rgba(0,0,0,.7)', animation: 'fadeUp .5s cubic-bezier(.34,1.56,.64,1)' }}>
      <span style={{ fontSize: 36 }}>{badge.icon}</span>
      <div>
        <div style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 800, fontSize: 16, color: '#fff', marginBottom: 3 }}>{badge.name} unlocked!</div>
        <div style={{ fontFamily: '"Fira Code", monospace', fontSize: 10, color: '#e8b84b', letterSpacing: '.12em' }}>+{badge.xp} XP earned</div>
      </div>
      <div style={{ fontFamily: '"Fira Code", monospace', fontSize: 8, padding: '3px 10px', borderRadius: 50, letterSpacing: '.1em', color: colors[badge.rarity], background: `${colors[badge.rarity]}18`, border: `1px solid ${colors[badge.rarity]}40` }}>
        {badge.rarity.toUpperCase()}
      </div>
    </div>
  );
}

export default function GamificationHUD() {
  const [state, setState] = useState<UserState | null>(null);
  const [toastBadge, setToastBadge] = useState<Badge | null>(null);

  useEffect(() => {
    let s = loadState();
    s = updateStreak(s);
    const { state: s2, newBadges } = checkStreakBadges(s);
    s = s2;
    saveState(s);
    setState(s);
    if (newBadges.length > 0) setToastBadge(newBadges[0]);

    const handleXP = (e: CustomEvent) => {
      setState(prev => {
        if (!prev) return prev;
        let next = addXP(prev, e.detail.amount);
        if (e.detail.reason === 'share' && !next.earnedBadges.includes('sharer')) {
          const badge = BADGES.find(b => b.id === 'sharer')!;
          next = addXP({ ...next, earnedBadges: [...next.earnedBadges, 'sharer'] }, badge.xp);
          setToastBadge(badge);
        }
        saveState(next);
        return next;
      });
    };
    window.addEventListener('wikwiz:xp', handleXP as EventListener);
    return () => window.removeEventListener('wikwiz:xp', handleXP as EventListener);
  }, []);

  if (!state) return null;
  const xpInLevel = state.xp % 1000;
  const xpPct = (xpInLevel / 1000) * 100;
  const circumference = 138.2;
  const offset = circumference - (xpPct / 100) * circumference;
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const today = new Date().getDay();

  const rarityColors: Record<string, string> = { common: '#22c55e', rare: '#38bdf8', legendary: '#a78bfa' };

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 22px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, margin: '28px 0', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 22 }}>🔥</span>
        <div>
          <div style={{ fontFamily: '"Playfair Display", serif', fontSize: 28, color: '#e8b84b', lineHeight: 1 }}>{state.streak}</div>
          <div style={{ fontFamily: '"Fira Code", monospace', fontSize: 9, color: '#6b7280', letterSpacing: '.15em' }}>DAY STREAK</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {days.map((d, i) => {
            const done = state.streak >= (7 - i);
            const isToday = i === (today === 0 ? 6 : today - 1);
            return (
              <div key={i} style={{ width: 28, height: 28, borderRadius: '50%', border: `1.5px solid ${isToday ? '#22c55e' : done ? '#e8b84b' : 'rgba(255,255,255,0.08)'}`, background: isToday ? 'rgba(34,197,94,.15)' : done ? 'rgba(232,184,75,.12)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Fira Code", monospace', fontSize: 10, color: isToday ? '#22c55e' : done ? '#e8b84b' : '#374151' }}>
                {d}
              </div>
            );
          })}
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <svg width="52" height="52" viewBox="0 0 52 52" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="26" cy="26" r="22" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
            <circle cx="26" cy="26" r="22" fill="none" stroke="#e8b84b" strokeWidth="3" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s cubic-bezier(.22,1,.36,1)' }} />
            <text x="26" y="30" textAnchor="middle" fill="#e8b84b" fontFamily='"Fira Code", monospace' fontSize="10" fontWeight="600" style={{ transform: 'rotate(90deg)', transformOrigin: '26px 26px' }}>
              LVL{state.level}
            </text>
          </svg>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 160 }}>
          <span style={{ fontFamily: '"Fira Code", monospace', fontSize: 10, color: '#e8b84b' }}>{xpInLevel} / 1000 XP</span>
          <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${xpPct}%`, borderRadius: 99, background: 'linear-gradient(90deg,#e8b84b,#f5d07a)', transition: 'width 1.2s cubic-bezier(.22,1,.36,1)' }} />
          </div>
        </div>
      </div>

      <div style={{ fontFamily: '"Fira Code", monospace', fontSize: 10, color: '#e8b84b', letterSpacing: '.35em', display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
        ACHIEVEMENTS
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 10, margin: '20px 0' }}>
        {BADGES.map(b => {
          const isEarned = state.earnedBadges.includes(b.id);
          return (
            <div key={b.id} style={{ background: isEarned ? 'rgba(232,184,75,.04)' : 'rgba(255,255,255,0.02)', border: `1px solid ${isEarned ? 'rgba(232,184,75,.3)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 14, padding: 18, textAlign: 'center', opacity: isEarned ? 1 : 0.4, filter: isEarned ? 'none' : 'grayscale(.7)', transition: 'all .3s', position: 'relative' }}>
              <span style={{ fontSize: 30, marginBottom: 8, display: 'block' }}>{b.icon}</span>
              <div style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{b.name}</div>
              <div style={{ fontFamily: '"Fira Code", monospace', fontSize: 9, color: '#6b7280', lineHeight: 1.5 }}>{b.description}</div>
              <div style={{ position: 'absolute', top: 8, right: 8, fontFamily: '"Fira Code", monospace', fontSize: 8, padding: '2px 6px', borderRadius: 50, color: rarityColors[b.rarity], background: `${rarityColors[b.rarity]}18`, border: `1px solid ${rarityColors[b.rarity]}40` }}>
                {b.rarity.toUpperCase()}
              </div>
            </div>
          );
        })}
      </div>

      {toastBadge && <BadgeToast badge={toastBadge} onClose={() => setToastBadge(null)} />}
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateX(-50%) translateY(28px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }`}</style>
    </>
  );
}
