import { useRF } from '@/context/RFContextStatic';
import { getRadiationPattern, VEHICLES, ANTENNA_POSITIONS } from '@/lib/rfEngineStatic';
import Header from '@/components/HeaderStatic';
import EquipmentRackStatic from '@/components/EquipmentRackStatic';
import ControlPanel from '@/components/ControlPanel';
import MetricsPanel from '@/components/MetricsPanel';
import CanvasVisualizer from '@/components/CanvasVisualizer';

export default function DashboardStatic() {
  const { config, keyed, setKeyed, metrics, micEnabled, toggleMic } = useRF();

  const pattern = getRadiationPattern(config.vehicle, config.bonding, keyed ? metrics.modulatedWatts : 0, config.antenna, config.antennaPosition);
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
          
          {/* Key Down Button */}
          <div className="p-4 border-t border-white/5">
            <button
              onMouseDown={() => setKeyed(true)}
              onMouseUp={() => setKeyed(false)}
              onMouseLeave={() => setKeyed(false)}
              onTouchStart={() => setKeyed(true)}
              onTouchEnd={() => setKeyed(false)}
              className={`w-full py-6 rounded-lg font-chakra text-lg uppercase tracking-[0.3em] transition-all ${
                keyed
                  ? 'bg-hot text-white shadow-[0_0_30px_rgba(255,100,100,0.5)]'
                  : 'bg-void border-2 border-cyan-500/30 text-cyan-400 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(0,255,255,0.2)]'
              }`}
              data-testid="key-down-btn"
            >
              {keyed ? 'TRANSMITTING' : 'KEY DOWN'}
            </button>
            <p className="text-center font-mono text-[9px] text-slate-600 mt-2">
              HOLD TO TRANSMIT
            </p>
          </div>
          
          {/* Mic Toggle */}
          <div className="px-4 pb-4">
            <button
              onClick={toggleMic}
              className={`w-full py-2 rounded font-mono text-xs uppercase tracking-wider transition-all ${
                micEnabled
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-void text-slate-500 border border-white/10 hover:border-white/20'
              }`}
              data-testid="mic-toggle-btn"
            >
              {micEnabled ? '🎤 MIC ON' : '🎤 MIC OFF'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
