# THROTTLE THEORY — architecture and integration contract

> Historical architecture below. The current Formula simulation contract is
> [docs/ENGINE_CONTRACT.md](docs/ENGINE_CONTRACT.md); engineering priorities and
> checkout/framework findings are in [docs/ENGINE_PLAN.md](docs/ENGINE_PLAN.md).
> Do not use the motorcycle controller or timestep descriptions below for new
> production integration.

## Scope and stack

This project replaces the earlier 2D car prototype with an original browser motorcycle game. TypeScript, Vite, Three.js, and the Web Audio API form the minimum stack. WebGL2 is the baseline renderer. WebGPU, React, downloaded motorcycle assets, and an external rigid-body engine are not prerequisites for the initial playable build.

The primary architecture decision is a stable route-coordinate simcade controller. A motorcycle is not a car with a visual lean, and a general rigid-body solver does not supply a balancing rider. Longitudinal acceleration, cornering limits, steering/lean response, grip and recovery are explicit game systems. This controller is approachable and reproducible but is not a research-grade free-body motorcycle simulation.

## Shared conventions

- Distances: meters; speed: meters per second; time: seconds; angles: radians; engine speed: RPM.
- Three.js world: Y up. Motorcycle local frame: +Z forward, +X right.
- Motorcycle geometry sits on ground Y=0; typical wheel radius approximately 0.32 m and wheelbase approximately 1.4 m.
- A closed track supplies a centerline position, tangent and lateral normal from normalized/arc-length progress. Meshes, AI routes and player progress must use that same frame.
- Route travel is continuous/unwrapped across the finish. Displayed lap indices are derived from validated crossings; race results must be committed once.
- Simulation uses a fixed timestep accumulator. Rendering and DOM updates must not change simulation integration rate. Cap excessive catch-up after a background-tab stall.
- All scenery/race variation should be seeded so QA runs can reproduce their initial state.

## Responsibilities

The exact file list is documented in the repository README after integration. Keep these responsibilities separate even when the initial build combines orchestration in its entry point:

| System | Owns | Boundary |
| --- | --- | --- |
| Application/UI | Menus, garage selection, race lifecycle, settings, HUD, results | Reads simulation; sends discrete commands and normalized input |
| Bike definitions/controller | Performance profiles, gearbox/RPM, acceleration, drag/braking, grip, lean, surface response | Numeric state independent of meshes/audio nodes |
| Track | Closed spline sampling, swept road geometry, decoration, surface and boundary data | One route source for rendering, AI and progress |
| Race/AI | Countdown, grid, ordered progression, laps, timing, positions and opponent decisions | Fixed-step updates; no DOM mutation in inner loops |
| `src/models.ts` | Original procedural bike and rider meshes | `createBike(index): THREE.Group`; `userData.wheels` exposes wheel objects for rotation |
| `src/audio.ts` | Gesture-activated engine graph, synthesis, load/RPM/shift response, volume and cleanup | `EngineAudio.start()`, `update(rpm, throttle, speed, gear, bikeIndex)`, `setVolume(...)`, `dispose()` |
| Camera/input | Keyboard, pointer, gamepad normalization; chase/rider/garage camera state | Smoothed view motion must not feed back into physics |
| Persistence | Versioned local saves, unlocks, records and upgrades | Validate parsed values; fall back safely if storage is unavailable |
| Tests/tooling | Pure logic checks and browser smoke/playtest artifacts | Assert actual outcomes; keep diagnostic hooks explicit |

## Rendering and asset strategy

Models use original primitive/swept geometry, layered physical materials and recognizable mechanical parts. Reuse geometry/materials where practical. Procedural scenery avoids remote asset requirements. Tone mapping and output color space should be configured once; duplicate exposure/gamma transforms are a common reason for washed-out results. Shadow quality and device pixel ratio are performance controls, not guarantees of a target FPS.

Wheel spin comes from traveled distance divided by wheel radius. Lean belongs to the bike visual transform; camera smoothing uses elapsed render time. Garage orbit should expose the selected motorcycle without changing the underlying performance definition. Track switches must remove/dispose replaced geometry and materials, and audio sources/contexts need explicit lifetime management.

## Sound design boundary

Audio reads actual RPM, throttle, gear and speed rather than deriving one oscillator pitch from speed. Character presets define firing spectrum and resonances. Layer exhaust and mechanical/intake components, filter noise separately for wind, smooth AudioParams, and use brief shift envelopes. Start/resume only after a click/key gesture. Volume and pause/mute behavior must remain predictable. See AUDIO.md for the implemented graph and limitations.

## Deliberate tradeoffs

- Route-coordinate contacts and boundaries are sufficient for the initial racing loop, but do not provide arbitrary terrain riding, rigid-body tumbling or physically resolved crash debris.
- Analytic road following simplifies agreement between visible track and collision bounds. It requires guardrails against checkpoint skips and recovery advancing race progress.
- Generated audio avoids unlicensed recordings. It is a designed approximation, with subjective quality requiring listening on actual devices.
- Three themes or five performance presets do not by themselves establish release-level content polish. Report browser-tested behavior separately from visual ambitions and deferred effects.
- No claim of 1080p/60 FPS should be made without measured browser results on stated hardware/browser settings.

## Validation gates

1. Typecheck and production bundle must pass.
2. Test acceleration/braking, bike differences, ordered lap progression, recovery, finish/reward idempotency and persistence validation where implemented.
3. Open the actual WebGL game in an automated browser; inspect console/page errors and screenshots.
4. Exercise menu → garage/rev → race/countdown → controls/pause/recovery → results; verify local save reload, resizing and audio activation.
5. Record measured frame data and software-renderer limitations. A debug shortcut to a finish state is a smoke test, not a full driven-race playtest.

## Integrated implementation notes

`src/main.ts` currently combines application, input, AI and camera orchestration; numeric vehicle/checkpoint/save logic, audio, geometry and showroom are separate modules. The simulation runs at 120 Hz. Visual positions use exponential smoothing rather than exact previous/current fixed-step interpolation. Road heading is assisted by the spline; steering selects a lateral racing line. This is an explicit accessibility tradeoff and should not be mistaken for a fully free-steering motorcycle solver. Wet-track lateral load is increased, and off-road grip is reduced. Future work can split orchestration and replace the line-selection controller behind the same rider state boundary.
