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
  private readonly object: ThreeScene;
  private readonly ambientLight: AmbientLight;
  private readonly directionalLight: DirectionalLight;
  private axisHelper: AxesHelper | null = null;

  constructor(sceneConstructor: typeof ThreeScene = ThreeScene) {
    this.object = new sceneConstructor();
    this.object.background = new Color(sceneConfig.backgroundColor);

    this.ambientLight = new AmbientLight(0xffffff, 0.6);
    this.directionalLight = new DirectionalLight(0xffffff, 0.8);
    this.setupLighting();
  }

  private setupLighting(): void {
    this.object.add(this.ambientLight);

    this.directionalLight.position.set(1, 1, 1).normalize();
    this.object.add(this.directionalLight);

    // Debug axes helper: red=X, green=Y, blue=Z
    // Position at the drone's initial location in Mercator coordinates
    if (debugConfig.showAxisHelper) {
      this.axisHelper = new AxesHelper(debugConfig.axesHelperSize);
      const mercatorCoords = Drone.latLonToMercator(
        droneConfig.initialCoordinates.latitude,
        droneConfig.initialCoordinates.longitude
      );
      this.axisHelper.position.set(mercatorCoords.x, 0, -mercatorCoords.y);
      this.object.add(this.axisHelper);
    }
  }

  getObject(): ThreeScene {
    return this.object;
  }

  add(object: Object3D): void {
    this.object.add(object);
  }

  remove(object: Object3D): void {
    this.object.remove(object);
  }

  dispose(): void {
    this.object.remove(this.ambientLight);
    this.ambientLight.dispose();

    this.object.remove(this.directionalLight);
    this.directionalLight.dispose();

    if (this.axisHelper) {
      this.object.remove(this.axisHelper);
      this.axisHelper.geometry.dispose();
      this.axisHelper = null;
    }
  }
}
