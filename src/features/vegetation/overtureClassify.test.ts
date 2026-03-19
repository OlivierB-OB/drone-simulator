import { describe, it, expect } from 'vitest';
import { classifyOvertureVegetation } from './overtureClassify';
import type { Point, LineString, Polygon } from 'geojson';

const POINT: Point = { type: 'Point', coordinates: [0, 0] };
const LINE: LineString = {
  type: 'LineString',
  coordinates: [
    [0, 0],
    [1, 1],
  ],
};
const POLYGON: Polygon = {
  type: 'Polygon',
  coordinates: [
    [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
      [0, 0],
    ],
  ],
};

describe('classifyOvertureVegetation', () => {
  it('remaps land_cover tree Polygon to forest', () => {
    const result = classifyOvertureVegetation(
      'id1',
      { class: 'tree' },
      POLYGON
    );
    expect(result.type).toBe('forest');
  });

  it('keeps class=tree for Point geometry (individual tree)', () => {
    const result = classifyOvertureVegetation('id2', { class: 'tree' }, POINT);
    expect(result.type).toBe('tree');
  });

  it('remaps class=tree LineString to forest (not an individual tree)', () => {
    const result = classifyOvertureVegetation('id3', { class: 'tree' }, LINE);
    expect(result.type).toBe('forest');
  });

  it('passes forest Polygon through unchanged with heightCategory=tall', () => {
    const result = classifyOvertureVegetation(
      'id4',
      { class: 'forest' },
      POLYGON
    );
    expect(result.type).toBe('forest');
    expect(result.heightCategory).toBe('tall');
  });

  it('individual tree Point gets heightCategory=medium (not forced tall)', () => {
    const result = classifyOvertureVegetation('id5', { class: 'tree' }, POINT);
    expect(result.heightCategory).toBe('medium');
  });

  it('scrub Polygon is unaffected by tree remap', () => {
    const result = classifyOvertureVegetation(
      'id6',
      { class: 'scrub' },
      POLYGON
    );
    expect(result.type).toBe('scrub');
  });

  it('wood Polygon has heightCategory=tall', () => {
    const result = classifyOvertureVegetation(
      'id7',
      { class: 'wood' },
      POLYGON
    );
    expect(result.type).toBe('wood');
    expect(result.heightCategory).toBe('tall');
  });
});
