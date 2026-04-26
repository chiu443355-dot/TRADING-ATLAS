import { useState, useEffect, useRef, useCallback } from 'react';

const ASSETS = [
  { id:'eurusd', label:'EUR/USD',  base:1.0842, vol:0.0006, pip:4, cat:'FOREX',     color:'#22c55e' },
  { id:'gbpusd', label:'GBP/USD',  base:1.2714, vol:0.0009, pip:4, cat:'FOREX',     color:'#38bdf8' },
  { id:'usdjpy', label:'USD/JPY',  base:149.82, vol:0.10,   pip:2, cat:'FOREX',     color:'#a78bfa' },
  { id:'xauusd', label:'XAU/USD',  base:2312.4, vol:2.2,    pip:2, cat:'GOLD',      color:'#e8b84b' },
  { id:'btcusd', label:'BTC/USD',  base:67420,  vol:150,    pip:0, cat:'CRYPTO',    color:'#f97316' },
  { id:'nifty',  label:'NIFTY 50', base:22450,  vol:35,     pip:2, cat:'INDEX',     color:'#2dd4bf' },
];

type Candle = { o:number; h:number; l:number; c:number; vol:number; };
type State = { candles:Candle[]; price:number; open24h:number; };

function generateSeed(base:number, vol:number, count=80): State {
  const candles:Candle[] = [];
  let p = base * (0.997 + Math.random()*0.006);
  const open24h = p;
  for(let i=0;i<count;i++){
    const o=p;
    const body=(Math.random()-0.478)*vol*2.2;
    const c=Math.max(o*0.97, o+body);
    const h=Math.max(o,c)+Math.random()*vol*0.9;
    const l=Math.min(o,c)-Math.random()*vol*0.9;
    candles.push({o,h,l,c,vol:Math.random()*100+20});
    p=c;
  }
  return { candles, price:p, open24h };
}

function fmtPrice(id:string, p:number){
  if(p>10000) return p.toLocaleString('en-IN',{maximumFractionDigits:0});
  if(p>100) return p.toFixed(2);
  return p.toFixed(5);
}

function CandleChart({candles,color,w=600,h=200}:{candles:Candle[];color:string;w?:number;h?:number}){
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(()=>{
    const canvas = canvasRef.current;
    if(!canvas||!candles.length) return;
    const ctx = canvas.getContext('2d');
    if(!ctx) return;
    const dpr = window.devicePixelRatio||1;
    canvas.width = w*dpr; canvas.height = h*dpr;
    canvas.style.width=w+'px'; canvas.style.height=h+'px';
    ctx.scale(dpr,dpr);

    const pad={l:0,r:48,t:12,b:20};
    const cw=w-pad.l-pad.r, ch=h-pad.t-pad.b;
    const n=candles.length;
    const allH=candles.flatMap(c=>[c.h,c.l]);
    const minP=Math.min(...allH), maxP=Math.max(...allH);
    const range=maxP-minP||1;
    const toY=(p:number)=>pad.t+ch-((p-minP)/range)*ch;
    const cWidth=Math.max(1,(cw/n)-1);
    const toX=(i:number)=>pad.l+i*(cw/n)+cWidth/2;

    ctx.clearRect(0,0,w,h);

    // Grid lines
    for(let i=0;i<=4;i++){
      const p=minP+(range*i/4);
      const y=toY(p);
      ctx.strokeStyle='rgba(255,255,255,0.04)';
      ctx.setLineDash([]);
      ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(pad.l,y); ctx.lineTo(w-pad.r,y); ctx.stroke();
      // Price label
      ctx.fillStyle='rgba(255,255,255,0.25)';
      ctx.font=`${Math.min(9,10)}px "Fira Code",monospace`;
      ctx.textAlign='left';
      const label=p>1000?p.toFixed(0):p>100?p.toFixed(2):p.toFixed(4);
      ctx.fillText(label,w-pad.r+4,y+3);
    }

    // Candles
    candles.forEach((c,i)=>{
      const x=toX(i);
      const bull=c.c>=c.o;
      const col=bull?'#22c55e':'#ef4444';
      const bodyTop=toY(Math.max(c.o,c.c));
      const bodyBot=toY(Math.min(c.o,c.c));
      const bh=Math.max(1,bodyBot-bodyTop);

      // Wick
      ctx.strokeStyle=col; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(x,toY(c.h)); ctx.lineTo(x,toY(c.l)); ctx.stroke();
      // Body
      ctx.fillStyle=bull?`rgba(34,197,94,0.85)`:`rgba(239,68,68,0.85)`;
      ctx.fillRect(x-cWidth/2,bodyTop,cWidth,bh);
    });

    // Current price line
    if(candles.length){
      const lastP=candles[candles.length-1].c;
      const py=toY(lastP);
      ctx.strokeStyle=color; ctx.setLineDash([3,3]); ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(0,py); ctx.lineTo(w-pad.r,py); ctx.stroke();
      ctx.setLineDash([]);
      // Price tag
      ctx.fillStyle=color;
      ctx.fillRect(w-pad.r+1,py-8,46,16);
      ctx.fillStyle='#000';
      ctx.font='bold 8px "Fira Code",monospace';
      ctx.textAlign='center';
      ctx.fillText(fmtPrice('',lastP),w-pad.r+24,py+3);
    }
  },[candles,color,w,h]);

  return <canvas ref={canvasRef} style={{display:'block',width:'100%',height:'100%',borderRadius:8}} />;
}

function Sparkline({candles,color}:{candles:Candle[];color:string}){
  const canvasRef=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{
    const canvas=canvasRef.current; if(!canvas||candles.length<2) return;
    const ctx=canvas.getContext('2d'); if(!ctx) return;
    const W=80,H=30;
    canvas.width=W*2; canvas.height=H*2;
    canvas.style.width=W+'px'; canvas.style.height=H+'px';
    ctx.scale(2,2);
    const prices=candles.map(c=>c.c);
    const min=Math.min(...prices),max=Math.max(...prices),range=max-min||1;
    ctx.clearRect(0,0,W,H);
    ctx.beginPath();
    prices.forEach((p,i)=>{
      const x=(i/(prices.length-1))*W;
      const y=H-((p-min)/range)*H;
      i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
    });
    ctx.strokeStyle=color; ctx.lineWidth=1.5; ctx.stroke();
  },[candles,color]);
  return <canvas ref={canvasRef} style={{display:'block'}} />;
}

export default function LiveMarket(){
  const [activeIdx,setActiveIdx]=useState(0);
  const [states,setStates]=useState<Record<string,State>>({});
  const [flashes,setFlashes]=useState<Record<string,boolean>>({});
  const tickRef=useRef<ReturnType<typeof setInterval>|null>(null);

  useEffect(()=>{
    // Seed all assets
    const init:Record<string,State>={};
    ASSETS.forEach(a=>{ init[a.id]=generateSeed(a.base,a.vol); });
    setStates(init);

    // Tick every 800ms
    tickRef.current=setInterval(()=>{
      setStates(prev=>{
        const next={...prev};
        const newFlash:Record<string,boolean>={};
        ASSETS.forEach(a=>{
          const s=prev[a.id];
          if(!s) return;
          const candles=[...s.candles];
          const last=candles[candles.length-1];

          // Random walk with mean reversion toward base
          const drift=(a.base-last.c)*0.0008;
          const noise=(Math.random()-0.49)*a.vol*1.8;
          const newC=Math.max(last.c*0.97, last.c+drift+noise);

          // 15% chance new candle, else extend current
          if(Math.random()<0.15){
            candles.push({
              o:last.c,
              h:Math.max(last.c,newC)+Math.random()*a.vol*0.4,
              l:Math.min(last.c,newC)-Math.random()*a.vol*0.4,
              c:newC,
              vol:Math.random()*100+20
            });
            if(candles.length>80) candles.shift();
          } else {
            candles[candles.length-1]={
              ...last, c:newC,
              h:Math.max(last.h,newC),
              l:Math.min(last.l,newC),
            };
          }
          next[a.id]={...s,candles,price:newC};
          newFlash[a.id]=newC>s.price;
        });
        setFlashes(newFlash);
        setTimeout(()=>setFlashes({}),300);
        return next;
      });
    },800);

    return ()=>{ if(tickRef.current) clearInterval(tickRef.current); };
  },[]);

  const active=ASSETS[activeIdx];
  const s=states[active?.id];
  const price=s?.price??active?.base;
  const open=s?.open24h??active?.base;
  const chg=((price-open)/open)*100;
  const bull=chg>=0;

  return (
    <div style={{background:'#06060f',border:'1px solid rgba(232,184,75,0.12)',borderRadius:20,overflow:'hidden'}}>
      {/* Header */}
      <div style={{padding:'14px 20px',borderBottom:'1px solid rgba(255,255,255,0.05)',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <span style={{display:'inline-block',width:7,height:7,borderRadius:'50%',background:'#22c55e',boxShadow:'0 0 8px #22c55e',animation:'livePulse 2s ease-in-out infinite'}}/>
          <span style={{fontFamily:'"Fira Code",monospace',fontSize:10,color:'#22c55e',letterSpacing:'.28em'}}>LIVE · ANIMATED · 0.8s TICKS</span>
        </div>
        <div style={{display:'flex',alignItems:'baseline',gap:12}}>
          <span style={{fontFamily:'"Playfair Display",serif',fontSize:22,color:'#fff',fontWeight:700}}>{fmtPrice(active?.id,price)}</span>
          <span style={{fontFamily:'"Fira Code",monospace',fontSize:11,color:bull?'#22c55e':'#ef4444',background:bull?'rgba(34,197,94,0.1)':'rgba(239,68,68,0.1)',padding:'3px 8px',borderRadius:20}}>
            {bull?'▲':'▼'} {Math.abs(chg).toFixed(3)}%
          </span>
        </div>
      </div>

      {/* Asset tabs */}
      <div style={{display:'flex',overflowX:'auto',borderBottom:'1px solid rgba(255,255,255,0.05)',scrollbarWidth:'none'}}>
        {ASSETS.map((a,i)=>{
          const ps=states[a.id];
          const p=ps?.price??a.base;
          const o=ps?.open24h??a.base;
          const c=((p-o)/o)*100;
          const fl=flashes[a.id];
          return (
            <button key={a.id} onClick={()=>setActiveIdx(i)} style={{
              flex:'0 0 auto',padding:'10px 16px',border:'none',cursor:'pointer',
              fontFamily:'"Fira Code",monospace',fontSize:10,letterSpacing:'.04em',
              whiteSpace:'nowrap',transition:'all .15s',
              color:activeIdx===i?a.color:'#6b7280',
              background:activeIdx===i?`rgba(${activeIdx===i?'232,184,75':fl?'34,197,94':'255,255,255'},${activeIdx===i?'0.07':fl?'0.04':'0'})`:
                fl?'rgba(34,197,94,0.04)':'transparent',
              borderBottom:`2px solid ${activeIdx===i?a.color:'transparent'}`,
            }}>
              <div style={{marginBottom:2}}>{a.label}</div>
              <div style={{fontSize:9,color:c>=0?'#22c55e':'#ef4444',fontWeight:600}}>
                {c>=0?'▲':'▼'}{Math.abs(c).toFixed(2)}%
              </div>
            </button>
          );
        })}
      </div>

      {/* Main chart */}
      <div style={{padding:'16px 16px 8px',height:240,position:'relative'}}>
        <div style={{position:'absolute',top:8,left:24,fontFamily:'"Fira Code",monospace',fontSize:9,color:active?.color,letterSpacing:'.15em'}}>
          {active?.label} · {active?.cat}
        </div>
        {s && <CandleChart candles={s.candles} color={active?.color??'#e8b84b'} w={800} h={220} />}
      </div>

      {/* OHLC bar */}
      {s?.candles.length && (()=>{
        const last=s.candles[s.candles.length-1];
        const fp=(n:number)=>fmtPrice(active?.id,n);
        return (
          <div style={{display:'flex',gap:20,padding:'0 20px 12px',flexWrap:'wrap'}}>
            {[['O',fp(last.o),'#9ca3af'],['H',fp(last.h),'#22c55e'],['L',fp(last.l),'#ef4444'],['C',fp(last.c),'#e8b84b']].map(([l,v,c])=>(
              <div key={l}>
                <span style={{fontFamily:'"Fira Code",monospace',fontSize:8,color:'#4b5563',marginRight:4}}>{l}</span>
                <span style={{fontFamily:'"Fira Code",monospace',fontSize:10,color:c}}>{v}</span>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Mini sparkline row */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',borderTop:'1px solid rgba(255,255,255,0.04)'}}>
        {ASSETS.slice(0,3).map((a,i)=>{
          const ps=states[a.id];
          const p=ps?.price??a.base;
          const o=ps?.open24h??a.base;
          const c=((p-o)/o)*100;
          const candles=(ps?.candles??[]).slice(-20);
          return (
            <div key={a.id} onClick={()=>setActiveIdx(i)}
              style={{padding:'10px 14px',borderRight:i<2?'1px solid rgba(255,255,255,0.04)':'none',cursor:'pointer',transition:'background .15s',background:flashes[a.id]?'rgba(34,197,94,0.04)':'transparent'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:4}}>
                <div>
                  <div style={{fontFamily:'"Fira Code",monospace',fontSize:9,color:a.color,marginBottom:2}}>{a.label}</div>
                  <div style={{fontFamily:'"Fira Code",monospace',fontSize:11,color:'#e8e8f0',fontWeight:600}}>{fmtPrice(a.id,p)}</div>
                </div>
                <Sparkline candles={candles} color={a.color} />
              </div>
              <div style={{fontFamily:'"Fira Code",monospace',fontSize:8,color:c>=0?'#22c55e':'#ef4444'}}>
                {c>=0?'▲':'▼'}{Math.abs(c).toFixed(2)}%
              </div>
            </div>
          );
        })}
      </div>
      <style>{`@keyframes livePulse{0%,100%{opacity:1;box-shadow:0 0 8px #22c55e}50%{opacity:.3;box-shadow:0 0 2px #22c55e}}`}</style>
    </div>
  );
}
