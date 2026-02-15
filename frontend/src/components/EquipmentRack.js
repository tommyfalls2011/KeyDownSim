import { useMemo } from 'react';
import { useRF } from '@/context/RFContext';
import { RADIOS, ANTENNAS, TRANSISTORS, BOX_SIZES, HEATSINKS, JUMPER_CABLES, JUMPER_LENGTHS, calculateSignalChain, getRecommendedHeatsink, isHeatsinkUndersized, getJumperLossDB } from '@/lib/rfEngine';
import RackUnit from '@/components/RackUnit';
import ThermalPreview from '@/components/ThermalPreview';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Flame, RotateCcw, Thermometer, Cable } from 'lucide-react';

function JumperCable({ label, cableTypeKey, cableLengthKey, cableType, cableLength, onTypeChange, onLengthChange }) {
  const lossDB = getJumperLossDB(cableType, cableLength);
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/50 border-l-2 border-amber-500/30" data-testid={`jumper-${cableTypeKey}`}>
      <Cable className="w-3 h-3 text-amber-500/60 shrink-0" />
      <span className="font-mono text-[8px] text-slate-600 w-14 shrink-0">{label}</span>
      <Select value={cableType} onValueChange={onTypeChange}>
        <SelectTrigger className="bg-void border-white/10 text-white font-mono text-[10px] h-6 flex-1 min-w-0" data-testid={`${cableTypeKey}-select`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-panel border-white/10">
          {Object.entries(JUMPER_CABLES).map(([key, c]) => (
            <SelectItem key={key} value={key} className="font-mono text-xs text-slate-300">{c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={String(cableLength)} onValueChange={v => onLengthChange(parseInt(v))}>
        <SelectTrigger className="bg-void border-white/10 text-white font-mono text-[10px] h-6 w-16 shrink-0" data-testid={`${cableLengthKey}-select`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-panel border-white/10">
          {JUMPER_LENGTHS.map(ft => (
            <SelectItem key={ft} value={String(ft)} className="font-mono text-xs text-slate-300">{ft}ft</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="font-mono text-[8px] text-red-400/70 w-12 text-right shrink-0">-{lossDB}dB</span>
    </div>
  );
}

function TempBar({ temp, blown, tjMax }) {
  const blowTemp = tjMax || 175;
  const pct = Math.min(100, ((temp - 25) / (blowTemp - 25)) * 100);
  const color = blown ? 'bg-red-600' : temp >= blowTemp - 25 ? 'bg-red-500' : temp >= 100 ? 'bg-amber-500' : temp >= 60 ? 'bg-amber-400/60' : 'bg-cyan-400/40';
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

function AmpStageSelector({ label, slot, transistorKey, boxSizeKey, heatsinkKey, transistorValue, boxSizeValue, heatsinkValue, onTransistorChange, onBoxSizeChange, onHeatsinkChange, specs, temp, blown, isKeyed, metrics, underDriven, resetAmp, resetKey, highlight }) {
  const hasAmp = transistorValue !== 'none' && boxSizeValue > 0;
  const recommended = getRecommendedHeatsink(boxSizeValue);
  const undersized = hasAmp && isHeatsinkUndersized(heatsinkValue, boxSizeValue);
  return (
    <RackUnit label={label} slot={slot} highlight={highlight}>
      {/* Transistor Type */}
      <div className="mb-2">
        <span className="font-mono text-[8px] text-slate-700 uppercase block mb-1">Pill Type</span>
        <Select value={transistorValue} onValueChange={onTransistorChange}>
          <SelectTrigger className="bg-void border-white/10 text-white font-mono text-xs h-8" data-testid={`${transistorKey}-select`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-panel border-white/10">
            <SelectItem value="none" className="font-mono text-xs text-slate-300">No Amp</SelectItem>
            {Object.entries(TRANSISTORS).map(([key, t]) => (
              <SelectItem key={key} value={key} className="font-mono text-xs text-slate-300">
                {t.name} ({t.wattsPEP}W, {t.gainDB}dB)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Box Size + Heatsink (only shown when transistor selected) */}
      {transistorValue !== 'none' && (
        <div className="flex gap-2 mb-2">
          <div className="flex-1">
            <span className="font-mono text-[8px] text-slate-700 uppercase block mb-1">Box Size</span>
            <Select value={String(boxSizeValue)} onValueChange={v => onBoxSizeChange(parseInt(v))}>
              <SelectTrigger className="bg-void border-white/10 text-white font-mono text-xs h-8" data-testid={`${boxSizeKey}-select`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-panel border-white/10">
                {BOX_SIZES.map(size => (
                  <SelectItem key={size} value={String(size)} className="font-mono text-xs text-slate-300">
                    {size}-Pill
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <span className="font-mono text-[8px] text-slate-700 uppercase block mb-1">Heatsink</span>
            <Select value={heatsinkValue} onValueChange={onHeatsinkChange}>
              <SelectTrigger className={`bg-void border-white/10 text-white font-mono text-xs h-8 ${undersized ? 'border-amber-500/50' : ''}`} data-testid={`${heatsinkKey}-select`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-panel border-white/10">
                {Object.entries(HEATSINKS).map(([key, h]) => (
                  <SelectItem key={key} value={key} className="font-mono text-xs text-slate-300">
                    {h.name}{key === recommended ? ' *' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Undersized heatsink warning */}
      {undersized && (
        <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded px-2 py-1 mb-1" data-testid={`${heatsinkKey}-undersized-warning`}>
          <Thermometer className="w-3 h-3 text-amber-400 shrink-0" />
          <span className="font-mono text-[8px] text-amber-400">
            Heatsink undersized for {boxSizeValue}-pill — recommend {HEATSINKS[recommended]?.name}
          </span>
        </div>
      )}

      {/* Specs summary */}
      {hasAmp && specs && (
        <>
          <div className="flex justify-between mt-1 font-mono text-[10px]">
            <span className="text-slate-600">GAIN: <span className="text-cyan-400">+{specs.gainDB}dB</span></span>
            <span className="text-slate-600">DRAW: <span className="text-warn">{isKeyed ? metrics : 0}A</span><span className="text-slate-700">/{specs.currentDraw}A</span></span>
          </div>
          <div className="flex justify-between mt-0.5 font-mono text-[9px]">
            <span className="text-slate-700">Eff: <span className="text-cyan-400">{Math.round(specs.efficiency * 100)}%</span></span>
            <span className="text-slate-700">Diss: <span className="text-amber-400">{specs.dissipation}W</span></span>
            <span className="text-slate-700">Tj: <span className="text-red-400">{specs.tjMax}°C</span></span>
          </div>
          <TempBar temp={temp} blown={blown} tjMax={specs.tjMax} />
        </>
      )}

      {/* Under-driven warning (final only) */}
      {underDriven && hasAmp && (
        <div className="mt-2 flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded px-2 py-1.5" data-testid="under-driven-warning">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <div className="font-mono text-[9px] text-amber-400 leading-tight">
            UNDER-DRIVEN — {Math.round(underDriven.driveRatio * 100)}% drive ({underDriven.driveWatts}W / {underDriven.idealDrive}W needed)
          </div>
        </div>
      )}

      {/* Blown indicator */}
      {blown && (
        <div className="mt-2 flex items-center justify-between bg-red-500/10 border border-red-500/30 rounded px-2 py-1.5" data-testid={`${resetKey}-blown`}>
          <span className="font-mono text-[9px] text-red-400 font-bold">BLOWN PILL</span>
          <button onClick={() => resetAmp(resetKey)} className="flex items-center gap-1 font-mono text-[8px] text-slate-400 hover:text-cyan-400 border border-white/10 rounded px-1.5 py-0.5" data-testid={`reset-${resetKey}-btn`}>
            <RotateCcw className="w-2.5 h-2.5" /> RESET
          </button>
        </div>
      )}
    </RackUnit>
  );
}

export default function EquipmentRack() {
  const { config, updateConfig, metrics, resetAmp, keyed, equipmentLoaded, driverSpecs, midDriverSpecs, finalSpecs, jumperConfig } = useRF();

  const radios = useMemo(() => ({ ...RADIOS }), [equipmentLoaded]);
  const antennas = useMemo(() => ({ ...ANTENNAS }), [equipmentLoaded]);

  const underDrivenInfo = metrics.underDriven ? {
    driveRatio: metrics.driveRatio,
    driveWatts: metrics.driveWatts,
    idealDrive: metrics.idealDrive,
  } : null;

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
            type="range" min="0.25" max="1" step="0.05"
            value={config.driveLevel || 1}
            onChange={e => updateConfig('driveLevel', parseFloat(e.target.value))}
            className="w-full h-1 accent-cyan-400 bg-slate-800 rounded cursor-pointer"
            data-testid="drive-level-slider"
          />
        </div>
      </RackUnit>

      <AmpStageSelector
        label="Driver Amplifier"
        slot="2U"
        transistorKey="driver-transistor"
        boxSizeKey="driver-box"
        heatsinkKey="driver-heatsink"
        transistorValue={config.driverTransistor}
        boxSizeValue={config.driverBoxSize}
        heatsinkValue={config.driverHeatsink}
        onTransistorChange={v => { updateConfig('driverTransistor', v); if (v !== 'none' && config.driverBoxSize === 0) updateConfig('driverBoxSize', 2); }}
        onBoxSizeChange={v => updateConfig('driverBoxSize', v)}
        onHeatsinkChange={v => updateConfig('driverHeatsink', v)}
        specs={driverSpecs}
        temp={metrics.driverTemp}
        blown={metrics.driverBlown}
        isKeyed={keyed}
        metrics={metrics.driverAmps}
        resetAmp={resetAmp}
        resetKey="driver"
      />

      <AmpStageSelector
        label="Mid Driver"
        slot="2.5U"
        transistorKey="mid-driver-transistor"
        boxSizeKey="mid-driver-box"
        heatsinkKey="mid-driver-heatsink"
        transistorValue={config.midDriverTransistor}
        boxSizeValue={config.midDriverBoxSize}
        heatsinkValue={config.midDriverHeatsink}
        onTransistorChange={v => { updateConfig('midDriverTransistor', v); if (v !== 'none' && config.midDriverBoxSize === 0) updateConfig('midDriverBoxSize', 4); }}
        onBoxSizeChange={v => updateConfig('midDriverBoxSize', v)}
        onHeatsinkChange={v => updateConfig('midDriverHeatsink', v)}
        specs={midDriverSpecs}
        temp={metrics.midDriverTemp}
        blown={metrics.midDriverBlown}
        isKeyed={keyed}
        metrics={metrics.midDriverAmps}
        resetAmp={resetAmp}
        resetKey="midDriver"
      />

      <AmpStageSelector
        label="Final Amplifier"
        slot="3U"
        highlight={config.finalBoxSize >= 16}
        transistorKey="final-transistor"
        boxSizeKey="final-box"
        heatsinkKey="final-heatsink"
        transistorValue={config.finalTransistor}
        boxSizeValue={config.finalBoxSize}
        heatsinkValue={config.finalHeatsink}
        onTransistorChange={v => { updateConfig('finalTransistor', v); if (v !== 'none' && config.finalBoxSize === 0) updateConfig('finalBoxSize', 4); }}
        onBoxSizeChange={v => updateConfig('finalBoxSize', v)}
        onHeatsinkChange={v => updateConfig('finalHeatsink', v)}
        specs={finalSpecs}
        temp={metrics.finalTemp}
        blown={metrics.finalBlown}
        isKeyed={keyed}
        metrics={metrics.finalAmps}
        underDriven={underDrivenInfo}
        resetAmp={resetAmp}
        resetKey="final"
      />

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
              <input type="range" min={ant.tipMin} max={ant.tipMax} step="0.5"
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
          {driverSpecs && (() => {
            const avgV = (config.regulatorVoltages || [14.2]).reduce((a, b) => a + b, 0) / (config.regulatorVoltages || [14.2]).length;
            const afterDriver = calculateSignalChain(config.radio, driverSpecs, null, null, config.bonding, config.antennaPosition, config.driveLevel, avgV);
            return (
              <div className="flex justify-between">
                <span>+ Driver (+{driverSpecs.gainDB}dB)</span>
                <span className="text-cyan-400">{Math.round(afterDriver.deadKey)}W</span>
              </div>
            );
          })()}
          {midDriverSpecs && (() => {
            const avgV = (config.regulatorVoltages || [14.2]).reduce((a, b) => a + b, 0) / (config.regulatorVoltages || [14.2]).length;
            const afterMid = calculateSignalChain(config.radio, driverSpecs, midDriverSpecs, null, config.bonding, config.antennaPosition, config.driveLevel, avgV);
            return (
              <div className="flex justify-between">
                <span>+ Mid Driver (+{midDriverSpecs.gainDB}dB)</span>
                <span className="text-cyan-400">{Math.round(afterMid.deadKey)}W</span>
              </div>
            );
          })()}
          {finalSpecs && (() => {
            const avgV = (config.regulatorVoltages || [14.2]).reduce((a, b) => a + b, 0) / (config.regulatorVoltages || [14.2]).length;
            const full = calculateSignalChain(config.radio, driverSpecs, midDriverSpecs, finalSpecs, config.bonding, config.antennaPosition, config.driveLevel, avgV);
            return (
              <div className="flex justify-between">
                <span>+ Final (+{finalSpecs.gainDB}dB)</span>
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
