import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** Original procedural motorcycles. Local +Z is forwards; the tire contact is y=0. */
export function createBike(index: number): THREE.Group {
  index = Math.max(0, Math.min(4, index));
  const root = new THREE.Group();
  const colors = [0xd9b17a, 0x31bdb2, 0x852e35, 0xe84b35, 0xe3e5dc];
  const paint = new THREE.MeshStandardMaterial({ color: colors[index], metalness: .68, roughness: .24 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x171b20, metalness: .55, roughness: .37 });
  const rubber = new THREE.MeshStandardMaterial({ color: 0x101215, roughness: .91 });
  const chrome = new THREE.MeshStandardMaterial({ color: 0x9ca6ae, metalness: .95, roughness: .21 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xcaa462, metalness: .83, roughness: .28 });
  const seat = new THREE.MeshStandardMaterial({ color: index === 0 ? 0x583c2d : 0x25252a, roughness: .87 });
  const suit = new THREE.MeshStandardMaterial({ color: index === 0 ? 0x353a3a : 0x202833, roughness: .73 });
  const trim = new THREE.MeshStandardMaterial({ color: 0xe5e5dd, roughness: .38 });
  const visor = new THREE.MeshStandardMaterial({ color: 0x152832, metalness: .82, roughness: .11 });
  const headlight = new THREE.MeshStandardMaterial({ color: 0xfff3c9, emissive: 0xffedbd, emissiveIntensity: 1.6, roughness: .2 });
  const brakeLight = new THREE.MeshStandardMaterial({ color: 0xff3035, emissive: 0xff1020, emissiveIntensity: 1.3 });
  const sport = index >= 3;
  function add(g: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D = root) {
    const mesh = new THREE.Mesh(g, m); mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  }
  function ellipsoid(x: number,y: number,z: number,sx: number,sy: number,sz: number,m: THREE.Material,parent: THREE.Object3D = root) {
    const mesh = add(new THREE.SphereGeometry(1, 20, 12), m, x,y,z,parent); mesh.scale.set(sx,sy,sz); return mesh;
  }
  function tube(a: number[], b: number[], radius: number, material: THREE.Material, parent: THREE.Object3D = root) {
    const av = new THREE.Vector3(...a as [number,number,number]), bv = new THREE.Vector3(...b as [number,number,number]);
    const direction = bv.clone().sub(av); const mesh = add(new THREE.CylinderGeometry(radius,radius,direction.length(),10),material,0,0,0,parent);
    mesh.position.copy(av.add(bv).multiplyScalar(.5)); mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), direction.normalize()); return mesh;
  }
  const wheels: THREE.Group[] = [];
  for (const z of [-.70,.73]) {
    const wheel = new THREE.Group(); wheel.position.set(0,.335,z); root.add(wheel); wheels.push(wheel);
    const tire = add(new THREE.TorusGeometry(.258,.077,10,36),rubber,0,0,0,wheel); tire.rotation.y = Math.PI/2;
    const rim = add(new THREE.TorusGeometry(.215,.025,8,28), index === 4 ? gold : chrome,0,0,0,wheel); rim.rotation.y = Math.PI/2;
    const hub = add(new THREE.CylinderGeometry(.06,.06,.19,12),dark,0,0,0,wheel);hub.rotation.z = Math.PI/2;
    for(let n=0;n<(index===0?12:6);n++) {
      const theta=n/(index===0?12:6)*Math.PI*2;
      tube([0,0,0],[0,Math.sin(theta)*.214,Math.cos(theta)*.214],index===0?.006:.015,chrome,wheel);
    }
    for (const side of [-1,1]) {
      const disc=add(new THREE.CylinderGeometry(.151,.151,.008,24),chrome,side*.084,0,0,wheel);disc.rotation.z=Math.PI/2;
      const caliper=add(new THREE.BoxGeometry(.045,.10,.055),gold,side*.093,.10,.08,wheel);
      caliper.rotation.x=-.4;
    }
  }
  root.userData.wheels=wheels;
  // Tubular frame and rear swingarm, all modeled as connected structural members.
  for(const side of [-1,1]) {
    const x=side*.12;
    tube([x,.36,-.70],[x,.57,-.12],.027,dark);
    tube([x,.57,-.12],[x,.83,.40],.025,dark);
    tube([x,.83,.40],[x,.88,-.32],.026,dark);
    tube([x,.88,-.32],[x,.57,-.12],.023,dark);
    tube([x,.35,-.69],[x,.83,-.31],.025,chrome);
    // Coil-over spring silhouette.
    for(let n=0;n<6;n++) {
      const ring=add(new THREE.TorusGeometry(.037,.009,5,10),gold,x,.49+n*.044,-.60+n*.025);ring.rotation.x=Math.PI/2-.5;
    }
    tube([side*.105,.335,.73],[side*.105,.99,.43],.021,gold);
    tube([side*.105,.335,.73],[side*.105,.63,.59],.027,chrome);
  }
  ellipsoid(0,.54,-.10,.19,.22,.24,dark);
  for(const side of [-1,1]) {
    const casing=add(new THREE.CylinderGeometry(.12,.12,.065,20),chrome,side*.19,.50,-.13);casing.rotation.z=Math.PI/2;
    for(let n=0;n<5;n++)add(new THREE.BoxGeometry(.34,.018,.20),chrome,0,.62+n*.025,.02);
    tube([side*.22,.48,.12],[side*.24,.25,.28],.024,chrome);
    tube([side*.24,.25,.28],[side*.25,.23,-.61],.026,chrome);
    const muffler=tube([side*.25,.24,-.39],[side*.26,.36,-.91],index===0?.055:.045,index>=3?dark:chrome);
    void muffler;
    tube([side*.12,.47,-.22],[side*.28,.46,-.27],.015,chrome);
  }
  // Sculpted tank, inset fuel cap, saddle and tail.
  const tank=ellipsoid(0,.94,.05,index===0?.205:.19,.18,index===2?.34:.29,paint);tank.rotation.x=.10;
  const cap=add(new THREE.CylinderGeometry(.034,.034,.012,16),chrome,0,1.115,.08);cap.rotation.x=.10;
  ellipsoid(0,.925,-.37,.16,.055,.27,seat);
  if(index===2)ellipsoid(0,.97,-.65,.165,.11,.16,paint);
  else ellipsoid(0,sport?.97:.89,-.66,.15,sport?.10:.045,.18,sport?paint:seat);
  ellipsoid(0,.79,-.80,.12,.025,.025,brakeLight);
  // Curved fenders closely follow the wheel rather than box-shaped bodywork.
  for(const z of [-.70,.73]) {
    const fender=add(new THREE.TorusGeometry(.355,.045,8,18,Math.PI*.85),paint,0,.335,z);
    fender.rotation.set(0,Math.PI/2,-Math.PI*.075);
  }
  if(sport) {
    ellipsoid(0,.89,.40,.235,.24,.22,paint);
    for(const side of [-1,1]) {
      const fairing=ellipsoid(side*.19,.66,.22,.055,.25,.25,paint);fairing.rotation.x=-.25;
      const slit=add(new THREE.BoxGeometry(.012,.055,.19),dark,side*.239,.74,.23);slit.rotation.x=.2;
      ellipsoid(side*.12,.91,.585,.08,.025,.025,headlight);
    }
    const glass=new THREE.MeshPhysicalMaterial({color:0x6c9cb1,transparent:true,opacity:.58,metalness:.1,roughness:.1,side:THREE.DoubleSide});
    const windshield=ellipsoid(0,1.10,.43,.16,.18,.055,glass);windshield.rotation.x=-.5;
  } else {
    const lamp=add(new THREE.CylinderGeometry(index===0?.105:.085,index===0?.105:.085,.08,24),chrome,0,.94,.55);lamp.rotation.x=Math.PI/2;
    const lens=add(new THREE.CylinderGeometry(index===0?.088:.071,index===0?.088:.071,.006,24),headlight,0,.94,.594);lens.rotation.x=Math.PI/2;
  }
  const barY=index===0?1.07:sport?.99:1.025;
  tube([-.30,barY,.40],[.30,barY,.40],.016,chrome);
  for(const side of [-1,1]) {
    tube([side*.22,barY,.40],[side*.33,barY-.015,.36],.022,rubber);
    tube([side*.25,barY,.41],[side*.34,barY+.15,.42],.009,chrome);
    ellipsoid(side*.35,barY+.17,.42,.055,.028,.025,dark);
    ellipsoid(side*.15,.88,.54,.025,.022,.027,gold);
  }
  const instrument=add(new THREE.CylinderGeometry(.055,.055,.023,16),dark,0,1.04,.35); instrument.rotation.x=.55;
  // Articulated rider. Helmet, jacket, gloves and boots read clearly in chase view.
  const crouch=sport?.17:index===2?.12:.04;
  const hipY=1.03, hipZ=-.36;
  ellipsoid(0,hipY,hipZ,.15,.12,.14,suit);
  const chest=ellipsoid(0,1.25-crouch*.4,-.22+crouch,.18,.25,.115,suit);chest.rotation.x=.30+crouch*1.4;
  // Shoulder accent creates a visible racing suit silhouette.
  ellipsoid(0,1.405-crouch*.6,-.16+crouch,.17,.055,.105,trim);
  const helmetY=1.61-crouch*.8, helmetZ=-.10+crouch*1.5;
  ellipsoid(0,helmetY,helmetZ,.132,.15,.145,paint);
  ellipsoid(0,helmetY+.005,helmetZ+.107,.118,.062,.055,visor);
  const stripe=ellipsoid(0,helmetY+.137,helmetZ,.025,.016,.10,trim);void stripe;
  for(const side of [-1,1]) {
    const shoulder=[side*.16,1.39-crouch*.6,-.17+crouch];
    const elbow=[side*.26,1.19-crouch*.5,.04+crouch*.5];
    const hand=[side*.29,barY+.025,.38];
    tube(shoulder,elbow,.057,suit);ellipsoid(...elbow as [number,number,number],.059,.06,.06,trim);
    tube(elbow,hand,.045,suit);ellipsoid(...hand as [number,number,number],.046,.04,.055,rubber);
    const hip=[side*.12,hipY,hipZ],knee=[side*.23,.74,.02],foot=[side*.22,.46,-.28];
    tube(hip,knee,.078,suit);ellipsoid(...knee as [number,number,number],.08,.075,.07,trim);tube(knee,foot,.058,suit);
    ellipsoid(side*.22,.44,-.24,.065,.055,.13,rubber);
  }
  // Collapse static parts by material; preserve wheel groups for animation.
  // This keeps the detailed motorcycle at a few dozen draw calls, not hundreds.
  for (const group of [root, ...wheels]) {
    const batches = new Map<THREE.Material, { geometries: THREE.BufferGeometry[]; sources: THREE.Mesh[] }>();
    for (const child of [...group.children]) {
      if (!(child instanceof THREE.Mesh)) continue;
      child.updateMatrix();
      const material = child.material as THREE.Material;
      let batch = batches.get(material);
      if (!batch) { batch = { geometries: [], sources: [] }; batches.set(material, batch); }
      batch.geometries.push(child.geometry.clone().applyMatrix4(child.matrix));
      batch.sources.push(child);
    }
    for (const [material, batch] of batches) {
      const geometry = mergeGeometries(batch.geometries, false);
      if (geometry) {
        const mesh = new THREE.Mesh(geometry, material);mesh.castShadow = true;mesh.receiveShadow = true;group.add(mesh);
        for (const source of batch.sources) { group.remove(source);source.geometry.dispose(); }
      }
      for (const geometry of batch.geometries) geometry.dispose();
    }
  }
  root.userData.name=['Heritage 800','Roadster 650','Cafe Racer 900','Superbike 1000','Track Prototype'][index];
  return root;
}
