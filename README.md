# THROTTLE THEORY

An original, playable 3D motorcycle racing game built with TypeScript, Vite, Three.js and Web Audio. All motorcycles, scenery and sound are generated in code; runtime assets require no external downloads or API keys.

## Run

Requires Node.js 20.19+ or 22.12+ (validated with Node 24).

```sh
npm ci
npm run dev
```

Production:

```sh
npm run build
npm run preview
```

Validation:

```sh
npm test
```

The development server binds to all interfaces. Use your development environment's supported browser access. WebGL2 is required; engine audio starts after a user gesture. No cloud configuration or publication is performed by this project.

## Play

Start in the interactive showroom. Drag the scene to orbit, select a machine, start its engine and hold **Rev** to hear it. Pick a destination, session and rival difficulty, then **Take the ride**. The Heritage is initially unlocked; earn race credits to buy other machines and three stages of performance tuning.

- **WASD / arrow keys:** throttle, brake and steer/lean.
- **C:** chase, close-follow, rider and cinematic orbit cameras.
- **R:** recover to the road without advancing race progress.
- **Escape:** pause/resume. Leaving browser focus also pauses.
- **Q / E:** shift down/up when manual transmission is enabled.
- Gamepad: left stick steering, right trigger throttle, left trigger braking.
- On-screen touch controls appear on narrow screens.

Quick Race and Career run three laps against five AI riders. Career currently offers a higher credit payout rather than a championship schedule. Time Trial runs one solo timed lap. Practice is an endless solo session; leave through Pause → Garage. A finished race shows results and credits exactly once. Records, bikes, credits and upgrades persist in a validated versioned localStorage save; storage restrictions are reported in the UI.

## Implemented

- Five original motorcycles with distinct models, performance, mass, lean response, grip, rev limits and gearing.
- Alpine Pass, Neon Harbor and Grand Circuit: continuous spline road meshes, themed scenery, boundaries and consistent AI/progress coordinates.
- 120 Hz fixed simulation, acceleration, engine braking, drag, gears, smooth lean, cornering load, off-road grip, rider contacts, barrier crashes and recovery.
- Six-rider races, corner-aware AI pace, lane changes around the player, countdown, checkpoint-ordered laps, position/timing HUD and live map.
- Layered synthesized exhaust, intake/mechanical texture, wind, smooth RPM/load response, gear-change transients, five sound profiles and independent volume controls.
- Physically based materials, shadows, fog, tone mapping, garage orbit and smoothed riding cameras. Pixel ratio is reduced when sustained measured frame time is high.

## File architecture

| File | Responsibility |
| --- | --- |
| `src/main.ts` | App lifecycle, input/gamepad, AI orchestration, camera, HUD, results |
| `src/simulation.ts` | Pure vehicle definitions/controller, checkpoints, save schema and persistence |
| `src/tracks.ts` | Shared spline geometry, road/curbs/barriers and themed world generation |
| `src/models.ts` | Original detailed motorcycles/riders and rotating wheel assemblies |
| `src/showroom.ts` | Garage staging and lighting geometry |
| `src/audio.ts` | Gesture-activated layered engine and wind graph |
| `src/style.css` | Menus, HUD, responsive and touch UI |
| `tests/` | Simulation/world/persistence tests and browser QA when available |

See [RESEARCH.md](RESEARCH.md), [ARCHITECTURE.md](ARCHITECTURE.md), [AUDIO.md](AUDIO.md) and [QA.md](QA.md) for evidence and decisions.

## Licensing

Motorcycle models, tracks, interface and synthesized sounds are original procedural work. No proprietary game assets or vehicle branding were reused. Three.js is MIT licensed; dependency licenses remain with their packages. Reference repositories were researched, not copied. System font fallbacks require no font download. See research notes for source-specific license findings.

## Current limitations

This is a playable first version, not the complete premium release described in the brief. Handling is a route-relative simcade controller: it automatically follows the circuit heading and steering changes lateral line; it is not unrestricted free-body riding. Rapier and WebGPU were deliberately deferred. Contacts use route-coordinate approximations rather than rigid-body collision meshes. There is no physical clutch, detailed suspension solver, skid/spark system, recorded replay, championship campaign or environmental reflection postprocessing. The cinematic camera is a live orbit, not a replay. Split sectors and saved ghost laps are not implemented. Procedural models/scenery are stylized rather than scanned photorealistic assets. Audio quality needs real-device listening and tuning; automated initialization does not prove subjective quality.

60 FPS at 1080p is a target, not a claimed benchmark. Software-rendered browser validation cannot establish consumer GPU performance. Mobile/gamepad support is implemented but requires broader physical-device testing. Progress is local to the browser, with no account sync or export. No deployment, publishing, or cloud environment draft changes are included.

## Browser evidence

The production build completed a browser-driven three-lap Career race (six riders) with zero console/page errors. The player finished P5, earned 884 credits, and reloading restored those earned credits and the best-lap record. The test used ordinary UI/keyboard controls with a controlled 10 Hz render callback and virtual time; it is a functional test, not an FPS benchmark. Ten simulation/world/persistence checks plus a finish-order regression pass (11 tests total). Full commands, screenshots, test methods and remaining unverified areas are recorded in [QA.md](QA.md).
