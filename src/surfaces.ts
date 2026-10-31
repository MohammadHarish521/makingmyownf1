import * as THREE from 'three';
export const surfaces:{asphalt?:THREE.Texture;grass?:THREE.Texture;gravel?:THREE.Texture}={};
export async function loadSurfaces(){
 const loader=new THREE.TextureLoader();
 await Promise.all((['asphalt','grass','gravel'] as const).map(async name=>{
  const map=await loader.loadAsync(`/textures/${name}.png`);map.wrapS=map.wrapT=THREE.RepeatWrapping;map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=16;
  if(name==='asphalt')map.repeat.set(6,5);else if(name==='grass')map.repeat.set(140,140);else map.repeat.set(4,3);
  surfaces[name]=map;
 }));
}
