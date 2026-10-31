import * as THREE from 'three';
import {BIKES} from './simulation';
import {sharedMaps} from './proc-tex';

export type ClusterState = {
  speed: number;
  rpm: number;
  redline: number;
  gear: number;
  lap: number;
  laps: number;
  throttle: number;
  brake: number;
};

function mesh(geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D, rx = 0, ry = 0, rz = 0) {
  const object = new THREE.Mesh(geo, mat);
  object.position.set(x, y, z);
  object.rotation.set(rx, ry, rz);
  object.castShadow = true;
  object.receiveShadow = true;
  parent.add(object);
  return object;
}

function clusterTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  return {canvas, ctx, map};
}

export function paintCluster(ctx: CanvasRenderingContext2D, map: THREE.CanvasTexture, state: ClusterState) {
  const {speed, rpm, redline, gear, lap, laps, throttle, brake} = state;
  ctx.fillStyle = '#07080b';
  ctx.fillRect(0, 0, 512, 256);
  ctx.fillStyle = '#141820';
  ctx.fillRect(16, 16, 480, 224);
  const lights = 12;
  for (let i = 0; i < lights; i++) {
    const lit = rpm > redline * (0.55 + i * 0.037);
    ctx.fillStyle = !lit ? '#1c222b' : i > 9 ? '#ff2d2d' : i > 6 ? '#ffd15a' : '#3ee0a0';
    ctx.beginPath();
    ctx.roundRect(28 + i * 38, 28, 30, 14, 2);
    ctx.fill();
  }
  ctx.fillStyle = '#f4f6f8';
  ctx.font = '700 92px Rajdhani, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(String(gear), 256, 150);
  ctx.font = '600 28px Rajdhani, Arial, sans-serif';
  ctx.fillText(`${Math.round(speed)} KM/H`, 256, 186);
  ctx.font = '600 16px Barlow, Arial, sans-serif';
  ctx.fillStyle = '#9aa3b2';
  ctx.fillText(`LAP ${lap} / ${laps}`, 256, 214);
  ctx.fillStyle = '#2a313c';
  ctx.fillRect(36, 200, 110, 22);
  ctx.fillRect(366, 200, 110, 22);
  ctx.fillStyle = '#e10600';
  ctx.fillRect(36, 200, 110 * brake, 22);
  ctx.fillStyle = '#3ecf8e';
  ctx.fillRect(366, 200, 110 * throttle, 22);
  ctx.fillStyle = '#d5dbe4';
  ctx.font = '700 11px Barlow, Arial, sans-serif';
  ctx.fillText('BRK', 91, 216);
  ctx.fillText('THR', 421, 216);
  map.needsUpdate = true;
}

export function attachCockpit(root: THREE.Group, index: number, detailed: boolean) {
  const maps = sharedMaps();
  const paint = new THREE.Color(BIKES[index].color);
  const carbon = new THREE.MeshPhysicalMaterial({color: '#1b1e24', map: maps.carbon, roughness: .38, metalness: .72, envMapIntensity: .9});
  const suit = new THREE.MeshPhysicalMaterial({color: paint, roughness: .62, metalness: .04, sheen: 1, sheenRoughness: .45, sheenColor: paint});
  const glove = new THREE.MeshPhysicalMaterial({color: paint.clone().offsetHSL(0, .05, -.08), roughness: .48, metalness: .02});
  const helmet = new THREE.MeshPhysicalMaterial({color: paint.clone().offsetHSL(0, 0, .06), roughness: .18, metalness: .12, clearcoat: .85, clearcoatRoughness: .1});
  const visor = new THREE.MeshPhysicalMaterial({color: '#0b1016', roughness: .05, metalness: .85, transparent: true, opacity: .72, envMapIntensity: 1.3});
  const grip = new THREE.MeshPhysicalMaterial({color: '#111214', roughness: .86, metalness: .04});
  const led = new THREE.MeshStandardMaterial({color: '#f4f6f8', emissive: '#f4f6f8', emissiveIntensity: .8});
  const accent = new THREE.MeshStandardMaterial({color: '#d8dee6', metalness: .7, roughness: .28});

  const rig = new THREE.Group();
  rig.name = 'CockpitRig';
  rig.position.set(0, .1, .04);
  const fairing = mesh(new THREE.BoxGeometry(1.35, .045, .85), new THREE.MeshPhysicalMaterial({color: '#0c0d10', roughness: .35, metalness: .55}), 0, .98, .22, rig);
  fairing.name = 'HaloFairing';
  fairing.visible = false;

  const seat = mesh(new THREE.BoxGeometry(.42, .16, .55), carbon, 0, .38, -.02, rig);
  seat.scale.set(1, 1, 1);
  mesh(new THREE.BoxGeometry(.5, .28, .12), carbon, 0, .52, -.28, rig);
  const torso = mesh(new THREE.CapsuleGeometry(.16, .28, 6, 10), suit, 0, .62, -.06, rig);
  torso.name = 'DriverTorso';
  const head = new THREE.Group();
  head.name = 'DriverHelmet';
  head.position.set(0, .84, -.02);
  rig.add(head);
  mesh(new THREE.SphereGeometry(.125, 20, 16), helmet, 0, 0, 0, head);
  mesh(new THREE.SphereGeometry(.11, 16, 12, 0, Math.PI * 2, 0.7, 1.1), visor, 0, -.01, .03, head);
  mesh(new THREE.TorusGeometry(.09, .012, 8, 18, Math.PI), accent, 0, .02, .04, head, .4, 0, 0);
  mesh(new THREE.BoxGeometry(.2, .028, .04), new THREE.MeshStandardMaterial({color: '#f3f5f7'}), 0, .08, .02, head);

  const arms = new THREE.Group();
  arms.name = 'DriverArms';
  rig.add(arms);
  for (const side of [-1, 1]) {
    mesh(new THREE.CapsuleGeometry(.042, .16, 5, 8), suit, side * .2, .64, .08, arms, .9, 0, side * .35);
    mesh(new THREE.CapsuleGeometry(.036, .14, 5, 8), suit, side * .18, .58, .22, arms, 1.15, 0, side * .15);
    const hand = mesh(new THREE.BoxGeometry(.07, .045, .08), glove, side * .12, .545, .34, arms);
    hand.name = side < 0 ? 'GloveL' : 'GloveR';
    if (detailed) {
      for (let f = 0; f < 4; f++) mesh(new THREE.BoxGeometry(.012, .012, .036), glove, side * (.1 + f * .016), .55, .385, arms);
    }
  }

  const wheel = new THREE.Group();
  wheel.name = 'SteeringWheel';
  wheel.position.set(0, .58, .46);
  wheel.rotation.x = -.22;
  rig.add(wheel);
  mesh(new THREE.TorusGeometry(.13, .018, 10, 28), grip, 0, 0, 0, wheel);
  mesh(new THREE.BoxGeometry(.26, .07, .03), carbon, 0, -.02, 0, wheel);
  mesh(new THREE.BoxGeometry(.08, .12, .025), carbon, -.11, 0, 0, wheel);
  mesh(new THREE.BoxGeometry(.08, .12, .025), carbon, .11, 0, 0, wheel);
  mesh(new THREE.BoxGeometry(.22, .035, .02), new THREE.MeshPhysicalMaterial({color: paint, roughness: .32, metalness: .18, clearcoat: .7}), 0, .055, .01, wheel);
  for (const x of [-.09, -.045, 0, .045, .09]) mesh(new THREE.BoxGeometry(.03, .012, .01), led, x, .078, .018, wheel);
  for (const [x, color] of [[-.08, '#ef4444'], [-.04, '#fbbf24'], [.04, '#22c55e'], [.08, '#38bdf8']] as const) {
    mesh(new THREE.CylinderGeometry(.008, .008, .01, 8), new THREE.MeshStandardMaterial({color, emissive: color, emissiveIntensity: .6}), x, -.04, .016, wheel, Math.PI / 2, 0, 0);
  }
  mesh(new THREE.BoxGeometry(.05, .018, .01), accent, -.16, .02, 0, wheel);
  mesh(new THREE.BoxGeometry(.05, .018, .01), accent, .16, .02, 0, wheel);

  let display: {ctx: CanvasRenderingContext2D; map: THREE.CanvasTexture} | undefined;
  if (detailed && typeof document !== 'undefined') {
    const cluster = clusterTexture();
    display = {ctx: cluster.ctx, map: cluster.map};
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(.16, .08),
      new THREE.MeshBasicMaterial({map: cluster.map})
    );
    screen.position.set(0, .012, .02);
    wheel.add(screen);
    paintCluster(cluster.ctx, cluster.map, {speed: 0, rpm: 4000, redline: 15000, gear: 1, lap: 1, laps: 3, throttle: 0, brake: 0});
  } else {
    mesh(new THREE.PlaneGeometry(.16, .08), new THREE.MeshStandardMaterial({color: '#0a0d12', emissive: '#11161d', emissiveIntensity: .4}), 0, .012, .018, wheel);
  }

  root.add(rig);
  root.userData.cockpit = rig;
  root.userData.steeringWheel = wheel;
  root.userData.helmet = head;
  root.userData.arms = arms;
  root.userData.cluster = display;
  root.userData.eye = new THREE.Vector3(0, .86, .1);
}

export function updateCockpit(root: THREE.Group, steering: number, state?: ClusterState) {
  const wheel = root.userData.steeringWheel as THREE.Group | undefined;
  const arms = root.userData.arms as THREE.Group | undefined;
  if (wheel) wheel.rotation.z = -steering * 2.15;
  if (arms) arms.rotation.z = -steering * .18;
  const cluster = root.userData.cluster as {ctx: CanvasRenderingContext2D; map: THREE.CanvasTexture} | undefined;
  if (cluster && state) paintCluster(cluster.ctx, cluster.map, state);
}
