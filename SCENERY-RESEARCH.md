# Scenery reference and controller changes

Research date: 31 October 2026.

CrazyGames identifies [Crazy Grand Prix](https://www.crazygames.com/game/crazy-grand-prix)
as a Unity 2022 desktop-browser game. That listing does not identify its skybox
textures, authoring software, rendering pipeline or exact background technique.
No official source project or reusable scenery assets were found in this research.

Unity's [skybox documentation](https://docs.unity3d.com/2022.3/Documentation/Manual/skyboxes-using.html)
describes material-based skies and links its image-based skybox shader options.
This supports using an image panorama for a similar distant-landscape treatment;
it is not proof of Crazy Grand Prix's specific implementation.

## Applied implementation

Two original generated 360-degree panoramas are bundled as WebP: a photographic
Alpine valley and a moonlit coastal harbor. The daytime circuits share the Alpine
image with different orientation; Neon Harbor uses the night panorama. Three.js
renders these as equirectangular scene backgrounds, so translation does not make
the distant horizon slide with the road. Low foreground foothills, existing trees,
barriers and buildings preserve real 3D parallax. The old three tall terrain rings
were replaced by one low ring to expose the image horizon and reduce geometry.
The original game's images and assets are not included.

Standard controller button 4 (LB) downshifts and button 5 (RB) upshifts. Polling is
edge-triggered: one shift per press, simultaneous bumpers are neutral, and paused
presses do not shift on resume. The first gear-button press selects manual mode;
Q/E use the same gear-changing path. Gears stay between 1 and 8. Settings and the
HUD explain the mapping and display AUTO/MANUAL state. Automatic mode remains
available through Settings.

## Validation

Production build and all existing simulation, Cannon physics, controls, graphics
and world test files pass. New controls regressions cover bumper hold/release,
simultaneous presses, empty controller slots and disconnection. Browser results
and scenery captures are in artifacts/bumpers-scenery.json and artifacts/scenery-*.
Those checks use a synthetic standard Gamepad API and real Cannon simulation;
physical-controller behavior and hardware GPU frame rates are not benchmarked here.
