import { Viewer3D } from '../3Dviewer/Viewer3D';
import { Drone } from '../drone/Drone';
import { Camera } from '../3Dviewer/Camera';
import type { ElevationDataManager } from '../data/elevation/ElevationDataManager';
import type { ContextDataManager } from '../data/contextual/ContextDataManager';
import type { TerrainObjectManager } from '../visualization/terrain/TerrainObjectManager';
import type { DroneObject } from '../visualization/DroneObject';

export class AnimationLoop {
  private animationFrameId: number | null = null;
  private lastFrameTime: number = 0;

  constructor(
    private readonly viewer3D: Viewer3D,
    private readonly drone: Drone,
    private readonly elevationData: ElevationDataManager,
    private readonly contextData: ContextDataManager,
    private readonly camera: Camera,
    private readonly terrainObjectManager: TerrainObjectManager,
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

      const droneLocation = this.drone.getLocation();
      const droneElevation = this.drone.getElevation();
      const droneAzimuth = this.drone.getAzimuth();

      this.elevationData.setLocation(droneLocation);
      this.contextData.setLocation(droneLocation);

      this.terrainObjectManager.refresh();

      // Convert Mercator to Three.js: X=Mercator.X, Y=elevation, Z=-Mercator.Y
      // Mercator Y increases northward; negating gives North = -Z in Three.js
      const threeX = droneLocation.x;
      const threeY = droneElevation;
      const threeZ = -droneLocation.y;

      this.droneObject.update(threeX, threeY, threeZ, droneAzimuth, deltaTime);
      this.camera.updateChaseCamera(threeX, threeY, threeZ, droneAzimuth);

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
