import type { Object3D } from 'three';
import type { VegetationVisual } from '../types';
import type { ElevationSampler } from '../../../visualization/mesh/util/ElevationSampler';
import { vegetationMeshConfig } from '../../../config';
import type { GeoCoordinates } from '../../../gis/GeoCoordinates';
import { EARTH_RADIUS } from '../../../gis/GeoCoordinates';
import type { IVegetationStrategy } from './types';
import {
  BROADLEAF_COLORS,
  NEEDLELEAF_COLORS,
  createInstancedTrees,
} from './vegetationUtils';

const TO_RAD = Math.PI / 180;

export class TreeRowStrategy implements IVegetationStrategy {
  constructor(private readonly elevation: ElevationSampler) {}

  create(veg: VegetationVisual, origin: GeoCoordinates): Object3D[] {
    if (veg.geometry.type !== 'LineString') return [];
    const coords = veg.geometry.coordinates as [number, number][];
    if (coords.length < 2) return [];

    const config = vegetationMeshConfig.treeRow;
    const interval = config.intervalMeters;
    const isNeedle = veg.leafType === 'needleleaved';
    const colors = isNeedle ? NEEDLELEAF_COLORS : BROADLEAF_COLORS;

    const points: [number, number][] = [];
    let accumulated = 0;

    for (let i = 0; i < coords.length - 1; i++) {
      const [lng1, lat1] = coords[i]!;
      const [lng2, lat2] = coords[i + 1]!;

      // Compute segment length in meters
      const midLat = (lat1 + lat2) / 2;
      const cosLat = Math.cos(midLat * TO_RAD);
      const dEast = (lng2 - lng1) * TO_RAD * EARTH_RADIUS * cosLat;
      const dNorth = (lat2 - lat1) * TO_RAD * EARTH_RADIUS;
      const segLen = Math.sqrt(dEast * dEast + dNorth * dNorth);
      if (segLen < 0.1) continue;

      // Interpolate along segment in degree space
      const dLng = lng2 - lng1;
      const dLat = lat2 - lat1;

      while (accumulated < segLen) {
        const t = accumulated / segLen;
        const px = lng1 + dLng * t;
        const py = lat1 + dLat * t;
        points.push([px, py]);
        accumulated += interval;
      }
      accumulated -= segLen;
    }

    if (points.length === 0) return [];

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
