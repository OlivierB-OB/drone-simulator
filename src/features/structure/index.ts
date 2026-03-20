import type { FeatureModule } from '../types';
import type { Object3D } from 'three';
import type { ElevationSampler } from '../../visualization/mesh/util/ElevationSampler';
import type { GeoCoordinates } from '../../gis/GeoCoordinates';
import { StructureMeshFactory } from './StructureMeshFactory';
import type { ModuleFeatures } from './types';

export const structureModule: FeatureModule<ModuleFeatures> = {
  classifyPriority: 55,

  moduleFeaturesFactory(): ModuleFeatures {
    return { structures: [] };
  },

  createMeshes(
    features: ModuleFeatures,
    elevationSampler: ElevationSampler,
    origin: GeoCoordinates
  ): Object3D[] {
    const factory = new StructureMeshFactory(elevationSampler);
    return factory.create(features.structures, origin);
  },
};
