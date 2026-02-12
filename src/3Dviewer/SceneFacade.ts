import { Scene, Color, Object3D } from 'three';

export class SceneFacade {
  private scene: Scene;

  constructor() {
    this.scene = new Scene();
    this.scene.background = new Color(0x1a1a2e);
  }

  getScene(): Scene {
    return this.scene;
  }

  add(object: Object3D): void {
    this.scene.add(object);
  }

  remove(object: Object3D): void {
    this.scene.remove(object);
  }
}
