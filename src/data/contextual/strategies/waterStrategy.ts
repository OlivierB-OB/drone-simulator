import type { ContextDataTile, WaterVisual, HexColor } from '../types';
import type { ClassifiedGeometry } from './parserUtils';
import { groundColors, waterwayWidthsMeters } from '../../../config';

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

export function classifyWater(
  id: string,
  tags: Record<string, string>,
  geometry: ClassifiedGeometry,
  features: ContextDataTile['features']
): void {
  const waterType: string =
    tags.waterway || tags.water || tags['natural'] || tags.landuse || 'water';

  const isArea = geometry.isClosed;
  const geom = isArea ? geometry.polygon : geometry.line;
  if (!geom) return;
  const { color, widthMeters } = getWaterColorAndWidth(waterType, isArea);
  const water: WaterVisual = {
    id,
    geometry: geom,
    type: waterType,
    isArea,
    widthMeters,
    color,
  };
  features.waters.push(water);
}
