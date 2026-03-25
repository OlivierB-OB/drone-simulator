import type { VegetationVisual } from '../types';
import { vegetationMeshConfig } from '../../../config';
import { EARTH_RADIUS } from '../../../gis/GeoCoordinates';
import type { IVegetationStrategy, TreePoint, BushPoint } from './types';
import { BROADLEAF_COLORS, NEEDLELEAF_COLORS } from './vegetationUtils';

const TO_RAD = Math.PI / 180;

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
    const interval = config.intervalMeters;
    const isNeedle = veg.leafType === 'needleleaved';
    const colors = isNeedle ? NEEDLELEAF_COLORS : BROADLEAF_COLORS;

    let accumulated = 0;

    for (let i = 0; i < coords.length - 1; i++) {
      const [lng1, lat1] = coords[i]!;
      const [lng2, lat2] = coords[i + 1]!;

      const midLat = (lat1 + lat2) / 2;
      const cosLat = Math.cos(midLat * TO_RAD);
      const dEast = (lng2 - lng1) * TO_RAD * EARTH_RADIUS * cosLat;
      const dNorth = (lat2 - lat1) * TO_RAD * EARTH_RADIUS;
      const segLen = Math.sqrt(dEast * dEast + dNorth * dNorth);
      if (segLen < 0.1) continue;

      const dLng = lng2 - lng1;
      const dLat = lat2 - lat1;

      while (accumulated < segLen) {
        const t = accumulated / segLen;
        trees.push({
          lng: lng1 + dLng * t,
          lat: lat1 + dLat * t,
          trunkHeightMin: config.trunkHeightMin,
          trunkHeightMax: config.trunkHeightMax,
          crownRadiusMin: config.crownRadiusMin,
          crownRadiusMax: config.crownRadiusMax,
          isNeedle,
          colors,
        });
        accumulated += interval;
      }
      accumulated -= segLen;
    }
  }
}
