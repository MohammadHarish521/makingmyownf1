# Visual development contract

Research and implementation date: 31 October 2026.

## Stack finding (do not migrate)

This repository is **TypeScript + Vite + Three.js r180 + cannon-es**, not Next.js.
React Three Fiber is not installed. The playable renderer is a single WebGL2 canvas
owned by `src/main.ts`. Migrating to Next.js or Vite-from-scratch would discard a
working race loop. Visual work stays on the existing client bundle.

Codex owns `src/simulation.ts`, `src/vehicle-physics.ts`, `src/controls.ts`, and
race/AI orchestration inside `src/main.ts`. This document records presentation
contracts rather than a second physics implementation.

## Current versus reference stills

| Reference | What it demands | Previous gap |
| --- | --- | --- |
| Cockpit still | Halo roof, detailed wheel, live cluster, red gloves, visible front tyres | Chase-biased camera; no driver, wheel, or live cluster |
| Two-car beauty | Correct open-wheel proportions, clearcoat paint, helmet, motion | Imported Qvist body with flat paint and empty cockpit |
| Grid / Melbourne | Dense cars, asphalt grain, grandstand depth, broadcast framing | Short procedural loop, empty runoff, box barriers |
| Broadcast / manager | Sponsor boards, fencing, timing, telemetry chrome | Functional HUD, almost no venue dressing |
| Arcade chase (Crazy GP) | What we must **surpass**, not copy | Earlier chase views still read as a prototype |

The Qvist 2026 concept (`public/models/qvist`, CC BY 4.0) already supplies the
body, floor, wings, halo and wheels. Visual work layers materials, a cockpit rig,
venue dressing on the **same** Codex route, cameras, weather and HUD.

## Architecture

| Module | Owns |
| --- | --- |
| `src/models.ts` | GLB instance, PBR liveries, wheel pivots |
| `src/cockpit.ts` | Driver, helmet, gloves, steering wheel, cluster |
| `src/venue.ts` | Fencing, ads, rubber, pits, spectators, marshals |
| `src/cameras.ts` | Chase, halo, cockpit, nose, rear, broadcast, cinematic |
| `src/weather.ts` | Rain, spray, wet materials from real wet/dry state |
| `src/broadcast.ts` | HUD markup and derived presentation (gaps, sectors) |
| `src/postfx.ts` | Optional bloom composer on High/Ultra |
| `src/lighting.ts` / `src/performance.ts` | Atmosphere and Low/High/Ultra/Auto/Performance |

Track **centerline, width and barrier offset stay in `src/tracks.ts`**. Venue
meshes are decoration only. Elevation is not added: Cannon uses a flat ground
plane, and a visual-only hill would desync collisions.

## Codex presentation contract (`src/engine/contracts.ts`)

`RaceSession.telemetry()` is the live source. Visual code reads it; it does not
re-simulate.

| Signal | Status | Presentation |
| --- | --- | --- |
| Speed / RPM / gear / input | Live on `VehicleTelemetry` | Cluster + HUD |
| Sectors / laps / gaps | Live on `TimingTelemetry` | Broadcast timing + leaderboard |
| Weather wetness | Live `WeatherState.wetness` | Rain, spray, wet asphalt |
| `drs` / `energy` / `tires` / `damage` | Explicitly `null` | Omitted from HUD |
| `rainIntensity` | `null` | Rain count follows wetness + graphics preset |
| Replay tape | Not supplied | Cinematic camera is a live orbit |

## Blender

The local Blender MCP addon was not running. `tools/blender/export-formula-details.py`
builds a helmet and steering wheel and exports GLB. Run:

```bat
blender --background --python tools/blender/export-formula-details.py
```

Until that export exists, the game uses the procedural cockpit in `src/cockpit.ts`.

## Remaining visual limits

- One imported concept car, not team-specific CAD.
- Circuits remain the existing closed splines (~1–2 km), not a new 5 km layout.
- Cockpit wheel is original procedural geometry; the cluster is readable but not a
  scanned 2024/2026 wheel. Blender export is documented if higher-detail GLB is needed.
- Catch fencing and ads are instanced primitives, not scanned venue assets.
- No scanned photogrammetry, no ray-traced reflections, no recorded replay.
- Embedded/software browsers cannot prove 1080p / 60 FPS on a gaming GPU.
- Official F1 / team trademarks are not used. Liveries are fictional.
