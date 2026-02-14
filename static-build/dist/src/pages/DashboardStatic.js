import Header from '@/components/HeaderStatic';
import EquipmentRackStatic from '@/components/EquipmentRackStatic';
import ControlPanel from '@/components/ControlPanel';
import MetricsPanel from '@/components/MetricsPanel';
import CanvasVisualizer from '@/components/CanvasVisualizer';

export default function DashboardStatic() {
  return (
    <div className="h-screen flex flex-col bg-void overflow-hidden" data-testid="dashboard-page">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Equipment */}
        <div className="w-[380px] shrink-0 border-r border-white/5 bg-panel overflow-y-auto">
          <EquipmentRackStatic />
        </div>
        
        {/* Center - Visualizer */}
        <div className="flex-1 flex flex-col bg-void relative">
          <div className="flex-1 relative" data-testid="visualizer-area">
            <CanvasVisualizer />
          </div>
          <div className="h-28 border-t border-white/5 bg-surface shrink-0" data-testid="metrics-area">
            <MetricsPanel />
          </div>
        </div>
        
        {/* Right Panel - Controls */}
        <div className="w-[380px] shrink-0 border-l border-white/5 bg-panel overflow-y-auto">
          <ControlPanel />
        </div>
      </div>
    </div>
  );
}
