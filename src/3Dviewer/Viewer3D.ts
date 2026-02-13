import { BoxGeometry, MeshBasicMaterial, Mesh } from 'three';
import { Camera } from './Camera';
import { Scene } from './Scene';
import { Renderer } from './Renderer';

export class Viewer3D {
  private readonly camera: Camera;
  private readonly scene: Scene;
  private readonly renderer: Renderer;
  private resizeHandler: (() => void) | null = null;
  private cube: Mesh | null = null;

  constructor(
    container: HTMLDivElement,
    camera?: Camera,
    renderer?: Renderer,
    scene?: Scene
  ) {
    const width = container.clientWidth;
    const height = container.clientHeight;

    this.camera = camera ?? new Camera(width, height);
    this.scene = scene ?? new Scene();
    this.renderer = renderer ?? new Renderer(width, height);

    container.appendChild(this.renderer.getDomElement());

    this.setupResizeHandler(container);
    this.initializeScene();
  }

  public initializeScene(): void {
    // Add a simple cube for now
    const geometry = new BoxGeometry();
    const material = new MeshBasicMaterial({ color: 0x00ff00 });
    this.cube = new Mesh(geometry, material);
    this.scene.add(this.cube);
  }

  public getCamera(): Camera {
    return this.camera;
  }

  public render(): void {
    if (this.cube) {
      this.cube.rotation.x += 0.01;
      this.cube.rotation.y += 0.01;
    }
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
    if (this.cube) {
      this.scene.remove(this.cube);
      this.cube.geometry.dispose();
      (this.cube.material as MeshBasicMaterial).dispose();
    }
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
    this.renderer.dispose();
  }
}
