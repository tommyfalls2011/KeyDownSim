import { createContext, useContext, useState, useCallback } from 'react';
import { calculateSignalChain, calculateVoltageDrop, calculateSWR, calculateTakeoffAngle, checkUnderDriven } from '@/lib/rfEngine';
import { useMic } from '@/lib/useMic';

const RFContext = createContext(null);

const DEFAULT_STATE = {
  radio: 'cobra-29',
  driverAmp: 'none',
  finalAmp: 'none',
  antenna: 'whip-102',
  antennaPosition: 'center',
  vehicle: 'suburban',
  bonding: true,
  alternatorCount: 1,
  alternatorAmps: 130,
  batteryType: 'lead',
  batteryCount: 1,
  keyed: false,
};

export function RFProvider({ children }) {
  const [config, setConfig] = useState(DEFAULT_STATE);
  const [keyed, setKeyed] = useState(false);
  const { micEnabled, micLevel, toggleMic } = useMic();

  const updateConfig = useCallback((key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  }, []);

  const loadConfig = useCallback((cfg) => {
    setConfig({
      radio: cfg.radio || 'cobra-29',
      driverAmp: cfg.driver_amp || 'none',
      finalAmp: cfg.final_amp || 'none',
      antenna: cfg.antenna || 'whip-102',
      antennaPosition: cfg.antenna_position || 'center',
      vehicle: cfg.vehicle || 'suburban',
      bonding: cfg.bonding !== false,
      alternatorCount: cfg.alternator_count || 1,
      alternatorAmps: cfg.alternator_amps || 130,
      batteryType: cfg.battery_type || 'lead',
      batteryCount: cfg.battery_count || 1,
      keyed: false,
    });
  }, []);

  // Calculate derived values
  const chain = calculateSignalChain(config.radio, config.driverAmp, config.finalAmp, config.bonding, config.antennaPosition);
  const voltage = calculateVoltageDrop(config.driverAmp, config.finalAmp, config.alternatorCount, config.alternatorAmps, config.batteryType, config.batteryCount);
  const swr = calculateSWR(config.antenna, config.vehicle, config.bonding);
  const takeoff = calculateTakeoffAngle(config.vehicle, config.bonding);
  const underDriven = checkUnderDriven(config.radio, config.driverAmp, config.finalAmp, config.bonding);

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
    alternatorCapacity: voltage.alternatorCapacity,
    bankProvides: voltage.bankProvides,
    altProvides: voltage.altProvides,
    holdTimeSec: voltage.holdTimeSec,
    bankAh: voltage.bankAh,
    swr: swr,
    takeoffAngle: takeoff,
    underDriven: underDriven.isUnderDriven,
    driveRatio: underDriven.driveRatio,
    driveWatts: underDriven.driveWatts,
    finalCapacity: underDriven.finalCapacity,
    idealDrive: underDriven.idealDrive,
  };

  return (
    <RFContext.Provider value={{ config, keyed, setKeyed, updateConfig, loadConfig, metrics }}>
      {children}
    </RFContext.Provider>
  );
}

export const useRF = () => useContext(RFContext);
