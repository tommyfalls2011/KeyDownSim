// ─── RF Equipment Database ───

export const RADIOS = {
  'cobra-29': { name: 'Cobra 29 LTD', deadKey: 0.75, peakKey: 25, type: 'AM', impedance: 50 },
  'galaxy-959': { name: 'Galaxy DX 959', deadKey: 2, peakKey: 40, type: 'AM/SSB', impedance: 50 },
  'stryker-955': { name: 'Stryker SR-955HPC', deadKey: 3, peakKey: 125, type: 'AM/SSB', impedance: 50 },
  'connex-4300': { name: 'Connex 4300HP', deadKey: 3.5, peakKey: 160, type: 'AM/SSB', impedance: 50 },
  'ranger-rci2970': { name: 'Ranger RCI-2970N2', deadKey: 4, peakKey: 225, type: 'AM/SSB', impedance: 50 },
};

export const DRIVER_AMPS = {
  'none': { name: 'No Driver', gainDB: 0, transistors: 0, currentDraw: 0, wattsPerPill: 275, combiningStages: 0 },
  '1-pill': { name: '1-Pill Driver', gainDB: 13, transistors: 1, currentDraw: 15, wattsPerPill: 275, combiningStages: 0 },
  '2-pill': { name: '2-Pill Driver', gainDB: 17, transistors: 2, currentDraw: 50, wattsPerPill: 275, combiningStages: 0 },
  '3-pill': { name: '3-Pill (1→2)', gainDB: 13, transistors: 3, currentDraw: 65, wattsPerPill: 185, combiningStages: 0 },
  '4-pill': { name: '4-Pill Driver', gainDB: 20, transistors: 4, currentDraw: 100, wattsPerPill: 275, combiningStages: 1 },
  '2x4': { name: '2x4 Combo (2→4)', gainDB: 17, transistors: 6, currentDraw: 130, wattsPerPill: 250, combiningStages: 1 },
  '2x6': { name: '2x6 Combo (2→6)', gainDB: 18, transistors: 8, currentDraw: 180, wattsPerPill: 250, combiningStages: 1 },
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
  'suburban': { name: 'Suburban/SUV', groundPlane: 0.88, surfaceSqFt: 42, directional: 0.12, takeoff: 22, shape: 'suv', groundHeight: 5.5 },
  'f150': { name: 'Ford F-150', groundPlane: 0.62, surfaceSqFt: 28, directional: 0.48, takeoff: 35, shape: 'truck', groundHeight: 5.0 },
  'ram': { name: 'Dodge Ram', groundPlane: 0.68, surfaceSqFt: 31, directional: 0.42, takeoff: 32, shape: 'truck', groundHeight: 5.2 },
  'van': { name: 'Cargo Van', groundPlane: 0.92, surfaceSqFt: 52, directional: 0.08, takeoff: 18, shape: 'van', groundHeight: 7.0 },
  'wagon': { name: 'Station Wagon', groundPlane: 0.80, surfaceSqFt: 36, directional: 0.20, takeoff: 26, shape: 'wagon', groundHeight: 4.5 },
  'semi': { name: 'Semi Truck', groundPlane: 0.95, surfaceSqFt: 65, directional: 0.05, takeoff: 15, shape: 'semi', groundHeight: 8.5 },
  'jeep': { name: 'Jeep Wrangler', groundPlane: 0.55, surfaceSqFt: 22, directional: 0.55, takeoff: 40, shape: 'jeep', groundHeight: 4.0 },
};

// Yagi Array Element Positions (distances in inches from rear antenna)
// ANT1 = rear (reflector), ANT2 = driven element, DIR1-3 = directors
export const YAGI_ARRAY_CONFIG = {
  elements: [
    { id: 'ant1', name: 'ANT1 (Reflector)', position: 0, heightOffset: 0, tunable: true, defaultHeight: 96 },      // rear, base height
    { id: 'ant2', name: 'ANT2 (Driven)', position: 72, heightOffset: 0, tunable: true, defaultHeight: 96 },        // 72" forward
    { id: 'dir1', name: 'DIR1', position: 72 + 42, heightOffset: -12, tunable: true, defaultHeight: 84 },          // 3.5' forward, 1' shorter
    { id: 'dir2', name: 'DIR2', position: 72 + 42 + 96, heightOffset: 15, tunable: false, defaultHeight: 111 },    // 8' forward, 15" taller
    { id: 'dir3', name: 'DIR3', position: 72 + 42 + 96 + 96, heightOffset: 15, tunable: false, defaultHeight: 111 }, // 8' forward, same as DIR2
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
function transformAmp(d) {
  return { name: d.name, gainDB: d.gain_db ?? d.gainDB ?? 0, transistors: d.transistors || 0, currentDraw: d.current_draw ?? d.currentDraw ?? 0, wattsPerPill: d.watts_per_pill ?? d.wattsPerPill ?? 275, combiningStages: d.combining_stages ?? d.combiningStages ?? 0 };
}
function transformAntenna(d) {
  return { name: d.name, gainDBI: d.gain_dbi ?? d.gainDBI ?? 0, type: d.type || 'vertical', tunable: d.tunable || false, tipMin: d.tip_min ?? d.tipMin, tipMax: d.tip_max ?? d.tipMax, tipDefault: d.tip_default ?? d.tipDefault };
}
function transformVehicle(d) {
  return { name: d.name, groundPlane: d.ground_plane ?? d.groundPlane ?? 0.7, surfaceSqFt: d.surface_sqft ?? d.surfaceSqFt ?? 30, directional: d.directional ?? 0.2, takeoff: d.takeoff ?? 25, shape: d.shape || 'truck' };
}

export function mergeEquipmentFromAPI(apiData) {
  if (apiData.radios) {
    for (const [key, data] of Object.entries(apiData.radios)) {
      RADIOS[key] = transformRadio(data);
    }
  }
  if (apiData.driver_amps) {
    for (const [key, data] of Object.entries(apiData.driver_amps)) {
      DRIVER_AMPS[key] = transformAmp(data);
    }
  }
  if (apiData.final_amps) {
    for (const [key, data] of Object.entries(apiData.final_amps)) {
      FINAL_AMPS[key] = transformAmp(data);
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
// Returns both dead key and peak ratios so current swings with modulation
export function calculateStageOutputs(radioKey, driverKey, finalKey, bonding, driveLevel) {
  const radio = RADIOS[radioKey] || RADIOS['cobra-29'];
  const driver = DRIVER_AMPS[driverKey] || DRIVER_AMPS['none'];
  const final_ = FINAL_AMPS[finalKey] || FINAL_AMPS['none'];
  const bondingFactor = bonding ? 1.0 : 0.6;
  const dl = driveLevel ?? 1.0;

  // Drive level scales radio output — 4:1 ratio preserved
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
  const pos = ANTENNA_POSITIONS[antennaPosKey] || ANTENNA_POSITIONS['center'];
  const dl = driveLevel ?? 1.0;

  // Voltage scaling: amps are rated at ~13.8V nominal
  // Power scales roughly with V² — but we use a gentler curve for realism
  // At 14.2V (typical running) = baseline, at 18V = significant boost
  const nominalVoltage = 13.8;
  const voltage = ampVoltage ?? 14.2;
  // Gentler scaling: sqrt of V²/Vnom² = V/Vnom, then blend 50/50 with linear
  const vRatio = voltage / nominalVoltage;
  const voltageBoost = (vRatio + vRatio * vRatio) / 2; // Blend linear + squared

  let deadKey = radio.deadKey * dl;
  let peakKey = radio.peakKey * dl;

  // Driver stage: high gain but capped at pills x wpp x compounded combining bonus
  // Voltage boost applies to amp output, not radio
  if (driver.gainDB > 0) {
    const driverGain = Math.pow(10, driver.gainDB / 10);
    const stages = driver.combiningStages || 0;
    const combining = Math.pow(COMBINING_BONUS_PER_STAGE, stages);
    // Max output scales with voltage
    const driverMax = driver.transistors * (driver.wattsPerPill || 275) * combining * voltageBoost;
    deadKey = Math.min(deadKey * driverGain * voltageBoost, driverMax);
    peakKey = Math.min(peakKey * driverGain * voltageBoost, driverMax);
  }

  // Final stage: lower gain but capped at pills x wpp x compounded combining bonus
  if (final_.gainDB > 0) {
    const finalGain = Math.pow(10, final_.gainDB / 10);
    const stages = final_.combiningStages || 0;
    const combining = Math.pow(COMBINING_BONUS_PER_STAGE, stages);
    // Max output scales with voltage
    const finalMax = final_.transistors * (final_.wattsPerPill || 275) * combining * voltageBoost;
    deadKey = Math.min(deadKey * finalGain * voltageBoost, finalMax);
    peakKey = Math.min(peakKey * finalGain * voltageBoost, finalMax);
  }

  // Antenna position affects pattern shape (directional), NOT total power output
  // The amp puts out the same watts — the ground plane redirects it

  const bondingFactor = bonding ? 1.0 : 0.6;
  return {
    deadKey: deadKey * bondingFactor,
    peakKey: peakKey * bondingFactor,
  };
}

export function calculateVoltageDrop(driverKey, finalKey, alternatorCount, alternatorAmps, batteryType, batteryCount, regulatorVoltages, actualDemandCurrent) {
  const driver = DRIVER_AMPS[driverKey] || DRIVER_AMPS['none'];
  const final_ = FINAL_AMPS[finalKey] || FINAL_AMPS['none'];

  // Use actual demand if provided (keyed state), otherwise rated max
  const ratedMax = driver.currentDraw + final_.currentDraw;
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

export function calculateSWR(antennaKey, vehicleKey, bonding, tipLength) {
  const antenna = ANTENNAS[antennaKey] || ANTENNAS['whip-102'];
  const vehicle = VEHICLES[vehicleKey] || VEHICLES['suburban'];

  // Base SWR — a perfect antenna on a perfect ground plane
  let baseSWR = 1.0;
  if (antenna.type === 'mag-mount') baseSWR = 1.2;
  else if (antenna.type === 'base-load') baseSWR = 1.05;

  // Vehicle surface area penalty — less metal = worse SWR
  const surfacePenalty = (1 - vehicle.groundPlane) * 2.5;
  let swr = baseSWR + surfacePenalty;

  // Bonding — all panels grounded together dramatically lowers SWR
  if (!bonding) {
    swr += 0.9;
  }

  // Tunable tip — when set to the sweet spot, SWR drops to near 1.0
  // The "sweet spot" is the antenna's default tip length for resonance
  if (antenna.tunable && tipLength !== undefined) {
    const sweetSpot = antenna.tipDefault || 44;
    const deviation = Math.abs(tipLength - sweetSpot);
    // Every inch off the sweet spot adds ~0.05 SWR
    const tipPenalty = deviation * 0.05;
    // But when tuned right, the tip can subtract up to 0.4 SWR
    const tipBonus = Math.max(0, 0.4 - tipPenalty);
    swr = swr - tipBonus + Math.max(0, tipPenalty - 0.4) * 0.5;
  }

  // With perfect tuning + bonding + good ground plane, SWR can hit 1.0
  return Math.round(Math.max(1.0, swr) * 10) / 10;
}

// ─── Yagi Array SWR Calculation ───
// SWR depends on element height tuning AND element spacing — both affect impedance matching
// Physics: mutual coupling between elements changes feed-point impedance
// - Closer spacing → capacitive coupling increases exponentially → impedance mismatch → SWR spikes
// - Further spacing → coupling drops, Yagi phasing weakens → SWR rises gently
// - Absolute position shift → ground plane asymmetry on vehicle roof → SWR rises
// At 27MHz: λ ≈ 432", ¼λ ≈ 108". Optimal Yagi spacings are 0.1–0.25λ.
export function calculateYagiSWR(vehicleKey, bonding, yagiConfig) {
  const vehicle = VEHICLES[vehicleKey] || VEHICLES['suburban'];
  const heights = yagiConfig?.elementHeights || {};
  const posOffsets = yagiConfig?.elementPositions || {};
  const stickType = yagiConfig?.stickType || 'fight-8';
  
  // Base SWR depends on ground plane and bonding
  let baseSWR = 1.0;
  const surfacePenalty = (1 - vehicle.groundPlane) * 1.5;
  baseSWR += surfacePenalty;
  
  if (!bonding) {
    baseSWR += 0.8;
  }
  
  // ─── Height Tuning ───
  const optimalHeights = stickType === 'fight-10' ? {
    ant1: 120, ant2: 120, dir1: 108, dir2: 135, dir3: 135,
  } : {
    ant1: 96, ant2: 96, dir1: 84, dir2: 111, dir3: 111,
  };
  
  const ant1Dev = Math.abs((heights.ant1 || optimalHeights.ant1) - optimalHeights.ant1);
  const ant2Dev = Math.abs((heights.ant2 || optimalHeights.ant2) - optimalHeights.ant2);
  const dir1Dev = Math.abs((heights.dir1 || optimalHeights.dir1) - optimalHeights.dir1);
  
  const ant1Penalty = ant1Dev * 0.03;
  const ant2Penalty = ant2Dev * 0.06;
  const dir1Penalty = dir1Dev * 0.04;
  
  // ─── Element Spacing — Mutual Coupling Model ───
  // Default optimal spacings between adjacent elements (inches)
  const dir1OnTruck = yagiConfig?.dir1OnTruck !== false;
  const dir1BasePos = dir1OnTruck ? 42 : 96;
  const optimalSpacings = [
    { name: 'ANT1↔ANT2', optimal: 72, weight: 1.0 },              // reflector↔driven: MOST critical
    { name: 'ANT2↔DIR1', optimal: dir1BasePos, weight: 0.8 },     // driven↔dir1: high impact
    { name: 'DIR1↔DIR2', optimal: 96, weight: 0.4 },              // dir1↔dir2: moderate
    { name: 'DIR2↔DIR3', optimal: 96, weight: 0.2 },              // dir2↔dir3: lower impact
  ];
  
  // Actual positions with offsets applied
  const positions = [
    0 + (posOffsets.ant1 || 0),                                     // ANT1
    72 + (posOffsets.ant2 || 0),                                    // ANT2
    72 + dir1BasePos + (posOffsets.dir1 || 0),                      // DIR1
    72 + dir1BasePos + 96 + (posOffsets.dir2 || 0),                 // DIR2
    72 + dir1BasePos + 192 + (posOffsets.dir3 || 0),                // DIR3
  ];
  
  let spacingPenalty = 0;
  for (let i = 0; i < optimalSpacings.length; i++) {
    const actualSpacing = positions[i + 1] - positions[i];
    const optimal = optimalSpacings[i].optimal;
    const weight = optimalSpacings[i].weight;
    const deviation = actualSpacing - optimal;
    
    if (deviation < 0) {
      // CLOSER than optimal — capacitive coupling increases exponentially
      // Under ¼λ (~108"), coupling is already significant
      // Going closer makes it much worse — impedance drops away from 50Ω fast
      const closerInches = Math.abs(deviation);
      // Exponential curve: 1" closer = mild, 6" closer = noticeable, 12" closer = severe
      spacingPenalty += weight * (0.04 * closerInches + 0.008 * Math.pow(closerInches, 1.5));
    } else {
      // FURTHER than optimal — Yagi phasing weakens, but coupling reduces
      // This is gentler — the antenna just becomes less efficient as a Yagi
      // Past ~0.4λ spacing the Yagi effect breaks down
      const furtherInches = deviation;
      spacingPenalty += weight * (0.02 * furtherInches);
    }
  }
  
  // ─── Ground Plane / Edge Effect ───
  // On a vehicle roof, all antennas share the same ground plane (metal roof)
  // Shifting the entire array forward or backward changes where elements sit
  // relative to the roof edges — elements near edges see asymmetric ground plane
  // This is an absolute-position effect, not just relative spacing
  const avgOffset = ((posOffsets.ant1 || 0) + (posOffsets.ant2 || 0) + 
    (posOffsets.dir1 || 0) + (posOffsets.dir2 || 0) + (posOffsets.dir3 || 0)) / 5;
  // Individual elements that deviate far from center of array shift toward roof edge
  const edgePenalty = [
    posOffsets.ant1 || 0, posOffsets.ant2 || 0, posOffsets.dir1 || 0,
    posOffsets.dir2 || 0, posOffsets.dir3 || 0
  ].reduce((sum, offset) => {
    // Elements pushed toward either edge of the vehicle get worse ground plane
    const distFromArrayCenter = Math.abs(offset - avgOffset);
    return sum + distFromArrayCenter * 0.01;
  }, 0);
  // Whole-array shift: if the entire lineup moves, the front/rear elements
  // get closer to roof edges → asymmetric image → SWR drift
  const arrayShiftPenalty = Math.abs(avgOffset) * 0.015;
  
  // ─── Total SWR ───
  let swr = baseSWR + ant1Penalty + ant2Penalty + dir1Penalty + spacingPenalty + edgePenalty + arrayShiftPenalty;
  
  // When all elements are well-tuned (heights AND positions near optimal), bonus
  const totalHeightDev = ant1Dev + ant2Dev + dir1Dev;
  const totalPosDev = Math.abs(posOffsets.ant1 || 0) + Math.abs(posOffsets.ant2 || 0) + 
    Math.abs(posOffsets.dir1 || 0) + Math.abs(posOffsets.dir2 || 0) + Math.abs(posOffsets.dir3 || 0);
  if (totalHeightDev <= 6 && totalPosDev <= 6) {
    swr -= 0.3 * (1 - Math.max(totalHeightDev, totalPosDev) / 6);
  }
  
  return Math.round(Math.max(1.0, Math.min(5.0, swr)) * 10) / 10;
}

export function calculateTakeoffAngle(vehicleKey, bonding) {
  const vehicle = VEHICLES[vehicleKey] || VEHICLES['suburban'];
  const bondingPenalty = bonding ? 0 : 15;
  return vehicle.takeoff + bondingPenalty;
}

// ─── Under-Driven Detection ───

export function checkUnderDriven(radioKey, driverKey, finalKey, bonding, driveLevel) {
  const radio = RADIOS[radioKey] || RADIOS['cobra-29'];
  const driver = DRIVER_AMPS[driverKey] || DRIVER_AMPS['none'];
  const final_ = FINAL_AMPS[finalKey] || FINAL_AMPS['none'];
  const dl = driveLevel ?? 1.0;

  if (final_.gainDB <= 0) return { isUnderDriven: false, driveRatio: 1.0, driveWatts: 0, finalCapacity: 0 };

  // Calculate what driver stage outputs (power going INTO the final amp)
  let driveWatts = radio.deadKey * dl;
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
