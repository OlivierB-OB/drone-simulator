import { PerspectiveCamera } from 'three';
import { cameraConfig } from '../config';

export class Camera {
  private readonly camera: PerspectiveCamera;

  constructor(
    width: number,
    height: number,
    cameraConstructor: typeof PerspectiveCamera = PerspectiveCamera
  ) {
    this.camera = new cameraConstructor(
      cameraConfig.fov,
      width / height,
      cameraConfig.near,
      cameraConfig.far
    );
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
}
