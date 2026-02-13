import { Scene, Color, Object3D } from 'three';

export class SceneFacade {
  private readonly scene: Scene;

  constructor(sceneConstructor: typeof Scene = Scene) {
    this.scene = new sceneConstructor();
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
