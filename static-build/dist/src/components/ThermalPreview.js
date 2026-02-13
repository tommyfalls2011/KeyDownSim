import { useState } from 'react';
import { useRF } from '@/context/RFContextStatic';
import { Thermometer, AlertTriangle, Clock, Zap, Play } from 'lucide-react';

export default function ThermalPreview() {
  const { runThermalPreview, config } = useRF();
  const [preview, setPreview] = useState(null);
  const [duration, setDuration] = useState(30);
  const [isRunning, setIsRunning] = useState(false);

  const handleRunPreview = () => {
    setIsRunning(true);
    // Small delay for visual feedback
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

      {/* Duration selector and Run button */}
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

      {/* Preview Results */}
      {preview && (
        <div className="space-y-3 animate-in fade-in duration-300">
          {/* Warnings */}
          {(preview.warnings.highVoltage || preview.warnings.overDriven) && (
            <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded px-2 py-1.5">
              <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
              <span className="font-mono text-[9px] text-amber-400">
                {preview.warnings.highVoltage && 'High voltage increases heat! '}
                {preview.warnings.overDriven && 'Over-driven amp runs hotter!'}
              </span>
            </div>
          )}

          {/* Driver Preview */}
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

          {/* Final Preview */}
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

          {/* Summary */}
          <div className="text-center font-mono text-[8px] text-slate-600 pt-1 border-t border-white/5">
            Simulated {preview.durationSec}s key-down @ 50% modulation
          </div>
        </div>
      )}
    </div>
  );
}
