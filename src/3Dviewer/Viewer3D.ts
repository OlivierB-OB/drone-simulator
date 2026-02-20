import { Camera } from './Camera';
import { Scene } from './Scene';
import { Renderer } from './Renderer';
import type { Drone } from '../drone/Drone';

export class Viewer3D {
  private readonly camera: Camera;
  private readonly scene: Scene;
  private readonly renderer: Renderer;
  private resizeHandler: (() => void) | null = null;

  constructor(
    container: HTMLDivElement,
    drone: Drone,
    camera?: Camera,
    renderer?: Renderer,
    scene?: Scene
  ) {
    const width = container.clientWidth;
    const height = container.clientHeight;

    this.camera = camera ?? new Camera(width, height, drone);
    this.scene = scene ?? new Scene();
    this.renderer = renderer ?? new Renderer(width, height);

    container.appendChild(this.renderer.getDomElement());

    this.setupResizeHandler(container);
  }

  public getCamera(): Camera {
    return this.camera;
  }

  public getScene(): Scene {
    return this.scene;
  }

  public render(): void {
    this.renderer.render(this.scene.getScene(), this.camera.getCamera());
  }

  private setupResizeHandler(container: HTMLDivElement): void {
    this.resizeHandler = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      this.camera.updateAspectRatio(width, height);
      this.renderer.setSize(width, height);
    };
    window.addEventListener('resize', this.resizeHandler);
  }

  dispose(): void {
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
    this.camera.unsubscribeFromDrone();
    this.scene.dispose();
    this.renderer.dispose();
  }
}
