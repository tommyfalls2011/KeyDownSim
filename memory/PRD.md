# RF Visualizer "Key Down" - PRD

## Problem Statement
Build a Real-Time RF Visualizer for "Key Down" / "Big Radio" culture. Simulates CB radio signal chains (radio -> driver amp -> 16-pill final amp), vehicle body interaction effects on radiation patterns, and displays real-time canvas-based visualizations of signal lobes, voltage nodes, and take-off angles.

## Architecture
- **Backend**: FastAPI + MongoDB + JWT Auth + Stripe (emergentintegrations)
- **Frontend**: React + Canvas 2D + Shadcn UI + Tailwind CSS
- **Database**: MongoDB (users, configurations, payment_transactions)

## User Personas
- CB radio enthusiasts / "Big Radio" operators
- Amateur radio hobbyists
- Mobile radio installers

## Core Requirements
- Signal chain calculator (Radio -> Driver Amp -> Final Amp)
- Canvas-based radiation pattern visualization
- Vehicle ground plane simulation (Suburban, F-150, Ram, Van, Wagon)
- Bonding toggle for ground plane quality
- Voltage drop monitoring with alternator overload warnings
- Take-off angle meter + visualization
- Under-driven amplifier warning
- User auth (register/login with JWT)
- Save/load configurations
- Stripe subscription (Monthly $9.99 / Yearly $99.99)

## What's Been Implemented (Feb 2026)
- [x] Full backend with 20+ API endpoints (auth, configurations, subscription, RF calculation, equipment, admin)
- [x] Landing page with animated canvas hero, features section, pricing
- [x] Auth page (login/register with JWT)
- [x] Dashboard with 3-panel layout (Equipment Rack | Canvas Visualizer | Controls)
- [x] Equipment selectors (5 radios, 3 driver amps, 4 final amps, 4 antennas, 5 vehicles)
- [x] Canvas 2D radiation pattern visualization with polar grid
- [x] Vehicle silhouettes (top-down view for each type)
- [x] Key Down button (hold-to-transmit, keyboard support: Space/K)
- [x] Real-time metrics panel (Power, Peak, SWR, Voltage, Take-off Angle, Hold Time)
- [x] Bonding toggle affecting radiation pattern quality
- [x] Extra alternator toggle for voltage drop simulation
- [x] Voltage drop warnings when system is overloaded
- [x] Save/load configurations
- [x] Configurations page with list and delete
- [x] Subscription page with Stripe checkout integration
- [x] Dark "Digital Shack" theme (Black/Cyan/White)
- [x] Admin Panel at /admin (hidden from regular users)
- [x] Admin account seeded: fallstommy@gmail.com / admin123
- [x] Equipment data stored in MongoDB (seeded from defaults, admin-manageable)
- [x] "Made with Emergent" badge hidden via CSS
- [x] Under-driven amplifier warning (amber box in Equipment Rack + canvas overlay)
- [x] Take-off angle side-view visualization (mini diagram in canvas bottom-right)
- [x] Backend /api/calculate returns under_driven, drive_ratio, drive_watts, ideal_drive

## Testing Results
- Backend: 100% pass
- Frontend: 100% pass
- Test report: /app/test_reports/iteration_3.json

## Prioritized Backlog
### P1 (High)
- Antenna position selector on vehicle (roof, trunk, bumper)
- SWR sweep graph (frequency vs SWR curve)

### P2 (Medium)
- Share configurations via link
- Comparison mode (side-by-side configs)
- Export radiation pattern as image
- Audio feedback on Key Down (simulated static/skip)

### P3 (Nice to have)
- Community configs gallery
- Real-time multiplayer (see others' signals)
- Weather/propagation overlay
- 3D visualization upgrade (Three.js)

## Refactoring Backlog
- Split AdminPage.jsx into smaller tab components
- Clean up RF simulation logic in server.py and rfEngine.js (comments, standardize variable names)

## Next Tasks
1. Antenna position selection on vehicle
2. SWR frequency sweep chart
3. Share configurations via link
