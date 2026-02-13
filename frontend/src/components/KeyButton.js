import { useCallback, useEffect } from 'react';
import { useRF } from '@/context/RFContext';
import { Mic, MicOff } from 'lucide-react';

export default function KeyButton() {
  const { keyed, setKeyed, micEnabled, toggleMic, metrics } = useRF();

  const handleDown = useCallback(() => setKeyed(true), [setKeyed]);
  const handleUp = useCallback(() => setKeyed(false), [setKeyed]);

  // Keyboard support: Space/K to key down
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.code === 'Space' || e.code === 'KeyK') {
        e.preventDefault();
        if (e.type === 'keydown' && !e.repeat) setKeyed(true);
        if (e.type === 'keyup') setKeyed(false);
      }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKey);
    };
  }, [setKeyed]);

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        data-testid="key-down-btn"
        className={`key-button ${keyed ? 'keyed' : ''}`}
        onMouseDown={handleDown}
        onMouseUp={handleUp}
        onMouseLeave={handleUp}
        onTouchStart={handleDown}
        onTouchEnd={handleUp}
      >
        <div className="text-center">
          <div className={`font-chakra font-bold text-sm uppercase tracking-widest ${keyed ? 'text-white' : 'text-slate-500'}`}>
            KEY
          </div>
          <div className={`font-chakra font-bold text-xs uppercase tracking-widest ${keyed ? 'text-white' : 'text-slate-600'}`}>
            DOWN
          </div>
        </div>
      </button>

      {/* Mic toggle */}
      <button
        data-testid="mic-toggle-btn"
        onClick={toggleMic}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded border font-mono text-[10px] uppercase tracking-wider transition-all ${
          micEnabled
            ? 'bg-cyan-400/10 border-cyan-400/40 text-cyan-400'
            : 'bg-void border-white/10 text-slate-600 hover:text-slate-400 hover:border-white/20'
        }`}
      >
        {micEnabled ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3" />}
        {micEnabled ? 'MIC LIVE' : 'MIC OFF'}
      </button>

      {/* Modulation level bar */}
      {micEnabled && keyed && (
        <div className="w-16 h-1.5 bg-void border border-white/10 rounded-full overflow-hidden" data-testid="mic-level-bar">
          <div
            className="h-full bg-cyan-400 transition-all duration-75"
            style={{ width: `${Math.round(metrics.micLevel * 100)}%` }}
          />
        </div>
      )}

      <div className="font-mono text-[9px] text-slate-700 text-center">
        HOLD TO TRANSMIT
        <br />
        <span className="text-slate-800">SPACE / K</span>
      </div>
    </div>
  );
}
