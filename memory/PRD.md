# Key Down RF Visualizer - PRD

## Original Problem Statement
Build a "Key Down" RF Visualizer application — a real-time, canvas-based 2D/pseudo-3D visualization of an antenna's radiation pattern with a full RF signal chain simulation.

## Architecture
```
/app
├── backend/
│   └── server.py              (FastAPI + Motor + JWT + Stripe)
├── frontend/
│   ├── src/
│   │   ├── components/        (ControlPanel, CanvasVisualizer, MetricsPanel, KeyButton, etc.)
│   │   ├── context/           (RFContext.js, AuthContext.js)
│   │   ├── lib/               (rfEngine.js — simulation engine)
│   │   └── pages/             (Dashboard, Landing, Admin, Subscription)
│   └── ...
├── static-build/
│   ├── build-static.sh        ← Automated: copies src, fixes imports, builds, zips
│   ├── dist/                  ← Working directory for static react app
│   │   └── build/             ← Final deployable output
│   ├── keydown-rf-static.zip  ← Zip for user download
│   ├── rfEngine.js            ← Static engine (hardcoded equipment)
│   ├── RFContextStatic.js     ← Static context (no backend API)
│   ├── ControlPanelStatic.js  ← Static ControlPanel (no auth/save)
│   └── App.js                 ← Static app entry
└── memory/PRD.md
```

## Deployment
### VPS (Full App)
- IONOS VPS M: Ubuntu 24.04, 4GB RAM, 2 vCores
- IP: 67.217.240.35
- Domain: simulator.sma-antenna.org (HTTPS via Certbot)
- Stack: Nginx → React build + FastAPI (systemd) + MongoDB 8.0
- Update command: `cd /var/www/keydown && git pull && cd frontend && npx craco build && systemctl restart keydown-backend`

### Static Build (sma-antenna.org)
- Upload CONTENTS of build/ to /public_html/simulator/

## Core Features Implemented
- **RF Simulation Engine**: Signal chain, voltage drop, SWR, thermal dynamics, radiation patterns
- **Combo Driver Amps**: 3-pill (1→2), 2x4 (2→4), 2x6 (2→6) with realistic power models
- **5-Element Yagi Array**: Directional beam, tunable elements, SWR calculation
- **DIR1 Position Toggle**: Switch DIR1 between "On Truck" and "Front Beam"
- **Over-drive Thermal Penalty**: Exponential heat scaling when amps are over-driven (driver + final)
- **Receive Sensitivity Indicator**: Shows dB loss based on antenna position
- **Yagi Element Position Adjust**: ±12" forward/backward sliders per element with SWR and beam pattern impact
- **Voltage-to-Watts Scaling**: Realistic power output scaling with voltage
- **Thermal Preview**: "Test Config" to predict thermal stress/component failure
- **Amplifier Math**: Correct power output for 16/24/32-pill amplifiers
- **User System**: JWT auth, save/load configurations
- **Subscription**: Stripe integration (test mode)
- **Admin Panel**: User management, equipment management, config viewing
- **Static Build**: Backend-less version for sma-antenna.org
- **PWA**: Installable, dark dashboard theme, LED-style meters

## Key DB Schema
- **users**: `{_id, email, hashedPassword, role, stripeCustomerId, subscriptionStatus}`
- **configurations**: `{_id, userId, name, ..., driveLevel, antennaPosition, yagiConfig}`
- **equipment**: `{_id, type, name, specs...}`

## API Endpoints
- `/api/auth/*` — Login, Register
- `/api/configs` — Save/Load configurations
- `/api/equipment` — Get equipment list
- `/api/admin/equipment` — Admin CRUD for equipment

## Credentials
- **Admin**: `fallstommy@gmail.com` / `admin123`

## Prioritized Backlog

### Completed
- All core simulation features
- **Transistor + Box Size + Heatsink System**: Replaced all old fixed amp presets with real transistor data
  - 6 transistor types: Toshiba 2SC2879, HG 2SC2879, Mitsubishi 2SC3240, MRF454, SD1446, HG SD1446
  - 9 box sizes: 1, 2, 3, 4, 6, 8, 16, 24, 32 pills
  - **5-tier heatsink system** (upgraded from 3-tier):
    - Small (passive fins) — 1-2 pills, coolRate 0.6
    - Medium (finned + fan) — 3-4 pills, coolRate 1.5
    - Large (extruded + high-CFM) — 6-8 pills, coolRate 3.0
    - XL (bonded fin + dual fans) — 12-16 pills, coolRate 5.0
    - Extreme (machined radiator) — 24-32 pills, coolRate 8.0
  - Auto-selects recommended heatsink when box size changes
  - Undersized heatsink warning with recommended alternative
  - Efficiency-based thermal model: less efficient pills waste more heat
  - Heatsink affects cooling rate and equilibrium temp
- Yagi Array + DIR1 Position Toggle
- Over-drive thermal penalty (enhanced)
- Receive sensitivity indicator
- Static build layout fix + Yagi toggle fix
- VPS deployment to IONOS (simulator.sma-antenna.org)
- Yagi element position adjustments (±12" per element, SWR-reactive)
- Equipment DB sync fix: All items now upserted on startup

### Future Tasks
- P1: Refactor RFContext.js into smaller hooks
- P2: Refactor AdminPage.js into smaller child components
- P3: Move build-static.sh inline components to dedicated files
- P4: Update static build to support new transistor system + 5-tier heatsinks

## 3rd Party Integrations
- **Stripe** — Payment/subscription (test mode)

## Session Log
### Feb 14, 2026 (Session 2)
- Fixed P0 bug: Combo amps (2x4, 2x6) and other new equipment missing from Admin Panel
  - Root cause: startup seed_data only inserted when equipment collection was empty
  - Fix: Changed to upsert pattern — syncs all 52 default items on every startup
  - Also updated all backend equipment specs to match frontend rfEngine.js exactly
  - All tests passing (iteration_13: 100% — 10/10 backend, frontend verified)

### Feb 17, 2026
- Added Yagi element position adjustment (±12" per element, all 5 elements)
- Improved SWR physics model with realistic mutual coupling:
  - Asymmetric penalty: closer spacing = exponential coupling spike (capacitive), further = gentler (phasing loss)
  - Ground plane edge effect: uniform array shift raises SWR from vehicle roof asymmetry
  - Vehicle-dependent: smaller ground planes (Jeep) amplify coupling problems vs larger (Suburban)
  - Non-linear curve: 1/distance² coupling relationship with fractional spacing loss
- Radiation pattern responds to spacing: beam broadens, side lobes grow, front-to-back ratio degrades
- Canvas visualizer shows position offset labels on moved elements
- Color-coded offset display (green=forward, red=backward, neutral=center)
- Updated static build with all position adjustment features
- All tests passing (iteration_12: 100% frontend pass rate, plus programmatic math verification)

### Feb 14, 2026
- Fixed DashboardStatic layout (center view regression)
- Fixed RFContextStatic metrics naming (deadKey → deadKeyWatts)
- Added combo driver amps: 3-Pill (1→2), 2x4 (2→4), 2x6 (2→6)

### Feb 19, 2026
- Upgraded heatsink system from 3 tiers to 5 tiers based on user's real-world specifications:
  - Small (1-2 pills), Medium (3-4), Large (6-8), XL (12-16), Extreme (24-32)
  - Each tier has calibrated thermalResistance and coolRate values
- Added auto-select: changing box size auto-picks the recommended heatsink
- Added undersized heatsink warning with recommendation
- Updated backend, frontend, and thermal model
- All tests passing (iteration_15: 100% backend + frontend)
- Added Yagi DIR1 Position Toggle (On Truck / Front Beam)
- Enhanced over-drive thermal penalty with exponential scaling
- Added Receive Sensitivity Loss indicator
- Deployed full app to IONOS VPS (simulator.sma-antenna.org)
- Rebuilt static site with all changes
- All tests passing (iteration_10: 19/19, iteration_11: 13/13)
