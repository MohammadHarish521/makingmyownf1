import * as THREE from 'three';
/** Low foothills join the track to the image horizon without hiding its peaks. */
export function addMountainBackdrop(parent:THREE.Group,warm=false){
 const angular=128,radial=8;
 for(let layer=0;layer<1;layer++){
  const inner=420,outer=850;
  const positions:number[]=[],colors:number[]=[],indices:number[]=[];
  for(let row=0;row<=radial;row++)for(let i=0;i<=angular;i++){
   const a=i/angular*Math.PI*2,t=row/radial;
   const profile=.58+.18*Math.sin(a*5+layer)+.13*Math.cos(a*9-1.2)+.1*Math.sin(a*17+layer*.7);
   const ridge=Math.pow(Math.sin(Math.PI*t),.9);
   const fine=Math.sin(a*43+t*17)*Math.sin(a*19-t*13)*2*ridge;
   const h=Math.max(-3,ridge*48*profile+fine-3);
   const radius=inner+(outer-inner)*t;positions.push(Math.cos(a)*radius,h,Math.sin(a)*radius);
   const rock=new THREE.Color(warm?'#7e7b71':'#737f85');const valley=new THREE.Color(warm?'#596149':'#3d604c');
   const snow=new THREE.Color('#e1e8e6');const shade=.9+.1*Math.sin(a*31+t*33);
   const color=valley.lerp(rock,THREE.MathUtils.smoothstep(h,25,95));
   const snowline=170+layer*42+Math.sin(a*11)*18;
   if(h>snowline)color.lerp(snow,THREE.MathUtils.smoothstep(h,snowline,snowline+35));
   if(layer>0)color.lerp(new THREE.Color(warm?'#a9a8a0':'#9eb1bf'),layer*.16);
   color.multiplyScalar(shade);colors.push(color.r,color.g,color.b);
   if(row<radial&&i<angular){const n=row*(angular+1)+i;indices.push(n,n+1,n+angular+1,n+1,n+angular+2,n+angular+1)}
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setIndex(indices);geometry.computeVertexNormals();
  const mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,side:THREE.DoubleSide}));mesh.name='Horizon foothills';mesh.receiveShadow=true;parent.add(mesh);
 }
}
export function addCityWindows(parent:THREE.Group,towers:{x:number;z:number;h:number;w:number}[]){
 const windows=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1.7),new THREE.MeshBasicMaterial({color:'#f6d7a4',side:THREE.DoubleSide}),18000);
 const dummy=new THREE.Object3D();let n=0,seed=71;
 const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
 for(const tower of towers)for(let side=0;side<4;side++)for(let y=5;y<tower.h-3;y+=4.5)for(let x=-tower.w/2+2;x<tower.w/2-1;x+=3.2){
  if(random()<.48||n>=windows.count)continue;
  const angle=side*Math.PI/2,depth=tower.w/2+.03;
  dummy.position.set(tower.x+x*Math.cos(angle)+depth*Math.sin(angle),y,tower.z-x*Math.sin(angle)+depth*Math.cos(angle));dummy.rotation.set(0,angle,0);dummy.updateMatrix();windows.setMatrixAt(n++,dummy.matrix);
 }
 windows.count=n;windows.name='Illuminated skyline windows';parent.add(windows);
}
