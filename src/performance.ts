import type * as THREE from 'three';
export type GraphicsPreset = 'auto' | 'low' | 'high' | 'ultra' | 'performance';

/** Render quality follows measured animation-frame time; physics stays at 60 Hz. */
export class AdaptiveGraphics {
  preset: GraphicsPreset = 'auto';
  fps = 60;
  pixelRatio = 1;
  frameMs = 16.67;
  private slowSeconds = 0;
  private fastSeconds = 0;
  private runningSeconds = 0;

  constructor(private renderer: THREE.WebGLRenderer, private sun: THREE.DirectionalLight) {
    this.setPreset('auto');
  }

  get lampBudget() {
    if (this.preset === 'ultra') return 8;
    if (this.preset === 'high') return 5;
    return this.pixelRatio < 1 ? 2 : 3;
  }

  get bloom() { return this.preset === 'ultra' || this.preset === 'high'; }
  get weatherQuality(): 'low' | 'medium' | 'high' {
    if (this.preset === 'ultra' || this.preset === 'high') return 'high';
    if (this.preset === 'low' || this.preset === 'performance' || this.pixelRatio < 1) return 'low';
    return 'medium';
  }

  setPreset(preset: GraphicsPreset) {
    this.preset = preset;
    this.slowSeconds = this.fastSeconds = 0;
    const ratio = preset === 'ultra' ? Math.min(devicePixelRatio, 2)
      : preset === 'high' ? Math.min(devicePixelRatio, 1.75)
      : preset === 'performance' ? Math.min(devicePixelRatio, .8)
      : preset === 'low' ? Math.min(devicePixelRatio, .7)
      : Math.min(devicePixelRatio, 1.25);
    this.apply(ratio);
  }

  private apply(ratio: number) {
    this.pixelRatio = ratio;
    this.renderer.setPixelRatio(ratio);
    const size = this.preset === 'ultra' ? 4096
      : this.preset === 'high' ? 2048
      : ratio < 1 || this.preset === 'low' || this.preset === 'performance' ? 512
      : 1024;
    if (this.sun.shadow.mapSize.x !== size) {
      this.sun.shadow.map?.dispose();
      this.sun.shadow.map = null;
      this.sun.shadow.mapSize.set(size, size);
      this.sun.shadow.needsUpdate = true;
    }
    this.sun.castShadow = this.preset !== 'low';
  }

  update(seconds: number) {
    if (seconds <= 0 || document.hidden) return;
    const sample = Math.min(seconds, 1);
    this.frameMs += (sample * 1000 - this.frameMs) * .08;
    this.fps = Math.max(1, Math.round(1000 / this.frameMs));
    this.runningSeconds += sample;
    if (this.preset !== 'auto' || this.runningSeconds < 1.5) return;
    this.slowSeconds = this.frameMs > 19.5 ? this.slowSeconds + sample : 0;
    this.fastSeconds = this.frameMs < 14 ? this.fastSeconds + sample : 0;
    if (this.slowSeconds > 1 && this.pixelRatio > .65) {
      this.apply(Math.max(.65, this.pixelRatio - .15));
      this.slowSeconds = 0;
      this.fastSeconds = 0;
    }
    if (this.fastSeconds > 8 && this.pixelRatio < Math.min(devicePixelRatio, 1.25)) {
      this.apply(Math.min(devicePixelRatio, 1.25, this.pixelRatio + .1));
      this.fastSeconds = 0;
    }
  }
}
