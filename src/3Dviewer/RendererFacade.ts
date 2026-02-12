import { WebGLRenderer, Scene, Camera } from 'three';

export class RendererFacade {
  private renderer: WebGLRenderer;

  constructor(width: number, height: number) {
    this.renderer = new WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
  }

  getRenderer(): WebGLRenderer {
    return this.renderer;
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
