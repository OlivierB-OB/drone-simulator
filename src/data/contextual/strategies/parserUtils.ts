import type { LineString, Point, Polygon } from '../types';

const EARTH_RADIUS = 6378137; // meters
const MAX_EXTENT = EARTH_RADIUS * Math.PI;

/**
 * Uniform geometry input for all strategy classifiers.
 * Prepared by the main parser from ways, nodes, or relations.
 */
export interface ClassifiedGeometry {
  line: LineString | null;
  polygon: Polygon | null;
  point: Point | null;
  isClosed: boolean;
}

/**
 * Converts latitude/longitude (decimal degrees) to Mercator meters.
 */
export function latLngToMercator(lat: number, lng: number): [number, number] {
  const x = (lng / 180) * MAX_EXTENT;
  const y =
    (Math.log(Math.tan((Math.PI * (90 + lat)) / 360)) / Math.PI) * MAX_EXTENT;
  return [x, y];
}

/**
 * Categorizes numeric height into tall/medium/short.
 */
export function getHeightCategory(
  height?: number
): 'tall' | 'medium' | 'short' {
  if (!height) return 'medium';
  if (height > 20) return 'tall';
  if (height > 5) return 'medium';
  return 'short';
}
