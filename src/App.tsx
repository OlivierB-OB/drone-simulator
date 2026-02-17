import { onMount } from 'solid-js';
import { Viewer3D } from './3Dviewer/Viewer3D';
import { DroneController } from './drone/DroneController';
import { createDrone, Drone } from './drone/Drone';
import { AnimationLoop } from './core/AnimationLoop';
import { ContextDataManager } from './data/contextual/ContextDataManager';
import { ElevationDataManager } from './data/elevation/ElevationDataManager';
import { TerrainGeometryObjectManager } from './visualization/terrain/geometry/TerrainGeometryObjectManager';
import { TerrainObjectManager } from './visualization/terrain/TerrainObjectManager';

export function App() {
  let viewer3D: Viewer3D | null = null;
  let droneController: DroneController | null = null;
  let animationLoop: AnimationLoop | null = null;
  let drone: Drone | null = null;
  let elevationData: ElevationDataManager | null = null;
  let contextData: ContextDataManager | null = null;
  let terrainGeometryManager: TerrainGeometryObjectManager | null = null;
  let terrainObjectManager: TerrainObjectManager | null = null;

  onMount(() => {
    const containerRef = document.getElementById(
      'threejs-container'
    ) as HTMLDivElement;
    if (!containerRef) return;

    drone = createDrone();
    elevationData = new ElevationDataManager(drone.getLocation());
    contextData = new ContextDataManager(drone.getLocation());
    viewer3D = new Viewer3D(containerRef);

    terrainGeometryManager = new TerrainGeometryObjectManager(elevationData);
    terrainObjectManager = new TerrainObjectManager(
      viewer3D.getScene(),
      terrainGeometryManager
    );

    animationLoop = new AnimationLoop(
      viewer3D,
      drone,
      elevationData,
      contextData,
      viewer3D.getCamera(),
      terrainObjectManager
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
    };
  });

  return (
    <div class="app">
      <div id="threejs-container" />
    </div>
  );
}
