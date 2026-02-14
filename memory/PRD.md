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

## Core Features Implemented
- **RF Simulation Engine**: Signal chain, voltage drop, SWR, thermal dynamics, radiation patterns
- **5-Element Yagi Array**: Directional beam, tunable elements, SWR calculation, canvas visualization (main app + static build)
- **Voltage-to-Watts Scaling**: Realistic power output scaling with voltage
- **Thermal Preview**: "Test Config" to predict thermal stress/component failure
- **Amplifier Math**: Correct power output for 16/24/32-pill amplifiers
- **User System**: JWT auth, save/load configurations
- **Subscription**: Stripe integration (test mode)
- **Admin Panel**: User management, equipment management, config viewing
- **Static Build**: Backend-less version for sma-antenna.org
- **PWA**: Installable, dark dashboard theme, LED-style meters

## Static Build Deployment Instructions
1. Agent runs: `cd /app/static-build && bash build-static.sh`
2. User clicks "Save to GitHub" in Emergent chat
3. User downloads `keydown-rf-static.zip` from GitHub
4. User unzips — gets a `build/` folder
5. User uploads the **CONTENTS** of `build/` (NOT the folder itself) into `/public_html/simulator/` on cPanel
6. Overwrite all existing files

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

### P0 (Done)
- Yagi Array Simulation — Complete (main + static)
- Static Build Yagi Port — Complete
- Admin Equipment Bug Fix — Complete
- Amplifier Math Fix — Complete
- Select Dropdown Click Fix — Complete (cursor-pointer + pointer-events fix)
- Static Build Layout Fix — Complete (center view h-screen + flex-1 relative wrapper)
- Static Build Metrics Fix — Complete (deadKey -> deadKeyWatts)
- Static Build Yagi Toggle Fix — Complete (verified in rebuilt static bundle)

### P0 (Next)
- Yagi DIR1 Position Toggle: Switch DIR1 between "on the truck" vs "on the front beam" (main app + static build)

### P1
- Over-drive Thermal Penalty: Over-driving amps accelerates heat, blown pill more likely

### P2
- Receive Sensitivity Indicator: Show dB loss based on antenna position

### P3
- Refactor RFContext.jsx into smaller hooks (useThermalSim, useVoltageSim, etc.)

### P4
- Refactor AdminPage.jsx into smaller child components per tab

### P5
- Refactor build-static.sh: Move inline React components into dedicated .js files

## 3rd Party Integrations
- **Stripe** — Payment/subscription (test mode)

## Session Log
### Feb 14, 2026 (Current Fork)
- Fixed DashboardStatic layout: changed from min-h-screen + plain flex to h-screen flex-col overflow-hidden with proper flex-1 relative canvas wrapper
- Fixed RFContextStatic metrics: renamed deadKey to deadKeyWatts to match MetricsPanel expectations
- Rebuilt static site with all fixes (keydown-rf-static.zip regenerated)
- All 19 frontend tests passed (100% success rate) - Yagi toggle, layout, dropdowns, metrics verified
