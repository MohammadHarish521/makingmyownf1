import type { TrackWorld } from '../tracks';
import type { TrackData } from './contracts';

/** Adapter over the existing visible route. Never creates a second centerline. */
export function createTrackData(track: TrackWorld, id = 'existing-circuit'): TrackData {
  const wrap = (distance: number) => ((distance % track.length) + track.length) % track.length;
  return {
    id, lengthM: track.length, widthM: track.width, barrierOffsetM: 8.6,
    checkpointsM: Array.from({ length: 16 }, (_, i) => (i + 1) * track.length / 16),
    sectorGateIndices: [5, 11, 16], pitLane: [], drsZones: [],
    sample(progressM) {
      const u = wrap(progressM) / track.length;
      const position = track.curve.getPointAt(u), tangent = track.curve.getTangentAt(u);
      const ahead = track.curve.getTangentAt(wrap(progressM + 3) / track.length);
      return {
        progressM: wrap(progressM), position: { x: position.x, y: position.y, z: position.z },
        tangent: { x: tangent.x, y: tangent.y, z: tangent.z },
        lateralNormal: { x: tangent.z, y: 0, z: -tangent.x },
        curvaturePerM: Math.atan2(tangent.z * ahead.x - tangent.x * ahead.z, tangent.dot(ahead)) / 3,
        widthM: track.width, elevationM: position.y, bankingRad: 0,
      };
    },
  };
}
