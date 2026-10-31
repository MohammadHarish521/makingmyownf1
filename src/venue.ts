import * as THREE from 'three';
import {adTextures, sharedMaps} from './proc-tex';

const dummy = new THREE.Object3D();

function material(color: THREE.ColorRepresentation, roughness = .8, metalness = 0) {
  return new THREE.MeshStandardMaterial({color, roughness, metalness});
}

function mesh(geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D, rx = 0, ry = 0, rz = 0) {
  const object = new THREE.Mesh(geo, mat);
  object.position.set(x, y, z);
  object.rotation.set(rx, ry, rz);
  object.castShadow = true;
  object.receiveShadow = true;
  parent.add(object);
  return object;
}

export function dressVenue(group: THREE.Group, curve: THREE.CatmullRomCurve3, length: number, width: number, index: number) {
  const maps = sharedMaps();
  const night = index === 1;
  const grand = index === 2;
  const ads = adTextures();
  const adMats = ads.length
    ? ads.map(map => new THREE.MeshStandardMaterial({map, roughness: .45, metalness: .08}))
    : [material(night ? '#1b2a36' : '#1c1f26')];

  const rubber = new THREE.MeshStandardMaterial({
    color: night ? '#14181f' : '#2a2d32',
    map: maps.rubber,
    roughness: .95,
    metalness: 0,
  });
  rubber.userData.surface = 'asphalt';
  const samples = 480;
  const positions: number[] = [], uv: number[] = [], indices: number[] = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples, p = curve.getPointAt(t), tangent = curve.getTangentAt(t);
    const n = new THREE.Vector3(tangent.z, 0, -tangent.x);
    for (const offset of [-2.4, 2.4]) {
      positions.push(p.x + n.x * offset, .028, p.z + n.z * offset);
      uv.push((offset + 2.4) / 4.8, t * length / 8);
    }
    if (i < samples) {
      const k = i * 2;
      indices.push(k, k + 2, k + 1, k + 1, k + 2, k + 3);
    }
  }
  const rubberGeo = new THREE.BufferGeometry();
  rubberGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  rubberGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  rubberGeo.setIndex(indices);
  rubberGeo.computeVertexNormals();
  const racingLine = new THREE.Mesh(rubberGeo, rubber);
  racingLine.receiveShadow = true;
  racingLine.name = 'RubberRacingLine';
  group.add(racingLine);

  const fenceCount = Math.ceil(length / 3.4) * 2;
  const fence = new THREE.InstancedMesh(
    new THREE.PlaneGeometry(3.3, 2.4),
    new THREE.MeshStandardMaterial({map: maps.fence, transparent: true, side: THREE.DoubleSide, roughness: .55, metalness: .35, depthWrite: false}),
    fenceCount,
  );
  const posts = new THREE.InstancedMesh(new THREE.BoxGeometry(.06, 3.1, .06), material(night ? '#8aa0ad' : '#c5c7be', .4, .65), fenceCount);
  let fi = 0;
  for (let i = 0; i < fenceCount / 2; i++) for (const side of [-1, 1]) {
    const t = (i / (fenceCount / 2)) % 1;
    const p = curve.getPointAt(t), tangent = curve.getTangentAt(t);
    const n = new THREE.Vector3(tangent.z, 0, -tangent.x);
    dummy.position.set(p.x + n.x * 9.05 * side, 2.05, p.z + n.z * 9.05 * side);
    dummy.rotation.set(0, Math.atan2(tangent.x, tangent.z) + Math.PI / 2, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    fence.setMatrixAt(fi, dummy.matrix);
    dummy.position.y = 1.55;
    dummy.updateMatrix();
    posts.setMatrixAt(fi, dummy.matrix);
    fi++;
  }
  fence.castShadow = true;
  group.add(fence, posts);

  const boardCount = Math.ceil(length / 18) * 2;
  const boards = new THREE.InstancedMesh(new THREE.BoxGeometry(3.8, .95, .08), adMats[0], boardCount);
  let bi = 0;
  for (let i = 0; i < boardCount / 2; i++) for (const side of [-1, 1]) {
    const t = (i / (boardCount / 2) + .01) % 1;
    const p = curve.getPointAt(t), tangent = curve.getTangentAt(t);
    const n = new THREE.Vector3(tangent.z, 0, -tangent.x);
    dummy.position.set(p.x + n.x * 8.95 * side, 1.05, p.z + n.z * 8.95 * side);
    dummy.rotation.set(0, Math.atan2(tangent.x, tangent.z) + Math.PI / 2, 0);
    dummy.updateMatrix();
    boards.setMatrixAt(bi++, dummy.matrix);
  }
  boards.castShadow = true;
  group.add(boards);
  if (ads.length) {
    for (let i = 0; i < 18; i++) {
      const sprite = new THREE.Mesh(new THREE.PlaneGeometry(3.6, .82), adMats[i % adMats.length]);
      const t = (i / 18 + .02) % 1;
      const side = i % 2 ? 1 : -1;
      const p = curve.getPointAt(t), tangent = curve.getTangentAt(t);
      const n = new THREE.Vector3(tangent.z, 0, -tangent.x);
      sprite.position.set(p.x + n.x * 9.02 * side, 1.05, p.z + n.z * 9.02 * side);
      sprite.rotation.y = Math.atan2(tangent.x, tangent.z) + Math.PI / 2 + (side > 0 ? Math.PI : 0);
      sprite.castShadow = true;
      group.add(sprite);
    }
  }

  const marshalMat = material(night ? '#f0c14b' : '#ffb703');
  const hut = material('#8b9098', .55, .2);
  for (let i = 0; i < 8; i++) {
    const t = (i / 8 + .06) % 1;
    const p = curve.getPointAt(t), tangent = curve.getTangentAt(t);
    const n = new THREE.Vector3(tangent.z, 0, -tangent.x);
    const post = new THREE.Group();
    post.position.set(p.x + n.x * 11.2, 0, p.z + n.z * 11.2);
    post.rotation.y = Math.atan2(tangent.x, tangent.z);
    mesh(new THREE.BoxGeometry(1.1, 1.4, .9), hut, 0, .7, 0, post);
    mesh(new THREE.BoxGeometry(.12, 1.1, .12), marshalMat, .55, 1.8, 0, post);
    mesh(new THREE.BoxGeometry(.55, .08, .08), material('#e10600'), .55, 2.3, 0, post);
    group.add(post);
  }

  if (!grand && index !== 0) return;

  if (grand) {
    const start = curve.getPointAt(0), startT = curve.getTangentAt(0);
    const startYaw = Math.atan2(startT.x, startT.z);
    const pits = new THREE.Group();
    pits.position.copy(start);
    pits.rotation.y = startYaw;
    group.add(pits);
    const pitAsphalt = material('#5b6168', .88, .04);
    pitAsphalt.userData.surface = 'asphalt';
    mesh(new THREE.BoxGeometry(18, .04, 92), pitAsphalt, -22, .02, 28, pits);
    const garageMat = material('#d7d4cc', .7, .08);
    const doorMat = material('#1b1e24', .4, .2);
    for (let i = 0; i < 10; i++) {
      mesh(new THREE.BoxGeometry(8, 4.4, 7.2), garageMat, -26, 2.2, i * 8.4, pits);
      mesh(new THREE.BoxGeometry(7.4, 3.1, .08), doorMat, -22.05, 1.6, i * 8.4, pits);
      mesh(new THREE.BoxGeometry(8.2, .16, 7.4), material('#e8e2d6', .45, .15), -26, 4.45, i * 8.4, pits);
    }
    const tower = new THREE.Group();
    tower.position.set(18, 0, -6);
    pits.add(tower);
    mesh(new THREE.BoxGeometry(4.2, 18, 4.2), material('#cfd3d6', .4, .35), 0, 9, 0, tower);
    mesh(new THREE.BoxGeometry(6.5, 2.2, 3.2), material('#111318'), 0, 16.4, 0, tower);
    const screen = new THREE.MeshStandardMaterial({color: '#7fd0ff', emissive: '#3aa0d8', emissiveIntensity: 1.1});
    mesh(new THREE.BoxGeometry(6.1, 1.6, .08), screen, 0, 16.4, 1.65, tower);

    const tBridge = .38;
    const bp = curve.getPointAt(tBridge), bt = curve.getTangentAt(tBridge);
    const bridge = new THREE.Group();
    bridge.position.copy(bp);
    bridge.rotation.y = Math.atan2(bt.x, bt.z);
    group.add(bridge);
    mesh(new THREE.BoxGeometry(22, .45, 4.2), material('#b7bcc0', .4, .45), 0, 7.4, 0, bridge);
    for (const side of [-1, 1]) mesh(new THREE.BoxGeometry(.45, 7.2, .45), material('#9aa0a6', .35, .5), side * 9.4, 3.6, 0, bridge);
    mesh(new THREE.BoxGeometry(22, .12, .18), material('#e10600'), 0, 7.7, 2, bridge);

    const people = new THREE.InstancedMesh(
      new THREE.CapsuleGeometry(.12, .38, 3, 6),
      new THREE.MeshStandardMaterial({vertexColors: false, roughness: .8}),
      1400,
    );
    let pi = 0;
    for (let s = 0; s < 7; s++) {
      const t = .05 + s * .12;
      const p = curve.getPointAt(t), tangent = curve.getTangentAt(t);
      const n = new THREE.Vector3(tangent.z, 0, -tangent.x);
      const yaw = Math.atan2(tangent.x, tangent.z);
      for (let row = 0; row < 5; row++) for (let seat = 0; seat < 28 && pi < people.count; seat++) {
        if (((s * 17 + row * 9 + seat * 3) % 7) === 0) continue;
        const lx = 6 + row * 2, lz = -10.5 + seat * .78;
        dummy.position.set(
          p.x + n.x * 24 + Math.cos(yaw) * lx - Math.sin(yaw) * lz,
          1.15 + row * .8,
          p.z + n.z * 24 + Math.sin(yaw) * lx + Math.cos(yaw) * lz,
        );
        dummy.rotation.set(0, yaw + Math.PI, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        people.setMatrixAt(pi, dummy.matrix);
        const hue = ((s * 13 + seat * 5 + row * 3) % 12) / 12;
        people.setColorAt(pi, new THREE.Color().setHSL(hue, .35, .35 + (row % 3) * .08));
        pi++;
      }
    }
    people.count = pi;
    if (people.instanceColor) people.instanceColor.needsUpdate = true;
    people.castShadow = true;
    group.add(people);

    const runoff = material('#6d8a4e', .95);
    for (let i = 0; i < 10; i++) {
      const t = (i / 10 + .2) % 1;
      const p = curve.getPointAt(t), tangent = curve.getTangentAt(t);
      const n = new THREE.Vector3(tangent.z, 0, -tangent.x);
      const patch = mesh(new THREE.BoxGeometry(7, .03, 10), runoff, 0, 0, 0, group);
      patch.position.set(p.x + n.x * 14, -.02, p.z + n.z * 14);
      patch.rotation.y = Math.atan2(tangent.x, tangent.z);
    }
  }

  if (index === 0) {
    const gravel = material('#9a9078', .95);
    for (let i = 0; i < 6; i++) {
      const t = .2 + i * .11;
      const p = curve.getPointAt(t), tangent = curve.getTangentAt(t);
      const n = new THREE.Vector3(tangent.z, 0, -tangent.x);
      const trap = mesh(new THREE.BoxGeometry(9, .04, 12), gravel, 0, 0, 0, group);
      trap.position.set(p.x + n.x * 13.5, -.01, p.z + n.z * 13.5);
      trap.rotation.y = Math.atan2(tangent.x, tangent.z);
    }
  }

}
