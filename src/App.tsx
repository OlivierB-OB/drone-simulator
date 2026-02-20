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
import { TerrainTextureObjectManager } from './visualization/terrain/texture/TerrainTextureObjectManager';
import { TerrainTextureFactory } from './visualization/terrain/texture/TerrainTextureFactory';
import { TerrainCanvasRenderer } from './visualization/terrain/texture/TerrainCanvasRenderer';
import { DroneObject } from './visualization/drone/DroneObject';

export function App() {
  let viewer3D: Viewer3D | null = null;
  let droneController: DroneController | null = null;
  let animationLoop: AnimationLoop | null = null;
  let drone: Drone | null = null;
  let elevationData: ElevationDataManager | null = null;
  let contextData: ContextDataManager | null = null;
  let terrainGeometryManager: TerrainGeometryObjectManager | null = null;
  let terrainTextureManager: TerrainTextureObjectManager | null = null;
  let terrainObjectManager: TerrainObjectManager | null = null;
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
    elevationData = new ElevationDataManager(drone);
    contextData = new ContextDataManager(drone);
    viewer3D = new Viewer3D(containerRef, drone);

    terrainGeometryManager = new TerrainGeometryObjectManager(elevationData);
    terrainTextureManager = new TerrainTextureObjectManager(
      contextData,
      new TerrainTextureFactory(new TerrainCanvasRenderer())
    );
    terrainObjectManager = new TerrainObjectManager(
      viewer3D.getScene(),
      terrainGeometryManager,
      terrainTextureManager
    );

    droneObject = new DroneObject(drone);
    viewer3D.getScene().add(droneObject.getMesh());

    animationLoop = new AnimationLoop(
      viewer3D,
      drone,
      viewer3D.getCamera(),
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
      terrainObjectManager?.dispose();
      droneObject?.unsubscribeFromDrone(drone!);
      droneObject?.dispose();
      drone?.dispose();
    };
  });

  return (
    <div class="app">
      <div id="threejs-container" />
    </div>
  );
}
