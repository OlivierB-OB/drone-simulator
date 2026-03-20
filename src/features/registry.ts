import type { Object3D } from 'three';
import type { CanvasDrawContext } from './types';
import type { ElevationSampler } from '../visualization/mesh/util/ElevationSampler';
import type { GeoCoordinates } from '../gis/GeoCoordinates';
import type { ModulesFeatures } from './registrationTypes';
import { MODULES } from './registration';

export class FeatureModuleRegistry {
  private readonly modules = MODULES;

  modulesFeaturesFactory(): ModulesFeatures {
    return this.modules.reduce(
      (res, mod) => ({ ...res, ...mod.moduleFeaturesFactory() }),
      {} as ModulesFeatures
    );
  }

  runPostProcessing(features: ModulesFeatures): void {
    for (const mod of this.modules) {
      mod.postProcess?.(features);
    }
  }

  getCanvasModules(): typeof MODULES {
    return this.modules
      .filter((m) => m.drawCanvas && m.canvasOrder !== undefined)
      .sort((a, b) => a.canvasOrder! - b.canvasOrder!);
  }

  getMeshModules(): typeof MODULES {
    return this.modules.filter((m) => m.createMeshes);
  }

  createAllMeshes(
    features: ModulesFeatures,
    elevationSampler: ElevationSampler,
    origin: GeoCoordinates
  ): Object3D[] {
    const meshes: Object3D[] = [];
    for (const mod of this.getMeshModules()) {
      meshes.push(...mod.createMeshes!(features, elevationSampler, origin));
    }
    return meshes;
  }

  drawAllCanvas(features: ModulesFeatures, draw: CanvasDrawContext): void {
    for (const mod of this.getCanvasModules()) {
      mod.drawCanvas!(features, draw);
    }
  }
}

export const featureRegistry = new FeatureModuleRegistry();
