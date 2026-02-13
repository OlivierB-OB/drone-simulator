import { WebGLRenderer, Scene, Camera } from 'three';

export class Renderer {
  private readonly renderer: WebGLRenderer;

  constructor(
    width: number,
    height: number,
    rendererConstructor: typeof WebGLRenderer = WebGLRenderer
  ) {
    this.renderer = new rendererConstructor({ antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
  }

  getDomElement(): HTMLCanvasElement {
    return this.renderer.domElement;
  }

  render(scene: Scene, camera: Camera): void {
    this.renderer.render(scene, camera);
  }

  setSize(width: number, height: number): void {
    this.renderer.setSize(width, height);
  }

  dispose(): void {
    this.renderer.dispose();
  }
}
