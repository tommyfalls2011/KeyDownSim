// ─── RF Equipment Database ───

export const RADIOS = {
  'cobra-29': { name: 'Cobra 29 LTD', deadKey: 0.75, peakKey: 25, type: 'AM', impedance: 50 },
  'galaxy-959': { name: 'Galaxy DX 959', deadKey: 2, peakKey: 40, type: 'AM/SSB', impedance: 50 },
  'stryker-955': { name: 'Stryker SR-955HPC', deadKey: 3, peakKey: 125, type: 'AM/SSB', impedance: 50 },
  'connex-4300': { name: 'Connex 4300HP', deadKey: 3.5, peakKey: 160, type: 'AM/SSB', impedance: 50 },
  'ranger-rci2970': { name: 'Ranger RCI-2970N2', deadKey: 4, peakKey: 225, type: 'AM/SSB', impedance: 50 },
};

// ─── Transistor (Pill) Types ───
export const TRANSISTORS = {
  'toshiba-2sc2879': { name: 'Toshiba 2SC2879', wattsPEP: 100, gainDB: 13, dissipation: 250, tjMax: 175, efficiency: 0.35, driveWatts: 4, currentMax: 25 },
  'hg-2sc2879': { name: 'HG 2SC2879', wattsPEP: 125, gainDB: 11.5, dissipation: 250, tjMax: 175, efficiency: 0.35, driveWatts: 5, currentMax: 25 },
  'mitsubishi-2sc3240': { name: 'Mitsubishi 2SC3240', wattsPEP: 180, gainDB: 11.5, dissipation: 270, tjMax: 175, efficiency: 0.575, driveWatts: 7, currentMax: 25 },
  'mrf454': { name: 'MRF454', wattsPEP: 80, gainDB: 10, dissipation: 150, tjMax: 175, efficiency: 0.65, driveWatts: 8, currentMax: 15 },
  'sd1446': { name: 'SD1446', wattsPEP: 70, gainDB: 10, dissipation: 183, tjMax: 175, efficiency: 0.55, driveWatts: 7, currentMax: 12 },
  'hg-sd1446': { name: 'HG SD1446', wattsPEP: 75, gainDB: 10, dissipation: 183, tjMax: 175, efficiency: 0.55, driveWatts: 7.5, currentMax: 12 },
};

// ─── Box Sizes (pill count → combining stages) ───
export const BOX_SIZES = [1, 2, 3, 4, 6, 8, 16, 24, 32];
const BOX_COMBINING = { 1: 0, 2: 0, 3: 0, 4: 1, 6: 1, 8: 2, 16: 4, 24: 6, 32: 8 };

// ─── Heatsink Options (5 tiers matched to pill count) ───
// 1-2 pills: Small passive fins, minimal cooling
// 3-4 pills: Medium finned + single fan, active cooling required
// 6-8 pills: Large thick extruded aluminum, high-CFM fans
// 12-16 pills: XL bonded fin assembly, dual 80-120mm fans, heavy-duty forced air
// 24-32 pills: Extreme custom-machined radiator, high-pressure forced air mandatory
export const HEATSINKS = {
  'small':   { name: 'Small (passive fins)',               thermalResistance: 2.5,  coolRate: 0.6,  maxPills: 2  },
  'medium':  { name: 'Medium (finned + fan)',              thermalResistance: 1.2,  coolRate: 1.5,  maxPills: 4  },
  'large':   { name: 'Large (extruded + high-CFM)',        thermalResistance: 0.5,  coolRate: 3.0,  maxPills: 8  },
  'xlarge':  { name: 'XL (bonded fin + dual fans)',        thermalResistance: 0.25, coolRate: 5.0,  maxPills: 16 },
  'extreme': { name: 'Extreme (machined radiator)',        thermalResistance: 0.12, coolRate: 8.0,  maxPills: 32 },
};

// Get the recommended heatsink for a given pill count
export function getRecommendedHeatsink(pillCount) {
  if (pillCount <= 2) return 'small';
  if (pillCount <= 4) return 'medium';
  if (pillCount <= 8) return 'large';
  if (pillCount <= 16) return 'xlarge';
  return 'extreme';
}

// Check if heatsink is undersized for the pill count
export function isHeatsinkUndersized(heatsinkKey, pillCount) {
  const hs = HEATSINKS[heatsinkKey];
  if (!hs) return false;
  return pillCount > hs.maxPills;
}

// ─── Build amp specs from transistor + box + heatsink ───
export function getAmpSpecs(transistorKey, boxSize, heatsinkKey) {
  if (!transistorKey || transistorKey === 'none' || !boxSize || boxSize === 0) return null;
  const pill = TRANSISTORS[transistorKey];
  if (!pill) return null;
  const combiningStages = BOX_COMBINING[boxSize] ?? 0;
  const heatsink = HEATSINKS[heatsinkKey] || HEATSINKS['medium'];
  const currentPerPill = Math.round(pill.wattsPEP / (12.5 * pill.efficiency));
  return {
    name: `${boxSize}x ${pill.name}`,
    gainDB: pill.gainDB,
    transistors: boxSize,
    currentDraw: currentPerPill * boxSize,
    wattsPerPill: pill.wattsPEP,
    combiningStages,
    dissipation: pill.dissipation,
    tjMax: pill.tjMax,
    efficiency: pill.efficiency,
    coolRate: heatsink.coolRate,
    heatsinkName: heatsink.name,
  };
}

const COMBINING_BONUS_PER_STAGE = 1.2;

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

// Vehicle ground heights in feet (bed/roof height from ground)
export const VEHICLES = {
  // ─── SUVs & Wagons ───
  'suburban': { name: 'Suburban/SUV', groundPlane: 0.88, surfaceSqFt: 42, directional: 0.12, takeoff: 22, shape: 'suv', groundHeight: 5.5 },
  'wagon': { name: 'Station Wagon', groundPlane: 0.80, surfaceSqFt: 36, directional: 0.20, takeoff: 26, shape: 'wagon', groundHeight: 4.5 },
  'jeep': { name: 'Jeep Wrangler', groundPlane: 0.55, surfaceSqFt: 22, directional: 0.55, takeoff: 40, shape: 'jeep', groundHeight: 4.0 },
  // ─── Competition ───
  'shootout': { name: 'Shootout Truck (Built)', groundPlane: 0.92, surfaceSqFt: 38, directional: 0.12, takeoff: 18, shape: 'truck', groundHeight: 4.2 },
  // ─── Chevy / GM ───
  'silverado-rcsb': { name: 'Silverado 1500 RCSB', groundPlane: 0.70, surfaceSqFt: 34, directional: 0.35, takeoff: 28, shape: 'truck', groundHeight: 5.8 },
  'c10': { name: "Chevy C10 ('67-'72)", groundPlane: 0.65, surfaceSqFt: 28, directional: 0.40, takeoff: 32, shape: 'truck', groundHeight: 4.8 },
  'silverado-3500': { name: 'Silverado 3500HD Crew/Long', groundPlane: 0.82, surfaceSqFt: 46, directional: 0.18, takeoff: 20, shape: 'truck', groundHeight: 6.5 },
  // ─── Ford ───
  'f150': { name: 'Ford F-150', groundPlane: 0.68, surfaceSqFt: 32, directional: 0.38, takeoff: 30, shape: 'truck', groundHeight: 5.5 },
  'f350': { name: 'Ford F-350 Super Duty', groundPlane: 0.80, surfaceSqFt: 48, directional: 0.20, takeoff: 22, shape: 'truck', groundHeight: 6.8 },
  // ─── Ram ───
  'ram': { name: 'Ram 1500', groundPlane: 0.68, surfaceSqFt: 31, directional: 0.42, takeoff: 32, shape: 'truck', groundHeight: 5.2 },
  'ram-3500': { name: 'Ram 3500 Crew Cab', groundPlane: 0.78, surfaceSqFt: 45, directional: 0.22, takeoff: 23, shape: 'truck', groundHeight: 6.5 },
  // ─── Commercial ───
  'van': { name: 'Cargo Van', groundPlane: 0.92, surfaceSqFt: 52, directional: 0.08, takeoff: 18, shape: 'van', groundHeight: 7.0 },
  'semi': { name: 'Semi Truck', groundPlane: 0.95, surfaceSqFt: 65, directional: 0.05, takeoff: 15, shape: 'semi', groundHeight: 8.5 },
};

// Yagi Array Element Positions (distances in inches from rear antenna)
// ANT1 = rear (reflector), ANT2 = driven element, DIR1-3 = directors
export const YAGI_ARRAY_CONFIG = {
  elements: [
    { id: 'ant1', name: 'ANT1 (Reflector)', position: 0, heightOffset: 0, tunable: true, defaultHeight: 96 },      // rear, base height
    { id: 'ant2', name: 'ANT2 (Driven)', position: 72, heightOffset: 0, tunable: true, defaultHeight: 96 },        // 72" forward
    { id: 'dir1', name: 'DIR1', position: 72 + 42, heightOffset: -12, tunable: true, defaultHeight: 84 },          // 3.5' forward, 1' shorter
    { id: 'dir2', name: 'DIR2', position: 72 + 42 + 96, heightOffset: 15, tunable: true, defaultHeight: 111 },    // 8' forward, 15" taller
    { id: 'dir3', name: 'DIR3', position: 72 + 42 + 96 + 96, heightOffset: 15, tunable: true, defaultHeight: 111 }, // 8' forward, same as DIR2
  ],
  // Fighting sticks options for the array
  stickOptions: [
    { id: 'fight-8', name: "8' Fighting Sticks", baseHeight: 96, gainDBI: 5.5 },
    { id: 'fight-10', name: "10' Fighting Sticks", baseHeight: 120, gainDBI: 7 },
  ],
  // Yagi gain based on element count and spacing
  baseGainDB: 9.5, // ~9-11dB typical for 5-element yagi
  beamWidth: 45,   // degrees - narrower than omni
};

// Antenna mount positions — the pattern is DRAWN TOWARD the metal surface
// More metal in a direction = more signal that way
// biasAngle: direction the signal pulls toward (canvas coords: 0=E, 90=S, 180=W, 270=N/front)
// biasStrength: how much the pattern skews (0=omni, higher=more directional)
// dBLoss: efficiency loss vs center-roof ideal (Larsen data: rear ~2.1dB avg)
// xOffset/yOffset: position on vehicle visual (-1 to 1, 0=center)
export const ANTENNA_POSITIONS = {
  'center':     { name: 'Center Roof',  biasAngle: 270, biasStrength: 0.0,  dBLoss: 0,   xOffset: 0,    yOffset: 0 },
  'rear':       { name: 'Rear Mount',   biasAngle: 270, biasStrength: 0.7,  dBLoss: 2.1, xOffset: 0,    yOffset: 0.8 },
  'front':      { name: 'Front Mount',  biasAngle: 90,  biasStrength: 0.5,  dBLoss: 1.5, xOffset: 0,    yOffset: -0.8 },
  'back-right': { name: 'Back Right',   biasAngle: 225, biasStrength: 0.65, dBLoss: 2.8, xOffset: 0.7,  yOffset: 0.7 },
  'back-left':  { name: 'Back Left',    biasAngle: 315, biasStrength: 0.65, dBLoss: 2.8, xOffset: -0.7, yOffset: 0.7 },
};

// ─── Merge admin-added equipment from API (snake_case → camelCase) ───

function transformRadio(d) {
  return { name: d.name, deadKey: d.dead_key ?? d.deadKey ?? 1, peakKey: d.peak_key ?? d.peakKey ?? 4, type: d.type || 'AM', impedance: d.impedance || 50 };
}
function transformAntenna(d) {
  return { name: d.name, gainDBI: d.gain_dbi ?? d.gainDBI ?? 0, type: d.type || 'vertical', tunable: d.tunable || false, tipMin: d.tip_min ?? d.tipMin, tipMax: d.tip_max ?? d.tipMax, tipDefault: d.tip_default ?? d.tipDefault };
}
function transformVehicle(d) {
  return { name: d.name, groundPlane: d.ground_plane ?? d.groundPlane ?? 0.7, surfaceSqFt: d.surface_sqft ?? d.surfaceSqFt ?? 30, directional: d.directional ?? 0.2, takeoff: d.takeoff ?? 25, shape: d.shape || 'truck' };
}
function transformTransistor(d) {
  return {
    name: d.name,
    wattsPEP: d.watts_pep ?? d.wattsPEP ?? 100,
    gainDB: d.gain_db ?? d.gainDB ?? 10,
    dissipation: d.dissipation ?? 250,
    tjMax: d.tj_max ?? d.tjMax ?? 175,
    efficiency: d.efficiency ?? 0.35,
    driveWatts: d.drive_watts ?? d.driveWatts ?? 5,
    currentMax: d.current_max ?? d.currentMax ?? 25,
  };
}

export function mergeEquipmentFromAPI(apiData) {
  if (apiData.radios) {
    for (const [key, data] of Object.entries(apiData.radios)) {
      RADIOS[key] = transformRadio(data);
    }
  }
  if (apiData.transistors) {
    for (const [key, data] of Object.entries(apiData.transistors)) {
      TRANSISTORS[key] = transformTransistor(data);
    }
  }
  if (apiData.antennas) {
    for (const [key, data] of Object.entries(apiData.antennas)) {
      ANTENNAS[key] = transformAntenna(data);
    }
  }
  if (apiData.vehicles) {
    for (const [key, data] of Object.entries(apiData.vehicles)) {
      VEHICLES[key] = transformVehicle(data);
    }
  }
}

// ─── Calculation Functions ───

// Per-stage output and load ratios — for thermal model and actual current draw
export function calculateStageOutputs(radioKey, driverSpecs, midDriverSpecs, finalSpecs, bonding, driveLevel) {
  const radio = RADIOS[radioKey] || RADIOS['cobra-29'];
  const driver = driverSpecs || { gainDB: 0, transistors: 0, wattsPerPill: 0, combiningStages: 0, efficiency: 0.35 };
  const midDriver = midDriverSpecs || { gainDB: 0, transistors: 0, wattsPerPill: 0, combiningStages: 0, efficiency: 0.35 };
  const final_ = finalSpecs || { gainDB: 0, transistors: 0, wattsPerPill: 0, combiningStages: 0, efficiency: 0.35 };
  const bondingFactor = bonding ? 1.0 : 0.6;
  const dl = driveLevel ?? 1.0;

  const radioDK = radio.deadKey * dl;
  const radioPK = radio.peakKey * dl;

  let driverOutDK = 0, driverOutPK = 0, driverMax = 0;
  let inputToNextDK = radioDK;
  let inputToNextPK = radioPK;

  if (driver.gainDB > 0) {
    const driverGain = Math.pow(10, driver.gainDB / 10);
    const stages = driver.combiningStages || 0;
    const combining = Math.pow(COMBINING_BONUS_PER_STAGE, stages);
    driverMax = driver.transistors * (driver.wattsPerPill || 100) * combining;
    driverOutDK = Math.min(radioDK * driverGain, driverMax);
    driverOutPK = Math.min(radioPK * driverGain, driverMax);
    inputToNextDK = driverOutDK;
    inputToNextPK = driverOutPK;
  }

  let midDriverOutDK = 0, midDriverOutPK = 0, midDriverMax = 0;
  if (midDriver.gainDB > 0) {
    const midGain = Math.pow(10, midDriver.gainDB / 10);
    const stages = midDriver.combiningStages || 0;
    const combining = Math.pow(COMBINING_BONUS_PER_STAGE, stages);
    midDriverMax = midDriver.transistors * (midDriver.wattsPerPill || 100) * combining;
    midDriverOutDK = Math.min(inputToNextDK * midGain, midDriverMax);
    midDriverOutPK = Math.min(inputToNextPK * midGain, midDriverMax);
    inputToNextDK = midDriverOutDK;
    inputToNextPK = midDriverOutPK;
  }

  let finalOutDK = 0, finalOutPK = 0, finalMax = 0;
  if (final_.gainDB > 0) {
    const finalGain = Math.pow(10, final_.gainDB / 10);
    const stages = final_.combiningStages || 0;
    const combining = Math.pow(COMBINING_BONUS_PER_STAGE, stages);
    finalMax = final_.transistors * (final_.wattsPerPill || 100) * combining;
    finalOutDK = Math.min(inputToNextDK * finalGain, finalMax);
    finalOutPK = Math.min(inputToNextPK * finalGain, finalMax);
  }

  return {
    driverMax,
    driverLoadRatioDK: driverMax > 0 ? Math.min(1, (driverOutDK * bondingFactor) / driverMax) : 0,
    driverLoadRatioPK: driverMax > 0 ? Math.min(1, (driverOutPK * bondingFactor) / driverMax) : 0,
    midDriverMax,
    midDriverLoadRatioDK: midDriverMax > 0 ? Math.min(1, (midDriverOutDK * bondingFactor) / midDriverMax) : 0,
    midDriverLoadRatioPK: midDriverMax > 0 ? Math.min(1, (midDriverOutPK * bondingFactor) / midDriverMax) : 0,
    finalMax,
    finalLoadRatioDK: finalMax > 0 ? Math.min(1, (finalOutDK * bondingFactor) / finalMax) : 0,
    finalLoadRatioPK: finalMax > 0 ? Math.min(1, (finalOutPK * bondingFactor) / finalMax) : 0,
  };
}

export function calculateSignalChain(radioKey, driverSpecs, midDriverSpecs, finalSpecs, bonding, antennaPosKey, driveLevel, ampVoltage) {
  const radio = RADIOS[radioKey] || RADIOS['cobra-29'];
  const driver = driverSpecs || { gainDB: 0, transistors: 0, wattsPerPill: 0, combiningStages: 0 };
  const midDriver = midDriverSpecs || { gainDB: 0, transistors: 0, wattsPerPill: 0, combiningStages: 0 };
  const final_ = finalSpecs || { gainDB: 0, transistors: 0, wattsPerPill: 0, combiningStages: 0 };
  const dl = driveLevel ?? 1.0;

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
    const driverMax = driver.transistors * (driver.wattsPerPill || 100) * combining * voltageBoost;
    deadKey = Math.min(deadKey * driverGain * voltageBoost, driverMax);
    peakKey = Math.min(peakKey * driverGain * voltageBoost, driverMax);
  }

  if (midDriver.gainDB > 0) {
    const midGain = Math.pow(10, midDriver.gainDB / 10);
    const stages = midDriver.combiningStages || 0;
    const combining = Math.pow(COMBINING_BONUS_PER_STAGE, stages);
    const midMax = midDriver.transistors * (midDriver.wattsPerPill || 100) * combining * voltageBoost;
    deadKey = Math.min(deadKey * midGain * voltageBoost, midMax);
    peakKey = Math.min(peakKey * midGain * voltageBoost, midMax);
  }

  if (final_.gainDB > 0) {
    const finalGain = Math.pow(10, final_.gainDB / 10);
    const stages = final_.combiningStages || 0;
    const combining = Math.pow(COMBINING_BONUS_PER_STAGE, stages);
    const finalMax = final_.transistors * (final_.wattsPerPill || 100) * combining * voltageBoost;
    deadKey = Math.min(deadKey * finalGain * voltageBoost, finalMax);
    peakKey = Math.min(peakKey * finalGain * voltageBoost, finalMax);
  }

  const bondingFactor = bonding ? 1.0 : 0.6;
  return {
    deadKey: deadKey * bondingFactor,
    peakKey: peakKey * bondingFactor,
  };
}

export function calculateVoltageDrop(driverSpecs, midDriverSpecs, finalSpecs, alternatorCount, alternatorAmps, batteryType, batteryCount, regulatorVoltages, actualDemandCurrent) {
  const driver = driverSpecs || { currentDraw: 0 };
  const midDriver = midDriverSpecs || { currentDraw: 0 };
  const final_ = finalSpecs || { currentDraw: 0 };

  const ratedMax = (driver.currentDraw || 0) + (midDriver.currentDraw || 0) + (final_.currentDraw || 0);
  const demandCurrent = actualDemandCurrent !== undefined ? actualDemandCurrent : ratedMax;

  // External regulators: each controls up to 3 alts
  // Average the regulator voltages weighted by how many alts each controls
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

// ─── Impedance-Based SWR Model ───
// Uses real RF physics: Z_load → reflection coefficient (Γ) → SWR
// SWR = (1 + |Γ|) / (1 - |Γ|)   where Γ = |Z_load - Z0| / |Z_load + Z0|
const Z0 = 50; // Characteristic impedance (Ω) — standard coax

// Feedline loss at 27MHz (dB per 100 feet)
export const COAX_TYPES = {
  'rg213':   { name: 'RG-213',         lossPerHundredFt: 0.5,  desc: 'Standard 50Ω' },
  'rg217':   { name: 'RG-217',         lossPerHundredFt: 0.35, desc: 'Large diameter, low loss' },
  'rg393':   { name: 'RG-393',         lossPerHundredFt: 0.4,  desc: 'Double-shield, flexible' },
  'heliax':  { name: 'Heliax 1"',      lossPerHundredFt: 0.1,  desc: 'Hardline, ultra-low loss' },
};
const DEFAULT_COAX = 'rg213';
const DEFAULT_COAX_FT = 18;

// Base impedance per antenna type (R + jX on a perfect infinite ground plane)
// Quarter-wave vertical (~108" at 27MHz) = 36Ω pure resistive
// Shorter = lower R, capacitive X. Base-loaded = coil compensates length, adds slight R.
// Mag-mount = coupling through magnet adds R.
const ANTENNA_Z = {
  'vertical':   { R: 36, X: 0 },    // full-size vertical, near quarter-wave
  'base-load':  { R: 32, X: 3 },    // loading coil compensates length, slight reactive
  'mag-mount':  { R: 38, X: 5 },    // magnet coupling adds R and slight X
};

function calcGamma(R, X) {
  // |Γ| = |Z_load - Z0| / |Z_load + Z0|  for complex impedance
  const diffR = R - Z0;
  const sumR = R + Z0;
  return Math.sqrt(diffR * diffR + X * X) / Math.sqrt(sumR * sumR + X * X);
}

function gammaToSWR(g) {
  if (g >= 0.99) return 99.9;
  return (1 + g) / (1 - g);
}

function applyFeedlineLoss(gamma, coaxType, lengthFt) {
  // Cable absorbs reflected power on round trip — makes SWR look better at radio
  const coax = COAX_TYPES[coaxType] || COAX_TYPES[DEFAULT_COAX];
  const lossPerFt = coax.lossPerHundredFt / 100;
  const roundTripDB = 2 * lossPerFt * lengthFt;
  return gamma * Math.pow(10, -roundTripDB / 20);
}

export function calculateSWR(antennaKey, vehicleKey, bonding, tipLength, antennaPosKey, coaxType, coaxLengthFt) {
  const antenna = ANTENNAS[antennaKey] || ANTENNAS['whip-102'];
  const vehicle = VEHICLES[vehicleKey] || VEHICLES['suburban'];
  const pos = ANTENNA_POSITIONS[antennaPosKey] || ANTENNA_POSITIONS['center'];
  const baseZ = ANTENNA_Z[antenna.type] || ANTENNA_Z['vertical'];

  // Start with antenna's base impedance
  let R = baseZ.R;
  let X = baseZ.X;

  // ── Ground plane effect ──
  // Reduced ground plane → radiation resistance rises (current image weakens)
  // and asymmetric counterpoise adds reactance
  const gp = Math.max(0.3, vehicle.groundPlane);
  R = R / gp;
  X += baseZ.R * (1 - gp) * 0.8;

  // ── Antenna position effect ──
  // Off-center mount = asymmetric ground plane. The antenna sees less metal
  // on one side, weakening the image current → R rises (lossy return path)
  // and asymmetry adds reactance (unbalanced current distribution).
  // biasStrength: 0 = center (symmetric), 0.7 = rear edge (highly asymmetric)
  // Corner mounts (xOffset+yOffset both nonzero) are worst — metal only in one quadrant
  if (pos.biasStrength > 0) {
    const cornerFactor = (Math.abs(pos.xOffset) > 0 && Math.abs(pos.yOffset) > 0) ? 1.4 : 1.0;
    // Asymmetry raises R — the missing metal means the ground return
    // path has higher resistance. Scales with how far off-center.
    R += pos.biasStrength * 12 * cornerFactor;
    // Asymmetric counterpoise adds reactance — the image current
    // is incomplete on one side, creating a reactive component.
    X += pos.biasStrength * 16 * cornerFactor;
  }

  // ── Bonding ──
  // Poor bonding → common-mode current on coax shield → stray RF paths
  // Adds resistance (lossy ground return) and reactance (random RF paths)
  if (!bonding) {
    R += 5;
    X += 20;
  }

  // ── Tip tuning (resonance adjustment) ──
  // At resonance: X ≈ 0. Each inch off resonance ≈ ±2.5Ω reactance
  // Too long = inductive (+X), too short = capacitive (-X)
  if (antenna.tunable && tipLength !== undefined) {
    const sweetSpot = antenna.tipDefault || 44;
    const deviation = tipLength - sweetSpot;
    X += deviation * 2.5;
  }

  // ── Calculate SWR ──
  const gammaAnt = calcGamma(R, X);
  const swrAtAntenna = gammaToSWR(gammaAnt);

  // Apply feedline loss (the "liar factor" — coax absorbs reflected power)
  const gammaRadio = applyFeedlineLoss(gammaAnt, coaxType || DEFAULT_COAX, coaxLengthFt ?? DEFAULT_COAX_FT);
  const swrAtRadio = gammaToSWR(gammaRadio);

  return {
    atRadio: Math.round(Math.max(1.0, swrAtRadio) * 10) / 10,
    atAntenna: Math.round(Math.max(1.0, swrAtAntenna) * 10) / 10,
  };
}

// ─── Yagi Array SWR — Impedance Model ───
// A 5-element Yagi's driven element feed impedance is ~25Ω when all elements
// are at optimal height/spacing. Mutual coupling from reflector + directors
// pulls the driven element impedance down from its free-space ~36Ω.
// Detuning elements or changing spacing shifts R and adds reactance.
export function calculateYagiSWR(vehicleKey, bonding, yagiConfig) {
  const vehicle = VEHICLES[vehicleKey] || VEHICLES['suburban'];
  const heights = yagiConfig?.elementHeights || {};
  const posOffsets = yagiConfig?.elementPositions || {};
  const stickType = yagiConfig?.stickType || 'fight-8';

  // Driven element base impedance in a properly tuned 5-element Yagi
  let R = 25;
  let X = 0;

  // ── Ground plane ──
  const gp = Math.max(0.3, vehicle.groundPlane);
  R = R / gp;
  X += 25 * (1 - gp) * 0.6;

  // ── Bonding ──
  if (!bonding) {
    R += 5;
    X += 18;
  }

  // ── Element height deviations → detuning → reactance ──
  // Driven element (ANT2) has most impact on feed impedance
  // Other elements affect it through mutual coupling
  const optimalHeights = stickType === 'fight-10' ? {
    ant1: 120, ant2: 120, dir1: 108, dir2: 135, dir3: 135,
  } : {
    ant1: 96, ant2: 96, dir1: 84, dir2: 111, dir3: 111,
  };

  const ant1Dev = Math.abs((heights.ant1 || optimalHeights.ant1) - optimalHeights.ant1);
  const ant2Dev = Math.abs((heights.ant2 || optimalHeights.ant2) - optimalHeights.ant2);
  const dir1Dev = Math.abs((heights.dir1 || optimalHeights.dir1) - optimalHeights.dir1);
  const dir2Dev = Math.abs((heights.dir2 || optimalHeights.dir2) - optimalHeights.dir2);
  const dir3Dev = Math.abs((heights.dir3 || optimalHeights.dir3) - optimalHeights.dir3);

  // Reactance added by detuning (Ω per inch of height deviation)
  X += ant2Dev * 3.0;   // Driven element — direct feed-point reactance
  X += ant1Dev * 1.5;   // Reflector — through mutual coupling
  X += dir1Dev * 2.0;   // DIR1 — strong coupling to driven
  X += dir2Dev * 1.0;   // DIR2 — moderate coupling
  X += dir3Dev * 0.5;   // DIR3 — weakest coupling

  // ── Element spacing → mutual coupling changes ──
  const dir1OnTruck = yagiConfig?.dir1OnTruck !== false;
  const dir1BasePos = dir1OnTruck ? 42 : 96;
  const optimalSpacings = [
    { optimal: 72,          weight: 1.0 },   // ANT1↔ANT2 (reflector↔driven)
    { optimal: dir1BasePos, weight: 0.8 },   // ANT2↔DIR1
    { optimal: 96,          weight: 0.4 },   // DIR1↔DIR2
    { optimal: 96,          weight: 0.2 },   // DIR2↔DIR3
  ];
  const positions = [
    0 + (posOffsets.ant1 || 0),
    72 + (posOffsets.ant2 || 0),
    72 + dir1BasePos + (posOffsets.dir1 || 0),
    72 + dir1BasePos + 96 + (posOffsets.dir2 || 0),
    72 + dir1BasePos + 192 + (posOffsets.dir3 || 0),
  ];

  for (let i = 0; i < optimalSpacings.length; i++) {
    const actual = positions[i + 1] - positions[i];
    const optimal = optimalSpacings[i].optimal;
    const w = optimalSpacings[i].weight;
    const dev = actual - optimal;

    if (dev < 0) {
      // CLOSER → coupling increases ~ 1/d² → impedance drops, reactance spikes
      const closer = Math.abs(dev);
      const ratio = closer / Math.max(1, optimal);
      R -= w * closer * 0.15;              // coupling pulls R down
      X += w * (closer * 1.5 + Math.pow(closer, 1.4) * 0.8);  // steep reactance rise
    } else if (dev > 0) {
      // FURTHER → coupling weakens → R rises toward free-space, mild X
      R += w * dev * 0.1;
      X += w * dev * 0.4;
    }
  }

  // Clamp R to positive (can't have negative radiation resistance)
  R = Math.max(3, R);

  // ── Edge / shift effects ──
  // Elements near roof edge see asymmetric ground plane → adds reactance
  const avgOff = ((posOffsets.ant1 || 0) + (posOffsets.ant2 || 0) + (posOffsets.dir1 || 0) +
    (posOffsets.dir2 || 0) + (posOffsets.dir3 || 0)) / 5;
  X += Math.abs(avgOff) * 0.5;

  // ── Calculate SWR ──
  const gammaAnt = calcGamma(R, X);
  const swrAtAntenna = gammaToSWR(gammaAnt);

  // Apply feedline loss
  const gammaRadio = applyFeedlineLoss(gammaAnt, DEFAULT_COAX, DEFAULT_COAX_FT);
  const swrAtRadio = gammaToSWR(gammaRadio);

  // Tuning bonus: if everything is within 6" of optimal, the system resonates cleanly
  const totalDev = ant1Dev + ant2Dev + dir1Dev + dir2Dev + dir3Dev;
  const totalPosDev = Math.abs(posOffsets.ant1 || 0) + Math.abs(posOffsets.ant2 || 0) +
    Math.abs(posOffsets.dir1 || 0) + Math.abs(posOffsets.dir2 || 0) + Math.abs(posOffsets.dir3 || 0);
  let bonus = 0;
  if (totalDev <= 6 && totalPosDev <= 6) {
    bonus = 0.15 * (1 - Math.max(totalDev, totalPosDev) / 6);
  }

  const finalSWR = Math.max(1.0, swrAtRadio - bonus);
  return {
    atRadio: Math.round(Math.min(9.9, finalSWR) * 10) / 10,
    atAntenna: Math.round(Math.max(1.0, swrAtAntenna) * 10) / 10,
  };
}

// ─── Take-off Angle Calculation ───
// The take-off angle is the angle above the horizon where the antenna radiates most energy.
// Lower = better DX (farther ground wave / lower sky wave angle).
// Factors:
// - Ground plane size: More metal beneath the antenna = more complete image = lower angle
//   A Suburban roof at 42sqft with good bonding is close to ideal for mobile
// - Bonding: Un-bonded panels create gaps in the image, raising the angle
// - Vehicle height: Taller = antenna further from ground = lower angle (better image)
// - Antenna position: Center of roof = symmetric ground plane = lowest angle. Edge = asymmetric = higher
// - Yagi array: Directors compress the vertical beam, lowering the take-off angle further
export function calculateTakeoffAngle(vehicleKey, bonding, options = {}) {
  const vehicle = VEHICLES[vehicleKey] || VEHICLES['suburban'];
  const antennaPos = options.antennaPosition || 'center';
  const yagiMode = options.yagiMode || false;
  const rideHeightOffset = options.rideHeightOffset || 0;
  
  const effectiveHeight = (vehicle.groundHeight || 5) + (rideHeightOffset / 12);
  
  const gpEfficiency = (vehicle.groundPlane || 0.5) * (bonding ? 1.0 : 0.6);
  let angle = 45 - (gpEfficiency * 30);
  
  const surfaceEffect = ((vehicle.surfaceSqFt || 30) - 30) * 0.08;
  angle -= surfaceEffect;
  
  if (rideHeightOffset < 0) {
    angle += rideHeightOffset * 0.5;
  } else {
    angle += rideHeightOffset * 0.3;
  }
  
  const heightBonus = Math.max(0, (effectiveHeight - 4)) * 0.4;
  angle -= heightBonus;
  
  const positionPenalties = {
    'center': 0, 'front': 2, 'rear': 2, 'right': 3, 'left': 3,
    'bumper': 8, 'hood': 4, 'trunk': 5, 'mirror': 10,
  };
  angle += (positionPenalties[antennaPos] || 0);
  
  if (yagiMode) {
    angle -= 4;
  }
  
  return Math.round(Math.max(5, Math.min(50, angle)));
}

// ─── Under-Driven Detection ───

export function checkUnderDriven(radioKey, driverSpecs, midDriverSpecs, finalSpecs, bonding, driveLevel) {
  const radio = RADIOS[radioKey] || RADIOS['cobra-29'];
  const driver = driverSpecs || { gainDB: 0, transistors: 0, wattsPerPill: 0, combiningStages: 0 };
  const midDriver = midDriverSpecs || { gainDB: 0, transistors: 0, wattsPerPill: 0, combiningStages: 0 };
  const final_ = finalSpecs || { gainDB: 0, transistors: 0, wattsPerPill: 0, combiningStages: 0 };
  const dl = driveLevel ?? 1.0;

  if (final_.gainDB <= 0) return { isUnderDriven: false, driveRatio: 1.0, driveWatts: 0, finalCapacity: 0 };

  let driveWatts = radio.deadKey * dl;
  if (driver.gainDB > 0) {
    const driverGain = Math.pow(10, driver.gainDB / 10);
    const stages = driver.combiningStages || 0;
    const combining = Math.pow(COMBINING_BONUS_PER_STAGE, stages);
    const driverMax = driver.transistors * (driver.wattsPerPill || 100) * combining;
    driveWatts = Math.min(driveWatts * driverGain, driverMax);
  }
  if (midDriver.gainDB > 0) {
    const midGain = Math.pow(10, midDriver.gainDB / 10);
    const stages = midDriver.combiningStages || 0;
    const combining = Math.pow(COMBINING_BONUS_PER_STAGE, stages);
    const midMax = midDriver.transistors * (midDriver.wattsPerPill || 100) * combining;
    driveWatts = Math.min(driveWatts * midGain, midMax);
  }

  const finalGain = Math.pow(10, final_.gainDB / 10);
  const stages = final_.combiningStages || 0;
  const combining = Math.pow(COMBINING_BONUS_PER_STAGE, stages);
  const finalCapacity = final_.transistors * (final_.wattsPerPill || 100) * combining;
  const idealDrive = finalCapacity / finalGain;

  const driveRatio = driveWatts / idealDrive;

  return {
    isUnderDriven: driveRatio < 0.05,
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
    // Rear mount: ~20ft forward, ~6ft back = ~3.5:1 ratio
    if (pos.biasStrength > 0) {
      const angleDiff = rad - biasRad;
      gain *= (1.0 + pos.biasStrength * Math.cos(angleDiff) * 0.8);
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

// ─── Yagi Array Radiation Pattern ───
// Creates a highly directional forward beam pattern
// Element spacing changes affect:
// - Beam width (closer directors = narrower but more unstable, further = wider/weaker)
// - Side lobe levels (spacing errors = higher side lobes = wasted power)
// - Front-to-back ratio (reflector spacing is critical)
// - Overall gain (misaligned spacing = lower efficiency)
export function getYagiRadiationPattern(vehicleKey, bonding, power, yagiConfig) {
  const vehicle = VEHICLES[vehicleKey] || VEHICLES['suburban'];
  const points = [];
  const gp = vehicle.groundPlane * (bonding ? 1.0 : 0.5);
  const posOffsets = yagiConfig?.elementPositions || {};
  
  // Yagi parameters
  const yagiGainDB = YAGI_ARRAY_CONFIG.baseGainDB + (yagiConfig?.stickType === 'fight-10' ? 1.5 : 0);
  const yagiGain = Math.pow(10, yagiGainDB / 10);
  const beamWidth = YAGI_ARRAY_CONFIG.beamWidth; // degrees
  
  // Calculate actual spacings vs optimal to determine pattern degradation
  const dir1OnTruck = yagiConfig?.dir1OnTruck !== false;
  const dir1BasePos = dir1OnTruck ? 42 : 96;
  const optimalSpacings = [72, dir1BasePos, 96, 96]; // ANT1→ANT2, ANT2→DIR1, DIR1→DIR2, DIR2→DIR3
  const actualPositions = [
    0 + (posOffsets.ant1 || 0),
    72 + (posOffsets.ant2 || 0),
    72 + dir1BasePos + (posOffsets.dir1 || 0),
    72 + dir1BasePos + 96 + (posOffsets.dir2 || 0),
    72 + dir1BasePos + 192 + (posOffsets.dir3 || 0),
  ];
  
  // Measure how far each spacing is from optimal
  let totalSpacingError = 0;
  let reflectorError = 0; // Specifically track reflector-driven spacing error
  for (let i = 0; i < optimalSpacings.length; i++) {
    const actual = actualPositions[i + 1] - actualPositions[i];
    const error = actual - optimalSpacings[i];
    totalSpacingError += Math.abs(error);
    if (i === 0) reflectorError = error; // negative = closer, positive = further
  }
  
  // Beam width changes:
  // - Directors closer → beam tries to narrow but coupling destabilizes it → widens
  // - Directors further → Yagi phasing weaker → beam widens
  // - Net effect: any spacing deviation broadens the beam
  const beamBroadening = totalSpacingError * 0.6; // degrees per inch of total error
  const adjustedBeamWidth = beamWidth + beamBroadening;
  const beamWidthRad = (adjustedBeamWidth * Math.PI) / 180;
  
  // Gain drops with spacing errors — misaligned phasing = less constructive interference
  const spacingGainPenalty = Math.pow(10, -(totalSpacingError * 0.12) / 10);
  
  // Side lobe levels increase with spacing errors — power goes into wrong directions
  const sideLobeBoost = 1 + totalSpacingError * 0.025;
  
  // Front-to-back ratio: reflector spacing is critical
  // Closer reflector = less front-to-back (more back radiation)
  // Further reflector = weaker reflection
  const backLobeBase = 0.08;
  const backLobeFromReflector = reflectorError < 0 
    ? backLobeBase + Math.abs(reflectorError) * 0.015  // closer = more back radiation
    : backLobeBase + reflectorError * 0.005;            // further = slight increase
  
  // Vehicle ground height affects vertical angle efficiency
  const groundHeightFactor = Math.min(1.2, (vehicle.groundHeight || 5) / 5);
  
  // Element height tuning affects SWR/efficiency
  const tuningEfficiency = yagiConfig?.swrTuned ? 1.0 : 0.85;
  
  // Forward direction is 270 degrees (up/north on canvas = front of vehicle)
  const forwardAngle = 270;
  const forwardRad = (forwardAngle * Math.PI) / 180;

  for (let angle = 0; angle < 360; angle += 2) {
    const rad = (angle * Math.PI) / 180;
    const angleDiff = rad - forwardRad;
    
    // Main lobe - Gaussian-like forward beam (width affected by spacing)
    const mainLobe = Math.exp(-Math.pow(angleDiff, 2) / (2 * Math.pow(beamWidthRad / 2.35, 2)));
    
    // Side lobes (boosted by spacing misalignment)
    const sideLobeAngle1 = Math.abs(angleDiff - Math.PI / 2);
    const sideLobeAngle2 = Math.abs(angleDiff + Math.PI / 2);
    const sideLobe = 0.15 * sideLobeBoost * (Math.exp(-Math.pow(sideLobeAngle1, 2) / 0.3) + Math.exp(-Math.pow(sideLobeAngle2, 2) / 0.3));
    
    // Back lobe (affected by reflector spacing)
    const backLobeAngle = Math.abs(Math.abs(angleDiff) - Math.PI);
    const backLobe = backLobeFromReflector * Math.exp(-Math.pow(backLobeAngle, 2) / 0.2);
    
    // Combine lobes
    let gain = mainLobe + sideLobe + backLobe;
    
    // Apply yagi gain (reduced by spacing penalty)
    gain *= yagiGain * spacingGainPenalty;
    
    // Ground plane and bonding effects
    gain *= (0.6 + gp * 0.4);
    
    // Vehicle height factor
    gain *= groundHeightFactor;
    
    // Tuning efficiency
    gain *= tuningEfficiency;
    
    // Add slight noise if bonding is poor
    if (!bonding) {
      gain += (Math.sin(angle * 5) * 0.1);
    }
    
    // Scale by power
    const scaledGain = Math.max(0.05, gain) * Math.log10(Math.max(1, power) + 1) / 4;
    points.push({ angle, gain: scaledGain });
  }
  return points;
}
