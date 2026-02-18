import {
  Scene as ThreeScene,
  Color,
  Object3D,
  AmbientLight,
  DirectionalLight,
  AxesHelper,
} from 'three';
import { sceneConfig, debugConfig, droneConfig } from '../config';
import { Drone } from '../drone/Drone';

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

    // Debug axes helper: red=X, green=Y, blue=Z
    // Position at the drone's initial location in Mercator coordinates
    if (debugConfig.showAxisHelper) {
      const axisHelper = new AxesHelper(debugConfig.axesHelperSize);
      const mercatorCoords = Drone.latLonToMercator(
        droneConfig.initialCoordinates.latitude,
        droneConfig.initialCoordinates.longitude
      );
      axisHelper.position.set(mercatorCoords.x, 0, -mercatorCoords.y);
      this.scene.add(axisHelper);
    }
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
