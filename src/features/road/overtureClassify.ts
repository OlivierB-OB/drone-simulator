import type { RoadVisual } from './types';
import type { LineString } from 'geojson';
import { roadSpec, surfaceColors } from '../../config';
import type { HexColor } from '../sharedTypes';
import {
  parseFlagRules,
  getTunnelRanges,
  parseLevelRules,
  getUndergroundRanges,
  mergeRanges,
  splitExcluding,
} from '../flagRuleUtils';

const OVERTURE_TO_HIGHWAY: Record<string, string> = {
  motorway: 'motorway',
  trunk: 'trunk',
  primary: 'primary',
  secondary: 'secondary',
  tertiary: 'tertiary',
  residential: 'residential',
  living_street: 'living_street',
  service: 'service',
  pedestrian: 'pedestrian',
  footway: 'footway',
  cycleway: 'cycleway',
  bridleway: 'bridleway',
  track: 'track',
  path: 'path',
  steps: 'steps',
  unclassified: 'unclassified',
};

export function classifyOvertureRoad(
  id: string,
  props: Record<string, unknown>,
  geometry: LineString
): RoadVisual[] {
  const overtureClass = (props.class as string) ?? 'unclassified';
  const highwayType = OVERTURE_TO_HIGHWAY[overtureClass] ?? 'unclassified';
  const spec = roadSpec[highwayType] ?? roadSpec['default']!;

  const surface = (props.road_surface ?? props.surface) as string | undefined;
  const surfaceColor: HexColor | undefined = surface
    ? surfaceColors[surface.toLowerCase()]
    : undefined;

  const visual: Omit<RoadVisual, 'geometry'> = {
    id,
    type: highwayType,
    widthMeters: spec.widthMeters,
    laneCount:
      typeof props.lanes === 'number' ? (props.lanes as number) : undefined,
    color: spec.color,
    surfaceColor,
    bridge: props.is_bridge === true ? true : undefined,
    layer:
      typeof props.layer === 'number' ? (props.layer as number) : undefined,
  };

  const flagRules = parseFlagRules(props.road_flags);
  const levelRules = parseLevelRules(props.level_rules);
  const tunnelRanges = getTunnelRanges(flagRules);
  const undergroundRanges = getUndergroundRanges(levelRules);
  const excludeRanges = mergeRanges([...tunnelRanges, ...undergroundRanges]);
  const segments = splitExcluding(geometry, excludeRanges);

  return segments.map((geom, i) => ({
    ...visual,
    id: i === 0 ? id : `${id}-${i}`,
    geometry: geom,
  }));
}
