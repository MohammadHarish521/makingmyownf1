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
