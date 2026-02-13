import { PerspectiveCamera } from 'three';

export class Camera {
  private readonly camera: PerspectiveCamera;

  constructor(
    width: number,
    height: number,
    cameraConstructor: typeof PerspectiveCamera = PerspectiveCamera
  ) {
    this.camera = new cameraConstructor(75, width / height, 0.1, 1000);
    this.camera.position.z = 5;
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

  setOrientation(azimuthDegrees: number): void {
    // Convert azimuth (0° = North) to radians
    // In Three.js, we use Euler angles with YXZ order for intuitive rotation
    // Azimuth is rotation around Y axis (yaw)
    // 30° downward tilt is rotation around X axis (pitch, negative = down)
    // No rotation around Z axis (roll)

    const azimuthRad = (azimuthDegrees * Math.PI) / 180;
    const pitchRad = (-30 * Math.PI) / 180; // -30° for downward tilt

    // Use Euler angles with YXZ order: first yaw (azimuth), then pitch (inclination), then roll (0)
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = azimuthRad;
    this.camera.rotation.x = pitchRad;
    this.camera.rotation.z = 0;
  }
}
