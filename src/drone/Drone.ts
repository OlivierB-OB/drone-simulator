import { droneConfig } from '../config';
import type { GeoCoordinates } from '../gis/GeoCoordinates';
import { EARTH_RADIUS } from '../gis/GeoCoordinates';
import { TypedEventEmitter } from '../core/TypedEventEmitter';

const TO_RAD = Math.PI / 180;

export type DroneEvents = {
  locationChanged: GeoCoordinates;
  azimuthChanged: number;
  elevationChanged: number;
  movingChanged: boolean;
};

export class Drone {
  private isMovingForward: boolean = false;
  private isMovingBackward: boolean = false;
  private isMovingLeft: boolean = false;
  private isMovingRight: boolean = false;
  private readonly emitter = new TypedEventEmitter<DroneEvents>();

  constructor(
    private readonly location: GeoCoordinates,
    private azimuth: number = 0,
    private elevation: number = 0
  ) {}

  on<K extends keyof DroneEvents>(
    event: K,
    handler: (data: DroneEvents[K]) => void
  ): void {
    this.emitter.on(event, handler);
  }

  off<K extends keyof DroneEvents>(
    event: K,
    handler: (data: DroneEvents[K]) => void
  ): void {
    this.emitter.off(event, handler);
  }

  removeAllListeners(): void {
    this.emitter.removeAllListeners();
  }

  dispose(): void {
    this.removeAllListeners();
  }

  getLocation(): GeoCoordinates {
    return { ...this.location };
  }

  getAzimuth(): number {
    return this.azimuth;
  }

  rotateAzimuth(deltaDegrees: number): void {
    this.azimuth = (((this.azimuth + deltaDegrees) % 360) + 360) % 360;
    this.emitter.emit('azimuthChanged', this.azimuth);
  }

  getElevation(): number {
    return this.elevation;
  }

  changeElevation(deltaMeters: number): void {
    this.elevation = Math.max(
      droneConfig.elevationMinimum,
      Math.min(droneConfig.elevationMaximum, this.elevation + deltaMeters)
    );
    this.emitter.emit('elevationChanged', this.elevation);
  }

  public isMoving(): boolean {
    return (
      this.isMovingForward ||
      this.isMovingBackward ||
      this.isMovingLeft ||
      this.isMovingRight
    );
  }

  startMovingForward(): void {
    if (this.isMoving()) {
      this.isMovingForward = true;
      return;
    }
    this.isMovingForward = true;
    this.emitter.emit('movingChanged', true);
  }

  startMovingBackward(): void {
    if (this.isMoving()) {
      this.isMovingBackward = true;
      return;
    }
    this.isMovingBackward = true;
    this.emitter.emit('movingChanged', true);
  }

  startMovingLeft(): void {
    if (this.isMoving()) {
      this.isMovingLeft = true;
      return;
    }
    this.isMovingLeft = true;
    this.emitter.emit('movingChanged', true);
  }

  startMovingRight(): void {
    if (this.isMoving()) {
      this.isMovingRight = true;
      return;
    }
    this.isMovingRight = true;
    this.emitter.emit('movingChanged', true);
  }

  stopMovingForward(): void {
    this.isMovingForward = false;
    if (!this.isMoving()) this.emitter.emit('movingChanged', false);
  }

  stopMovingBackward(): void {
    this.isMovingBackward = false;
    if (!this.isMoving()) this.emitter.emit('movingChanged', false);
  }

  stopMovingLeft(): void {
    this.isMovingLeft = false;
    if (!this.isMoving()) this.emitter.emit('movingChanged', false);
  }

  stopMovingRight(): void {
    this.isMovingRight = false;
    if (!this.isMoving()) this.emitter.emit('movingChanged', false);
  }

  teleport(geo: GeoCoordinates): void {
    this.location.lat = geo.lat;
    this.location.lng = geo.lng;
    this.emitter.emit('locationChanged', this.getLocation());
  }

  applyMove(deltaTime: number): void {
    if (!this.isMoving()) {
      return;
    }

    // Cancel opposite directions
    const forwardComponent = this.isMovingForward ? 1 : 0;
    const backwardComponent = this.isMovingBackward ? -1 : 0;
    const leftComponent = this.isMovingLeft ? -1 : 0;
    const rightComponent = this.isMovingRight ? 1 : 0;

    const netForward = forwardComponent + backwardComponent;
    const netRight = rightComponent + leftComponent;

    if (netForward === 0 && netRight === 0) {
      return;
    }

    const azimuthRad = this.azimuth * TO_RAD;
    const displacement = droneConfig.movementSpeed * deltaTime; // meters

    // Forward direction: azimuth 0 = North (+lat), azimuth 90 = East (+lng)
    const rightAzimuthRad = azimuthRad + Math.PI / 2;

    // Combined displacement in meters
    const dNorth =
      (Math.cos(azimuthRad) * netForward +
        Math.cos(rightAzimuthRad) * netRight) *
      displacement;
    const dEast =
      (Math.sin(azimuthRad) * netForward +
        Math.sin(rightAzimuthRad) * netRight) *
      displacement;

    // Convert meters to degree deltas
    this.location.lat += dNorth / EARTH_RADIUS / TO_RAD;
    this.location.lng +=
      dEast / (EARTH_RADIUS * Math.cos(this.location.lat * TO_RAD)) / TO_RAD;

    this.emitter.emit('locationChanged', this.getLocation());
  }
}

export function createDrone(): Drone {
  return new Drone(
    {
      lat: droneConfig.initialCoordinates.latitude,
      lng: droneConfig.initialCoordinates.longitude,
    },
    droneConfig.initialAzimuth
  );
}
