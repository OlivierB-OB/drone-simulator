import type { Object3D } from 'three';
import type { VegetationVisual } from '../types';
import type { ElevationSampler } from '../../../visualization/mesh/util/ElevationSampler';
import { vegetationMeshConfig } from '../../../config';
import type { GeoCoordinates } from '../../../gis/GeoCoordinates';
import type { IVegetationStrategy } from './types';
import {
  SCRUB_COLORS,
  distributePointsInPolygon,
  createInstancedBushes,
} from './vegetationUtils';

export class ScrubStrategy implements IVegetationStrategy {
  constructor(private readonly elevation: ElevationSampler) {}

  create(veg: VegetationVisual, origin: GeoCoordinates): Object3D[] {
    if (veg.geometry.type !== 'Polygon') return [];
    const config = vegetationMeshConfig.scrub;
    const points = distributePointsInPolygon(
      veg.geometry,
      config.densityPer100m2
    );
    if (points.length === 0) return [];

    return createInstancedBushes(
      points,
      config.crownRadiusMin,
      config.crownRadiusMax,
      SCRUB_COLORS,
      this.elevation,
      origin
    );
  }
}
