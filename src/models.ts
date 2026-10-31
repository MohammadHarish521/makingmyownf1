import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {DecalGeometry} from 'three/addons/geometries/DecalGeometry.js';
import { BIKES } from './simulation';
const templates:THREE.Group[]=[];
const paintNames=/Nose|sidepod|Halo|Airbox|Mirrors/;
/** Qvist_designs' 2026 concept, CC BY 4.0. See the in-game model credit. */
export async function loadCars(){
 const loader=new GLTFLoader();
 for(const lod of ['hero','race']){
  const gltf=await loader.loadAsync(`/models/qvist/formula-${lod}.glb`,event=>{
   const label=document.getElementById('load-detail');if(label&&event.total)label.textContent=`Loading ${lod==='hero'?'showroom detail':'race detail'} · ${Math.round(event.loaded/event.total*100)}%`;
  });
  const root=new THREE.Group();gltf.scene.updateMatrixWorld(true);
  // Source uses millimetres, with its nose along -X. Convert once to metres/+Z.
  const normalize=new THREE.Matrix4().makeRotationY(Math.PI/2).multiply(new THREE.Matrix4().makeScale(.001,.001,.001)).multiply(new THREE.Matrix4().makeTranslation(-1645,30.8,0));
  gltf.scene.traverse(o=>{if(o instanceof THREE.Mesh){
   const geometry=o.geometry.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(normalize,o.matrixWorld));
   const part=new THREE.Mesh(geometry,o.material);part.name=o.name;root.add(part);
  }});
  templates.push(root);
 }
}
function tyreLabel():THREE.CanvasTexture{
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;const ctx=canvas.getContext('2d')!;
 ctx.strokeStyle='#e6c34c';ctx.lineWidth=3;ctx.beginPath();ctx.arc(256,256,220,0,Math.PI*2);ctx.stroke();
 ctx.font='bold italic 33px Arial';ctx.fillStyle='#e6c34c';ctx.textAlign='center';
 ctx.fillText('P ZERO',256,65);ctx.save();ctx.translate(256,256);ctx.rotate(Math.PI);ctx.fillText('P ZERO',0,-190);ctx.restore();
 const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;return map;
}
let tyreMap:THREE.Texture|undefined;
export function createBike(index:number,raceLod=false):THREE.Group{
 const root=new THREE.Group();const wheels:THREE.Object3D[]=[],front:THREE.Group[]=[];
 const materialMap=new Map<THREE.Material,THREE.Material>();
 for(const source of templates[raceLod?1:0].children as THREE.Mesh[]){
  const original=source.material as THREE.MeshStandardMaterial;let material=materialMap.get(original);
  if(!material){
   const physical=new THREE.MeshPhysicalMaterial({color:original.color,metalness:original.metalness,roughness:original.roughness});
   physical.name=original.name;
   if(paintNames.test(original.name)){physical.color.set(BIKES[index].color);physical.metalness=.2;physical.roughness=.34;physical.clearcoat=.65;physical.clearcoatRoughness=.22;}
   else if(/wing|Floor/.test(original.name)){physical.color.set('#242730');physical.metalness=.35;physical.roughness=.37;}
   else if(/wheel/.test(original.name)){physical.color.set('#191a1d');physical.roughness=.76;}
   else{physical.color.set('#42464d');physical.metalness=.3;physical.roughness=.32;}
   physical.envMapIntensity=.65;material=physical;materialMap.set(original,material);
  }
  const part=new THREE.Mesh(source.geometry.clone(),material);part.name=source.name;part.castShadow=true;part.receiveShadow=true;
  if(source.name.includes('wheel')){
   const center=new THREE.Box3().setFromObject(part).getCenter(new THREE.Vector3());part.geometry.translate(-center.x,-center.y,-center.z);
   const pivot=new THREE.Group();pivot.position.copy(center);root.add(pivot);const spin=new THREE.Group();pivot.add(spin);spin.add(part);wheels.push(spin);
   if(source.name.includes('front'))front.push(pivot);
   // Sidewall lettering is a transparent local decal; the tyre and rim remain the imported mesh.
   if(!tyreMap)tyreMap=tyreLabel();const side=Math.sign(center.x);
   const decal=new THREE.Mesh(new THREE.PlaneGeometry(.69,.69),new THREE.MeshBasicMaterial({map:tyreMap,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}));
   decal.rotation.y=side*Math.PI/2;decal.position.x=side*(source.name.includes('front')?.169:.215);spin.add(decal);
  }else root.add(part);
 }

 const nose=root.getObjectByName('chassis') as THREE.Mesh;
 if(nose){
  const c=document.createElement('canvas');c.width=256;c.height=512;const ctx=c.getContext('2d')!;
  ctx.fillStyle='white';ctx.font='italic 900 172px Arial';ctx.textAlign='center';ctx.fillText(String(index+7).padStart(2,'0'),128,250);
  ctx.fillRect(105,300,46,212);const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;
  nose.updateMatrixWorld(true);const decal=new THREE.Mesh(new DecalGeometry(nose,new THREE.Vector3(0,.37,1.4),new THREE.Euler(-Math.PI/2,0,0),new THREE.Vector3(.22,.65,.8)),new THREE.MeshStandardMaterial({map,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4,roughness:.4}));root.add(decal);
 }
 root.userData.wheels=wheels;root.userData.frontWheels=front;root.userData.name=BIKES[index].name;return root;
}
