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
  '16-pill': { name: '16-Pill Amp', gainDB: 10, transistors: 16, currentDraw: 400, wattsPerPill: 275, combiningStages: 4 },
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
  // Alternator can push ~8% over rating briefly
  const alternatorMax = alternatorCount * alternatorAmps * 1.08;

  // 0 AWG OFC wire: ~0.0001 ohms/ft, 12ft round trip, one run per alt
  const wireResistance = (0.0001 * 12) / alternatorCount;

  // Battery bank specs — internal resistance and burst current per unit
  const BATTERY_SPECS = {
    'none':    { internalR: 999,    burstAmps: 0,   name: 'No Bank' },
    'lead':    { internalR: 0.015,  burstAmps: 120, name: 'Lead Acid' },
    'agm':     { internalR: 0.007,  burstAmps: 200, name: 'AGM' },
    'lithium': { internalR: 0.0025, burstAmps: 400, name: 'Lithium' },
    'caps':    { internalR: 0.001,  burstAmps: 600, name: 'Cap Bank' },
  };

  const batt = BATTERY_SPECS[batteryType] || BATTERY_SPECS['none'];
  const bankBurstAmps = batt.burstAmps * (batteryCount || 0);
  // Bank internal resistance drops with parallel batteries
  const bankResistance = batteryCount > 0 ? batt.internalR / batteryCount : 999;

  // Total system capacity = alternator steady-state + battery bank burst
  const totalSystemCapacity = alternatorMax + bankBurstAmps;

  // Current is shared between alternator and battery bank
  // Alternator provides up to its max, bank covers the rest
  const altProvides = Math.min(demandCurrent, alternatorMax);
  const bankProvides = Math.min(Math.max(0, demandCurrent - alternatorMax), bankBurstAmps);
  const actualCurrent = altProvides + bankProvides;
  const overloaded = demandCurrent > totalSystemCapacity;

  // Wire loss from alternator current
  const wireDrop = altProvides * wireResistance;
  // Bank voltage sag from bank current through internal resistance
  const bankDrop = bankProvides * bankResistance;

  let voltage = batteryVoltage - wireDrop - bankDrop;

  // If still overloaded beyond both alt + bank, voltage sags
  if (overloaded) {
    const demandRatio = demandCurrent / totalSystemCapacity;
    const sag = Math.min(4.5, (demandRatio - 1) * 2.5);
    voltage -= sag;
  }

  voltage = Math.max(8.0, voltage);

  return {
    effectiveVoltage: Math.round(voltage * 100) / 100,
    voltageDrop: Math.round((batteryVoltage - voltage) * 1000) / 1000,
    overloaded,
    currentDraw: Math.round(actualCurrent),
    demandCurrent,
    alternatorCapacity: Math.round(alternatorMax),
    bankBurstAmps: Math.round(bankBurstAmps),
    altProvides: Math.round(altProvides),
    bankProvides: Math.round(bankProvides),
  };
}

export function calculateSWR(antennaKey, bonding) {
  const antenna = ANTENNAS[antennaKey] || ANTENNAS['whip-102'];
  let swr = bonding ? 1.5 : 3.2;
  if (antenna.type === 'mag-mount') swr += 0.3;
  if (antenna.type === 'base-load') swr -= 0.2;
  return Math.round(swr * 10) / 10;
}

export function calculateTakeoffAngle(vehicleKey, bonding) {
  const vehicle = VEHICLES[vehicleKey] || VEHICLES['suburban'];
  const bondingPenalty = bonding ? 0 : 15;
  return vehicle.takeoff + bondingPenalty;
}

// ─── Radiation Pattern Calculation ───

export function getRadiationPattern(vehicleKey, bonding, power, antennaKey) {
  const vehicle = VEHICLES[vehicleKey] || VEHICLES['suburban'];
  const antenna = ANTENNAS[antennaKey] || ANTENNAS['whip-102'];
  const points = [];
  const dir = vehicle.directional;
  const gp = vehicle.groundPlane * (bonding ? 1.0 : 0.5);
  const antennaGain = Math.pow(10, antenna.gainDBI / 10);

  for (let angle = 0; angle < 360; angle += 2) {
    const rad = (angle * Math.PI) / 180;
    // Base omnidirectional pattern
    let gain = 1.0;
    // Directional modification (forward bias for trucks)
    gain += dir * Math.cos(rad) * 0.5;
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
