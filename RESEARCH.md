# THROTTLE THEORY — reference research

Research performed 31 October 2026. External pages are reference material, not dependencies. No third-party game code, models, textures, branding, circuit datasets, or audio recordings were copied into this project.

## Access and evidence

The requested Crazy Grand Prix pages at [Drifted](https://www.drifted.com/crazy-grand-prix/) and [Seeles](https://www.seeles.ai/games/racing/crazy-grand-prix) both returned an HTTPS proxy tunnel `403 Forbidden`. They could not be played or inspected in this environment. Accordingly this document does not claim firsthand observations about that game's mechanics. Compact races, garage progression, and handling depth are project requirements supplied by the user, rather than findings from those inaccessible pages.

The four requested public GitHub README files were read successfully through `raw.githubusercontent.com`. The observations below describe the authors' documented architectures and features; they are not independently benchmarked or playtested claims.

| Reference | Documented approach | Useful design lesson |
| --- | --- | --- |
| [bridge-mind/apex-formula](https://github.com/bridge-mind/apex-formula) | TypeScript, Vite, Three.js; procedural content; fixed-rate physics; separate race, AI, rendering, sound, and camera modules; isolated module harnesses | Define axes and units early, isolate simulation from presentation, and keep audio driven by vehicle state. |
| [TaoweNlin/voxel-grand-prix](https://github.com/TaoweNlin/voxel-grand-prix) | Procedural geometry and sound; sampled circuit centerlines; speed-aware AI, racing lines, checkpoint timing, showroom and multiple cameras | Derive road, navigation and progress from the same route; distinguish visual silhouettes in the showroom. Real-world circuit data is unnecessary for this original game. |
| [xhhdaxx/Mini-Grand-Prix](https://github.com/xhhdaxx/Mini-Grand-Prix) | Native modules and Canvas 2D; short qualifying/race loop, local saves, five opponents, optional time trial and tuning | A compact complete session and resilient persistence matter more than accumulating incomplete systems. Its renderer is not suitable for this project's 3D target. |
| [jolbol1/apex-gp](https://github.com/jolbol1/apex-gp) | Procedural Three.js content, seeded generation, explicit coordinate contracts, fixed simulation, camera and screenshot tooling | Deterministic captures and actual frame inspection expose integration and visual problems. Avoid importing a large car simulation into a motorcycle controller. |

### License checks

The root `LICENSE` files for apex-formula, voxel-grand-prix, and Mini-Grand-Prix were successfully retrieved and state MIT (copyright 2026 BridgeMind, TaoweNlin, and hexinhao respectively). voxel-grand-prix additionally identifies its circuit data source and MIT license. For apex-gp, `package.json` declares ISC, but attempted root `LICENSE` and `LICENSE.md` reads returned 404; repository API license lookup was blocked by policy. Treat its complete license terms as unverified. These findings do not authorize use of separately trademarked branding or external assets. No reference implementation is reused, so no copied-code attribution obligation has been introduced.

## Official implementation references

Direct documentation hosts `threejs.org`, `rapier.rs`, and `developer.mozilla.org` were denied by the configured proxy. Authoritative upstream documentation/source mirrors on GitHub were accessible without disabling TLS or bypassing network policy:

- [Three.js CatmullRomCurve3 documentation](https://github.com/mrdoob/three.js/blob/dev/docs/pages/CatmullRomCurve3.html) and [implementation documentation](https://github.com/mrdoob/three.js/blob/dev/src/extras/curves/CatmullRomCurve3.js): closed centripetal curves reduce cusps from irregularly spaced control points. Use arc-length sampling for speed, road construction and navigation; use optional output vectors to reduce transient allocations.
- [Rapier integration parameters](https://github.com/dimforge/rapier.js/blob/master/src.ts/dynamics/integration_parameters.ts) and [World documentation](https://github.com/dimforge/rapier.js/blob/master/src.ts/pipeline/world.ts): explicit timestep control, collision prediction, CCD limits, and WASM resource ownership. The repository README now reports a migration to the main Rapier repository; these accessible source comments should not be mistaken for proof that a new package integration has been validated.
- [MDN OscillatorNode documentation source](https://github.com/mdn/content/blob/main/files/en-us/web/api/oscillatornode/index.md): periodic waves permit richer harmonic spectra than a single standard oscillator.
- [MDN AudioParam.setTargetAtTime documentation source](https://github.com/mdn/content/blob/main/files/en-us/web/api/audioparam/settargetattime/index.md): use time-constant smoothing for gain, filter and frequency transitions; avoid discontinuous parameter jumps and clicks.
- [MDN Web Audio best practices](https://github.com/mdn/content/blob/main/files/en-us/web/api/web_audio_api/best_practices/index.md): create/resume AudioContext in a user gesture, provide volume control, and use generated buffers or oscillators for original sound.

No source examples were pasted into the game. Dependency licenses remain the licenses of their upstream packages; installed package metadata and lockfile identify the exact versions.

## Decisions before expansion

1. Use TypeScript + Vite + Three.js with no React per-frame dependency. Keep the UI in normal DOM and vehicle state in simulation objects.
2. Use an explicitly stable, fixed-step simcade controller in route coordinates: longitudinal travel, lateral displacement, lean and speed. This avoids pretending that an uncontrolled two-wheel rigid body will balance itself. The price is constrained free-roaming dynamics; document that honestly.
3. Do not add Rapier solely to meet a technology checklist. Road-edge and vehicle contacts can be solved in the same route frame as road geometry. A later free-roaming crash/ragdoll system would justify Rapier with explicit colliders and resource cleanup.
4. Use original procedural motorcycles and environments. Geometry, proportions, distinct tanks, exhausts, wheels and rider silhouettes are controllable without asset licensing/network risk. This is an initial procedural art direction, not a claim of scanned photorealism.
5. Use layered synthesis: firing harmonics, mechanical/intake noise, exhaust filtering, wind, smoothed load/RPM, and shift transients. Granular playback of real engines is deferred until licensed recordings are sourced and auditioned. Subjective excellence requires listening; an initialized audio context alone does not prove excellent sound.
6. Prioritize one coherent playable race, then expand complete data-driven bike/track/mode options. Measure frame performance during browser tests instead of asserting 60 FPS from architecture alone.
