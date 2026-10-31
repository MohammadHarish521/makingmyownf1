import * as THREE from 'three';
/** A restrained studio gives the bodywork visible highlights and ground contact. */
export function decorateGarage(group:THREE.Group){
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(120,120),new THREE.MeshStandardMaterial({color:'#0b1018',metalness:.05,roughness:.62}));floor.rotation.x=-Math.PI/2;floor.position.y=.015;floor.receiveShadow=true;group.add(floor);
 const wall=new THREE.Mesh(new THREE.CylinderGeometry(22,22,13,80,1,true),new THREE.MeshStandardMaterial({color:'#161b25',side:THREE.BackSide,roughness:.85}));wall.position.y=6;group.add(wall);
 const grid=new THREE.GridHelper(60,30,'#444954','#373c46');grid.position.y=.018;(grid.material as THREE.Material).transparent=true;(grid.material as THREE.Material).opacity=.22;group.add(grid);
 const lightMat=new THREE.MeshBasicMaterial({color:'#ecf4ff'});
 for(const x of [-5,5]){const box=new THREE.Mesh(new THREE.BoxGeometry(.12,.05,18),lightMat);box.position.set(x,7,-3);group.add(box)}
 const accent=new THREE.Mesh(new THREE.BoxGeometry(26,.035,.035),new THREE.MeshBasicMaterial({color:'#d11e20'}));accent.position.set(0,.8,-17);group.add(accent);
}
