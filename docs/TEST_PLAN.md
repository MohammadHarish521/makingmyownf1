# Verification plan

## Repeatable commands

Install the lockfile with `npm ci`. Run `npm run typecheck`, `npm test`,
`npm run build`, `npm run test:browser`, `npm run benchmark:engine`.
The repository's AGENTS.md requires prefixing shell commands with `rtk` (use
`rtk proxy` on this Windows environment). Sandbox restrictions may require
approval for package networking, tsx's userInfo call, Vite config bundling and
headless browser launch. These are environment permissions, not failing assertions.

Playwright starts/reuses the local production preview host on port 5174, so run
`npm run build` first. This isolates tests from concurrent visual edits and HMR.
Windows defaults to installed Edge;
else it uses Playwright Chromium. CHROMIUM_PATH overrides the executable.
On Linux/CI run `npx playwright install --with-deps chromium` first. An existing
server is reused only outside CI. New browser tests match engine-browser.spec.ts;
historical ad-hoc .mjs scripts are not silently treated as current passing checks.

## M1 coverage

| Area | Automated evidence |
| --- | --- |
| Startup/countdown | Real RaceSession with integer ticks; browser menu → grid → lights-out |
| Acceleration/braking/steering | Existing VehiclePhysics tests plus browser actual keyboard input |
| Analog input/gears | Keyboard/gamepad direction and held-bumper tests, browser fake hardware device with real solver/audio telemetry, manual gear hold |
| Frame independence | Exact state equality after equal simulated time at 30/60/144 rendering Hz |
| Slow/invalid frames | Bounded catch-up, dropped-time counter, NaN/negative rejection |
| Pause/restart/disposal | Frozen time/body/ticks, resume, fresh restart, world bodies/callback removal |
| Timing | Ordered forward gates, reverse rejection, teleport rejection, two interpolated lap timestamps and three sector durations per lap |
| Limits/recovery | Off-track lap cannot set best; recovery preserves distance and invalidates lap |
| AI | Three opponents use the real car solver and complete ordered laps; no recovery, finite state |
| Race finish | Production player car completes a clean lap through normalized inputs; finish event and stopped session are idempotent |
| Telemetry | Actual input/RPM/suspension/poses, truthful unavailable fields, finite state |
| Existing functionality | Original save, controls, world and physics regression suite retained |
| Browser integration | Current selectors, real assets/WebGL, page errors, mobile overflow/screenshots |

Track-collider agreement, wet physical handling comparisons and AI overtaking
scenarios need further measured production tests before those capabilities are
claimed. DRS, compounds, weather transitions,
damage, pits, penalties and qualifying are not implemented in M1 and do not get
placeholder passing tests. See ENGINE_PLAN for their required milestone gates.

## Performance evidence

`benchmark:engine` writes `artifacts/engine-benchmark.json`: 1/4/6/10 vehicles at
60 and 120 Hz, 2 s warmup + 6 s sample, mean/p95/p99 wall CPU cost per step,
runtime/CPU metadata and finite-state checks. Measure without other heavy tasks
for representative numbers. This excludes GPU draw time, model load and UI;
it cannot establish 1080p/60 FPS. The current UI reports measured frame rate.

Browser tests use software WebGL and reduced test render frequency while physics
still advances at 60 Hz. This validates integration and lifecycle, not GPU speed
or subjective handling. Screenshot paths: artifacts/engine-driving.png and
artifacts/engine-mobile.png. Playwright retains failure traces/screenshots under
test-results. Record exact results in MILESTONE_1.md after running the checks.
