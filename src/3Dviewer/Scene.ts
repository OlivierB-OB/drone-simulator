import {
  Scene as ThreeScene,
  Color,
  Object3D,
  AmbientLight,
  DirectionalLight,
} from 'three';
import { sceneConfig } from '../config';

export class Scene {
  private readonly scene: ThreeScene;

  constructor(sceneConstructor: typeof ThreeScene = ThreeScene) {
    this.scene = new sceneConstructor();
    this.scene.background = new Color(sceneConfig.backgroundColor);
    this.setupLighting();
  }

  private setupLighting(): void {
    // Ambient light provides base illumination
    const ambientLight = new AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    // Directional light simulates sunlight
    const directionalLight = new DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1).normalize();
    this.scene.add(directionalLight);
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
