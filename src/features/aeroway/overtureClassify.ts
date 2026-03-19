import type { AerowayVisual } from './types';
import type { LineString, Point, Polygon } from 'geojson';
import { groundColors } from '../../config';

const aerowayLineWidthsMeters: Record<string, number> = {
  runway: 45,
  taxiway: 23,
  taxilane: 12,
};

export function classifyOvertureAeroway(
  id: string,
  props: Record<string, unknown>,
  geometry: Polygon | LineString | Point
): AerowayVisual {
  const aerowayClass = (props.class as string) ?? 'aerodrome';
  const aerowayColors = groundColors.aeroways as Record<
    string,
    string | undefined
  >;

  return {
    id,
    geometry,
    type: aerowayClass,
    color: aerowayColors[aerowayClass] ?? groundColors.aeroways.aerodrome,
    widthMeters: aerowayLineWidthsMeters[aerowayClass]!,
  };
}
