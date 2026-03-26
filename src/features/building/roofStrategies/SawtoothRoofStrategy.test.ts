import { describe, it, expect } from 'vitest';
import { SawtoothRoofStrategy } from './SawtoothRoofStrategy';

// 20×10 rectangle (CCW)
const rect: [number, number][] = [
  [-10, -5],
  [10, -5],
  [10, 5],
  [-10, 5],
];

// Wide building: 20×30m rectangle → halfWidth=10 (X), halfLength=15 (Y), N=floor(20/5)=4 bays
const wide: [number, number][] = [
  [-10, -15],
  [10, -15],
  [10, 15],
  [-10, 15],
];

// Very narrow (degenerate)
const degenerate: [number, number][] = [
  [-5, -0.0001],
  [5, -0.0001],
  [5, 0.0001],
  [-5, 0.0001],
];

const strategy = new SawtoothRoofStrategy();
const baseParams = {
  outerRing: rect,
  roofShape: 'sawtooth',
  roofHeight: 5,
  ridgeAngle: 0,
};

describe('SawtoothRoofStrategy', () => {
  it('creates geometry without error', () => {
    const geom = strategy.create(baseParams);
    expect(geom).toBeDefined();
    expect(geom.attributes.position).toBeDefined();
  });

  it('is non-indexed geometry', () => {
    const geom = strategy.create(baseParams);
    expect(geom.index).toBeNull();
  });

  it('N=2 bays for rect halfWidth=5 (2*5/5=2), produces 2×6×3 = 36 vertices', () => {
    // rect halfWidth = 5; N = floor(10/5) = 2 → clamped to min 2
    const geom = strategy.create(baseParams);
    expect(geom.attributes.position!.count).toBe(2 * 6 * 3);
  });

  it('N=4 bays for wide rect halfWidth=10 (2*10/5=4), produces 4×6×3 = 72 vertices', () => {
    const geom = strategy.create({ ...baseParams, outerRing: wide });
    expect(geom.attributes.position!.count).toBe(4 * 6 * 3);
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
    expect(maxY).toBeCloseTo(baseParams.roofHeight, 5);
  });

  it('has eave vertices at Y=0', () => {
    const geom = strategy.create(baseParams);
    const pos = geom.attributes.position!;
    let minY = Infinity;
    for (let i = 0; i < pos.count; i++) minY = Math.min(minY, pos.getY(i));
    expect(minY).toBeCloseTo(0, 5);
  });

  it('has slope faces with upward-facing normals', () => {
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

  it('degenerate (very narrow) building returns empty geometry', () => {
    const geom = strategy.create({ ...baseParams, outerRing: degenerate });
    // hW ≈ 0.0001 < 1e-3 → early return empty geometry
    const pos = geom.attributes.position;
    expect(pos === undefined || pos.count === 0).toBe(true);
  });

  it('different ridgeAngle produces same vertex count', () => {
    const geomA = strategy.create(baseParams);
    const geomB = strategy.create({ ...baseParams, ridgeAngle: Math.PI / 3 });
    expect(geomA.attributes.position!.count).toBe(
      geomB.attributes.position!.count
    );
  });
});
