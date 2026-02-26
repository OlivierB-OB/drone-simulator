import type { ContextDataTile, VegetationVisual, HexColor } from '../types';
import type { ClassifiedGeometry } from './parserUtils';
import { getHeightCategory } from './parserUtils';
import { groundColors } from '../../../config';

function getColorForVegetation(vegType: string): HexColor {
  const typeNormalized = vegType.toLowerCase();
  const map = groundColors.vegetation as Record<string, string | undefined>;
  return map[typeNormalized] ?? groundColors.vegetation.default;
}

/**
 * Extracts common 3D vegetation attributes from OSM tags.
 */
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

/**
 * Classifies vegetation features including natural=* vegetation and landuse=forest.
 * For forest: always tall, no height extraction.
 * For other vegetation: extracts height and categorizes.
 */
export function classifyVegetation(
  id: string,
  tags: Record<string, string>,
  geometry: ClassifiedGeometry,
  features: ContextDataTile['features'],
  isForest: boolean
): void {
  const attrs = extract3DAttributes(tags);

  if (isForest) {
    if (!geometry.polygon) return;
    const vegetation: VegetationVisual = {
      id,
      geometry: geometry.polygon,
      type: 'forest',
      height: undefined,
      heightCategory: 'tall',
      color: getColorForVegetation('forest'),
      ...attrs,
    };
    features.vegetation.push(vegetation);
    return;
  }

  const vegType: string = tags.natural || 'vegetation';
  const geom = geometry.isClosed
    ? geometry.polygon
    : (geometry.line ?? geometry.point);
  if (!geom) return;
  const height = tags.height ? parseFloat(tags.height) : undefined;
  const vegetation: VegetationVisual = {
    id,
    geometry: geom,
    type: vegType,
    height,
    heightCategory: getHeightCategory(height),
    color: getColorForVegetation(vegType),
    ...attrs,
  };
  features.vegetation.push(vegetation);
}
