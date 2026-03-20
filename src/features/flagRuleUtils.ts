import length from '@turf/length';
import lineSliceAlong from '@turf/line-slice-along';
import { lineString } from '@turf/helpers';
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

  const feature = lineString(line.coordinates);
  const totalLen = length(feature, { units: 'meters' });
  if (totalLen === 0) return [];

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
    const startMeters = a * totalLen;
    const endMeters = b * totalLen;
    if (endMeters - startMeters === 0) continue;
    const sliced = lineSliceAlong(feature, startMeters, endMeters, {
      units: 'meters',
    });
    if (sliced.geometry.coordinates.length >= 2) {
      result.push(sliced.geometry);
    }
  }
  return result;
}
