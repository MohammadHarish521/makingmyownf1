import type {Controls} from './simulation';
export type DrivingPad=Pick<Gamepad,'connected'|'axes'|'buttons'>;
const clamp=(value:number)=>Number.isFinite(value)?Math.max(-1,Math.min(1,value)):0;
/** Standard gamepad bumpers: LB (4) down, RB (5) up. Held buttons never repeat. */
export class GamepadGearShifter {
 private down=false;private up=false;
 sample(pads:readonly (DrivingPad|null)[]): -1|0|1 {
  const pad=pads.find(p=>p?.connected);
  const pressed=(index:number)=>!!pad?.buttons[index]?.pressed||(pad?.buttons[index]?.value??0)>.5;
  const down=pressed(4),up=pressed(5);
  const shift=down&&up?0:up&&!this.up?1:down&&!this.down?-1:0;
  this.down=down;this.up=up;return shift;
 }
}
export function readDrivingControls(keys:ReadonlySet<string>,pads:readonly (DrivingPad|null)[]):Controls {
 const pad=pads.find(p=>p?.connected);
 const axis=clamp(pad?.axes[0]??0);
 const deadzone=.12;
 const stick=Math.abs(axis)>deadzone?Math.sign(axis)*(Math.abs(axis)-deadzone)/(1-deadzone):0;
 const left=keys.has('KeyA')||keys.has('ArrowLeft');
 const right=keys.has('KeyD')||keys.has('ArrowRight');
 const requestedSteer=left||right?Number(right)-Number(left):stick;
 const trigger=(index:number)=>Math.max(0,clamp(pad?.buttons[index]?.value??0));
 return {
  throttle:keys.has('KeyW')||keys.has('ArrowUp')?1:trigger(7),
  brake:keys.has('KeyS')||keys.has('ArrowDown')?1:trigger(6),
  // The car points along +Z. Positive Cannon yaw is LEFT from its chase camera;
  // browser gamepad +X, D, and the right touch button all request RIGHT.
  steer:requestedSteer===0?0:-requestedSteer,
 };
}
