import { onMount } from 'solid-js';
import { Viewer3D } from './3Dviewer/Viewer3D';
import { DroneController } from './drone/DroneController';
import { createDrone, Drone } from './drone/Drone';
import { AnimationLoop } from './core/AnimationLoop';

export function App() {
  let viewer3D: Viewer3D | null = null;
  let droneController: DroneController | null = null;
  let animationLoop: AnimationLoop | null = null;
  let drone: Drone | null = null;

  onMount(() => {
    const containerRef = document.getElementById(
      'threejs-container'
    ) as HTMLDivElement;
    if (!containerRef) return;

    drone = createDrone();
    viewer3D = new Viewer3D(containerRef);
    animationLoop = new AnimationLoop(viewer3D, drone, viewer3D.getCamera());
    animationLoop.start();

    droneController = new DroneController(containerRef, drone);

    return () => {
      animationLoop?.dispose();
      viewer3D?.dispose();
      droneController?.dispose();
    };
  });

  return (
    <div class="app">
      <div id="threejs-container" />
    </div>
  );
}
