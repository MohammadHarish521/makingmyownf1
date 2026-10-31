import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DecalGeometry} from 'three/addons/geometries/DecalGeometry.js';
import {BIKES} from './simulation';
import {attachCockpit, updateCockpit} from './cockpit';
import {sharedMaps} from './proc-tex';

const templates: THREE.Group[] = [];
const paintNames = /Nose|sidepod|Halo|Airbox|Mirrors/i;
const carbonNames = /wing|Floor|floor|diffuser|suspension/i;
const haloNames = /Halo/i;

/** Qvist_designs' 2026 concept, CC BY 4.0. See the in-game model credit. */
export async function loadCars() {
  const loader = new GLTFLoader();
  for (const lod of ['hero', 'race'] as const) {
    const gltf = await loader.loadAsync(`/models/qvist/formula-${lod}.glb`, event => {
      const label = document.getElementById('load-detail');
      if (label && event.total) label.textContent = `Loading ${lod === 'hero' ? 'showroom detail' : 'race detail'} · ${Math.round(event.loaded / event.total * 100)}%`;
    });
    const root = new THREE.Group();
    gltf.scene.updateMatrixWorld(true);
    const normalize = new THREE.Matrix4().makeRotationY(Math.PI / 2)
      .multiply(new THREE.Matrix4().makeScale(.001, .001, .001))
      .multiply(new THREE.Matrix4().makeTranslation(-1645, 30.8, 0));
    gltf.scene.traverse(o => {
      if (o instanceof THREE.Mesh) {
        const geometry = o.geometry.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(normalize, o.matrixWorld));
        const part = new THREE.Mesh(geometry, o.material);
        part.name = o.name;
        root.add(part);
      }
    });
    templates.push(root);
  }
}

function tyreLabel() {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.strokeStyle = '#e6c34c';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(256, 256, 220, 0, Math.PI * 2);
  ctx.stroke();
  ctx.font = 'bold italic 33px Arial';
  ctx.fillStyle = '#e6c34c';
  ctx.textAlign = 'center';
  ctx.fillText('AXIS', 256, 65);
  ctx.save();
  ctx.translate(256, 256);
  ctx.rotate(Math.PI);
  ctx.fillText('AXIS', 0, -190);
  ctx.restore();
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  return map;
}

let tyreMap: THREE.Texture | undefined;

export function createBike(index: number, raceLod = false, detailed = !raceLod): THREE.Group {
  const root = new THREE.Group();
  const wheels: THREE.Object3D[] = [], front: THREE.Group[] = [], pivots: THREE.Group[] = [];
  const materialMap = new Map<THREE.Material, THREE.Material>();
  const maps = sharedMaps();
  const paint = new THREE.Color(BIKES[index].color);
  const tyreMats: THREE.MeshPhysicalMaterial[] = [];

  for (const source of templates[raceLod ? 1 : 0].children as THREE.Mesh[]) {
    const original = source.material as THREE.MeshStandardMaterial;
    let material = materialMap.get(original);
    if (!material) {
      const physical = new THREE.MeshPhysicalMaterial({
        color: original.color,
        metalness: original.metalness,
        roughness: original.roughness,
      });
      physical.name = original.name;
      if (haloNames.test(original.name) || haloNames.test(source.name)) {
        physical.color.set('#14161b');
        physical.metalness = .78;
        physical.roughness = .22;
        physical.clearcoat = .35;
      } else if (paintNames.test(original.name) || paintNames.test(source.name)) {
        physical.color.copy(paint);
        physical.metalness = .12;
        physical.roughness = .22;
        physical.clearcoat = 1;
        physical.clearcoatRoughness = .08;
        physical.envMapIntensity = 1.15;
        physical.sheen = .15;
        physical.sheenColor.copy(paint);
      } else if (carbonNames.test(original.name) || carbonNames.test(source.name)) {
        physical.color.set('#1a1d23');
        physical.map = maps.carbon;
        physical.metalness = .68;
        physical.roughness = .34;
        physical.envMapIntensity = .85;
      } else if (/wheel|tyre|tire/i.test(original.name) || /wheel/i.test(source.name)) {
        physical.color.set('#111214');
        physical.roughness = .92;
        physical.metalness = 0;
        physical.envMapIntensity = .2;
        tyreMats.push(physical);
      } else {
        physical.color.set('#3a3f48');
        physical.metalness = .42;
        physical.roughness = .3;
        physical.envMapIntensity = .7;
      }
      material = physical;
      materialMap.set(original, material);
    }
    const part = new THREE.Mesh(source.geometry.clone(), material);
    part.name = source.name;
    part.castShadow = true;
    part.receiveShadow = true;
    if (source.name.includes('wheel')) {
      const center = new THREE.Box3().setFromObject(part).getCenter(new THREE.Vector3());
      part.geometry.translate(-center.x, -center.y, -center.z);
      const pivot = new THREE.Group();
      pivot.position.copy(center);
      root.add(pivot);
      pivots.push(pivot);
      const spin = new THREE.Group();
      pivot.add(spin);
      spin.add(part);
      wheels.push(spin);
      if (source.name.includes('front')) front.push(pivot);
      if (!tyreMap) tyreMap = tyreLabel();
      const side = Math.sign(center.x);
      const decal = new THREE.Mesh(
        new THREE.PlaneGeometry(.69, .69),
        new THREE.MeshBasicMaterial({map: tyreMap, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1}),
      );
      decal.rotation.y = side * Math.PI / 2;
      decal.position.x = side * (source.name.includes('front') ? .169 : .215);
      spin.add(decal);
    } else root.add(part);
  }

  const nose = root.getObjectByName('chassis') as THREE.Mesh;
  if (nose) {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 512;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = 'white';
    ctx.font = 'italic 900 172px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(String(index + 7).padStart(2, '0'), 128, 250);
    ctx.fillRect(105, 300, 46, 212);
    const map = new THREE.CanvasTexture(c);
    map.colorSpace = THREE.SRGBColorSpace;
    nose.updateMatrixWorld(true);
    const decal = new THREE.Mesh(
      new DecalGeometry(nose, new THREE.Vector3(0, .37, 1.4), new THREE.Euler(-Math.PI / 2, 0, 0), new THREE.Vector3(.22, .65, .8)),
      new THREE.MeshStandardMaterial({map, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, roughness: .4}),
    );
    root.add(decal);
  }

  const stripe = new THREE.Mesh(
    new THREE.BoxGeometry(.06, .015, 2.4),
    new THREE.MeshPhysicalMaterial({color: '#f4f6f8', metalness: .2, roughness: .28, clearcoat: .4}),
  );
  stripe.position.set(0, .62, .4);
  root.add(stripe);

  attachCockpit(root, index, detailed);
  root.userData.wheels = wheels;
  root.userData.frontWheels = front;
  root.userData.wheelPivots = pivots;
  root.userData.tyreMats = tyreMats;
  root.userData.name = BIKES[index].name;
  return root;
}

export function setCarWetness(root: THREE.Group, wetness: number) {
  for (const mat of (root.userData.tyreMats as THREE.MeshPhysicalMaterial[] | undefined) ?? []) {
    mat.roughness = THREE.MathUtils.lerp(.92, .42, wetness);
    mat.envMapIntensity = THREE.MathUtils.lerp(.2, .85, wetness);
  }
}

export {updateCockpit};
