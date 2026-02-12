import { onMount } from 'solid-js';
import { Viewer3D } from './3Dviewer/Viewer3D';

export function App() {
  let viewer3D: Viewer3D | null = null;

  onMount(() => {
    const containerRef = document.getElementById('threejs-container') as HTMLDivElement;
    if (!containerRef) return;

    viewer3D = new Viewer3D(containerRef);

    return () => {
      viewer3D?.dispose();
    };
  });

  return (
    <div class="app">
      <div id="threejs-container" />
    </div>
  );
}
