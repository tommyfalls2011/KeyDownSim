import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  ArrowLeft, Users, Settings, CreditCard, Radio, Trash2, Plus,
  ShieldCheck, ShieldAlert, User, Loader2, RefreshCw, Pencil, DollarSign,
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// ─── Stats Overview ───
function StatsPanel({ stats }) {
  const cards = [
    { label: 'Total Users', value: stats.total_users, color: 'text-cyan-400' },
    { label: 'Active Subs', value: stats.active_subscriptions, color: 'text-green-400' },
    { label: 'Configurations', value: stats.total_configurations, color: 'text-white' },
    { label: 'Payments', value: stats.total_payments, color: 'text-warn' },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6" data-testid="admin-stats">
      {cards.map(c => (
        <div key={c.label} className="bg-panel border border-white/5 p-4">
          <div className="font-chakra text-[9px] uppercase tracking-[0.2em] text-slate-600">{c.label}</div>
          <div className={`font-mono text-2xl ${c.color} mt-1`}>{c.value ?? '—'}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Users Tab ───
function UsersTab({ token, adminRole }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/admin/users`, { headers: { Authorization: `Bearer ${token}` } });
      setUsers(res.data);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const updateUser = async (userId, update) => {
    try {
      await axios.patch(`${API}/admin/users/${userId}`, update, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('User updated');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Update failed');
    }
  };

  const roleIcon = (role) => {
    if (role === 'admin') return <ShieldCheck className="w-3.5 h-3.5 text-hot" />;
    if (role === 'subadmin') return <ShieldAlert className="w-3.5 h-3.5 text-warn" />;
    return <User className="w-3.5 h-3.5 text-slate-500" />;
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-cyan-400 animate-spin" /></div>;

  return (
    <ScrollArea className="h-[calc(100vh-220px)]">
      <div className="space-y-2" data-testid="admin-users-list">
        {users.map(u => (
          <div key={u.id} className="bg-panel border border-white/5 p-4 flex items-center gap-4 group hover:border-white/10 transition-colors" data-testid={`admin-user-${u.id}`}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {roleIcon(u.role)}
                <span className="font-chakra text-sm text-white truncate">{u.name || u.email}</span>
                {!u.active && <Badge variant="destructive" className="text-[9px]">DISABLED</Badge>}
              </div>
              <div className="font-mono text-[10px] text-slate-600 mt-1 truncate">{u.email}</div>
              <div className="flex gap-3 mt-1 font-mono text-[9px] text-slate-700">
                <span>Role: <span className="text-slate-400">{u.role || 'user'}</span></span>
                <span>Sub: <span className={u.subscription_status === 'active' ? 'text-green-400' : 'text-slate-500'}>{u.subscription_status}</span></span>
                {u.subscription_plan && <span>Plan: <span className="text-cyan-400">{u.subscription_plan}</span></span>}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              {/* Role selector */}
              <Select value={u.role || 'user'} onValueChange={v => updateUser(u.id, { role: v })}>
                <SelectTrigger className="bg-void border-white/10 text-white font-mono text-[10px] h-7 w-24" data-testid={`role-select-${u.id}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-panel border-white/10">
                  <SelectItem value="user" className="font-mono text-xs text-slate-300">User</SelectItem>
                  <SelectItem value="subadmin" className="font-mono text-xs text-slate-300">Subadmin</SelectItem>
                  {adminRole === 'admin' && <SelectItem value="admin" className="font-mono text-xs text-slate-300">Admin</SelectItem>}
                </SelectContent>
              </Select>
              {/* Grant/Revoke Sub */}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => updateUser(u.id, {
                  subscription_status: u.subscription_status === 'active' ? 'free' : 'active',
                  subscription_plan: u.subscription_status === 'active' ? null : 'monthly',
                })}
                className={`font-mono text-[10px] h-7 ${u.subscription_status === 'active' ? 'text-hot hover:text-hot/80' : 'text-green-400 hover:text-green-300'}`}
                data-testid={`sub-toggle-${u.id}`}
              >
                {u.subscription_status === 'active' ? 'Revoke' : 'Grant Sub'}
              </Button>
              {/* Active toggle */}
              <Switch
                checked={u.active !== false}
                onCheckedChange={v => updateUser(u.id, { active: v })}
                className="data-[state=checked]:bg-green-500 scale-75"
                data-testid={`active-toggle-${u.id}`}
              />
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

// ─── Configurations Tab ───
function ConfigsTab({ token }) {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/admin/configurations`, { headers: { Authorization: `Bearer ${token}` } });
      setConfigs(res.data);
    } catch { toast.error('Failed to load configs'); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchConfigs(); }, [fetchConfigs]);

  const deleteConfig = async (id) => {
    try {
      await axios.delete(`${API}/admin/configurations/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setConfigs(prev => prev.filter(c => c.id !== id));
      toast.success('Config deleted');
    } catch { toast.error('Delete failed'); }
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-cyan-400 animate-spin" /></div>;

  return (
    <ScrollArea className="h-[calc(100vh-220px)]">
      <div className="space-y-2" data-testid="admin-configs-list">
        {configs.length === 0 && <p className="font-exo text-slate-600 text-sm text-center py-8">No configurations found.</p>}
        {configs.map(cfg => (
          <div key={cfg.id} className="bg-panel border border-white/5 p-3 flex items-center justify-between group hover:border-white/10 transition-colors" data-testid={`admin-config-${cfg.id}`}>
            <div>
              <div className="font-chakra text-sm text-white">{cfg.name}</div>
              <div className="font-mono text-[9px] text-slate-600 mt-1 flex flex-wrap gap-x-4">
                <span>User: {cfg.user_id?.substring(0, 8)}...</span>
                <span>Radio: {cfg.radio}</span>
                <span>Driver: {cfg.driver_amp}</span>
                <span>Final: {cfg.final_amp}</span>
                <span>Vehicle: {cfg.vehicle}</span>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => deleteConfig(cfg.id)} className="text-slate-600 hover:text-hot opacity-0 group-hover:opacity-100" data-testid={`admin-del-cfg-${cfg.id}`}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

// ─── Category-specific form fields ───
const CATEGORY_FIELDS = {
  radios: [
    { key: 'dead_key', label: 'Dead Key (watts)', type: 'number', placeholder: '5' },
    { key: 'peak_key', label: 'Peak Key (watts)', type: 'number', placeholder: '15' },
    { key: 'type', label: 'Modulation Type', type: 'select', options: ['AM', 'AM/SSB', 'SSB', 'FM'] },
    { key: 'impedance', label: 'Impedance (ohms)', type: 'number', placeholder: '50' },
  ],
  driver_amps: [
    { key: 'gain_db', label: 'Gain (dB)', type: 'number', placeholder: '17' },
    { key: 'transistors', label: 'Transistor Count', type: 'number', placeholder: '2' },
    { key: 'current_draw', label: 'Current Draw (amps)', type: 'number', placeholder: '50' },
    { key: 'watts_per_pill', label: 'Watts per Pill', type: 'number', placeholder: '275' },
    { key: 'combining_stages', label: 'Combining Stages', type: 'number', placeholder: '0' },
  ],
  final_amps: [
    { key: 'gain_db', label: 'Gain (dB)', type: 'number', placeholder: '10' },
    { key: 'transistors', label: 'Transistor Count', type: 'number', placeholder: '4' },
    { key: 'current_draw', label: 'Current Draw (amps)', type: 'number', placeholder: '100' },
    { key: 'watts_per_pill', label: 'Watts per Pill', type: 'number', placeholder: '275' },
    { key: 'combining_stages', label: 'Combining Stages', type: 'number', placeholder: '1' },
  ],
  antennas: [
    { key: 'gain_dbi', label: 'Gain (dBi)', type: 'number', placeholder: '3', step: '0.1' },
    { key: 'type', label: 'Antenna Type', type: 'select', options: ['vertical', 'mag-mount', 'base-load', 'dipole', 'beam'] },
  ],
  vehicles: [
    { key: 'ground_plane', label: 'Ground Plane (0-1)', type: 'number', placeholder: '0.85', step: '0.05' },
    { key: 'directional', label: 'Directional Bias (0-1)', type: 'number', placeholder: '0.15', step: '0.05' },
    { key: 'takeoff', label: 'Take-off Angle (deg)', type: 'number', placeholder: '25' },
    { key: 'shape', label: 'Shape', type: 'select', options: ['suv', 'truck', 'van', 'wagon'] },
  ],
};

function EquipmentForm({ category, values, onChange }) {
  const fields = CATEGORY_FIELDS[category] || [];
  return (
    <div className="space-y-3">
      {fields.map(f => (
        <div key={f.key}>
          <Label className="font-chakra text-[10px] uppercase tracking-[0.2em] text-slate-600 mb-1 block">{f.label}</Label>
          {f.type === 'select' ? (
            <Select value={values[f.key] || ''} onValueChange={v => onChange(f.key, v)}>
              <SelectTrigger className="bg-void border-white/10 text-white font-mono text-xs h-8" data-testid={`eq-field-${f.key}`}>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent className="bg-panel border-white/10">
                {f.options.map(o => <SelectItem key={o} value={o} className="font-mono text-xs text-slate-300">{o}</SelectItem>)}
              </SelectContent>
            </Select>
          ) : (
            <Input
              type={f.type}
              step={f.step || (f.type === 'number' ? '1' : undefined)}
              value={values[f.key] ?? ''}
              onChange={e => onChange(f.key, f.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)}
              placeholder={f.placeholder}
              className="bg-void border-white/10 text-white font-mono text-xs h-8"
              data-testid={`eq-field-${f.key}`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Equipment Tab ───
function EquipmentTab({ token }) {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [newCategory, setNewCategory] = useState('radios');
  const [newKey, setNewKey] = useState('');
  const [newName, setNewName] = useState('');
  const [formValues, setFormValues] = useState({});

  const fetchEquipment = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/admin/equipment`, { headers: { Authorization: `Bearer ${token}` } });
      setEquipment(res.data);
    } catch { toast.error('Failed to load equipment'); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchEquipment(); }, [fetchEquipment]);

  const updateField = (key, value) => {
    setFormValues(prev => ({ ...prev, [key]: value }));
  };

  const resetForm = () => {
    setNewKey('');
    setNewName('');
    setFormValues({});
  };

  const addEquipment = async () => {
    if (!newKey.trim()) { toast.error('Enter a unique key/ID'); return; }
    if (!newName.trim()) { toast.error('Enter a display name'); return; }
    try {
      const data = { ...formValues, name: newName };
      await axios.post(`${API}/admin/equipment`, {
        key: newKey.trim().toLowerCase().replace(/\s+/g, '-'),
        category: newCategory,
        data,
      }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Equipment added');
      setAddOpen(false);
      resetForm();
      fetchEquipment();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add equipment');
    }
  };

  const updateEquipment = async () => {
    if (!editItem) return;
    try {
      const data = { ...formValues };
      await axios.put(`${API}/admin/equipment/${editItem.category}/${editItem.key}`, data, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      toast.success('Equipment updated');
      setEditOpen(false);
      setEditItem(null);
      fetchEquipment();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Update failed');
    }
  };

  const deleteEquipment = async (category, key) => {
    try {
      await axios.delete(`${API}/admin/equipment/${category}/${key}`, { headers: { Authorization: `Bearer ${token}` } });
      setEquipment(prev => prev.filter(e => !(e.key === key && e.category === category)));
      toast.success('Equipment deleted');
    } catch { toast.error('Delete failed'); }
  };

  const openEdit = (item) => {
    setEditItem(item);
    setFormValues({ ...item.data });
    setNewName(item.data?.name || '');
    setEditOpen(true);
  };

  const openAdd = () => {
    resetForm();
    setAddOpen(true);
  };

  const categories = ['radios', 'driver_amps', 'final_amps', 'antennas', 'vehicles'];

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-cyan-400 animate-spin" /></div>;

  return (
    <div data-testid="admin-equipment-tab">
      <div className="flex justify-between items-center mb-4">
        <span className="font-mono text-xs text-slate-600">{equipment.length} items</span>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openAdd} className="bg-cyan-400/10 border border-cyan-400/30 text-cyan-400 hover:bg-cyan-400/20 font-chakra text-xs uppercase" data-testid="add-equipment-btn">
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Equipment
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-panel border-white/10 max-w-md max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-chakra text-white uppercase tracking-wider">Add Equipment</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="font-chakra text-[10px] uppercase tracking-[0.2em] text-slate-600 mb-1 block">Category</Label>
                <Select value={newCategory} onValueChange={v => { setNewCategory(v); setFormValues({}); }}>
                  <SelectTrigger className="bg-void border-white/10 text-white font-mono text-xs h-8" data-testid="eq-category-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-panel border-white/10">
                    {categories.map(c => <SelectItem key={c} value={c} className="font-mono text-xs text-slate-300">{c.replace('_', ' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="font-chakra text-[10px] uppercase tracking-[0.2em] text-slate-600 mb-1 block">Key (unique ID)</Label>
                <Input value={newKey} onChange={e => setNewKey(e.target.value)} placeholder="e.g. my-radio-500" className="bg-void border-white/10 text-white font-mono text-xs h-8" data-testid="eq-key-input" />
              </div>
              <div>
                <Label className="font-chakra text-[10px] uppercase tracking-[0.2em] text-slate-600 mb-1 block">Display Name</Label>
                <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Galaxy DX 2547" className="bg-void border-white/10 text-white font-mono text-xs h-8" data-testid="eq-name-input" />
              </div>
              <div className="border-t border-white/5 pt-3">
                <div className="font-chakra text-[10px] uppercase tracking-[0.2em] text-cyan-400/60 mb-3">Specifications</div>
                <EquipmentForm category={newCategory} values={formValues} onChange={updateField} />
              </div>
              <Button onClick={addEquipment} className="w-full bg-cyan-400 text-black font-chakra uppercase tracking-wider text-xs" data-testid="eq-submit-add">Add Equipment</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-panel border-white/10 max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-chakra text-white uppercase tracking-wider">Edit: {editItem?.data?.name || editItem?.key}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="font-chakra text-[10px] uppercase tracking-[0.2em] text-slate-600 mb-1 block">Display Name</Label>
              <Input value={newName} onChange={e => { setNewName(e.target.value); updateField('name', e.target.value); }} className="bg-void border-white/10 text-white font-mono text-xs h-8" data-testid="eq-edit-name" />
            </div>
            {editItem && (
              <EquipmentForm category={editItem.category} values={formValues} onChange={updateField} />
            )}
            <Button onClick={updateEquipment} className="w-full bg-cyan-400 text-black font-chakra uppercase tracking-wider text-xs" data-testid="eq-submit-edit">Update</Button>
          </div>
        </DialogContent>
      </Dialog>

      <ScrollArea className="h-[calc(100vh-280px)]">
        {categories.map(cat => {
          const items = equipment.filter(e => e.category === cat);
          if (items.length === 0) return null;
          return (
            <div key={cat} className="mb-4">
              <div className="font-chakra text-[10px] uppercase tracking-[0.25em] text-slate-500 mb-2 px-1">{cat.replace('_', ' ')}</div>
              <div className="space-y-1">
                {items.map(item => (
                  <div key={`${item.category}-${item.key}`} className="bg-surface border border-white/5 p-3 flex items-center justify-between group hover:border-white/10" data-testid={`eq-item-${item.key}`}>
                    <div className="min-w-0">
                      <span className="font-mono text-xs text-white">{item.data?.name || item.key}</span>
                      <span className="font-mono text-[9px] text-slate-700 ml-3">{item.key}</span>
                      <div className="font-mono text-[9px] text-slate-600 mt-1 flex flex-wrap gap-x-3">
                        {Object.entries(item.data || {}).filter(([k]) => k !== 'name').map(([k, v]) => (
                          <span key={k}>{k}: <span className="text-cyan-400/70">{v}</span></span>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(item)} className="text-slate-500 hover:text-cyan-400 h-7 w-7 p-0" data-testid={`eq-edit-${item.key}`}>
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteEquipment(item.category, item.key)} className="text-slate-500 hover:text-hot h-7 w-7 p-0" data-testid={`eq-del-${item.key}`}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </ScrollArea>
    </div>
  );
}

// ─── Payments Tab ───
function PaymentsTab({ token }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API}/admin/payments`, { headers: { Authorization: `Bearer ${token}` } });
        setPayments(res.data);
      } catch { toast.error('Failed to load payments'); }
      finally { setLoading(false); }
    })();
  }, [token]);

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-cyan-400 animate-spin" /></div>;

  return (
    <ScrollArea className="h-[calc(100vh-220px)]">
      <div className="space-y-2" data-testid="admin-payments-list">
        {payments.length === 0 && <p className="font-exo text-slate-600 text-sm text-center py-8">No payment transactions.</p>}
        {payments.map(p => (
          <div key={p.id} className="bg-panel border border-white/5 p-3 flex items-center justify-between" data-testid={`admin-payment-${p.id}`}>
            <div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-mono text-xs text-white">${p.amount}</span>
                <Badge className={`text-[9px] ${p.payment_status === 'paid' ? 'bg-green-900/30 text-green-400 border-green-800' : 'bg-warn/10 text-warn border-warn/30'}`}>
                  {p.payment_status}
                </Badge>
              </div>
              <div className="font-mono text-[9px] text-slate-700 mt-1 flex gap-3">
                <span>User: {p.user_id?.substring(0, 8)}...</span>
                <span>Plan: {p.plan}</span>
                <span>{new Date(p.created_at).toLocaleString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

// ─── Pricing Tab ───
function PricingTab({ token }) {
  const [monthly, setMonthly] = useState('');
  const [yearly, setYearly] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API}/admin/pricing`, { headers: { Authorization: `Bearer ${token}` } });
        setMonthly(String(res.data.monthly?.amount || ''));
        setYearly(String(res.data.yearly?.amount || ''));
      } catch { toast.error('Failed to load pricing'); }
      finally { setLoading(false); }
    })();
  }, [token]);

  const handleSave = async () => {
    const m = parseFloat(monthly);
    const y = parseFloat(yearly);
    if (isNaN(m) || isNaN(y) || m <= 0 || y <= 0) {
      toast.error('Enter valid prices');
      return;
    }
    setSaving(true);
    try {
      await axios.put(`${API}/admin/pricing`, {
        monthly_amount: m,
        yearly_amount: y,
      }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Pricing updated');
    } catch { toast.error('Update failed'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-cyan-400 animate-spin" /></div>;

  return (
    <div className="max-w-md" data-testid="admin-pricing-tab">
      <p className="font-exo text-sm text-slate-500 mb-6">Set subscription prices. Changes apply to new checkouts immediately.</p>
      <div className="space-y-4">
        <div className="bg-panel border border-white/5 p-4">
          <Label className="font-chakra text-[10px] uppercase tracking-[0.2em] text-slate-600 mb-2 block">Monthly Price (USD)</Label>
          <div className="flex items-center gap-2">
            <span className="font-mono text-lg text-slate-500">$</span>
            <Input
              data-testid="pricing-monthly-input"
              type="number"
              step="0.01"
              min="0"
              value={monthly}
              onChange={e => setMonthly(e.target.value)}
              className="bg-void border-white/10 text-white font-mono text-lg h-10"
            />
          </div>
        </div>
        <div className="bg-panel border border-white/5 p-4">
          <Label className="font-chakra text-[10px] uppercase tracking-[0.2em] text-slate-600 mb-2 block">Yearly Price (USD)</Label>
          <div className="flex items-center gap-2">
            <span className="font-mono text-lg text-slate-500">$</span>
            <Input
              data-testid="pricing-yearly-input"
              type="number"
              step="0.01"
              min="0"
              value={yearly}
              onChange={e => setYearly(e.target.value)}
              className="bg-void border-white/10 text-white font-mono text-lg h-10"
            />
          </div>
        </div>
        <Button
          data-testid="pricing-save-btn"
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-cyan-400 text-black font-chakra font-bold uppercase tracking-wider hover:bg-cyan-500 disabled:opacity-50"
        >
          {saving ? 'SAVING...' : 'UPDATE PRICING'}
        </Button>
      </div>
    </div>
  );
}

// ─── Main Admin Page ───
export default function AdminPage() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({});

  const fetchStats = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/admin/stats`, { headers: { Authorization: `Bearer ${token}` } });
      setStats(res.data);
    } catch {}
  }, [token]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  return (
    <div className="min-h-screen bg-void" data-testid="admin-page">
      {/* Header */}
      <header className="h-12 bg-surface border-b border-white/5 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-slate-500 hover:text-cyan-400 transition-colors" data-testid="admin-back-btn">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="font-chakra font-bold text-sm uppercase tracking-widest">
            <span className="text-hot">ADMIN</span> <span className="text-white">PANEL</span>
          </div>
          <Badge className="bg-hot/10 text-hot border-hot/30 text-[9px] font-mono">{user?.role?.toUpperCase()}</Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchStats} className="text-slate-600 hover:text-cyan-400">
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>
      </header>

      {/* Content */}
      <div className="max-w-6xl mx-auto p-6">
        <StatsPanel stats={stats} />

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="bg-surface border border-white/5 w-full justify-start">
            <TabsTrigger value="users" className="font-chakra text-xs uppercase tracking-wider data-[state=active]:bg-cyan-400/10 data-[state=active]:text-cyan-400" data-testid="admin-tab-users">
              <Users className="w-3.5 h-3.5 mr-1.5" /> Users
            </TabsTrigger>
            <TabsTrigger value="configs" className="font-chakra text-xs uppercase tracking-wider data-[state=active]:bg-cyan-400/10 data-[state=active]:text-cyan-400" data-testid="admin-tab-configs">
              <Settings className="w-3.5 h-3.5 mr-1.5" /> Configs
            </TabsTrigger>
            <TabsTrigger value="equipment" className="font-chakra text-xs uppercase tracking-wider data-[state=active]:bg-cyan-400/10 data-[state=active]:text-cyan-400" data-testid="admin-tab-equipment">
              <Radio className="w-3.5 h-3.5 mr-1.5" /> Equipment
            </TabsTrigger>
            <TabsTrigger value="payments" className="font-chakra text-xs uppercase tracking-wider data-[state=active]:bg-cyan-400/10 data-[state=active]:text-cyan-400" data-testid="admin-tab-payments">
              <CreditCard className="w-3.5 h-3.5 mr-1.5" /> Payments
            </TabsTrigger>
            <TabsTrigger value="pricing" className="font-chakra text-xs uppercase tracking-wider data-[state=active]:bg-cyan-400/10 data-[state=active]:text-cyan-400" data-testid="admin-tab-pricing">
              <DollarSign className="w-3.5 h-3.5 mr-1.5" /> Pricing
            </TabsTrigger>
          </TabsList>

          <div className="mt-4">
            <TabsContent value="users"><UsersTab token={token} adminRole={user?.role} /></TabsContent>
            <TabsContent value="configs"><ConfigsTab token={token} /></TabsContent>
            <TabsContent value="equipment"><EquipmentTab token={token} /></TabsContent>
            <TabsContent value="payments"><PaymentsTab token={token} /></TabsContent>
            <TabsContent value="pricing"><PricingTab token={token} /></TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
