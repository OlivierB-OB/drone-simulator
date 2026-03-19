import type { FeatureModule } from '../types';
import type { Object3D } from 'three';
import type { ElevationSampler } from '../../visualization/mesh/util/ElevationSampler';
import { BarrierMeshFactory } from './BarrierMeshFactory';
import type { ModuleFeatures } from './types';

export const barrierModule: FeatureModule<ModuleFeatures> = {
  classifyPriority: 57,

  moduleFeaturesFactory(): ModuleFeatures {
    return { barriers: [] };
  },

  createMeshes(
    features: ModuleFeatures,
    elevationSampler: ElevationSampler
  ): Object3D[] {
    const factory = new BarrierMeshFactory(elevationSampler);
    return factory.create(features.barriers);
  },
};
