/** Arcade open-wheel dynamics in track coordinates. SI units throughout. */
export const BIKES = [
 {name:'Scuderia Rosso',type:'FORMULA / V6 HYBRID',power:950,mass:798,top:94,grip:1.65,lean:1,price:0,redline:15000,color:'#e10600'},
 {name:'Silver Arrow',type:'FORMULA / HIGH DOWNFORCE',power:970,mass:800,top:95,grip:1.75,lean:1,price:0,redline:15000,color:'#27f4d2'},
 {name:'Papaya Racing',type:'FORMULA / BALANCED AERO',power:960,mass:798,top:95,grip:1.72,lean:1,price:0,redline:15000,color:'#ff8700'},
 {name:'Midnight Bull',type:'FORMULA / LOW DRAG',power:990,mass:798,top:98,grip:1.68,lean:1,price:0,redline:15000,color:'#3671c6'},
 {name:'Emerald Works',type:'FORMULA / MECHANICAL GRIP',power:945,mass:800,top:94,grip:1.8,lean:1,price:0,redline:15000,color:'#229971'}
];
export type Controls={throttle:number;brake:number;steer:number};
export type Rider={distance:number;lateral:number;speed:number;lean:number;heading:number;yawRate:number;steering:number;rpm:number;gear:number;crash:number;lap:number;lapTime:number;best:number;checkpoint:number;finished:boolean;finishTime:number};
export function newRider(distance=0,lateral=0):Rider{return {distance,lateral,speed:0,lean:0,heading:0,yawRate:0,steering:0,rpm:4000,gear:1,crash:0,lap:0,lapTime:0,best:Infinity,checkpoint:0,finished:false,finishTime:0}}
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
export function stepRider(r:Rider,input:Controls,carIndex:number,curvature:number,width:number,dt:number,upgrade=0,assist=true,manual=false){
 if(r.finished||!Number.isFinite(dt)||dt<=0)return;
 // Substep callers with a large delta as well as the normal 120 Hz loop.
 if(dt>1/60){const count=Math.ceil(dt*120);for(let i=0;i<count;i++)stepRider(r,input,carIndex,curvature,width,dt/count,upgrade,assist,manual);return}
 const car=BIKES[carIndex];r.lapTime+=dt;r.crash=Math.max(0,r.crash-dt);
 const throttle=clamp(input.throttle,0,1),brake=clamp(input.brake,0,1),steer=clamp(input.steer,-1,1);
 const off=Math.abs(r.lateral)>width/2-.8;
 const grip=car.grip*9.81*(off?.42:1)*(1+Math.min(.7,r.speed*r.speed*.00011));
 const drive=Math.min(13.8,car.power*745.7*.79/(car.mass*Math.max(16,r.speed)))*(1+upgrade*.025);
 const drag=.35+r.speed*r.speed*.00132+(off?5.5:0);
 r.speed=clamp(r.speed+(throttle*drive-brake*Math.min(28,grip*1.1)-drag)*dt,0,car.top);
 // Steering lock falls with speed; actual yaw is limited by available tire force.
 const lock=.42/(1+r.speed*.065);
 r.steering+=(steer*lock-r.steering)*(1-Math.exp(-dt*9));
 const baseline=assist?curvature*r.speed/Math.max(.65,1-curvature*r.lateral):0;
 const desiredYaw=baseline+Math.tan(r.steering)*r.speed/3.55;
 const maxYaw=grip/Math.max(3,r.speed);
 const actual=clamp(desiredYaw,-maxYaw,maxYaw);
 r.yawRate+=(actual-r.yawRate)*(1-Math.exp(-dt*12));
 const forward=r.speed*Math.cos(r.heading)/Math.max(.65,1-curvature*r.lateral);
 r.heading=clamp(r.heading+(r.yawRate-curvature*forward-(assist?r.heading*1.7:0))*dt,-1.2,1.2);
 r.lateral+=r.speed*Math.sin(r.heading)*dt;
 r.distance+=Math.max(0,forward)*dt;
 r.lean=-r.yawRate*r.speed*.0008;
 // Glancing wall contact sheds speed and deflects heading; no frozen crash timer.
 const wall=width/2+1.55;
 if(Math.abs(r.lateral)>wall){const side=Math.sign(r.lateral);r.lateral=side*wall;r.speed*=.78;r.heading=-side*.09;r.yawRate=0;r.crash=.35}
 if(!manual)r.gear=clamp(Math.floor(r.speed/12)+1,1,8);
 const ratios=[0,27,20,16,13.3,11.3,9.9,8.8,7.9];
 r.rpm+=(clamp(4000+r.speed*ratios[r.gear]*13,4000,car.redline)-r.rpm)*(1-Math.exp(-dt*14));
}
export function updateLap(r:Rider,length:number,laps:number,time:number){const checkpoint=Math.floor(Math.max(0,r.distance)/length*16);if(checkpoint>r.checkpoint+1)return false;r.checkpoint=Math.max(r.checkpoint,checkpoint);const lap=Math.floor(Math.max(0,r.distance)/length);if(lap>r.lap){r.best=Math.min(r.best,r.lapTime);r.lapTime=0;r.lap=lap;if(lap>=laps){r.finished=true;r.finishTime=time}return true}return false}
export function recover(r:Rider){r.lateral=0;r.speed=Math.min(r.speed,8);r.crash=0;r.lean=0;r.heading=0;r.yawRate=0;r.steering=0}
export function seeded(seed:number){return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296}}
export type Save={version:1;credits:number;owned:number[];upgrades:number[];records:Record<string,number>;wins:number};
export const freshSave=():Save=>({version:1,credits:0,owned:[0],upgrades:[0,0,0,0,0],records:{},wins:0});
export function readSave():Save {try{const s=JSON.parse(localStorage.getItem('throttle-theory-v1')||'null');if(s?.version===1&&Number.isFinite(s.credits)&&s.credits>=0&&Array.isArray(s.owned)&&s.owned.includes(0)&&s.owned.every((n:unknown)=>Number.isInteger(n)&&Number(n)>=0&&Number(n)<5)&&Array.isArray(s.upgrades)&&s.upgrades.length===5&&s.upgrades.every((n:unknown)=>Number.isInteger(n)&&Number(n)>=0&&Number(n)<=3)&&s.records&&typeof s.records==='object'&&Object.values(s.records).every(n=>typeof n==='number'&&Number.isFinite(n)&&n>0)&&Number.isInteger(s.wins)&&s.wins>=0)return s}catch{}return freshSave()}
export function writeSave(s:Save){try{localStorage.setItem('throttle-theory-v1',JSON.stringify(s));return true}catch{return false}}
/** Finish time decides completed races; progress decides riders still racing. */
export function compareRiders(a:Rider,b:Rider){return a.finished&&b.finished?a.finishTime-b.finishTime:a.finished?-1:b.finished?1:b.distance-a.distance}
