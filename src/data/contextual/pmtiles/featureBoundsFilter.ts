import type { Geometry, Position } from 'geojson';
import type { ModulesFeatures } from '../../../features/registrationTypes';
import type { GeoBounds } from '../../elevation/types';

function coordInBounds(c: Position, b: GeoBounds): boolean {
  const lng = c[0] ?? 0;
  const lat = c[1] ?? 0;
  return (
    lng >= b.minLng && lng <= b.maxLng && lat >= b.minLat && lat <= b.maxLat
  );
}

function geometryOverlapsBounds(
  geometry: Geometry,
  bounds: GeoBounds
): boolean {
  switch (geometry.type) {
    case 'Point':
      return coordInBounds(geometry.coordinates, bounds);
    case 'LineString':
      return geometry.coordinates.some((c) => coordInBounds(c, bounds));
    case 'Polygon':
      return (geometry.coordinates[0] ?? []).some((c) =>
        coordInBounds(c, bounds)
      );
    default:
      return true; // keep unknown geometry types
  }
}

/**
 * Returns a new ModulesFeatures containing only features whose geometry
 * has at least one coordinate within the given geo bounds.
 * Uses an approximate "any coordinate" check -- sufficient for small sub-tiles.
 */
export function filterFeaturesByBounds(
  features: ModulesFeatures,
  bounds: GeoBounds
): ModulesFeatures {
  const result: Record<string, unknown[]> = {};
  for (const key of Object.keys(features)) {
    const arr =
      (features as unknown as Record<string, Array<{ geometry: Geometry }>>)[
        key
      ] ?? [];
    result[key] = arr.filter((f) => geometryOverlapsBounds(f.geometry, bounds));
  }
  return result as unknown as ModulesFeatures;
}
