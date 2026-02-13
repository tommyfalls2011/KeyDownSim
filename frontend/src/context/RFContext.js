import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { calculateSignalChain, calculateVoltageDrop, calculateSWR, calculateTakeoffAngle, checkUnderDriven, calculateStageOutputs, DRIVER_AMPS, FINAL_AMPS } from '@/lib/rfEngine';
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

  // Thermal simulation tick — reads keyed/blown/micLevel from refs to avoid stale closures
  useEffect(() => {
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
      const overDriveStress = underDriven.driveRatio > 1.2 ? 1 + (underDriven.driveRatio - 1.2) * 0.8 : 1.0;

      setDriverTemp(prev => {
        if (isDriverBlown) return prev;
        if (driver.currentDraw <= 0) return Math.max(AMBIENT_TEMP, prev - COOL_RATE * dt);

        if (isKeyed) {
          // 2SC2879 thermal model: more pills = more thermal mass = slower temp rise
          // 2-pill is reference (thermalMass=1), 4-pill=1.41x mass, 8-pill=2x, 16-pill=2.83x
          const thermalMass = driver.transistors >= 2 ? Math.sqrt(driver.transistors / 2) : 1;
          const loadFactor = voltageStress * modStress;
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
          const loadFactor = voltageStress * modStress * overDriveStress;
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

  // Calculate derived values
  const chain = calculateSignalChain(config.radio, config.driverAmp, config.finalAmp, config.bonding, config.antennaPosition);
  const voltage = calculateVoltageDrop(config.driverAmp, config.finalAmp, config.alternatorCount, config.alternatorAmps, config.batteryType, config.batteryCount, config.regulatorVoltages);
  const swr = calculateSWR(config.antenna, config.vehicle, config.bonding, config.tipLength);
  const takeoff = calculateTakeoffAngle(config.vehicle, config.bonding);
  const underDriven = checkUnderDriven(config.radio, config.driverAmp, config.finalAmp, config.bonding);

  // Average regulator voltage
  const regs = config.regulatorVoltages || [14.2];
  const avgRegV = regs.reduce((a, b) => a + b, 0) / regs.length;

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
    modulatedWatts: Math.round((effectivePower.deadKey + (effectivePower.peakKey - effectivePower.deadKey) * micLevel) * 10) / 10,
    micLevel: micLevel,
    voltage: voltage.effectiveVoltage,
    radioVoltage: RADIO_VOLTAGE,
    ampVoltage: Math.round(avgRegV * 10) / 10,
    voltageDrop: voltage.voltageDrop,
    overloaded: voltage.overloaded,
    highVoltageWarn: avgRegV >= 19,
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
    // Thermal
    driverTemp: Math.round(driverTemp),
    finalTemp: Math.round(finalTemp),
    driverBlown,
    finalBlown,
  };

  return (
    <RFContext.Provider value={{ config, keyed, setKeyed, updateConfig, loadConfig, metrics, micEnabled, toggleMic, resetAmp }}>
      {children}
    </RFContext.Provider>
  );
}

export const useRF = () => useContext(RFContext);
