import { describe, it, expect } from 'vitest';
import {
  parseFlagRules,
  getTunnelRanges,
  parseLevelRules,
  getUndergroundRanges,
  mergeRanges,
  splitExcluding,
} from './flagRuleUtils';
import type { LineString } from 'geojson';

// ─── parseFlagRules ───────────────────────────────────────────────────────────

describe('parseFlagRules', () => {
  it('parses a JSON string with tunnel flag (no between)', () => {
    const raw = '[{"values":["is_tunnel"]}]';
    const rules = parseFlagRules(raw);
    expect(rules).toHaveLength(1);
    expect(rules[0]!.values).toEqual(['is_tunnel']);
    expect(rules[0]!.between).toBeUndefined();
  });

  it('parses a JSON string with between range', () => {
    const raw = '[{"values":["is_tunnel"],"between":[0.3,0.8]}]';
    const rules = parseFlagRules(raw);
    expect(rules).toHaveLength(1);
    expect(rules[0]!.between).toEqual([0.3, 0.8]);
  });

  it('parses an already-parsed array (object input)', () => {
    const raw = [{ values: ['is_tunnel'], between: [0.1, 0.9] }];
    const rules = parseFlagRules(raw);
    expect(rules).toHaveLength(1);
    expect(rules[0]!.values).toEqual(['is_tunnel']);
    expect(rules[0]!.between).toEqual([0.1, 0.9]);
  });

  it('returns empty array for null input', () => {
    expect(parseFlagRules(null)).toEqual([]);
  });

  it('returns empty array for undefined input', () => {
    expect(parseFlagRules(undefined)).toEqual([]);
  });

  it('returns empty array for malformed JSON string', () => {
    expect(parseFlagRules('{not valid json')).toEqual([]);
  });

  it('returns empty array for non-array JSON', () => {
    expect(parseFlagRules('{"values":["is_tunnel"]}')).toEqual([]);
  });

  it('skips entries without values array', () => {
    const raw = '[{"flags":["is_tunnel"]},{"values":["is_bridge"]}]';
    const rules = parseFlagRules(raw);
    expect(rules).toHaveLength(1);
    expect(rules[0]!.values).toEqual(['is_bridge']);
  });

  it('ignores between if not a 2-element number array', () => {
    const raw = '[{"values":["is_tunnel"],"between":["a","b"]}]';
    const rules = parseFlagRules(raw);
    expect(rules[0]!.between).toBeUndefined();
  });

  it('parses multiple rules', () => {
    const raw =
      '[{"values":["is_tunnel"],"between":[0.0,0.5]},{"values":["is_bridge"],"between":[0.6,1.0]}]';
    const rules = parseFlagRules(raw);
    expect(rules).toHaveLength(2);
    expect(rules[0]!.values).toEqual(['is_tunnel']);
    expect(rules[1]!.values).toEqual(['is_bridge']);
  });
});

// ─── getTunnelRanges ──────────────────────────────────────────────────────────

describe('getTunnelRanges', () => {
  it('returns empty array when no tunnel rules', () => {
    const rules = [{ values: ['is_bridge'] }];
    expect(getTunnelRanges(rules)).toEqual([]);
  });

  it('returns [0,1] for full-segment tunnel (no between)', () => {
    const rules = [{ values: ['is_tunnel'] }];
    expect(getTunnelRanges(rules)).toEqual([[0, 1]]);
  });

  it('returns the between range for partial tunnel', () => {
    const rules = [
      { values: ['is_tunnel'], between: [0.3, 0.7] as [number, number] },
    ];
    expect(getTunnelRanges(rules)).toEqual([[0.3, 0.7]]);
  });

  it('returns multiple non-overlapping ranges sorted', () => {
    const rules = [
      { values: ['is_tunnel'], between: [0.6, 0.8] as [number, number] },
      { values: ['is_tunnel'], between: [0.1, 0.3] as [number, number] },
    ];
    expect(getTunnelRanges(rules)).toEqual([
      [0.1, 0.3],
      [0.6, 0.8],
    ]);
  });

  it('merges overlapping ranges', () => {
    const rules = [
      { values: ['is_tunnel'], between: [0.1, 0.5] as [number, number] },
      { values: ['is_tunnel'], between: [0.4, 0.8] as [number, number] },
    ];
    expect(getTunnelRanges(rules)).toEqual([[0.1, 0.8]]);
  });

  it('merges adjacent ranges', () => {
    const rules = [
      { values: ['is_tunnel'], between: [0.0, 0.5] as [number, number] },
      { values: ['is_tunnel'], between: [0.5, 1.0] as [number, number] },
    ];
    expect(getTunnelRanges(rules)).toEqual([[0.0, 1.0]]);
  });

  it('ignores non-tunnel flags', () => {
    const rules = [
      { values: ['is_bridge'], between: [0.0, 0.5] as [number, number] },
      { values: ['is_tunnel'], between: [0.6, 0.9] as [number, number] },
    ];
    expect(getTunnelRanges(rules)).toEqual([[0.6, 0.9]]);
  });
});

// ─── parseLevelRules ──────────────────────────────────────────────────────────

describe('parseLevelRules', () => {
  it('parses array with level and between', () => {
    const rules = parseLevelRules([{ level: -1, between: [0.2, 0.8] }]);
    expect(rules).toHaveLength(1);
    expect(rules[0]!.level).toBe(-1);
    expect(rules[0]!.between).toEqual([0.2, 0.8]);
  });

  it('parses entry without between — between is undefined', () => {
    const rules = parseLevelRules([{ level: -1 }]);
    expect(rules).toHaveLength(1);
    expect(rules[0]!.level).toBe(-1);
    expect(rules[0]!.between).toBeUndefined();
  });

  it('parses positive level entries', () => {
    const rules = parseLevelRules([{ level: 1 }, { level: 0 }]);
    expect(rules).toHaveLength(2);
    expect(rules[0]!.level).toBe(1);
    expect(rules[1]!.level).toBe(0);
  });

  it('ignores entries without a numeric level', () => {
    const rules = parseLevelRules([{ level: 'underground' }, { level: -1 }]);
    expect(rules).toHaveLength(1);
    expect(rules[0]!.level).toBe(-1);
  });

  it('parses JSON string input', () => {
    const rules = parseLevelRules('[{"level":-1,"between":[0.0,1.0]}]');
    expect(rules).toHaveLength(1);
    expect(rules[0]!.level).toBe(-1);
    expect(rules[0]!.between).toEqual([0.0, 1.0]);
  });

  it('returns empty array for null input', () => {
    expect(parseLevelRules(null)).toEqual([]);
  });

  it('returns empty array for non-array JSON', () => {
    expect(parseLevelRules('{"level":-1}')).toEqual([]);
  });

  it('returns empty array for malformed JSON string', () => {
    expect(parseLevelRules('{not valid')).toEqual([]);
  });

  it('ignores between if not a 2-element number array', () => {
    const rules = parseLevelRules([{ level: -1, between: ['a', 'b'] }]);
    expect(rules[0]!.between).toBeUndefined();
  });
});

// ─── getUndergroundRanges ─────────────────────────────────────────────────────

describe('getUndergroundRanges', () => {
  it('returns empty array for empty input', () => {
    expect(getUndergroundRanges([])).toEqual([]);
  });

  it('returns empty array when all entries have level >= 0', () => {
    const rules = [{ level: 0 }, { level: 1 }, { level: 2 }];
    expect(getUndergroundRanges(rules)).toEqual([]);
  });

  it('returns [0,1] for negative level without between', () => {
    expect(getUndergroundRanges([{ level: -1 }])).toEqual([[0, 1]]);
  });

  it('returns the between range for negative level with between', () => {
    expect(getUndergroundRanges([{ level: -2, between: [0.3, 0.7] }])).toEqual([
      [0.3, 0.7],
    ]);
  });

  it('merges multiple negative entries', () => {
    const rules = [
      { level: -1, between: [0.0, 0.4] as [number, number] },
      { level: -1, between: [0.3, 0.7] as [number, number] },
    ];
    expect(getUndergroundRanges(rules)).toEqual([[0.0, 0.7]]);
  });

  it('returns only ranges for negative entries (ignores positive)', () => {
    const rules = [
      { level: 1, between: [0.0, 0.5] as [number, number] },
      { level: -1, between: [0.6, 1.0] as [number, number] },
    ];
    expect(getUndergroundRanges(rules)).toEqual([[0.6, 1.0]]);
  });
});

// ─── mergeRanges ──────────────────────────────────────────────────────────────

describe('mergeRanges', () => {
  it('returns empty array for empty input', () => {
    expect(mergeRanges([])).toEqual([]);
  });

  it('returns single range unchanged', () => {
    expect(mergeRanges([[0.2, 0.8]])).toEqual([[0.2, 0.8]]);
  });

  it('merges overlapping ranges from two sources', () => {
    const tunnelRanges: [number, number][] = [[0.1, 0.5]];
    const undergroundRanges: [number, number][] = [[0.4, 0.8]];
    expect(mergeRanges([...tunnelRanges, ...undergroundRanges])).toEqual([
      [0.1, 0.8],
    ]);
  });

  it('keeps non-overlapping ranges from two sources separate', () => {
    const tunnelRanges: [number, number][] = [[0.0, 0.3]];
    const undergroundRanges: [number, number][] = [[0.6, 1.0]];
    expect(mergeRanges([...tunnelRanges, ...undergroundRanges])).toEqual([
      [0.0, 0.3],
      [0.6, 1.0],
    ]);
  });

  it('merges adjacent ranges', () => {
    expect(
      mergeRanges([
        [0.0, 0.5],
        [0.5, 1.0],
      ])
    ).toEqual([[0.0, 1.0]]);
  });

  it('does not mutate the input array', () => {
    const input: [number, number][] = [
      [0.5, 1.0],
      [0.0, 0.3],
    ];
    mergeRanges(input);
    expect(input[0]).toEqual([0.5, 1.0]);
  });
});

// ─── splitExcluding ───────────────────────────────────────────────────────────

// A simple horizontal line from x=0 to x=1 (in degrees), roughly ~111 km
const LINE: LineString = {
  type: 'LineString',
  coordinates: [
    [0, 0],
    [0.333, 0],
    [0.667, 0],
    [1, 0],
  ],
};

describe('splitExcluding', () => {
  it('returns original geometry when no exclusions', () => {
    const result = splitExcluding(LINE, []);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(LINE);
  });

  it('returns empty array when full segment is excluded', () => {
    const result = splitExcluding(LINE, [[0, 1]]);
    expect(result).toHaveLength(0);
  });

  it('excludes start portion — returns only end segment', () => {
    const result = splitExcluding(LINE, [[0, 0.5]]);
    expect(result).toHaveLength(1);
    const coords = result[0]!.coordinates;
    expect(coords.length).toBeGreaterThanOrEqual(2);
    expect(coords[0]![0]).toBeGreaterThan(0.4);
  });

  it('excludes end portion — returns only start segment', () => {
    const result = splitExcluding(LINE, [[0.5, 1]]);
    expect(result).toHaveLength(1);
    const coords = result[0]!.coordinates;
    expect(coords.length).toBeGreaterThanOrEqual(2);
    expect(coords[coords.length - 1]![0]).toBeLessThan(0.6);
  });

  it('middle exclusion returns two segments', () => {
    const result = splitExcluding(LINE, [[0.3, 0.7]]);
    expect(result).toHaveLength(2);
    const seg0 = result[0]!;
    const seg1 = result[1]!;
    const firstEnd = seg0.coordinates[seg0.coordinates.length - 1]![0];
    const secondStart = seg1.coordinates[0]![0];
    expect(firstEnd).toBeLessThan(secondStart as number);
  });

  it('each result is a valid LineString with at least 2 coords', () => {
    const result = splitExcluding(LINE, [
      [0.2, 0.4],
      [0.6, 0.8],
    ]);
    expect(result.length).toBeGreaterThan(0);
    for (const seg of result) {
      expect(seg.type).toBe('LineString');
      expect(seg.coordinates.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('corrects directional bias on L-shaped line at 45°N', () => {
    // Segment A: east-west, 1° lon at 45°N ≈ 78 km (cos(45°) ≈ 0.707)
    // Segment B: north-south, 1° lat ≈ 111 km
    // Metric-corrected cumDist: [0, 0.707, 1.707]
    // totalLen = 1.707; midpoint at 0.5 * totalLen = 0.854
    // 0.854 > 0.707 → midpoint lands inside segment B (lat > 45°)
    const lShaped: LineString = {
      type: 'LineString',
      coordinates: [
        [0, 45], // start: corner
        [1, 45], // end of A: 1° east, still at 45°N
        [1, 46], // end of B: 1° north
      ],
    };
    // Exclude first half [0, 0.5] — should cut into segment B
    const result = splitExcluding(lShaped, [[0, 0.5]]);
    expect(result).toHaveLength(1);
    const startCoord = result[0]!.coordinates[0]!;
    // The cut point must be inside segment B: lon=1, lat strictly between 45 and 46
    expect(startCoord[0]).toBeCloseTo(1, 5);
    expect(startCoord[1]).toBeGreaterThan(45);
    expect(startCoord[1]).toBeLessThan(46);
  });
});
