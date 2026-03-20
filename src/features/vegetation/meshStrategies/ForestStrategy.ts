import type { Object3D } from 'three';
import type { VegetationVisual } from '..//types';
import type { ElevationSampler } from '../../../visualization/mesh/util/ElevationSampler';
import { vegetationMeshConfig } from '../../../config';
import type { GeoCoordinates } from '../../../gis/GeoCoordinates';
import type { IVegetationStrategy } from './types';
import {
  BROADLEAF_COLORS,
  NEEDLELEAF_COLORS,
  distributePointsInPolygon,
  createInstancedTrees,
} from './vegetationUtils';

export class ForestStrategy implements IVegetationStrategy {
  constructor(private readonly elevation: ElevationSampler) {}

  create(veg: VegetationVisual, origin: GeoCoordinates): Object3D[] {
    if (veg.geometry.type !== 'Polygon') return [];
    const config = vegetationMeshConfig.forest;
    const points = distributePointsInPolygon(
      veg.geometry,
      config.densityPer100m2
    );
    if (points.length === 0) return [];

    const isNeedle = veg.leafType === 'needleleaved';
    const colors = isNeedle ? NEEDLELEAF_COLORS : BROADLEAF_COLORS;

    return createInstancedTrees(
      points,
      config.trunkHeightMin,
      config.trunkHeightMax,
      config.crownRadiusMin,
      config.crownRadiusMax,
      isNeedle,
      colors,
      this.elevation,
      origin
    );
  }
}
