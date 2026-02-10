import { useRF } from '@/context/RFContext';

function MeterBar({ value, max, segments = 12, colors }) {
  const activeCount = Math.round((value / max) * segments);
  return (
    <div className="meter-bar h-5">
      {Array.from({ length: segments }).map((_, i) => {
        const active = i < activeCount;
        const pct = i / segments;
        let color = colors?.[0] || '#00FF00';
        if (pct > 0.75) color = colors?.[3] || '#FF0000';
        else if (pct > 0.5) color = colors?.[2] || '#FFFF00';
        else if (pct > 0.25) color = colors?.[1] || '#00FF00';
        return (
          <div
            key={i}
            className="meter-segment"
            style={{
              height: `${60 + i * 3}%`,
              background: active ? color : 'rgba(255,255,255,0.05)',
              opacity: active ? 1 : 0.3,
            }}
          />
        );
      })}
    </div>
  );
}

export default function MetricsPanel() {
  const { metrics, keyed } = useRF();

  return (
    <div className="h-full grid grid-cols-3 sm:grid-cols-6 gap-px bg-white/5" data-testid="metrics-panel">
      {/* Power */}
      <div className="bg-surface flex flex-col items-center justify-center p-2">
        <div className="font-chakra text-[8px] uppercase tracking-[0.2em] text-slate-600 mb-1">Power</div>
        <div className={`font-mono text-lg led-segment ${keyed ? 'text-cyan-400' : 'text-slate-700'}`} data-testid="power-readout">
          {keyed ? Math.round(metrics.deadKeyWatts).toLocaleString() : '---'}
        </div>
        <div className="font-mono text-[8px] text-slate-600">WATTS</div>
        <MeterBar
          value={keyed ? Math.min(metrics.deadKeyWatts, 10000) : 0}
          max={10000}
          colors={['#00FF00', '#00FF00', '#FFFF00', '#FF0000']}
        />
      </div>

      {/* Peak */}
      <div className="bg-surface flex flex-col items-center justify-center p-2">
        <div className="font-chakra text-[8px] uppercase tracking-[0.2em] text-slate-600 mb-1">Peak</div>
        <div className={`font-mono text-lg led-segment ${keyed ? 'text-cyan-400' : 'text-slate-700'}`} data-testid="peak-readout">
          {keyed ? Math.round(metrics.peakWatts).toLocaleString() : '---'}
        </div>
        <div className="font-mono text-[8px] text-slate-600">WATTS</div>
      </div>

      {/* SWR */}
      <div className="bg-surface flex flex-col items-center justify-center p-2">
        <div className="font-chakra text-[8px] uppercase tracking-[0.2em] text-slate-600 mb-1">SWR</div>
        <div className={`font-mono text-lg led-segment ${metrics.swr > 2.5 ? 'text-hot' : metrics.swr > 1.8 ? 'text-warn' : 'text-green-400'}`} data-testid="swr-readout">
          {metrics.swr.toFixed(1)}
        </div>
        <div className="font-mono text-[8px] text-slate-600">RATIO</div>
        <MeterBar
          value={metrics.swr}
          max={5}
          segments={8}
          colors={['#00FF00', '#00FF00', '#FFFF00', '#FF0000']}
        />
      </div>

      {/* Voltage */}
      <div className="bg-surface flex flex-col items-center justify-center p-2">
        <div className="font-chakra text-[8px] uppercase tracking-[0.2em] text-slate-600 mb-1">Voltage</div>
        <div className={`font-mono text-lg led-segment ${metrics.overloaded ? 'text-hot animate-pulse' : 'text-green-400'}`} data-testid="voltage-readout">
          {keyed ? metrics.voltage.toFixed(1) : '14.2'}
        </div>
        <div className="font-mono text-[8px] text-slate-600">VOLTS</div>
        {metrics.overloaded && keyed && (
          <div className="font-chakra text-[7px] text-hot animate-pulse mt-0.5">OVERLOAD</div>
        )}
      </div>

      {/* Take-off Angle */}
      <div className="bg-surface flex flex-col items-center justify-center p-2">
        <div className="font-chakra text-[8px] uppercase tracking-[0.2em] text-slate-600 mb-1">Take-Off</div>
        <div className={`font-mono text-lg led-segment ${metrics.takeoffAngle > 40 ? 'text-warn' : 'text-cyan-400'}`} data-testid="takeoff-readout">
          {metrics.takeoffAngle}
        </div>
        <div className="font-mono text-[8px] text-slate-600">DEG</div>
        <div className="w-full mt-1 relative h-2">
          <div className="absolute inset-0 bg-white/5 rounded-full" />
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-cyan-400/50 transition-all duration-300"
            style={{ width: `${Math.min(100, (metrics.takeoffAngle / 60) * 100)}%` }}
          />
        </div>
      </div>

      {/* Hold Time */}
      <div className="bg-surface flex flex-col items-center justify-center p-2">
        <div className="font-chakra text-[8px] uppercase tracking-[0.2em] text-slate-600 mb-1">Hold</div>
        <div className={`font-mono text-lg led-segment ${metrics.holdTimeSec < 60 ? 'text-hot' : metrics.holdTimeSec < 300 ? 'text-warn' : 'text-green-400'}`} data-testid="hold-readout">
          {metrics.holdTimeSec >= 9999 ? '---' : metrics.holdTimeSec >= 60 ? `${Math.floor(metrics.holdTimeSec / 60)}m` : `${metrics.holdTimeSec}s`}
        </div>
        <div className="font-mono text-[8px] text-slate-600">{metrics.bankAh > 0 ? `${metrics.bankAh}Ah` : 'NO BANK'}</div>
      </div>
    </div>
  );
}
