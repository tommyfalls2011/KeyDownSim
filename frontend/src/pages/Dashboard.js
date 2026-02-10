import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useRF } from '@/context/RFContext';
import EquipmentRack from '@/components/EquipmentRack';
import CanvasVisualizer from '@/components/CanvasVisualizer';
import ControlPanel from '@/components/ControlPanel';
import MetricsPanel from '@/components/MetricsPanel';
import { LogOut, Save, Settings, CreditCard } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { keyed, loadConfig } = useRF();
  const navigate = useNavigate();

  // Load config from sessionStorage if navigated from Configurations page
  useEffect(() => {
    const stored = sessionStorage.getItem('loadConfig');
    if (stored) {
      try { loadConfig(JSON.parse(stored)); } catch {}
      sessionStorage.removeItem('loadConfig');
    }
  }, [loadConfig]);

  return (
    <div className={`h-screen flex flex-col bg-void overflow-hidden transition-all duration-300 ${keyed ? '' : ''}`} data-testid="dashboard-page">
      {/* Top Bar */}
      <header className="h-12 bg-surface border-b border-white/5 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="font-chakra font-bold text-sm text-white uppercase tracking-widest">
            KEY<span className="text-cyan-400">DOWN</span>
          </div>
          <div className="w-px h-5 bg-white/10" />
          <span className="font-mono text-[10px] text-slate-600 uppercase">RF Visualizer v1.0</span>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/configurations" data-testid="nav-configs-btn">
            <Button variant="ghost" size="sm" className="text-slate-500 hover:text-cyan-400 font-chakra text-xs uppercase tracking-wider">
              <Save className="w-3.5 h-3.5 mr-1.5" /> Configs
            </Button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-slate-500 hover:text-cyan-400 font-chakra text-xs uppercase tracking-wider" data-testid="user-menu-btn">
                <Settings className="w-3.5 h-3.5 mr-1.5" /> {user?.name || 'Operator'}
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

      {/* Main Content - 3 Panel Layout */}
      <div className="flex-1 grid grid-cols-12 overflow-hidden">
        {/* Left: Equipment Rack */}
        <div className="col-span-3 border-r border-white/5 bg-panel overflow-y-auto" data-testid="equipment-rack-panel">
          <EquipmentRack />
        </div>

        {/* Center: Visualizer + Metrics */}
        <div className="col-span-6 flex flex-col bg-void relative">
          <div className="flex-1 relative" data-testid="visualizer-area">
            <CanvasVisualizer />
          </div>
          <div className="h-28 border-t border-white/5 bg-surface shrink-0" data-testid="metrics-area">
            <MetricsPanel />
          </div>
        </div>

        {/* Right: Controls */}
        <div className="col-span-3 border-l border-white/5 bg-panel overflow-y-auto" data-testid="control-panel">
          <ControlPanel />
        </div>
      </div>
    </div>
  );
}
