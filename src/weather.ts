import * as THREE from 'three';

function splashMap() {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 32; canvas.height = 32;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createRadialGradient(16, 16, 1, 16, 16, 16);
  gradient.addColorStop(0, 'rgba(210,230,255,.9)');
  gradient.addColorStop(1, 'rgba(210,230,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 32, 32);
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  return map;
}

export class WeatherSystem {
  readonly group = new THREE.Group();
  wetness = 0;
  private rain?: THREE.Points;
  private spray?: THREE.Points;
  private rainVel: Float32Array = new Float32Array(0);
  private active = false;

  constructor() {
    this.group.name = 'WeatherVFX';
  }

  setWet(wet: boolean, quality: 'low' | 'medium' | 'high') {
    this.active = wet;
    this.wetness = wet ? 1 : 0;
    this.disposePoints();
    if (!wet) return;
    const rainCount = quality === 'high' ? 7000 : quality === 'medium' ? 3200 : 900;
    const sprayCount = quality === 'high' ? 900 : quality === 'medium' ? 420 : 160;
    const rainGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(rainCount * 3);
    this.rainVel = new Float32Array(rainCount);
    for (let i = 0; i < rainCount; i++) {
      positions[i * 3] = (Math.random() - .5) * 80;
      positions[i * 3 + 1] = Math.random() * 28;
      positions[i * 3 + 2] = (Math.random() - .5) * 80;
      this.rainVel[i] = 18 + Math.random() * 16;
    }
    rainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.rain = new THREE.Points(rainGeo, new THREE.PointsMaterial({
      color: '#c5d7ef', size: .09, transparent: true, opacity: .55, depthWrite: false,
    }));
    this.group.add(this.rain);

    const sprayGeo = new THREE.BufferGeometry();
    sprayGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(sprayCount * 3), 3));
    const map = splashMap();
    this.spray = new THREE.Points(sprayGeo, new THREE.PointsMaterial({
      map: map ?? undefined, color: '#d9e6f4', size: .28, transparent: true, opacity: .35, depthWrite: false,
    }));
    this.group.add(this.spray);
  }

  applyWetness(root: THREE.Object3D) {
    root.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return;
      const mat = object.material;
      if (!Array.isArray(mat) && mat && 'userData' in mat && (mat as THREE.Material).userData.surface === 'asphalt') {
        const physical = mat as THREE.MeshStandardMaterial;
        physical.roughness = THREE.MathUtils.lerp(.92, .18, this.wetness);
        physical.metalness = THREE.MathUtils.lerp(.02, .28, this.wetness);
        physical.envMapIntensity = THREE.MathUtils.lerp(.25, 1.15, this.wetness);
      }
    });
  }

  update(dt: number, origin: THREE.Vector3, cars: THREE.Object3D[], speeds: number[]) {
    if (!this.active || !this.rain) return;
    const pos = this.rain.geometry.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      let y = pos.getY(i) - this.rainVel[i] * dt;
      let x = pos.getX(i) + dt * 4;
      if (y < 0) y = 22 + Math.random() * 8;
      if (Math.abs(x - origin.x) > 42) x = origin.x + (Math.random() - .5) * 80;
      let z = pos.getZ(i);
      if (Math.abs(z - origin.z) > 42) z = origin.z + (Math.random() - .5) * 80;
      pos.setXYZ(i, x, y, z);
    }
    pos.needsUpdate = true;
    this.rain.position.set(origin.x, 0, origin.z);

    if (!this.spray) return;
    const spray = this.spray.geometry.getAttribute('position') as THREE.BufferAttribute;
    let n = 0;
    for (let c = 0; c < cars.length; c++) {
      if (speeds[c] < 12) continue;
      const p = cars[c].position;
      for (let k = 0; k < 8 && n < spray.count; k++, n++) {
        spray.setXYZ(n, p.x + (Math.random() - .5) * .8, .12 + Math.random() * .5, p.z - (Math.random() * 2.4));
      }
    }
    for (; n < spray.count; n++) spray.setXYZ(n, origin.x, -4, origin.z);
    spray.needsUpdate = true;
  }

  private disposePoints() {
    for (const points of [this.rain, this.spray]) {
      if (!points) continue;
      this.group.remove(points);
      points.geometry.dispose();
      (points.material as THREE.Material).dispose();
    }
    this.rain = this.spray = undefined;
  }

  dispose() {
    this.disposePoints();
  }
}
