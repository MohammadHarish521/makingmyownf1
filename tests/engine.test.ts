import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { RaceSession } from '../src/engine/session';
import { RaceTiming } from '../src/engine/race-timing';
import { FixedStepClock } from '../src/engine/fixed-step';
import { newRider } from '../src/simulation';
import { buildTrack } from '../src/tracks';
import type { RaceEvent } from '../src/engine/contracts';

const throttle = { throttle: 1, brake: 0, steer: 0 };
const assists = { steering: true, automaticTransmission: true };
function broadTrack() {
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 1000), new THREE.Vector3(1000, 0, 1000), new THREE.Vector3(1000, 0, 0)], true, 'centripetal');
  return { curve, length: curve.getLength(), width: 12, group: new THREE.Group(), spawn: new THREE.Vector3() };
}
function run(s: RaceSession, seconds: number, input = throttle, hz = 60) {
  for (let i = 0; i < Math.round(seconds * hz); i++) s.advanceFrame(1 / hz, input, assists);
}
test('session boots, countdown uses integer ticks, pause freezes everything and resumes', () => {
  const s = new RaceSession(broadTrack(), { mode: 'race', carIndices: [0, 1, 2, 3] });
  run(s, 1); assert.equal(s.elapsedS, 0); assert.equal(s.countdownS, 2);
  s.pause(); const tick = s.tick, distance = s.riders[0].distance;
  run(s, 10); assert.equal(s.tick, tick); assert.equal(s.riders[0].distance, distance);
  s.resume(); run(s, 2); assert.equal(s.phase, 'running'); assert.equal(s.elapsedS, 0);
  assert.equal(s.drainEvents().filter(e => e.type === 'session-started').length, 1);
  run(s, 1); assert.equal(s.elapsedS, 1); assert(s.riders[0].speed > 1);
  s.dispose(); assert.equal(s.physics.world.bodies.length, 0); run(s, 1); assert.equal(s.elapsedS, 1);
});
test('identical driving at 30/60/144 render Hz produces the same authoritative state', () => {
  const states = [30, 60, 144].map(hz => {
    const s = new RaceSession(broadTrack(), { mode: 'practice', carIndices: [0], countdownS: 0 });
    run(s, 4, throttle, hz);
    const state = { tick: s.tick, speed: s.riders[0].speed, distance: s.riders[0].distance };
    s.dispose(); return state;
  });
  for (const state of states) assert.deepEqual(state, states[0]);
});
test('stalled and invalid frames are bounded and report dropped simulation time', () => {
  const clock = new FixedStepClock(); let ticks = 0;
  assert.equal(clock.advance(NaN, () => { ticks++; }), 0);
  assert.equal(clock.advance(-1, () => { ticks++; }), 0);
  assert.equal(clock.advance(5, () => { ticks++; }), 6);
  assert.equal(ticks, 6); assert(Math.abs(clock.droppedTimeS - 4.9) < 1e-9);
  assert(clock.alpha >= 0 && clock.alpha < 1);
});
test('substep lap crossings and all three sector splits use actual simulation time', () => {
  const r = newRider(), timing = new RaceTiming(0, r, 100, 2), events: RaceEvent[] = [];
  const emit = (e: RaceEvent) => events.push(e);
  for (let i = 0; i < 100; i++) timing.advance(i * 2.1, (i + 1) * 2.1, i * .1, (i + 1) * .1, true, emit);
  assert.equal(r.lap, 2); assert(r.finished);
  assert(Math.abs(r.finishTime - 200 / 21) < 1e-10);
  assert(Math.abs(r.best - 100 / 21) < 1e-10);
  const laps = events.filter(e => e.type === 'lap-completed');
  assert.equal(laps.length, 2); assert(laps.every(e => e.valid));
  const sectors = events.filter(e => e.type === 'sector-completed');
  assert.equal(sectors.length, 6);
  assert(Math.abs(sectors.slice(0, 3).reduce((sum, e) => sum + e.durationS, 0) - r.best) < 1e-10);
  timing.advance(210, 220, 10, 11, true, emit);
  assert.equal(events.filter(e => e.type === 'vehicle-finished').length, 1);
});
test('reverse crossings do not count; shortcuts, off-track driving and recovery cannot set a clean best', () => {
  const r = newRider(), timing = new RaceTiming(0, r, 100, 2), events: RaceEvent[] = [];
  const emit = (e: RaceEvent) => events.push(e);
  timing.advance(0, 100, 0, 1 / 60, true, emit);
  assert.equal(r.lap, 0); assert.equal(r.finished, false); assert.equal(r.best, Infinity);
  assert.equal(timing.snapshot().valid, false);
  timing.advance(100, 99, 1, 1.1, true, emit); assert.equal(r.lap, 0);
  const b = newRider(), bt = new RaceTiming(1, b, 100, 2);
  for (let i = 0; i < 100; i++) bt.advance(i, i + 1, i * .1, (i + 1) * .1, i !== 50, emit);
  assert.equal(b.lap, 1); assert.equal(b.best, Infinity);
  for (let i = 100; i < 200; i++) bt.advance(i, i + 1, i * .1, (i + 1) * .1, true, emit);
  assert.equal(b.lap, 2); assert(Math.abs(b.best - 10) < 1e-9);
  assert.equal(events.filter(e => e.type === 'lap-invalidated').length, 2);
});
test('recovery preserves progress, invalidates the lap and produces finite truthful telemetry', () => {
  const s = new RaceSession(broadTrack(), { mode: 'time-trial', carIndices: [0], countdownS: 0 });
  run(s, 2); const distance = s.riders[0].distance; s.recover();
  assert.equal(s.riders[0].distance, distance);
  const telemetry = s.telemetry(), v = telemetry.vehicles[0];
  assert.equal(v.timing.valid, false); assert.equal(v.input.throttle, 1);
  assert.equal(v.wheels.length, 4); assert.equal(v.wheels[0].slipRatio, null);
  assert.equal(v.drs, null); assert.equal(telemetry.weather.model, 'static-surface');
  assert.equal(v.audio.rpm, v.rpm); assert.equal(v.audio.throttle, v.input.throttle);
  assert.equal(v.timing.bestLapS, null); assert(Number.isFinite(v.transform.position.y));
  const previousGear = s.riders[0].gear; s.shift(1); assert.equal(s.riders[0].gear, Math.min(8, previousGear + 1));
  s.pause(); const gear = s.riders[0].gear; s.shift(1); assert.equal(s.riders[0].gear, gear);
  s.dispose();
});
test('three AI cars complete ordered laps using the production solver without recovery', () => {
  const s = new RaceSession(buildTrack(2), { mode: 'race', carIndices: [0, 1, 2, 3], countdownS: 0, laps: 1 });
  let recovery = false;
  for (let i = 0; i < 60 * 180 && !s.riders.slice(1).every(r => r.finished); i++) {
    s.advanceFrame(1 / 60, { throttle: 0, brake: 1, steer: 0 });
    recovery ||= s.drainEvents().some(e => e.type === 'vehicle-recovered' || e.type === 'lap-invalidated' && e.reason === 'recovery');
  }
  assert(s.riders.slice(1).every(r => r.finished), JSON.stringify(s.riders));
  assert(!recovery); assert(s.riders.slice(1).every(r => r.finishTime > 30 && r.finishTime < 180));
  assert(s.riders.slice(1).every(r => Number.isFinite(r.best)), 'All three AI laps must be valid for best-lap timing');
  assert(s.telemetry().vehicles.every(v => Number.isFinite(v.transform.position.x) && Number.isFinite(v.velocityMps.z)));
  s.dispose();
});
test('player car completes a clean race through normalized controls and finish is idempotent', () => {
  const s = new RaceSession(buildTrack(2), { mode: 'time-trial', carIndices: [0], countdownS: 0 });
  const events: RaceEvent[] = [];
  for (let i = 0; i < 60 * 180 && s.phase === 'running'; i++) {
    const r = s.riders[0], body = s.physics.vehicles[0].chassisBody;
    let wanted = 36;
    for (const ahead of [0, 15, 40, 80]) wanted = Math.min(wanted, Math.sqrt(11 / Math.max(.001, Math.abs(s.track.sample(r.distance + ahead).curvaturePerM)) + 28 * ahead));
    const lookahead = 6 + r.speed * .28, target = s.track.sample(r.distance + lookahead).position;
    const q = body.quaternion;
    const yaw = Math.atan2(2 * (q.x * q.z + q.w * q.y), 1 - 2 * (q.x * q.x + q.y * q.y));
    const angle = Math.atan2(target.x - body.position.x, target.z - body.position.z) - yaw;
    const error = Math.atan2(Math.sin(angle), Math.cos(angle));
    const lock = .65 / (1 + r.speed * .045), wheelAngle = Math.atan2(6.8 * Math.sin(error), lookahead);
    const targetSpeed = Math.min(wanted, Math.abs(r.lateral) > 5 ? 16 : 100, Math.abs(error) > .5 ? 15 / Math.abs(error) : 100);
    s.advanceFrame(1 / 60, { throttle: r.speed < targetSpeed ? 1 : 0, brake: r.speed > targetSpeed + 1 ? 1 : 0, steer: Math.max(-1, Math.min(1, wheelAngle / lock)) }, { steering: false, automaticTransmission: true });
    events.push(...s.drainEvents());
  }
  assert.equal(s.phase, 'finished'); assert(Number.isFinite(s.riders[0].best));
  assert.equal(events.filter(e => e.type === 'lap-completed').length, 1);
  assert.equal(events.filter(e => e.type === 'sector-completed').length, 3);
  assert.equal(events.filter(e => e.type === 'lap-invalidated').length, 0);
  const time = s.elapsedS, tick = s.tick; run(s, 10);
  assert.equal(s.elapsedS, time); assert.equal(s.tick, tick); assert.equal(s.drainEvents().length, 0);
  assert(s.riders[0].finishTime <= time); assert(time - s.riders[0].finishTime < 1 / 60);
  s.dispose();
});
