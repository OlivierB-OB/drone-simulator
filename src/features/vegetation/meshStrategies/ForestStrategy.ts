import type { VegetationVisual } from '..//types';
import { vegetationMeshConfig } from '../../../config';
import type { IVegetationStrategy, TreePoint, BushPoint } from './types';
import {
  BROADLEAF_COLORS,
  NEEDLELEAF_COLORS,
  distributePointsInPolygon,
} from './vegetationUtils';

export class ForestStrategy implements IVegetationStrategy {
  collectPoints(
    veg: VegetationVisual,
    trees: TreePoint[],
    _bushes: BushPoint[]
  ): void {
    if (veg.geometry.type !== 'Polygon') return;
    const config = vegetationMeshConfig.forest;
    const points = distributePointsInPolygon(
      veg.geometry,
      config.densityPer100m2
    );
    if (points.length === 0) return;

    const isNeedle = veg.leafType === 'needleleaved';
    const colors = isNeedle ? NEEDLELEAF_COLORS : BROADLEAF_COLORS;

    for (const [lng, lat] of points) {
      trees.push({
        lng,
        lat,
        trunkHeightMin: config.trunkHeightMin,
        trunkHeightMax: config.trunkHeightMax,
        crownRadiusMin: config.crownRadiusMin,
        crownRadiusMax: config.crownRadiusMax,
        isNeedle,
        colors,
      });
    }
  }
}
