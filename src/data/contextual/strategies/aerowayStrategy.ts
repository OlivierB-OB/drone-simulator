import type { ContextDataTile, AerowayVisual } from '../types';
import type { ClassifiedGeometry } from './parserUtils';
import { groundColors } from '../../../config';

export const AEROWAY_TYPES = new Set([
  'aerodrome',
  'runway',
  'taxiway',
  'taxilane',
  'apron',
  'helipad',
]);

export function classifyAeroway(
  id: string,
  tags: Record<string, string>,
  geometry: ClassifiedGeometry,
  features: ContextDataTile['features']
): void {
  const aerowayType = tags.aeroway!;
  const aerowayColors = groundColors.aeroways as Record<
    string,
    string | undefined
  >;
  const aerowayLineWidthsMeters: Record<string, number> = {
    runway: 45,
    taxiway: 23,
    taxilane: 12,
  };
  const geom = geometry.polygon ?? geometry.line ?? geometry.point;
  if (!geom) return;
  const aeroway: AerowayVisual = {
    id,
    geometry: geom,
    type: aerowayType,
    color: aerowayColors[aerowayType] ?? groundColors.aeroways.aerodrome,
    widthMeters: aerowayLineWidthsMeters[aerowayType]!,
  };
  features.airports.push(aeroway);
}
