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
}
