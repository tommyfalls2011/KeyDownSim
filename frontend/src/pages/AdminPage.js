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
  const [newFields, setNewFields] = useState('{}');

  const fetchEquipment = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/admin/equipment`, { headers: { Authorization: `Bearer ${token}` } });
      setEquipment(res.data);
    } catch { toast.error('Failed to load equipment'); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchEquipment(); }, [fetchEquipment]);

  const addEquipment = async () => {
    try {
      let data = JSON.parse(newFields);
      data.name = newName;
      await axios.post(`${API}/admin/equipment`, {
        key: newKey, category: newCategory, data
      }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Equipment added');
      setAddOpen(false);
      setNewKey(''); setNewName(''); setNewFields('{}');
      fetchEquipment();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid JSON or add failed');
    }
  };

  const updateEquipment = async () => {
    if (!editItem) return;
    try {
      const data = JSON.parse(newFields);
      await axios.put(`${API}/admin/equipment/${editItem.category}/${editItem.key}`, data, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      toast.success('Equipment updated');
      setEditOpen(false);
      setEditItem(null);
      fetchEquipment();
    } catch (err) {
      toast.error('Update failed — check JSON format');
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
    setNewFields(JSON.stringify(item.data, null, 2));
    setEditOpen(true);
  };

  const categories = ['radios', 'driver_amps', 'final_amps', 'antennas', 'vehicles'];

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-cyan-400 animate-spin" /></div>;

  return (
    <div data-testid="admin-equipment-tab">
      <div className="flex justify-between items-center mb-4">
        <span className="font-mono text-xs text-slate-600">{equipment.length} items</span>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-cyan-400/10 border border-cyan-400/30 text-cyan-400 hover:bg-cyan-400/20 font-chakra text-xs uppercase" data-testid="add-equipment-btn">
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Equipment
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-panel border-white/10 max-w-md">
            <DialogHeader><DialogTitle className="font-chakra text-white uppercase tracking-wider">Add Equipment</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="font-chakra text-[10px] uppercase tracking-[0.2em] text-slate-600 mb-1 block">Category</Label>
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger className="bg-void border-white/10 text-white font-mono text-xs h-8" data-testid="eq-category-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-panel border-white/10">
                    {categories.map(c => <SelectItem key={c} value={c} className="font-mono text-xs text-slate-300">{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="font-chakra text-[10px] uppercase tracking-[0.2em] text-slate-600 mb-1 block">Key (unique ID)</Label>
                <Input value={newKey} onChange={e => setNewKey(e.target.value)} placeholder="e.g. my-radio" className="bg-void border-white/10 text-white font-mono text-xs h-8" data-testid="eq-key-input" />
              </div>
              <div>
                <Label className="font-chakra text-[10px] uppercase tracking-[0.2em] text-slate-600 mb-1 block">Name</Label>
                <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Display name" className="bg-void border-white/10 text-white font-mono text-xs h-8" data-testid="eq-name-input" />
              </div>
              <div>
                <Label className="font-chakra text-[10px] uppercase tracking-[0.2em] text-slate-600 mb-1 block">Data (JSON)</Label>
                <textarea
                  value={newFields}
                  onChange={e => setNewFields(e.target.value)}
                  rows={4}
                  className="w-full bg-void border border-white/10 text-cyan-400 font-mono text-xs p-2 rounded resize-none focus:outline-none focus:border-cyan-400/50"
                  data-testid="eq-data-input"
                />
              </div>
              <Button onClick={addEquipment} className="w-full bg-cyan-400 text-black font-chakra uppercase tracking-wider text-xs" data-testid="eq-submit-add">Add</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-panel border-white/10 max-w-md">
          <DialogHeader><DialogTitle className="font-chakra text-white uppercase tracking-wider">Edit: {editItem?.key}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="font-chakra text-[10px] uppercase tracking-[0.2em] text-slate-600 mb-1 block">Data (JSON)</Label>
              <textarea
                value={newFields}
                onChange={e => setNewFields(e.target.value)}
                rows={8}
                className="w-full bg-void border border-white/10 text-cyan-400 font-mono text-xs p-2 rounded resize-none focus:outline-none focus:border-cyan-400/50"
                data-testid="eq-edit-data"
              />
            </div>
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
                    <div>
                      <span className="font-mono text-xs text-white">{item.data?.name || item.key}</span>
                      <span className="font-mono text-[9px] text-slate-700 ml-3">{item.key}</span>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(item)} className="text-slate-500 hover:text-cyan-400 h-7 w-7 p-0">
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
          </TabsList>

          <div className="mt-4">
            <TabsContent value="users"><UsersTab token={token} adminRole={user?.role} /></TabsContent>
            <TabsContent value="configs"><ConfigsTab token={token} /></TabsContent>
            <TabsContent value="equipment"><EquipmentTab token={token} /></TabsContent>
            <TabsContent value="payments"><PaymentsTab token={token} /></TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
