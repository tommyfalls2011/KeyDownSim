// ─── RF Equipment Database ───

export const RADIOS = {
  'cobra-29': { name: 'Cobra 29 LTD', deadKey: 1, peakKey: 4, type: 'AM', impedance: 50 },
  'galaxy-959': { name: 'Galaxy DX 959', deadKey: 5, peakKey: 15, type: 'AM/SSB', impedance: 50 },
  'stryker-955': { name: 'Stryker SR-955HPC', deadKey: 8, peakKey: 25, type: 'AM/SSB', impedance: 50 },
  'connex-4300': { name: 'Connex 4300HP', deadKey: 10, peakKey: 30, type: 'AM/SSB', impedance: 50 },
  'ranger-rci2970': { name: 'Ranger RCI-2970N2', deadKey: 12, peakKey: 40, type: 'AM/SSB', impedance: 50 },
};

export const DRIVER_AMPS = {
  'none': { name: 'No Driver', gainDB: 0, transistors: 0, currentDraw: 0, wattsPerPill: 275, combiningStages: 0 },
  '2-pill': { name: '2-Pill Driver', gainDB: 17, transistors: 2, currentDraw: 50, wattsPerPill: 275, combiningStages: 0 },
  '4-pill': { name: '4-Pill Driver', gainDB: 20, transistors: 4, currentDraw: 100, wattsPerPill: 275, combiningStages: 1 },
};

export const FINAL_AMPS = {
  'none': { name: 'No Final', gainDB: 0, transistors: 0, currentDraw: 0, wattsPerPill: 275, combiningStages: 0 },
  '4-pill': { name: '4-Pill Amp', gainDB: 10, transistors: 4, currentDraw: 100, wattsPerPill: 275, combiningStages: 1 },
  '8-pill': { name: '8-Pill Amp', gainDB: 10, transistors: 8, currentDraw: 200, wattsPerPill: 275, combiningStages: 2 },
  '16-pill': { name: '16-Pill Amp', gainDB: 13, transistors: 16, currentDraw: 400, wattsPerPill: 275, combiningStages: 4 },
};

const COMBINING_BONUS_PER_STAGE = 1.2;

export const ANTENNAS = {
  'whip-102': { name: '102" Whip', gainDBI: 0, type: 'vertical' },
  'center-load': { name: 'Center-Load', gainDBI: -1.5, type: 'vertical' },
  'wilson-1000': { name: 'Wilson 1000', gainDBI: 3, type: 'mag-mount' },
  'predator-10k': { name: 'Predator 10K', gainDBI: 5, type: 'base-load' },
};

export const VEHICLES = {
  'suburban': { name: 'Suburban/SUV', groundPlane: 0.85, directional: 0.15, takeoff: 25, shape: 'suv' },
  'f150': { name: 'Ford F-150', groundPlane: 0.65, directional: 0.45, takeoff: 35, shape: 'truck' },
  'ram': { name: 'Dodge Ram', groundPlane: 0.70, directional: 0.40, takeoff: 32, shape: 'truck' },
  'van': { name: 'Cargo Van', groundPlane: 0.90, directional: 0.10, takeoff: 20, shape: 'van' },
  'wagon': { name: 'Station Wagon', groundPlane: 0.80, directional: 0.20, takeoff: 28, shape: 'wagon' },
};

// Antenna mount positions — the pattern is DRAWN TOWARD the metal surface
// More metal in a direction = more signal that way
// biasAngle: direction the signal pulls toward (canvas coords: 0=E, 90=S, 180=W, 270=N/front)
// biasStrength: how much the pattern skews (0=omni, higher=more directional)
// xOffset/yOffset: position on vehicle visual (-1 to 1, 0=center)
export const ANTENNA_POSITIONS = {
  'center':     { name: 'Center Roof',  biasAngle: 270, biasStrength: 0.0,  xOffset: 0,    yOffset: 0 },
  'rear':       { name: 'Rear Mount',   biasAngle: 270, biasStrength: 0.7,  xOffset: 0,    yOffset: 0.8 },
  'front':      { name: 'Front Mount',  biasAngle: 90,  biasStrength: 0.5,  xOffset: 0,    yOffset: -0.8 },
  'back-right': { name: 'Back Right',   biasAngle: 225, biasStrength: 0.65, xOffset: 0.7,  yOffset: 0.7 },
  'back-left':  { name: 'Back Left',    biasAngle: 315, biasStrength: 0.65, xOffset: -0.7, yOffset: 0.7 },
};

// ─── Calculation Functions ───

export function calculateSignalChain(radioKey, driverKey, finalKey, bonding) {
  const radio = RADIOS[radioKey] || RADIOS['cobra-29'];
  const driver = DRIVER_AMPS[driverKey] || DRIVER_AMPS['none'];
  const final_ = FINAL_AMPS[finalKey] || FINAL_AMPS['none'];

  let deadKey = radio.deadKey;
  let peakKey = radio.peakKey;

  // Driver stage: high gain but capped at pills x wpp x compounded combining bonus
  if (driver.gainDB > 0) {
    const driverGain = Math.pow(10, driver.gainDB / 10);
    const stages = driver.combiningStages || 0;
    const combining = Math.pow(COMBINING_BONUS_PER_STAGE, stages);
    const driverMax = driver.transistors * (driver.wattsPerPill || 275) * combining;
    deadKey = Math.min(deadKey * driverGain, driverMax);
    peakKey = Math.min(peakKey * driverGain, driverMax);
  }

  // Final stage: lower gain but capped at pills x wpp x compounded combining bonus
  if (final_.gainDB > 0) {
    const finalGain = Math.pow(10, final_.gainDB / 10);
    const stages = final_.combiningStages || 0;
    const combining = Math.pow(COMBINING_BONUS_PER_STAGE, stages);
    const finalMax = final_.transistors * (final_.wattsPerPill || 275) * combining;
    deadKey = Math.min(deadKey * finalGain, finalMax);
    peakKey = Math.min(peakKey * finalGain, finalMax);
  }

  const bondingFactor = bonding ? 1.0 : 0.6;
  return {
    deadKey: deadKey * bondingFactor,
    peakKey: peakKey * bondingFactor,
  };
}

export function calculateVoltageDrop(driverKey, finalKey, alternatorCount, alternatorAmps, batteryType, batteryCount) {
  const driver = DRIVER_AMPS[driverKey] || DRIVER_AMPS['none'];
  const final_ = FINAL_AMPS[finalKey] || FINAL_AMPS['none'];

  const demandCurrent = driver.currentDraw + final_.currentDraw;
  const batteryVoltage = 14.2;
  const alternatorMax = alternatorCount * alternatorAmps * 1.08;

  // 0 AWG OFC wire
  const wireResistance = (0.0001 * 12) / Math.max(1, alternatorCount);

  // Battery bank specs — Ah, C rating, internal resistance per unit
  const BATTERY_SPECS = {
    'none':    { ah: 0,   cRate: 0,  internalR: 999,   name: 'No Bank' },
    'lead':    { ah: 100, cRate: 3,  internalR: 0.012, name: 'Lead Acid' },
    'agm':     { ah: 100, cRate: 5,  internalR: 0.006, name: 'AGM' },
    'lithium': { ah: 100, cRate: 15, internalR: 0.002, name: 'Lithium' },
    'caps':    { ah: 5,   cRate: 200,internalR: 0.0005,name: 'Cap Bank' },
  };

  const batt = BATTERY_SPECS[batteryType] || BATTERY_SPECS['none'];
  const bankAh = batt.ah * (batteryCount || 0);
  // Max discharge = total Ah × C rating
  const bankMaxDischarge = bankAh * batt.cRate;
  // Bank internal resistance drops with parallel batteries
  const bankResistance = batteryCount > 0 ? batt.internalR / batteryCount : 999;

  // Battery bank takes most of the load — it's the primary power source
  // Alternator recharges the bank and covers what it can in steady state
  const bankProvides = Math.min(demandCurrent, bankMaxDischarge);
  // Whatever the bank can't cover, alternator tries to supplement directly
  const altDirect = Math.min(Math.max(0, demandCurrent - bankProvides), alternatorMax);
  const actualCurrent = bankProvides + altDirect;
  const overloaded = demandCurrent > (bankMaxDischarge + alternatorMax);

  // Voltage drop from bank internal resistance under load
  const bankDrop = bankProvides * bankResistance;
  // Wire drop from alternator's contribution
  const wireDrop = altDirect * wireResistance;

  let voltage = batteryVoltage - bankDrop - wireDrop;

  if (overloaded) {
    const demandRatio = demandCurrent / (bankMaxDischarge + alternatorMax);
    const sag = Math.min(4.5, (demandRatio - 1) * 2.5);
    voltage -= sag;
  }

  voltage = Math.max(8.0, voltage);

  // How long can the bank sustain this key-down (in seconds)?
  // Net drain = what bank provides minus what alternator recharges
  const altRechargeRate = Math.min(alternatorMax, alternatorMax); // alt charges bank when not overloaded
  const netBankDrain = Math.max(0, bankProvides - altRechargeRate);
  // Time = Ah capacity / net drain amps × 3600 (convert to seconds)
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

export function calculateSWR(antennaKey, vehicleKey, bonding) {
  const antenna = ANTENNAS[antennaKey] || ANTENNAS['whip-102'];
  const vehicle = VEHICLES[vehicleKey] || VEHICLES['suburban'];

  // Base SWR — a perfect antenna on a perfect ground plane
  let baseSWR = 1.0;
  if (antenna.type === 'mag-mount') baseSWR = 1.2;
  else if (antenna.type === 'base-load') baseSWR = 1.1;

  // Vehicle surface area penalty — less metal = worse SWR
  const surfacePenalty = (1 - vehicle.groundPlane) * 2.5;
  let swr = baseSWR + surfacePenalty;

  // Poor bonding — panels not connected, ground plane is fragmented
  if (!bonding) {
    swr += 0.9;
  }

  return Math.round(Math.max(1.0, swr) * 10) / 10;
}

export function calculateTakeoffAngle(vehicleKey, bonding) {
  const vehicle = VEHICLES[vehicleKey] || VEHICLES['suburban'];
  const bondingPenalty = bonding ? 0 : 15;
  return vehicle.takeoff + bondingPenalty;
}

// ─── Under-Driven Detection ───

export function checkUnderDriven(radioKey, driverKey, finalKey, bonding) {
  const radio = RADIOS[radioKey] || RADIOS['cobra-29'];
  const driver = DRIVER_AMPS[driverKey] || DRIVER_AMPS['none'];
  const final_ = FINAL_AMPS[finalKey] || FINAL_AMPS['none'];

  if (final_.gainDB <= 0) return { isUnderDriven: false, driveRatio: 1.0, driveWatts: 0, finalCapacity: 0 };

  // Calculate what driver stage outputs (power going INTO the final amp)
  let driveWatts = radio.deadKey;
  if (driver.gainDB > 0) {
    const driverGain = Math.pow(10, driver.gainDB / 10);
    const stages = driver.combiningStages || 0;
    const combining = Math.pow(COMBINING_BONUS_PER_STAGE, stages);
    const driverMax = driver.transistors * (driver.wattsPerPill || 275) * combining;
    driveWatts = Math.min(driveWatts * driverGain, driverMax);
  }

  // What the final amp needs to be fully driven (ideal input)
  // Final amp max output / final gain = ideal input
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

// ─── Radiation Pattern Calculation ───

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
    // Base omnidirectional pattern
    let gain = 1.0;
    // Vehicle body directional modification (trucks have natural forward bias)
    gain += dir * Math.cos(rad - 3 * Math.PI / 2) * 0.3;
    // Antenna position — signal is DRAWN TOWARD the metal surface
    // Where there's lots of metal = strong signal, where there's no metal = weak
    if (pos.biasStrength > 0) {
      const angleDiff = rad - biasRad;
      const towardMetal = Math.cos(angleDiff);
      // Strong gain toward metal, heavy suppression away from metal
      gain += pos.biasStrength * towardMetal * 1.2;
      // Where there's no metal behind the mount — signal drops off hard
      if (towardMetal < -0.3) {
        gain *= (1.0 - pos.biasStrength * 0.6);
      }
    }
    // Ground plane quality affects uniformity
    gain *= (0.5 + gp * 0.5);
    // Add noise if bonding is poor
    if (!bonding) {
      gain += (Math.sin(angle * 7) * 0.15 + Math.cos(angle * 11) * 0.1);
    }
    // Antenna gain
    gain *= antennaGain;
    // Normalize and scale by power — log scale so pattern grows visibly across the full range
    const scaledGain = Math.max(0.1, gain) * Math.log10(Math.max(1, power) + 1) / 4;
    points.push({ angle, gain: scaledGain });
  }
  return points;
}
