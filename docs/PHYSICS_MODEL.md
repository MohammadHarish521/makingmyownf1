# Current vehicle model and calibration path

Milestone 1 retains cannon-es 0.20 RaycastVehicle. It is a playable rigid-body
foundation, not a calibrated Formula tire simulator. Steering applies to the
front raycast wheels, not directly to a mesh. All cars, including AI, use the same
physical chassis, wheel contact and collision path.

## Implemented behavior

- Chassis mass 798–800 kg from existing presets. Box-derived inertia, low chassis
  height, angular damping .55, pitch/roll angular factors .35 and yaw factor 1.
  These are stabilizing approximations, not measured mass distribution.
- Four .36 m radius raycast wheels; 3.4 m wheelbase; 1.64 m tracks. Spring rest
  length .3 m, travel .18 m, suspension stiffness 42, relaxation damping 3.6,
  compression damping 5.2, maximum wheel suspension force 24000 N. These are Cannon
  tuning parameters, not all literal SI spring constants.
- Rear drive: min(11000 N, powerHP * 745.7 * .78 / max(16,abs(speed))). Existing
  upgrades multiply by 1 + .025 * level. Speed cap cuts drive rather than moving
  the body. No calibrated engine torque curve, clutch, differential or hybrid yet.
- Brake command uses mass * 23 * dt, distributed .34/.34/.16/.16 (68% front).
  Cannon brake impulse is per tick. ABS-like skidInfo scaling is always enabled.
- Tire frictionSlip derives from car preset grip, times .83 on the wet route,
  times .32 off road. Off-road rolling resistance is also higher. This limits
  solver impulses; it is not a Pacejka/brush combined-slip tire law.
- Steering lock .65/(1 + speed*.045), bounded to .48 rad and smoothed with a
  10/s exponential response. Steering assist adds track-curvature feedforward and
  heading correction. Driver-facing keyboard/gamepad normalization is separate.
- Bounded yaw stabilization applies torque toward a grip-limited yaw target.
  It currently acts even with steering assistance disabled. Traction-control-like
  engine reduction is tied to the legacy assist flag. Separating TC/ABS/stability
  into independent configurations is required before deeper handling calibration.
- Aero drag = .63 * |v|^2 + mass*.28 (or mass*1.4 off road), opposed to velocity.
  Downforce = mass * min(18, |v|^2*.0015). The cap and central force are deliberate
  simcade approximations. No aero balance, ground effect or DRS yet.
- Automatic gear selection uses 12 m/s bands, 1–8. Manual gears hold selection and
  cut drive past a gear-dependent limit. RPM is smoothed gear/speed telemetry,
  not a coupled engine rotational state. Audio authenticity remains synthesized.
- Plane ground, static barrier boxes and dynamic chassis boxes produce actual
  contacts. Impact speed above 3 m/s sets a .35 s contact indicator. There is no
  wing/suspension damage or deformation. Emergency recovery preserves progress.

## Limitations that must remain explicit

Raycast suspension provides tire loading and chassis movement, but no explicit
per-tire contact patch, physical slip-ratio state, thermal model, wear, compound,
load sensitivity or longitudinal/lateral combined force ellipse. Gear ratios do
not yet determine wheel torque. Flat collision ground does not support elevation,
banking, physical curbs or puddles. Report these fields as unavailable, not fake
telemetry. Current geometry is an original circuit set, not a licensed F1 layout.

## Next dynamics milestone

1. Move presets and physical dimensions to immutable VehicleConfig. Characterize
   0–100/200, stopping distance, constant-radius grip, coast-down and wet handling.
2. Separate input shaping and TC/ABS/stability assists. Add actual engine angular
   state, torque curve, gear/final-drive ratios, shift interruption, engine braking
   and rear differential. Validate gear-dependent acceleration.
3. Add four-wheel longitudinal/lateral slip forces with combined friction ellipse,
   normal-load sensitivity and front/rear aero load. Disable overlapping Cannon
   tire impulses so there is exactly one contact-force model. Keep Cannon for
   chassis integration and collision resolution.
4. Calibrate mass/inertia/CoG, longitudinal/lateral load transfer and suspension.
   Compare 60 vs 120 Hz stability, cost and handling before choosing the rate.
5. Introduce tire compounds/thermal/wear and authoritative dynamic weather;
   then DRS/energy/damage/pit strategy, each with measured telemetry/tests.

Rapier is an alternative collision backend, not an automatic tire-model upgrade.
Its current raycast controller has similar conceptual constraints. Consider a
migration only with a reproducible Cannon limitation and a side-by-side benchmark.

Official references checked 2026-10-31:
[Cannon World](https://pmndrs.github.io/cannon-es/docs/classes/World.html),
[RaycastVehicle](https://pmndrs.github.io/cannon-es/docs/classes/RaycastVehicle.html),
[Rapier controller](https://rapier.rs/docs/user_guides/javascript/vehicle_controller/).
