# Validation record

## Commands

```sh
npm run build
npm test
npm run preview -- --port 4173
GAME_URL=http://127.0.0.1:4173 node tests/browser.spec.mjs
GAME_URL=http://127.0.0.1:4173 RACE_MODE=Career node tests/browser.spec.mjs
GAME_URL=http://127.0.0.1:4173 node tests/worlds.spec.mjs
GAME_URL=http://127.0.0.1:4173 node tests/mobile.spec.mjs
```

Browser scripts use installed system Chromium (`/usr/bin/chromium`); set `CHROMIUM_PATH` to override. Playwright Chromium download was blocked by the environment's destination policy; no verification was disabled. Chromium uses software ANGLE/SwiftShader here.

## Browser test method

`browser.spec.mjs` controls the actual served UI and keyboard. It does not mutate rider state or award progress. It starts the engine, holds the garage rev button, chooses another motorcycle then returns to the owned Heritage, starts a session, accelerates, brakes, steers, recovers, cycles camera, pauses/resumes, and rides to the real results screen. Recovery uses the normal R control when the read-only diagnostic reports a crash or the rider moves far off center.

The completion test uses Playwright's virtual clock with a controlled 100ms requestAnimationFrame timer. This exercises the fixed-step catch-up path at a 10Hz rendering cadence so software rendering can complete a full race in reasonable time. It is not a performance benchmark and its `frameMs` values are not measured production FPS. Initial screenshots and track/mobile tests also render through normal browser callbacks. Rendering at 1080p / 60FPS on target hardware remains unverified.

Web Audio initialization is verified by wrapping the browser's AudioContext constructor and checking a real context reaches `running` after a user gesture. This proves activation, not subjective audio quality or audible output on the host.

## Observed results

- Time Trial: normal controls completed Alpine Pass's 691.7m lap and reached results at 26.37 simulated seconds. Acceleration reached 35.18m/s; one second of braking reduced it to 20.52m/s. Steering changed lean and lateral position. Pause, resume, recovery, and camera key were exercised.
- Garage: the collection offers five bikes; selecting Roadster and returning to Heritage was browser-tested; locked-bike purchase requires earned credits. Audio context entered running state from the engine button. Garage and race screenshots were visually inspected.
- Neon Harbor and Grand Circuit: served scenes render, track selection is respected, six-rider grid and countdown displayed, no page exceptions in these checks. Screenshots visually inspected; these brief world checks do not prove full race completion on those tracks.
- Mobile 390×844: no horizontal overflow. Session panel and independent volume controls are reachable by scrolling after the layout fix; screenshots visually inspected.
- Saved-data fixture reload restores credits. A separate full career race tests earned progression persistence; see final production result below.

Artifacts are in `artifacts/`: garage, race, results, two additional track views, mobile top/controls, and structured browser observations. Earlier development runs were interrupted by HMR; final production checks run against an immutable build.

### Final production career run

**Passed** against the production preview build: all browser assertions, zero console/page errors. Three Alpine Pass laps (2075m) completed at 73.33 simulated seconds with five AI opponents; P5/6 awarded 884 credits. Reload restored the earned 884 credits and the 23.225-second best-lap record. The real Web Audio context was running. These checks assert acceleration, braking, steering lean, pause state, results state, saved record presence, and exact earned-credit restoration. `artifacts/browser-results.json` records observations.

The result-table ordering and short-screen dialog scrolling received subsequent focused corrections; the final smoke below covers the rebuilt presentation.

Known validation limits: collision/grip edge cases are covered by the simulation suite; browser flow uses recovery but does not systematically exercise every collision configuration. Camera key cycling is exercised without assertions on exact camera transforms. Gamepad hardware and subjective engine timbre require human playtesting. Visual scenery is stylized procedural geometry; reflections are material approximations rather than ray-traced effects. The compact career implementation is an earnings/unlock loop, not a championship calendar.

### Rebuilt final smoke

**Passed** on the final rebuilt production preview: Time Trial completed at 26.36 simulated seconds; every browser assertion passed, no console/page errors, running audio context, pause/recovery/camera inputs, and best-lap storage survived reload. This final run used the corrected result comparator and scrollable-dialog build. Comparator edge ordering is explicitly covered by the unit suite; a single-rider Time Trial does not independently exercise multi-finisher ordering. Final screenshot inspected at 1280×800.
