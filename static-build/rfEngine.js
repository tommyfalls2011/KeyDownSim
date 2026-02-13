// Static RF Engine - All equipment hardcoded, no API calls
// This version is for standalone deployment on sma-antenna.org

// ─── RF Equipment Database (Hardcoded) ───

export const RADIOS = {
  'cobra-29': { name: 'Cobra 29 LTD', deadKey: 0.75, peakKey: 25, type: 'AM', impedance: 50 },
  'galaxy-959': { name: 'Galaxy DX 959', deadKey: 2, peakKey: 40, type: 'AM/SSB', impedance: 50 },
  'stryker-955': { name: 'Stryker SR-955HPC', deadKey: 3, peakKey: 125, type: 'AM/SSB', impedance: 50 },
  'connex-4300': { name: 'Connex 4300HP', deadKey: 3.5, peakKey: 160, type: 'AM/SSB', impedance: 50 },
  'ranger-rci2970': { name: 'Ranger RCI-2970N2', deadKey: 4, peakKey: 225, type: 'AM/SSB', impedance: 50 },
  'president-lincoln': { name: 'President Lincoln II+', deadKey: 3, peakKey: 80, type: 'AM/SSB', impedance: 50 },
  'general-lee': { name: 'General Lee', deadKey: 2.5, peakKey: 50, type: 'AM', impedance: 50 },
  'uniden-980': { name: 'Uniden 980SSB', deadKey: 1.5, peakKey: 35, type: 'AM/SSB', impedance: 50 },
};

export const DRIVER_AMPS = {
  'none': { name: 'No Driver', gainDB: 0, transistors: 0, currentDraw: 0, wattsPerPill: 275, combiningStages: 0 },
  '1-pill': { name: '1-Pill Driver', gainDB: 13, transistors: 1, currentDraw: 15, wattsPerPill: 275, combiningStages: 0 },
  '2-pill': { name: '2-Pill Driver', gainDB: 17, transistors: 2, currentDraw: 50, wattsPerPill: 275, combiningStages: 0 },
  '3-pill': { name: '3-Pill Driver', gainDB: 13, transistors: 3, currentDraw: 60, wattsPerPill: 275, combiningStages: 0 },
  '4-pill': { name: '4-Pill Driver', gainDB: 20, transistors: 4, currentDraw: 100, wattsPerPill: 275, combiningStages: 1 },
};

export const FINAL_AMPS = {
  'none': { name: 'No Final', gainDB: 0, transistors: 0, currentDraw: 0, wattsPerPill: 275, combiningStages: 0 },
  '2-pill': { name: '2-Pill Comp', gainDB: 10, transistors: 2, currentDraw: 50, wattsPerPill: 275, combiningStages: 0 },
  '4-pill': { name: '4-Pill Amp', gainDB: 10, transistors: 4, currentDraw: 100, wattsPerPill: 275, combiningStages: 1 },
  '8-pill': { name: '8-Pill Amp', gainDB: 10, transistors: 8, currentDraw: 200, wattsPerPill: 275, combiningStages: 2 },
  '16-pill': { name: '16-Pill Amp', gainDB: 13, transistors: 16, currentDraw: 400, wattsPerPill: 275, combiningStages: 4 },
  '24-pill': { name: '24-Pill Comp', gainDB: 14, transistors: 24, currentDraw: 600, wattsPerPill: 275, combiningStages: 6 },
  '32-pill': { name: '32-Pill Comp', gainDB: 15, transistors: 32, currentDraw: 800, wattsPerPill: 275, combiningStages: 8 },
};

export const ANTENNAS = {
  'whip-102': { name: '102" Stainless Whip', gainDBI: 0, type: 'vertical', tunable: false },
  'center-load': { name: 'Center-Load', gainDBI: -1.5, type: 'vertical', tunable: false },
  'wilson-1000': { name: 'Wilson 1000', gainDBI: 3, type: 'mag-mount', tunable: false },
  'predator-k1-9': { name: 'Predator 10K K-1-9 (9" shaft)', gainDBI: 4, type: 'base-load', tunable: true, tipMin: 30, tipMax: 58, tipDefault: 48 },
  'predator-k1-12': { name: 'Predator 10K K-1-12 (12" shaft)', gainDBI: 4.5, type: 'base-load', tunable: true, tipMin: 30, tipMax: 58, tipDefault: 46 },
  'predator-k1-17': { name: 'Predator 10K K-1-17 (17" shaft)', gainDBI: 5, type: 'base-load', tunable: true, tipMin: 30, tipMax: 58, tipDefault: 44 },
  'predator-k1-22': { name: 'Predator 10K K-1-22 (22" shaft)', gainDBI: 5.5, type: 'base-load', tunable: true, tipMin: 28, tipMax: 56, tipDefault: 42 },
  'predator-k1-27': { name: 'Predator 10K K-1-27 (27" shaft)', gainDBI: 6, type: 'base-load', tunable: true, tipMin: 28, tipMax: 49, tipDefault: 40 },
  'predator-k2-9': { name: 'Predator 20K K-2-9 Double Coil', gainDBI: 6.5, type: 'base-load', tunable: true, tipMin: 28, tipMax: 56, tipDefault: 44 },
  'predator-k2-12': { name: 'Predator 20K K-2-12 Double Coil (12")', gainDBI: 7, type: 'base-load', tunable: true, tipMin: 28, tipMax: 56, tipDefault: 42 },
  'predator-k2-17': { name: 'Predator 20K K-2-17 Double Coil (17")', gainDBI: 7.5, type: 'base-load', tunable: true, tipMin: 26, tipMax: 54, tipDefault: 40 },
  'predator-comp-9': { name: 'Predator Comp 9" Adj', gainDBI: 5, type: 'base-load', tunable: true, tipMin: 26, tipMax: 58, tipDefault: 46 },
  'predator-comp-12': { name: 'Predator Comp 12" Adj', gainDBI: 5.5, type: 'base-load', tunable: true, tipMin: 26, tipMax: 58, tipDefault: 44 },
  'predator-comp-17': { name: 'Predator Comp 17" Adj', gainDBI: 6, type: 'base-load', tunable: true, tipMin: 26, tipMax: 56, tipDefault: 42 },
  'predator-comp-22': { name: 'Predator Comp 22" Adj', gainDBI: 6.5, type: 'base-load', tunable: true, tipMin: 24, tipMax: 54, tipDefault: 40 },
  'fight-stix-6': { name: "Fight Stix 6' (4ft shaft + whip)", gainDBI: 4.5, type: 'vertical', tunable: true, tipMin: 36, tipMax: 60, tipDefault: 52 },
  'fight-stix-8': { name: "Fight Stix 8' (6ft shaft + whip)", gainDBI: 5.5, type: 'vertical', tunable: true, tipMin: 36, tipMax: 60, tipDefault: 50 },
  'fight-stix-10': { name: "Fight Stix 10' (8ft shaft + whip)", gainDBI: 7, type: 'vertical', tunable: true, tipMin: 36, tipMax: 60, tipDefault: 50 },
  'fight-stix-12': { name: "Fight Stix 12' (10ft shaft + whip)", gainDBI: 8, type: 'vertical', tunable: true, tipMin: 34, tipMax: 58, tipDefault: 48 },
};

export const VEHICLES = {
  'suburban': { name: 'Suburban/SUV', groundPlane: 0.88, surfaceSqFt: 42, directional: 0.12, takeoff: 22, shape: 'suv' },
  'f150': { name: 'Ford F-150', groundPlane: 0.62, surfaceSqFt: 28, directional: 0.48, takeoff: 35, shape: 'truck' },
  'ram': { name: 'Dodge Ram', groundPlane: 0.68, surfaceSqFt: 31, directional: 0.42, takeoff: 32, shape: 'truck' },
  'van': { name: 'Cargo Van', groundPlane: 0.92, surfaceSqFt: 52, directional: 0.08, takeoff: 18, shape: 'van' },
  'wagon': { name: 'Station Wagon', groundPlane: 0.80, surfaceSqFt: 36, directional: 0.20, takeoff: 26, shape: 'wagon' },
  'semi': { name: 'Semi Truck', groundPlane: 0.95, surfaceSqFt: 65, directional: 0.05, takeoff: 15, shape: 'semi' },
  'jeep': { name: 'Jeep Wrangler', groundPlane: 0.55, surfaceSqFt: 22, directional: 0.55, takeoff: 40, shape: 'jeep' },
};

export const ANTENNA_POSITIONS = {
  'center':     { name: 'Center Roof',  biasAngle: 270, biasStrength: 0.0,  dBLoss: 0,   xOffset: 0,    yOffset: 0 },
  'rear':       { name: 'Rear Mount',   biasAngle: 270, biasStrength: 0.7,  dBLoss: 2.1, xOffset: 0,    yOffset: 0.8 },
  'front':      { name: 'Front Mount',  biasAngle: 90,  biasStrength: 0.5,  dBLoss: 1.5, xOffset: 0,    yOffset: -0.8 },
  'back-right': { name: 'Back Right',   biasAngle: 225, biasStrength: 0.65, dBLoss: 2.8, xOffset: 0.7,  yOffset: 0.7 },
  'back-left':  { name: 'Back Left',    biasAngle: 315, biasStrength: 0.65, dBLoss: 2.8, xOffset: -0.7, yOffset: 0.7 },
};

const COMBINING_BONUS_PER_STAGE = 1.2;

// ─── Calculation Functions ───

export function calculateStageOutputs(radioKey, driverKey, finalKey, bonding, driveLevel) {
  const radio = RADIOS[radioKey] || RADIOS['cobra-29'];
  const driver = DRIVER_AMPS[driverKey] || DRIVER_AMPS['none'];
  const final_ = FINAL_AMPS[finalKey] || FINAL_AMPS['none'];
  const bondingFactor = bonding ? 1.0 : 0.6;
  const dl = driveLevel ?? 1.0;

  const radioDK = radio.deadKey * dl;
  const radioPK = radio.peakKey * dl;

  let driverOutDK = 0, driverOutPK = 0, driverMax = 0;
  let inputToFinalDK = radioDK;
  let inputToFinalPK = radioPK;

  if (driver.gainDB > 0) {
    const driverGain = Math.pow(10, driver.gainDB / 10);
    const stages = driver.combiningStages || 0;
    const combining = Math.pow(COMBINING_BONUS_PER_STAGE, stages);
    driverMax = driver.transistors * (driver.wattsPerPill || 275) * combining;
    driverOutDK = Math.min(radioDK * driverGain, driverMax);
    driverOutPK = Math.min(radioPK * driverGain, driverMax);
    inputToFinalDK = driverOutDK;
    inputToFinalPK = driverOutPK;
  }

  let finalOutDK = 0, finalOutPK = 0, finalMax = 0;
  if (final_.gainDB > 0) {
    const finalGain = Math.pow(10, final_.gainDB / 10);
    const stages = final_.combiningStages || 0;
    const combining = Math.pow(COMBINING_BONUS_PER_STAGE, stages);
    finalMax = final_.transistors * (final_.wattsPerPill || 275) * combining;
    finalOutDK = Math.min(inputToFinalDK * finalGain, finalMax);
    finalOutPK = Math.min(inputToFinalPK * finalGain, finalMax);
  }

  return {
    driverMax,
    driverLoadRatioDK: driverMax > 0 ? Math.min(1, (driverOutDK * bondingFactor) / driverMax) : 0,
    driverLoadRatioPK: driverMax > 0 ? Math.min(1, (driverOutPK * bondingFactor) / driverMax) : 0,
    finalMax,
    finalLoadRatioDK: finalMax > 0 ? Math.min(1, (finalOutDK * bondingFactor) / finalMax) : 0,
    finalLoadRatioPK: finalMax > 0 ? Math.min(1, (finalOutPK * bondingFactor) / finalMax) : 0,
  };
}

export function calculateSignalChain(radioKey, driverKey, finalKey, bonding, antennaPosKey, driveLevel, ampVoltage) {
  const radio = RADIOS[radioKey] || RADIOS['cobra-29'];
  const driver = DRIVER_AMPS[driverKey] || DRIVER_AMPS['none'];
  const final_ = FINAL_AMPS[finalKey] || FINAL_AMPS['none'];
  const dl = driveLevel ?? 1.0;

  // Voltage scaling: amps are rated at ~13.8V nominal
  const nominalVoltage = 13.8;
  const voltage = ampVoltage ?? 14.2;
  const vRatio = voltage / nominalVoltage;
  const voltageBoost = (vRatio + vRatio * vRatio) / 2;

  let deadKey = radio.deadKey * dl;
  let peakKey = radio.peakKey * dl;

  if (driver.gainDB > 0) {
    const driverGain = Math.pow(10, driver.gainDB / 10);
    const stages = driver.combiningStages || 0;
    const combining = Math.pow(COMBINING_BONUS_PER_STAGE, stages);
    const driverMax = driver.transistors * (driver.wattsPerPill || 275) * combining * voltageBoost;
    deadKey = Math.min(deadKey * driverGain * voltageBoost, driverMax);
    peakKey = Math.min(peakKey * driverGain * voltageBoost, driverMax);
  }

  if (final_.gainDB > 0) {
    const finalGain = Math.pow(10, final_.gainDB / 10);
    const stages = final_.combiningStages || 0;
    const combining = Math.pow(COMBINING_BONUS_PER_STAGE, stages);
    const finalMax = final_.transistors * (final_.wattsPerPill || 275) * combining * voltageBoost;
    deadKey = Math.min(deadKey * finalGain * voltageBoost, finalMax);
    peakKey = Math.min(peakKey * finalGain * voltageBoost, finalMax);
  }

  const bondingFactor = bonding ? 1.0 : 0.6;
  return {
    deadKey: deadKey * bondingFactor,
    peakKey: peakKey * bondingFactor,
  };
}

export function calculateVoltageDrop(driverKey, finalKey, alternatorCount, alternatorAmps, batteryType, batteryCount, regulatorVoltages, actualDemandCurrent) {
  const driver = DRIVER_AMPS[driverKey] || DRIVER_AMPS['none'];
  const final_ = FINAL_AMPS[finalKey] || FINAL_AMPS['none'];

  const ratedMax = driver.currentDraw + final_.currentDraw;
  const demandCurrent = actualDemandCurrent !== undefined ? actualDemandCurrent : ratedMax;

  const regs = regulatorVoltages || [14.2];
  const regCount = regs.length;
  const altsPerReg = Math.ceil(alternatorCount / Math.max(1, regCount));
  let weightedVoltage = 0;
  let totalAltsAssigned = 0;
  for (let i = 0; i < regCount; i++) {
    const altsThisReg = Math.min(altsPerReg, alternatorCount - totalAltsAssigned);
    if (altsThisReg > 0) {
      weightedVoltage += regs[i] * altsThisReg;
      totalAltsAssigned += altsThisReg;
    }
  }
  const batteryVoltage = totalAltsAssigned > 0 ? weightedVoltage / totalAltsAssigned : 14.2;

  const alternatorMax = alternatorCount * alternatorAmps * 1.08;
  const wireResistance = (0.0001 * 12) / Math.max(1, alternatorCount);

  const BATTERY_SPECS = {
    'none':    { ah: 0,   cRate: 0,  internalR: 999,   name: 'No Bank' },
    'lead':    { ah: 100, cRate: 3,  internalR: 0.012, name: 'Lead Acid' },
    'agm':     { ah: 100, cRate: 5,  internalR: 0.006, name: 'AGM' },
    'lithium': { ah: 100, cRate: 15, internalR: 0.002, name: 'Lithium' },
    'caps':    { ah: 5,   cRate: 200,internalR: 0.0005,name: 'Cap Bank' },
  };

  const batt = BATTERY_SPECS[batteryType] || BATTERY_SPECS['none'];
  const bankAh = batt.ah * (batteryCount || 0);
  const bankMaxDischarge = bankAh * batt.cRate;
  const bankResistance = batteryCount > 0 ? batt.internalR / batteryCount : 999;

  const bankProvides = Math.min(demandCurrent, bankMaxDischarge);
  const altDirect = Math.min(Math.max(0, demandCurrent - bankProvides), alternatorMax);
  const actualCurrent = bankProvides + altDirect;
  const overloaded = demandCurrent > (bankMaxDischarge + alternatorMax);

  const bankDrop = bankProvides * bankResistance;
  const wireDrop = altDirect * wireResistance;

  let voltage = batteryVoltage - bankDrop - wireDrop;

  if (overloaded) {
    const demandRatio = demandCurrent / (bankMaxDischarge + alternatorMax);
    const sag = Math.min(4.5, (demandRatio - 1) * 2.5);
    voltage -= sag;
  }

  voltage = Math.max(8.0, voltage);

  const altRechargeRate = Math.min(alternatorMax, alternatorMax);
  const netBankDrain = Math.max(0, bankProvides - altRechargeRate);
  const holdTimeSec = netBankDrain > 0 ? (bankAh / netBankDrain) * 3600 : 9999;

  return {
    effectiveVoltage: Math.round(voltage * 100) / 100,
    voltageDrop: Math.round((batteryVoltage - voltage) * 1000) / 1000,
    overloaded,
    currentDraw: Math.round(actualCurrent),
    demandCurrent,
    alternatorCapacity: Math.round(alternatorMax),
    bankMaxDischarge: Math.round(bankMaxDischarge),
    bankProvides: Math.round(bankProvides),
    altProvides: Math.round(altDirect),
    holdTimeSec: Math.round(holdTimeSec),
    bankAh,
  };
}

export function calculateSWR(antennaKey, vehicleKey, bonding, tipLength) {
  const antenna = ANTENNAS[antennaKey] || ANTENNAS['whip-102'];
  const vehicle = VEHICLES[vehicleKey] || VEHICLES['suburban'];

  let baseSWR = 1.0;
  if (antenna.type === 'mag-mount') baseSWR = 1.2;
  else if (antenna.type === 'base-load') baseSWR = 1.05;

  const surfacePenalty = (1 - vehicle.groundPlane) * 2.5;
  let swr = baseSWR + surfacePenalty;

  if (!bonding) {
    swr += 0.9;
  }

  if (antenna.tunable && tipLength !== undefined) {
    const sweetSpot = antenna.tipDefault || 44;
    const deviation = Math.abs(tipLength - sweetSpot);
    const tipPenalty = deviation * 0.05;
    const tipBonus = Math.max(0, 0.4 - tipPenalty);
    swr = swr - tipBonus + Math.max(0, tipPenalty - 0.4) * 0.5;
  }

  return Math.round(Math.max(1.0, swr) * 10) / 10;
}

export function calculateTakeoffAngle(vehicleKey, bonding) {
  const vehicle = VEHICLES[vehicleKey] || VEHICLES['suburban'];
  const bondingPenalty = bonding ? 0 : 15;
  return vehicle.takeoff + bondingPenalty;
}

export function checkUnderDriven(radioKey, driverKey, finalKey, bonding, driveLevel) {
  const radio = RADIOS[radioKey] || RADIOS['cobra-29'];
  const driver = DRIVER_AMPS[driverKey] || DRIVER_AMPS['none'];
  const final_ = FINAL_AMPS[finalKey] || FINAL_AMPS['none'];
  const dl = driveLevel ?? 1.0;

  if (final_.gainDB <= 0) return { isUnderDriven: false, driveRatio: 1.0, driveWatts: 0, finalCapacity: 0 };

  let driveWatts = radio.deadKey * dl;
  if (driver.gainDB > 0) {
    const driverGain = Math.pow(10, driver.gainDB / 10);
    const stages = driver.combiningStages || 0;
    const combining = Math.pow(COMBINING_BONUS_PER_STAGE, stages);
    const driverMax = driver.transistors * (driver.wattsPerPill || 275) * combining;
    driveWatts = Math.min(driveWatts * driverGain, driverMax);
  }

  const finalGain = Math.pow(10, final_.gainDB / 10);
  const stages = final_.combiningStages || 0;
  const combining = Math.pow(COMBINING_BONUS_PER_STAGE, stages);
  const finalCapacity = final_.transistors * (final_.wattsPerPill || 275) * combining;
  const idealDrive = finalCapacity / finalGain;

  const driveRatio = driveWatts / idealDrive;

  return {
    isUnderDriven: driveRatio < 0.6,
    driveRatio: Math.round(driveRatio * 100) / 100,
    driveWatts: Math.round(driveWatts),
    finalCapacity: Math.round(finalCapacity),
    idealDrive: Math.round(idealDrive),
  };
}

export function getRadiationPattern(vehicleKey, bonding, power, antennaKey, antennaPosKey) {
  const vehicle = VEHICLES[vehicleKey] || VEHICLES['suburban'];
  const antenna = ANTENNAS[antennaKey] || ANTENNAS['whip-102'];
  const pos = ANTENNA_POSITIONS[antennaPosKey] || ANTENNA_POSITIONS['center'];
  const points = [];
  const dir = vehicle.directional;
  const gp = vehicle.groundPlane * (bonding ? 1.0 : 0.5);
  const antennaGain = Math.pow(10, antenna.gainDBI / 10);
  const biasRad = (pos.biasAngle * Math.PI) / 180;

  for (let angle = 0; angle < 360; angle += 2) {
    const rad = (angle * Math.PI) / 180;
    let gain = 1.0;
    gain += dir * Math.cos(rad - 3 * Math.PI / 2) * 0.3;
    if (pos.biasStrength > 0) {
      const angleDiff = rad - biasRad;
      gain *= (1.0 + pos.biasStrength * Math.cos(angleDiff) * 0.8);
    }
    gain *= (0.5 + gp * 0.5);
    if (!bonding) {
      gain += (Math.sin(angle * 7) * 0.15 + Math.cos(angle * 11) * 0.1);
    }
    gain *= antennaGain;
    const scaledGain = Math.max(0.1, gain) * Math.log10(Math.max(1, power) + 1) / 4;
    points.push({ angle, gain: scaledGain });
  }
  return points;
}
