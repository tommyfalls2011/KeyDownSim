import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { calculateSignalChain, calculateVoltageDrop, calculateSWR, calculateYagiSWR, calculateTakeoffAngle, checkUnderDriven, calculateStageOutputs, mergeEquipmentFromAPI, DRIVER_AMPS, FINAL_AMPS, YAGI_ARRAY_CONFIG } from '@/lib/rfEngine';
import { useMic } from '@/lib/useMic';

const RFContext = createContext(null);

const RADIO_VOLTAGE = 14.8; // Radio always runs factory voltage
const AMBIENT_TEMP = 25; // °C
const BLOW_TEMP = 175; // °C — 2SC2879 max junction temp, thermal runaway point
const CRITICAL_TEMP = 150; // °C — case temp danger zone
const WARN_TEMP = 100; // °C — monitoring zone
const COOL_RATE = 2; // °C per second — realistic heatsink + fan dissipation
const HEAT_BASE_RATE = 3; // °C per second — 2-pill at FULL LOAD (load ratio scales this down)

const DEFAULT_STATE = {
  radio: 'cobra-29',
  driveLevel: 1.0, // 0.25–1.0, scales dead key & peak (4:1 ratio preserved)
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
  // Yagi Array Mode
  yagiMode: false,
  yagiStickType: 'fight-8', // 'fight-8' or 'fight-10'
  yagiDir1OnTruck: true, // true = on the truck roof, false = on the front beam
  yagiElementHeights: {
    ant1: 96,   // inches - base height
    ant2: 96,   // same as ant1
    dir1: 84,   // ~1' shorter, tunable
    dir2: 111,  // 15" taller (fixed relative)
    dir3: 111,  // same as dir2
  },
};

export function RFProvider({ children }) {
  const [config, setConfig] = useState(DEFAULT_STATE);
  const [keyed, setKeyed] = useState(false);
  const { micEnabled, micLevel, toggleMic } = useMic();
  const [equipmentLoaded, setEquipmentLoaded] = useState(0);

  // Fetch admin-added equipment from DB and merge into rfEngine objects
  useEffect(() => {
    const API = process.env.REACT_APP_BACKEND_URL;
    fetch(`${API}/api/equipment`)
      .then(r => r.json())
      .then(data => {
        mergeEquipmentFromAPI(data);
        setEquipmentLoaded(prev => prev + 1); // trigger re-render so dropdowns update
      })
      .catch(() => {}); // silently use hardcoded defaults if API fails
  }, []);

  // Thermal state
  const [driverTemp, setDriverTemp] = useState(AMBIENT_TEMP);
  const [finalTemp, setFinalTemp] = useState(AMBIENT_TEMP);
  const [driverBlown, setDriverBlown] = useState(false);
  const [finalBlown, setFinalBlown] = useState(false);
  const lastTickRef = useRef(Date.now());

  // Refs to avoid stale closures in setInterval thermal tick
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

  const loadConfig = useCallback((cfg) => {
    setConfig({
      radio: cfg.radio || 'cobra-29',
      driveLevel: cfg.drive_level ?? cfg.driveLevel ?? 1.0,
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
      regulatorVoltages: cfg.regulator_voltages || [14.2],
      tipLength: cfg.tip_length || 48,
      keyed: false,
    });
    // Reset thermal on load
    setDriverTemp(AMBIENT_TEMP);
    setFinalTemp(AMBIENT_TEMP);
    setDriverBlown(false);
    setFinalBlown(false);
    driverBlownRef.current = false;
    finalBlownRef.current = false;
  }, []);

  // Reset blown amp (take out of line, put back)
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

  // Thermal preview simulation — calculates what happens over a given duration without changing state
  const runThermalPreview = useCallback((durationSec = 30) => {
    const stages = calculateStageOutputs(config.radio, config.driverAmp, config.finalAmp, config.bonding, config.driveLevel);
    const driver = DRIVER_AMPS[config.driverAmp] || DRIVER_AMPS['none'];
    const final_ = FINAL_AMPS[config.finalAmp] || FINAL_AMPS['none'];
    const regs = config.regulatorVoltages || [14.2];
    const avgRegV = regs.reduce((a, b) => a + b, 0) / regs.length;
    const voltageStress = avgRegV > 15 ? 1 + (avgRegV - 15) * 0.4 : 1.0;
    const underDriven = checkUnderDriven(config.radio, config.driverAmp, config.finalAmp, config.bonding, config.driveLevel);
    const overDriveStress = underDriven.driveRatio > 1.2 ? 1 + (underDriven.driveRatio - 1.2) * 0.8 : 1.0;

    // Simulate with moderate modulation (50% mic level average)
    const simMicLevel = 0.5;
    const dt = 0.1; // 100ms ticks
    const steps = Math.floor(durationSec / dt);

    let drvTemp = driverTemp;
    let finTemp = finalTemp;
    let drvBlowTime = null;
    let finBlowTime = null;
    let drvPeakTemp = driverTemp;
    let finPeakTemp = finalTemp;

    for (let i = 0; i < steps; i++) {
      const t = i * dt;

      // Driver heating
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

      // Final heating
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

    // Calculate time to blow from current temp (extended projection)
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

  // Thermal simulation tick — reads keyed/blown/micLevel from refs to avoid stale closures
  useEffect(() => {
    // Pre-calculate stage outputs and load ratios for this config
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
      const modStress = 1 + currentMicLevel * 0.25;

      const underDriven = checkUnderDriven(config.radio, config.driverAmp, config.finalAmp, config.bonding);
      const overDriveExcess = Math.max(0, underDriven.driveRatio - 1.0);
      const overDriveStress = overDriveExcess > 0 ? 1 + overDriveExcess * 2.5 + Math.pow(overDriveExcess, 2) * 3.0 : 1.0;

      setDriverTemp(prev => {
        if (isDriverBlown) return prev;
        if (driver.currentDraw <= 0) return Math.max(AMBIENT_TEMP, prev - COOL_RATE * dt);

        if (isKeyed) {
          // Heat based on actual load — dead key baseline + modulation swing
          const thermalMass = driver.transistors >= 2 ? Math.sqrt(driver.transistors / 2) : 1;
          const dkRatio = stages.driverLoadRatioDK;
          const pkRatio = stages.driverLoadRatioPK;
          const loadRatio = Math.max(0.05, dkRatio + (pkRatio - dkRatio) * currentMicLevel);
          // Driver over-drive: if driver load ratio > 0.85, it's running hot
          const driverStress = dkRatio > 0.85 ? 1 + (dkRatio - 0.85) * 4.0 : 1.0;
          const loadFactor = loadRatio * voltageStress * driverStress;
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

  // Average regulator voltage (what the amps are actually fed)
  const regs = config.regulatorVoltages || [14.2];
  const avgRegV = regs.reduce((a, b) => a + b, 0) / regs.length;

  // Calculate derived values - pass voltage to signal chain so watts scale with volts
  const chain = calculateSignalChain(config.radio, config.driverAmp, config.finalAmp, config.bonding, config.antennaPosition, config.driveLevel, avgRegV);
  const stages = calculateStageOutputs(config.radio, config.driverAmp, config.finalAmp, config.bonding, config.driveLevel);
  
  // SWR calculation - use Yagi SWR when in Yagi mode
  const swr = config.yagiMode 
    ? calculateYagiSWR(config.vehicle, config.bonding, {
        stickType: config.yagiStickType,
        elementHeights: config.yagiElementHeights,
      })
    : calculateSWR(config.antenna, config.vehicle, config.bonding, config.tipLength);
  
  const takeoff = calculateTakeoffAngle(config.vehicle, config.bonding);
  const underDriven = checkUnderDriven(config.radio, config.driverAmp, config.finalAmp, config.bonding, config.driveLevel);

  // Actual current draw — proportional to load, swings with modulation
  // Dead key = baseline current, mic modulation pushes toward peak current
  const driver = DRIVER_AMPS[config.driverAmp] || DRIVER_AMPS['none'];
  const final_ = FINAL_AMPS[config.finalAmp] || FINAL_AMPS['none'];
  const driverLoadRatio = stages.driverLoadRatioDK + (stages.driverLoadRatioPK - stages.driverLoadRatioDK) * micLevel;
  const finalLoadRatio = stages.finalLoadRatioDK + (stages.finalLoadRatioPK - stages.finalLoadRatioDK) * micLevel;
  const driverActualAmps = keyed ? driver.currentDraw * Math.max(0.05, driverLoadRatio) : 0;
  const finalActualAmps = keyed ? final_.currentDraw * Math.max(0.05, finalLoadRatio) : 0;
  const actualDemand = driverActualAmps + finalActualAmps;

  // Voltage calculation uses actual demand when keyed
  const voltage = calculateVoltageDrop(config.driverAmp, config.finalAmp, config.alternatorCount, config.alternatorAmps, config.batteryType, config.batteryCount, config.regulatorVoltages, keyed ? actualDemand : 0);

  // Apply blown amp — if blown, that stage produces nothing
  let effectiveChain = { ...chain };
  if (driverBlown) {
    effectiveChain.deadKey = 0;
    effectiveChain.peakKey = 0;
  }
  if (finalBlown && config.finalAmp !== 'none') {
    // Final blown: signal only goes through driver (if any)
    effectiveChain.deadKey = 0;
    effectiveChain.peakKey = 0;
  }

  // Apply voltage overload power reduction
  let effectivePower = effectiveChain;
  if (voltage.overloaded) {
    const reduction = Math.max(0.3, voltage.effectiveVoltage / 14.2);
    effectivePower = {
      deadKey: effectiveChain.deadKey * reduction,
      peakKey: effectiveChain.peakKey * reduction,
    };
  }

  const metrics = {
    deadKeyWatts: Math.round(effectivePower.deadKey * 10) / 10,
    peakWatts: Math.round(effectivePower.peakKey * 10) / 10,
    // Average power: dead key carrier + moderate modulation swing (~35% of range)
    avgWatts: Math.round((effectivePower.deadKey + (effectivePower.peakKey - effectivePower.deadKey) * micLevel * 0.35) * 10) / 10,
    // Peak swing: starts at dead key, swings hard toward peak limit during modulation
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
    // Thermal
    driverTemp: Math.round(driverTemp),
    finalTemp: Math.round(finalTemp),
    driverBlown,
    finalBlown,
  };

  return (
    <RFContext.Provider value={{ config, keyed, setKeyed, updateConfig, loadConfig, metrics, micEnabled, toggleMic, resetAmp, equipmentLoaded, runThermalPreview }}>
      {children}
    </RFContext.Provider>
  );
}

export const useRF = () => useContext(RFContext);
