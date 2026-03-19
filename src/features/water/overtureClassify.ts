import type { WaterVisual } from './types';
import type { LineString, Polygon } from 'geojson';
import { groundColors, waterwayWidthsMeters } from '../../config';
import type { HexColor } from '../sharedTypes';

function getWaterColorAndWidth(
  waterType: string,
  isArea: boolean
): { color: HexColor; widthMeters: number } {
  if (waterType === 'wetland') {
    return { color: groundColors.water.wetland, widthMeters: 0 };
  }
  if (isArea) {
    return { color: groundColors.water.body, widthMeters: 0 };
  }
  const widthMeters =
    waterwayWidthsMeters[waterType.toLowerCase()] ??
    waterwayWidthsMeters['default'] ??
    3;
  const waterColors = groundColors.water as Record<string, string | undefined>;
  const color = waterColors[waterType.toLowerCase()] ?? groundColors.water.line;
  return { color, widthMeters };
}

export function classifyOvertureWater(
  id: string,
  props: Record<string, unknown>,
  geometry: Polygon | LineString
): WaterVisual {
  const waterClass = (props.class as string) ?? 'water';
  const isArea = geometry.type === 'Polygon';
  const { color, widthMeters } = getWaterColorAndWidth(waterClass, isArea);

  return {
    id,
    geometry,
    type: waterClass,
    isArea,
    widthMeters,
    color,
  };
}
