// ─── RF Equipment Database ───

export const RADIOS = {
  'cobra-29': { name: 'Cobra 29 LTD', deadKey: 1, peakKey: 4, type: 'AM', impedance: 50 },
  'galaxy-959': { name: 'Galaxy DX 959', deadKey: 5, peakKey: 15, type: 'AM/SSB', impedance: 50 },
  'stryker-955': { name: 'Stryker SR-955HPC', deadKey: 8, peakKey: 25, type: 'AM/SSB', impedance: 50 },
  'connex-4300': { name: 'Connex 4300HP', deadKey: 10, peakKey: 30, type: 'AM/SSB', impedance: 50 },
  'ranger-rci2970': { name: 'Ranger RCI-2970N2', deadKey: 12, peakKey: 40, type: 'AM/SSB', impedance: 50 },
};

export const DRIVER_AMPS = {
  'none': { name: 'No Driver', gainDB: 0, transistors: 0, currentDraw: 0 },
  '2-pill': { name: '2-Pill Driver', gainDB: 20, transistors: 2, currentDraw: 12 },
  '4-pill': { name: '4-Pill Driver', gainDB: 31, transistors: 4, currentDraw: 25 },
};

export const FINAL_AMPS = {
  'none': { name: 'No Final', gainDB: 0, transistors: 0, currentDraw: 0 },
  '4-pill': { name: '4-Pill Amp', gainDB: 4, transistors: 4, currentDraw: 40 },
  '8-pill': { name: '8-Pill Amp', gainDB: 6, transistors: 8, currentDraw: 90 },
  '16-pill': { name: '16-Pill Amp', gainDB: 8, transistors: 16, currentDraw: 160 },
};

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

  if (driver.gainDB > 0) {
    const driverGain = Math.pow(10, driver.gainDB / 10);
    deadKey *= driverGain;
    peakKey *= driverGain;
  }
  if (final_.gainDB > 0) {
    const finalGain = Math.pow(10, final_.gainDB / 10);
    deadKey *= finalGain;
    peakKey *= finalGain;
  }

  const bondingFactor = bonding ? 1.0 : 0.6;
  return {
    deadKey: deadKey * bondingFactor,
    peakKey: peakKey * bondingFactor,
  };
}

export function calculateVoltageDrop(driverKey, finalKey, extraAlternators) {
  const driver = DRIVER_AMPS[driverKey] || DRIVER_AMPS['none'];
  const final_ = FINAL_AMPS[finalKey] || FINAL_AMPS['none'];

  const totalCurrent = driver.currentDraw + final_.currentDraw;
  const batteryVoltage = 14.2;
  const alternatorCapacity = extraAlternators ? 300 : 130;
  const wireResistance = 0.005;
  const vDrop = totalCurrent * wireResistance;
  let effectiveV = batteryVoltage - vDrop;
  const overloaded = totalCurrent > alternatorCapacity;

  if (overloaded) {
    const sag = (totalCurrent - alternatorCapacity) * 0.02;
    effectiveV -= sag;
  }

  return {
    effectiveVoltage: Math.round(effectiveV * 100) / 100,
    voltageDrop: Math.round(vDrop * 1000) / 1000,
    overloaded,
    currentDraw: totalCurrent,
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
    // Normalize and scale by power
    const scaledGain = Math.max(0.1, gain) * Math.sqrt(Math.min(power, 10000)) / 100;
    points.push({ angle, gain: scaledGain });
  }
  return points;
}
