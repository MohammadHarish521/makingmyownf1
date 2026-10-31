export const BIKES = [
 {name:'Heritage 800',type:'PARALLEL TWIN · 800 CC',power:56,mass:224,top:55,grip:1.05,lean:0.72,price:0,redline:8000,color:'#d6a86c'},
 {name:'Roadster 650',type:'STREET TWIN · 650 CC',power:72,mass:188,top:61,grip:1.18,lean:1.05,price:1800,redline:10000,color:'#65c8bb'},
 {name:'Cafe Racer 900',type:'PERFORMANCE TWIN · 900 CC',power:94,mass:201,top:67,grip:1.22,lean:0.9,price:3200,redline:10500,color:'#b25040'},
 {name:'Superbike 1000',type:'INLINE FOUR · 1000 CC',power:156,mass:196,top:83,grip:1.4,lean:1.12,price:5500,redline:14000,color:'#d4e0ef'},
 {name:'Track Prototype',type:'RACE V4 · 1100 CC',power:195,mass:174,top:92,grip:1.6,lean:1.25,price:9000,redline:15500,color:'#e6fa7a'}
];
export type Controls={throttle:number;brake:number;steer:number};
export type Rider={distance:number;lateral:number;speed:number;lean:number;rpm:number;gear:number;crash:number;lap:number;lapTime:number;best:number;checkpoint:number;finished:boolean;finishTime:number};
export function newRider(distance=0,lateral=0):Rider{return {distance,lateral,speed:0,lean:0,rpm:1200,gear:1,crash:0,lap:0,lapTime:0,best:Infinity,checkpoint:0,finished:false,finishTime:0}}
export function stepRider(r:Rider,input:Controls,bikeIndex:number,curvature:number,width:number,dt:number,upgrade=0,assist=true,manual=false){
 const b=BIKES[bikeIndex];if(r.finished)return;r.lapTime+=dt;if(r.crash>0){r.crash=Math.max(0,r.crash-dt);r.speed*=Math.exp(-dt*3);r.lean*=Math.exp(-dt*4);return}
 const ratio=[0,12,8.7,6.8,5.5,4.7,4.1][r.gear]*(1+bikeIndex*.055);const wheelRpm=r.speed/2.05*60;const target=Math.max(1200,wheelRpm*ratio);r.rpm+=(target-r.rpm)*Math.min(1,dt*12);
 if(!manual){if(r.rpm>b.redline*.86&&r.gear<6){r.gear++;r.rpm*=.75}if(r.rpm<3000&&r.gear>1)r.gear--}
 const band=Math.max(.35,Math.sin(Math.min(1,r.rpm/b.redline)*Math.PI*.78));const traction=Math.abs(r.lateral)>width/2 ? .48:1;
 const drive=input.throttle*(b.power*650/(b.mass+75))*band*(1+upgrade*.07)/Math.max(5,r.speed);
 r.speed=Math.max(0,Math.min(b.top*(1+upgrade*.025),r.speed+(drive-input.brake*12.5-.35-r.speed*r.speed*.00065-(input.throttle<.1?1.3:0)-(traction<1?5:0))*dt));
 // Countersteering response is filtered; road-following assist supplies the baseline lean.
 const baseline=Math.atan(curvature*r.speed*r.speed/9.81);const desired=Math.max(-1.05,Math.min(1.05,(assist?baseline*.7:0)+input.steer*.8));r.lean+=(desired-r.lean)*Math.min(1,dt*(3+b.lean*3));
 const grip=b.grip*traction;const lateralForce=curvature*r.speed*r.speed;
 const drift=Math.max(0,Math.abs(lateralForce)-9.81*grip)*(curvature>0?-1:1)*.07;
 r.lateral+=(input.steer*(1.8+r.speed*.10)*b.lean+drift)*dt;
 if(Math.abs(r.lateral)>width/2+2.1){r.crash=1.1;r.speed*=.35;r.lateral=Math.sign(r.lateral)*(width/2+1.8)}
 r.distance+=r.speed*dt;
}
export function updateLap(r:Rider,length:number,laps:number,time:number){const checkpoint=Math.floor(Math.max(0,r.distance)/length*16);if(checkpoint>r.checkpoint+1)return false;r.checkpoint=Math.max(r.checkpoint,checkpoint);const lap=Math.floor(Math.max(0,r.distance)/length);if(lap>r.lap){r.best=Math.min(r.best,r.lapTime);r.lapTime=0;r.lap=lap;if(lap>=laps){r.finished=true;r.finishTime=time}return true}return false}
export function recover(r:Rider){r.lateral=0;r.speed=Math.min(r.speed,8);r.crash=0;r.lean=0}
export function seeded(seed:number){return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296}}
export type Save={version:1;credits:number;owned:number[];upgrades:number[];records:Record<string,number>;wins:number};
export const freshSave=():Save=>({version:1,credits:0,owned:[0],upgrades:[0,0,0,0,0],records:{},wins:0});
export function readSave():Save {try{const s=JSON.parse(localStorage.getItem('throttle-theory-v1')||'null');if(s?.version===1&&Number.isFinite(s.credits)&&s.credits>=0&&Array.isArray(s.owned)&&s.owned.includes(0)&&s.owned.every((n:unknown)=>Number.isInteger(n)&&Number(n)>=0&&Number(n)<5)&&Array.isArray(s.upgrades)&&s.upgrades.length===5&&s.upgrades.every((n:unknown)=>Number.isInteger(n)&&Number(n)>=0&&Number(n)<=3)&&s.records&&typeof s.records==='object'&&Object.values(s.records).every(n=>typeof n==='number'&&Number.isFinite(n)&&n>0)&&Number.isInteger(s.wins)&&s.wins>=0)return s}catch{}return freshSave()}
export function writeSave(s:Save){try{localStorage.setItem('throttle-theory-v1',JSON.stringify(s));return true}catch{return false}}
/** Finish time decides completed races; progress decides riders still racing. */
export function compareRiders(a:Rider,b:Rider){return a.finished&&b.finished?a.finishTime-b.finishTime:a.finished?-1:b.finished?1:b.distance-a.distance}
