import type { FeatureModule } from '../types';
import type { Object3D } from 'three';
import type { ElevationSampler } from '../../visualization/mesh/util/ElevationSampler';
import type { GeoCoordinates } from '../../gis/GeoCoordinates';
import { BridgeMeshFactory } from './BridgeMeshFactory';
import type { ModuleFeatures } from './types';
import { roadModule } from '../road';
import { railwayModule } from '../railway';

export const bridgeModule: FeatureModule<ModuleFeatures> = {
  classifyPriority: Infinity, // never classifies

  moduleFeaturesFactory(): ModuleFeatures {
    return {
      ...roadModule.moduleFeaturesFactory(),
      ...railwayModule.moduleFeaturesFactory(),
    };
  },

  createMeshes(
    features: ModuleFeatures,
    elevationSampler: ElevationSampler,
    origin: GeoCoordinates
  ): Object3D[] {
    const factory = new BridgeMeshFactory(elevationSampler);
    return [
      ...factory.createFromRoads(features.roads, origin),
      ...factory.createFromRailways(features.railways, origin),
    ];
  },
};
