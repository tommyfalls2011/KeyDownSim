import { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { calculateSignalChain, calculateVoltageDrop, calculateSWR, calculateYagiSWR, calculateTakeoffAngle, checkUnderDriven, calculateStageOutputs, mergeEquipmentFromAPI, getAmpSpecs, getRecommendedHeatsink, calculateJumperLoss, TRANSISTORS, YAGI_ARRAY_CONFIG } from '@/lib/rfEngine';
import { useMic } from '@/lib/useMic';

const RFContext = createContext(null);

const RADIO_VOLTAGE = 14.8;
const AMBIENT_TEMP = 25;
const HEAT_BASE_RATE = 3; // °C per second base rate (calibrated for 35% efficiency baseline)

const DEFAULT_STATE = {
  radio: 'cobra-29',
  driveLevel: 1.0,
  // Driver stage: transistor type + box size + heatsink
  driverTransistor: 'none',
  driverBoxSize: 0,
  driverHeatsink: 'small',
  // Mid driver stage
  midDriverTransistor: 'none',
  midDriverBoxSize: 0,
  midDriverHeatsink: 'small',
  // Final stage: transistor type + box size + heatsink
  finalTransistor: 'none',
  finalBoxSize: 0,
  finalHeatsink: 'small',
  antenna: 'whip-102',
  antennaPosition: 'center',
  vehicle: 'suburban',
  rideHeightOffset: 0,
  bonding: true,
  alternatorCount: 1,
  alternatorAmps: 130,
  batteryType: 'lead',
  batteryCount: 1,
  regulatorVoltages: [14.2],
  tipLength: 48,
  coaxType: 'rg213',
  coaxLengthFt: 18,
  // Inter-stage jumper cables
  jumperRadioToDriverType: 'rg213',
  jumperRadioToDriverLength: 3,
  jumperDriverToMidType: 'rg213',
  jumperDriverToMidLength: 3,
  jumperMidToFinalType: 'rg213',
  jumperMidToFinalLength: 3,
  keyed: false,
  yagiMode: false,
  yagiStickType: 'fight-8',
  yagiDir1OnTruck: true,
  yagiElementHeights: { ant1: 96, ant2: 96, dir1: 84, dir2: 111, dir3: 111 },
  yagiElementPositions: { ant1: 0, ant2: 0, dir1: 0, dir2: 0, dir3: 0 },
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
  const [midDriverTemp, setMidDriverTemp] = useState(AMBIENT_TEMP);
  const [finalTemp, setFinalTemp] = useState(AMBIENT_TEMP);
  const [driverBlown, setDriverBlown] = useState(false);
  const [midDriverBlown, setMidDriverBlown] = useState(false);
  const [finalBlown, setFinalBlown] = useState(false);
  const lastTickRef = useRef(Date.now());

  // Refs to avoid stale closures in setInterval thermal tick
  const keyedRef = useRef(keyed);
  const driverBlownRef = useRef(driverBlown);
  const midDriverBlownRef = useRef(midDriverBlown);
  const finalBlownRef = useRef(finalBlown);
  const micLevelRef = useRef(micLevel);
  keyedRef.current = keyed;
  driverBlownRef.current = driverBlown;
  midDriverBlownRef.current = midDriverBlown;
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
      // Auto-select recommended heatsink when box size changes
      if (key === 'driverBoxSize' && value > 0) {
        next.driverHeatsink = getRecommendedHeatsink(value);
      }
      if (key === 'midDriverBoxSize' && value > 0) {
        next.midDriverHeatsink = getRecommendedHeatsink(value);
      }
      if (key === 'finalBoxSize' && value > 0) {
        next.finalHeatsink = getRecommendedHeatsink(value);
      }
      return next;
    });
    // Reset thermal state when swapping amp components
    if (key === 'driverTransistor' || key === 'driverBoxSize' || key === 'driverHeatsink') {
      setDriverTemp(AMBIENT_TEMP);
      setDriverBlown(false);
      driverBlownRef.current = false;
    }
    if (key === 'midDriverTransistor' || key === 'midDriverBoxSize' || key === 'midDriverHeatsink') {
      setMidDriverTemp(AMBIENT_TEMP);
      setMidDriverBlown(false);
      midDriverBlownRef.current = false;
    }
    if (key === 'finalTransistor' || key === 'finalBoxSize' || key === 'finalHeatsink') {
      setFinalTemp(AMBIENT_TEMP);
      setFinalBlown(false);
      finalBlownRef.current = false;
    }
  }, []);

  const loadConfig = useCallback((cfg) => {
    setConfig({
      radio: cfg.radio || 'cobra-29',
      driveLevel: cfg.drive_level ?? cfg.driveLevel ?? 1.0,
      driverTransistor: cfg.driver_transistor ?? cfg.driverTransistor ?? 'none',
      driverBoxSize: cfg.driver_box_size ?? cfg.driverBoxSize ?? 0,
      driverHeatsink: cfg.driver_heatsink ?? cfg.driverHeatsink ?? 'small',
      midDriverTransistor: cfg.mid_driver_transistor ?? cfg.midDriverTransistor ?? 'none',
      midDriverBoxSize: cfg.mid_driver_box_size ?? cfg.midDriverBoxSize ?? 0,
      midDriverHeatsink: cfg.mid_driver_heatsink ?? cfg.midDriverHeatsink ?? 'small',
      finalTransistor: cfg.final_transistor ?? cfg.finalTransistor ?? 'none',
      finalBoxSize: cfg.final_box_size ?? cfg.finalBoxSize ?? 0,
      finalHeatsink: cfg.final_heatsink ?? cfg.finalHeatsink ?? 'small',
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
      coaxType: cfg.coax_type || cfg.coaxType || 'rg213',
      coaxLengthFt: cfg.coax_length_ft ?? cfg.coaxLengthFt ?? 18,
      jumperRadioToDriverType: cfg.jumper_radio_to_driver_type ?? cfg.jumperRadioToDriverType ?? 'rg213',
      jumperRadioToDriverLength: cfg.jumper_radio_to_driver_length ?? cfg.jumperRadioToDriverLength ?? 3,
      jumperDriverToMidType: cfg.jumper_driver_to_mid_type ?? cfg.jumperDriverToMidType ?? 'rg213',
      jumperDriverToMidLength: cfg.jumper_driver_to_mid_length ?? cfg.jumperDriverToMidLength ?? 3,
      jumperMidToFinalType: cfg.jumper_mid_to_final_type ?? cfg.jumperMidToFinalType ?? 'rg213',
      jumperMidToFinalLength: cfg.jumper_mid_to_final_length ?? cfg.jumperMidToFinalLength ?? 3,
      keyed: false,
    });
    // Reset thermal on load
    setDriverTemp(AMBIENT_TEMP);
    setMidDriverTemp(AMBIENT_TEMP);
    setFinalTemp(AMBIENT_TEMP);
    setDriverBlown(false);
    setMidDriverBlown(false);
    setFinalBlown(false);
    driverBlownRef.current = false;
    midDriverBlownRef.current = false;
    finalBlownRef.current = false;
  }, []);

  // Reset blown amp (take out of line, put back)
  const resetAmp = useCallback((which) => {
    if (which === 'driver') {
      setDriverBlown(false);
      driverBlownRef.current = false;
      setDriverTemp(AMBIENT_TEMP);
    } else if (which === 'midDriver') {
      setMidDriverBlown(false);
      midDriverBlownRef.current = false;
      setMidDriverTemp(AMBIENT_TEMP);
    } else {
      setFinalBlown(false);
      finalBlownRef.current = false;
      setFinalTemp(AMBIENT_TEMP);
    }
  }, []);

  // Thermal preview simulation — calculates what happens over a given duration without changing state
  const runThermalPreview = useCallback((durationSec = 30) => {
    const driverSpecs = getAmpSpecs(config.driverTransistor, config.driverBoxSize, config.driverHeatsink);
    const midDriverSpecs = getAmpSpecs(config.midDriverTransistor, config.midDriverBoxSize, config.midDriverHeatsink);
    const finalSpecs = getAmpSpecs(config.finalTransistor, config.finalBoxSize, config.finalHeatsink);
    const previewJumperConfig = {
      radioToDriver: { cableType: config.jumperRadioToDriverType, lengthFt: config.jumperRadioToDriverLength },
      driverToMid: { cableType: config.jumperDriverToMidType, lengthFt: config.jumperDriverToMidLength },
      midToFinal: { cableType: config.jumperMidToFinalType, lengthFt: config.jumperMidToFinalLength },
    };
    const stages = calculateStageOutputs(config.radio, driverSpecs, midDriverSpecs, finalSpecs, config.bonding, config.driveLevel, previewJumperConfig);
    const regs = config.regulatorVoltages || [14.2];
    const avgRegV = regs.reduce((a, b) => a + b, 0) / regs.length;
    const voltageStress = avgRegV > 15 ? 1 + (avgRegV - 15) * 0.4 : 1.0;
    const underDriven = checkUnderDriven(config.radio, driverSpecs, midDriverSpecs, finalSpecs, config.bonding, config.driveLevel, previewJumperConfig);
    const overDriveExcess = Math.max(0, underDriven.driveRatio - 1.0);
    const overDriveStress = overDriveExcess > 0 ? 1 + overDriveExcess * 2.5 + Math.pow(overDriveExcess, 2) * 3.0 : 1.0;

    const simMicLevel = 0.5;
    const dt = 0.1;
    const steps = Math.floor(durationSec / dt);

    const drvEffFactor = driverSpecs ? (1 - driverSpecs.efficiency) / (1 - 0.35) : 1;
    const midEffFactor = midDriverSpecs ? (1 - midDriverSpecs.efficiency) / (1 - 0.35) : 1;
    const finEffFactor = finalSpecs ? (1 - finalSpecs.efficiency) / (1 - 0.35) : 1;
    const drvCoolRate = driverSpecs?.coolRate ?? 2;
    const midCoolRate = midDriverSpecs?.coolRate ?? 2;
    const finCoolRate = finalSpecs?.coolRate ?? 2;
    const drvBlowTemp = driverSpecs?.tjMax ?? 175;
    const midBlowTemp = midDriverSpecs?.tjMax ?? 175;
    const finBlowTemp = finalSpecs?.tjMax ?? 175;

    let drvTemp = driverTemp;
    let midTemp = midDriverTemp;
    let finTemp = finalTemp;
    let drvBlowTime = null, midBlowTime = null, finBlowTime = null;
    let drvPeakTemp = driverTemp, midPeakTemp = midDriverTemp, finPeakTemp = finalTemp;

    for (let i = 0; i < steps; i++) {
      const t = i * dt;

      if (driverSpecs && driverSpecs.transistors > 0 && drvBlowTime === null) {
        const thermalMass = driverSpecs.transistors >= 2 ? Math.sqrt(driverSpecs.transistors / 2) : 1;
        const loadRatio = Math.max(0.05, stages.driverLoadRatioDK + (stages.driverLoadRatioPK - stages.driverLoadRatioDK) * simMicLevel);
        const heatRate = (HEAT_BASE_RATE / thermalMass) * loadRatio * voltageStress * drvEffFactor;
        const coolDissipated = (drvTemp - AMBIENT_TEMP) * (drvCoolRate / 50) * dt;
        drvTemp += heatRate * dt - coolDissipated;
        if (drvTemp > drvPeakTemp) drvPeakTemp = drvTemp;
        if (drvTemp >= drvBlowTemp) { drvBlowTime = t; drvTemp = drvBlowTemp; }
      }

      if (midDriverSpecs && midDriverSpecs.transistors > 0 && midBlowTime === null) {
        const thermalMass = midDriverSpecs.transistors >= 2 ? Math.sqrt(midDriverSpecs.transistors / 2) : 1;
        const loadRatio = Math.max(0.05, stages.midDriverLoadRatioDK + (stages.midDriverLoadRatioPK - stages.midDriverLoadRatioDK) * simMicLevel);
        const heatRate = (HEAT_BASE_RATE / thermalMass) * loadRatio * voltageStress * midEffFactor;
        const coolDissipated = (midTemp - AMBIENT_TEMP) * (midCoolRate / 50) * dt;
        midTemp += heatRate * dt - coolDissipated;
        if (midTemp > midPeakTemp) midPeakTemp = midTemp;
        if (midTemp >= midBlowTemp) { midBlowTime = t; midTemp = midBlowTemp; }
      }

      if (finalSpecs && finalSpecs.transistors > 0 && finBlowTime === null) {
        const thermalMass = finalSpecs.transistors >= 2 ? Math.sqrt(finalSpecs.transistors / 2) : 1;
        const loadRatio = Math.max(0.05, stages.finalLoadRatioDK + (stages.finalLoadRatioPK - stages.finalLoadRatioDK) * simMicLevel);
        const heatRate = (HEAT_BASE_RATE / thermalMass) * loadRatio * voltageStress * overDriveStress * finEffFactor;
        const coolDissipated = (finTemp - AMBIENT_TEMP) * (finCoolRate / 50) * dt;
        finTemp += heatRate * dt - coolDissipated;
        if (finTemp > finPeakTemp) finPeakTemp = finTemp;
        if (finTemp >= finBlowTemp) { finBlowTime = t; finTemp = finBlowTemp; }
      }
    }

    const calcTimeToBlowFrom = (currentTemp, specs, loadRatioDK, loadRatioPK, effFactor, coolRate, extraStress = 1) => {
      if (!specs || specs.transistors <= 0) return null;
      const thermalMass = specs.transistors >= 2 ? Math.sqrt(specs.transistors / 2) : 1;
      const loadRatio = Math.max(0.05, loadRatioDK + (loadRatioPK - loadRatioDK) * simMicLevel);
      const heatRate = (HEAT_BASE_RATE / thermalMass) * loadRatio * voltageStress * extraStress * effFactor;
      if (heatRate <= 0) return null;
      const degreesToBlow = (specs.tjMax ?? 175) - currentTemp;
      return degreesToBlow / heatRate;
    };

    return {
      durationSec,
      driver: {
        startTemp: Math.round(driverTemp), peakTemp: Math.round(drvPeakTemp), endTemp: Math.round(drvTemp),
        willBlow: drvBlowTime !== null, blowTime: drvBlowTime ? Math.round(drvBlowTime) : null,
        timeToBlowFromNow: driverSpecs ? (calcTimeToBlowFrom(driverTemp, driverSpecs, stages.driverLoadRatioDK, stages.driverLoadRatioPK, drvEffFactor, drvCoolRate) ? Math.round(calcTimeToBlowFrom(driverTemp, driverSpecs, stages.driverLoadRatioDK, stages.driverLoadRatioPK, drvEffFactor, drvCoolRate)) : null) : null,
        isActive: !!driverSpecs,
      },
      midDriver: {
        startTemp: Math.round(midDriverTemp), peakTemp: Math.round(midPeakTemp), endTemp: Math.round(midTemp),
        willBlow: midBlowTime !== null, blowTime: midBlowTime ? Math.round(midBlowTime) : null,
        timeToBlowFromNow: midDriverSpecs ? (calcTimeToBlowFrom(midDriverTemp, midDriverSpecs, stages.midDriverLoadRatioDK, stages.midDriverLoadRatioPK, midEffFactor, midCoolRate) ? Math.round(calcTimeToBlowFrom(midDriverTemp, midDriverSpecs, stages.midDriverLoadRatioDK, stages.midDriverLoadRatioPK, midEffFactor, midCoolRate)) : null) : null,
        isActive: !!midDriverSpecs,
      },
      final: {
        startTemp: Math.round(finalTemp), peakTemp: Math.round(finPeakTemp), endTemp: Math.round(finTemp),
        willBlow: finBlowTime !== null, blowTime: finBlowTime ? Math.round(finBlowTime) : null,
        timeToBlowFromNow: finalSpecs ? (calcTimeToBlowFrom(finalTemp, finalSpecs, stages.finalLoadRatioDK, stages.finalLoadRatioPK, finEffFactor, finCoolRate, overDriveStress) ? Math.round(calcTimeToBlowFrom(finalTemp, finalSpecs, stages.finalLoadRatioDK, stages.finalLoadRatioPK, finEffFactor, finCoolRate, overDriveStress)) : null) : null,
        isActive: !!finalSpecs,
      },
      warnings: {
        highVoltage: avgRegV >= 18,
        overDriven: underDriven.driveRatio > 1.0,
        underDriven: underDriven.isUnderDriven,
      }
    };
  }, [config, driverTemp, midDriverTemp, finalTemp]);

  // Thermal simulation tick
  useEffect(() => {
    const driverSpecs = getAmpSpecs(config.driverTransistor, config.driverBoxSize, config.driverHeatsink);
    const midDriverSpecs = getAmpSpecs(config.midDriverTransistor, config.midDriverBoxSize, config.midDriverHeatsink);
    const finalSpecs = getAmpSpecs(config.finalTransistor, config.finalBoxSize, config.finalHeatsink);
    const tickJumperConfig = {
      radioToDriver: { cableType: config.jumperRadioToDriverType, lengthFt: config.jumperRadioToDriverLength },
      driverToMid: { cableType: config.jumperDriverToMidType, lengthFt: config.jumperDriverToMidLength },
      midToFinal: { cableType: config.jumperMidToFinalType, lengthFt: config.jumperMidToFinalLength },
    };
    const stages = calculateStageOutputs(config.radio, driverSpecs, midDriverSpecs, finalSpecs, config.bonding, config.driveLevel, tickJumperConfig);

    const drvEffFactor = driverSpecs ? (1 - driverSpecs.efficiency) / (1 - 0.35) : 1;
    const midEffFactor = midDriverSpecs ? (1 - midDriverSpecs.efficiency) / (1 - 0.35) : 1;
    const finEffFactor = finalSpecs ? (1 - finalSpecs.efficiency) / (1 - 0.35) : 1;
    const drvCoolRate = driverSpecs?.coolRate ?? 2;
    const midCoolRate = midDriverSpecs?.coolRate ?? 2;
    const finCoolRate = finalSpecs?.coolRate ?? 2;
    const drvBlowTemp = driverSpecs?.tjMax ?? 175;
    const midBlowTemp = midDriverSpecs?.tjMax ?? 175;
    const finBlowTemp = finalSpecs?.tjMax ?? 175;

    const interval = setInterval(() => {
      const now = Date.now();
      const dt = Math.min((now - lastTickRef.current) / 1000, 0.5);
      lastTickRef.current = now;

      const isKeyed = keyedRef.current;
      const isDriverBlown = driverBlownRef.current;
      const isMidDriverBlown = midDriverBlownRef.current;
      const isFinalBlown = finalBlownRef.current;
      const currentMicLevel = micLevelRef.current;

      const regs = config.regulatorVoltages || [14.2];
      const avgRegV = regs.reduce((a, b) => a + b, 0) / regs.length;
      const voltageStress = avgRegV > 15 ? 1 + (avgRegV - 15) * 0.4 : 1.0;

      const underDriven = checkUnderDriven(config.radio, driverSpecs, midDriverSpecs, finalSpecs, config.bonding, config.driveLevel, tickJumperConfig);
      const overDriveExcess = Math.max(0, underDriven.driveRatio - 1.0);
      const overDriveStress = overDriveExcess > 0 ? 1 + overDriveExcess * 2.5 + Math.pow(overDriveExcess, 2) * 3.0 : 1.0;

      setDriverTemp(prev => {
        if (isDriverBlown) return prev;
        if (!driverSpecs || driverSpecs.transistors <= 0) return Math.max(AMBIENT_TEMP, prev - drvCoolRate * dt);
        if (isKeyed) {
          const thermalMass = driverSpecs.transistors >= 2 ? Math.sqrt(driverSpecs.transistors / 2) : 1;
          const dkRatio = stages.driverLoadRatioDK;
          const pkRatio = stages.driverLoadRatioPK;
          const loadRatio = Math.max(0.05, dkRatio + (pkRatio - dkRatio) * currentMicLevel);
          const driverStress = dkRatio > 0.85 ? 1 + (dkRatio - 0.85) * 4.0 : 1.0;
          const heatRate = (HEAT_BASE_RATE / thermalMass) * loadRatio * voltageStress * driverStress * drvEffFactor;
          const coolDissipated = (prev - AMBIENT_TEMP) * (drvCoolRate / 50) * dt;
          const newTemp = prev + heatRate * dt - coolDissipated;
          if (newTemp >= drvBlowTemp) { setDriverBlown(true); driverBlownRef.current = true; return drvBlowTemp; }
          return newTemp;
        } else {
          return Math.max(AMBIENT_TEMP, prev - drvCoolRate * dt);
        }
      });

      setMidDriverTemp(prev => {
        if (isMidDriverBlown) return prev;
        if (!midDriverSpecs || midDriverSpecs.transistors <= 0) return Math.max(AMBIENT_TEMP, prev - midCoolRate * dt);
        if (isKeyed) {
          const thermalMass = midDriverSpecs.transistors >= 2 ? Math.sqrt(midDriverSpecs.transistors / 2) : 1;
          const dkRatio = stages.midDriverLoadRatioDK;
          const pkRatio = stages.midDriverLoadRatioPK;
          const loadRatio = Math.max(0.05, dkRatio + (pkRatio - dkRatio) * currentMicLevel);
          const heatRate = (HEAT_BASE_RATE / thermalMass) * loadRatio * voltageStress * midEffFactor;
          const coolDissipated = (prev - AMBIENT_TEMP) * (midCoolRate / 50) * dt;
          const newTemp = prev + heatRate * dt - coolDissipated;
          if (newTemp >= midBlowTemp) { setMidDriverBlown(true); midDriverBlownRef.current = true; return midBlowTemp; }
          return newTemp;
        } else {
          return Math.max(AMBIENT_TEMP, prev - midCoolRate * dt);
        }
      });

      setFinalTemp(prev => {
        if (isFinalBlown) return prev;
        if (!finalSpecs || finalSpecs.transistors <= 0) return Math.max(AMBIENT_TEMP, prev - finCoolRate * dt);
        if (isKeyed) {
          const thermalMass = finalSpecs.transistors >= 2 ? Math.sqrt(finalSpecs.transistors / 2) : 1;
          const dkRatio = stages.finalLoadRatioDK;
          const pkRatio = stages.finalLoadRatioPK;
          const loadRatio = Math.max(0.05, dkRatio + (pkRatio - dkRatio) * currentMicLevel);
          const heatRate = (HEAT_BASE_RATE / thermalMass) * loadRatio * voltageStress * overDriveStress * finEffFactor;
          const coolDissipated = (prev - AMBIENT_TEMP) * (finCoolRate / 50) * dt;
          const newTemp = prev + heatRate * dt - coolDissipated;
          if (newTemp >= finBlowTemp) { setFinalBlown(true); finalBlownRef.current = true; return finBlowTemp; }
          return newTemp;
        } else {
          return Math.max(AMBIENT_TEMP, prev - finCoolRate * dt);
        }
      });
    }, 100);

    return () => clearInterval(interval);
  }, [config]);

  // Build amp specs for calculations
  const driverSpecs = useMemo(() => getAmpSpecs(config.driverTransistor, config.driverBoxSize, config.driverHeatsink), [config.driverTransistor, config.driverBoxSize, config.driverHeatsink]);
  const midDriverSpecs = useMemo(() => getAmpSpecs(config.midDriverTransistor, config.midDriverBoxSize, config.midDriverHeatsink), [config.midDriverTransistor, config.midDriverBoxSize, config.midDriverHeatsink]);
  const finalSpecs = useMemo(() => getAmpSpecs(config.finalTransistor, config.finalBoxSize, config.finalHeatsink), [config.finalTransistor, config.finalBoxSize, config.finalHeatsink]);

  // Average regulator voltage (what the amps are actually fed)
  const regs = config.regulatorVoltages || [14.2];
  const avgRegV = regs.reduce((a, b) => a + b, 0) / regs.length;

  // Build jumper config object from state
  const jumperConfig = {
    radioToDriver: { cableType: config.jumperRadioToDriverType, lengthFt: config.jumperRadioToDriverLength },
    driverToMid: { cableType: config.jumperDriverToMidType, lengthFt: config.jumperDriverToMidLength },
    midToFinal: { cableType: config.jumperMidToFinalType, lengthFt: config.jumperMidToFinalLength },
  };

  // Calculate derived values - pass voltage to signal chain so watts scale with volts
  const chain = calculateSignalChain(config.radio, driverSpecs, midDriverSpecs, finalSpecs, config.bonding, config.antennaPosition, config.driveLevel, avgRegV, jumperConfig);
  const stages = calculateStageOutputs(config.radio, driverSpecs, midDriverSpecs, finalSpecs, config.bonding, config.driveLevel, jumperConfig);
  
  // SWR calculation - use Yagi SWR when in Yagi mode
  // Returns { atRadio, atAntenna } — feedline loss makes radio read lower
  const swrResult = config.yagiMode 
    ? calculateYagiSWR(config.vehicle, config.bonding, {
        stickType: config.yagiStickType,
        elementHeights: config.yagiElementHeights,
        elementPositions: config.yagiElementPositions,
        dir1OnTruck: config.yagiDir1OnTruck,
        coaxType: config.coaxType,
        coaxLengthFt: config.coaxLengthFt,
      })
    : calculateSWR(config.antenna, config.vehicle, config.bonding, config.tipLength, config.antennaPosition, config.coaxType, config.coaxLengthFt);
  const swr = swrResult.atRadio;
  const swrAtAntenna = swrResult.atAntenna;
  
  const takeoff = calculateTakeoffAngle(config.vehicle, config.bonding, {
    antennaPosition: config.antennaPosition,
    yagiMode: config.yagiMode,
    rideHeightOffset: config.rideHeightOffset,
  });
  const underDriven = checkUnderDriven(config.radio, driverSpecs, midDriverSpecs, finalSpecs, config.bonding, config.driveLevel, jumperConfig);

  // Actual current draw — proportional to load, swings with modulation
  const driverLoadRatio = stages.driverLoadRatioDK + (stages.driverLoadRatioPK - stages.driverLoadRatioDK) * micLevel;
  const midDriverLoadRatio = stages.midDriverLoadRatioDK + (stages.midDriverLoadRatioPK - stages.midDriverLoadRatioDK) * micLevel;
  const finalLoadRatio = stages.finalLoadRatioDK + (stages.finalLoadRatioPK - stages.finalLoadRatioDK) * micLevel;
  const driverCurrentDraw = driverSpecs?.currentDraw ?? 0;
  const midDriverCurrentDraw = midDriverSpecs?.currentDraw ?? 0;
  const finalCurrentDraw = finalSpecs?.currentDraw ?? 0;
  const driverActualAmps = keyed ? driverCurrentDraw * Math.max(0.05, driverLoadRatio) : 0;
  const midDriverActualAmps = keyed ? midDriverCurrentDraw * Math.max(0.05, midDriverLoadRatio) : 0;
  const finalActualAmps = keyed ? finalCurrentDraw * Math.max(0.05, finalLoadRatio) : 0;
  const actualDemand = driverActualAmps + midDriverActualAmps + finalActualAmps;

  // Voltage calculation uses actual demand when keyed
  const voltage = calculateVoltageDrop(driverSpecs, midDriverSpecs, finalSpecs, config.alternatorCount, config.alternatorAmps, config.batteryType, config.batteryCount, config.regulatorVoltages, keyed ? actualDemand : 0);

  // Apply blown amp — if blown, that stage produces nothing
  let effectiveChain = { ...chain };
  if (driverBlown || midDriverBlown) {
    effectiveChain.deadKey = 0;
    effectiveChain.peakKey = 0;
  }
  if (finalBlown && finalSpecs) {
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
    deadKeyWatts: Math.round(effectivePower.deadKey * 10) / 10 || 0,
    peakWatts: Math.round(effectivePower.peakKey * 10) / 10 || 0,
    // Bird Model 43 Average: carrier × (1 + m²/2) — barely moves with voice
    avgWatts: Math.round(effectivePower.deadKey * (1 + (micLevel * micLevel) / 2) * 10) / 10 || 0,
    // Bird Model 43P Peak (PEP): carrier × (1 + m)² — swings hard with voice, capped at system max
    peakSwingWatts: Math.round(Math.min(effectivePower.deadKey * Math.pow(1 + micLevel, 2), effectivePower.peakKey) * 10) / 10 || 0,
    micLevel: micLevel || 0,
    voltage: voltage.effectiveVoltage || 14.2,
    radioVoltage: RADIO_VOLTAGE,
    ampVoltage: Math.round(avgRegV * 10) / 10 || 14.2,
    voltageDrop: voltage.voltageDrop || 0,
    overloaded: voltage.overloaded || false,
    highVoltageWarn: avgRegV >= 19,
    currentDraw: voltage.currentDraw || 0,
    driverAmps: Math.round(driverActualAmps * 10) / 10 || 0,
    midDriverAmps: Math.round(midDriverActualAmps * 10) / 10 || 0,
    finalAmps: Math.round(finalActualAmps * 10) / 10 || 0,
    alternatorCapacity: voltage.alternatorCapacity || 0,
    bankProvides: voltage.bankProvides || 0,
    altProvides: voltage.altProvides || 0,
    holdTimeSec: voltage.holdTimeSec || 0,
    bankAh: voltage.bankAh || 0,
    swr: swr || 1.5,
    swrAtAntenna: swrAtAntenna || 1.5,
    // Instantaneous modulated power for canvas visualization
    modulatedWatts: Math.round(
      Math.min(effectivePower.deadKey * Math.pow(1 + (micLevel || 0), 2), effectivePower.peakKey) * 10
    ) / 10 || 0,
    takeoffAngle: takeoff || 22,
    underDriven: underDriven.isUnderDriven,
    driveRatio: underDriven.driveRatio,
    driveWatts: underDriven.driveWatts,
    finalCapacity: underDriven.finalCapacity,
    idealDrive: underDriven.idealDrive,
    // Thermal
    driverTemp: Math.round(driverTemp),
    midDriverTemp: Math.round(midDriverTemp),
    finalTemp: Math.round(finalTemp),
    driverBlown,
    midDriverBlown,
    finalBlown,
  };

  return (
    <RFContext.Provider value={{ config, keyed, setKeyed, updateConfig, loadConfig, metrics, micEnabled, toggleMic, resetAmp, equipmentLoaded, runThermalPreview, driverSpecs, midDriverSpecs, finalSpecs, jumperConfig }}>
      {children}
    </RFContext.Provider>
  );
}

export const useRF = () => useContext(RFContext);
