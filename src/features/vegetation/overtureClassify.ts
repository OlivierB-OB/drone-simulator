import type { VegetationVisual } from './types';
import type { LineString, Point, Polygon } from 'geojson';
import { groundColors } from '../../config';
import type { HexColor } from '../sharedTypes';

function getColorForVegetation(vegType: string): HexColor {
  const map = groundColors.vegetation as Record<string, string | undefined>;
  return map[vegType.toLowerCase()] ?? groundColors.vegetation.default;
}

function getHeightCategory(height?: number): 'tall' | 'medium' | 'short' {
  if (!height) return 'medium';
  if (height > 20) return 'tall';
  if (height > 5) return 'medium';
  return 'short';
}

export function classifyOvertureVegetation(
  id: string,
  props: Record<string, unknown>,
  geometry: Polygon | LineString | Point
): VegetationVisual {
  const vegClass = (props.class as string) ?? 'vegetation';
  const height = typeof props.height === 'number' ? props.height : undefined;

  // Forest/wood types are always tall
  const isForest = vegClass === 'forest' || vegClass === 'wood';
  const heightCategory = isForest ? 'tall' : getHeightCategory(height);

  return {
    id,
    geometry,
    type: vegClass,
    height,
    heightCategory,
    color: getColorForVegetation(vegClass),
  };
}
