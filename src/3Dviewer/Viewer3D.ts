import { BoxGeometry, MeshBasicMaterial, Mesh } from 'three';
import { CameraFacade } from './CameraFacade';
import { SceneFacade } from './SceneFacade';
import { RendererFacade } from './RendererFacade';

export class Viewer3D {
  private readonly cameraFacade: CameraFacade;
  private readonly sceneFacade: SceneFacade;
  private readonly rendererFacade: RendererFacade;
  private resizeHandler: (() => void) | null = null;
  private cube: Mesh | null = null;

  constructor(container: HTMLDivElement) {
    const width = container.clientWidth;
    const height = container.clientHeight;

    this.cameraFacade = new CameraFacade(width, height);
    this.sceneFacade = new SceneFacade();
    this.rendererFacade = new RendererFacade(width, height);

    container.appendChild(this.rendererFacade.getDomElement());

    this.setupResizeHandler(container);
    this.initializeScene();
  }

  public initializeScene(): void {
    // Add a simple cube for now
    const geometry = new BoxGeometry();
    const material = new MeshBasicMaterial({ color: 0x00ff00 });
    this.cube = new Mesh(geometry, material);
    this.sceneFacade.add(this.cube);
  }

  public render(): void {
    if (this.cube) {
      this.cube.rotation.x += 0.01;
      this.cube.rotation.y += 0.01;
    }
    this.rendererFacade.render(
      this.sceneFacade.getScene(),
      this.cameraFacade.getCamera()
    );
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
    if (this.cube) {
      this.sceneFacade.remove(this.cube);
      this.cube.geometry.dispose();
      (this.cube.material as MeshBasicMaterial).dispose();
    }
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
    this.rendererFacade.dispose();
  }
}
