import { describe, it, expect } from 'vitest';
import { RoundRoofStrategy } from './RoundRoofStrategy';

// 20×10 rectangle (elongated, CCW)
const rect: [number, number][] = [
  [-10, -5],
  [10, -5],
  [10, 5],
  [-10, 5],
];

// Square (to test axis-swap path when hW > hL would not trigger here, but wide rect would)
const wideRect: [number, number][] = [
  [-5, -10],
  [5, -10],
  [5, 10],
  [-5, 10],
];

const strategy = new RoundRoofStrategy();
const baseParams = {
  outerRing: rect,
  roofShape: 'round',
  roofHeight: 5,
  ridgeAngle: 0,
};
const N = 24;

describe('RoundRoofStrategy', () => {
  it('creates geometry without error', () => {
    const geom = strategy.create(baseParams);
    expect(geom).toBeDefined();
    expect(geom.attributes.position).toBeDefined();
  });

  it('is non-indexed geometry', () => {
    const geom = strategy.create(baseParams);
    expect(geom.index).toBeNull();
  });

  it(`has N*4*3 = ${N * 4 * 3} vertices (${N} strip quads + ${N} near cap + ${N} far cap tris)`, () => {
    const geom = strategy.create(baseParams);
    expect(geom.attributes.position!.count).toBe(N * 4 * 3);
  });

  it('all heights are in [0, roofHeight]', () => {
    const geom = strategy.create(baseParams);
    const pos = geom.attributes.position!;
    for (let i = 0; i < pos.count; i++) {
      expect(pos.getY(i)).toBeGreaterThanOrEqual(-1e-6);
      expect(pos.getY(i)).toBeLessThanOrEqual(baseParams.roofHeight + 1e-6);
    }
  });

  it('has crown vertices at Y=roofHeight', () => {
    const geom = strategy.create(baseParams);
    const pos = geom.attributes.position!;
    let maxY = -Infinity;
    for (let i = 0; i < pos.count; i++) maxY = Math.max(maxY, pos.getY(i));
    expect(maxY).toBeCloseTo(baseParams.roofHeight, 1);
  });

  it('has eave vertices at Y=0', () => {
    const geom = strategy.create(baseParams);
    const pos = geom.attributes.position!;
    let minY = Infinity;
    for (let i = 0; i < pos.count; i++) minY = Math.min(minY, pos.getY(i));
    expect(minY).toBeCloseTo(0, 5);
  });

  it('has upward-facing faces (top surface normals with positive Y)', () => {
    const geom = strategy.create(baseParams);
    const pos = geom.attributes.position!;
    let foundUpward = false;
    for (let t = 0; t < pos.count; t += 3) {
      const ax = pos.getX(t + 1) - pos.getX(t);
      const az = pos.getZ(t + 1) - pos.getZ(t);
      const bx = pos.getX(t + 2) - pos.getX(t);
      const bz = pos.getZ(t + 2) - pos.getZ(t);
      const ny = az * bx - ax * bz;
      if (ny > 0.01) {
        foundUpward = true;
        break;
      }
    }
    expect(foundUpward).toBe(true);
  });

  it('wide rectangle (hW > hL) swaps axes and produces same vertex count', () => {
    const geom = strategy.create({ ...baseParams, outerRing: wideRect });
    expect(geom.attributes.position!.count).toBe(N * 4 * 3);
  });
});
