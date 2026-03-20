import type { LineString } from 'geojson';

interface FlagRule {
  values: string[];
  between?: [number, number];
}

export function parseFlagRules(raw: unknown): FlagRule[] {
  if (!raw) return [];
  let parsed: unknown = raw;
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(parsed)) return [];
  const rules: FlagRule[] = [];
  for (const r of parsed) {
    if (!r || typeof r !== 'object' || !Array.isArray(r.values)) continue;
    const values = (r.values as unknown[]).filter(
      (v): v is string => typeof v === 'string'
    );
    const between =
      Array.isArray(r.between) &&
      r.between.length === 2 &&
      typeof r.between[0] === 'number' &&
      typeof r.between[1] === 'number'
        ? (r.between as [number, number])
        : undefined;
    rules.push({ values, between });
  }
  return rules;
}

export function mergeRanges(ranges: [number, number][]): [number, number][] {
  if (ranges.length === 0) return [];
  const sorted = [...ranges].sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [[sorted[0]![0], sorted[0]![1]]];
  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1]!;
    const cur = sorted[i]!;
    if (cur[0] <= last[1]) {
      last[1] = Math.max(last[1], cur[1]);
    } else {
      merged.push([cur[0], cur[1]]);
    }
  }
  return merged;
}

export function getTunnelRanges(rules: FlagRule[]): [number, number][] {
  const ranges: [number, number][] = [];
  for (const rule of rules) {
    if (rule.values.includes('is_tunnel')) {
      ranges.push(rule.between !== undefined ? rule.between : [0, 1]);
    }
  }
  return mergeRanges(ranges);
}

interface LevelRule {
  level: number;
  between?: [number, number];
}

export function parseLevelRules(raw: unknown): LevelRule[] {
  if (!raw) return [];
  let parsed: unknown = raw;
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(parsed)) return [];
  const rules: LevelRule[] = [];
  for (const r of parsed) {
    if (!r || typeof r !== 'object' || typeof r.level !== 'number') continue;
    const between =
      Array.isArray(r.between) &&
      r.between.length === 2 &&
      typeof r.between[0] === 'number' &&
      typeof r.between[1] === 'number'
        ? (r.between as [number, number])
        : undefined;
    rules.push({ level: r.level as number, between });
  }
  return rules;
}

export function getUndergroundRanges(rules: LevelRule[]): [number, number][] {
  const ranges: [number, number][] = [];
  for (const rule of rules) {
    if (rule.level < 0) {
      ranges.push(rule.between !== undefined ? rule.between : [0, 1]);
    }
  }
  return mergeRanges(ranges);
}

export function splitExcluding(
  line: LineString,
  excludeRanges: [number, number][]
): LineString[] {
  if (excludeRanges.length === 0) return [line];

  const coords = line.coordinates;

  // Compute cumulative Euclidean distances along the coordinate array
  const cumDist: number[] = [0];
  for (let i = 1; i < coords.length; i++) {
    const latRad =
      ((coords[i]![1]! + coords[i - 1]![1]!) / 2) * (Math.PI / 180);
    const dx = (coords[i]![0]! - coords[i - 1]![0]!) * Math.cos(latRad);
    const dy = coords[i]![1]! - coords[i - 1]![1]!;
    cumDist.push(cumDist[i - 1]! + Math.sqrt(dx * dx + dy * dy));
  }
  const totalLen = cumDist[cumDist.length - 1]!;
  if (totalLen === 0) return [];

  // Interpolate a point at distance d along the line
  function pointAtDist(d: number): number[] {
    d = Math.max(0, Math.min(d, totalLen));
    for (let i = 1; i < cumDist.length; i++) {
      if (cumDist[i]! >= d) {
        const segLen = cumDist[i]! - cumDist[i - 1]!;
        const t = segLen === 0 ? 0 : (d - cumDist[i - 1]!) / segLen;
        const p0 = coords[i - 1]!;
        const p1 = coords[i]!;
        return [p0[0]! + t * (p1[0]! - p0[0]!), p0[1]! + t * (p1[1]! - p0[1]!)];
      }
    }
    return [...coords[coords.length - 1]!];
  }

  // Collect coords strictly between startD and endD, plus interpolated endpoints
  function sliceCoords(startD: number, endD: number): number[][] {
    const result: number[][] = [pointAtDist(startD)];
    for (let i = 0; i < coords.length; i++) {
      const d = cumDist[i]!;
      if (d > startD && d < endD) result.push([...coords[i]!]);
    }
    result.push(pointAtDist(endD));
    return result;
  }

  // Build complement (non-excluded) ranges in [0,1]
  const complement: [number, number][] = [];
  let cursor = 0;
  for (const [a, b] of excludeRanges) {
    if (cursor < a) complement.push([cursor, a]);
    cursor = Math.max(cursor, b);
  }
  if (cursor < 1) complement.push([cursor, 1]);

  const result: LineString[] = [];
  for (const [a, b] of complement) {
    if (b <= a) continue;
    const startD = a * totalLen;
    const endD = b * totalLen;
    if (endD - startD === 0) continue;
    const sliced = sliceCoords(startD, endD);
    if (sliced.length >= 2) {
      result.push({ type: 'LineString', coordinates: sliced });
    }
  }
  return result;
}
