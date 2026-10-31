import { VehiclePhysics } from '../vehicle-physics';
import { compareRiders, newRider, type Rider } from '../simulation';
import type { TrackWorld } from '../tracks';
import type { DriverInput, DriverAssists, RaceEvent, SessionMode, SessionPhase, SessionTelemetry, Transform, WheelId } from './contracts';
import { FixedStepClock } from './fixed-step';
import { RaceTiming } from './race-timing';
import { createTrackData } from './track-data';
import { planAI } from './ai';

export interface SessionOptions {
  readonly mode: SessionMode;
  readonly carIndices: readonly number[];
  readonly difficulty?: number;
  readonly upgrade?: number;
  readonly wet?: boolean;
  readonly fixedDtS?: number;
  readonly countdownS?: number;
  readonly laps?: number;
}
const ZERO_INPUT: DriverInput = { throttle: 0, brake: 0, steer: 0 };
const HOLD_INPUT: DriverInput = { throttle: 0, brake: 1, steer: 0 };
const wheelIds: WheelId[] = ['front-negative-x', 'front-positive-x', 'rear-negative-x', 'rear-positive-x'];
const normalized = (n: number, lo = 0) => Number.isFinite(n) ? Math.min(1, Math.max(lo, n)) : 0;

/** Sole production orchestrator. No DOM, animation frames, assets or React lifecycle. */
export class RaceSession {
  readonly riders: Rider[];
  readonly physics: VehiclePhysics;
  readonly clock: FixedStepClock;
  readonly track;
  readonly weather;
  private timing: RaceTiming[];
  private events: RaceEvent[] = [];
  private phaseValue: SessionPhase;
  private resumePhase: 'countdown' | 'running' = 'running';
  private countdownTicks: number;
  private raceTicks = 0;
  private tickValue = 0;
  private lastCostMs = 0;
  private inputs: DriverInput[];
  private previousDistances: number[];
  private readonly config: SessionOptions;
  private readonly emit = (event: RaceEvent) => { this.events.push(event); if (this.events.length > 256) this.events.shift(); };

  constructor(track: TrackWorld, options: SessionOptions) {
    if (!options.carIndices.length || options.carIndices.some(i => !Number.isInteger(i) || i < 0 || i > 4)) throw new RangeError('Invalid grid');
    const dt = options.fixedDtS ?? 1 / 60;
    if (dt !== 1 / 60 && dt !== 1 / 120) throw new RangeError('Supported rates are 60 and 120 Hz');
    const countdownS = options.countdownS ?? 3;
    const laps = options.mode === 'practice' ? Infinity : options.laps ?? (options.mode === 'time-trial' ? 1 : 3);
    if (!Number.isFinite(countdownS) || countdownS < 0 || options.mode !== 'practice' && (!Number.isInteger(laps) || laps < 1)) throw new RangeError('Invalid session duration');
    this.config = { ...options, carIndices: [...options.carIndices] };
    this.clock = new FixedStepClock(dt, Math.round(.1 / dt));
    this.track = createTrackData(track);
    this.weather = Object.freeze({ model: 'static-surface' as const, wetness: options.wet ? 1 : 0, gripMultiplier: options.wet ? .83 : 1, rainIntensity: null, ambientTemperatureC: null, trackTemperatureC: null });
    this.riders = options.carIndices.map((_, i) => newRider(-Math.floor(i / 2) * 8, (i % 2 ? 1 : -1) * 2));
    this.physics = new VehiclePhysics(track, this.riders, [...options.carIndices], options.wet);
    this.timing = this.riders.map((r, i) => new RaceTiming(i, r, track.length, laps));
    this.inputs = this.riders.map(() => ZERO_INPUT);
    this.previousDistances = this.riders.map(r => r.distance);
    this.countdownTicks = Math.ceil(countdownS / dt);
    this.phaseValue = this.countdownTicks ? 'countdown' : 'running';
    if (!this.countdownTicks) this.emit({ type: 'session-started', timeS: 0 });
  }
  get phase() { return this.phaseValue; }
  get elapsedS() { return this.raceTicks * this.clock.dt; }
  get countdownS() { return this.countdownTicks * this.clock.dt; }
  get tick() { return this.tickValue; }
  advanceFrame(deltaS: number, input: DriverInput = ZERO_INPUT, assists: DriverAssists = { steering: true, automaticTransmission: true }) {
    if (this.phaseValue !== 'running' && this.phaseValue !== 'countdown') return 0;
    return this.clock.advance(deltaS, () => { this.step(input, assists); return this.phaseValue === 'running' || this.phaseValue === 'countdown'; });
  }
  private step(input: DriverInput, assists: DriverAssists) {
    const begin = performance.now(), dt = this.clock.dt;
    this.tickValue++;
    if (this.countdownTicks > 0) {
      for (let i = 0; i < this.riders.length; i++) this.physics.control(i, HOLD_INPUT, dt);
      this.physics.step(dt);
      this.countdownTicks--;
      for (const r of this.riders) r.lapTime = 0;
      if (!this.countdownTicks) {
        // Brake settling must not change grid progress or checkpoint ownership.
        this.riders.forEach((_, i) => this.physics.place(i, -Math.floor(i / 2) * 8, (i % 2 ? 1 : -1) * 2, 0));
        this.phaseValue = 'running'; this.emit({ type: 'session-started', timeS: 0 });
      }
    } else {
      const startS = this.elapsedS;
      this.riders.forEach((r, i) => { this.previousDistances[i] = r.distance; });
      this.inputs[0] = { throttle: normalized(input.throttle), brake: normalized(input.brake), steer: normalized(input.steer, -1) };
      this.physics.control(0, this.inputs[0], dt, this.config.upgrade ?? 0, assists.steering, !assists.automaticTransmission);
      for (let i = 1; i < this.riders.length; i++) {
        const plan = planAI(i, this.riders, this.track, this.config.difficulty ?? 1);
        this.physics.autopilot(i, plan.wanted, plan.lane, dt);
        const r = this.riders[i];
        if (r.crash > 0 && r.speed < 2 && startS > 8) this.recover(i);
      }
      this.physics.step(dt);
      this.raceTicks++;
      this.riders.forEach((r, i) => {
        // The solver reports emergency recovery; it never silently awards a clean lap.
        if (this.physics.consumeRecovery(i)) this.timing[i].invalidate('recovery', this.elapsedS, this.emit);
        this.timing[i].advance(this.previousDistances[i], r.distance, startS, this.elapsedS, Math.abs(r.lateral) <= this.track.widthM / 2, this.emit);
      });
      if (this.riders[0].finished && this.config.mode !== 'practice') this.phaseValue = 'finished';
    }
    this.lastCostMs = performance.now() - begin;
  }
  pause() {
    if (this.phaseValue !== 'running' && this.phaseValue !== 'countdown') return;
    this.resumePhase = this.phaseValue; this.phaseValue = 'paused'; this.clock.discardRemainder();
  }
  resume() { if (this.phaseValue === 'paused') this.phaseValue = this.resumePhase; }
  recover(index = 0) {
    if (this.phaseValue !== 'running' || !this.riders[index] || this.riders[index].finished) return;
    this.physics.recover(index);
    this.physics.consumeRecovery(index);
    this.timing[index].invalidate('recovery', this.elapsedS, this.emit);
    this.emit({ type: 'vehicle-recovered', vehicleId: index, timeS: this.elapsedS });
  }
  shift(direction: -1 | 1) {
    if (this.phaseValue === 'running') this.riders[0].gear = Math.max(1, Math.min(8, this.riders[0].gear + direction));
  }
  drainEvents(): readonly RaceEvent[] { const events = this.events; this.events = []; return events; }
  pose(index: number, alpha = this.clock.alpha): Transform { return this.physics.pose(index, alpha); }
  telemetry(): SessionTelemetry {
    const sorted = [...this.riders].sort(compareRiders);
    return {
      version: 1, phase: this.phaseValue, mode: this.config.mode, tick: this.tick, elapsedS: this.elapsedS,
      countdownS: this.countdownS, fixedDtS: this.clock.dt, interpolationAlpha: this.clock.alpha,
      droppedTimeS: this.clock.droppedTimeS, lastPhysicsCostMs: this.lastCostMs, weather: this.weather,
      vehicles: this.riders.map((r, i) => {
        const vehicle = this.physics.vehicles[i], body = vehicle.chassisBody;
        const transform = { position: { ...body.position }, quaternion: { ...body.quaternion } };
        const input = this.physics.input(i);
        return {
          id: i, transform, velocityMps: { ...body.velocity }, angularVelocityRadps: { ...body.angularVelocity },
          speedMps: r.speed, gear: r.gear, rpm: r.rpm, input, steeringRad: r.steering,
          progressM: r.distance, lateralM: r.lateral, headingErrorRad: r.heading,
          surface: Math.abs(r.lateral) > this.track.widthM / 2 - .6 ? 'runoff' as const : 'asphalt' as const,
          collisionActive: r.crash > 0, wheels: vehicle.wheelInfos.map((w, index) => ({
            id: wheelIds[index], transform: { position: { ...w.worldTransform.position }, quaternion: { ...w.worldTransform.quaternion } },
            rotationRad: w.rotation, steeringRad: w.steering, suspensionLengthM: w.suspensionLength,
            suspensionForceN: w.suspensionForce, inContact: w.raycastResult.body !== null,
            gripUtilization: 1 - Math.max(0, Math.min(1, w.skidInfo)), slipRatio: null, slipAngleRad: null,
          })), timing: this.timing[i].snapshot(), position: sorted.indexOf(r) + 1, cameraAnchor: transform,
          audio: { rpm: r.rpm, throttle: input.throttle, brake: input.brake, gear: r.gear, speedMps: r.speed },
          drs: null, energy: null, tires: null, damage: null,
        };
      }),
    };
  }
  dispose() {
    if (this.phaseValue === 'disposed') return;
    this.physics.dispose(); this.events = []; this.clock.discardRemainder(); this.phaseValue = 'disposed';
  }
}
