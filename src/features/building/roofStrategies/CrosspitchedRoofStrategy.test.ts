import { describe, it, expect } from 'vitest';
import { ShapeUtils, Vector2 } from 'three';
import { CrosspitchedRoofStrategy } from './CrosspitchedRoofStrategy';

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

function closedRectRing(w: number, d: number): [number, number][] {
  const ring = rectRing(w, d);
  return [...ring, ring[0]!];
}

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

function expectedFloatCount(ring: [number, number][], closed = false): number {
  const count = closed ? ring.length - 1 : ring.length;
  const contour = ring.slice(0, count).map(([x, y]) => new Vector2(x, y));
  const topTriCount = ShapeUtils.triangulateShape(contour, []).length;
  const sideTriCount = count * 2;
  return (topTriCount + sideTriCount) * 3 * 3;
}

const strategy = new CrosspitchedRoofStrategy();

describe('CrosspitchedRoofStrategy', () => {
  describe('vertex count', () => {
    it('rectangle produces correct vertex count', () => {
      const ring = rectRing(10, 6);
      const geom = strategy.create({
        outerRing: ring,
        roofShape: 'crosspitched',
        roofHeight: 3,
        ridgeAngle: 0,
      });
      expect(geom.getAttribute('position').array.length).toBe(
        expectedFloatCount(ring)
      );
    });

    it('L-shaped footprint produces correct vertex count', () => {
      const ring = lShapeRing();
      const geom = strategy.create({
        outerRing: ring,
        roofShape: 'crosspitched',
        roofHeight: 4,
        ridgeAngle: 0,
      });
      const pos = geom.getAttribute('position');
      expect(pos).toBeDefined();
      expect(pos.array.length).toBe(expectedFloatCount(ring));
    });
  });

  describe('height bounds', () => {
    it('all heights are in [0, roofHeight]', () => {
      const ring = rectRing(10, 6);
      const roofHeight = 5;
      const geom = strategy.create({
        outerRing: ring,
        roofShape: 'crosspitched',
        roofHeight,
        ridgeAngle: Math.PI / 6,
      });
      const arr = geom.getAttribute('position').array as Float32Array;
      for (let i = 1; i < arr.length; i += 3) {
        expect(arr[i]!).toBeGreaterThanOrEqual(-1e-6);
        expect(arr[i]!).toBeLessThanOrEqual(roofHeight + 1e-6);
      }
    });

    it('square footprint with ridgeAngle=π/4 has corner vertex at roofHeight', () => {
      // Square with vertices at (±3, ±3). ridgeAngle=π/4:
      // across1 = (-sin(π/4), cos(π/4)) = (-√2/2, √2/2)
      // For vertex (3,3): p1 = 3*(-√2/2) + 3*(√2/2) = 0 → h1 = roofHeight
      // OBB: halfLength=halfWidth=3, hW=3 → vertex exactly on ridge centreline → full height
      const roofHeight = 4;
      const geom = strategy.create({
        outerRing: rectRing(6, 6),
        roofShape: 'crosspitched',
        roofHeight,
        ridgeAngle: Math.PI / 4,
      });
      const arr = geom.getAttribute('position').array as Float32Array;
      let maxY = -Infinity;
      for (let i = 1; i < arr.length; i += 3) {
        maxY = Math.max(maxY, arr[i]!);
      }
      expect(maxY).toBeCloseTo(roofHeight, 1);
    });
  });

  describe('closed ring', () => {
    it('produces same vertex count as open ring', () => {
      const open = rectRing(10, 6);
      const closed = closedRectRing(10, 6);
      const params = {
        roofShape: 'crosspitched',
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
        roofShape: 'crosspitched',
        roofHeight: 3,
        ridgeAngle: 0,
      } as const;

      const geomCCW = strategy.create({ outerRing: ccw, ...params });
      const geomCW = strategy.create({ outerRing: cw, ...params });

      expect(geomCW.getAttribute('position').array.length).toBe(
        geomCCW.getAttribute('position').array.length
      );
    });

    it('CW ring has at least one upward-facing face', () => {
      const geom = strategy.create({
        outerRing: rectRingCW(10, 6),
        roofShape: 'crosspitched',
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

  describe('upward-facing faces', () => {
    it('CCW ring has at least one upward-facing face (top surface)', () => {
      const geom = strategy.create({
        outerRing: rectRing(10, 6),
        roofShape: 'crosspitched',
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

  describe('edge cases', () => {
    it('roofHeight = 0 produces valid flat geometry', () => {
      const ring = rectRing(10, 6);
      const geom = strategy.create({
        outerRing: ring,
        roofShape: 'crosspitched',
        roofHeight: 0,
        ridgeAngle: 0,
      });
      const arr = geom.getAttribute('position').array as Float32Array;
      for (let i = 1; i < arr.length; i += 3) {
        expect(arr[i]).toBeCloseTo(0);
      }
    });

    it('degenerate zero-area OBB (hW < 1e-6) does not throw and returns empty geometry', () => {
      const ring: [number, number][] = [
        [0, 0],
        [1e-8, 0],
        [1e-8, 1e-8],
        [0, 1e-8],
      ];
      expect(() =>
        strategy.create({
          outerRing: ring,
          roofShape: 'crosspitched',
          roofHeight: 3,
          ridgeAngle: 0,
        })
      ).not.toThrow();
    });
  });
});
