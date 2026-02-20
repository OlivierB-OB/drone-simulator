import { PerspectiveCamera } from 'three';
import { cameraConfig } from '../config';
import type { Drone } from '../drone/Drone';
import { mercatorToThreeJs } from '../gis/types';

export class Camera {
  private readonly camera: PerspectiveCamera;
  private drone: Drone | null = null;
  private boundUpdateFromDroneState: (() => void) | null = null;

  constructor(
    width: number,
    height: number,
    drone: Drone,
    cameraConstructor: typeof PerspectiveCamera = PerspectiveCamera
  ) {
    this.camera = new cameraConstructor(
      cameraConfig.fov,
      width / height,
      cameraConfig.near,
      cameraConfig.far
    );

    this.drone = drone;
    this.boundUpdateFromDroneState = () => this.updateFromDroneState();

    // Subscribe to drone state changes
    drone.on('locationChanged', this.boundUpdateFromDroneState);
    drone.on('azimuthChanged', this.boundUpdateFromDroneState);
    drone.on('elevationChanged', this.boundUpdateFromDroneState);
  }

  getCamera(): PerspectiveCamera {
    return this.camera;
  }

  updateAspectRatio(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  setPosition(x: number, y: number, z: number): void {
    this.camera.position.set(x, y, z);
  }

  private updateFromDroneState(): void {
    if (!this.drone) return;

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

    this.camera.position.set(behindX, aboveY, behindZ);
    this.camera.lookAt(droneX, droneY, droneZ);
  }

  unsubscribeFromDrone(): void {
    if (!this.drone || !this.boundUpdateFromDroneState) return;

    this.drone.off('locationChanged', this.boundUpdateFromDroneState);
    this.drone.off('azimuthChanged', this.boundUpdateFromDroneState);
    this.drone.off('elevationChanged', this.boundUpdateFromDroneState);

    this.drone = null;
    this.boundUpdateFromDroneState = null;
  }
}
