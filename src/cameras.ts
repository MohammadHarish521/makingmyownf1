import * as THREE from 'three';
import type {Rider} from './simulation';

export const CAMERA_MODES = ['chase', 'halo', 'cockpit', 'nose', 'rear', 'broadcast', 'cinematic'] as const;
export type CameraMode = typeof CAMERA_MODES[number];

const local = new THREE.Vector3();
const world = new THREE.Vector3();
const look = new THREE.Vector3();
const forward = new THREE.Vector3();
const right = new THREE.Vector3();
const up = new THREE.Vector3(0, 1, 0);

function carPoint(car: THREE.Object3D, x: number, y: number, z: number, target: THREE.Vector3) {
  local.set(x, y, z);
  car.localToWorld(local);
  target.copy(local);
}

export class RaceCameras {
  mode = 0;
  fov = 48;
  private shake = new THREE.Vector3();
  private lastApplied = '';

  get name() { return CAMERA_MODES[this.mode]; }

  cycle() { this.mode = (this.mode + 1) % CAMERA_MODES.length; }

  set(name: CameraMode) {
    const index = CAMERA_MODES.indexOf(name);
    if (index >= 0) this.mode = index;
  }

  garage(camera: THREE.PerspectiveCamera, orbit: number, zoom: number, menuView: string, factor: number) {
    const a = orbit + .35;
    world.set(Math.sin(a) * zoom, 3.4, Math.cos(a) * zoom);
    look.set(0, .5, 0);
    camera.fov = 38;
    camera.setViewOffset(innerWidth, innerHeight, -innerWidth * (innerWidth < 650 ? 0 : menuView === 'main' ? .1 : .13), 0, innerWidth, innerHeight);
    if (innerWidth < 550) {
      world.set(Math.sin(a) * 16, 6, Math.cos(a) * 16);
      look.set(0, menuView === 'main' ? 0 : 1.4, 0);
    }
    camera.position.lerp(world, factor);
    camera.lookAt(look);
    camera.updateProjectionMatrix();
  }

  race(
    camera: THREE.PerspectiveCamera,
    car: THREE.Object3D,
    rider: Rider,
    input: {throttle: number; brake: number},
    lookBack: boolean,
    elapsed: number,
    factor: number,
  ) {
    camera.clearViewOffset();
    car.getWorldDirection(forward);
    right.crossVectors(forward, up).normalize();
    const mode = lookBack ? 'rear' : CAMERA_MODES[this.mode];
    const helmet = car.getObjectByName('DriverHelmet') as THREE.Object3D | undefined;
    const fairing = car.getObjectByName('HaloFairing') as THREE.Object3D | undefined;
    if (helmet) helmet.visible = mode !== 'cockpit';
    if (fairing) fairing.visible = mode === 'cockpit';

    const speedFov = Math.min(12, rider.speed * .12);
    if (mode === 'cockpit') {
      carPoint(car, 0, .9, -.18, world);
      carPoint(car, 0, .38, 9, look);
      this.fov = 62 + speedFov * .2;
    } else if (mode === 'halo') {
      carPoint(car, 0, 1.02, .42, world);
      carPoint(car, 0, .78, 14, look);
      this.fov = 56 + speedFov * .4;
    } else if (mode === 'nose') {
      carPoint(car, 0, .38, 2.25, world);
      carPoint(car, 0, .32, 16, look);
      this.fov = 52 + speedFov * .3;
    } else if (mode === 'rear') {
      carPoint(car, 0, 1.15, -1.1, world);
      carPoint(car, 0, .7, -18, look);
      this.fov = 50;
    } else if (mode === 'broadcast') {
      const side = Math.sin(elapsed * .11) > 0 ? 1 : -1;
      world.copy(car.position).addScaledVector(forward, -6).addScaledVector(right, side * 9);
      world.y += 3.4;
      look.copy(car.position).addScaledVector(forward, 4);
      look.y += .6;
      this.fov = 34;
    } else if (mode === 'cinematic') {
      const a = elapsed * .2;
      world.copy(car.position).add(new THREE.Vector3(Math.cos(a) * 11, 5.2, Math.sin(a) * 11));
      look.copy(car.position); look.y += .8;
      this.fov = 40;
    } else {
      world.copy(car.position).addScaledVector(forward, -8.2 - rider.speed * .01);
      world.y += 2.55;
      look.copy(car.position).addScaledVector(forward, 10);
      look.y += .85;
      this.fov = 48 + speedFov;
    }

    const shake = rider.speed * .00028 + (rider.crash > 0 ? .05 : 0) + input.brake * .008;
    this.shake.set(Math.sin(elapsed * 71) * shake, Math.sin(elapsed * 93) * shake * .7, Math.cos(elapsed * 61) * shake * .4);
    world.add(this.shake);
    look.y += input.brake * .07 - input.throttle * .03;
    if (mode === 'cockpit' || mode === 'halo') {
      world.addScaledVector(forward, input.brake * .04);
      world.y += rider.yawRate * 0;
    }

    const snap = this.lastApplied !== mode;
    this.lastApplied = mode;
    if (snap || mode === 'cockpit' || mode === 'halo' || mode === 'nose') camera.position.copy(world);
    else camera.position.lerp(world, mode === 'broadcast' || mode === 'cinematic' ? factor * .45 : factor);
    camera.lookAt(look);
    if (mode === 'cockpit' || mode === 'halo') camera.rotateZ(-rider.yawRate * .045 - rider.heading * .12);
    camera.fov = this.fov;
    camera.updateProjectionMatrix();
  }
}
