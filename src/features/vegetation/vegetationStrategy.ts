import type { VegetationVisual } from './types';
import type { HexColor } from '../sharedTypes';
import { groundColors } from '../../config';
import type { LineString, Point, Polygon } from 'geojson';

function getHeightCategory(height?: number): 'tall' | 'medium' | 'short' {
  if (!height) return 'medium';
  if (height > 20) return 'tall';
  if (height > 5) return 'medium';
  return 'short';
}

function getColorForVegetation(vegType: string): HexColor {
  const typeNormalized = vegType.toLowerCase();
  const map = groundColors.vegetation as Record<string, string | undefined>;
  return map[typeNormalized] ?? groundColors.vegetation.default;
}

function extract3DAttributes(tags: Record<string, string>): {
  leafType?: 'broadleaved' | 'needleleaved';
  leafCycle?: 'evergreen' | 'deciduous';
  crownDiameter?: number;
  trunkCircumference?: number;
} {
  const leafType = tags.leaf_type as 'broadleaved' | 'needleleaved' | undefined;
  const leafCycle = tags.leaf_cycle as 'evergreen' | 'deciduous' | undefined;
  const crownDiameter = tags.diameter_crown
    ? parseFloat(tags.diameter_crown)
    : undefined;
  const trunkCircumference = tags.circumference
    ? parseFloat(tags.circumference)
    : undefined;
  return { leafType, leafCycle, crownDiameter, trunkCircumference };
}

export function classifyVegetation(
  id: string,
  tags: Record<string, string>,
  geometry: Polygon | LineString | Point,
  isForest: boolean
): VegetationVisual | null {
  const attrs = extract3DAttributes(tags);

  if (isForest) {
    if (geometry.type !== 'Polygon') return null;
    return {
      id,
      geometry,
      type: 'forest',
      height: undefined,
      heightCategory: 'tall',
      color: getColorForVegetation('forest'),
      ...attrs,
    };
  }

  const vegType: string = tags.natural || 'vegetation';
  const height = tags.height ? parseFloat(tags.height) : undefined;
  return {
    id,
    geometry,
    type: vegType,
    height,
    heightCategory: getHeightCategory(height),
    color: getColorForVegetation(vegType),
    ...attrs,
  };
}
