import type { VegetationVisual } from '../types';
import { vegetationMeshConfig } from '../../../config';
import type { IVegetationStrategy, TreePoint, BushPoint } from './types';
import { BROADLEAF_COLORS, NEEDLELEAF_COLORS } from './vegetationUtils';
import lineChunk from '@turf/line-chunk';
import { lineString } from '@turf/helpers';

export class TreeRowStrategy implements IVegetationStrategy {
  collectPoints(
    veg: VegetationVisual,
    trees: TreePoint[],
    _bushes: BushPoint[]
  ): void {
    if (veg.geometry.type !== 'LineString') return;
    const coords = veg.geometry.coordinates as [number, number][];
    if (coords.length < 2) return;

    const config = vegetationMeshConfig.treeRow;
    const isNeedle = veg.leafType === 'needleleaved';
    const colors = isNeedle ? NEEDLELEAF_COLORS : BROADLEAF_COLORS;

    const chunks = lineChunk(lineString(coords), config.intervalMeters, {
      units: 'meters',
    });
    for (const chunk of chunks.features) {
      const start = chunk.geometry.coordinates[0];
      if (!start || start[0] === undefined || start[1] === undefined) continue;
      const lng = start[0];
      const lat = start[1];
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
