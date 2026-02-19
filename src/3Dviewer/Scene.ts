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
  private readonly ambientLight: AmbientLight;
  private readonly directionalLight: DirectionalLight;
  private axisHelper: AxesHelper | null = null;

  constructor(sceneConstructor: typeof ThreeScene = ThreeScene) {
    this.scene = new sceneConstructor();
    this.scene.background = new Color(sceneConfig.backgroundColor);

    this.ambientLight = new AmbientLight(0xffffff, 0.6);
    this.directionalLight = new DirectionalLight(0xffffff, 0.8);
    this.setupLighting();
  }

  private setupLighting(): void {
    this.scene.add(this.ambientLight);

    this.directionalLight.position.set(1, 1, 1).normalize();
    this.scene.add(this.directionalLight);

    // Debug axes helper: red=X, green=Y, blue=Z
    // Position at the drone's initial location in Mercator coordinates
    if (debugConfig.showAxisHelper) {
      this.axisHelper = new AxesHelper(debugConfig.axesHelperSize);
      const mercatorCoords = Drone.latLonToMercator(
        droneConfig.initialCoordinates.latitude,
        droneConfig.initialCoordinates.longitude
      );
      this.axisHelper.position.set(mercatorCoords.x, 0, -mercatorCoords.y);
      this.scene.add(this.axisHelper);
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

  dispose(): void {
    this.scene.remove(this.ambientLight);
    this.ambientLight.dispose();

    this.scene.remove(this.directionalLight);
    this.directionalLight.dispose();

    if (this.axisHelper) {
      this.scene.remove(this.axisHelper);
      this.axisHelper.geometry.dispose();
      this.axisHelper = null;
    }
  }
}
