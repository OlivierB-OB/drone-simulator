import type { FeatureModule } from '../types';
import type { Object3D } from 'three';
import type { ElevationSampler } from '../../visualization/mesh/util/ElevationSampler';
import type { GeoCoordinates } from '../../gis/GeoCoordinates';
import { BuildingMeshFactory } from './BuildingMeshFactory';
import booleanContains from '@turf/boolean-contains';
import type { BuildingVisual, ModuleFeatures } from './types';

function markBuildingParents(buildings: BuildingVisual[]): void {
  const nonParts = buildings.filter(
    (b) => !b.isPart && !b.hasParts && b.geometry.type === 'Polygon'
  );
  const parts = buildings.filter(
    (b) => b.isPart && b.geometry.type === 'Polygon'
  );

  for (const part of parts) {
    for (const parent of nonParts) {
      if (booleanContains(parent.geometry, part.geometry)) {
        parent.hasParts = true;
        break;
      }
    }
  }
}

export const buildingModule: FeatureModule<ModuleFeatures> = {
  classifyPriority: 10,

  moduleFeaturesFactory(): ModuleFeatures {
    return { buildings: [] };
  },

  postProcess(features: ModuleFeatures): void {
    markBuildingParents(features.buildings);
  },

  createMeshes(
    features: ModuleFeatures,
    elevationSampler: ElevationSampler,
    origin: GeoCoordinates
  ): Object3D[] {
    const factory = new BuildingMeshFactory(elevationSampler);
    return factory.create(features.buildings, origin);
  },
};
