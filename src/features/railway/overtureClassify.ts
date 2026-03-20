import type { RailwayVisual } from './types';
import type { LineString } from 'geojson';
import { railwaySpec } from '../../config';
import {
  parseFlagRules,
  getTunnelRanges,
  parseLevelRules,
  getUndergroundRanges,
  mergeRanges,
  splitExcluding,
} from '../flagRuleUtils';

export function classifyOvertureRailway(
  id: string,
  props: Record<string, unknown>,
  geometry: LineString
): RailwayVisual[] {
  const railType = (props.class as string) ?? 'rail';
  const spec = railwaySpec[railType] ?? railwaySpec['default']!;

  const visual: Omit<RailwayVisual, 'geometry'> = {
    id,
    type: railType,
    widthMeters: spec.widthMeters,
    dash: spec.dash,
    color: spec.color,
    bridge: props.is_bridge === true ? true : undefined,
    layer:
      typeof props.layer === 'number' ? (props.layer as number) : undefined,
  };

  const flagRules = parseFlagRules(props.rail_flags);
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
