import { useRF } from '@/context/RFContext';
import { RADIOS, DRIVER_AMPS, FINAL_AMPS, ANTENNAS } from '@/lib/rfEngine';
import { calculateSignalChain } from '@/lib/rfEngine';
import RackUnit from '@/components/RackUnit';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Flame, RotateCcw } from 'lucide-react';

function TempBar({ temp, blown }) {
  const pct = Math.min(100, ((temp - 25) / (150 - 25)) * 100);
  const color = blown ? 'bg-red-600' : temp >= 135 ? 'bg-red-500' : temp >= 100 ? 'bg-amber-500' : temp >= 60 ? 'bg-amber-400/60' : 'bg-cyan-400/40';
  return (
    <div className="flex items-center gap-1.5 mt-1.5">
      <Flame className={`w-3 h-3 shrink-0 ${blown ? 'text-red-500 animate-pulse' : temp >= 100 ? 'text-amber-400' : 'text-slate-700'}`} />
      <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all duration-200`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`font-mono text-[9px] w-8 text-right ${blown ? 'text-red-500' : temp >= 100 ? 'text-amber-400' : 'text-slate-600'}`}>
        {Math.round(temp)}°
      </span>
    </div>
  );
}

export default function EquipmentRack() {
  const { config, updateConfig, metrics, resetAmp } = useRF();

  return (
    <div className="p-3 space-y-1">
      <div className="font-chakra text-[10px] uppercase tracking-[0.25em] text-slate-600 px-2 py-3">
        Equipment Rack
      </div>

      <RackUnit label="Radio" slot="1U">
        <Select value={config.radio} onValueChange={v => updateConfig('radio', v)}>
          <SelectTrigger className="bg-void border-white/10 text-white font-mono text-xs h-8" data-testid="radio-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-panel border-white/10">
            {Object.entries(RADIOS).map(([key, r]) => (
              <SelectItem key={key} value={key} className="font-mono text-xs text-slate-300">
                {r.name} ({r.deadKey}W)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex justify-between mt-2 font-mono text-[10px]">
          <span className="text-slate-600">DEAD KEY: <span className="text-cyan-400">{RADIOS[config.radio]?.deadKey}W</span></span>
          <span className="text-slate-600">PEAK: <span className="text-cyan-400">{RADIOS[config.radio]?.peakKey}W</span></span>
        </div>
      </RackUnit>

      <RackUnit label="Driver Amplifier" slot="2U">
        <Select value={config.driverAmp} onValueChange={v => updateConfig('driverAmp', v)}>
          <SelectTrigger className="bg-void border-white/10 text-white font-mono text-xs h-8" data-testid="driver-amp-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-panel border-white/10">
            {Object.entries(DRIVER_AMPS).map(([key, a]) => (
              <SelectItem key={key} value={key} className="font-mono text-xs text-slate-300">
                {a.name} {a.gainDB > 0 ? `(+${a.gainDB}dB)` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {config.driverAmp !== 'none' && (
          <div className="flex justify-between mt-2 font-mono text-[10px]">
            <span className="text-slate-600">GAIN: <span className="text-cyan-400">+{DRIVER_AMPS[config.driverAmp]?.gainDB}dB</span></span>
            <span className="text-slate-600">DRAW: <span className="text-warn">{DRIVER_AMPS[config.driverAmp]?.currentDraw}A</span></span>
          </div>
        )}
        {config.driverAmp !== 'none' && <TempBar temp={metrics.driverTemp} blown={metrics.driverBlown} />}
        {metrics.driverBlown && (
          <div className="mt-2 flex items-center justify-between bg-red-500/10 border border-red-500/30 rounded px-2 py-1.5" data-testid="driver-blown">
            <span className="font-mono text-[9px] text-red-400 font-bold">BLOWN PILL</span>
            <button onClick={() => resetAmp('driver')} className="flex items-center gap-1 font-mono text-[8px] text-slate-400 hover:text-cyan-400 border border-white/10 rounded px-1.5 py-0.5" data-testid="reset-driver-btn">
              <RotateCcw className="w-2.5 h-2.5" /> RESET
            </button>
          </div>
        )}
      </RackUnit>

      <RackUnit label="Final Amplifier" slot="3U" highlight={config.finalAmp === '16-pill'}>
        <Select value={config.finalAmp} onValueChange={v => updateConfig('finalAmp', v)}>
          <SelectTrigger className="bg-void border-white/10 text-white font-mono text-xs h-8" data-testid="final-amp-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-panel border-white/10">
            {Object.entries(FINAL_AMPS).map(([key, a]) => (
              <SelectItem key={key} value={key} className="font-mono text-xs text-slate-300">
                {a.name} {a.gainDB > 0 ? `(+${a.gainDB}dB)` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {config.finalAmp !== 'none' && (
          <div className="flex justify-between mt-2 font-mono text-[10px]">
            <span className="text-slate-600">GAIN: <span className="text-cyan-400">+{FINAL_AMPS[config.finalAmp]?.gainDB}dB</span></span>
            <span className="text-slate-600">DRAW: <span className="text-hot">{FINAL_AMPS[config.finalAmp]?.currentDraw}A</span></span>
          </div>
        )}
        {metrics.underDriven && config.finalAmp !== 'none' && (
          <div className="mt-2 flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded px-2 py-1.5" data-testid="under-driven-warning">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <div className="font-mono text-[9px] text-amber-400 leading-tight">
              UNDER-DRIVEN — {Math.round(metrics.driveRatio * 100)}% drive ({metrics.driveWatts}W / {metrics.idealDrive}W needed)
            </div>
          </div>
        )}
        {config.finalAmp !== 'none' && <TempBar temp={metrics.finalTemp} blown={metrics.finalBlown} />}
        {metrics.finalBlown && (
          <div className="mt-2 flex items-center justify-between bg-red-500/10 border border-red-500/30 rounded px-2 py-1.5" data-testid="final-blown">
            <span className="font-mono text-[9px] text-red-400 font-bold">BLOWN PILL</span>
            <button onClick={() => resetAmp('final')} className="flex items-center gap-1 font-mono text-[8px] text-slate-400 hover:text-cyan-400 border border-white/10 rounded px-1.5 py-0.5" data-testid="reset-final-btn">
              <RotateCcw className="w-2.5 h-2.5" /> RESET
            </button>
          </div>
        )}
      </RackUnit>

      <RackUnit label="Antenna" slot="4U">
        <Select value={config.antenna} onValueChange={v => updateConfig('antenna', v)}>
          <SelectTrigger className="bg-void border-white/10 text-white font-mono text-xs h-8" data-testid="antenna-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-panel border-white/10">
            {Object.entries(ANTENNAS).map(([key, a]) => (
              <SelectItem key={key} value={key} className="font-mono text-xs text-slate-300">
                {a.name} ({a.gainDBI > 0 ? '+' : ''}{a.gainDBI}dBi)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </RackUnit>

      {/* Signal Chain Summary */}
      <div className="bg-void border border-white/5 p-3 mt-4">
        <div className="font-chakra text-[10px] uppercase tracking-[0.2em] text-slate-600 mb-2">Signal Chain</div>
        <div className="font-mono text-[10px] text-slate-500 space-y-1">
          <div className="flex justify-between">
            <span>Radio</span>
            <span className="text-cyan-400">{RADIOS[config.radio]?.deadKey}W</span>
          </div>
          {config.driverAmp !== 'none' && (() => {
            const afterDriver = calculateSignalChain(config.radio, config.driverAmp, 'none', config.bonding);
            return (
              <div className="flex justify-between">
                <span>+ Driver (+{DRIVER_AMPS[config.driverAmp]?.gainDB}dB)</span>
                <span className="text-cyan-400">{Math.round(afterDriver.deadKey)}W</span>
              </div>
            );
          })()}
          {config.finalAmp !== 'none' && (() => {
            const full = calculateSignalChain(config.radio, config.driverAmp, config.finalAmp, config.bonding);
            return (
              <div className="flex justify-between">
                <span>+ Final (+{FINAL_AMPS[config.finalAmp]?.gainDB}dB)</span>
                <span className="text-cyan-400">{Math.round(full.deadKey).toLocaleString()}W</span>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
