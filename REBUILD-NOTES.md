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
