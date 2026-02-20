import { droneConfig } from '../config';
import type { MercatorCoordinates } from '../gis/types';
import { TypedEventEmitter } from '../core/TypedEventEmitter';

export type DroneEvents = {
  locationChanged: MercatorCoordinates;
  azimuthChanged: number;
  elevationChanged: number;
};

export class Drone {
  private isMovingForward: boolean = false;
  private isMovingBackward: boolean = false;
  private isMovingLeft: boolean = false;
  private isMovingRight: boolean = false;
  private readonly emitter = new TypedEventEmitter<DroneEvents>();

  constructor(
    private readonly location: MercatorCoordinates,
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

  getLocation(): MercatorCoordinates {
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

  startMovingForward(): void {
    this.isMovingForward = true;
  }

  startMovingBackward(): void {
    this.isMovingBackward = true;
  }

  startMovingLeft(): void {
    this.isMovingLeft = true;
  }

  startMovingRight(): void {
    this.isMovingRight = true;
  }

  stopMovingForward(): void {
    this.isMovingForward = false;
  }

  stopMovingBackward(): void {
    this.isMovingBackward = false;
  }

  stopMovingLeft(): void {
    this.isMovingLeft = false;
  }

  stopMovingRight(): void {
    this.isMovingRight = false;
  }

  applyMove(deltaTime: number): void {
    // Check if drone is moving in any direction
    const isMoving =
      this.isMovingForward ||
      this.isMovingBackward ||
      this.isMovingLeft ||
      this.isMovingRight;
    if (!isMoving) {
      return;
    }

    // Cancel opposite directions
    const forwardComponent = this.isMovingForward ? 1 : 0;
    const backwardComponent = this.isMovingBackward ? -1 : 0;
    const leftComponent = this.isMovingLeft ? -1 : 0;
    const rightComponent = this.isMovingRight ? 1 : 0;

    const netForward = forwardComponent + backwardComponent;
    const netRight = rightComponent + leftComponent;

    // If all movements cancel out, do nothing
    if (netForward === 0 && netRight === 0) {
      return;
    }

    // Generate movement vector based on azimuth and net movement
    const azimuthRad = (this.azimuth * Math.PI) / 180;
    const speed = droneConfig.movementSpeed;
    const displacement = speed * deltaTime;

    // Forward/backward component (along drone's heading)
    // Mercator Y increases northward: North (azimuth 0) = +Y, East (azimuth 90) = +X
    const forwardVector = {
      x: Math.sin(azimuthRad) * netForward * displacement,
      y: Math.cos(azimuthRad) * netForward * displacement,
    };

    // Left/right component (perpendicular to drone's heading)
    const rightAzimuthRad = azimuthRad + Math.PI / 2;
    const rightVector = {
      x: Math.sin(rightAzimuthRad) * netRight * displacement,
      y: Math.cos(rightAzimuthRad) * netRight * displacement,
    };

    // Apply movement to location
    this.location.x += forwardVector.x + rightVector.x;
    this.location.y += forwardVector.y + rightVector.y;

    this.emitter.emit('locationChanged', this.getLocation());
  }

  /**
   * Convert latitude/longitude to Web Mercator coordinates
   * @param lat Latitude in degrees (-85.051129 to 85.051129)
   * @param lon Longitude in degrees (-180 to 180)
   * @returns Mercator coordinates
   */
  public static latLonToMercator(
    lat: number,
    lon: number
  ): MercatorCoordinates {
    const earthRadius = 6378137; // in meters
    const x = ((lon * Math.PI) / 180) * earthRadius;
    const y = Math.log(Math.tan(((90 + lat) * Math.PI) / 360)) * earthRadius;
    return { x, y };
  }
}

const mercatorCoords = Drone.latLonToMercator(
  droneConfig.initialCoordinates.latitude,
  droneConfig.initialCoordinates.longitude
);

export function createDrone(): Drone {
  return new Drone(mercatorCoords, droneConfig.initialAzimuth);
}
