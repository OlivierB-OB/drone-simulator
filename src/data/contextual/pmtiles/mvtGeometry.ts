import type { VectorTileFeature } from '@mapbox/vector-tile';
import type { MercatorBounds } from '../../elevation/types';
import { point, lineString, polygon } from '@turf/helpers';
import type { Point, LineString, Polygon } from 'geojson';

/**
 * Converts an MVT feature's tile-local geometry (0–4096 extent) to Mercator GeoJSON.
 *
 * MVT tiles use an internal coordinate space (typically 0–4096).
 * This function maps those to absolute Mercator meters using the tile's bounds.
 */
export function mvtToMercatorGeometry(
  feature: VectorTileFeature,
  bounds: MercatorBounds
): Point | LineString | Polygon | null {
  const extent = feature.extent;
  const geomType = feature.type;
  const rawGeom = feature.loadGeometry();

  const toMercator = (tileX: number, tileY: number): [number, number] => [
    bounds.minX + (tileX / extent) * (bounds.maxX - bounds.minX),
    bounds.maxY - (tileY / extent) * (bounds.maxY - bounds.minY),
  ];

  // Point (type 1)
  if (geomType === 1) {
    if (rawGeom.length === 0 || rawGeom[0]!.length === 0) return null;
    const p = rawGeom[0]![0]!;
    return point(toMercator(p.x, p.y)).geometry;
  }

  // LineString (type 2)
  if (geomType === 2) {
    if (rawGeom.length === 0) return null;
    const coords = rawGeom[0]!.map((p) => toMercator(p.x, p.y));
    if (coords.length < 2) return null;
    return lineString(coords).geometry;
  }

  // Polygon (type 3)
  if (geomType === 3) {
    if (rawGeom.length === 0) return null;
    const rings = rawGeom.map((ring) => ring.map((p) => toMercator(p.x, p.y)));
    // Close rings if not already closed
    for (const ring of rings) {
      if (ring.length < 3) return null;
      const first = ring[0]!;
      const last = ring[ring.length - 1]!;
      if (first[0] !== last[0] || first[1] !== last[1]) {
        ring.push(first);
      }
    }
    return polygon(rings).geometry;
  }

  return null;
}
