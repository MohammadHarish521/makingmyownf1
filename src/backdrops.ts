import * as THREE from 'three';

/** Bundled 360-degree images stay at infinity; track geometry supplies parallax. */
export async function loadBackdrops(){
 const loader=new THREE.TextureLoader();
 const [alpine,harbor]=await Promise.all(['alpine','harbor'].map(async name=>{
  const texture=await loader.loadAsync(`/scenery/${name}-panorama.webp`);
  texture.name=`${name} image panorama`;
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.mapping=THREE.EquirectangularReflectionMapping;
  return texture;
 }));
 return {alpine,harbor};
}
