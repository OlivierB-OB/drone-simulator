import type { VegetationVisual } from '../types';
import type { IVegetationStrategy, TreePoint, BushPoint } from './types';
import { BROADLEAF_COLORS, NEEDLELEAF_COLORS } from './vegetationUtils';

export class SingleTreeStrategy implements IVegetationStrategy {
  collectPoints(
    veg: VegetationVisual,
    trees: TreePoint[],
    _bushes: BushPoint[]
  ): void {
    if (veg.geometry.type !== 'Point') return;
    // GeoJSON: [lng, lat]
    const [lng, lat] = veg.geometry.coordinates as [number, number];

    const isNeedle = veg.leafType === 'needleleaved';
    const treeHeight = veg.height ?? 10;
    const crownRadius = veg.crownDiameter
      ? veg.crownDiameter / 2
      : treeHeight * 0.25;
    const trunkHeight = treeHeight * 0.4;

    // min == max: exact dimensions, no random variation
    trees.push({
      lng,
      lat,
      trunkHeightMin: trunkHeight,
      trunkHeightMax: trunkHeight,
      crownRadiusMin: crownRadius,
      crownRadiusMax: crownRadius,
      isNeedle,
      colors: isNeedle ? NEEDLELEAF_COLORS : BROADLEAF_COLORS,
    });
  }
}
