import type { CanvasDrawContext, FeatureModule } from '../types';
import type { Object3D } from 'three';
import type { ElevationSampler } from '../../visualization/mesh/util/ElevationSampler';
import type { GeoCoordinates } from '../../gis/GeoCoordinates';
import { drawVegetation } from './canvas';
import { VegetationMeshFactory } from './VegetationMeshFactory';
import { postProcessVegetation } from './postProcess';
import type { VegetationVisual, ModuleFeatures } from './types';
import type { ModulesFeatures } from '../registrationTypes';
import type { GeoBounds } from '../../gis/GeoCoordinates';
import { clipPolygonToBounds, clipLineStringToBounds } from '../clipGeometry';
import { polygon } from '@turf/helpers';
import booleanIntersects from '@turf/boolean-intersects';

export const vegetationModule: FeatureModule<ModuleFeatures> = {
  classifyPriority: 60,
  canvasOrder: 50,

  moduleFeaturesFactory(): ModuleFeatures {
    return { vegetation: [] };
  },

  postProcess(features: ModulesFeatures): void {
    postProcessVegetation(features);
  },

  filterFeatures(features: ModulesFeatures, bounds: GeoBounds): void {
    const { minLng, minLat, maxLng, maxLat } = bounds;
    const boundsPolygon = polygon([
      [
        [minLng, minLat],
        [maxLng, minLat],
        [maxLng, maxLat],
        [minLng, maxLat],
        [minLng, minLat],
      ],
    ]);
    features.vegetation = features.vegetation
      .map((veg) => {
        if (veg.geometry.type === 'Polygon') {
          const clipped = clipPolygonToBounds(veg.geometry, boundsPolygon);
          return clipped ? { ...veg, geometry: clipped } : null;
        }
        if (veg.geometry.type === 'LineString') {
          const clipped = clipLineStringToBounds(veg.geometry, boundsPolygon);
          return clipped ? { ...veg, geometry: clipped } : null;
        }
        return booleanIntersects(veg.geometry, boundsPolygon) ? veg : null;
      })
      .filter((veg): veg is VegetationVisual => veg !== null);
  },

  drawCanvas(features: ModuleFeatures, draw: CanvasDrawContext): void {
    drawVegetation(features.vegetation, draw);
  },

  createMeshes(
    features: ModuleFeatures,
    elevationSampler: ElevationSampler,
    origin: GeoCoordinates
  ): Object3D[] {
    const factory = new VegetationMeshFactory(elevationSampler);
    return factory.create(features.vegetation, origin);
  },
};
