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

function parseFiniteFloat(value?: string): number | undefined {
  if (!value) return undefined;
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : undefined;
}

function resolveSourceTags(
  props: Record<string, unknown>
): Record<string, string> | undefined {
  const raw = props.source_tags;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'object' && parsed !== null) return parsed;
    } catch {
      return undefined;
    }
  }
  if (typeof raw === 'object' && raw !== null) {
    return raw as Record<string, string>;
  }
  return undefined;
}

export function classifyOvertureVegetation(
  id: string,
  props: Record<string, unknown>,
  geometry: Polygon | LineString | Point
): VegetationVisual | null {
  const rawClass = (props.class as string) ?? 'vegetation';
  // land_cover `class: 'tree'` is a forested polygon area, not an individual tree
  const vegClass =
    rawClass === 'tree' && geometry.type !== 'Point' ? 'forest' : rawClass;
  const height = typeof props.height === 'number' ? props.height : undefined;

  // Forest/wood types are always tall
  const isForest = vegClass === 'forest' || vegClass === 'wood';
  const heightCategory = isForest ? 'tall' : getHeightCategory(height);

  const tags = resolveSourceTags(props);
  const leafType = tags?.leaf_type as
    | 'broadleaved'
    | 'needleleaved'
    | undefined;
  const leafCycle = tags?.leaf_cycle as 'evergreen' | 'deciduous' | undefined;
  const crownDiameter = parseFiniteFloat(tags?.diameter_crown);
  const trunkCircumference = parseFiniteFloat(tags?.circumference);

  return {
    id,
    geometry,
    type: vegClass,
    height,
    heightCategory,
    color: getColorForVegetation(vegClass),
    leafType,
    leafCycle,
    crownDiameter,
    trunkCircumference,
  };
}
