import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import {BIKES,type Rider,type Controls} from './simulation';
import type {TrackWorld} from './tracks';
const clamp=THREE.MathUtils.clamp;
const wrap=(value:number,length:number)=>((value%length)+length)%length;
export class VehiclePhysics {
 readonly world=new CANNON.World({gravity:new CANNON.Vec3(0,-9.81,0)});
 readonly vehicles:CANNON.RaycastVehicle[]=[];readonly chassisOffset=.4;
 private samples:THREE.Vector3[];
 private wrapped:number[]=[];
 private closest:number[]=[];
 private previous:{position:CANNON.Vec3;quaternion:CANNON.Quaternion}[]=[];
 private forward=new CANNON.Vec3();
 private force=new CANNON.Vec3();
 private appliedInputs:Controls[]=[];
 private recovered:boolean[]=[];
 constructor(readonly track:TrackWorld,readonly riders:Rider[],readonly carIndices:number[],readonly wet=false){
  this.world.broadphase=new CANNON.SAPBroadphase(this.world);(this.world.solver as CANNON.GSSolver).iterations=8;
  this.world.defaultContactMaterial.friction=.15;this.world.defaultContactMaterial.restitution=.04;
  this.samples=Array.from({length:1024},(_,i)=>track.curve.getPointAt(i/1024));
  const ground=new CANNON.Body({mass:0,shape:new CANNON.Plane()});ground.quaternion.setFromEuler(-Math.PI/2,0,0);ground.updateAABB();this.world.addBody(ground);
  const wallShape=new CANNON.Box(new CANNON.Vec3(.12,.55,4.7));const sections=Math.ceil(track.length/9);
  for(let i=0;i<sections;i++)for(const side of [-1,1]){
   const p=track.curve.getPointAt(i/sections),t=track.curve.getTangentAt(i/sections);
   const body=new CANNON.Body({mass:0,shape:wallShape,position:new CANNON.Vec3(p.x+t.z*8.6*side,.55,p.z-t.x*8.6*side)});body.quaternion.setFromEuler(0,Math.atan2(t.x,t.z),0);body.updateAABB();this.world.addBody(body);
  }
  riders.forEach((r,index)=>{
   const car=BIKES[carIndices[index]];const body=new CANNON.Body({mass:car.mass,shape:new CANNON.Box(new CANNON.Vec3(.83,.18,2.28)),linearDamping:.015,angularDamping:.55});
   body.angularFactor.set(.35,1,.35);
   const vehicle=new CANNON.RaycastVehicle({chassisBody:body,indexRightAxis:0,indexUpAxis:1,indexForwardAxis:2});
   for(const z of [1.7,-1.7])for(const x of [-.82,.82])vehicle.addWheel({radius:.36,directionLocal:new CANNON.Vec3(0,-1,0),axleLocal:new CANNON.Vec3(-1,0,0),chassisConnectionPointLocal:new CANNON.Vec3(x,.2,z),suspensionRestLength:.3,suspensionStiffness:42,dampingRelaxation:3.6,dampingCompression:5.2,maxSuspensionForce:24000,maxSuspensionTravel:.18,frictionSlip:car.grip,rollInfluence:.015,customSlidingRotationalSpeed:-30,useCustomSlidingRotationalSpeed:true});
   vehicle.addToWorld(this.world);this.vehicles.push(vehicle);this.previous.push({position:new CANNON.Vec3(),quaternion:new CANNON.Quaternion()});
   this.wrapped[index]=wrap(r.distance,track.length);this.closest[index]=Math.floor(this.wrapped[index]/track.length*1024);
   this.place(index,r.distance,r.lateral,0);
   body.addEventListener('collide',(event:{contact:CANNON.ContactEquation})=>{if(Math.abs(event.contact.getImpactVelocityAlongNormal())>3)r.crash=.35});
  });
 }
 place(index:number,distance:number,lateral=0,speed=0){
  const vehicle=this.vehicles[index],body=vehicle.chassisBody,r=this.riders[index];
  const u=wrap(distance,this.track.length)/this.track.length,p=this.track.curve.getPointAt(u),t=this.track.curve.getTangentAt(u);
  body.position.set(p.x+t.z*lateral,.45,p.z-t.x*lateral);body.quaternion.setFromEuler(0,Math.atan2(t.x,t.z),0);body.velocity.set(t.x*speed,0,t.z*speed);body.angularVelocity.setZero();body.force.setZero();body.torque.setZero();body.aabbNeedsUpdate=true;body.wakeUp();
  r.distance=distance;r.lateral=lateral;r.speed=speed;r.heading=0;r.steering=0;r.crash=0;
  this.wrapped[index]=u*this.track.length;this.closest[index]=Math.floor(u*1024);this.previous[index].position.copy(body.position);this.previous[index].quaternion.copy(body.quaternion);
  for(let w=0;w<4;w++)vehicle.updateWheelTransform(w);
 }
 recover(index:number){const r=this.riders[index];this.place(index,r.distance,0,Math.min(r.speed,8));this.recovered[index]=true}
 consumeRecovery(index:number){const recovered=!!this.recovered[index];this.recovered[index]=false;return recovered}
 input(index:number):Controls{return {...(this.appliedInputs[index]??{throttle:0,brake:0,steer:0})}}
 control(index:number,input:Controls,dt:number,upgrade=0,assist=true,manual=false){
  const vehicle=this.vehicles[index],body=vehicle.chassisBody,r=this.riders[index],car=BIKES[this.carIndices[index]];
  body.vectorToWorldFrame(new CANNON.Vec3(0,0,1),this.forward);const speed=body.velocity.dot(this.forward),magnitude=body.velocity.length();
  const off=Math.abs(r.lateral)>this.track.width/2-.6;
  const u=wrap(r.distance,this.track.length)/this.track.length,t=this.track.curve.getTangentAt(u),ahead=this.track.curve.getTangentAt(wrap(r.distance+3,this.track.length)/this.track.length);
  const curvature=Math.atan2(t.z*ahead.x-t.x*ahead.z,t.dot(ahead))/3;
  const lock=.65/(1+magnitude*.045);
  const desired=clamp(input.steer,-1,1)*lock+(assist?Math.atan(curvature*3.4)-r.heading*.25:0);
  r.steering+=(clamp(desired,-.48,.48)-r.steering)*(1-Math.exp(-dt*10));
  for(let w=0;w<2;w++)vehicle.setSteeringValue(r.steering,w);
  if(!manual)r.gear=clamp(Math.floor(Math.abs(speed)/12)+1,1,8);
  const throttle=r.finished?0:clamp(input.throttle,0,1),brake=r.finished?1:clamp(input.brake,0,1);
  this.appliedInputs[index]={throttle,brake,steer:clamp(input.steer,-1,1)};
  let drive=Math.min(11000,car.power*745.7*.78/Math.max(16,Math.abs(speed)))*(1+upgrade*.025)*throttle;
  if(speed>car.top||manual&&speed>r.gear*12+16)drive=0;
  if(assist&&vehicle.wheelInfos.slice(2).some(w=>w.skidInfo<.65))drive*=.65;
  for(let w=0;w<4;w++){
   vehicle.wheelInfos[w].frictionSlip=car.grip*(this.wet?.83:1)*(off?.32:1);
   vehicle.applyEngineForce(w>1?-drive/2:0,w);
   // Cannon's brake setting is a per-step impulse, so it must scale with dt.
   const abs=vehicle.wheelInfos[w].skidInfo<.8?.55:1;vehicle.setBrake(brake*abs*car.mass*23*dt*(w<2?.34:.16),w);
  }
  // Stability control applies a bounded yaw torque, never a heading teleport.
  const maxYaw=car.grip*9.81*(1+Math.min(1.5,magnitude*magnitude*.0015/9.81))/Math.max(5,magnitude);
  const yawTarget=clamp(speed*Math.tan(r.steering)/3.4,-maxYaw,maxYaw);
  if(magnitude>2)body.torque.y+=(yawTarget-body.angularVelocity.y)*car.mass*8;
  const drag=.63*magnitude*magnitude+car.mass*(off?1.4:.28);
  if(magnitude>.05){body.velocity.scale(-drag/magnitude,this.force);body.applyForce(this.force)}
  // Speed-dependent aero load feeds the physical wheel suspension and tire limits.
  body.applyForce(new CANNON.Vec3(0,-car.mass*Math.min(18,magnitude*magnitude*.0015),0));
 }
 autopilot(index:number,wanted:number,lane:number,dt:number){
  const r=this.riders[index],body=this.vehicles[index].chassisBody;
  const lookahead=6+r.speed*.28;
  const u=wrap(r.distance+lookahead,this.track.length)/this.track.length,target=this.track.curve.getPointAt(u),t=this.track.curve.getTangentAt(u);
  target.x+=t.z*lane;target.z-=t.x*lane;
  body.vectorToWorldFrame(new CANNON.Vec3(0,0,1),this.forward);
  let error=Math.atan2(target.x-body.position.x,target.z-body.position.z)-Math.atan2(this.forward.x,this.forward.z);error=Math.atan2(Math.sin(error),Math.cos(error));
  const wheelAngle=Math.atan2(2*3.4*Math.sin(error),lookahead),lock=.65/(1+r.speed*.045);
  const targetSpeed=Math.min(wanted,Math.abs(r.lateral)>5?16:100,Math.abs(error)>.5?15/Math.abs(error):100);
  this.control(index,{throttle:r.speed<targetSpeed?1:0,brake:r.speed>targetSpeed+1?1:0,steer:clamp(wheelAngle/lock,-1,1)},dt,0,false);
 }
 step(dt:number){
  this.vehicles.forEach((v,i)=>{this.previous[i].position.copy(v.chassisBody.position);this.previous[i].quaternion.copy(v.chassisBody.quaternion)});
  this.world.step(dt);
  this.vehicles.forEach((vehicle,index)=>{
   const body=vehicle.chassisBody,r=this.riders[index];let best=Infinity,bestIndex=this.closest[index],bestT=0,bestX=0,bestZ=0;
   for(let offset=-18;offset<=18;offset++){
    const i=wrap(this.closest[index]+offset,1024),a=this.samples[i],b=this.samples[(i+1)%1024];const dx=b.x-a.x,dz=b.z-a.z;
    const t=clamp(((body.position.x-a.x)*dx+(body.position.z-a.z)*dz)/(dx*dx+dz*dz),0,1);const x=a.x+dx*t,z=a.z+dz*t;
    const d=(body.position.x-x)**2+(body.position.z-z)**2;if(d<best){best=d;bestIndex=i;bestT=t;bestX=x;bestZ=z}
   }
   this.closest[index]=bestIndex;const wrapped=(bestIndex+bestT)/1024*this.track.length;
   let progress=wrapped-this.wrapped[index];if(progress>this.track.length/2)progress-=this.track.length;if(progress<-this.track.length/2)progress+=this.track.length;
   r.distance+=progress;this.wrapped[index]=wrapped;
   const t=this.track.curve.getTangentAt(wrapped/this.track.length);r.lateral=(body.position.x-bestX)*t.z-(body.position.z-bestZ)*t.x;
   body.vectorToWorldFrame(new CANNON.Vec3(0,0,1),this.forward);r.heading=Math.atan2(t.z*this.forward.x-t.x*this.forward.z,t.x*this.forward.x+t.z*this.forward.z);
   r.speed=Math.max(0,body.velocity.dot(this.forward));r.yawRate=body.angularVelocity.y;r.crash=Math.max(0,r.crash-dt);
   r.rpm+=(clamp(4500+(r.speed-(r.gear-1)*12)*710,4500,15000)-r.rpm)*(1-Math.exp(-dt*12));
   if(!r.finished&&(body.position.y<-.5||Math.abs(r.lateral)>35))this.recover(index);
   for(let w=0;w<4;w++)vehicle.updateWheelTransform(w);
  });
 }
 pose(index:number,alpha:number){
  alpha=clamp(alpha,0,1);
  const body=this.vehicles[index].chassisBody,prev=this.previous[index];const position=new CANNON.Vec3(),quaternion=new CANNON.Quaternion();prev.position.lerp(body.position,alpha,position);prev.quaternion.slerp(body.quaternion,alpha,quaternion);
  return {position,quaternion};
 }
 dispose(){for(const vehicle of this.vehicles)vehicle.removeFromWorld(this.world);for(const body of [...this.world.bodies])this.world.removeBody(body)}
}
