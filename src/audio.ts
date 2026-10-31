/** Synthesized open-wheel engine audio. No sampled recordings or network assets. */
export class EngineAudio {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private engineBus: GainNode | null = null;
  private windBus: GainNode | null = null;
  private exhaustFilter: BiquadFilterNode | null = null;
  private intakeFilter: BiquadFilterNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private exhaust: OscillatorNode[] = [];
  private exhaustGains: GainNode[] = [];
  private mechanics: OscillatorNode | null = null;
  private mechanicsGain: GainNode | null = null;
  private intakeGain: GainNode | null = null;
  private shiftGain: GainNode | null = null;
  private sources: AudioScheduledSourceNode[] = [];
  private volume = 0.55;
  private engineVolume = 0.8;
  private windVolume = 0.45;
  private lastGear = 1;
  private shiftUntil = 0;
  private disposed = false;

  /** Call from a pointer/key gesture. It resumes audio without bypassing autoplay rules. */
  async start(): Promise<void> {
    if (this.disposed) return;
    if (this.context) { await this.context.resume(); return; }
    const context = new AudioContext({ latencyHint: 'interactive' });
    this.context = context;
    const master = context.createGain();
    master.gain.value = this.volume;
    this.master = master;
    const limiter = context.createDynamicsCompressor();
    limiter.threshold.value = -15;
    limiter.knee.value = 12;
    limiter.ratio.value = 8;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.14;
    master.connect(limiter).connect(context.destination);
    const engine = context.createGain();
    engine.gain.value = 0;
    engine.connect(master);
    this.engineBus = engine;
    // A short, restrained diffuse reflection keeps the exhaust from sounding dry.
    const reflection = context.createConvolver();
    const impulse = context.createBuffer(2, Math.floor(context.sampleRate * 0.24), context.sampleRate);
    let seed = 17321;
    const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
    for (let channel = 0; channel < 2; channel++) {
      const data = impulse.getChannelData(channel);
      for (let i = 0; i < data.length; i++) data[i] = (random() * 2 - 1) * Math.pow(1 - i / data.length, 3) * 0.4;
    }
    reflection.buffer = impulse;
    const wet = context.createGain(); wet.gain.value = 0.09;
    engine.connect(reflection).connect(wet).connect(master);

    const exhaustFilter = context.createBiquadFilter();
    exhaustFilter.type = 'lowpass'; exhaustFilter.frequency.value = 900; exhaustFilter.Q.value = 0.65;
    this.exhaustFilter = exhaustFilter;
    const saturation = context.createWaveShaper();
    const curve = new Float32Array(4096);
    for (let i = 0; i < curve.length; i++) { const x = i * 2 / (curve.length - 1) - 1; curve[i] = Math.tanh(x * 2.1) / Math.tanh(2.1); }
    saturation.curve = curve; saturation.oversample = '2x';
    exhaustFilter.connect(saturation).connect(engine);
    // Independent pulse banks model combustion orders, not a single speed oscillator.
    for (let bank = 0; bank < 3; bank++) {
      const osc = context.createOscillator();
      const real = new Float32Array(33), imaginary = new Float32Array(33);
      for (let harmonic = 1; harmonic < 33; harmonic++) {
        const envelope = Math.exp(-harmonic / (bank === 0 ? 9 : 5));
        imaginary[harmonic] = envelope / Math.pow(harmonic, 0.7) * (harmonic % 2 ? 1 : 0.65);
        real[harmonic] = Math.sin(harmonic * (bank + 1) * 0.37) * envelope * 0.12;
      }
      osc.setPeriodicWave(context.createPeriodicWave(real, imaginary));
      osc.frequency.value = 24;
      const gain = context.createGain(); gain.gain.value = 0;
      osc.connect(gain).connect(exhaustFilter);
      osc.start(); this.sources.push(osc); this.exhaust.push(osc); this.exhaustGains.push(gain);
    }
    const mechanical = context.createOscillator(); mechanical.type = 'triangle'; mechanical.frequency.value = 100;
    const mechanicalGain = context.createGain(); mechanicalGain.gain.value = 0;
    const mechanicalFilter = context.createBiquadFilter(); mechanicalFilter.type = 'bandpass'; mechanicalFilter.frequency.value = 2200; mechanicalFilter.Q.value = 0.5;
    mechanical.connect(mechanicalGain).connect(mechanicalFilter).connect(engine);
    mechanical.start(); this.sources.push(mechanical); this.mechanics = mechanical; this.mechanicsGain = mechanicalGain;
    // Shared broadband recording is generated locally with deterministic noise.
    const noise = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
    const data = noise.getChannelData(0);
    let previous = 0;
    for (let i = 0; i < data.length; i++) { const white = random() * 2 - 1; previous = previous * 0.45 + white * 0.55; data[i] = previous; }
    const noiseSource = context.createBufferSource(); noiseSource.buffer = noise; noiseSource.loop = true;
    const intakeFilter = context.createBiquadFilter(); intakeFilter.type = 'bandpass'; intakeFilter.frequency.value = 500; intakeFilter.Q.value = 1.1;
    const intakeGain = context.createGain(); intakeGain.gain.value = 0;
    noiseSource.connect(intakeFilter).connect(intakeGain).connect(engine);
    this.intakeFilter = intakeFilter; this.intakeGain = intakeGain;
    const windFilter = context.createBiquadFilter(); windFilter.type = 'lowpass'; windFilter.frequency.value = 650;
    const wind = context.createGain(); wind.gain.value = 0;
    noiseSource.connect(windFilter).connect(wind).connect(master);
    this.windFilter = windFilter; this.windBus = wind;
    const shiftFilter = context.createBiquadFilter(); shiftFilter.type = 'highpass'; shiftFilter.frequency.value = 950;
    const shiftGain = context.createGain(); shiftGain.gain.value = 0;
    noiseSource.connect(shiftFilter).connect(shiftGain).connect(engine);
    this.shiftGain = shiftGain;
    noiseSource.start(); this.sources.push(noiseSource);
    // Short starter rise; subsequent updates smoothly take over idle.
    engine.gain.setTargetAtTime(this.engineVolume * 0.5, context.currentTime, 0.18);
    await context.resume();
  }

  update(rpm: number, throttle: number, speed: number, gear: number, bikeIndex: number): void {
    const context = this.context;
    if (!context || this.disposed) return;
    const now = context.currentTime;
    const index = Math.max(0, Math.min(4, Math.floor(bikeIndex)));
    const profiles = EngineAudio.profiles;
    const profile = profiles[index];
    const active = rpm > 100;
    const revs = Math.max(650, Math.min(16000, rpm));
    const load = Math.max(0, Math.min(1, throttle));
    const motion = Math.max(0, Math.min(1, speed / 90));
    if (gear !== this.lastGear && active) {
      this.shiftUntil = now + 0.095;
      this.shiftGain!.gain.cancelScheduledValues(now);
      this.shiftGain!.gain.setValueAtTime(0.13, now);
      this.shiftGain!.gain.exponentialRampToValueAtTime(0.0001, now + 0.075);
    }
    this.lastGear = gear;
    const cut = now < this.shiftUntil ? 0.25 : 1;
    const firing = revs / 60 * profile.orders;
    // Slight uneven firing gives twins a different pulse from high-RPM fours.
    const flutter = 1 + Math.sin(now * firing * 0.23) * profile.uneven;
    for (let bank = 0; bank < 3; bank++) {
      const ratios = EngineAudio.ratios;
      this.exhaust[bank].frequency.setTargetAtTime(firing * ratios[bank] * flutter, now, 0.035);
      this.exhaust[bank].detune.setTargetAtTime(bank === 1 ? profile.detune : -profile.detune * 0.3, now, 0.1);
      this.exhaustGains[bank].gain.setTargetAtTime(profile.levels[bank] * (0.2 + 0.8 * load) * cut, now, 0.045);
    }
    this.exhaustFilter!.frequency.setTargetAtTime(profile.darkness + revs * profile.brightness + load * 1100, now, 0.06);
    this.intakeFilter!.frequency.setTargetAtTime(250 + revs * 0.12, now, 0.06);
    this.intakeGain!.gain.setTargetAtTime((0.018 + load * 0.12) * Math.min(1, revs / 5000), now, 0.08);
    this.mechanics!.frequency.setTargetAtTime(revs / 60 * 4.03, now, 0.04);
    this.mechanicsGain!.gain.setTargetAtTime(0.025 + revs / 16000 * 0.045, now, 0.06);
    this.engineBus!.gain.setTargetAtTime(active ? this.engineVolume * (0.65 + load * 0.35) : 0, now, active ? 0.08 : 0.2);
    this.windBus!.gain.setTargetAtTime(motion * motion * this.windVolume * 0.55, now, 0.15);
    this.windFilter!.frequency.setTargetAtTime(350 + motion * 1800, now, 0.2);
  }

  setVolume(master: number, engine = this.engineVolume, wind = this.windVolume): void {
    this.volume = Math.max(0, Math.min(1, master));
    this.engineVolume = Math.max(0, Math.min(1, engine));
    this.windVolume = Math.max(0, Math.min(1, wind));
    if (this.context && this.master) this.master.gain.setTargetAtTime(this.volume, this.context.currentTime, 0.04);
  }

  dispose(): void {
    this.disposed = true;
    for (const source of this.sources) { try { source.stop(); source.disconnect(); } catch { /* already stopped */ } }
    this.sources.length = 0;
    void this.context?.close(); this.context = null;
  }

  private static readonly ratios = [1, 0.5, 2];
  private static readonly profiles = [
    { orders: 3, uneven: 0.009, detune: -13, darkness: 180, brightness: 0.055, levels: [0.42, 0.30, 0.06] },
    { orders: 3, uneven: 0.004, detune: 7, darkness: 330, brightness: 0.09, levels: [0.36, 0.15, 0.14] },
    { orders: 3, uneven: 0.007, detune: -9, darkness: 300, brightness: 0.105, levels: [0.38, 0.23, 0.17] },
    { orders: 3, uneven: 0.001, detune: 3, darkness: 500, brightness: 0.14, levels: [0.28, 0.08, 0.21] },
    { orders: 3, uneven: 0.002, detune: 5, darkness: 650, brightness: 0.165, levels: [0.31, 0.09, 0.24] },
  ];
}
