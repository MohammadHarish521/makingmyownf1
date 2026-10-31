import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Sky } from 'three/addons/objects/Sky.js';
function createNightSky(){
 const group=new THREE.Group();group.name='Moonlit harbor sky';
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;const ctx=canvas.getContext('2d')!;
 const gradient=ctx.createLinearGradient(0,0,0,256);gradient.addColorStop(0,'#02050e');gradient.addColorStop(.48,'#071021');gradient.addColorStop(.61,'#132940');gradient.addColorStop(1,'#050912');ctx.fillStyle=gradient;ctx.fillRect(0,0,512,256);
 const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
 const dome=new THREE.Mesh(new THREE.SphereGeometry(1100,48,24),new THREE.MeshBasicMaterial({map,side:THREE.BackSide,fog:false,depthWrite:false}));dome.name='Night sky gradient';group.add(dome);
 const positions:number[]=[],colors:number[]=[];let seed=8923;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
 for(let i=0;i<1250;i++){const a=random()*Math.PI*2,y=.12+random()*.88,r=Math.sqrt(1-y*y);positions.push(Math.cos(a)*r*1040,y*1040,Math.sin(a)*r*1040);const brightness=.45+random()*.55;colors.push(brightness*.9,brightness*.95,brightness)}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
 const stars=new THREE.Points(geometry,new THREE.PointsMaterial({vertexColors:true,size:1.4,sizeAttenuation:false,fog:false,depthWrite:false}));stars.name='Stars';group.add(stars);
 const moon=new THREE.Mesh(new THREE.SphereGeometry(16,32,20),new THREE.MeshBasicMaterial({color:'#dbe8f4',fog:false}));moon.position.set(-440,330,-760);moon.name='Moon';group.add(moon);
 const haloCanvas=document.createElement('canvas');haloCanvas.width=128;haloCanvas.height=128;const hc=haloCanvas.getContext('2d')!;const hg=hc.createRadialGradient(64,64,4,64,64,64);hg.addColorStop(0,'rgba(169,204,255,.3)');hg.addColorStop(.3,'rgba(136,174,240,.08)');hg.addColorStop(1,'rgba(111,160,240,0)');hc.fillStyle=hg;hc.fillRect(0,0,128,128);
 const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(haloCanvas),transparent:true,depthWrite:false,fog:false}));halo.position.copy(moon.position);halo.scale.set(130,130,1);group.add(halo);
 return group;
}
export function createEnvironments(renderer:THREE.WebGLRenderer){
 const pmrem=new THREE.PMREMGenerator(renderer);
 const studioRoom=new RoomEnvironment();const studio=pmrem.fromScene(studioRoom,.035).texture;studioRoom.dispose();
 const sky=new Sky();sky.scale.setScalar(10000);
 const u=sky.material.uniforms;u.turbidity.value=2.2;u.rayleigh.value=2;u.mieCoefficient.value=.004;u.mieDirectionalG.value=.8;u.sunPosition.value.set(80,95,35);
 const skyScene=new THREE.Scene();skyScene.add(sky);
 const daylight=pmrem.fromScene(skyScene,.025,.1,20000).texture;skyScene.remove(sky);sky.scale.setScalar(1000);
 const nightSky=createNightSky();const nightScene=new THREE.Scene();nightScene.add(nightSky);const night=pmrem.fromScene(nightScene,.04,.1,2000).texture;nightScene.remove(nightSky);pmrem.dispose();
 return {studio,daylight,night,sky,nightSky};
}
