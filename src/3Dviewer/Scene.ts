import {
  Scene as ThreeScene,
  Color,
  Object3D,
  AmbientLight,
  DirectionalLight,
  AxesHelper,
  Fog,
} from 'three';
import { sceneConfig, debugConfig } from '../config';

export class Scene {
  private readonly object: ThreeScene;
  private readonly ambientLight: AmbientLight;
  private readonly directionalLight: DirectionalLight;
  private axisHelper: AxesHelper | null = null;

  constructor(
    private readonly onChanged: () => void,
    sceneConstructor: typeof ThreeScene = ThreeScene
  ) {
    this.object = new sceneConstructor();
    this.object.background = new Color(sceneConfig.sky.color);

    this.ambientLight = new AmbientLight(0xeeeeee, 1);
    this.directionalLight = new DirectionalLight(0xffffff, 2);
    this.setupFog();
    this.setupLighting();
  }

  private setupFog(): void {
    const fog = new Fog(
      sceneConfig.fog.color,
      sceneConfig.fog.near,
      sceneConfig.fog.far
    );
    this.object.fog = fog;
  }

  private setupLighting(): void {
    this.object.add(this.ambientLight);

    this.directionalLight.position.set(1, 1, 0.5).normalize();
    this.object.add(this.directionalLight);

    // Debug axes helper: red=X, green=Y, blue=Z
    // Position at the origin (drone is always at origin in local tangent plane)
    if (debugConfig.showAxisHelper) {
      this.axisHelper = new AxesHelper(debugConfig.axesHelperSize);
      this.axisHelper.position.set(0, 0, 0);
      this.object.add(this.axisHelper);
    }
  }

  getObject(): ThreeScene {
    return this.object;
  }

  add(object: Object3D): void {
    this.object.add(object);
    this.onChanged();
  }

  remove(object: Object3D): void {
    this.object.remove(object);
    this.onChanged();
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
