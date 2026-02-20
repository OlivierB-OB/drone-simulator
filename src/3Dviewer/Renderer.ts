import { WebGLRenderer, Scene, Camera } from 'three';

export class Renderer {
  private readonly object: WebGLRenderer;

  constructor(
    width: number,
    height: number,
    rendererConstructor: typeof WebGLRenderer = WebGLRenderer
  ) {
    this.object = new rendererConstructor({ antialias: true });
    this.object.setSize(width, height);
    this.object.setPixelRatio(window.devicePixelRatio);
  }

  getDomElement(): HTMLCanvasElement {
    return this.object.domElement;
  }

  render(scene: Scene, camera: Camera): void {
    this.object.render(scene, camera);
  }

  setSize(width: number, height: number): void {
    this.object.setSize(width, height);
  }

  dispose(): void {
    this.object.dispose();
  }
}
