# RF Visualizer "Key Down" - PRD

## Problem Statement
Build a Real-Time RF Visualizer for "Key Down" / "Big Radio" culture. Simulates CB radio signal chains (radio → driver amp → 16-pill final amp), vehicle body interaction effects on radiation patterns, and displays real-time canvas-based visualizations of signal lobes, voltage nodes, and take-off angles.

## Architecture
- **Backend**: FastAPI + MongoDB + JWT Auth + Stripe (emergentintegrations)
- **Frontend**: React + Canvas 2D + Shadcn UI + Tailwind CSS
- **Database**: MongoDB (users, configurations, payment_transactions)

## User Personas
- CB radio enthusiasts / "Big Radio" operators
- Amateur radio hobbyists
- Mobile radio installers

## Core Requirements
- Signal chain calculator (Radio → Driver Amp → Final Amp)
- Canvas-based radiation pattern visualization
- Vehicle ground plane simulation (Suburban, F-150, Ram, Van, Wagon)
- Bonding toggle for ground plane quality
- Voltage drop monitoring with alternator overload warnings
- Take-off angle meter
- User auth (register/login with JWT)
- Save/load configurations
- Stripe subscription (Monthly $9.99 / Yearly $99.99)

## What's Been Implemented (Feb 2026)
- [x] Full backend with 12+ API endpoints (auth, configurations, subscription, RF calculation, equipment)
- [x] Landing page with animated canvas hero, features section, pricing
- [x] Auth page (login/register with JWT)
- [x] Dashboard with 3-panel layout (Equipment Rack | Canvas Visualizer | Controls)
- [x] Equipment selectors (5 radios, 3 driver amps, 4 final amps, 4 antennas, 5 vehicles)
- [x] Canvas 2D radiation pattern visualization with polar grid
- [x] Vehicle silhouettes (top-down view for each type)
- [x] Key Down button (hold-to-transmit, keyboard support: Space/K)
- [x] Real-time metrics panel (Power, Peak, SWR, Voltage, Take-off Angle)
- [x] Bonding toggle affecting radiation pattern quality
- [x] Extra alternator toggle for voltage drop simulation
- [x] Voltage drop warnings when system is overloaded
- [x] Save/load configurations
- [x] Configurations page with list and delete
- [x] Subscription page with Stripe checkout integration
- [x] Dark "Digital Shack" theme (Black/Cyan/White)

## Testing Results
- Backend: 100% pass (all 12 endpoints)
- Frontend: 95% pass (minor badge overlay fixed)

## Prioritized Backlog
### P0 (Critical)
- All P0 features implemented

### P1 (High)
- Side-view take-off angle visualization (currently just a number)
- Antenna position selector on vehicle (roof, trunk, bumper)
- SWR sweep graph (frequency vs SWR curve)

### P2 (Medium)
- Share configurations via link
- Comparison mode (side-by-side configs)
- Export radiation pattern as image
- Mobile-responsive layout
- Audio feedback on Key Down (simulated static/skip)

### P3 (Nice to have)
- Community configs gallery
- Real-time multiplayer (see others' signals)
- Weather/propagation overlay
- 3D visualization upgrade (Three.js)

## Next Tasks
1. Add side-view take-off angle visualization canvas
2. Add antenna position selection on vehicle
3. Mobile responsive improvements
4. SWR frequency sweep chart
