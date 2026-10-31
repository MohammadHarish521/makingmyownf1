import * as THREE from 'three';

export const TRACKS = [
  { name: 'Alpine Pass', subtitle: 'Morning mist · Mountain ribbon · Dry tarmac' },
  { name: 'Neon Harbor', subtitle: 'Midnight run · Coastal skyline · Wet tarmac' },
  { name: 'Grand Circuit', subtitle: 'Golden hour · Grandstands · Racing asphalt' },
];

export interface TrackWorld {
  group: THREE.Group;
  curve: THREE.CatmullRomCurve3;
  length: number;
  width: number;
  spawn: THREE.Vector3;
}

const UP = new THREE.Vector3(0, 1, 0);
function material(color: THREE.ColorRepresentation, roughness = .8, metalness = 0) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}
function mesh(geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number, parent: THREE.Group) {
  const object = new THREE.Mesh(geo, mat); object.position.set(x, y, z); object.castShadow = true; object.receiveShadow = true; parent.add(object); return object;
}
function seeded(seed: number) { return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; }

export function buildTrack(index: number): TrackWorld {
  index = Math.max(0, Math.min(2, index));
  const group = new THREE.Group(); group.name = TRACKS[index].name;
  const routes = [
    [[-68,-50],[-28,-90],[34,-85],[93,-40],[81,11],[112,62],[40,88],[-12,50],[-75,86],[-110,30]],
    [[-70,-65],[12,-82],[88,-62],[110,-3],[82,55],[14,88],[-42,67],[-95,85],[-118,9]],
    [[-90,-55],[-25,-77],[64,-72],[109,-38],[87,10],[30,6],[24,56],[-34,88],[-99,54],[-73,9]],
  ];
  const curve = new THREE.CatmullRomCurve3(routes[index].map(([x,z])=>new THREE.Vector3(x,0,z)),true,'centripetal');
  curve.arcLengthDivisions = 1600; curve.updateArcLengths();
  const length = curve.getLength(), width = 12, segments = 640;
  const roadMat = material(index===1 ? '#172530' : '#323c43', index===1 ? .26 : .93, index===1 ? .35 : .02);
  const shoulderMat = material(index===0 ? '#80816d' : '#59616a');
  const white = material('#e1ded1'), red = material(index===1?'#23d9de':'#c94f3d');
  function ribbon(inner: number, outer: number, mat: THREE.Material, y = .014) {
    const positions: number[] = [], uv: number[] = [], indices: number[] = [];
    for(let i=0;i<=segments;i++) {
      const t=i/segments,p=curve.getPointAt(t),tangent=curve.getTangentAt(t),normal=new THREE.Vector3(tangent.z,0,-tangent.x);
      for(const offset of [inner,outer]) { positions.push(p.x+normal.x*offset,y,p.z+normal.z*offset); uv.push(offset/width,t*length/10); }
      if(i<segments){const n=i*2;indices.push(n,n+2,n+1,n+1,n+2,n+3);}
    }
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2)); geometry.setIndex(indices); geometry.computeVertexNormals();
    const surface=new THREE.Mesh(geometry,mat); surface.receiveShadow=true;group.add(surface);return surface;
  }
  ribbon(-8,8,shoulderMat,.005); ribbon(-6,6,roadMat,.025);
  ribbon(-5.7,-5.55,white,.032); ribbon(5.55,5.7,white,.032);
  // Individually colored curb segments share one draw call per side.
  for(const side of [-1,1]) {
    const curb = ribbon(side*6,side*6.7,white,.04);
    if(side<0) { const idx=curb.geometry.index!;for(let i=0;i<idx.count;i+=3){const a=idx.getX(i);idx.setX(i,idx.getX(i+2));idx.setX(i+2,a);}curb.geometry.computeVertexNormals(); }
    const colors:number[]=[]; for(let i=0;i<=segments;i++){const c=new THREE.Color(Math.floor(i/5)%2?red.color:white.color);colors.push(c.r,c.g,c.b,c.r,c.g,c.b);}
    curb.geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));curb.material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.7});
  }
  const ground = mesh(new THREE.PlaneGeometry(1500,1500),material(index===0?'#496147':index===1?'#142b32':'#6b7653'),0,-.09,0,group);ground.rotation.x=-Math.PI/2;
  const dummy = new THREE.Object3D();
  const nearestSamples=Array.from({length:200},(_,i)=>curve.getPointAt(i/200));
  const away=(x:number,z:number,d:number)=>nearestSamples.every(p=>(p.x-x)**2+(p.z-z)**2>d*d);
  const rng=seeded(81+index*91);
  // Safety barriers follow the very same arc-length samples as racing and rendering.
  const barrierCount=Math.ceil(length/3.2)*2;
  const barriers=new THREE.InstancedMesh(new THREE.BoxGeometry(3,.7,.18),material(index===1?'#4d6875':'#b7b9ae',.45,.65),barrierCount);
  let bi=0;
  for(let i=0;i<barrierCount/2;i++)for(const side of [-1,1]) {
    const t=(i/Math.ceil(length/3.2))%1,p=curve.getPointAt(t),tangent=curve.getTangentAt(t),n=new THREE.Vector3(tangent.z,0,-tangent.x);
    dummy.position.set(p.x+n.x*8.6*side,.65,p.z+n.z*8.6*side);dummy.rotation.set(0,Math.atan2(tangent.x,tangent.z)+Math.PI/2,0);dummy.scale.set(1,1,1);dummy.updateMatrix();barriers.setMatrixAt(bi++,dummy.matrix);
  }
  barriers.castShadow=true;group.add(barriers);
  // Chequered start line, timing gantry and a luminous directional start display.
  const start=curve.getPointAt(0),startT=curve.getTangentAt(0),startYaw=Math.atan2(startT.x,startT.z);
  const startGroup=new THREE.Group();startGroup.position.copy(start);startGroup.rotation.y=startYaw;group.add(startGroup);
  for(let x=0;x<12;x++)for(let z=0;z<3;z++)mesh(new THREE.BoxGeometry(1,.02,1),(x+z)%2?white:material('#11171c'),x-5.5,.055,z-1,startGroup);
  const gantryMat=material('#263039',.35,.7);
  for(const side of [-1,1])mesh(new THREE.BoxGeometry(.28,6,.28),gantryMat,side*7.7,3,0,startGroup);
  mesh(new THREE.BoxGeometry(15.7,.6,.45),gantryMat,0,6,0,startGroup);
  const panelMat=new THREE.MeshStandardMaterial({color:index===1?'#38e2e9':'#f5bc6a',emissive:index===1?'#1eafc5':'#f59c34',emissiveIntensity:1.5});
  for(let i=0;i<5;i++)mesh(new THREE.SphereGeometry(.14,8,6),panelMat,(i-2)*.7,5.9,-.3,startGroup);

  if(index===0) {
    const trunks=new THREE.InstancedMesh(new THREE.CylinderGeometry(.22,.38,3,6),material('#544c3e'),260);
    const foliage=new THREE.InstancedMesh(new THREE.ConeGeometry(2.6,9,7),material('#214c3c'),260);
    let count=0;
    for(let attempt=0;attempt<3000&&count<260;attempt++) {
      const x=(rng()-.5)*420,z=(rng()-.5)*380;if(!away(x,z,15))continue;
      const s=.65+rng()*.8;dummy.rotation.set(0,rng()*Math.PI,0);dummy.scale.set(s,s,s);dummy.position.set(x,1.4*s,z);dummy.updateMatrix();trunks.setMatrixAt(count,dummy.matrix);dummy.position.y=5.6*s;dummy.updateMatrix();foliage.setMatrixAt(count++,dummy.matrix);
    }
    trunks.count=count;foliage.count=count;trunks.castShadow=true;foliage.castShadow=true;group.add(trunks,foliage);
    for(let i=0;i<24;i++) {
      const angle=i/24*Math.PI*2,radius=260+rng()*100,h=50+rng()*110;
      const m=mesh(new THREE.ConeGeometry(55+rng()*45,h,5),material(i%2?'#6f7d78':'#87928b'),Math.sin(angle)*radius,h/2-9,Math.cos(angle)*radius,group);m.rotation.y=rng()*3;
      if(i%3===0)mesh(new THREE.ConeGeometry(20,h*.35,5),material('#d6ded8'),m.position.x,h*.82-9,m.position.z,group);
    }
    // Open-sided short mountain gallery, arch ribs ensure clear width for riders.
    const stone=material('#7b8379');
    for(let j=0;j<7;j++) {
      const t=.48+j*.007,p=curve.getPointAt(t),tan=curve.getTangentAt(t);const arch=new THREE.Group();arch.position.copy(p);arch.rotation.y=Math.atan2(tan.x,tan.z);group.add(arch);
      for(const side of [-1,1])mesh(new THREE.BoxGeometry(.65,7,.55),stone,side*7.4,3.5,0,arch);
      mesh(new THREE.BoxGeometry(15.5,.6,1.1),stone,0,7,0,arch);
    }
  } else if(index===1) {
    const buildingCount=100,buildings=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),material('#203343',.5,.45),buildingCount);
    let count=0;
    for(let attempts=0;attempts<2000&&count<buildingCount;attempts++) {
      const x=(rng()-.5)*450,z=(rng()-.5)*420;if(!away(x,z,24))continue;const h=12+rng()*64,w=8+rng()*12;
      dummy.position.set(x,h/2,z);dummy.scale.set(w,h,w);dummy.rotation.set(0,0,0);dummy.updateMatrix();buildings.setMatrixAt(count++,dummy.matrix);
      if(count%3===0) {
        const neon=new THREE.MeshStandardMaterial({color:count%2?'#fd6599':'#4adee5',emissive:count%2?'#fd2879':'#14cadf',emissiveIntensity:1.9});
        mesh(new THREE.BoxGeometry(w+.2,.3,w+.2),neon,x,h*.8,z,group);
        for(let k=0;k<3;k++)mesh(new THREE.BoxGeometry(.25,h*.7,.25),neon,x-w*.35+k*w*.35,h*.45,z-w/2-.12,group);
      }
    }
    buildings.count=count;buildings.castShadow=true;group.add(buildings);
    const water=mesh(new THREE.PlaneGeometry(650,100),new THREE.MeshStandardMaterial({color:'#0d3444',roughness:.16,metalness:.65}),0,-.03,270,group);water.rotation.x=-Math.PI/2;
    const lampGeo=new THREE.CylinderGeometry(.12,.18,7,6),lampMat=material('#688496',.4,.7),glowMat=new THREE.MeshStandardMaterial({color:'#b7e6ee',emissive:'#9cdeff',emissiveIntensity:3});
    for(let i=0;i<28;i++) {const p=curve.getPointAt(i/28),t=curve.getTangentAt(i/28);const x=p.x+t.z*11,z=p.z-t.x*11;mesh(lampGeo,lampMat,x,3.5,z,group);mesh(new THREE.BoxGeometry(1.8,.13,.6),glowMat,x,7,z,group);}
  } else {
    const standMat=material('#b4b5ad'),seatMat=material('#536b80'),roofMat=material('#e3ded2',.5,.25);
    for(let s=0;s<7;s++) {
      const t=.05+s*.12,p=curve.getPointAt(t),tangent=curve.getTangentAt(t),n=new THREE.Vector3(tangent.z,0,-tangent.x);
      const stand=new THREE.Group();stand.position.set(p.x+n.x*24,0,p.z+n.z*24);stand.rotation.y=Math.atan2(tangent.x,tangent.z);group.add(stand);
      for(let row=0;row<5;row++){mesh(new THREE.BoxGeometry(3,1+row*.8,23),standMat,6+row*2,(1+row*.8)/2,0,stand);mesh(new THREE.BoxGeometry(1.5,.22,22.5),seatMat,6+row*2,1.2+row*.8,0,stand);}
      mesh(new THREE.BoxGeometry(15,.3,26),roofMat,9,8.7,0,stand);
      for(const z of [-11,11])mesh(new THREE.CylinderGeometry(.18,.18,8.5,6),standMat,16,4.25,z,stand);
    }
    for(let i=0;i<8;i++){const p=curve.getPointAt(.05+i*.018),t=curve.getTangentAt(.05+i*.018);const paddock=new THREE.Group();paddock.position.set(p.x-t.z*23,0,p.z+t.x*23);paddock.rotation.y=Math.atan2(t.x,t.z);group.add(paddock);mesh(new THREE.BoxGeometry(14,5,8),material('#c0c5bc'),0,2.5,0,paddock);mesh(new THREE.BoxGeometry(.1,3,6),material(i%2?'#db8f4b':'#3d6c76'),7.1,1.5,0,paddock);}
    // Sparse palms and service lights around the infield.
    for(let i=0;i<35;i++){const x=(rng()-.5)*290,z=(rng()-.5)*250;if(!away(x,z,17))continue;mesh(new THREE.CylinderGeometry(.25,.4,8,7),material('#7b7051'),x,4,z,group);const crown=mesh(new THREE.SphereGeometry(3.5,7,5),material('#425d43'),x,8,z,group);crown.scale.y=.35;}
  }
  group.traverse(object=>{if(object instanceof THREE.Mesh && !(object instanceof THREE.InstancedMesh))object.receiveShadow=true;});
  return {group,curve,length,width,spawn:start.clone()};
}
