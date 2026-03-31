import type { LineString, MultiPolygon, Polygon } from 'geojson';
import type { GeoBounds } from '../data/elevation/types';
import { bboxClip } from '@turf/bbox-clip';

export function clipPolygonToBounds(
  geometry: Polygon,
  bounds: GeoBounds
): Polygon | null {
  const bbox = [bounds.minLng, bounds.minLat, bounds.maxLng, bounds.maxLat] as [
    number,
    number,
    number,
    number,
  ];
  const result = bboxClip(geometry, bbox);
  const g = result.geometry;
  if (g.type === 'Polygon') {
    return g.coordinates[0] && g.coordinates[0].length >= 3 ? g : null;
  }
  // MultiPolygon — take the first polygon
  const multiCoords = (g as MultiPolygon).coordinates;
  const first = multiCoords[0];
  if (!first || first[0] == null || first[0].length < 3) return null;
  return { type: 'Polygon', coordinates: first };
}

export function clipLineStringToBounds(
  geometry: LineString,
  bounds: GeoBounds
): LineString | null {
  const bbox = [bounds.minLng, bounds.minLat, bounds.maxLng, bounds.maxLat] as [
    number,
    number,
    number,
    number,
  ];
  const result = bboxClip(geometry, bbox);
  const first = result.geometry.coordinates[0] as
    | [number, number][]
    | undefined;
  if (!first || first.length < 2) return null;
  return { type: 'LineString', coordinates: first };
}
