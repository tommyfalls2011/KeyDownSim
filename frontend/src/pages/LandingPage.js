import { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Zap, Radio, Gauge, Shield, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

function HeroCanvas() {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1 : 2);
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    let lastFrame = 0;
    const draw = (timestamp) => {
      animRef.current = requestAnimationFrame(draw);
      if (timestamp - lastFrame < 40) return; // ~25fps
      lastFrame = timestamp;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      if (w === 0 || h === 0) return;
      ctx.clearRect(0, 0, w, h);
      timeRef.current += 0.02;
      const t = timeRef.current;

      // Grid
      ctx.strokeStyle = 'rgba(0,240,255,0.06)';
      ctx.lineWidth = 0.5;
      for (let x = 0; x < w; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 0; y < h; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      // Expanding rings
      const cx = w * 0.5, cy = h * 0.5;
      for (let i = 0; i < 5; i++) {
        const r = ((t * 30 + i * 60) % 300);
        const alpha = Math.max(0, 1 - r / 300) * 0.4;
        ctx.strokeStyle = `rgba(0,240,255,${alpha})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(cx, cy, r * 1.5, r, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Lightning bolts
      for (let i = 0; i < 3; i++) {
        const phase = t + i * 2.09;
        const alpha = (Math.sin(phase * 2) + 1) * 0.3;
        if (alpha > 0.1) {
          ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          let bx = cx + Math.cos(phase) * 80;
          let by = cy + Math.sin(phase) * 40;
          ctx.moveTo(bx, by);
          for (let j = 0; j < 6; j++) {
            bx += (Math.random() - 0.5) * 60;
            by += 20 + Math.random() * 15;
            ctx.lineTo(bx, by);
          }
          ctx.stroke();
        }
      }
    };
    animRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}

const features = [
  { icon: Radio, title: 'SIGNAL CHAIN', desc: 'Real-time power calculation from radio to 16-pill final amp.' },
  { icon: Zap, title: 'VOLTAGE MONITOR', desc: 'Live voltage drop simulation with alternator overload warnings.' },
  { icon: Gauge, title: 'RADIATION PATTERN', desc: 'Pseudo-3D visualization of your signal based on vehicle and antenna.' },
  { icon: Shield, title: 'GROUND PLANE SIM', desc: 'See how bonding and vehicle type affect your radiation pattern.' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [pricing, setPricing] = useState({ monthly: { amount: 99.99 }, yearly: { amount: 999.99 } });

  useEffect(() => {
    setVisible(true);
    fetch(`${process.env.REACT_APP_BACKEND_URL}/api/pricing`)
      .then(r => r.json())
      .then(d => setPricing(d))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-void relative overflow-hidden" data-testid="landing-page">
      {/* Hero */}
      <section className="relative h-screen flex flex-col items-center justify-center">
        <HeroCanvas />
        <div className={`relative z-10 text-center px-6 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="font-chakra text-xs tracking-[0.4em] text-cyan-400 mb-4 uppercase">Real-Time RF Simulator</div>
          <h1 className="font-chakra font-bold text-4xl sm:text-5xl lg:text-6xl text-white uppercase tracking-wider leading-tight">
            KEY <span className="text-cyan-400 text-glow-cyan">DOWN</span>
          </h1>
          <p className="font-exo text-slate-400 mt-4 text-base md:text-lg max-w-xl mx-auto">
            Visualize your signal chain. Watch the lobe bloat on a 16-pill amp. Simulate it all before you wire it.
          </p>
          <div className="mt-8 flex gap-4 justify-center">
            <Button
              data-testid="get-started-btn"
              onClick={() => navigate(user ? '/dashboard' : '/auth')}
              className="bg-cyan-400 text-black font-chakra font-bold uppercase tracking-wider px-8 py-3 hover:bg-cyan-500 transition-colors"
            >
              {user ? 'OPEN DASHBOARD' : 'GET STARTED'} <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-slate-600 text-xs font-mono animate-bounce">
          SCROLL
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 bg-surface relative">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-chakra font-bold text-base md:text-lg text-white uppercase tracking-widest mb-12 text-center">
            WHAT&apos;S UNDER THE HOOD
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="bg-panel border border-white/5 p-6 relative group hover:border-cyan-400/30 transition-colors"
                style={{ animationDelay: `${i * 100}ms` }}
                data-testid={`feature-card-${i}`}
              >
                <f.icon className="w-6 h-6 text-cyan-400 mb-3" />
                <h3 className="font-chakra font-bold text-white text-sm uppercase tracking-wider mb-2">{f.title}</h3>
                <p className="font-exo text-slate-500 text-sm">{f.desc}</p>
                <div className="absolute top-0 left-0 w-1 h-full bg-cyan-400/0 group-hover:bg-cyan-400 transition-colors" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-6 bg-void" data-testid="pricing-section">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-chakra font-bold text-base md:text-lg text-white uppercase tracking-widest mb-4">RF PRO</h2>
          <p className="font-exo text-slate-500 text-sm mb-12">Save unlimited configurations. Full access to all equipment and vehicles.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-xl mx-auto">
            <div className="bg-panel border border-white/10 p-6 text-center hover:border-cyan-400/40 transition-colors">
              <div className="font-chakra text-xs text-slate-500 uppercase tracking-widest mb-2">Monthly</div>
              <div className="font-mono text-3xl text-cyan-400">${pricing.monthly?.amount}</div>
              <div className="font-exo text-xs text-slate-600 mt-1">/month</div>
            </div>
            <div className="bg-panel border border-cyan-400/30 p-6 text-center relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-cyan-400 text-black font-chakra text-[10px] px-3 py-0.5 uppercase tracking-widest">Best Value</div>
              <div className="font-chakra text-xs text-slate-500 uppercase tracking-widest mb-2">Yearly</div>
              <div className="font-mono text-3xl text-cyan-400">${pricing.yearly?.amount}</div>
              <div className="font-exo text-xs text-slate-600 mt-1">/year &mdash; save ${(pricing.monthly?.amount * 12 - pricing.yearly?.amount).toFixed(0)}</div>
            </div>
          </div>
          <Button
            data-testid="pricing-cta-btn"
            onClick={() => navigate(user ? '/subscription' : '/auth')}
            className="mt-8 bg-transparent border border-cyan-400 text-cyan-400 font-chakra uppercase tracking-wider px-8 py-3 hover:bg-cyan-400/10 transition-colors"
          >
            SUBSCRIBE NOW
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-surface border-t border-white/5">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="font-chakra text-xs text-slate-600 uppercase tracking-widest">KEY DOWN RF VIZ</div>
          <div className="font-mono text-xs text-slate-700">&copy; 2026</div>
        </div>
      </footer>
    </div>
  );
}
