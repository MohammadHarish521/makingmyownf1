import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { BIKES } from './simulation';
let template: THREE.Group;
/** Apache-2.0 open-wheel asset, served locally so the game needs no third-party CDN. */
export async function loadCars(){template=(await new GLTFLoader().loadAsync('/models/formula-2026.glb')).scene;}
export function createBike(index:number):THREE.Group{
 const root=template.clone(true);const wheels:THREE.Object3D[]=[],front:THREE.Group[]=[];
 root.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry=o.geometry.clone();const mats=(Array.isArray(o.material)?o.material:[o.material]).map(m=>{const c=m.clone() as THREE.MeshStandardMaterial;if(m.name==='body')c.color.set(BIKES[index].color);if(m.name==='accent')c.color.set('#f5f5f5');return c});o.material=Array.isArray(o.material)?mats:mats[0];o.castShadow=true;o.receiveShadow=true;}});
 for(const name of ['wheel_fl','wheel_fr','wheel_rl','wheel_rr']){const wheel=root.getObjectByName(name)!;wheels.push(wheel);if(name.includes('_f')){const pivot=new THREE.Group();pivot.position.copy(wheel.position);wheel.position.set(0,0,0);wheel.parent!.add(pivot);pivot.add(wheel);front.push(pivot)}}
 root.userData.wheels=wheels;root.userData.frontWheels=front;root.userData.name=BIKES[index].name;return root;
}
