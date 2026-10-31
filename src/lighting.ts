import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Sky } from 'three/addons/objects/Sky.js';
export function createEnvironments(renderer:THREE.WebGLRenderer){
 const pmrem=new THREE.PMREMGenerator(renderer);
 const studioRoom=new RoomEnvironment();const studio=pmrem.fromScene(studioRoom,.035).texture;studioRoom.dispose();
 const sky=new Sky();sky.scale.setScalar(10000);
 const u=sky.material.uniforms;u.turbidity.value=3;u.rayleigh.value=1.5;u.mieCoefficient.value=.005;u.mieDirectionalG.value=.8;
 u.sunPosition.value.set(80,95,35);
 const skyScene=new THREE.Scene();skyScene.add(sky);
 const daylight=pmrem.fromScene(skyScene,.025,.1,20000).texture;skyScene.remove(sky);sky.scale.setScalar(1000);pmrem.dispose();
 return {studio,daylight,sky};
}
