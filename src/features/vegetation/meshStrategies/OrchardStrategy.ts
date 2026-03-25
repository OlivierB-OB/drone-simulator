import type { VegetationVisual } from '../types';
import { vegetationMeshConfig } from '../../../config';
import type { IVegetationStrategy, TreePoint, BushPoint } from './types';
import { BROADLEAF_COLORS, distributeGridInPolygon } from './vegetationUtils';

export class OrchardStrategy implements IVegetationStrategy {
  collectPoints(
    veg: VegetationVisual,
    trees: TreePoint[],
    _bushes: BushPoint[]
  ): void {
    if (veg.geometry.type !== 'Polygon') return;
    const config = vegetationMeshConfig.orchard;
    const points = distributeGridInPolygon(
      veg.geometry,
      config.spacingX,
      config.spacingY
    );
    if (points.length === 0) return;

    for (const [lng, lat] of points) {
      trees.push({
        lng,
        lat,
        trunkHeightMin: config.trunkHeightMin,
        trunkHeightMax: config.trunkHeightMax,
        crownRadiusMin: config.crownRadiusMin,
        crownRadiusMax: config.crownRadiusMax,
        isNeedle: false,
        colors: BROADLEAF_COLORS,
      });
    }
  }
}
