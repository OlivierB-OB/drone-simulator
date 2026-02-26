import { describe, it, expect } from 'vitest';
import { pointInPolygon, ringCentroid } from './polygonUtils';

// Unit square [0,0]→[1,0]→[1,1]→[0,1]→[0,0]
const square: [number, number][] = [
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1],
  [0, 0],
];

// Open unit square (no closing duplicate)
const squareOpen: [number, number][] = [
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1],
];

// L-shaped concave polygon
const lShape: [number, number][] = [
  [0, 0],
  [2, 0],
  [2, 1],
  [1, 1],
  [1, 2],
  [0, 2],
  [0, 0],
];

describe('pointInPolygon', () => {
  it('detects point inside a unit square', () => {
    expect(pointInPolygon([0.5, 0.5], square)).toBe(true);
  });

  it('detects point outside a unit square', () => {
    expect(pointInPolygon([2, 2], square)).toBe(false);
    expect(pointInPolygon([-0.1, 0.5], square)).toBe(false);
  });

  it('works with open ring (no closing duplicate)', () => {
    expect(pointInPolygon([0.5, 0.5], squareOpen)).toBe(true);
    expect(pointInPolygon([2, 2], squareOpen)).toBe(false);
  });

  it('detects point inside concave L-shape', () => {
    expect(pointInPolygon([0.5, 0.5], lShape)).toBe(true);
    expect(pointInPolygon([1.5, 0.5], lShape)).toBe(true);
  });

  it('detects point outside concave region of L-shape', () => {
    // The notch area (top-right) is outside the L
    expect(pointInPolygon([1.5, 1.5], lShape)).toBe(false);
  });

  it('detects point in a large-coordinate polygon (Mercator scale)', () => {
    const big: [number, number][] = [
      [500000, 6000000],
      [500100, 6000000],
      [500100, 6000100],
      [500000, 6000100],
      [500000, 6000000],
    ];
    expect(pointInPolygon([500050, 6000050], big)).toBe(true);
    expect(pointInPolygon([499999, 6000050], big)).toBe(false);
  });
});

describe('ringCentroid', () => {
  it('computes centroid of closed unit square', () => {
    const [cx, cy] = ringCentroid(square);
    expect(cx).toBeCloseTo(0.5);
    expect(cy).toBeCloseTo(0.5);
  });

  it('computes centroid of open unit square', () => {
    const [cx, cy] = ringCentroid(squareOpen);
    expect(cx).toBeCloseTo(0.5);
    expect(cy).toBeCloseTo(0.5);
  });

  it('computes centroid of a right triangle', () => {
    const triangle: [number, number][] = [
      [0, 0],
      [3, 0],
      [0, 3],
    ];
    const [cx, cy] = ringCentroid(triangle);
    expect(cx).toBeCloseTo(1);
    expect(cy).toBeCloseTo(1);
  });
});
