import { Viewer3D } from '../3Dviewer/Viewer3D';
import { Drone } from '../drone/Drone';
import { Camera } from '../3Dviewer/Camera';
import type { ElevationDataManager } from '../data/elevation/ElevationDataManager';
import type { ContextDataManager } from '../data/contextual/ContextDataManager';
import type { TerrainObjectManager } from '../visualization/terrain/TerrainObjectManager';

export class AnimationLoop {
  private animationFrameId: number | null = null;
  private lastFrameTime: number = 0;

  constructor(
    private readonly viewer3D: Viewer3D,
    private readonly drone: Drone,
    private readonly elevationData: ElevationDataManager,
    private readonly contextData: ContextDataManager,
    private readonly camera: Camera,
    private readonly terrainObjectManager: TerrainObjectManager
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

      const droneLocation = this.drone.getLocation();
      const droneElevation = this.drone.getElevation();
      const droneAzimuth = this.drone.getAzimuth();

      this.elevationData.setLocation(droneLocation);
      this.contextData.setLocation(droneLocation);

      this.terrainObjectManager.refresh();

      // Position camera in terrain coordinate space: X=Mercator X, Y=elevation, Z=-Mercator Y
      // Negate Z-coordinate to flip Mercator Y axis (increases southward) to match camera forward direction
      this.camera.setPosition(
        droneLocation.x,
        droneElevation + 5,
        -droneLocation.y
      );

      this.camera.setOrientation(droneAzimuth);

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
