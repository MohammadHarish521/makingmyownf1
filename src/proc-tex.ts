import * as THREE from 'three';

function dataTexture(size: number, fill: (x: number, y: number, i: number, data: Uint8Array) => void, wrap = true) {
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) fill(x, y, (y * size + x) * 4, data);
  const map = new THREE.DataTexture(data, size, size);
  map.colorSpace = THREE.SRGBColorSpace;
  map.needsUpdate = true;
  map.anisotropy = 8;
  if (wrap) { map.wrapS = map.wrapT = THREE.RepeatWrapping; }
  return map;
}

export function carbonTexture() {
  return dataTexture(64, (x, y, i, data) => {
    const weave = ((x >> 2) & 1) ^ ((y >> 2) & 1);
    const fiber = ((x + y * 3) % 7 === 0) ? 10 : 0;
    const v = (weave ? 36 : 22) + fiber;
    data[i] = v; data[i + 1] = v + 2; data[i + 2] = v + 6; data[i + 3] = 255;
  });
}

export function asphaltDetail() {
  return dataTexture(128, (x, y, i, data) => {
    const n = ((x * 17 + y * 31) ^ (x * 13 - y * 7)) & 255;
    const grain = 70 + (n % 50);
    data[i] = grain; data[i + 1] = grain; data[i + 2] = grain + 4; data[i + 3] = 255;
  });
}

export function fenceTexture() {
  return dataTexture(64, (x, y, i, data) => {
    const wire = x % 8 === 0 || y % 8 === 0 || x % 8 === 1 || y % 8 === 1;
    data[i] = 118; data[i + 1] = 124; data[i + 2] = 132; data[i + 3] = wire ? 160 : 10;
  });
}

export function rubberWear() {
  return dataTexture(64, (x, y, i, data) => {
    const streak = Math.abs(((x * 3 + y * 11) % 17) - 8);
    const v = 18 + streak * 2;
    data[i] = v; data[i + 1] = v; data[i + 2] = v + 2; data[i + 3] = 255;
  });
}

const adCopy = ['THROTTLE', 'AXIS TIRE', 'VOLT ENERGY', 'AEROTECH', 'NIGHTFALL', 'PIT WALL'];
const adColors = ['#111318', '#1a1520', '#101820', '#19120f', '#12161c', '#201410'];
const adInk = ['#f2f4f7', '#ffd24a', '#5eead4', '#ff6b57', '#9ecbff', '#f4f4f4'];

export function adTextures() {
  if (typeof document === 'undefined') return [];
  return adCopy.map((label, index) => {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = adColors[index];
    ctx.fillRect(0, 0, 512, 128);
    ctx.fillStyle = index % 2 ? '#e10600' : '#f4f4f4';
    ctx.fillRect(0, 0, 14, 128);
    ctx.fillRect(498, 0, 14, 128);
    ctx.fillStyle = adInk[index];
    ctx.font = '700 48px Rajdhani, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 256, 64);
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 8;
    return map;
  });
}

let carbon: THREE.Texture | undefined;
let fence: THREE.Texture | undefined;
let rubber: THREE.Texture | undefined;
let asphalt: THREE.Texture | undefined;

export function sharedMaps() {
  carbon ??= carbonTexture();
  fence ??= fenceTexture();
  rubber ??= rubberWear();
  asphalt ??= asphaltDetail();
  return {carbon, fence, rubber, asphalt};
}
