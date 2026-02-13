import { Scene as ThreeScene, Color, Object3D } from 'three';
import { sceneConfig } from '../config';

export class Scene {
  private readonly scene: ThreeScene;

  constructor(sceneConstructor: typeof ThreeScene = ThreeScene) {
    this.scene = new sceneConstructor();
    this.scene.background = new Color(sceneConfig.backgroundColor);
  }

  getScene(): ThreeScene {
    return this.scene;
  }

  add(object: Object3D): void {
    this.scene.add(object);
  }

  remove(object: Object3D): void {
    this.scene.remove(object);
  }
}
