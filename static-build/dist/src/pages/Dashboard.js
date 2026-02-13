import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useRF } from '@/context/RFContext';
import EquipmentRack from '@/components/EquipmentRack';
import CanvasVisualizer from '@/components/CanvasVisualizer';
import ControlPanel from '@/components/ControlPanel';
import MetricsPanel from '@/components/MetricsPanel';
import { LogOut, Save, Settings, CreditCard, ShieldCheck, Radio, Sliders, Eye, Menu } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const { user, logout, isAdmin } = useAuth();
  const { keyed, loadConfig } = useRF();
  const navigate = useNavigate();
  const [mobileTab, setMobileTab] = useState('viz');

  useEffect(() => {
    const stored = sessionStorage.getItem('loadConfig');
    if (stored) {
      try { loadConfig(JSON.parse(stored)); } catch {}
      sessionStorage.removeItem('loadConfig');
    }
  }, [loadConfig]);

  return (
    <div className="h-screen flex flex-col bg-void overflow-hidden" data-testid="dashboard-page">
      {/* Top Bar */}
      <header className="h-11 sm:h-12 bg-surface border-b border-white/5 flex items-center justify-between px-2 sm:px-4 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="font-chakra font-bold text-xs sm:text-sm text-white uppercase tracking-widest">
            KEY<span className="text-cyan-400">DOWN</span>
          </div>
          <span className="font-mono text-[8px] sm:text-[10px] text-slate-600 uppercase hidden sm:inline">RF Visualizer v1.0</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <Link to="/configurations" data-testid="nav-configs-btn">
            <Button variant="ghost" size="sm" className="text-slate-500 hover:text-cyan-400 font-chakra text-[10px] sm:text-xs uppercase tracking-wider px-1.5 sm:px-3">
              <Save className="w-3.5 h-3.5 sm:mr-1.5" /> <span className="hidden sm:inline">Configs</span>
            </Button>
          </Link>
          {isAdmin && (
            <Link to="/admin" data-testid="nav-admin-btn">
              <Button variant="ghost" size="sm" className="text-hot hover:text-hot/80 font-chakra text-[10px] sm:text-xs uppercase tracking-wider px-1.5 sm:px-3">
                <ShieldCheck className="w-3.5 h-3.5 sm:mr-1.5" /> <span className="hidden sm:inline">Admin</span>
              </Button>
            </Link>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-slate-500 hover:text-cyan-400 font-chakra text-[10px] sm:text-xs uppercase tracking-wider px-1.5 sm:px-3" data-testid="user-menu-btn">
                <Menu className="w-3.5 h-3.5 sm:hidden" />
                <Settings className="w-3.5 h-3.5 mr-1.5 hidden sm:block" />
                <span className="hidden sm:inline">{user?.name || 'Operator'}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-panel border-white/10">
              <DropdownMenuItem onClick={() => navigate('/subscription')} className="font-exo text-sm text-slate-300 hover:text-cyan-400 cursor-pointer" data-testid="menu-subscription">
                <CreditCard className="w-4 h-4 mr-2" /> Subscription
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { logout(); navigate('/'); }} className="font-exo text-sm text-slate-300 hover:text-hot cursor-pointer" data-testid="menu-logout">
                <LogOut className="w-4 h-4 mr-2" /> Log Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Desktop: 3-Panel Layout */}
      <div className="flex-1 hidden md:grid grid-cols-12 overflow-hidden">
        <div className="col-span-3 border-r border-white/5 bg-panel overflow-y-auto" data-testid="equipment-rack-panel">
          <EquipmentRack />
        </div>
        <div className="col-span-6 flex flex-col bg-void relative">
          <div className="flex-1 relative" data-testid="visualizer-area">
            <CanvasVisualizer />
          </div>
          <div className="h-28 border-t border-white/5 bg-surface shrink-0" data-testid="metrics-area">
            <MetricsPanel />
          </div>
        </div>
        <div className="col-span-3 border-l border-white/5 bg-panel overflow-y-auto" data-testid="control-panel">
          <ControlPanel />
        </div>
      </div>

      {/* Mobile: Tabbed Layout */}
      <div className="flex-1 flex flex-col md:hidden overflow-hidden">
        {/* Mobile content */}
        <div className="flex-1 overflow-y-auto">
          {mobileTab === 'rack' && (
            <div className="bg-panel min-h-full" data-testid="mobile-rack">
              <EquipmentRack />
            </div>
          )}
          {mobileTab === 'viz' && (
            <div className="flex flex-col h-full">
              <div className="flex-1 relative bg-void min-h-[300px]" data-testid="mobile-viz">
                <CanvasVisualizer />
              </div>
              <div className="h-24 border-t border-white/5 bg-surface shrink-0">
                <MetricsPanel />
              </div>
            </div>
          )}
          {mobileTab === 'controls' && (
            <div className="bg-panel min-h-full" data-testid="mobile-controls">
              <ControlPanel />
            </div>
          )}
        </div>

        {/* Mobile Tab Bar */}
        <div className="h-14 bg-surface border-t border-white/5 grid grid-cols-3 shrink-0 mb-8" data-testid="mobile-tab-bar">
          <button
            onClick={() => setMobileTab('rack')}
            className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${mobileTab === 'rack' ? 'text-cyan-400' : 'text-slate-600'}`}
            data-testid="mobile-tab-rack"
          >
            <Radio className="w-5 h-5" />
            <span className="font-chakra text-[9px] uppercase tracking-wider">Rack</span>
          </button>
          <button
            onClick={() => setMobileTab('viz')}
            className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${mobileTab === 'viz' ? 'text-cyan-400' : 'text-slate-600'}`}
            data-testid="mobile-tab-viz"
          >
            <Eye className="w-5 h-5" />
            <span className="font-chakra text-[9px] uppercase tracking-wider">Signal</span>
          </button>
          <button
            onClick={() => setMobileTab('controls')}
            className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${mobileTab === 'controls' ? 'text-cyan-400' : 'text-slate-600'}`}
            data-testid="mobile-tab-controls"
          >
            <Sliders className="w-5 h-5" />
            <span className="font-chakra text-[9px] uppercase tracking-wider">Controls</span>
          </button>
        </div>
      </div>
    </div>
  );
}
