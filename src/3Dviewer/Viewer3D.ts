import { BoxGeometry, MeshBasicMaterial, Mesh } from 'three';
import { Drone } from '../drone/Drone';
import { CameraFacade } from './CameraFacade';
import { SceneFacade } from './SceneFacade';
import { RendererFacade } from './RendererFacade';

export class Viewer3D {
  private cameraFacade: CameraFacade;
  private sceneFacade: SceneFacade;
  private rendererFacade: RendererFacade;
  private animationFrameId: number | null = null;
  private resizeHandler: (() => void) | null = null;
  private drone: Drone | null = null;
  private lastFrameTime: number = 0;

  constructor(container: HTMLDivElement, drone?: Drone) {
    this.drone = drone || null;
    const width = container.clientWidth;
    const height = container.clientHeight;

    this.cameraFacade = new CameraFacade(width, height);
    this.sceneFacade = new SceneFacade();
    this.rendererFacade = new RendererFacade(width, height);

    container.appendChild(this.rendererFacade.getDomElement());

    this.setupResizeHandler(container);
    this.initializeScene();
  }

  private initializeScene(): void {
    // Add a simple cube for now
    const geometry = new BoxGeometry();
    const material = new MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new Mesh(geometry, material);
    this.sceneFacade.add(cube);

    this.startAnimation(cube);
  }

  private startAnimation(cube: Mesh): void {
    const animate = (currentTime: number) => {
      this.animationFrameId = requestAnimationFrame(animate);

      // Calculate delta time in seconds
      const deltaTime = this.lastFrameTime === 0 ? 0 : (currentTime - this.lastFrameTime) / 1000;
      this.lastFrameTime = currentTime;

      // Update drone position
      if (this.drone) {
        this.drone.applyMove(deltaTime);
      }

      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;
      this.rendererFacade.render(
        this.sceneFacade.getScene(),
        this.cameraFacade.getCamera()
      );
    };
    animate(0);
  }

  private setupResizeHandler(container: HTMLDivElement): void {
    this.resizeHandler = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      this.cameraFacade.updateAspectRatio(width, height);
      this.rendererFacade.setSize(width, height);
    };
    window.addEventListener('resize', this.resizeHandler);
  }

  dispose(): void {
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.rendererFacade.dispose();
  }

  getCamera(): CameraFacade {
    return this.cameraFacade;
  }

  getScene(): SceneFacade {
    return this.sceneFacade;
  }

  getRenderer(): RendererFacade {
    return this.rendererFacade;
  }
}
