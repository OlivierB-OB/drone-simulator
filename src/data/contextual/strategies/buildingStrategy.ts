import type { ContextDataTile, BuildingVisual, HexColor } from '../types';
import type { ClassifiedGeometry } from './parserUtils';
import {
  colorPalette,
  buildingMaterialColors,
  roofMaterialColors,
} from '../../../config';

function getColorForBuilding(
  tags: Record<string, string>,
  buildingType: string
): HexColor {
  // Priority 1: explicit building:colour tag
  if (tags['building:colour']) return tags['building:colour'];
  // Priority 2: building:material lookup
  const material = tags['building:material'];
  if (material && buildingMaterialColors[material]) {
    return buildingMaterialColors[material]!;
  }
  // Priority 3: type-based default
  const colors = colorPalette.buildings as Record<string, HexColor>;
  return (colors[buildingType] || colors.default) as HexColor;
}

function getRoofColor(tags: Record<string, string>): HexColor | undefined {
  // Priority 1: explicit roof:colour tag
  if (tags['roof:colour']) return tags['roof:colour'];
  // Priority 2: roof:material lookup
  const material = tags['roof:material'];
  if (material && roofMaterialColors[material]) {
    return roofMaterialColors[material]!;
  }
  return undefined;
}

export function classifyBuilding(
  id: string,
  tags: Record<string, string>,
  geometry: ClassifiedGeometry,
  features: ContextDataTile['features']
): void {
  const height = tags.height ? parseFloat(tags.height) : undefined;
  const levels = tags['building:levels']
    ? parseInt(tags['building:levels'], 10)
    : undefined;
  const minHeight = tags.min_height ? parseFloat(tags.min_height) : undefined;
  const minLevels = tags['building:min_level']
    ? parseInt(tags['building:min_level'], 10)
    : undefined;

  const buildingType = tags['building:type'] || tags.building || 'other';
  const geom = geometry.polygon ?? geometry.line ?? geometry.point;
  if (!geom) return;
  const building: BuildingVisual = {
    id,
    geometry: geom,
    type: buildingType,
    height,
    minHeight,
    levelCount: levels,
    minLevelCount: minLevels,
    color: getColorForBuilding(tags, buildingType),
    roofColor: getRoofColor(tags),
    roofShape: tags['roof:shape'],
    roofHeight: tags['roof:height']
      ? parseFloat(tags['roof:height'])
      : undefined,
    roofDirection: tags['roof:direction']
      ? parseFloat(tags['roof:direction'])
      : undefined,
    isPart: tags['building:part'] === 'yes',
  };
  features.buildings.push(building);
}
