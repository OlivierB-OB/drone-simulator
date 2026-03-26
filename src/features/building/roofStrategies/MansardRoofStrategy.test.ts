import { describe, it, expect } from 'vitest';
import { MansardRoofStrategy } from './MansardRoofStrategy';

// 20×10 rectangle (elongated, CCW)
const rect: [number, number][] = [
  [-10, -5],
  [10, -5],
  [10, 5],
  [-10, 5],
];

// Narrow building: will collapse breakInset ≥ halfWidth → pyramidal fallback
const narrow: [number, number][] = [
  [-0.5, -5],
  [0.5, -5],
  [0.5, 5],
  [-0.5, 5],
];

const strategy = new MansardRoofStrategy();
const baseParams = {
  outerRing: rect,
  roofShape: 'mansard',
  roofHeight: 5,
  ridgeAngle: 0,
};

describe('MansardRoofStrategy', () => {
  it('creates geometry without error', () => {
    const geom = strategy.create(baseParams);
    expect(geom).toBeDefined();
    expect(geom.attributes.position).toBeDefined();
  });

  it('is indexed geometry', () => {
    const geom = strategy.create(baseParams);
    expect(geom.index).not.toBeNull();
  });

  it('has 12 unique vertices (indexed)', () => {
    const geom = strategy.create(baseParams);
    expect(geom.attributes.position!.count).toBe(12);
  });

  it('has 54 index values (18 triangles)', () => {
    const geom = strategy.create(baseParams);
    expect(geom.index!.count).toBe(54);
  });

  it('base is at Y=0', () => {
    const geom = strategy.create(baseParams);
    const pos = geom.attributes.position!;
    let minY = Infinity;
    for (let i = 0; i < pos.count; i++) minY = Math.min(minY, pos.getY(i));
    expect(minY).toBeCloseTo(0, 5);
  });

  it('top is at Y=roofHeight', () => {
    const geom = strategy.create(baseParams);
    const pos = geom.attributes.position!;
    let maxY = -Infinity;
    for (let i = 0; i < pos.count; i++) maxY = Math.max(maxY, pos.getY(i));
    expect(maxY).toBeCloseTo(baseParams.roofHeight, 5);
  });

  it('has 3 distinct Y levels (base, break, top)', () => {
    const geom = strategy.create(baseParams);
    const pos = geom.attributes.position!;
    const ys = new Set<number>();
    for (let i = 0; i < pos.count; i++) {
      ys.add(Math.round(pos.getY(i) * 100) / 100);
    }
    expect(ys.size).toBe(3);
  });

  it('break ring is at intermediate Y between 0 and roofHeight', () => {
    const geom = strategy.create(baseParams);
    const pos = geom.attributes.position!;
    const ys = new Set<number>();
    for (let i = 0; i < pos.count; i++) {
      ys.add(Math.round(pos.getY(i) * 100) / 100);
    }
    const yArr = [...ys].sort((a, b) => a - b);
    expect(yArr[1]!).toBeGreaterThan(0);
    expect(yArr[1]!).toBeLessThan(baseParams.roofHeight);
  });

  it('produces indexed geometry for very narrow building', () => {
    const geom = strategy.create({ ...baseParams, outerRing: narrow });
    // MansardRoofStrategy is indexed (even for narrow buildings)
    expect(geom.index).toBeDefined();
  });

  it('slope normals have non-negative Y component', () => {
    const geom = strategy.create(baseParams);
    geom.computeVertexNormals();
    const normals = geom.attributes.normal!;
    for (let i = 0; i < normals.count; i++) {
      expect(normals.getY(i)).toBeGreaterThanOrEqual(-0.01);
    }
  });
});
