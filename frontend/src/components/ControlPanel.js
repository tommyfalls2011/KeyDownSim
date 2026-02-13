import { useRF } from '@/context/RFContext';
import { VEHICLES, ANTENNA_POSITIONS } from '@/lib/rfEngine';
import KeyButton from '@/components/KeyButton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save } from 'lucide-react';
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
      </div>

      {/* Antenna Position */}
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
      </div>

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
                  max="16.5"
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
                  <span>16.5V</span>
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
