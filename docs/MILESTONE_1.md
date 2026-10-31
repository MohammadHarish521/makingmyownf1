# Milestone 1: authoritative session and verified race timing

Verified 2026-11-01 IST (2026-10-31 UTC). Initial repository baseline: e33cd8d.
Grok's concurrent visual commit 63b4c70 was preserved and used for final browser
validation. It also captured the main.ts engine integration seam during shared
editing; the engine modules are supplied by this milestone's companion commit.

## Delivered

- RaceSession is the only production simulation owner. Fixed 60 Hz clock, bounded
  catch-up with dropped-time reporting, pause/resume, countdown, recovery, manual
  shifts and explicit disposal. 120 Hz remains configurable for measurement.
- RaceTiming owns all production clocks and ordered gates. Sector/lap crossings
  interpolate within a step. Reverse crossings do not duplicate progress;
  discontinuities cannot award laps. Off-track/recovered laps cannot set records.
- Shared TypeScript contracts and an adapter over the existing visible centerline
  expose chassis/wheels, real analog input, audio/camera data, timing and static
  wet grip state. Unsupported systems are explicitly null/empty.
- AI orchestration moved out of UI. Nearby-car checks include all opponents;
  passing space around stopped/finished cars fixes a reproduced pre-finish queue.
- AGENTS.md establishes file ownership and preserves Grok's visual assets and
  presentation code. No renderer, physics-backend or host-framework replacement.
- User-requested silence: game starts muted, audio master initializes at zero,
  and automated browser launch uses --mute-audio. Sound remains opt-in in menus.

## Executed verification

| Check | Result |
| --- | --- |
| npm run typecheck | Passed, including test and Playwright/benchmark TypeScript |
| npm test | 32/32 passed, approximately 9.9 s on the final run |
| npm run build | Passed; Vite 7.3.7 production bundle, existing large Three.js chunk warning |
| npm run test:browser | 2/2 passed, approximately 2.7 min, headless Edge/software WebGL, forced silent audio |
| npm run benchmark:engine | Passed all 8 configurations; every vehicle state finite |
| git diff --check | Passed (Windows line-ending notices only) |

New production tests include integer-tick countdown, frozen pause, exact state
agreement at 30/60/144 render Hz, bounded stalls, precise two-lap/sector times,
shortcut/reverse rejection, track-limit best-lap rejection, recovery telemetry,
three real AI cars completing valid laps without recovery, and a player chassis driven
through normalized inputs completing a clean lap with an idempotent finish.
The old scalar helper tests remain labeled as legacy coverage. The final targeted
engine rerun also passed 8/8 after explicitly asserting all three AI best laps
were valid.

Browser verification used current UI selectors and real bundled assets. Tested
six-car grid/countdown, acceleration/braking/steering, manual gear retention,
camera switching without error, pause/resume, recovery, restart, menu return,
390x844 sizing, and analog gamepad throttle feeding physical/audio telemetry.
No page errors were observed. Screenshots: artifacts/engine-mobile.png and
artifacts/engine-driving.png. Screenshots show current Grok presentation, not a
claim that this milestone authored it.

The first browser attempt used a dev host and was interrupted by a source-triggered
navigation during concurrent visual edits. Final tests use a production preview
on port 5174 to avoid HMR. Initial new tests also caught/fixed the blocked-AI finish
queue; neither failed attempt is presented as passing evidence.

## CPU measurement

Final isolated run: Intel i5-10300H, Windows, Node v26.5.0. Each scenario samples
6 s after 2 s warmup. Full numbers/runtime metadata: artifacts/engine-benchmark.json.

| Cars | 60 Hz mean / p95 per step (ms) | 120 Hz mean / p95 per step (ms) |
| --- | --- | --- |
| 1 | 0.36 / 0.71 | 0.42 / 0.89 |
| 4 | 1.44 / 2.56 | 0.98 / 1.90 |
| 6 | 1.63 / 2.66 | 1.11 / 2.16 |
| 10 | 1.50 / 2.56 | 1.29 / 2.23 |

This is a short CPU-only sample, sensitive to JIT/scheduling and driving state.
120 Hz performs twice as many steps per render frame. It excludes GPU/UI/model
load and does not establish smooth 1080p/60 FPS or justify enabling 10-car races.
The working 60 Hz production default is retained until deeper handling and real
GPU profiling justify a change. The earlier benchmark overlapped software WebGL
tests and was discarded in favor of this isolated run.

## Remaining scope

The checkout is Vite, with no Next.js dependency/version. That discrepancy was
reported and no framework migration was performed. Confirm the Next.js project
location before host-specific work.

This is an engine foundation, not completion of the full simulator brief. Current
vehicle handling remains Cannon-based simcade. Calibrated combined-slip tires,
torque/gear drivetrain, independent assists, shared road/collision geometry,
competitive racecraft, dynamic weather, compounds/wear, DRS/energy, damage, pits,
qualifying/penalties and full host/HMR soak testing remain prioritized work in
ENGINE_PLAN.md. No fake telemetry or placeholder passing tests stand in for them.
