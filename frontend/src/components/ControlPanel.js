import { useRF } from '@/context/RFContext';
import { VEHICLES } from '@/lib/rfEngine';
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
        vehicle: config.vehicle,
        bonding: config.bonding,
        extra_alternators: config.extraAlternators,
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

      {/* Toggles */}
      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <Label className="font-chakra text-[10px] uppercase tracking-[0.2em] text-slate-600">Bonding</Label>
          <Switch
            data-testid="bonding-toggle"
            checked={config.bonding}
            onCheckedChange={v => updateConfig('bonding', v)}
            className="data-[state=checked]:bg-cyan-400"
          />
        </div>
        <div className="flex items-center justify-between">
          <Label className="font-chakra text-[10px] uppercase tracking-[0.2em] text-slate-600">Extra Alternators</Label>
          <Switch
            data-testid="alternator-toggle"
            checked={config.extraAlternators}
            onCheckedChange={v => updateConfig('extraAlternators', v)}
            className="data-[state=checked]:bg-cyan-400"
          />
        </div>
      </div>

      {/* Separator */}
      <div className="border-t border-white/5 my-4" />

      {/* Key Button */}
      <div className="flex-1 flex items-center justify-center">
        <KeyButton />
      </div>

      {/* Save Config */}
      <div className="border-t border-white/5 pt-4 mt-4 pb-12">
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
