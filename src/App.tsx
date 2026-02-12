import { onMount } from 'solid-js';
import { Viewer3D } from './3Dviewer/Viewer3D';
import { InputController } from './drone/InputController';
import { createDrone, Drone } from './drone/Drone';

export function App() {
  let viewer3D: Viewer3D | null = null;
  let inputController: InputController | null = null;
  let drone: Drone | null = null;

  onMount(() => {
    const containerRef = document.getElementById(
      'threejs-container'
    ) as HTMLDivElement;
    if (!containerRef) return;

    drone = createDrone();
    viewer3D = new Viewer3D(containerRef, drone);
    inputController = new InputController(containerRef, drone);

    return () => {
      viewer3D?.dispose();
      inputController?.dispose();
    };
  });

  return (
    <div class="app">
      <div id="threejs-container" />
    </div>
  );
}
