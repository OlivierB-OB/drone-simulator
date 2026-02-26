import type { ContextDataTile, RoadVisual, HexColor } from '../types';
import type { ClassifiedGeometry } from './parserUtils';
import { roadSpec, surfaceColors } from '../../../config';

function getRoadWidthMeters(type: string): number {
  return (
    roadSpec[type.toLowerCase()]?.widthMeters ??
    roadSpec['default']?.widthMeters ??
    7
  );
}

function getColorForRoad(roadType: string): HexColor {
  return (
    roadSpec[roadType.toLowerCase()]?.color ??
    roadSpec['default']?.color ??
    '#c8c0b8'
  );
}

function getRoadSurfaceColor(surface?: string): HexColor | undefined {
  if (!surface) return undefined;
  return surfaceColors[surface.toLowerCase()];
}

export function classifyRoad(
  id: string,
  tags: Record<string, string>,
  geometry: ClassifiedGeometry,
  features: ContextDataTile['features']
): void {
  if (!geometry.line) return;
  const highwayType = tags.highway!.toLowerCase();
  const road: RoadVisual = {
    id,
    geometry: geometry.line,
    type: tags.highway!,
    widthMeters: getRoadWidthMeters(highwayType),
    laneCount: tags.lanes ? parseInt(tags.lanes, 10) : undefined,
    color: getColorForRoad(highwayType),
    surfaceColor: getRoadSurfaceColor(tags.surface),
    treeLined: tags.tree_lined as RoadVisual['treeLined'],
    bridge: tags.bridge === 'yes' ? true : undefined,
    layer: tags.layer ? parseInt(tags.layer, 10) : undefined,
  };
  features.roads.push(road);
}
