import { onMount } from 'solid-js';
import { Viewer3D } from './3Dviewer/Viewer3D';
import { DroneController } from './drone/DroneController';
import { createDrone, Drone } from './drone/Drone';
import { AnimationLoop } from './core/AnimationLoop';
import { ContextDataManager } from './data/contextual/ContextDataManager';
import { ElevationDataManager } from './data/elevation/ElevationDataManager';
import { ElevationTilePersistenceCache } from './data/elevation/ElevationTilePersistenceCache';
import { ContextTilePersistenceCache } from './data/contextual/ContextTilePersistenceCache';
import { TerrainGeometryObjectManager } from './visualization/terrain/geometry/TerrainGeometryObjectManager';
import { TerrainObjectManager } from './visualization/terrain/TerrainObjectManager';
import { DroneObject } from './visualization/drone/DroneObject';
import { ContextGeometryObjectManager } from './visualization/context/geometry/ContextGeometryObjectManager';
import { ContextObjectManager } from './visualization/context/ContextObjectManager';

export function App() {
  let viewer3D: Viewer3D | null = null;
  let droneController: DroneController | null = null;
  let animationLoop: AnimationLoop | null = null;
  let drone: Drone | null = null;
  let elevationData: ElevationDataManager | null = null;
  let contextData: ContextDataManager | null = null;
  let terrainGeometryManager: TerrainGeometryObjectManager | null = null;
  let terrainObjectManager: TerrainObjectManager | null = null;
  let contextGeometryManager: ContextGeometryObjectManager | null = null;
  let contextObjectManager: ContextObjectManager | null = null;
  let droneObject: DroneObject | null = null;

  onMount(async () => {
    const containerRef = document.getElementById(
      'threejs-container'
    ) as HTMLDivElement;
    if (!containerRef) return;

    // Initialize persistent caches (clean up expired tiles from previous sessions)
    try {
      await Promise.all([
        ElevationTilePersistenceCache.initialize(),
        ContextTilePersistenceCache.initialize(),
      ]);
    } catch (error) {
      console.warn('Failed to initialize persistence caches:', error);
      // Continue anyway - caches are optional
    }

    drone = createDrone();
    elevationData = new ElevationDataManager(drone.getLocation());
    contextData = new ContextDataManager(drone.getLocation());
    viewer3D = new Viewer3D(containerRef);

    terrainGeometryManager = new TerrainGeometryObjectManager(elevationData);
    terrainObjectManager = new TerrainObjectManager(
      viewer3D.getScene(),
      terrainGeometryManager
    );

    contextGeometryManager = new ContextGeometryObjectManager(contextData);
    contextObjectManager = new ContextObjectManager(
      viewer3D.getScene(),
      contextGeometryManager
    );

    droneObject = new DroneObject();
    viewer3D.getScene().add(droneObject.getMesh());

    animationLoop = new AnimationLoop(
      viewer3D,
      drone,
      elevationData,
      contextData,
      viewer3D.getCamera(),
      terrainObjectManager,
      contextObjectManager,
      droneObject
    );
    animationLoop.start();

    droneController = new DroneController(containerRef, drone);

    return () => {
      animationLoop?.dispose();
      viewer3D?.dispose();
      droneController?.dispose();
      elevationData?.dispose();
      contextData?.dispose();
      terrainGeometryManager?.dispose();
      terrainObjectManager?.dispose();
      contextGeometryManager?.dispose();
      contextObjectManager?.dispose();
      droneObject?.dispose();
    };
  });

  return (
    <div class="app">
      <div id="threejs-container" />
    </div>
  );
}
