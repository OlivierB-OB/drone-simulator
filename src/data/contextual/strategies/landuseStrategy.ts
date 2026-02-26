import type { ContextDataTile, LanduseVisual } from '../types';
import type { ClassifiedGeometry } from './parserUtils';
import { groundColors } from '../../../config';

export const LANDUSE_TYPES = new Set([
  'grassland',
  'meadow',
  'park',
  'recreation_ground',
  'plant_nursery',
  'farmland',
  'orchard',
  'vineyard',
  'allotments',
  'cemetery',
  'construction',
  'residential',
  'commercial',
  'retail',
  'industrial',
  'military',
  'sand',
  'beach',
  'dune',
  'bare_rock',
  'scree',
  'mud',
  'glacier',
]);

export const NATURAL_LANDUSE_TYPES = new Set([
  'sand',
  'beach',
  'dune',
  'bare_rock',
  'scree',
  'mud',
  'glacier',
  'grassland',
]);

/**
 * Classifies landuse features (both landuse=* and natural landuse types).
 */
export function classifyLanduse(
  id: string,
  tags: Record<string, string>,
  geometry: ClassifiedGeometry,
  features: ContextDataTile['features'],
  isNatural: boolean
): void {
  if (!geometry.polygon) return;

  const landuseColors = groundColors.landuse as Record<
    string,
    string | undefined
  >;

  if (isNatural) {
    const naturalType = tags.natural!;
    const landuse: LanduseVisual = {
      id,
      geometry: geometry.polygon,
      type: naturalType,
      color: landuseColors[naturalType] ?? groundColors.default,
    };
    features.landuse.push(landuse);
  } else {
    const luType = tags.leisure === 'park' ? 'park' : (tags.landuse ?? 'other');
    const landuse: LanduseVisual = {
      id,
      geometry: geometry.polygon,
      type: luType,
      color: landuseColors[luType] ?? groundColors.default,
    };
    features.landuse.push(landuse);
  }
}
