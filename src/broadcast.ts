import {BIKES} from './simulation';
import {TRACKS} from './tracks';
import type {SessionTelemetry, VehicleTelemetry} from './engine/contracts';

const fmt = (n: number | null | undefined) => Number.isFinite(n) ? `${Math.floor((n as number) / 60)}:${((n as number) % 60).toFixed(2).padStart(5, '0')}` : '—';

export function broadcastMarkup(opts: {field: number; trackName: string; mode: string}) {
  return `<div class="hud broadcast">
    <div class="race-top">
      <div class="position-block"><small>POSITION</small><div><b id="position">1 / ${opts.field}</b></div></div>
      <div class="race-timing">
        <div class="lap-block"><small>LAP</small><b id="lap">1 / 3</b></div>
        <div><small>TIME</small><b id="time">0:00.00</b></div>
        <div><small>BEST LAP</small><b id="best">—</b></div>
        <div><small>SECTOR</small><b id="sector">1</b></div>
      </div>
      <div class="session-chips">
        <span id="weather">${opts.trackName}</span>
        <span id="camera-name">CHASE</span>
      </div>
      <button class="pause-button" id="pause" aria-label="Pause race">II</button>
    </div>
    <ol class="leaderboard" id="leaderboard"></ol>
    <canvas class="map" id="map" width="300" height="240" aria-label="Circuit minimap"></canvas>
    <div class="countdown" id="countdown"></div>
    <div class="telemetry">
      <div class="pedal brake-pedal"><span>BRK</span><div><i id="brake-input"></i></div></div>
      <div class="speedo">
        <div class="speed-reading"><b class="gear" id="gear">1</b><strong id="speed">0</strong><span>KM/H</span></div>
        <div class="rpm"><i id="rpm"></i></div>
        <span id="rpmText">4000 RPM</span>
        <span id="transmission" class="transmission-mode">AUTO</span>
        <div class="steering-meter"><i id="steer-input"></i></div>
      </div>
      <div class="pedal throttle-pedal"><span>THR</span><div><i id="throttle-input"></i></div></div>
    </div>
    <div class="race-status"><span id="surface">${opts.trackName} · ${opts.mode}</span></div>
    <div class="race-hint">WASD / ARROWS · DRIVE &nbsp; C · CAMERA &nbsp; B · LOOK BACK &nbsp; LB / RB · GEARS &nbsp; R · RECOVER</div>
    <div class="touch">
      <button data-control="ArrowLeft" aria-label="Steer left">‹</button>
      <button data-control="ArrowRight" aria-label="Steer right">›</button>
      <button data-control="ArrowDown">BRAKE</button>
      <button data-control="ArrowUp">GO</button>
    </div>
  </div>`;
}

export function paintBroadcast(opts: {
  get: (id: string) => HTMLElement;
  telemetry: SessionTelemetry;
  selected: number;
  trackIndex: number;
  mode: string;
  manual: boolean;
  cameraName: string;
  cornerWarning: boolean;
}) {
  const player = opts.telemetry.vehicles[0];
  const laps = opts.mode === 'Time trial' ? 1 : 3;
  opts.get('speed').textContent = String(Math.round(player.speedMps * 3.6));
  opts.get('gear').textContent = player.collisionActive ? '!' : String(player.gear);
  opts.get('lap').textContent = opts.mode === 'Practice' ? 'FREE' : `${Math.min(player.timing.completedLaps + 1, laps)} / ${laps}`;
  opts.get('time').textContent = fmt(opts.telemetry.elapsedS);
  opts.get('best').textContent = fmt(player.timing.bestLapS);
  opts.get('position').textContent = `${player.position} / ${opts.telemetry.vehicles.length}`;
  opts.get('rpm').style.width = `${Math.min(100, player.rpm / BIKES[opts.selected].redline * 100)}%`;
  opts.get('rpmText').textContent = `${Math.round(player.rpm)} RPM`;
  opts.get('transmission').textContent = opts.manual ? 'MANUAL' : 'AUTO';
  opts.get('countdown').textContent = opts.telemetry.countdownS > 0 ? String(Math.ceil(opts.telemetry.countdownS)) : opts.telemetry.elapsedS < 1 ? 'GO' : '';
  opts.get('weather').textContent = opts.telemetry.weather.wetness > .2 ? 'WET' : 'DRY';
  opts.get('camera-name').textContent = opts.cameraName.toUpperCase();
  opts.get('sector').textContent = String(player.timing.sector);
  const lastSector = [...player.timing.sectorsS].reverse().find(v => v != null);
  opts.get('surface').textContent = player.collisionActive ? 'CONTACT · R TO RECOVER'
    : player.surface === 'runoff' ? 'OFF TRACK · LOW GRIP'
    : opts.cornerWarning ? 'BRAKE · CORNER AHEAD'
    : lastSector ? `${TRACKS[opts.trackIndex].name} · S${player.timing.sector} ${lastSector.toFixed(2)}`
    : `${TRACKS[opts.trackIndex].name} · ${opts.mode}`;
  opts.get('throttle-input').style.height = `${player.input.throttle * 100}%`;
  opts.get('brake-input').style.height = `${player.input.brake * 100}%`;
  opts.get('steer-input').style.left = `${50 - Math.max(-1, Math.min(1, player.steeringRad / .2)) * 45}%`;

  const board = opts.get('leaderboard') as HTMLOListElement;
  const order = [...opts.telemetry.vehicles].sort((a, b) => a.position - b.position);
  const leader = order[0];
  board.innerHTML = order.map((vehicle: VehicleTelemetry) => {
    const you = vehicle.id === 0;
    const gap = vehicle.position === 1 ? 'INTERVAL' : leader.timing.finished && vehicle.timing.finished
      ? `+${((vehicle.timing.finishTimeS ?? 0) - (leader.timing.finishTimeS ?? 0)).toFixed(2)}`
      : `+${((leader.progressM - vehicle.progressM) / Math.max(12, leader.speedMps)).toFixed(1)}s`;
    const name = you ? BIKES[opts.selected].name : `DRIVER ${vehicle.id + 1}`;
    return `<li class="${you ? 'you' : ''}"><b>P${vehicle.position}</b><span>${name}</span><i>${gap}</i></li>`;
  }).join('');
}

export {fmt};
