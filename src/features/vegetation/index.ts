import type { CanvasDrawContext, FeatureModule } from '../types';
import type { Object3D } from 'three';
import type { ElevationSampler } from '../../visualization/mesh/util/ElevationSampler';
import { drawVegetation } from './canvas';
import { VegetationMeshFactory } from './VegetationMeshFactory';
import type { ModuleFeatures } from './types';

export const vegetationModule: FeatureModule<ModuleFeatures> = {
  classifyPriority: 60,
  canvasOrder: 50,

  moduleFeaturesFactory(): ModuleFeatures {
    return { vegetation: [] };
  },

  drawCanvas(features: ModuleFeatures, draw: CanvasDrawContext): void {
    drawVegetation(features.vegetation, draw);
  },

  createMeshes(
    features: ModuleFeatures,
    elevationSampler: ElevationSampler
  ): Object3D[] {
    const factory = new VegetationMeshFactory(elevationSampler);
    return factory.create(features.vegetation);
  },
};
