import type { RailwayVisual } from './types';
import type { LineString } from 'geojson';
import { railwaySpec } from '../../config';

export function classifyOvertureRailway(
  id: string,
  props: Record<string, unknown>,
  geometry: LineString
): RailwayVisual {
  const railType = (props.class as string) ?? 'rail';
  const spec = railwaySpec[railType] ?? railwaySpec['default']!;

  return {
    id,
    geometry,
    type: railType,
    trackCount: 1,
    widthMeters: spec.widthMeters,
    dash: spec.dash,
    color: spec.color,
    bridge: props.is_bridge === true ? true : undefined,
    layer:
      typeof props.layer === 'number' ? (props.layer as number) : undefined,
  };
}
