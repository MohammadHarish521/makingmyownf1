import type { Rider } from '../simulation';
import type { TrackData } from './contracts';
/** Existing pure-pursuit driver, separated from presentation. Same physical cars. */
export function planAI(index: number, riders: readonly Rider[], track: TrackData, difficulty: number) {
  const r = riders[index];
  let wanted = 65 + difficulty * 5;
  for (const ahead of [0, 20, 45, 85, 140]) {
    const curvature = Math.abs(track.sample(r.distance + ahead).curvaturePerM);
    wanted = Math.min(wanted, Math.sqrt(13 / Math.max(.001, curvature) + 2 * 15 * ahead));
  }
  wanted *= .87 + difficulty * .035 + index * .006;
  let lane = Math.sin(r.distance * .007 + index) * 1.6;
  // All nearby cars participate; this is only basic avoidance, not racecraft.
  for (let i = 0; i < riders.length; i++) {
    if (i === index) continue;
    const other = riders[i], gap = other.distance - r.distance;
    if (gap > 0 && gap < 28 && other.speed < wanted - 2) {
      // Leave a clear passing corridor around a stopped/finished chassis.
      lane = other.lateral >= 0 ? -3 : 3;
      if (gap < 12 && Math.abs(other.lateral - r.lateral) < 1.9) wanted = Math.min(wanted, Math.max(4, other.speed + (gap - 6) * .7));
    }
  }
  return { wanted, lane };
}
