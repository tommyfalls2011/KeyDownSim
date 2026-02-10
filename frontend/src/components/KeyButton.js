import { useCallback, useEffect } from 'react';
import { useRF } from '@/context/RFContext';

export default function KeyButton() {
  const { keyed, setKeyed } = useRF();

  const handleDown = useCallback(() => setKeyed(true), [setKeyed]);
  const handleUp = useCallback(() => setKeyed(false), [setKeyed]);

  // Keyboard support: Space/Enter to key down
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
      <div className="font-mono text-[9px] text-slate-700 text-center">
        HOLD TO TRANSMIT
        <br />
        <span className="text-slate-800">SPACE / K</span>
      </div>
    </div>
  );
}
