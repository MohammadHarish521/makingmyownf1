/** The only accumulator. Cannon receives world.step(dt), never its own accumulator. */
export class FixedStepClock {
  private remainder = 0;
  droppedTimeS = 0;
  constructor(readonly dt = 1 / 60, readonly maxSteps = 6) {
    if (!Number.isFinite(dt) || dt <= 0 || !Number.isInteger(maxSteps) || maxSteps < 1) throw new RangeError('Invalid fixed step');
  }
  get alpha() { return Math.min(1, Math.max(0, this.remainder / this.dt)); }
  advance(deltaS: number, step: () => boolean | void) {
    if (!Number.isFinite(deltaS) || deltaS <= 0) return 0;
    const accepted = Math.min(deltaS, this.dt * this.maxSteps);
    this.droppedTimeS += deltaS - accepted;
    this.remainder += accepted;
    let steps = 0;
    while (this.remainder + 1e-10 >= this.dt && steps < this.maxSteps) {
      this.remainder = Math.max(0, this.remainder - this.dt);
      steps++;
      if (step() === false) { this.remainder = 0; break; }
    }
    return steps;
  }
  discardRemainder() { this.remainder = 0; }
}
