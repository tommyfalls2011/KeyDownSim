import { useRF } from '@/context/RFContextStatic';
import { getRadiationPattern, VEHICLES, ANTENNA_POSITIONS } from '@/lib/rfEngineStatic';
import Header from '@/components/HeaderStatic';
import EquipmentRackStatic from '@/components/EquipmentRackStatic';
import ControlPanel from '@/components/ControlPanel';
import MetricsPanel from '@/components/MetricsPanel';
import CanvasVisualizer from '@/components/CanvasVisualizer';

export default function DashboardStatic() {
  const { config, keyed, metrics, micEnabled, toggleMic } = useRF();

  const pattern = getRadiationPattern(config.vehicle, config.bonding, keyed ? metrics.modulatedWatts : 0, config.antenna, config.antennaPosition);
  const vehicle = VEHICLES[config.vehicle] || VEHICLES['suburban'];
  const antennaPos = ANTENNA_POSITIONS[config.antennaPosition] || ANTENNA_POSITIONS['center'];

  return (
    <div className="min-h-screen flex flex-col bg-void">
      <Header />
      
      {/* 3-Panel Layout */}
      <div className="flex-1 grid grid-cols-12">
        {/* Left Panel - Equipment */}
        <div className="col-span-3 border-r border-white/5 bg-panel overflow-y-auto max-h-[calc(100vh-56px)]">
          <EquipmentRackStatic />
        </div>
        
        {/* Center - Visualizer */}
        <div className="col-span-6 flex flex-col bg-void relative min-h-[calc(100vh-56px)]">
          <div className="flex-1 relative min-h-[400px]">
            <CanvasVisualizer 
              pattern={pattern} 
              vehicle={vehicle} 
              antennaPos={antennaPos}
              keyed={keyed}
              power={metrics.modulatedWatts}
              takeoff={metrics.takeoffAngle}
            />
          </div>
          <div className="h-28 border-t border-white/5 bg-surface shrink-0">
            <MetricsPanel />
          </div>
        </div>
        
        {/* Right Panel - Controls */}
        <div className="col-span-3 border-l border-white/5 bg-panel overflow-y-auto max-h-[calc(100vh-56px)]">
          <ControlPanel />
        </div>
      </div>
    </div>
  );
}
