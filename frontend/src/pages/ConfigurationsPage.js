import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Trash2, ArrowLeft, Radio, Loader2 } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ConfigurationsPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchConfigs = async () => {
    try {
      const res = await axios.get(`${API}/configurations`, { headers: { Authorization: `Bearer ${token}` } });
      setConfigs(res.data);
    } catch (err) {
      toast.error('Failed to load configurations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchConfigs(); }, []); // eslint-disable-line

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/configurations/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setConfigs(prev => prev.filter(c => c.id !== id));
      toast.success('Configuration deleted');
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const handleLoad = (cfg) => {
    // Store config in sessionStorage and navigate to dashboard
    sessionStorage.setItem('loadConfig', JSON.stringify(cfg));
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-void" data-testid="configurations-page">
      <header className="h-12 bg-surface border-b border-white/5 flex items-center px-4">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-slate-500 hover:text-cyan-400 transition-colors" data-testid="back-to-dashboard-btn">
          <ArrowLeft className="w-4 h-4" />
          <span className="font-chakra text-xs uppercase tracking-wider">Dashboard</span>
        </button>
        <div className="ml-4 font-chakra font-bold text-sm text-white uppercase tracking-widest">
          Saved Configs
        </div>
      </header>

      <div className="max-w-3xl mx-auto p-6">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-cyan-400 animate-spin" /></div>
        ) : configs.length === 0 ? (
          <div className="text-center py-12">
            <Radio className="w-10 h-10 text-slate-700 mx-auto mb-3" />
            <p className="font-exo text-slate-600 text-sm">No saved configurations yet.</p>
            <p className="font-exo text-slate-700 text-xs mt-1">Build your rig on the dashboard and save it.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {configs.map(cfg => (
              <div key={cfg.id} className="bg-panel border border-white/5 p-4 flex items-center justify-between group hover:border-cyan-400/20 transition-colors" data-testid={`config-item-${cfg.id}`}>
                <div className="flex-1 cursor-pointer" onClick={() => handleLoad(cfg)}>
                  <div className="font-chakra font-bold text-sm text-white uppercase tracking-wider">{cfg.name}</div>
                  <div className="font-mono text-[10px] text-slate-600 mt-1 flex gap-4">
                    <span>Radio: {cfg.radio}</span>
                    <span>Driver: {cfg.driver_transistor !== 'none' ? `${cfg.driver_box_size}x ${cfg.driver_transistor}` : 'None'}</span>
                    <span>Final: {cfg.final_transistor !== 'none' ? `${cfg.final_box_size}x ${cfg.final_transistor}` : 'None'}</span>
                    <span>Vehicle: {cfg.vehicle}</span>
                  </div>
                  <div className="font-mono text-[9px] text-slate-700 mt-1">
                    {new Date(cfg.created_at).toLocaleDateString()}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(cfg.id)}
                  className="text-slate-600 hover:text-hot opacity-0 group-hover:opacity-100 transition-opacity"
                  data-testid={`delete-config-${cfg.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
