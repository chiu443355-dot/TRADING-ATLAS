export type CalcType = 'rr' | 'position' | 'pip' | 'compound' | 'winrate';

export interface ShareResult {
  whatsapp: string; twitter: string; copyText: string; token: string;
}

function generateToken(): string {
  return 'ww_' + Math.random().toString(36).substr(2, 6);
}

const BASE_URL = 'https://wikwiz.vercel.app';

const TEMPLATES: Record<CalcType, (p: Record<string, string | number>) => string> = {
  rr: p => `My trade analysis on WikiWiz 🧠\n\nRisk: $${p.risk} | Target: $${p.reward}\nR:R Ratio: 1:${p.ratio} | Breakeven: ${p.breakeven}%\n\nFree financial education 👇\n${BASE_URL}?ref=${p.token}`,
  position: p => `Position size calculated ✅\n\nAccount: $${p.account} | Risk: ${p.riskPct}%\nLot size: ${p.lots} | $ per pip: $${p.ppv}\n\nCalculate yours free 👇\n${BASE_URL}?ref=${p.token}`,
  pip: p => `Pip value calculation 📊\n\n${p.pips} pips → $${p.total} (₹${p.inr})\n$${p.perPip} per pip on ${p.pair}\n\nFree pip calculator 👇\n${BASE_URL}?ref=${p.token}`,
  compound: p => `Compounding simulation 📈\n\n$${p.start} → $${p.final} in ${p.months} months\nAt ${p.rate}% monthly — ${p.multiple}× growth!\n\n${BASE_URL}?ref=${p.token}`,
  winrate: p => `Win rate analysis 🎯\n\nWin Rate: ${p.wr}% | R:R: 1:${p.rr}\nExpected P&L: ${p.pnl} | Edge: ${p.edge}%\n\n${BASE_URL}?ref=${p.token}`,
};

export function buildShareResult(calcType: CalcType, params: Record<string, string | number>): ShareResult {
  const token = generateToken();
  const p = { ...params, token };
  const text = TEMPLATES[calcType](p);
  return {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(text)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
    copyText: text, token,
  };
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const el = document.createElement('textarea');
    el.value = text; el.style.position = 'fixed'; el.style.opacity = '0';
    document.body.appendChild(el); el.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(el);
    return ok;
  }
}
