// Static RF Context - No backend API calls
// All equipment is hardcoded in rfEngine.js

import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { 
  calculateSignalChain, 
  calculateVoltageDrop, 
  calculateSWR, 
  calculateTakeoffAngle, 
  checkUnderDriven, 
  calculateStageOutputs, 
  DRIVER_AMPS, 
  FINAL_AMPS,
  RADIOS,
  ANTENNAS
} from '@/lib/rfEngineStatic';
import { useMic } from '@/lib/useMic';

const RFContext = createContext(null);

const RADIO_VOLTAGE = 14.8;
const AMBIENT_TEMP = 25;
const BLOW_TEMP = 175;
const CRITICAL_TEMP = 150;
const WARN_TEMP = 100;
const COOL_RATE = 2;
const HEAT_BASE_RATE = 3;

const DEFAULT_STATE = {
  radio: 'cobra-29',
  driveLevel: 1.0,
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
  regulatorVoltages: [14.2],
  tipLength: 48,
  keyed: false,
};

export function RFProvider({ children }) {
  const [config, setConfig] = useState(DEFAULT_STATE);
  const [keyed, setKeyed] = useState(false);
  const { micEnabled, micLevel, toggleMic } = useMic();

  // Thermal state
  const [driverTemp, setDriverTemp] = useState(AMBIENT_TEMP);
  const [finalTemp, setFinalTemp] = useState(AMBIENT_TEMP);
  const [driverBlown, setDriverBlown] = useState(false);
  const [finalBlown, setFinalBlown] = useState(false);
  const lastTickRef = useRef(Date.now());

  // Refs to avoid stale closures
  const keyedRef = useRef(keyed);
  const driverBlownRef = useRef(driverBlown);
  const finalBlownRef = useRef(finalBlown);
  const micLevelRef = useRef(micLevel);
  keyedRef.current = keyed;
  driverBlownRef.current = driverBlown;
  finalBlownRef.current = finalBlown;
  micLevelRef.current = micLevel;

  const updateConfig = useCallback((key, value) => {
    setConfig(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'alternatorCount') {
        const regCount = Math.ceil(value / 3);
        const oldRegs = prev.regulatorVoltages || [14.2];
        const newRegs = [];
        for (let i = 0; i < regCount; i++) {
          newRegs.push(oldRegs[i] !== undefined ? oldRegs[i] : 14.2);
        }
        next.regulatorVoltages = newRegs;
      }
      return next;
    });
  }, []);

  const resetAmp = useCallback((which) => {
    if (which === 'driver') {
      setDriverBlown(false);
      driverBlownRef.current = false;
      setDriverTemp(AMBIENT_TEMP);
    } else {
      setFinalBlown(false);
      finalBlownRef.current = false;
      setFinalTemp(AMBIENT_TEMP);
    }
  }, []);

  // Thermal preview simulation
  const runThermalPreview = useCallback((durationSec = 30) => {
    const stages = calculateStageOutputs(config.radio, config.driverAmp, config.finalAmp, config.bonding, config.driveLevel);
    const driver = DRIVER_AMPS[config.driverAmp] || DRIVER_AMPS['none'];
    const final_ = FINAL_AMPS[config.finalAmp] || FINAL_AMPS['none'];
    const regs = config.regulatorVoltages || [14.2];
    const avgRegV = regs.reduce((a, b) => a + b, 0) / regs.length;
    const voltageStress = avgRegV > 15 ? 1 + (avgRegV - 15) * 0.4 : 1.0;
    const underDriven = checkUnderDriven(config.radio, config.driverAmp, config.finalAmp, config.bonding, config.driveLevel);
    const overDriveStress = underDriven.driveRatio > 1.2 ? 1 + (underDriven.driveRatio - 1.2) * 0.8 : 1.0;

    const simMicLevel = 0.5;
    const dt = 0.1;
    const steps = Math.floor(durationSec / dt);

    let drvTemp = driverTemp;
    let finTemp = finalTemp;
    let drvBlowTime = null;
    let finBlowTime = null;
    let drvPeakTemp = driverTemp;
    let finPeakTemp = finalTemp;

    for (let i = 0; i < steps; i++) {
      const t = i * dt;

      if (driver.currentDraw > 0 && drvBlowTime === null) {
        const thermalMass = driver.transistors >= 2 ? Math.sqrt(driver.transistors / 2) : 1;
        const loadRatio = Math.max(0.05, stages.driverLoadRatioDK + (stages.driverLoadRatioPK - stages.driverLoadRatioDK) * simMicLevel);
        const loadFactor = loadRatio * voltageStress;
        const heatRate = (HEAT_BASE_RATE / thermalMass) * loadFactor;
        drvTemp += heatRate * dt;
        if (drvTemp > drvPeakTemp) drvPeakTemp = drvTemp;
        if (drvTemp >= BLOW_TEMP) {
          drvBlowTime = t;
          drvTemp = BLOW_TEMP;
        }
      }

      if (final_.currentDraw > 0 && finBlowTime === null) {
        const thermalMass = final_.transistors >= 2 ? Math.sqrt(final_.transistors / 2) : 1;
        const loadRatio = Math.max(0.05, stages.finalLoadRatioDK + (stages.finalLoadRatioPK - stages.finalLoadRatioDK) * simMicLevel);
        const loadFactor = loadRatio * voltageStress * overDriveStress;
        const heatRate = (HEAT_BASE_RATE / thermalMass) * loadFactor;
        finTemp += heatRate * dt;
        if (finTemp > finPeakTemp) finPeakTemp = finTemp;
        if (finTemp >= BLOW_TEMP) {
          finBlowTime = t;
          finTemp = BLOW_TEMP;
        }
      }
    }

    const calcTimeToBlowFrom = (currentTemp, transistors, loadRatioDK, loadRatioPK, extraStress = 1) => {
      if (transistors <= 0) return null;
      const thermalMass = transistors >= 2 ? Math.sqrt(transistors / 2) : 1;
      const loadRatio = Math.max(0.05, loadRatioDK + (loadRatioPK - loadRatioDK) * simMicLevel);
      const loadFactor = loadRatio * voltageStress * extraStress;
      const heatRate = (HEAT_BASE_RATE / thermalMass) * loadFactor;
      if (heatRate <= 0) return null;
      const degreesToBlow = BLOW_TEMP - currentTemp;
      return degreesToBlow / heatRate;
    };

    const drvTimeToBlowFromNow = driver.currentDraw > 0 
      ? calcTimeToBlowFrom(driverTemp, driver.transistors, stages.driverLoadRatioDK, stages.driverLoadRatioPK)
      : null;
    const finTimeToBlowFromNow = final_.currentDraw > 0
      ? calcTimeToBlowFrom(finalTemp, final_.transistors, stages.finalLoadRatioDK, stages.finalLoadRatioPK, overDriveStress)
      : null;

    return {
      durationSec,
      driver: {
        startTemp: Math.round(driverTemp),
        peakTemp: Math.round(drvPeakTemp),
        endTemp: Math.round(drvTemp),
        willBlow: drvBlowTime !== null,
        blowTime: drvBlowTime ? Math.round(drvBlowTime) : null,
        timeToBlowFromNow: drvTimeToBlowFromNow ? Math.round(drvTimeToBlowFromNow) : null,
        isActive: driver.currentDraw > 0,
      },
      final: {
        startTemp: Math.round(finalTemp),
        peakTemp: Math.round(finPeakTemp),
        endTemp: Math.round(finTemp),
        willBlow: finBlowTime !== null,
        blowTime: finBlowTime ? Math.round(finBlowTime) : null,
        timeToBlowFromNow: finTimeToBlowFromNow ? Math.round(finTimeToBlowFromNow) : null,
        isActive: final_.currentDraw > 0,
      },
      warnings: {
        highVoltage: avgRegV >= 18,
        overDriven: underDriven.driveRatio > 1.2,
        underDriven: underDriven.isUnderDriven,
      }
    };
  }, [config, driverTemp, finalTemp]);

  // Thermal simulation tick
  useEffect(() => {
    const stages = calculateStageOutputs(config.radio, config.driverAmp, config.finalAmp, config.bonding, config.driveLevel);

    const interval = setInterval(() => {
      const now = Date.now();
      const dt = Math.min((now - lastTickRef.current) / 1000, 0.5);
      lastTickRef.current = now;

      const isKeyed = keyedRef.current;
      const isDriverBlown = driverBlownRef.current;
      const isFinalBlown = finalBlownRef.current;
      const currentMicLevel = micLevelRef.current;

      const driver = DRIVER_AMPS[config.driverAmp] || DRIVER_AMPS['none'];
      const final_ = FINAL_AMPS[config.finalAmp] || FINAL_AMPS['none'];

      const regs = config.regulatorVoltages || [14.2];
      const avgRegV = regs.reduce((a, b) => a + b, 0) / regs.length;

      const voltageStress = avgRegV > 15 ? 1 + (avgRegV - 15) * 0.4 : 1.0;

      const underDriven = checkUnderDriven(config.radio, config.driverAmp, config.finalAmp, config.bonding);
      const overDriveStress = underDriven.driveRatio > 1.2 ? 1 + (underDriven.driveRatio - 1.2) * 0.8 : 1.0;

      setDriverTemp(prev => {
        if (isDriverBlown) return prev;
        if (driver.currentDraw <= 0) return Math.max(AMBIENT_TEMP, prev - COOL_RATE * dt);

        if (isKeyed) {
          const thermalMass = driver.transistors >= 2 ? Math.sqrt(driver.transistors / 2) : 1;
          const dkRatio = stages.driverLoadRatioDK;
          const pkRatio = stages.driverLoadRatioPK;
          const loadRatio = Math.max(0.05, dkRatio + (pkRatio - dkRatio) * currentMicLevel);
          const loadFactor = loadRatio * voltageStress;
          const heatRate = (HEAT_BASE_RATE / thermalMass) * loadFactor;
          const newTemp = prev + heatRate * dt;
          if (newTemp >= BLOW_TEMP) {
            setDriverBlown(true);
            driverBlownRef.current = true;
            return BLOW_TEMP;
          }
          return newTemp;
        } else {
          return Math.max(AMBIENT_TEMP, prev - COOL_RATE * dt);
        }
      });

      setFinalTemp(prev => {
        if (isFinalBlown) return prev;
        if (final_.currentDraw <= 0) return Math.max(AMBIENT_TEMP, prev - COOL_RATE * dt);

        if (isKeyed) {
          const thermalMass = final_.transistors >= 2 ? Math.sqrt(final_.transistors / 2) : 1;
          const dkRatio = stages.finalLoadRatioDK;
          const pkRatio = stages.finalLoadRatioPK;
          const loadRatio = Math.max(0.05, dkRatio + (pkRatio - dkRatio) * currentMicLevel);
          const loadFactor = loadRatio * voltageStress * overDriveStress;
          const heatRate = (HEAT_BASE_RATE / thermalMass) * loadFactor;
          const newTemp = prev + heatRate * dt;
          if (newTemp >= BLOW_TEMP) {
            setFinalBlown(true);
            finalBlownRef.current = true;
            return BLOW_TEMP;
          }
          return newTemp;
        } else {
          return Math.max(AMBIENT_TEMP, prev - COOL_RATE * dt);
        }
      });
    }, 100);

    return () => clearInterval(interval);
  }, [config]);

  // Average regulator voltage
  const regs = config.regulatorVoltages || [14.2];
  const avgRegV = regs.reduce((a, b) => a + b, 0) / regs.length;

  // Calculate derived values
  const chain = calculateSignalChain(config.radio, config.driverAmp, config.finalAmp, config.bonding, config.antennaPosition, config.driveLevel, avgRegV);
  const stages = calculateStageOutputs(config.radio, config.driverAmp, config.finalAmp, config.bonding, config.driveLevel);
  const swr = calculateSWR(config.antenna, config.vehicle, config.bonding, config.tipLength);
  const takeoff = calculateTakeoffAngle(config.vehicle, config.bonding);
  const underDriven = checkUnderDriven(config.radio, config.driverAmp, config.finalAmp, config.bonding, config.driveLevel);

  const driver = DRIVER_AMPS[config.driverAmp] || DRIVER_AMPS['none'];
  const final_ = FINAL_AMPS[config.finalAmp] || FINAL_AMPS['none'];
  const driverLoadRatio = stages.driverLoadRatioDK + (stages.driverLoadRatioPK - stages.driverLoadRatioDK) * micLevel;
  const finalLoadRatio = stages.finalLoadRatioDK + (stages.finalLoadRatioPK - stages.finalLoadRatioDK) * micLevel;
  const driverActualAmps = keyed ? driver.currentDraw * Math.max(0.05, driverLoadRatio) : 0;
  const finalActualAmps = keyed ? final_.currentDraw * Math.max(0.05, finalLoadRatio) : 0;
  const actualDemand = driverActualAmps + finalActualAmps;

  const voltage = calculateVoltageDrop(config.driverAmp, config.finalAmp, config.alternatorCount, config.alternatorAmps, config.batteryType, config.batteryCount, config.regulatorVoltages, keyed ? actualDemand : 0);

  let effectiveChain = { ...chain };
  if (driverBlown) {
    effectiveChain.deadKey = 0;
    effectiveChain.peakKey = 0;
  }
  if (finalBlown && config.finalAmp !== 'none') {
    effectiveChain.deadKey = 0;
    effectiveChain.peakKey = 0;
  }

  const effectivePower = keyed ? effectiveChain : { deadKey: 0, peakKey: 0 };

  const metrics = {
    deadKey: Math.round(effectivePower.deadKey * 10) / 10,
    peakWatts: Math.round(effectivePower.peakKey * 10) / 10,
    avgWatts: Math.round((effectivePower.deadKey + (effectivePower.peakKey - effectivePower.deadKey) * micLevel * 0.35) * 10) / 10,
    peakSwingWatts: Math.round((effectivePower.deadKey + (effectivePower.peakKey - effectivePower.deadKey) * Math.min(1, micLevel * 1.8)) * 10) / 10,
    modulatedWatts: Math.round((effectivePower.deadKey + (effectivePower.peakKey - effectivePower.deadKey) * micLevel) * 10) / 10,
    micLevel: micLevel,
    voltage: voltage.effectiveVoltage,
    radioVoltage: RADIO_VOLTAGE,
    ampVoltage: Math.round(avgRegV * 10) / 10,
    voltageDrop: voltage.voltageDrop,
    overloaded: voltage.overloaded,
    highVoltageWarn: avgRegV >= 19,
    currentDraw: voltage.currentDraw,
    driverAmps: Math.round(driverActualAmps * 10) / 10,
    finalAmps: Math.round(finalActualAmps * 10) / 10,
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
    driverTemp: Math.round(driverTemp),
    finalTemp: Math.round(finalTemp),
    driverBlown,
    finalBlown,
  };

  return (
    <RFContext.Provider value={{ config, keyed, setKeyed, updateConfig, metrics, micEnabled, toggleMic, resetAmp, runThermalPreview }}>
      {children}
    </RFContext.Provider>
  );
}

export const useRF = () => useContext(RFContext);
