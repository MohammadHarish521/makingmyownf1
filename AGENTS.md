# Racing engine collaboration

Read `C:\Users\91638\.codex\RTK.md`. Prefix shell commands with `rtk`; use
`rtk proxy` if filtered subcommands fail in this Windows environment.

The requested host is Next.js. This checkout at milestone 1 actually contains
Vite 7, Three.js 0.180 and cannon-es 0.20; there is no installed Next.js version.
Do not infer permission to migrate frameworks. Resolve the project-location
discrepancy with the user before any host migration. Keep engine modules independent
of the host framework.

## Ownership

- Simulation agent owns `src/engine/**`, `src/vehicle-physics.ts`, logic tests and
  `docs/**`. `src/simulation.ts` holds existing vehicle presets, save compatibility
  and legacy helpers. Do not introduce another active vehicle integrator.
- Grok owns `public/**`, models, Blender assets, shaders, materials, environments,
  `src/models.ts`, `src/style.css`, lighting, scenery, audio presentation, HUD and
  camera presentation. Do not replace those systems.
- `src/main.ts` and `src/tracks.ts` are integration seams. Read current changes
  before editing; keep modifications minimal and coordinate file ownership.
- All rendering consumes `docs/ENGINE_CONTRACT.md` and
  `src/engine/contracts.ts`. Do not calculate a second car position in a renderer.

## Engineering rules

- `RaceSession` is the sole production simulation orchestrator. One fixed-step
  accumulator; `VehiclePhysics.world.step(dt)` exactly once per tick. No React
  state updates at physics frequency, no mesh steering as a physics substitute.
- Cannon chassis transforms are authoritative. Route progress and telemetry are
  derived. RaceTiming owns checkpoint, sector and lap decisions.
- Preserve saves, menus, touch/keyboard/gamepad direction, gearbox and assets.
- Do not replace Cannon with Rapier without evidence and a migration benchmark.
- SI units and Y-up/+Z-forward conventions are mandatory. Positive X is the
  algebraic lateral axis; check chase-camera sign before naming it screen-right.
- Unsupported telemetry is `null`, never fabricated. Document approximations.
- Tests using `stepRider` are legacy regression checks, not proof of production
  vehicle realism. New gameplay tests must exercise `RaceSession`/`VehiclePhysics`.
- Run `npm run typecheck`, `npm test`, `npm run build`, and
  `npm run test:browser` for engine milestones. See `docs/TEST_PLAN.md` for scope.
- Check Git status before and after work. Preserve concurrent changes. Commit
  only explicitly staged engine work once verified; never reset the user's work.

No delegation is required by this file.
