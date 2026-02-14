import { useRF } from '@/context/RFContext';
import { VEHICLES, ANTENNA_POSITIONS, YAGI_ARRAY_CONFIG } from '@/lib/rfEngine';
import KeyButton from '@/components/KeyButton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, Antenna, Radio } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ControlPanel() {
  const { config, updateConfig } = useRF();
  const { token } = useAuth();
  const [saveName, setSaveName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!saveName.trim()) { toast.error('Enter a config name'); return; }
    setSaving(true);
    try {
      await axios.post(`${API}/configurations`, {
        name: saveName,
        radio: config.radio,
        driver_amp: config.driverAmp,
        final_amp: config.finalAmp,
        antenna: config.antenna,
        antenna_position: config.antennaPosition,
        vehicle: config.vehicle,
        bonding: config.bonding,
        alternator_count: config.alternatorCount,
        alternator_amps: config.alternatorAmps,
        battery_type: config.batteryType,
        battery_count: config.batteryCount,
        regulator_voltages: config.regulatorVoltages,
        tip_length: config.tipLength,
      }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Config saved');
      setSaveName('');
    } catch (err) {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 flex flex-col h-full">
      {/* Vehicle Selector */}
      <div className="mb-6">
        <Label className="font-chakra text-[10px] uppercase tracking-[0.2em] text-slate-600 mb-2 block">Vehicle</Label>
        <Select value={config.vehicle} onValueChange={v => updateConfig('vehicle', v)}>
          <SelectTrigger className="bg-void border-white/10 text-white font-mono text-xs h-8" data-testid="vehicle-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-panel border-white/10">
            {Object.entries(VEHICLES).map(([key, v]) => (
              <SelectItem key={key} value={key} className="font-mono text-xs text-slate-300">
                {v.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex justify-between mt-1.5 font-mono text-[9px]">
          <span className="text-slate-600">Surface: <span className="text-cyan-400">{VEHICLES[config.vehicle]?.surfaceSqFt}sqft</span></span>
          <span className="text-slate-600">Ground: <span className="text-cyan-400">{Math.round((VEHICLES[config.vehicle]?.groundPlane || 0) * 100)}%</span></span>
        </div>
        {/* Ride Height Adjustment */}
        <div className="mt-3 space-y-1">
          <div className="flex justify-between">
            <Label className="font-mono text-[8px] text-slate-600">RIDE HEIGHT</Label>
            <span className={`font-mono text-[9px] ${config.rideHeightOffset === 0 ? 'text-slate-600' : config.rideHeightOffset < 0 ? 'text-cyan-400' : 'text-amber-400'}`}>
              {config.rideHeightOffset === 0 ? 'STOCK' : config.rideHeightOffset < 0 ? `${config.rideHeightOffset}" LOWERED` : `+${config.rideHeightOffset}" LIFTED`}
            </span>
          </div>
          <input
            type="range"
            min="-6"
            max="6"
            step="1"
            value={config.rideHeightOffset || 0}
            onChange={e => updateConfig('rideHeightOffset', parseInt(e.target.value))}
            className="w-full h-1 accent-cyan-400 bg-slate-800 rounded cursor-pointer"
            data-testid="ride-height-slider"
          />
          <div className="flex justify-between font-mono text-[7px] text-slate-700">
            <span>SLAMMED</span>
            <span>STOCK</span>
            <span>LIFTED</span>
          </div>
        </div>
      </div>
      <div className="mb-6">
        <Label className="font-chakra text-[10px] uppercase tracking-[0.2em] text-slate-600 mb-2 block">Antenna Position</Label>
        <Select value={config.antennaPosition} onValueChange={v => updateConfig('antennaPosition', v)}>
          <SelectTrigger className="bg-void border-white/10 text-white font-mono text-xs h-8" data-testid="antenna-pos-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-panel border-white/10">
            {Object.entries(ANTENNA_POSITIONS).map(([key, p]) => (
              <SelectItem key={key} value={key} className="font-mono text-xs text-slate-300">
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {ANTENNA_POSITIONS[config.antennaPosition]?.dBLoss > 0 && (
          <div className="mt-1.5 flex items-center gap-1.5 font-mono text-[9px]" data-testid="receive-sensitivity">
            <Radio className="w-3 h-3 text-amber-400" />
            <span className="text-slate-600">Rx Sensitivity Loss: <span className="text-amber-400">-{ANTENNA_POSITIONS[config.antennaPosition].dBLoss}dB</span></span>
          </div>
        )}
      </div>

      {/* Toggles */}
      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <Label className="font-chakra text-[10px] uppercase tracking-[0.2em] text-slate-600">Bond All Panels</Label>
          <Switch
            data-testid="bonding-toggle"
            checked={config.bonding}
            onCheckedChange={v => updateConfig('bonding', v)}
            className="data-[state=checked]:bg-cyan-400"
          />
        </div>
        
        {/* Yagi Array Mode Toggle */}
        <div className="flex items-center justify-between">
          <Label className="font-chakra text-[10px] uppercase tracking-[0.2em] text-amber-400 flex items-center gap-1.5">
            <Antenna className="w-3 h-3" />
            Yagi Array Mode
          </Label>
          <Switch
            data-testid="yagi-mode-toggle"
            checked={config.yagiMode}
            onCheckedChange={v => updateConfig('yagiMode', v)}
            className="data-[state=checked]:bg-amber-400"
          />
        </div>
      </div>

      {/* Yagi Array Configuration */}
      {config.yagiMode && (
        <div className="space-y-3 mb-6 bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
          <Label className="font-chakra text-[10px] uppercase tracking-[0.2em] text-amber-400 block">
            5-Element Yagi Array
          </Label>
          
          {/* Stick Type */}
          <div>
            <Label className="font-mono text-[8px] text-slate-600 mb-1 block">FIGHTING STICKS</Label>
            <Select value={config.yagiStickType} onValueChange={v => updateConfig('yagiStickType', v)}>
              <SelectTrigger className="bg-void border-white/10 text-white font-mono text-xs h-8" data-testid="yagi-stick-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-panel border-white/10">
                {YAGI_ARRAY_CONFIG.stickOptions.map(opt => (
                  <SelectItem key={opt.id} value={opt.id} className="font-mono text-xs text-slate-300">
                    {opt.name} (+{opt.gainDBI}dBi)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Element Heights (tunable ones) */}
          <div className="space-y-2">
            <Label className="font-mono text-[8px] text-slate-600 block">TUNABLE ELEMENTS (inches)</Label>
            
            {/* ANT1 - Reflector */}
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] text-slate-500 w-12">ANT1</span>
              <input
                type="range"
                min="72"
                max="144"
                value={config.yagiElementHeights?.ant1 || 96}
                onChange={e => updateConfig('yagiElementHeights', { ...config.yagiElementHeights, ant1: parseInt(e.target.value) })}
                className="flex-1 h-1 accent-amber-400 bg-slate-800 rounded cursor-pointer"
                data-testid="yagi-ant1-slider"
              />
              <span className="font-mono text-[9px] text-amber-400 w-10">{config.yagiElementHeights?.ant1 || 96}"</span>
            </div>
            
            {/* ANT2 - Driven */}
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] text-slate-500 w-12">ANT2</span>
              <input
                type="range"
                min="72"
                max="144"
                value={config.yagiElementHeights?.ant2 || 96}
                onChange={e => updateConfig('yagiElementHeights', { ...config.yagiElementHeights, ant2: parseInt(e.target.value) })}
                className="flex-1 h-1 accent-amber-400 bg-slate-800 rounded cursor-pointer"
                data-testid="yagi-ant2-slider"
              />
              <span className="font-mono text-[9px] text-amber-400 w-10">{config.yagiElementHeights?.ant2 || 96}"</span>
            </div>
            
            {/* DIR1 - First Director (shorter, tunable for SWR) */}
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] text-cyan-400 w-12">DIR1</span>
              <input
                type="range"
                min="60"
                max="108"
                value={config.yagiElementHeights?.dir1 || 84}
                onChange={e => updateConfig('yagiElementHeights', { ...config.yagiElementHeights, dir1: parseInt(e.target.value) })}
                className="flex-1 h-1 accent-cyan-400 bg-slate-800 rounded cursor-pointer"
                data-testid="yagi-dir1-slider"
              />
              <span className="font-mono text-[9px] text-cyan-400 w-10">{config.yagiElementHeights?.dir1 || 84}"</span>
            </div>
            
            {/* DIR2 & DIR3 - Fixed (taller) */}
            <div className="flex items-center gap-2 opacity-60">
              <span className="font-mono text-[9px] text-slate-600 w-12">DIR2/3</span>
              <div className="flex-1 h-1 bg-slate-800 rounded" />
              <span className="font-mono text-[9px] text-slate-500 w-10">{config.yagiElementHeights?.dir2 || 111}" (fixed)</span>
            </div>
          </div>

          {/* Element Position Adjustments (forward/backward fine-tuning) */}
          <div className="space-y-2 pt-2 border-t border-white/5">
            <Label className="font-mono text-[8px] text-slate-600 block">POSITION ADJUST (front/back)</Label>
            
            {[
              { id: 'ant1', name: 'ANT1', color: 'text-slate-500', accent: 'accent-amber-400' },
              { id: 'ant2', name: 'ANT2', color: 'text-slate-500', accent: 'accent-amber-400' },
              { id: 'dir1', name: 'DIR1', color: 'text-cyan-400', accent: 'accent-cyan-400' },
              { id: 'dir2', name: 'DIR2', color: 'text-orange-400', accent: 'accent-orange-400' },
              { id: 'dir3', name: 'DIR3', color: 'text-orange-400', accent: 'accent-orange-400' },
            ].map(el => {
              const offset = config.yagiElementPositions?.[el.id] || 0;
              return (
                <div key={el.id} className="flex items-center gap-2">
                  <span className={`font-mono text-[9px] ${el.color} w-12`}>{el.name}</span>
                  <input
                    type="range"
                    min="-12"
                    max="12"
                    step="1"
                    value={offset}
                    onChange={e => updateConfig('yagiElementPositions', { ...config.yagiElementPositions, [el.id]: parseInt(e.target.value) })}
                    className={`flex-1 h-1 ${el.accent} bg-slate-800 rounded cursor-pointer`}
                    data-testid={`yagi-pos-${el.id}-slider`}
                  />
                  <span className={`font-mono text-[9px] w-10 ${offset === 0 ? 'text-slate-600' : offset > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {offset > 0 ? '+' : ''}{offset}"
                  </span>
                </div>
              );
            })}
            <div className="flex justify-between font-mono text-[7px] text-slate-700 px-12">
              <span>-12" back</span>
              <span>0</span>
              <span>+12" fwd</span>
            </div>
          </div>

          {/* DIR1 Position Toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-white/5">
            <Label className="font-mono text-[9px] text-cyan-400 flex items-center gap-1">
              DIR1 Position
            </Label>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[8px] text-slate-600">{config.yagiDir1OnTruck ? 'On Truck' : 'Front Beam'}</span>
              <Switch
                data-testid="yagi-dir1-position-toggle"
                checked={!config.yagiDir1OnTruck}
                onCheckedChange={v => updateConfig('yagiDir1OnTruck', !v)}
                className="data-[state=checked]:bg-cyan-400 scale-75"
              />
            </div>
          </div>

          {/* Yagi Info */}
          <div className="font-mono text-[8px] text-slate-600 pt-2 border-t border-white/5 space-y-0.5">
            <div>Forward Gain: <span className="text-amber-400">+{YAGI_ARRAY_CONFIG.baseGainDB + (config.yagiStickType === 'fight-10' ? 1.5 : 0)}dB</span></div>
            <div>Beam Width: <span className="text-amber-400">{YAGI_ARRAY_CONFIG.beamWidth}°</span></div>
            <div className="text-slate-700">Pattern: Highly directional forward beam</div>
          </div>
        </div>
      )}

      {/* Alternators */}
      <div className="space-y-3 mb-6">
        <Label className="font-chakra text-[10px] uppercase tracking-[0.2em] text-slate-600 block">Alternators</Label>
        <div className="flex gap-2">
          <div className="flex-1">
            <Label className="font-mono text-[8px] text-slate-700 mb-1 block">COUNT</Label>
            <Select value={String(config.alternatorCount)} onValueChange={v => updateConfig('alternatorCount', parseInt(v))}>
              <SelectTrigger className="bg-void border-white/10 text-white font-mono text-xs h-8" data-testid="alt-count-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-panel border-white/10">
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => (
                  <SelectItem key={n} value={String(n)} className="font-mono text-xs text-slate-300">{n}x</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Label className="font-mono text-[8px] text-slate-700 mb-1 block">AMPS EACH</Label>
            <Select value={String(config.alternatorAmps)} onValueChange={v => updateConfig('alternatorAmps', parseInt(v))}>
              <SelectTrigger className="bg-void border-white/10 text-white font-mono text-xs h-8" data-testid="alt-amps-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-panel border-white/10">
                {[130, 270, 300, 350, 400, 450, 500].map(a => (
                  <SelectItem key={a} value={String(a)} className="font-mono text-xs text-slate-300">{a}A</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="font-mono text-[9px] text-slate-600">
          Total capacity: <span className="text-cyan-400">{config.alternatorCount * config.alternatorAmps}A</span>
        </div>
      </div>

      {/* Battery Bank */}
      <div className="space-y-3 mb-6">
        <Label className="font-chakra text-[10px] uppercase tracking-[0.2em] text-slate-600 block">Battery Bank</Label>
        <div className="flex gap-2">
          <div className="flex-1">
            <Label className="font-mono text-[8px] text-slate-700 mb-1 block">TYPE</Label>
            <Select value={config.batteryType} onValueChange={v => updateConfig('batteryType', v)}>
              <SelectTrigger className="bg-void border-white/10 text-white font-mono text-xs h-8" data-testid="battery-type-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-panel border-white/10">
                <SelectItem value="none" className="font-mono text-xs text-slate-300">None</SelectItem>
                <SelectItem value="lead" className="font-mono text-xs text-slate-300">Lead Acid</SelectItem>
                <SelectItem value="agm" className="font-mono text-xs text-slate-300">AGM</SelectItem>
                <SelectItem value="lithium" className="font-mono text-xs text-slate-300">Lithium</SelectItem>
                <SelectItem value="caps" className="font-mono text-xs text-slate-300">Cap Bank</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Label className="font-mono text-[8px] text-slate-700 mb-1 block">COUNT</Label>
            <Select value={String(config.batteryCount)} onValueChange={v => updateConfig('batteryCount', parseInt(v))}>
              <SelectTrigger className="bg-void border-white/10 text-white font-mono text-xs h-8" data-testid="battery-count-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-panel border-white/10">
                {[0,1,2,3,4,5,6,8,10,12].map(n => (
                  <SelectItem key={n} value={String(n)} className="font-mono text-xs text-slate-300">{n}x</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {config.batteryType !== 'none' && config.batteryCount > 0 && (
          <div className="font-mono text-[9px] text-slate-600 space-y-0.5">
            <div>Bank: <span className="text-cyan-400">
              {({'lead': 100, 'agm': 100, 'lithium': 100, 'caps': 5}[config.batteryType] || 0) * config.batteryCount}Ah
            </span>
            {' '}@ <span className="text-cyan-400">
              {({'lead': '3C', 'agm': '5C', 'lithium': '15C', 'caps': '200C'}[config.batteryType] || '—')}
            </span></div>
            <div>Max discharge: <span className="text-cyan-400">
              {({'lead': 300, 'agm': 500, 'lithium': 1500, 'caps': 1000}[config.batteryType] || 0) * config.batteryCount}A
            </span></div>
          </div>
        )}
      </div>

      {/* External Voltage Regulators */}
      {config.alternatorCount > 0 && (
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between">
            <Label className="font-chakra text-[10px] uppercase tracking-[0.2em] text-slate-600">Ext. Regulators</Label>
            {(config.regulatorVoltages || []).length > 1 && (
              <button
                data-testid="sync-regulators-btn"
                onClick={() => {
                  const v = config.regulatorVoltages[0] || 14.2;
                  updateConfig('regulatorVoltages', config.regulatorVoltages.map(() => v));
                }}
                className="font-mono text-[8px] uppercase tracking-wider px-2 py-0.5 border border-cyan-400/30 text-cyan-400 rounded hover:bg-cyan-400/10 transition-colors"
              >
                Sync All
              </button>
            )}
          </div>
          {(config.regulatorVoltages || [14.2]).map((voltage, idx) => {
            const regNum = idx + 1;
            const altsPerReg = 3;
            const startAlt = idx * altsPerReg + 1;
            const endAlt = Math.min(startAlt + altsPerReg - 1, config.alternatorCount);
            return (
              <div key={idx} className="bg-void/50 border border-white/5 rounded p-2">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-[8px] text-slate-600">
                    REG {regNum} <span className="text-slate-700">(Alt {startAlt}{endAlt > startAlt ? `-${endAlt}` : ''})</span>
                  </span>
                  <span className="font-mono text-[10px] text-cyan-400" data-testid={`reg-voltage-${idx}`}>
                    {voltage.toFixed(1)}V
                  </span>
                </div>
                <input
                  type="range"
                  min="13.0"
                  max="20.0"
                  step="0.1"
                  value={voltage}
                  onChange={e => {
                    const newV = parseFloat(e.target.value);
                    const regs = [...(config.regulatorVoltages || [14.2])];
                    regs[idx] = newV;
                    updateConfig('regulatorVoltages', regs);
                  }}
                  className="w-full h-1 appearance-none bg-slate-800 rounded-full cursor-pointer accent-cyan-400"
                  data-testid={`reg-slider-${idx}`}
                />
                <div className="flex justify-between font-mono text-[7px] text-slate-700 mt-0.5">
                  <span>13.0V</span>
                  <span>20.0V</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Separator */}
      <div className="border-t border-white/5 my-4" />

      {/* Key Button */}
      <div className="flex-1 flex items-center justify-center">
        <KeyButton />
      </div>

      {/* Save Config */}
      <div className="border-t border-white/5 pt-4 mt-4 pb-16 sm:pb-12">
        <Label className="font-chakra text-[10px] uppercase tracking-[0.2em] text-slate-600 mb-2 block">Save Configuration</Label>
        <div className="flex gap-2">
          <Input
            data-testid="save-config-name"
            value={saveName}
            onChange={e => setSaveName(e.target.value)}
            placeholder="Config name..."
            className="bg-void border-white/10 text-white font-mono text-xs h-8 flex-1 placeholder:text-slate-700"
          />
          <Button
            data-testid="save-config-btn"
            onClick={handleSave}
            disabled={saving}
            size="sm"
            className="bg-cyan-400/10 border border-cyan-400/30 text-cyan-400 hover:bg-cyan-400/20 h-8 relative z-50"
          >
            <Save className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
