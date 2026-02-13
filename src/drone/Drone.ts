import { droneConfig } from '../config';

export interface MercatorCoordinates {
  x: number;
  y: number;
}

export class Drone {
  private readonly location: MercatorCoordinates;
  private readonly azimuth: number; // in degrees, 0 = North
  private readonly z: number; // altitude in meters, 0 = ground level
  private isMovingForward: boolean = false;
  private isMovingBackward: boolean = false;
  private isMovingLeft: boolean = false;
  private isMovingRight: boolean = false;

  constructor(
    location: MercatorCoordinates,
    azimuth: number = 0,
    z: number = 0
  ) {
    this.location = location;
    this.azimuth = azimuth;
    this.z = z;
  }

  getLocation(): MercatorCoordinates {
    return { ...this.location };
  }

  getAzimuth(): number {
    return this.azimuth;
  }

  getZ(): number {
    return this.z;
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
  return new Drone(mercatorCoords, 0); // azimuth 0 = North
}
