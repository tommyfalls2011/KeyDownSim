#!/bin/bash
# Static Build Script for sma-antenna.org
# Creates a standalone version without backend dependencies

set -e

echo "=== Building Static RF Visualizer for sma-antenna.org ==="

# Create build directory
BUILD_DIR="/app/static-build/dist"
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

# Copy the frontend source
cp -r /app/frontend/src "$BUILD_DIR/src"
cp -r /app/frontend/public "$BUILD_DIR/public"
cp /app/frontend/package.json "$BUILD_DIR/"
cp /app/frontend/craco.config.js "$BUILD_DIR/" 2>/dev/null || true
cp /app/frontend/jsconfig.json "$BUILD_DIR/" 2>/dev/null || true
cp /app/frontend/tailwind.config.js "$BUILD_DIR/" 2>/dev/null || true
cp /app/frontend/postcss.config.js "$BUILD_DIR/" 2>/dev/null || true

# Replace the main App.js with static version
cp /app/static-build/App.js "$BUILD_DIR/src/App.js"

# Replace rfEngine with static version (hardcoded equipment)
cp /app/static-build/rfEngine.js "$BUILD_DIR/src/lib/rfEngineStatic.js"

# Copy the static RFContext
cp /app/static-build/RFContextStatic.js "$BUILD_DIR/src/context/RFContextStatic.js"

# Fix imports in ControlPanel.js to use static versions and remove backend deps
sed -i "s|from '@/context/RFContext'|from '@/context/RFContextStatic'|g" "$BUILD_DIR/src/components/ControlPanel.js"
sed -i "s|from '@/lib/rfEngine'|from '@/lib/rfEngineStatic'|g" "$BUILD_DIR/src/components/ControlPanel.js"
# Remove auth and save-related imports/code from ControlPanel
sed -i "/import { useAuth } from/d" "$BUILD_DIR/src/components/ControlPanel.js"
sed -i "/import axios from/d" "$BUILD_DIR/src/components/ControlPanel.js"
sed -i "/const API = /d" "$BUILD_DIR/src/components/ControlPanel.js"

# Fix imports in CanvasVisualizer.js to use static versions
sed -i "s|from '@/context/RFContext'|from '@/context/RFContextStatic'|g" "$BUILD_DIR/src/components/CanvasVisualizer.js"
sed -i "s|from '@/lib/rfEngine'|from '@/lib/rfEngineStatic'|g" "$BUILD_DIR/src/components/CanvasVisualizer.js"

# Fix imports in MetricsPanel.js to use static versions
sed -i "s|from '@/context/RFContext'|from '@/context/RFContextStatic'|g" "$BUILD_DIR/src/components/MetricsPanel.js"
sed -i "s|from '@/lib/rfEngine'|from '@/lib/rfEngineStatic'|g" "$BUILD_DIR/src/components/MetricsPanel.js"

# Fix imports in KeyButton.js to use static versions
sed -i "s|from '@/context/RFContext'|from '@/context/RFContextStatic'|g" "$BUILD_DIR/src/components/KeyButton.js"
sed -i "s|from '@/lib/rfEngine'|from '@/lib/rfEngineStatic'|g" "$BUILD_DIR/src/components/KeyButton.js"

# Create simplified Dashboard without auth
cat > "$BUILD_DIR/src/pages/DashboardStatic.js" << 'DASHBOARD_EOF'
import { useRF } from '@/context/RFContextStatic';
import { getRadiationPattern, VEHICLES, ANTENNA_POSITIONS } from '@/lib/rfEngineStatic';
import Header from '@/components/HeaderStatic';
import EquipmentRackStatic from '@/components/EquipmentRackStatic';
import ControlPanel from '@/components/ControlPanel';
import MetricsPanel from '@/components/MetricsPanel';
import CanvasVisualizer from '@/components/CanvasVisualizer';

export default function DashboardStatic() {
  const { config, keyed, setKeyed, metrics, micEnabled, toggleMic } = useRF();

  const pattern = getRadiationPattern(config.vehicle, config.bonding, keyed ? metrics.modulatedWatts : 0, config.antenna, config.antennaPosition);
  const vehicle = VEHICLES[config.vehicle] || VEHICLES['suburban'];
  const antennaPos = ANTENNA_POSITIONS[config.antennaPosition] || ANTENNA_POSITIONS['center'];

  return (
    <div className="min-h-screen bg-void text-white">
      <Header />
      <div className="flex">
        {/* Left Panel - Equipment */}
        <div className="w-[380px] border-r border-white/5 bg-panel min-h-[calc(100vh-56px)] overflow-y-auto">
          <EquipmentRackStatic />
        </div>
        
        {/* Center - Visualizer */}
        <div className="flex-1 flex flex-col">
          <CanvasVisualizer 
            pattern={pattern} 
            vehicle={vehicle} 
            antennaPos={antennaPos}
            keyed={keyed}
            power={metrics.modulatedWatts}
            takeoff={metrics.takeoffAngle}
          />
          <MetricsPanel />
        </div>
        
        {/* Right Panel - Controls */}
        <div className="w-[380px] border-l border-white/5 bg-panel min-h-[calc(100vh-56px)] overflow-y-auto">
          <ControlPanel />
          
          {/* Key Down Button */}
          <div className="p-4 border-t border-white/5">
            <button
              onMouseDown={() => setKeyed(true)}
              onMouseUp={() => setKeyed(false)}
              onMouseLeave={() => setKeyed(false)}
              onTouchStart={() => setKeyed(true)}
              onTouchEnd={() => setKeyed(false)}
              className={`w-full py-6 rounded-lg font-chakra text-lg uppercase tracking-[0.3em] transition-all ${
                keyed
                  ? 'bg-hot text-white shadow-[0_0_30px_rgba(255,100,100,0.5)]'
                  : 'bg-void border-2 border-cyan-500/30 text-cyan-400 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(0,255,255,0.2)]'
              }`}
              data-testid="key-down-btn"
            >
              {keyed ? 'TRANSMITTING' : 'KEY DOWN'}
            </button>
            <p className="text-center font-mono text-[9px] text-slate-600 mt-2">
              HOLD TO TRANSMIT
            </p>
          </div>
          
          {/* Mic Toggle */}
          <div className="px-4 pb-4">
            <button
              onClick={toggleMic}
              className={`w-full py-2 rounded font-mono text-xs uppercase tracking-wider transition-all ${
                micEnabled
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-void text-slate-500 border border-white/10 hover:border-white/20'
              }`}
              data-testid="mic-toggle-btn"
            >
              {micEnabled ? '🎤 MIC ON' : '🎤 MIC OFF'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
DASHBOARD_EOF

# Create static Header (no login/admin buttons)
cat > "$BUILD_DIR/src/components/HeaderStatic.js" << 'HEADER_EOF'
import { Radio } from 'lucide-react';

export default function HeaderStatic() {
  return (
    <header className="h-14 bg-panel border-b border-white/5 flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
          <Radio className="w-4 h-4 text-cyan-400" />
        </div>
        <div>
          <h1 className="font-chakra text-sm font-bold tracking-wider">
            <span className="text-white">KEY</span>
            <span className="text-cyan-400">DOWN</span>
          </h1>
          <p className="font-mono text-[8px] text-slate-600 tracking-wider">RF VISUALIZER v1.0</p>
        </div>
      </div>
      <div className="font-mono text-[10px] text-slate-600">
        sma-antenna.org
      </div>
    </header>
  );
}
HEADER_EOF

# Create static EquipmentRack (uses static rfEngine)
cat > "$BUILD_DIR/src/components/EquipmentRackStatic.js" << 'RACK_EOF'
import { useRF } from '@/context/RFContextStatic';
import { RADIOS, DRIVER_AMPS, FINAL_AMPS, ANTENNAS, calculateSignalChain } from '@/lib/rfEngineStatic';
import RackUnit from '@/components/RackUnit';
import ThermalPreviewStatic from '@/components/ThermalPreviewStatic';
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

export default function EquipmentRackStatic() {
  const { config, updateConfig, metrics, resetAmp, keyed } = useRF();

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
          <span className="text-slate-600">DEAD KEY: <span className="text-cyan-400">{Math.round((RADIOS[config.radio]?.deadKey || 1) * (config.driveLevel || 1) * 100) / 100}W</span></span>
          <span className="text-slate-600">PEAK: <span className="text-cyan-400">{Math.round((RADIOS[config.radio]?.peakKey || 4) * (config.driveLevel || 1) * 100) / 100}W</span></span>
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
            <span className="text-slate-600">DRAW: <span className="text-warn">{keyed ? metrics.driverAmps : 0}A</span><span className="text-slate-700">/{DRIVER_AMPS[config.driverAmp]?.currentDraw}A</span></span>
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
            <span className="text-slate-600">DRAW: <span className="text-hot">{keyed ? metrics.finalAmps : 0}A</span><span className="text-slate-700">/{FINAL_AMPS[config.finalAmp]?.currentDraw}A</span></span>
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
          const ant = ANTENNAS[v];
          if (ant?.tunable) updateConfig('tipLength', ant.tipDefault || 44);
        }}>
          <SelectTrigger className="bg-void border-white/10 text-white font-mono text-xs h-8" data-testid="antenna-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-panel border-white/10 max-h-60">
            {Object.entries(ANTENNAS).map(([key, a]) => (
              <SelectItem key={key} value={key} className="font-mono text-xs text-slate-300">
                {a.name} ({a.gainDBI > 0 ? '+' : ''}{a.gainDBI}dBi)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {ANTENNAS[config.antenna]?.tunable && (() => {
          const ant = ANTENNAS[config.antenna];
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
            <span className="text-cyan-400">{Math.round((RADIOS[config.radio]?.deadKey || 1) * (config.driveLevel || 1) * 100) / 100}W</span>
          </div>
          {config.driverAmp !== 'none' && (() => {
            const avgV = (config.regulatorVoltages || [14.2]).reduce((a, b) => a + b, 0) / (config.regulatorVoltages || [14.2]).length;
            const afterDriver = calculateSignalChain(config.radio, config.driverAmp, 'none', config.bonding, config.antennaPosition, config.driveLevel, avgV);
            return (
              <div className="flex justify-between">
                <span>+ Driver (+{DRIVER_AMPS[config.driverAmp]?.gainDB}dB)</span>
                <span className="text-cyan-400">{Math.round(afterDriver.deadKey)}W</span>
              </div>
            );
          })()}
          {config.finalAmp !== 'none' && (() => {
            const avgV = (config.regulatorVoltages || [14.2]).reduce((a, b) => a + b, 0) / (config.regulatorVoltages || [14.2]).length;
            const full = calculateSignalChain(config.radio, config.driverAmp, config.finalAmp, config.bonding, config.antennaPosition, config.driveLevel, avgV);
            return (
              <div className="flex justify-between">
                <span>+ Final (+{FINAL_AMPS[config.finalAmp]?.gainDB}dB)</span>
                <span className="text-cyan-400">{Math.round(full.deadKey).toLocaleString()}W</span>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Thermal Preview */}
      <div className="mt-3">
        <ThermalPreviewStatic />
      </div>
    </div>
  );
}
RACK_EOF

# Create static ThermalPreview
cat > "$BUILD_DIR/src/components/ThermalPreviewStatic.js" << 'THERMAL_EOF'
import { useState } from 'react';
import { useRF } from '@/context/RFContextStatic';
import { Thermometer, AlertTriangle, Clock, Zap, Play } from 'lucide-react';

export default function ThermalPreviewStatic() {
  const { runThermalPreview, config } = useRF();
  const [preview, setPreview] = useState(null);
  const [duration, setDuration] = useState(30);
  const [isRunning, setIsRunning] = useState(false);

  const handleRunPreview = () => {
    setIsRunning(true);
    setTimeout(() => {
      const result = runThermalPreview(duration);
      setPreview(result);
      setIsRunning(false);
    }, 300);
  };

  const hasAmps = config.driverAmp !== 'none' || config.finalAmp !== 'none';

  if (!hasAmps) {
    return (
      <div className="bg-void border border-white/5 rounded p-3">
        <div className="font-chakra text-[10px] uppercase tracking-[0.2em] text-slate-600 mb-2 flex items-center gap-2">
          <Thermometer className="w-3 h-3" />
          Thermal Preview
        </div>
        <p className="font-mono text-[10px] text-slate-600">
          Add an amplifier to preview thermal behavior.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-void border border-white/5 rounded p-3">
      <div className="font-chakra text-[10px] uppercase tracking-[0.2em] text-slate-600 mb-3 flex items-center gap-2">
        <Thermometer className="w-3 h-3" />
        Thermal Preview
      </div>

      <div className="flex items-center gap-2 mb-3">
        <select
          value={duration}
          onChange={(e) => setDuration(parseInt(e.target.value))}
          className="bg-panel border border-white/10 rounded px-2 py-1 font-mono text-[10px] text-slate-300"
          data-testid="preview-duration-select"
        >
          <option value={15}>15 sec</option>
          <option value={30}>30 sec</option>
          <option value={60}>1 min</option>
          <option value={120}>2 min</option>
          <option value={300}>5 min</option>
        </select>
        <button
          onClick={handleRunPreview}
          disabled={isRunning}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded font-mono text-[10px] uppercase tracking-wider transition-all ${
            isRunning
              ? 'bg-slate-700 text-slate-500 cursor-wait'
              : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30'
          }`}
          data-testid="run-thermal-preview-btn"
        >
          <Play className={`w-3 h-3 ${isRunning ? 'animate-pulse' : ''}`} />
          {isRunning ? 'Simulating...' : 'Test Config'}
        </button>
      </div>

      {preview && (
        <div className="space-y-3 animate-in fade-in duration-300">
          {(preview.warnings.highVoltage || preview.warnings.overDriven) && (
            <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded px-2 py-1.5">
              <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
              <span className="font-mono text-[9px] text-amber-400">
                {preview.warnings.highVoltage && 'High voltage increases heat! '}
                {preview.warnings.overDriven && 'Over-driven amp runs hotter!'}
              </span>
            </div>
          )}

          {preview.driver.isActive && (
            <div className="bg-panel/50 border border-white/5 rounded p-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-[9px] text-slate-500 uppercase">Driver Amp</span>
                {preview.driver.willBlow ? (
                  <span className="font-mono text-[9px] text-red-400 font-bold flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5" /> BLOWS @ {preview.driver.blowTime}s
                  </span>
                ) : (
                  <span className="font-mono text-[9px] text-green-400">SAFE</span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="font-mono text-[8px] text-slate-600">START</div>
                  <div className="font-mono text-[11px] text-slate-400">{preview.driver.startTemp}°</div>
                </div>
                <div>
                  <div className="font-mono text-[8px] text-slate-600">PEAK</div>
                  <div className={`font-mono text-[11px] ${preview.driver.peakTemp >= 150 ? 'text-red-400' : preview.driver.peakTemp >= 100 ? 'text-amber-400' : 'text-cyan-400'}`}>
                    {preview.driver.peakTemp}°
                  </div>
                </div>
                <div>
                  <div className="font-mono text-[8px] text-slate-600">END</div>
                  <div className={`font-mono text-[11px] ${preview.driver.endTemp >= 150 ? 'text-red-400' : preview.driver.endTemp >= 100 ? 'text-amber-400' : 'text-slate-400'}`}>
                    {preview.driver.endTemp}°
                  </div>
                </div>
              </div>
              {preview.driver.timeToBlowFromNow && (
                <div className="mt-1.5 flex items-center gap-1 justify-center">
                  <Clock className="w-2.5 h-2.5 text-slate-600" />
                  <span className="font-mono text-[8px] text-slate-500">
                    Est. blow in {preview.driver.timeToBlowFromNow}s from current temp
                  </span>
                </div>
              )}
            </div>
          )}

          {preview.final.isActive && (
            <div className="bg-panel/50 border border-white/5 rounded p-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-[9px] text-slate-500 uppercase">Final Amp</span>
                {preview.final.willBlow ? (
                  <span className="font-mono text-[9px] text-red-400 font-bold flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5" /> BLOWS @ {preview.final.blowTime}s
                  </span>
                ) : (
                  <span className="font-mono text-[9px] text-green-400">SAFE</span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="font-mono text-[8px] text-slate-600">START</div>
                  <div className="font-mono text-[11px] text-slate-400">{preview.final.startTemp}°</div>
                </div>
                <div>
                  <div className="font-mono text-[8px] text-slate-600">PEAK</div>
                  <div className={`font-mono text-[11px] ${preview.final.peakTemp >= 150 ? 'text-red-400' : preview.final.peakTemp >= 100 ? 'text-amber-400' : 'text-cyan-400'}`}>
                    {preview.final.peakTemp}°
                  </div>
                </div>
                <div>
                  <div className="font-mono text-[8px] text-slate-600">END</div>
                  <div className={`font-mono text-[11px] ${preview.final.endTemp >= 150 ? 'text-red-400' : preview.final.endTemp >= 100 ? 'text-amber-400' : 'text-slate-400'}`}>
                    {preview.final.endTemp}°
                  </div>
                </div>
              </div>
              {preview.final.timeToBlowFromNow && (
                <div className="mt-1.5 flex items-center gap-1 justify-center">
                  <Clock className="w-2.5 h-2.5 text-slate-600" />
                  <span className="font-mono text-[8px] text-slate-500">
                    Est. blow in {preview.final.timeToBlowFromNow}s from current temp
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="text-center font-mono text-[8px] text-slate-600 pt-1 border-t border-white/5">
            Simulated {preview.durationSec}s key-down @ 50% modulation
          </div>
        </div>
      )}
    </div>
  );
}
THERMAL_EOF

# Update .env for static build (no backend URL needed)
cat > "$BUILD_DIR/.env" << 'ENV_EOF'
REACT_APP_BACKEND_URL=
GENERATE_SOURCEMAP=false
ENV_EOF

echo "=== Static build files prepared in $BUILD_DIR ==="
echo ""
echo "To build the static version:"
echo "  cd $BUILD_DIR"
echo "  yarn install"
echo "  yarn build"
echo ""
echo "The built files will be in $BUILD_DIR/build/"
echo "Upload those files to sma-antenna.org"
