# Formula rebuild

Reference research: CrazyGames' Crazy Grand Prix listing identifies Unity 2022,
WASD/arrow acceleration/braking/steering, B rear view, C camera switching,
practice/career, upgrades and multiplayer. Its internal source/physics are not
published on that page. This rebuild uses independent Three.js implementation;
it does not claim to reproduce Unity WheelCollider settings or add multiplayer.
https://www.crazygames.com/game/crazy-grand-prix

Imported model, provenance and Apache-2.0 license: public/models/.
https://github.com/ahacker-1/apex-formula-2026

Physics uses a 120 Hz curvilinear bicycle approximation: heading error relative
to road tangent, wheelbase-dependent yaw, speed-sensitive steering lock, capped
lateral acceleration with downforce and surface grip, aerodynamic drag,
power-limited acceleration and braking. Steering assist adds road-curvature
feedforward and heading damping; switch it off for unassisted cornering. It is
an arcade approximation, not a full tire/suspension simulator. Barrier hits
reduce speed and deflect the car instead of freezing it or tipping it over.
All five liveries are immediately selectable. Existing earned credits persist.

Tracks are expanded to make the car scale and braking distances meaningful.
AI looks ahead through several braking distances; a HUD brake cue warns of
approaching corners. B rear view and eight-speed Q/E controls added.

## Detailed Formula model upgrade

The earlier generic model has been replaced by Qvist_designs' F1 2026 concept,
distributed by filan214/F1---2026-Car-Details under CC BY 4.0. Source, author,
license and changes are documented in public/models/qvist/ATTRIBUTION.md and
linked from the garage. The prepared source has about 1.2 million triangles;
Blender decimation creates a detailed player/showroom model and a lighter AI
model. Axes, metre scale and independent steering/spin pivots are normalized at
load time. Custom tyre lettering and race-number decals are added locally.

Rendering now uses a PMREM studio environment, daylight sky environment,
clear-coated paint, a tighter shadow camera, dark studio floor, textured tarmac
and grass, and lower/closer chase cameras. The cockpit keeps the imported car
visible instead of hiding the whole model. It is an independent concept model,
not an official team's CAD asset or an asset from EA's F1 game.

## Grand Prix UI

The interface follows Crazy Grand Prix's game-oriented flow: a main menu,
separate race/circuit selection, a garage with livery and upgrade controls, and
Settings. Race timing stays at the top; the minimap is at lower left; gear,
speed, RPM, steering and live throttle/brake gauges sit below the driving view.
Pause supports resume, restart and return to the main menu. Menus are navigable
with mouse/touch, Tab and main-menu arrow keys; Escape returns from submenus.
Only existing functional game modes are offered. This UI change does not add
online multiplayer or a new championship system.

Reference: https://www.crazygames.com/game/crazy-grand-prix
HUD and menu layout reference screenshots:
https://www.drifted.com/crazy-grand-prix/
No reference-game images, logos or UI code are bundled.

## Physics, controls, scenery and typography update

Production driving now uses cannon-es RaycastVehicle and rigid bodies, replacing
the old scalar track-coordinate movement. The engine owns four-wheel raycast
suspension, tire friction, physical car/barrier contacts and braking impulses.
The chassis has a low center of gravity, front brake bias, ABS, traction control,
bounded yaw-stability torque, drag and speed-dependent aero load. Steering
assist supplies road feedforward; AI uses lookahead steering and braking.
Recovery preserves race progress. The fixed engine step is 60 Hz; rendering
interpolates the two most recent physical poses. Wheels follow suspension travel.
Older stepRider tests describe the retained prototype helper, not production
vehicle dynamics; vehicle-physics.test.ts verifies the engine implementation.

Auto graphics targets 60 FPS by adjusting pixel density and shadow resolution
using measured frame time. High and Performance presets and an optional measured
FPS counter are available in Settings. All race cars use the lighter imported
model; the detailed model remains in the showroom. Nearby night lights are
budgeted. This does not guarantee 60 FPS on every GPU or browser.

The reversed garage drag is corrected. Pointer release/cancel ends orbiting,
and the mouse wheel zooms within bounds. Alpine and Grand Circuit have layered
terrain ridges outside the circuit envelope. Neon Harbor has a star field, moon,
illuminated skyline, track lamps and player headlights. Routes remain flat;
mountains are scenery rather than drivable elevation.

UI fonts are now locally bundled Barlow and Rajdhani (SIL OFL). Charcoal surfaces,
racing-red actions, larger labels, upright telemetry and clearer selected/focus
states replace the old generic italic styling. Font licenses are in public/fonts;
cannon-es's MIT license is in public/licenses.

## Image horizon and bumper shifting

Daytime tracks now use a bundled Alpine panorama; Neon Harbor uses an original
night harbor panorama. Scene backgrounds sit at infinity and retain foreground
3D scenery. One low foothill ring replaces the three tall mountain rings.
SCENERY-RESEARCH.md records the reference, evidence limits and implementation.

LB downshifts and RB upshifts, once per press. The first gear-button press selects
manual mode; Q/E behave the same way. The HUD shows AUTO or MANUAL. Both bumpers
together are neutral and input while paused is consumed without changing gear.
