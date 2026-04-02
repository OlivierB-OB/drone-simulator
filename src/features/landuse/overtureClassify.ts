import type { LanduseVisual } from './types';
import type { Polygon } from 'geojson';
import { groundColors } from '../../config';
import area from '@turf/area';

export function classifyOvertureLanduse(
  id: string,
  props: Record<string, unknown>,
  geometry: Polygon
): LanduseVisual | null {
  const luType = (props.class as string) ?? 'other';
  const landuseColors = groundColors.landuse as Record<
    string,
    string | undefined
  >;

  return {
    id,
    geometry,
    type: luType,
    color: landuseColors[luType] ?? groundColors.default,
    area: area(geometry),
  };
}
