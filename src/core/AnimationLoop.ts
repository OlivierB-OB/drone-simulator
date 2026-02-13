import { Viewer3D } from '../3Dviewer/Viewer3D';
import { Drone } from '../drone/Drone';
import { Camera } from '../3Dviewer/Camera';

export class AnimationLoop {
  private animationFrameId: number | null = null;
  private lastFrameTime: number = 0;
  private readonly viewer3D: Viewer3D;
  private readonly drone: Drone;
  private readonly camera: Camera;

  constructor(viewer3D: Viewer3D, drone: Drone, camera: Camera) {
    this.viewer3D = viewer3D;
    this.drone = drone;
    this.camera = camera;
  }

  public start(): void {
    const animate = (currentTime: number) => {
      this.animationFrameId = requestAnimationFrame(animate);

      // Calculate delta time in seconds (0 on first frame)
      const deltaTime =
        this.lastFrameTime === 0
          ? 0
          : (currentTime - this.lastFrameTime) / 1000;
      this.lastFrameTime = currentTime;

      // Update drone physics
      this.drone.applyMove(deltaTime);

      // Update camera position and orientation from drone state
      const droneLocation = this.drone.getLocation();
      const droneElevation = this.drone.getElevation();
      const droneAzimuth = this.drone.getAzimuth();

      // Position camera 5 units above drone
      this.camera.setPosition(
        droneLocation.x,
        droneLocation.y,
        droneElevation + 5
      );

      // Orient camera to look in drone's heading with 30° downward tilt
      this.camera.setOrientation(droneAzimuth);

      // Render scene
      this.viewer3D.render();
    };
    animate(0);
  }

  public dispose(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
}
