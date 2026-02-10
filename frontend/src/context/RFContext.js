import { createContext, useContext, useState, useCallback } from 'react';
import { calculateSignalChain, calculateVoltageDrop, calculateSWR, calculateTakeoffAngle } from '@/lib/rfEngine';

const RFContext = createContext(null);

const DEFAULT_STATE = {
  radio: 'cobra-29',
  driverAmp: 'none',
  finalAmp: 'none',
  antenna: 'whip-102',
  vehicle: 'suburban',
  bonding: true,
  extraAlternators: false,
  keyed: false,
};

export function RFProvider({ children }) {
  const [config, setConfig] = useState(DEFAULT_STATE);
  const [keyed, setKeyed] = useState(false);

  const updateConfig = useCallback((key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  }, []);

  const loadConfig = useCallback((cfg) => {
    setConfig({
      radio: cfg.radio || 'cobra-29',
      driverAmp: cfg.driver_amp || 'none',
      finalAmp: cfg.final_amp || 'none',
      antenna: cfg.antenna || 'whip-102',
      vehicle: cfg.vehicle || 'suburban',
      bonding: cfg.bonding !== false,
      extraAlternators: cfg.extra_alternators || false,
      keyed: false,
    });
  }, []);

  // Calculate derived values
  const chain = calculateSignalChain(config.radio, config.driverAmp, config.finalAmp, config.bonding);
  const voltage = calculateVoltageDrop(config.driverAmp, config.finalAmp, config.extraAlternators);
  const swr = calculateSWR(config.antenna, config.bonding);
  const takeoff = calculateTakeoffAngle(config.vehicle, config.bonding);

  // Apply voltage overload power reduction
  let effectivePower = chain;
  if (voltage.overloaded) {
    const reduction = Math.max(0.3, voltage.effectiveVoltage / 14.2);
    effectivePower = {
      deadKey: chain.deadKey * reduction,
      peakKey: chain.peakKey * reduction,
    };
  }

  const metrics = {
    deadKeyWatts: Math.round(effectivePower.deadKey * 10) / 10,
    peakWatts: Math.round(effectivePower.peakKey * 10) / 10,
    voltage: voltage.effectiveVoltage,
    voltageDrop: voltage.voltageDrop,
    overloaded: voltage.overloaded,
    currentDraw: voltage.currentDraw,
    swr: swr,
    takeoffAngle: takeoff,
  };

  return (
    <RFContext.Provider value={{ config, keyed, setKeyed, updateConfig, loadConfig, metrics }}>
      {children}
    </RFContext.Provider>
  );
}

export const useRF = () => useContext(RFContext);
