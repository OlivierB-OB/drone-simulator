import { describe, it, expect } from 'vitest';
import { ShapeUtils, Vector2 } from 'three';
import { ButterflyRoofStrategy } from './ButterflyRoofStrategy';

// Helper: rectangle ring CCW in Mercator XY (width w along X, depth d along Y)
function rectRing(w: number, d: number): [number, number][] {
  const hw = w / 2;
  const hd = d / 2;
  return [
    [-hw, -hd],
    [hw, -hd],
    [hw, hd],
    [-hw, hd],
  ];
}

// Helper: same rectangle but CW
function rectRingCW(w: number, d: number): [number, number][] {
  const hw = w / 2;
  const hd = d / 2;
  return [
    [-hw, hd],
    [hw, hd],
    [hw, -hd],
    [-hw, -hd],
  ];
}

// Helper: closed ring (last == first)
function closedRectRing(w: number, d: number): [number, number][] {
  const ring = rectRing(w, d);
  return [...ring, ring[0]!];
}

// L-shaped ring (CCW), 6 vertices
function lShapeRing(): [number, number][] {
  return [
    [0, 0],
    [10, 0],
    [10, 5],
    [5, 5],
    [5, 10],
    [0, 10],
  ];
}

// Expected float count: (topTriangles + count*2) * 3 vertices * 3 floats
function expectedFloatCount(ring: [number, number][], closed = false): number {
  const count = closed ? ring.length - 1 : ring.length;
  const contour = ring.slice(0, count).map(([x, y]) => new Vector2(x, y));
  const topTriCount = ShapeUtils.triangulateShape(contour, []).length;
  const sideTriCount = count * 2;
  return (topTriCount + sideTriCount) * 3 * 3;
}

const strategy = new ButterflyRoofStrategy();

describe('ButterflyRoofStrategy', () => {
  describe('rectangle', () => {
    it('produces correct vertex count', () => {
      const ring = rectRing(10, 6);
      const geom = strategy.create({
        outerRing: ring,
        roofShape: 'butterfly',
        roofHeight: 3,
        ridgeAngle: 0,
      });
      expect(geom.getAttribute('position').array.length).toBe(
        expectedFloatCount(ring)
      );
    });

    it('all heights are in range [0, roofHeight]', () => {
      const ring = rectRing(10, 6);
      const roofHeight = 5;
      const geom = strategy.create({
        outerRing: ring,
        roofShape: 'butterfly',
        roofHeight,
        ridgeAngle: Math.PI / 4,
      });
      const arr = geom.getAttribute('position').array as Float32Array;
      for (let i = 1; i < arr.length; i += 3) {
        expect(arr[i]!).toBeGreaterThanOrEqual(-1e-6);
        expect(arr[i]!).toBeLessThanOrEqual(roofHeight + 1e-6);
      }
    });
  });

  describe('valley and eaves heights', () => {
    // ridgeAngle=0: acrossX=0, acrossY=1 → projection = ring[i][1]
    // Hexagon with two vertices at y=0 (valley centreline) and four at y=±3 (eaves)
    it('valley vertices (acrossProj=0) appear at Y=0', () => {
      const ring: [number, number][] = [
        [-5, -3], // eave
        [5, -3], // eave
        [5, 0], // valley
        [5, 3], // eave
        [-5, 3], // eave
        [-5, 0], // valley
      ];
      const roofHeight = 4;
      const geom = strategy.create({
        outerRing: ring,
        roofShape: 'butterfly',
        roofHeight,
        ridgeAngle: 0,
      });
      const arr = geom.getAttribute('position').array as Float32Array;
      // At least one vertex should be at Y=0 (valley, from top face or wall base)
      const yValues = new Set<number>();
      for (let i = 1; i < arr.length; i += 3) {
        yValues.add(Math.round(arr[i]! * 1000) / 1000);
      }
      expect(yValues.has(0)).toBe(true);
    });

    it('eave vertices (max acrossProj) appear at Y=roofHeight', () => {
      const ring: [number, number][] = [
        [-5, -3], // eave — |proj|=3 = maxAbsAcross → Y=roofHeight
        [5, -3], // eave
        [5, 0], // valley → Y=0
        [5, 3], // eave
        [-5, 3], // eave
        [-5, 0], // valley → Y=0
      ];
      const roofHeight = 4;
      const geom = strategy.create({
        outerRing: ring,
        roofShape: 'butterfly',
        roofHeight,
        ridgeAngle: 0,
      });
      const arr = geom.getAttribute('position').array as Float32Array;
      const yValues = new Set<number>();
      for (let i = 1; i < arr.length; i += 3) {
        yValues.add(Math.round(arr[i]! * 1000) / 1000);
      }
      expect(yValues.has(roofHeight)).toBe(true);
    });
  });

  describe('closed ring', () => {
    it('produces same vertex count as open ring', () => {
      const open = rectRing(10, 6);
      const closed = closedRectRing(10, 6);
      const params = {
        roofShape: 'butterfly',
        roofHeight: 3,
        ridgeAngle: 0,
      } as const;

      const geomOpen = strategy.create({ outerRing: open, ...params });
      const geomClosed = strategy.create({ outerRing: closed, ...params });

      expect(geomOpen.getAttribute('position').array.length).toBe(
        geomClosed.getAttribute('position').array.length
      );
    });
  });

  describe('CW winding', () => {
    it('produces same vertex count as CCW ring', () => {
      const ccw = rectRing(10, 6);
      const cw = rectRingCW(10, 6);
      const params = {
        roofShape: 'butterfly',
        roofHeight: 3,
        ridgeAngle: 0,
      } as const;

      const geomCCW = strategy.create({ outerRing: ccw, ...params });
      const geomCW = strategy.create({ outerRing: cw, ...params });

      expect(geomCW.getAttribute('position').array.length).toBe(
        geomCCW.getAttribute('position').array.length
      );
    });

    it('CW ring: at least one upward-facing face', () => {
      const cw = rectRingCW(10, 6);
      const geom = strategy.create({
        outerRing: cw,
        roofShape: 'butterfly',
        roofHeight: 4,
        ridgeAngle: 0,
      });
      const pos = geom.getAttribute('position');
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
  });

  describe('L-shaped footprint', () => {
    it('produces geometry without crashing', () => {
      const ring = lShapeRing();
      const geom = strategy.create({
        outerRing: ring,
        roofShape: 'butterfly',
        roofHeight: 4,
        ridgeAngle: 0,
      });
      const pos = geom.getAttribute('position');
      expect(pos).toBeDefined();
      expect(pos.array.length).toBe(expectedFloatCount(ring));
    });
  });

  describe('edge cases', () => {
    it('roofHeight = 0 produces valid flat geometry', () => {
      const ring = rectRing(10, 6);
      const geom = strategy.create({
        outerRing: ring,
        roofShape: 'butterfly',
        roofHeight: 0,
        ridgeAngle: 0,
      });
      const arr = geom.getAttribute('position').array as Float32Array;
      for (let i = 1; i < arr.length; i += 3) {
        expect(arr[i]).toBeCloseTo(0);
      }
    });

    it('near-degenerate (maxAbsAcross < 0.001) does not divide by zero', () => {
      // All vertices essentially on the valley centreline
      const ring: [number, number][] = [
        [0, 0],
        [10, 0],
        [10, 1e-9],
        [0, 1e-9],
      ];
      expect(() =>
        strategy.create({
          outerRing: ring,
          roofShape: 'butterfly',
          roofHeight: 3,
          ridgeAngle: 0,
        })
      ).not.toThrow();
    });

    it('degenerate polygon with fewer than 3 vertices does not throw', () => {
      const ring: [number, number][] = [
        [0, 0],
        [5, 0],
      ];
      expect(() =>
        strategy.create({
          outerRing: ring,
          roofShape: 'butterfly',
          roofHeight: 3,
          ridgeAngle: 0,
        })
      ).not.toThrow();
      const geom = strategy.create({
        outerRing: ring,
        roofShape: 'butterfly',
        roofHeight: 3,
        ridgeAngle: 0,
      });
      expect(geom.getAttribute('position')).toBeDefined();
    });
  });
});
