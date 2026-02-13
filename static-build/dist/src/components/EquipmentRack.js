import { useMemo } from 'react';
import { useRF } from '@/context/RFContextStatic';
import { RADIOS, DRIVER_AMPS, FINAL_AMPS, ANTENNAS } from '@/lib/rfEngineStatic';
import { calculateSignalChain } from '@/lib/rfEngineStatic';
import RackUnit from '@/components/RackUnit';
import ThermalPreview from '@/components/ThermalPreview';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Flame, RotateCcw } from 'lucide-react';

function TempBar({ temp, blown }) {
  const pct = Math.min(100, ((temp - 25) / (175 - 25)) * 100);
  const color = blown ? 'bg-red-600' : temp >= 150 ? 'bg-red-500' : temp >= 100 ? 'bg-amber-500' : temp >= 60 ? 'bg-amber-400/60' : 'bg-cyan-400/40';
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
  const { config, updateConfig, metrics, resetAmp, keyed, equipmentLoaded } = useRF();

  // Re-snapshot equipment objects when they're updated from API
  // This forces the component to use fresh values after mergeEquipmentFromAPI runs
  const radios = useMemo(() => ({ ...RADIOS }), [equipmentLoaded]);
  const driverAmps = useMemo(() => ({ ...DRIVER_AMPS }), [equipmentLoaded]);
  const finalAmps = useMemo(() => ({ ...FINAL_AMPS }), [equipmentLoaded]);
  const antennas = useMemo(() => ({ ...ANTENNAS }), [equipmentLoaded]);

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
            {Object.entries(radios).map(([key, r]) => (
              <SelectItem key={key} value={key} className="font-mono text-xs text-slate-300">
                {r.name} ({r.deadKey}W)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex justify-between mt-2 font-mono text-[10px]">
          <span className="text-slate-600">DEAD KEY: <span className="text-cyan-400">{Math.round((radios[config.radio]?.deadKey || 1) * (config.driveLevel || 1) * 100) / 100}W</span></span>
          <span className="text-slate-600">PEAK: <span className="text-cyan-400">{Math.round((radios[config.radio]?.peakKey || 4) * (config.driveLevel || 1) * 100) / 100}W</span></span>
        </div>
        <div className="mt-2">
          <div className="flex justify-between font-mono text-[9px] text-slate-600 mb-0.5">
            <span>DRIVE LEVEL</span>
            <span className="text-amber-400">{Math.round((config.driveLevel || 1) * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.25"
            max="1"
            step="0.05"
            value={config.driveLevel || 1}
            onChange={e => updateConfig('driveLevel', parseFloat(e.target.value))}
            className="w-full h-1 accent-cyan-400 bg-slate-800 rounded cursor-pointer"
            data-testid="drive-level-slider"
          />
        </div>
      </RackUnit>

      <RackUnit label="Driver Amplifier" slot="2U">
        <Select value={config.driverAmp} onValueChange={v => updateConfig('driverAmp', v)}>
          <SelectTrigger className="bg-void border-white/10 text-white font-mono text-xs h-8" data-testid="driver-amp-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-panel border-white/10">
            {Object.entries(driverAmps).map(([key, a]) => (
              <SelectItem key={key} value={key} className="font-mono text-xs text-slate-300">
                {a.name} {a.gainDB > 0 ? `(+${a.gainDB}dB)` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {config.driverAmp !== 'none' && (
          <div className="flex justify-between mt-2 font-mono text-[10px]">
            <span className="text-slate-600">GAIN: <span className="text-cyan-400">+{driverAmps[config.driverAmp]?.gainDB}dB</span></span>
            <span className="text-slate-600">DRAW: <span className="text-warn">{keyed ? metrics.driverAmps : 0}A</span><span className="text-slate-700">/{driverAmps[config.driverAmp]?.currentDraw}A</span></span>
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
            {Object.entries(finalAmps).map(([key, a]) => (
              <SelectItem key={key} value={key} className="font-mono text-xs text-slate-300">
                {a.name} {a.gainDB > 0 ? `(+${a.gainDB}dB)` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {config.finalAmp !== 'none' && (
          <div className="flex justify-between mt-2 font-mono text-[10px]">
            <span className="text-slate-600">GAIN: <span className="text-cyan-400">+{finalAmps[config.finalAmp]?.gainDB}dB</span></span>
            <span className="text-slate-600">DRAW: <span className="text-hot">{keyed ? metrics.finalAmps : 0}A</span><span className="text-slate-700">/{finalAmps[config.finalAmp]?.currentDraw}A</span></span>
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
        <Select value={config.antenna} onValueChange={v => {
          updateConfig('antenna', v);
          const ant = antennas[v];
          if (ant?.tunable) updateConfig('tipLength', ant.tipDefault || 44);
        }}>
          <SelectTrigger className="bg-void border-white/10 text-white font-mono text-xs h-8" data-testid="antenna-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-panel border-white/10 max-h-60">
            {Object.entries(antennas).map(([key, a]) => (
              <SelectItem key={key} value={key} className="font-mono text-xs text-slate-300">
                {a.name} ({a.gainDBI > 0 ? '+' : ''}{a.gainDBI}dBi)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {antennas[config.antenna]?.tunable && (() => {
          const ant = antennas[config.antenna];
          return (
            <div className="mt-2 bg-void/50 border border-white/5 rounded p-2">
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-[8px] text-slate-600 uppercase">Tip Length (SWR Tune)</span>
                <span className="font-mono text-[10px] text-cyan-400" data-testid="tip-length-val">{config.tipLength}"</span>
              </div>
              <input
                type="range"
                min={ant.tipMin}
                max={ant.tipMax}
                step="0.5"
                value={config.tipLength}
                onChange={e => updateConfig('tipLength', parseFloat(e.target.value))}
                className="w-full h-1 appearance-none bg-slate-800 rounded-full cursor-pointer accent-cyan-400"
                data-testid="tip-slider"
              />
              <div className="flex justify-between font-mono text-[7px] text-slate-700 mt-0.5">
                <span>{ant.tipMin}" (short)</span>
                <span className="text-cyan-400/40">{ant.tipDefault}" sweet</span>
                <span>{ant.tipMax}" (long)</span>
              </div>
            </div>
          );
        })()}
      </RackUnit>

      {/* Signal Chain Summary */}
      <div className="bg-void border border-white/5 p-3 mt-4">
        <div className="font-chakra text-[10px] uppercase tracking-[0.2em] text-slate-600 mb-2">Signal Chain</div>
        <div className="font-mono text-[10px] text-slate-500 space-y-1">
          <div className="flex justify-between">
            <span>Radio</span>
            <span className="text-cyan-400">{Math.round((radios[config.radio]?.deadKey || 1) * (config.driveLevel || 1) * 100) / 100}W</span>
          </div>
          {config.driverAmp !== 'none' && (() => {
            const avgV = (config.regulatorVoltages || [14.2]).reduce((a, b) => a + b, 0) / (config.regulatorVoltages || [14.2]).length;
            const afterDriver = calculateSignalChain(config.radio, config.driverAmp, 'none', config.bonding, config.antennaPosition, config.driveLevel, avgV);
            return (
              <div className="flex justify-between">
                <span>+ Driver (+{driverAmps[config.driverAmp]?.gainDB}dB)</span>
                <span className="text-cyan-400">{Math.round(afterDriver.deadKey)}W</span>
              </div>
            );
          })()}
          {config.finalAmp !== 'none' && (() => {
            const avgV = (config.regulatorVoltages || [14.2]).reduce((a, b) => a + b, 0) / (config.regulatorVoltages || [14.2]).length;
            const full = calculateSignalChain(config.radio, config.driverAmp, config.finalAmp, config.bonding, config.antennaPosition, config.driveLevel, avgV);
            return (
              <div className="flex justify-between">
                <span>+ Final (+{finalAmps[config.finalAmp]?.gainDB}dB)</span>
                <span className="text-cyan-400">{Math.round(full.deadKey).toLocaleString()}W</span>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Thermal Preview */}
      <div className="mt-3">
        <ThermalPreview />
      </div>
    </div>
  );
}
