import type { VegetationVisual } from '../types';
import { vegetationMeshConfig } from '../../../config';
import type { IVegetationStrategy, TreePoint, BushPoint } from './types';
import { SCRUB_COLORS, distributeGridInPolygon } from './vegetationUtils';

export class VineyardStrategy implements IVegetationStrategy {
  collectPoints(
    veg: VegetationVisual,
    _trees: TreePoint[],
    bushes: BushPoint[]
  ): void {
    if (veg.geometry.type !== 'Polygon') return;
    const config = vegetationMeshConfig.vineyard;
    const points = distributeGridInPolygon(
      veg.geometry,
      config.spacingX,
      config.spacingY
    );
    if (points.length === 0) return;

    for (const [lng, lat] of points) {
      bushes.push({
        lng,
        lat,
        radiusMin: config.crownRadiusMin,
        radiusMax: config.crownRadiusMax,
        colors: SCRUB_COLORS,
      });
    }
  }
}
