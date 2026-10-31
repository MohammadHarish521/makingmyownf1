# Repository audit and engineering sequence

Inspected 2026-10-31, beginning at commit e33cd8d. Initial working tree was clean.
Concurrent Grok visual edits arrived during this milestone and are preserved.

## Actual checkout

package.json declares Vite ^7.1.12, Three.js ^0.180.0, cannon-es ^0.20.0,
TypeScript ^5.9.3, tsx, Node's built-in test runner and Playwright. There is no
Next.js dependency, app directory, React tree or Next version to report. User
has been notified; no host/framework migration was attempted. Reconcile the
Next.js project location before any framework work. This engine is host-neutral.

All authored source/tests/config/documentation were inventoried; rendering,
track construction, models, input, audio, physics, session/save flow and tests
were read. Public assets include licensed imported Formula GLBs, texture maps,
panoramas and local fonts. Existing artifact screenshots/QA notes describe prior
builds; they are historical evidence, not validation of this change.

## Working baseline retained

- Three circuits share a closed CatmullRom centerline, road/curbs/barriers and AI
  route. Detailed garage model and lighter race cars load from bundled assets.
- Four raycast wheels, sprung chassis, rigid-body contacts, speed-sensitive
  steering, force-based acceleration/braking, drag/downforce, recovery and wet
  friction reduction already exist. No new physics engine is necessary for M1.
- Keyboard/touch/gamepad steering share corrected direction; analog pedals,
  bumper/Q/E shifts, automatic gears, pause, camera switching and recovery work.
- Quick race, practice, time trial, career rewards, save validation, menus and
  generated engine/wind audio are present. Career is a reward mode, not a full
  championship. There is no qualifying or pit simulation.
- Existing tests cover both legacy scalar controller and current Cannon solver.
  M1 adds tests against the production orchestrator rather than calling the old
  helper proof of vehicle realism.

## Technical debt and risk

1. Main entry point combines rendering, UI and lifecycle. M1 extracts simulation
   orchestration; full host mount/unmount/listener cleanup still needs follow-up.
   Session disposal is implemented; full HMR cleanup must be verified separately.
2. Legacy `stepRider`/`updateLap` and BIKES/Rider names remain for compatibility and
   old tests; only RaceSession/VehiclePhysics drive production. Move save and
   immutable vehicle config out before deleting the obsolete helpers.
3. Model, suspension, road and collision dimensions are partly hardcoded. Collision
   boxes use different sampling/height from visible barriers; curbs/elevation have
   no physical geometry. Unify road and collider description before new scenery.
4. Current tire response, gearbox, aero and yaw stability are simcade heuristics.
   Do not characterize this as a calibrated Formula simulator. See PHYSICS_MODEL.
5. Progress projection searches locally; overlapping routes/pits/large teleports
   need branch-aware projection and swept timing gates. Current recovery does not
   advance progress; M1 invalidates recovered laps and rejects discontinuities.
6. AI uses pure pursuit and curvature speed caps. M1 adds all-car awareness and
   basic passing around slow traffic. It has no robust defending, strategy,
   flags or racecraft. Validate multi-lap/grid density before scaling to 10+.
7. Static wet multiplier is physics; particles/rain presentation are not an
   authoritative weather model. New visual weather must not invent physics data.
8. Old browser scripts reference removed selectors and Linux-specific executables.
   M1 adds current cross-platform Playwright tests; old scripts remain historical.
9. Imported asset/geometry disposal and postprocessing need visual-owner review;
   M1 does not change those materials or asset ownership.

## Prioritized milestones and exit criteria

| Priority | Work | Evidence required |
| --- | --- | --- |
| M1 (this change) | Single session owner, fixed tick, precise ordered timing, telemetry contract, pause/restart/recovery, three real AI lap test, browser smoke | Typecheck, all unit/integration tests, production build, actual browser controls/lifecycle, CPU cost report |
| M2 | Extract immutable track geometry from render builder; one original complete circuit with physical curbs/boundaries, grid, branch-aware progress and pit route/gates | Render/collision sample agreement, barrier tests, valid player and AI multi-lap runs; no recovery shortcut |
| M3 | Independent assists, configurable bindings/deadzones, torque/gear/drivetrain model, combined-slip tires and load transfer | Acceleration/braking/skidpad/slip/wet measurements, stability at 60/120 Hz, keyboard/gamepad playtest |
| M4 | 3-car racecraft then profile 10+, target lanes, avoidance, overtaking/defence and recovery | All cars finish multiple seeds/laps; controlled overtaking/contact scenarios; CPU budget |
| M5 | Practice/TT/qualifying/race rules, precise grids/start, sectors/gaps/results, limits/penalties/flags | Full-session tests, ordered shortcut rejection, results idempotency, timing replay |
| M6 | Tire compounds/temp/wear, dynamic weather/drying, DRS and configurable energy | Physical wet/dry/compound/DRS comparisons, no fabricated telemetry |
| M7 | Functional pit lane/limiter/boxes, timed tire service, player choice and basic AI stops | Entry/service/exit and strategy integration tests, no lap-skip path |
| M8 | Wing/suspension damage and recovery penalties, improved audio hooks | Speed-dependent impact/performance tests, licensed assets or documented synthesis |
| M9 | Grok cockpit/HUD/camera integration, debug overlays, performance/HMR soak | Measured GPU/browser 1080p frame times, repeated mount/restart, all core scenarios in CI |

Do not start deeper deformation or promise premium handling before M2/M3
measurements. 120 Hz is a candidate, not a performance claim. Current M1 default
remains the working 60 Hz rate pending CPU and real GPU budgets.

## Official documentation consulted

Checked 2026-10-31 through web fallback after the connected docs fetch reported
expired authentication. No paid connector calls were used.

- [Cannon World](https://pmndrs.github.io/cannon-es/docs/classes/World.html):
  single fixed-step integration; avoid combining engine and Cannon accumulators.
- [Cannon RaycastVehicle](https://pmndrs.github.io/cannon-es/docs/classes/RaycastVehicle.html):
  wheel forces/transforms and add/remove lifecycle.
- [Rapier vehicle controller](https://rapier.rs/docs/user_guides/javascript/vehicle_controller/):
  also raycast/spring-based; replacing the backend alone does not supply deep tires.
- [Playwright clock](https://playwright.dev/docs/clock): controlled time for actual
  browser input/lifecycle tests; do not skip production physics to finish a race.
- [Next.js layouts/pages](https://nextjs.org/docs/app/getting-started/layouts-and-pages):
  host integration reference only; no Next implementation is present to modify.
