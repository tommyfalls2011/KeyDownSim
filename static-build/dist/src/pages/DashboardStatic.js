import { useRF } from '@/context/RFContextStatic';
import { getRadiationPattern, getYagiRadiationPattern, VEHICLES, ANTENNA_POSITIONS } from '@/lib/rfEngineStatic';
import Header from '@/components/HeaderStatic';
import EquipmentRackStatic from '@/components/EquipmentRackStatic';
import ControlPanel from '@/components/ControlPanel';
import MetricsPanel from '@/components/MetricsPanel';
import CanvasVisualizer from '@/components/CanvasVisualizer';

export default function DashboardStatic() {
  const { config, keyed, metrics } = useRF();

  const pattern = config.yagiMode
    ? getYagiRadiationPattern(config.vehicle, config.bonding, keyed ? metrics.modulatedWatts : 0, {
        stickType: config.yagiStickType,
        elementHeights: config.yagiElementHeights,
      })
    : getRadiationPattern(config.vehicle, config.bonding, keyed ? metrics.modulatedWatts : 0, config.antenna, config.antennaPosition);
  const vehicle = VEHICLES[config.vehicle] || VEHICLES['suburban'];
  const antennaPos = ANTENNA_POSITIONS[config.antennaPosition] || ANTENNA_POSITIONS['center'];

  return (
    <div className="min-h-screen bg-void text-white">
      <Header />
      <div className="flex">
        {/* Left Panel - Equipment */}
        <div className="w-[380px] border-r border-white/5 bg-panel min-h-[calc(100vh-56px)] overflow-y-auto">
          <EquipmentRackStatic />
        </div>
        
        {/* Center - Visualizer */}
        <div className="flex-1 flex flex-col">
          <CanvasVisualizer 
            pattern={pattern} 
            vehicle={vehicle} 
            antennaPos={antennaPos}
            keyed={keyed}
            power={metrics.modulatedWatts}
            takeoff={metrics.takeoffAngle}
          />
          <MetricsPanel />
        </div>
        
        {/* Right Panel - Controls */}
        <div className="w-[380px] border-l border-white/5 bg-panel min-h-[calc(100vh-56px)] overflow-y-auto">
          <ControlPanel />
        </div>
      </div>
    </div>
  );
}
