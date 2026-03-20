import type { Object3D } from 'three';
import type { VegetationVisual } from '../types';
import type { ElevationSampler } from '../../../visualization/mesh/util/ElevationSampler';
import { vegetationMeshConfig } from '../../../config';
import type { GeoCoordinates } from '../../../gis/GeoCoordinates';
import type { IVegetationStrategy } from './types';
import {
  SCRUB_COLORS,
  distributeGridInPolygon,
  createInstancedBushes,
} from './vegetationUtils';

export class VineyardStrategy implements IVegetationStrategy {
  constructor(private readonly elevation: ElevationSampler) {}

  create(veg: VegetationVisual, origin: GeoCoordinates): Object3D[] {
    if (veg.geometry.type !== 'Polygon') return [];
    const config = vegetationMeshConfig.vineyard;
    const points = distributeGridInPolygon(
      veg.geometry,
      config.spacingX,
      config.spacingY
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
