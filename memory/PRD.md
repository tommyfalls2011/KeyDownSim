# Key Down RF Visualizer - PRD

## Original Problem Statement
Build a "Key Down" RF Visualizer application — a real-time, canvas-based 2D/pseudo-3D visualization of an antenna's radiation pattern with a complete RF simulation engine.

## Core Requirements
- Real-time canvas-based radiation pattern visualization
- Realistic signal chain simulation (radio, driver amp, final amp)
- Physics modeling: power (watts), current draw (amps), voltage drop, SWR, thermal dynamics
- Vehicle types, alternator configurations, external voltage regulators, wiring, battery banks
- Various antenna types with tunable elements affecting SWR
- Antenna placement on vehicle affects radiation pattern
- Microphone audio modulates power output (dead key to peak)
- User authentication (login/register) to save/load configurations
- Stripe subscription model (monthly/yearly)
- Admin panel (fallstommy@gmail.com / admin123) — manage users, configs, equipment
- Dark dashboard theme with neon/LED-style accents, segmented LED bar meters
- PWA-installable responsive web app

## Tech Stack
- Frontend: React (CRA), TailwindCSS, Shadcn UI, Canvas API
- Backend: FastAPI, Motor (async MongoDB), Pydantic, JWT
- Database: MongoDB
- Payments: Stripe (test mode)

## What's Been Implemented
- Full authentication system (JWT-based)
- Stripe subscription integration (test mode)
- Admin panel with equipment management form
- Complete RF simulation engine (signal chain, voltage, SWR, radiation patterns)
- Tunable antennas (Predator 10K variants, Fight Stix) with SWR tip adjustment
- Antenna positioning with directional pattern effects
- Microphone modulation (live mic input)
- External voltage regulators (up to 20V)
- Thermal simulation with blown pill mechanics (FIXED Feb 2026)
- LED-style meter bars
- Take-off angle visualization
- Under-driven amplifier warnings
- Auto-scaling distance labels on canvas
- Voltage-to-watts scaling (more volts = more watts, like real amps)
- **Thermal Preview** - "Test Config" button simulates key-down to predict thermal behavior before going live

## Bug Fixes
- [Feb 2026] Fixed thermal simulation stale closure bug: temps now properly rise/cool across multiple key-down cycles. Root cause: setInterval callback captured stale `keyed`, `driverBlown`, `finalBlown` values. Fix: useRef pattern to always read latest state.
- [Feb 2026] Updated thermal model to realistic 2SC2879 transistor data: BLOW_TEMP=175°C (actual max junction), HEAT_BASE_RATE=3°C/sec for 2-pill reference (was 15°C/sec — way too fast), COOL_RATE=2°C/sec (realistic heatsink). Heat rate scales by sqrt(transistors/2) — more pills = more thermal mass = slower heating. 2-pill blows in ~50s, 4-pill ~70s, 8-pill ~100s, 16-pill ~142s.
- [Dec 2025] Fixed P0 bug: Admin-edited equipment not appearing in UI dropdowns. Root cause: mergeEquipmentFromAPI mutated RADIOS/DRIVER_AMPS/FINAL_AMPS/ANTENNAS objects but React didn't re-render because EquipmentRack.js imported these at module load time. Fix: Added useMemo hooks in EquipmentRack.js that re-snapshot equipment objects when equipmentLoaded state changes, triggering proper re-renders with database values.
- [Dec 2025] Added voltage-to-watts scaling: Amplifier output now scales with regulator voltage. Higher voltage = more watts (P ∝ V²). At 14.2V baseline, a 4-pill final outputs ~546W. At 19V, same setup outputs ~1,342W. Uses realistic blend formula: (V/Vnom + (V/Vnom)²) / 2 where nominal voltage is 13.8V.

## Prioritized Backlog
### P0
- Yagi-Uda Antenna Array Simulation: "Antenna Array" selector for 2, 3, or 5-element arrays with 9-11 dB forward gain and narrow directional beam

### P1
- Over-drive Thermal Penalty: Over-driving an amp accelerates heat generation, making blown pills more likely

### P2
- Receive Sensitivity Indicator: UI element showing receive sensitivity loss based on antenna position (dBLoss data already exists)

### P3
- Refactor RFContext.js: Decompose into smaller hooks (useThermalSim, useVoltageSim, useMicModulation)

### P4
- Refactor AdminPage.js: Split into smaller child components per tab
