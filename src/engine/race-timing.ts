import type { Rider } from '../simulation';
import type { RaceEvent, TimingTelemetry } from './contracts';

/** Ordered unwrapped gates, forward crossings only, substep crossing timestamps. */
export class RaceTiming {
  private nextGate: number;
  private lapStartS = 0;
  private sectorStartS = 0;
  private valid = true;
  private ordered = true;
  private lastLapS: number | null = null;
  private sectors: (number | null)[] = [null, null, null];
  private sector = 1;
  constructor(readonly vehicleId: number, readonly rider: Rider, readonly lengthM: number, readonly laps: number) {
    if (!Number.isFinite(lengthM) || lengthM <= 0) throw new RangeError('Invalid circuit length');
    this.nextGate = Math.floor(rider.distance / (lengthM / 16)) + 1;
  }
  invalidate(reason: 'track-limits' | 'discontinuity' | 'recovery', timeS: number, emit: (event: RaceEvent) => void) {
    if (reason === 'discontinuity') this.ordered = false;
    if (!this.valid) return;
    this.valid = false;
    emit({ type: 'lap-invalidated', vehicleId: this.vehicleId, timeS, reason });
  }
  /** Called once after each physics step with BEFORE/AFTER measured route progress. */
  advance(previousM: number, currentM: number, startS: number, endS: number, onTrack: boolean, emit: (event: RaceEvent) => void) {
    const r = this.rider;
    if (r.finished) return;
    if (!onTrack) this.invalidate('track-limits', endS, emit);
    const delta = currentM - previousM, spacing = this.lengthM / 16;
    // Beyond physical travel (140 m/s plus projection tolerance) is a teleport.
    if (!Number.isFinite(delta) || Math.abs(delta) > 140 * (endS - startS) + 2) {
      this.invalidate('discontinuity', endS, emit);
      if (Number.isFinite(currentM)) this.nextGate = Math.floor(currentM / spacing) + 1;
      r.lapTime = endS - this.lapStartS;
      return;
    }
    if (delta > 0) {
      // Missing a gate cannot be repaired by merely arriving beyond it.
      if (previousM > this.nextGate * spacing + 1e-6) {
        this.invalidate('discontinuity', endS, emit);
        this.nextGate = Math.floor(currentM / spacing) + 1;
      }
      while (currentM >= this.nextGate * spacing && previousM <= this.nextGate * spacing) {
        const gate = this.nextGate++;
        if (gate <= 0) continue; // Grid cars crossing start for the first time.
        const timeS = startS + (gate * spacing - previousM) / delta * (endS - startS);
        const localGate = ((gate - 1) % 16) + 1;
        r.checkpoint = gate;
        if ([5, 11, 16].includes(localGate)) {
          const durationS = timeS - this.sectorStartS;
          this.sectors[this.sector - 1] = durationS;
          emit({ type: 'sector-completed', vehicleId: this.vehicleId, timeS, sector: this.sector, durationS });
          this.sectorStartS = timeS;
          this.sector++;
        }
        if (localGate === 16) {
          const durationS = timeS - this.lapStartS;
          this.lastLapS = durationS;
          if (this.ordered) {
            r.lap++;
            if (this.valid) r.best = Math.min(r.best, durationS);
            emit({ type: 'lap-completed', vehicleId: this.vehicleId, timeS, lap: r.lap, durationS, valid: this.valid });
          }
          this.lapStartS = timeS;
          this.sector = 1;
          this.sectors = [null, null, null];
          this.valid = true;
          this.ordered = true;
          if (r.lap >= this.laps) {
            r.finished = true;
            r.finishTime = timeS;
            emit({ type: 'vehicle-finished', vehicleId: this.vehicleId, timeS });
            break;
          }
        }
      }
    }
    r.lapTime = r.finished ? 0 : endS - this.lapStartS;
  }
  snapshot(): TimingTelemetry {
    const r = this.rider;
    return { completedLaps: r.lap, lapTimeS: r.lapTime, bestLapS: Number.isFinite(r.best) ? r.best : null,
      lastLapS: this.lastLapS, valid: this.valid, nextCheckpoint: ((this.nextGate - 1) % 16 + 16) % 16 + 1,
      sector: this.sector, sectorsS: [...this.sectors], finished: r.finished, finishTimeS: r.finished ? r.finishTime : null };
  }
}
