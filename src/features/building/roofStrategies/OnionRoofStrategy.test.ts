import { describe, it, expect } from 'vitest';
import { OnionRoofStrategy } from './OnionRoofStrategy';

// n-gon approximating a circle of radius r (open ring)
function circularRing(r: number, n: number): [number, number][] {
  return Array.from({ length: n }, (_, i) => {
    const angle = (i * 2 * Math.PI) / n;
    return [Math.cos(angle) * r, Math.sin(angle) * r] as [number, number];
  });
}

// Axis-aligned square ring, half-side = s (open, 4 vertices)
function squareRing(s: number): [number, number][] {
  return [
    [-s, -s],
    [s, -s],
    [s, s],
    [-s, s],
  ];
}

const strategy = new OnionRoofStrategy();

describe('OnionRoofStrategy', () => {
  describe('circular footprint', () => {
    const r = 5;
    const roofHeight = 4;
    const params = {
      outerRing: circularRing(r, 32),
      roofShape: 'onion',
      roofHeight,
      ridgeAngle: 0,
    } as const;

    it('apex is at roofHeight', () => {
      const geom = strategy.create(params);
      const pos = geom.attributes.position!;
      let maxY = -Infinity;
      for (let i = 0; i < pos.count; i++) maxY = Math.max(maxY, pos.getY(i));
      expect(maxY).toBeCloseTo(roofHeight, 1);
    });

    it('base is at Y=0', () => {
      const geom = strategy.create(params);
      const pos = geom.attributes.position!;
      let minY = Infinity;
      for (let i = 0; i < pos.count; i++) minY = Math.min(minY, pos.getY(i));
      expect(minY).toBeCloseTo(0, 5);
    });

    it('base vertices lie near the ring boundary', () => {
      const geom = strategy.create(params);
      const pos = geom.attributes.position!;
      for (let i = 0; i < pos.count; i++) {
        if (pos.getY(i) > 0.01) continue; // only base ring vertices
        const dist = Math.sqrt(pos.getX(i) ** 2 + pos.getZ(i) ** 2);
        expect(dist).toBeGreaterThan(r * 0.7);
        expect(dist).toBeLessThan(r * 1.3);
      }
    });

    it('mid-height vertices are wider than the base (onion bulge)', () => {
      const geom = strategy.create(params);
      const pos = geom.attributes.position!;
      const midY = roofHeight * 0.4;
      const tolerance = roofHeight * 0.15;
      let maxMidDist = 0;
      for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i);
        if (y > midY - tolerance && y < midY + tolerance) {
          const dist = Math.sqrt(pos.getX(i) ** 2 + pos.getZ(i) ** 2);
          maxMidDist = Math.max(maxMidDist, dist);
        }
      }
      // Bulge makes mid-height wider than the base radius
      expect(maxMidDist).toBeGreaterThan(r);
    });

    it('produces no NaN in position buffer', () => {
      const geom = strategy.create(params);
      const arr = geom.attributes.position!.array;
      for (let i = 0; i < arr.length; i++) {
        expect(isNaN(arr[i]!)).toBe(false);
      }
    });

    it('roofHeight=0 collapses to flat disc (all Y≈0)', () => {
      const geom = strategy.create({ ...params, roofHeight: 0 });
      const pos = geom.attributes.position!;
      for (let i = 0; i < pos.count; i++) {
        expect(pos.getY(i)).toBeCloseTo(0, 5);
      }
    });
  });

  describe('square footprint (extents vary by direction)', () => {
    const s = 5; // half-side → square is 10×10
    const roofHeight = 3;
    const params = {
      outerRing: squareRing(s),
      roofShape: 'onion',
      roofHeight,
      ridgeAngle: 0,
    } as const;

    it('apex is at roofHeight', () => {
      const geom = strategy.create(params);
      const pos = geom.attributes.position!;
      let maxY = -Infinity;
      for (let i = 0; i < pos.count; i++) maxY = Math.max(maxY, pos.getY(i));
      expect(maxY).toBeCloseTo(roofHeight, 1);
    });

    it('base vertices do not overshoot the square corners', () => {
      // Max XZ distance from centroid to a corner is s*sqrt(2)
      // Bulge can push mid-height outward, but base should stay within footprint
      const maxAllowed = s * Math.sqrt(2) + 0.01;
      const geom = strategy.create(params);
      const pos = geom.attributes.position!;
      for (let i = 0; i < pos.count; i++) {
        if (pos.getY(i) > 0.01) continue; // only base ring vertices
        const dist = Math.sqrt(pos.getX(i) ** 2 + pos.getZ(i) ** 2);
        expect(dist).toBeLessThanOrEqual(maxAllowed);
      }
    });
  });

  describe('pole vertex guard', () => {
    it('produces no NaN for any ring shape (catches sinPhi=0 guard)', () => {
      const geom = strategy.create({
        outerRing: squareRing(3),
        roofShape: 'onion',
        roofHeight: 3,
        ridgeAngle: 0,
      });
      const arr = geom.attributes.position!.array;
      for (let i = 0; i < arr.length; i++) {
        expect(isNaN(arr[i]!)).toBe(false);
      }
    });
  });
});
