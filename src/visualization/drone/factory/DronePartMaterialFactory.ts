import { MeshPhongMaterial, CanvasTexture } from 'three';

/**
 * Factory for creating drone component materials.
 * Centralizes material configuration for all drone parts.
 */
export class DronePartMaterialFactory {
  constructor(
    private readonly MeshPhongMaterialConstructor: typeof MeshPhongMaterial = MeshPhongMaterial
  ) {}

  createBodyMaterial(): MeshPhongMaterial {
    return new this.MeshPhongMaterialConstructor({
      color: 0x444444,
      shininess: 60,
    });
  }

  createIndicatorMaterial(): MeshPhongMaterial {
    return new this.MeshPhongMaterialConstructor({
      color: 0xff3300,
      shininess: 80,
    });
  }

  createArmMaterial(): MeshPhongMaterial {
    return new this.MeshPhongMaterialConstructor({
      color: 0x222222,
      shininess: 40,
    });
  }

  createMotorMaterial(): MeshPhongMaterial {
    return new this.MeshPhongMaterialConstructor({
      color: 0x333333,
      shininess: 50,
    });
  }

  createRotorMaterial(texture: CanvasTexture | null): MeshPhongMaterial {
    return new this.MeshPhongMaterialConstructor({
      ...(texture && { map: texture }),
      shininess: texture ? 5 : 30,
      color: texture ? 0xffffff : 0x111111,
      transparent: true,
      opacity: 0.7,
    });
  }

  createSkidMaterial(): MeshPhongMaterial {
    return new this.MeshPhongMaterialConstructor({
      color: 0x666666,
      shininess: 40,
    });
  }
}
