import type { BuildingVisual } from './types';
import type { LineString, Point, Polygon } from 'geojson';
import { colorPalette, roofMaterialColors } from '../../config';
import type { HexColor } from '../sharedTypes';

function getColorFromFacade(
  facadeColor?: string,
  buildingType?: string
): HexColor {
  if (facadeColor) return facadeColor;
  const colors = colorPalette.buildings as Record<string, HexColor>;
  return (colors[buildingType ?? 'default'] || colors.default) as HexColor;
}

function getRoofColorFromProps(
  roofMaterial?: string,
  roofColor?: string
): HexColor | undefined {
  if (roofMaterial && roofMaterialColors[roofMaterial]) {
    return roofMaterialColors[roofMaterial]!;
  }
  return roofColor ?? undefined;
}

export function classifyOvertureBuilding(
  id: string,
  props: Record<string, unknown>,
  geometry: Polygon | LineString | Point,
  isPart?: boolean
): BuildingVisual {
  const buildingClass = (props.class as string) ?? 'other';
  const height = typeof props.height === 'number' ? props.height : undefined;
  const numFloors =
    typeof props.num_floors === 'number' ? props.num_floors : undefined;
  const minHeight =
    typeof props.min_height === 'number' ? props.min_height : undefined;

  return {
    id,
    geometry,
    type: buildingClass,
    height,
    minHeight,
    levelCount: numFloors,
    color: getColorFromFacade(
      props.facade_color as string | undefined,
      buildingClass
    ),
    roofColor: getRoofColorFromProps(
      props.roof_material as string | undefined,
      props.roof_color as string | undefined
    ),
    roofShape: (props.roof_shape as string) ?? undefined,
    roofHeight:
      typeof props.roof_height === 'number' ? props.roof_height : undefined,
    roofDirection:
      typeof props.roof_direction === 'number'
        ? props.roof_direction
        : undefined,
    roofOrientation:
      props.roof_orientation === 'across'
        ? 'across'
        : props.roof_orientation === 'along'
          ? 'along'
          : undefined,
    isPart: isPart ?? false,
  };
}
