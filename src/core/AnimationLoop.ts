import { Viewer3D } from '../3Dviewer/Viewer3D';
import { Drone } from '../drone/Drone';
import { Camera } from '../3Dviewer/Camera';
import type { DroneObject } from '../visualization/drone/DroneObject';

export class AnimationLoop {
  private animationFrameId: number | null = null;
  private lastFrameTime: number = 0;

  constructor(
    private readonly viewer3D: Viewer3D,
    private readonly drone: Drone,
    private readonly camera: Camera,
    private readonly droneObject: DroneObject
  ) {}

  public start(): void {
    const animate = (currentTime: number) => {
      this.animationFrameId = requestAnimationFrame(animate);

      // Calculate delta time in seconds (0 on first frame)
      const deltaTime =
        this.lastFrameTime === 0
          ? 0
          : (currentTime - this.lastFrameTime) / 1000;
      this.lastFrameTime = currentTime;

      this.drone.applyMove(deltaTime);

      // DroneObject updates itself via Drone event subscriptions
      this.droneObject.animateRotors();

      // Camera updates itself via Drone event subscriptions
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
