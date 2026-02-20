import { PerspectiveCamera } from 'three';
import { cameraConfig } from '../config';
import type { Drone } from '../drone/Drone';
import { mercatorToThreeJs } from '../gis/types';

export class Camera {
  private readonly object: PerspectiveCamera;
  private boundUpdateFromDroneState = () => this.updateFromDroneState();

  constructor(
    width: number,
    height: number,
    private readonly drone: Drone,
    cameraConstructor: typeof PerspectiveCamera = PerspectiveCamera
  ) {
    this.object = new cameraConstructor(
      cameraConfig.fov,
      width / height,
      cameraConfig.near,
      cameraConfig.far
    );

    // Subscribe to drone state changes
    drone.on('locationChanged', this.boundUpdateFromDroneState);
    drone.on('azimuthChanged', this.boundUpdateFromDroneState);
    drone.on('elevationChanged', this.boundUpdateFromDroneState);
  }

  getObject(): PerspectiveCamera {
    return this.object;
  }

  updateAspectRatio(width: number, height: number): void {
    this.object.aspect = width / height;
    this.object.updateProjectionMatrix();
  }

  setPosition(x: number, y: number, z: number): void {
    this.object.position.set(x, y, z);
  }

  private updateFromDroneState(): void {
    const droneLocation = this.drone.getLocation();
    const droneElevation = this.drone.getElevation();
    const droneAzimuth = this.drone.getAzimuth();

    const threeCoords = mercatorToThreeJs(droneLocation, droneElevation);

    this.updateChaseCamera(
      threeCoords.x,
      threeCoords.y,
      threeCoords.z,
      droneAzimuth
    );
  }

  /**
   * Position and orient the camera as a chase camera behind the drone.
   * Camera is placed behind the drone (opposite its heading) and above it,
   * then oriented to look at the drone position.
   *
   * @param droneX Drone position in Three.js X (= Mercator X)
   * @param droneY Drone position in Three.js Y (= elevation)
   * @param droneZ Drone position in Three.js Z (= -Mercator Y)
   * @param azimuthDegrees Drone heading (0=North, 90=East, clockwise)
   */
  updateChaseCamera(
    droneX: number,
    droneY: number,
    droneZ: number,
    azimuthDegrees: number
  ): void {
    const azimuthRad = (azimuthDegrees * Math.PI) / 180;

    // Drone forward direction in Three.js: (sin(az), 0, -cos(az))
    // "Behind" is the opposite: (-sin(az), 0, cos(az))
    const behindX = droneX - Math.sin(azimuthRad) * cameraConfig.chaseDistance;
    const behindZ = droneZ + Math.cos(azimuthRad) * cameraConfig.chaseDistance;
    const aboveY = droneY + cameraConfig.chaseHeight;

    this.object.position.set(behindX, aboveY, behindZ);
    this.object.lookAt(droneX, droneY, droneZ);
  }

  unsubscribeFromDrone(): void {
    this.drone.off('locationChanged', this.boundUpdateFromDroneState);
    this.drone.off('azimuthChanged', this.boundUpdateFromDroneState);
    this.drone.off('elevationChanged', this.boundUpdateFromDroneState);
  }
}
