import { describe, it, expect } from 'vitest';
import { HalfHippedRoofStrategy } from './HalfHippedRoofStrategy';

// 20×10 rectangle (elongated, centred at origin, CCW)
const rect: [number, number][] = [
  [-10, -5],
  [10, -5],
  [10, 5],
  [-10, 5],
];

const strategy = new HalfHippedRoofStrategy();
const baseParams = {
  outerRing: rect,
  roofShape: 'half-hipped',
  roofHeight: 5,
  ridgeAngle: 0,
};

describe('HalfHippedRoofStrategy', () => {
  it('creates geometry without error', () => {
    const geom = strategy.create(baseParams);
    expect(geom).toBeDefined();
    expect(geom.attributes.position).toBeDefined();
  });

  it('is indexed geometry', () => {
    const geom = strategy.create(baseParams);
    expect(geom.index).not.toBeNull();
  });

  it('has 10 unique vertices (indexed)', () => {
    const geom = strategy.create(baseParams);
    expect(geom.attributes.position!.count).toBe(10);
  });

  it('has 42 index values (14 triangles)', () => {
    const geom = strategy.create(baseParams);
    expect(geom.index!.count).toBe(42);
  });

  it('base is at Y=0', () => {
    const geom = strategy.create(baseParams);
    const pos = geom.attributes.position!;
    let minY = Infinity;
    for (let i = 0; i < pos.count; i++) minY = Math.min(minY, pos.getY(i));
    expect(minY).toBeCloseTo(0, 5);
  });

  it('apex is at Y=roofHeight', () => {
    const geom = strategy.create(baseParams);
    const pos = geom.attributes.position!;
    let maxY = -Infinity;
    for (let i = 0; i < pos.count; i++) maxY = Math.max(maxY, pos.getY(i));
    expect(maxY).toBeCloseTo(baseParams.roofHeight, 5);
  });

  it('has 3 distinct Y levels: 0, hipH, roofHeight', () => {
    const geom = strategy.create(baseParams);
    const pos = geom.attributes.position!;
    const ys = new Set<number>();
    for (let i = 0; i < pos.count; i++) {
      ys.add(Math.round(pos.getY(i) * 1000) / 1000);
    }
    expect(ys.size).toBe(3);
  });

  it('hip points are at 30% of roofHeight', () => {
    const geom = strategy.create(baseParams);
    const pos = geom.attributes.position!;
    const ys = new Set<number>();
    for (let i = 0; i < pos.count; i++) {
      ys.add(Math.round(pos.getY(i) * 1000) / 1000);
    }
    const yArr = [...ys].sort((a, b) => a - b);
    // Middle Y level should be 30% of roofHeight = 1.5
    expect(yArr[1]).toBeCloseTo(baseParams.roofHeight * 0.3, 3);
  });

  it('all heights are in [0, roofHeight]', () => {
    const geom = strategy.create(baseParams);
    const pos = geom.attributes.position!;
    for (let i = 0; i < pos.count; i++) {
      expect(pos.getY(i)).toBeGreaterThanOrEqual(-1e-6);
      expect(pos.getY(i)).toBeLessThanOrEqual(baseParams.roofHeight + 1e-6);
    }
  });

  it('ridge vertex normals have positive Y', () => {
    const geom = strategy.create(baseParams);
    const norm = geom.attributes.normal!;
    // Vertices 4 (R0) and 5 (R1) are the ridge endpoints
    expect(norm.getY(4)).toBeGreaterThan(0);
    expect(norm.getY(5)).toBeGreaterThan(0);
  });
});
