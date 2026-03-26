import { describe, it, expect } from 'vitest';
import { GambrelRoofStrategy } from './GambrelRoofStrategy';

// 10×6 rectangle, centred at origin (CCW)
const rect: [number, number][] = [
  [-5, -3],
  [5, -3],
  [5, 3],
  [-5, 3],
];

// Closed ring variant
const rectClosed: [number, number][] = [...rect, rect[0]!];

const strategy = new GambrelRoofStrategy();
const baseParams = {
  outerRing: rect,
  roofShape: 'gambrel',
  roofHeight: 5,
  ridgeAngle: 0,
};

describe('GambrelRoofStrategy', () => {
  it('creates geometry without error', () => {
    const geom = strategy.create(baseParams);
    expect(geom).toBeDefined();
    expect(geom.attributes.position).toBeDefined();
  });

  it('produces 126 floats (14 triangles × 3 vertices × 3 floats)', () => {
    const geom = strategy.create(baseParams);
    expect(geom.attributes.position!.array.length).toBe(126);
  });

  it('is non-indexed geometry', () => {
    const geom = strategy.create(baseParams);
    expect(geom.index).toBeNull();
  });

  it('all heights are in [0, roofHeight]', () => {
    const geom = strategy.create(baseParams);
    const pos = geom.attributes.position!;
    for (let i = 0; i < pos.count; i++) {
      expect(pos.getY(i)).toBeGreaterThanOrEqual(-1e-6);
      expect(pos.getY(i)).toBeLessThanOrEqual(baseParams.roofHeight + 1e-6);
    }
  });

  it('has exactly 3 distinct Y levels (0, breakHeight, roofHeight)', () => {
    const geom = strategy.create(baseParams);
    const pos = geom.attributes.position!;
    const ys = new Set<number>();
    for (let i = 0; i < pos.count; i++) {
      ys.add(Math.round(pos.getY(i) * 1000) / 1000);
    }
    expect(ys.size).toBe(3);
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

  it('produces same geometry for closed and open ring', () => {
    const geomOpen = strategy.create(baseParams);
    const geomClosed = strategy.create({
      ...baseParams,
      outerRing: rectClosed,
    });
    expect(geomOpen.attributes.position!.array.length).toBe(
      geomClosed.attributes.position!.array.length
    );
  });

  it('different ridgeAngle produces same vertex count', () => {
    const geomA = strategy.create(baseParams);
    const geomB = strategy.create({ ...baseParams, ridgeAngle: Math.PI / 4 });
    expect(geomA.attributes.position!.array.length).toBe(
      geomB.attributes.position!.array.length
    );
  });
});
