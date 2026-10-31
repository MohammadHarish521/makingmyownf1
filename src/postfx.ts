import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import type {GraphicsPreset} from './performance';

export class RacePost {
  private composer: EffectComposer | null = null;
  private bloom?: UnrealBloomPass;
  enabled = false;

  constructor(private renderer: THREE.WebGLRenderer, private scene: THREE.Scene, private camera: THREE.Camera) {}

  setPreset(preset: GraphicsPreset) {
    this.enabled = preset === 'ultra' || preset === 'high';
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    if (!this.enabled) {
      this.dispose();
      return;
    }
    if (!this.composer) {
      this.composer = new EffectComposer(this.renderer);
      this.composer.addPass(new RenderPass(this.scene, this.camera));
      this.bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), .22, .4, .86);
      this.composer.addPass(this.bloom);
      this.composer.addPass(new OutputPass());
    }
    if (this.bloom) this.bloom.strength = preset === 'ultra' ? .28 : .16;
    this.resize(innerWidth, innerHeight);
  }

  resize(width: number, height: number) {
    this.composer?.setSize(width, height);
    this.bloom?.resolution.set(width, height);
  }

  render() {
    if (this.enabled && this.composer) this.composer.render();
    else this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.composer?.dispose();
    this.composer = null;
    this.bloom = undefined;
  }
}
