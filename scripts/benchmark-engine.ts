import { writeFileSync } from 'node:fs';
import { cpus } from 'node:os';
import { RaceSession } from '../src/engine/session';
import { buildTrack } from '../src/tracks';

const rows = [];
for (const hz of [60, 120]) for (const cars of [1, 4, 6, 10]) {
  const s = new RaceSession(buildTrack(2), { mode: 'practice', carIndices: Array.from({ length: cars }, (_, i) => i % 5), fixedDtS: 1 / hz, countdownS: 0 });
  const costs: number[] = [];
  for (let i = 0; i < hz * 8; i++) {
    const start = performance.now(); s.advanceFrame(1 / hz, { throttle: 1, brake: 0, steer: 0 });
    if (i >= hz * 2) costs.push(performance.now() - start);
  }
  costs.sort((a, b) => a - b);
  rows.push({ hz, cars, meanStepMs: costs.reduce((a, b) => a + b, 0) / costs.length, p95StepMs: costs[Math.floor(costs.length * .95)], p99StepMs: costs[Math.floor(costs.length * .99)], simulatedS: s.elapsedS, finite: s.telemetry().vehicles.every(v => Number.isFinite(v.transform.position.x) && Number.isFinite(v.velocityMps.z)) });
  s.dispose();
}
const result = { measuredAt: new Date().toISOString(), runtime: process.version, cpu: cpus()[0]?.model, platform: process.platform, note: 'Headless CPU-only vehicle/AI benchmark, 2s warmup + 6s sample per case. No WebGL/GPU or 1080p FPS claim.', rows };
writeFileSync('artifacts/engine-benchmark.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
