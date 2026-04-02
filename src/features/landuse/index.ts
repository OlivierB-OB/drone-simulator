import type { CanvasDrawContext, FeatureModule } from '../types';
import { drawLanduse } from './canvas';
import type { LanduseVisual, ModuleFeatures } from './types';
import type { ModulesFeatures } from '../registrationTypes';
import type { GeoBounds } from '../../gis/GeoCoordinates';
import { clipPolygonToBounds } from '../clipGeometry';
import { polygon } from '@turf/helpers';

export const landuseModule: FeatureModule<ModuleFeatures> = {
  classifyPriority: 65,
  canvasOrder: 10,

  moduleFeaturesFactory(): ModuleFeatures {
    return { landuse: [] };
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
    features.landuse = features.landuse
      .map((lu) => {
        const clipped = clipPolygonToBounds(lu.geometry, boundsPolygon);
        return clipped ? { ...lu, geometry: clipped } : null;
      })
      .filter((lu): lu is LanduseVisual => lu !== null);
  },

  drawCanvas(features: ModuleFeatures, draw: CanvasDrawContext): void {
    drawLanduse(features.landuse, draw);
  },
};
