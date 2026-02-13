import { Viewer3D } from '../3Dviewer/Viewer3D';
import { Drone } from '../drone/Drone';

export class AnimationLoop {
  private animationFrameId: number | null = null;
  private lastFrameTime: number = 0;
  private readonly viewer3D: Viewer3D;
  private readonly drone: Drone;

  constructor(viewer3D: Viewer3D, drone: Drone) {
    this.viewer3D = viewer3D;
    this.drone = drone;
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
