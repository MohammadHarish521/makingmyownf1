/** Presentation boundary v1. SI units; unavailable systems are explicitly null. */
export type Vec3 = Readonly<{ x: number; y: number; z: number }>;
export type Quaternion = Readonly<{ x: number; y: number; z: number; w: number }>;
export interface Transform { readonly position: Vec3; readonly quaternion: Quaternion }
export interface DriverInput { readonly throttle: number; readonly brake: number; readonly steer: number }
export interface DriverAssists { readonly steering: boolean; readonly automaticTransmission: boolean }
export type SessionMode = 'practice' | 'time-trial' | 'race';
export type SessionPhase = 'countdown' | 'running' | 'paused' | 'finished' | 'disposed';
export type SurfaceType = 'asphalt' | 'runoff';
export type WheelId = 'front-positive-x' | 'front-negative-x' | 'rear-positive-x' | 'rear-negative-x';
export interface WheelTelemetry {
  readonly id: WheelId;
  readonly transform: Transform;
  readonly rotationRad: number;
  readonly steeringRad: number;
  readonly suspensionLengthM: number;
  readonly suspensionForceN: number;
  readonly inContact: boolean;
  /** Cannon impulse saturation indicator; NOT a physical slip ratio. */
  readonly gripUtilization: number;
  readonly slipRatio: number | null;
  readonly slipAngleRad: number | null;
}
export interface WeatherState {
  readonly model: 'static-surface';
  readonly wetness: number;
  readonly gripMultiplier: number;
  readonly rainIntensity: number | null;
  readonly ambientTemperatureC: number | null;
  readonly trackTemperatureC: number | null;
}
export interface TimingTelemetry {
  readonly completedLaps: number;
  readonly lapTimeS: number;
  readonly bestLapS: number | null;
  readonly lastLapS: number | null;
  readonly valid: boolean;
  readonly nextCheckpoint: number;
  readonly sector: number;
  readonly sectorsS: readonly (number | null)[];
  readonly finished: boolean;
  readonly finishTimeS: number | null;
}
export interface VehicleTelemetry {
  readonly id: number;
  readonly transform: Transform;
  readonly velocityMps: Vec3;
  readonly angularVelocityRadps: Vec3;
  readonly speedMps: number;
  readonly gear: number;
  readonly rpm: number;
  readonly input: DriverInput;
  readonly steeringRad: number;
  readonly progressM: number;
  readonly lateralM: number;
  readonly headingErrorRad: number;
  readonly surface: SurfaceType;
  readonly collisionActive: boolean;
  readonly wheels: readonly WheelTelemetry[];
  readonly timing: TimingTelemetry;
  readonly position: number;
  /** Actual current chassis frame; presentation may offset it for each camera. */
  readonly cameraAnchor: Transform;
  readonly audio: { readonly rpm: number; readonly throttle: number; readonly brake: number; readonly gear: number; readonly speedMps: number };
  readonly drs: null;
  readonly energy: null;
  readonly tires: null;
  readonly damage: null;
}
export interface TrackFrame {
  readonly progressM: number;
  readonly position: Vec3;
  readonly tangent: Vec3;
  /** Positive lateral = (tangent.z, 0, -tangent.x). */
  readonly lateralNormal: Vec3;
  readonly curvaturePerM: number;
  readonly widthM: number;
  readonly elevationM: number;
  readonly bankingRad: number;
}
export interface TrackData {
  readonly id: string;
  readonly lengthM: number;
  readonly widthM: number;
  readonly barrierOffsetM: number;
  readonly checkpointsM: readonly number[];
  readonly sectorGateIndices: readonly number[];
  sample(progressM: number): TrackFrame;
  // Reserved extension points; an empty array means no supported feature yet.
  readonly pitLane: readonly TrackFrame[];
  readonly drsZones: readonly { readonly startM: number; readonly endM: number }[];
}
export type RaceEvent =
  | { readonly type: 'session-started'; readonly timeS: number }
  | { readonly type: 'lap-completed'; readonly vehicleId: number; readonly timeS: number; readonly lap: number; readonly durationS: number; readonly valid: boolean }
  | { readonly type: 'sector-completed'; readonly vehicleId: number; readonly timeS: number; readonly sector: number; readonly durationS: number }
  | { readonly type: 'lap-invalidated'; readonly vehicleId: number; readonly timeS: number; readonly reason: 'track-limits' | 'discontinuity' | 'recovery' }
  | { readonly type: 'vehicle-finished'; readonly vehicleId: number; readonly timeS: number }
  | { readonly type: 'vehicle-recovered'; readonly vehicleId: number; readonly timeS: number };
export interface SessionTelemetry {
  readonly version: 1;
  readonly phase: SessionPhase;
  readonly mode: SessionMode;
  readonly tick: number;
  readonly elapsedS: number;
  readonly countdownS: number;
  readonly fixedDtS: number;
  readonly interpolationAlpha: number;
  readonly droppedTimeS: number;
  readonly lastPhysicsCostMs: number;
  readonly weather: WeatherState;
  readonly vehicles: readonly VehicleTelemetry[];
}
