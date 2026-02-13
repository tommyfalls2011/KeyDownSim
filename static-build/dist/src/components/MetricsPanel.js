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
  const { metrics, keyed, micEnabled } = useRF();

  // Power meter: average watts (dead key carrier + moderate modulation swing)
  const avgPower = keyed ? Math.round(micEnabled ? metrics.avgWatts : metrics.deadKeyWatts) : 0;
  // Peak meter: starts at dead key, swings hard toward peak limit during modulation
  const peakPower = keyed ? Math.round(micEnabled ? metrics.peakSwingWatts : metrics.deadKeyWatts) : 0;
  const isModulating = keyed && micEnabled && metrics.micLevel > 0.05;

  return (
    <div className="h-full grid grid-cols-3 sm:grid-cols-6 gap-px bg-white/5" data-testid="metrics-panel">
      {/* Power (Average) */}
      <div className="bg-surface flex flex-col items-center justify-center p-2">
        <div className="font-chakra text-[8px] uppercase tracking-[0.2em] text-slate-600 mb-1">{isModulating ? 'Avg' : 'Power'}</div>
        <div className={`font-mono text-lg led-segment ${keyed ? (isModulating ? 'text-amber-400' : 'text-cyan-400') : 'text-slate-700'}`} data-testid="power-readout">
          {keyed ? avgPower.toLocaleString() : '---'}
        </div>
        <div className="font-mono text-[8px] text-slate-600">WATTS</div>
        <MeterBar
          value={keyed ? Math.min(avgPower, 10000) : 0}
          max={10000}
          colors={['#00FF00', '#00FF00', '#FFFF00', '#FF0000']}
        />
      </div>

      {/* Peak */}
      <div className="bg-surface flex flex-col items-center justify-center p-2">
        <div className="font-chakra text-[8px] uppercase tracking-[0.2em] text-slate-600 mb-1">Peak</div>
        <div className={`font-mono text-lg led-segment ${keyed ? (isModulating ? 'text-hot' : 'text-cyan-400') : 'text-slate-700'}`} data-testid="peak-readout">
          {keyed ? peakPower.toLocaleString() : '---'}
        </div>
        <div className="font-mono text-[8px] text-slate-600">WATTS</div>
        <MeterBar
          value={keyed ? Math.min(peakPower, 10000) : 0}
          max={10000}
          colors={['#00FF00', '#00FF00', '#FFFF00', '#FF0000']}
        />
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

      {/* Amp Voltage */}
      <div className="bg-surface flex flex-col items-center justify-center p-2">
        <div className="font-chakra text-[8px] uppercase tracking-[0.2em] text-slate-600 mb-1">Amp Volts</div>
        <div className={`font-mono text-lg led-segment ${metrics.highVoltageWarn ? 'text-red-500 animate-pulse' : metrics.overloaded ? 'text-hot animate-pulse' : 'text-green-400'}`} data-testid="voltage-readout">
          {metrics.ampVoltage.toFixed(1)}
        </div>
        <div className="font-mono text-[8px] text-slate-600">VDC</div>
        {metrics.highVoltageWarn && (
          <div className="font-chakra text-[7px] text-red-500 animate-pulse mt-0.5">HIGH V!</div>
        )}
        {metrics.overloaded && keyed && !metrics.highVoltageWarn && (
          <div className="font-chakra text-[7px] text-hot animate-pulse mt-0.5">OVERLOAD</div>
        )}
      </div>

      {/* Take-off Angle */}
      <div className="bg-surface flex flex-col items-center justify-center p-2">
        <div className="font-chakra text-[8px] uppercase tracking-[0.2em] text-slate-600 mb-1">Take-Off</div>
        <div className="font-mono text-lg led-segment text-cyan-400" data-testid="takeoff-readout">
          {metrics.takeoffAngle}
        </div>
        <div className="font-mono text-[8px] text-slate-600">DEG</div>
        <MeterBar
          value={metrics.takeoffAngle}
          max={90}
          segments={6}
          colors={['#00F0FF', '#00F0FF', '#FFFF00', '#FF6600']}
        />
      </div>

      {/* Amp Temp */}
      <div className="bg-surface flex flex-col items-center justify-center p-2">
        <div className="font-chakra text-[8px] uppercase tracking-[0.2em] text-slate-600 mb-1">Amp Temp</div>
        <div className={`font-mono text-lg led-segment ${
          metrics.driverBlown || metrics.finalBlown ? 'text-red-500 animate-pulse' :
          Math.max(metrics.driverTemp, metrics.finalTemp) >= 150 ? 'text-red-500' :
          Math.max(metrics.driverTemp, metrics.finalTemp) >= 100 ? 'text-amber-400' : 'text-green-400'
        }`} data-testid="temp-readout">
          {Math.max(metrics.driverTemp, metrics.finalTemp)}°
        </div>
        <div className="font-mono text-[8px] text-slate-600">
          {metrics.driverBlown || metrics.finalBlown ? 'BLOWN!' : 'CELSIUS'}
        </div>
        <MeterBar
          value={Math.max(metrics.driverTemp, metrics.finalTemp) - 25}
          max={150}
          segments={10}
          colors={['#00FF00', '#FFFF00', '#FF6600', '#FF0000']}
        />
      </div>
    </div>
  );
}
