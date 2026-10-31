# Engine contract v1

Authoritative TypeScript schema: `src/engine/contracts.ts`. This document replaces
the stale motorcycle/120 Hz descriptions in the original ARCHITECTURE.md for
production game integration. The host currently checked out is Vite, not Next.js;
no framework migration was made for this milestone.

## Ownership and update order

`RaceSession` owns one Cannon-backed `VehiclePhysics`, the grid, AI decisions,
RaceTiming instances, event queue, countdown, pause and fixed-step clock. The
chassis rigid body owns world position/orientation/velocity. `Rider` remains a
compatibility view for the existing HUD and saves; distance, lateral position,
heading and speed are derived from that body's projection onto the visible route.
`RaceTiming` exclusively determines race progress and updates its timing view
after each physics tick. VehiclePhysics does not increment lap clocks. Never call
legacy `stepRider` in production.

One render frame calls `session.advanceFrame(deltaSeconds, input, assists)`.
Each tick applies inputs and AI forces, steps Cannon once, projects bodies to the
track, advances gates and emits events. No other code steps physics. The renderer
then consumes `session.pose(index)` and wheel telemetry. Main/UI lifecycle remains
in `src/main.ts`; session core imports no DOM or renderer initialization.

Default dt = 1/60 s. 1/120 is supported for comparison, not enabled by default.
Catch-up is capped at 100 ms / 6 ticks (12 at 120 Hz). Excess wall time is recorded
as droppedTimeS and is not added to race time. Paused frames neither advance the
clock nor accumulate catch-up. Time is tick count times dt, independent of render
rate. This is reproducible with the same fixed-step/input stream on one runtime;
cross-browser bitwise determinism is not guaranteed by Cannon.

## Coordinates, units and transforms

World and chassis frames are right-handed: +Y up, local +Z forward, local +X the
positive lateral axis. Quaternions use x/y/z/w. Metres, seconds, m/s, kg, N, Nm,
radians and rad/s throughout; RPM remains revolutions/minute. HUD converts m/s to
km/h with 3.6. Positive yaw rotates +Z toward +X. In the existing chase camera
that appears LEFT; keyboard D/right and positive gamepad X therefore normalize to
negative steering. Do not reverse this convention in a visual adapter.

Chassis shape half-extents: (.83,.18,2.28) m. The current model origin is .4 m
below the chassis transform; the existing renderer subtracts chassisOffset once.
Wheelbase is 3.4 m; front/rear track widths 1.64 m; wheel radius .36 m. Wheels in
Cannon order are front -X, front +X, rear -X, rear +X. Use wheel IDs, not a guessed
FL/FR ordering. Imported model order is currently mapped with [1,0,3,2].
Wheel transforms are world-space raycast suspension outputs. RotationRad is
unwrapped wheel spin; steeringRad is physical steering. The existing mesh adapter
uses negative spin around its wheel X pivot. Camera anchors expose the actual
chassis frame; camera offsets and smoothing belong to Grok.

Render chassis transforms interpolate previous/current fixed-step poses with
`clock.alpha` (linear position, quaternion slerp). This intentionally trails the
latest state by one tick. Recovery resets both poses, preventing interpolation
through a barrier. Wheel suspension/spin telemetry currently uses the latest
physics tick; independent wheel interpolation is a follow-up. Telemetry snapshots
are detached values and are not interpolated physics inputs.

## Track data

`createTrackData` wraps the SAME `TrackWorld.curve` used to build existing road
meshes. sample(s) supplies position, tangent, lateral normal (tz,0,-tx), signed
curvature, width, elevation and banking. s is unwrapped progress in metres; sample
wraps it modulo route length. Positive lateral follows that normal. Curvature is
a 3 m finite difference. Current routes are flat, with zero banking. Asphalt is
12 m wide, curbs extend to 6.7 m from centre, barriers are centred at 8.6 m.
Existing collision barrier segmentation differs from visual segmentation; a
single shared boundary mesh remains an explicit next milestone, not solved here.

16 ordered gates per lap; sectors end at gate 5, 11, 16. These are checkpoints
on measured unwrapped route progress, not arbitrary global planes. A local
1024-segment track projection is shared by physics/race progress. Displacement
over 140 m/s * dt + 2 m is rejected as discontinuous. Gate crossings must be
forward and ordered. An invalid discontinuous route cannot award a lap and
rearms at a later finish crossing. Reverse travel cannot award duplicate gates.
This is a foundation for a non-self-intersecting circuit, not sufficient yet for
teleport-resistant competitive servers or overlapping track branches.

Grid starts use negative distances. Initial start crossings are not completed
laps. Race and first-lap clocks begin at lights-out, including time spent getting
from the grid to the line. Crossing times linearly interpolate within the physics
step; no frame-time or artificial lap time is used. Track limits currently mean
the chassis centre leaves half the road width; such laps count for race distance
but cannot set a best lap. Recovery preserves progress and invalidates the lap.
Penalties and stricter wheel-based limits remain future work.

PitLane/drsZones are empty until implemented. No invisible pit or DRS geometry is
invented. Geometry extensions must feed both renderer and collision builder.

## Integration for Grok

```
const session = new RaceSession(trackWorld, options);
// Called by the existing, sole animation loop:
session.advanceFrame(deltaS, controls, assists);
const pose = session.pose(0); // interpolated chassis, SI units
const hud = session.telemetry(); // detached latest physics snapshot
const events = session.drainEvents(); // consume once per frame
// Existing renderer applies pose; existing audio reads vehicles[0].audio.
```

`window.throttleTheory.telemetry` is a read-only diagnostic snapshot for browser
QA. `state` remains compatible with older diagnostics. Snapshot creation allocates;
sample the full HUD/debug snapshot at 10–20 Hz if integrating React. Render poses
may be read each frame imperatively. Never mutate `riders`/Cannon bodies from UI;
use pause/resume/recover/shift. Legacy public fields exist for migration/testing
and are not permission for a second physics owner.

Events have a discriminated `type`, simulation `timeS`, vehicleId where relevant,
and measured payloads. Current events: session-started, sector-completed,
lap-completed, lap-invalidated, vehicle-finished and vehicle-recovered. The queue
is bounded to 256; drain each frame for lossless presentation at current rates.
Consumption is single-owner; fan out downstream if HUD/audio both subscribe.

Weather is explicitly static-surface: wetness/gripMultiplier reflect current
physics; rain and temperatures are null. Tire condition, damage, DRS, energy,
physical slip ratio and slip angle are null until simulated. Cannon skidInfo is
reported as an impulse saturation indicator, not mislabeled real tire slip.
Velocity, suspension force/travel, wheel spin, RPM, gear, actual analog controls,
timing, race position and collision cooldown are real current solver state.

Dispose a session before restart/unmount; it removes raycast vehicles/pre-step
callbacks and world bodies. UI/audio/renderer teardown remains the host's job.
Next.js integration should mount the host in a client component and dispose it on
unmount; do not initialize WebGL, AudioContext or animation loops during SSR.
