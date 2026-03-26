import { describe, it, expect } from 'vitest';
import { ShapeUtils, Vector2 } from 'three';
import { HippedRoofStrategy } from './HippedRoofStrategy';

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

// L-shaped ring (CCW), 6 vertices — elongated so OBB is not square (halfLength >> halfWidth)
// Shape: 20 wide × 6 tall with a 10×3 notch cut from top-right
// OBB along X: halfLength=10, halfWidth=3 → not square, hipped geometry applies
function lShapeRing(): [number, number][] {
  return [
    [0, 0],
    [20, 0],
    [20, 3],
    [10, 3],
    [10, 6],
    [0, 6],
  ];
}

// Expected float count for a given ring using ShapeUtils
function expectedFloatCount(ring: [number, number][], closed = false): number {
  const count = closed ? ring.length - 1 : ring.length;
  const contour = ring.slice(0, count).map(([x, y]) => new Vector2(x, y));
  const topTriCount = ShapeUtils.triangulateShape(contour, []).length;
  const sideTriCount = count * 2;
  return (topTriCount + sideTriCount) * 3 * 3;
}

const strategy = new HippedRoofStrategy();

describe('HippedRoofStrategy', () => {
  describe('rectangle', () => {
    it('produces correct vertex count', () => {
      const ring = rectRing(10, 6);
      const geom = strategy.create({
        outerRing: ring,
        roofShape: 'hipped',
        roofHeight: 3,
        ridgeAngle: 0,
      });
      const pos = geom.getAttribute('position');
      expect(pos.array.length).toBe(expectedFloatCount(ring));
    });

    it('all heights are in range [0, roofHeight]', () => {
      const ring = rectRing(10, 6);
      const roofHeight = 5;
      const geom = strategy.create({
        outerRing: ring,
        roofShape: 'hipped',
        roofHeight,
        ridgeAngle: Math.PI / 4,
      });
      const arr = geom.getAttribute('position').array as Float32Array;
      for (let i = 1; i < arr.length; i += 3) {
        expect(arr[i]!).toBeGreaterThanOrEqual(-1e-6);
        expect(arr[i]!).toBeLessThanOrEqual(roofHeight + 1e-6);
      }
    });

    it('ridge vertices reach roofHeight for elongated rectangle', () => {
      // 20×4 rectangle, ridgeAngle=0 (ridge along X)
      // OBB: halfLength=10, halfWidth=2
      // Central vertices at acrossProj=0 and |alongProj| < halfLength-halfWidth=8
      // would reach roofHeight, but rect has no vertex on centreline.
      // Use a hexagon with two explicit centred vertices.
      const roofHeight = 4;
      // hexagon: two vertices on centreline (y=0), rest at eaves (y=±2)
      const _ring: [number, number][] = [
        [-10, -2], // eave
        [10, -2], // eave
        [10, 0], // near ridge — acrossProj=0, |alongProj|=10 → tAlong=(10-10)/2=0 → h=0 (hip end)
        [10, 2], // eave
        [-10, 2], // eave
        [-10, 0], // near ridge (hip end same)
      ];
      // Better: vertices inside the ridge zone
      // OBB halfLength≈10, halfWidth=2; ridge zone: |alongProj| < 10-2=8
      // Use vertices at (±5, 0): acrossProj=0, |alongProj|=5 < 8 → tAlong=(10-5)/2=2.5 > 1 → t=min(1,1)=1 → h=roofHeight
      const ring2: [number, number][] = [
        [-10, -2],
        [10, -2],
        [10, 2],
        [-10, 2],
        [-10, 0], // |acrossProj|=0, |alongProj|=10 → tAlong=0 → h=0 (hip end exactly)
        [0, 0], // centroid — tAcross=1, tAlong=(10-0)/2=5 → min=1 → h=roofHeight ✓
      ];
      const geom = strategy.create({
        outerRing: ring2,
        roofShape: 'hipped',
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

    it('eave vertices have height 0', () => {
      // Vertices exactly at the OBB eave boundary get tAcross=0 → h=0
      const ring = rectRing(10, 6);
      const geom = strategy.create({
        outerRing: ring,
        roofShape: 'hipped',
        roofHeight: 4,
        ridgeAngle: 0,
      });
      const arr = geom.getAttribute('position').array as Float32Array;
      let foundZero = false;
      for (let i = 1; i < arr.length; i += 3) {
        if (Math.abs(arr[i]!) < 1e-6) {
          foundZero = true;
          break;
        }
      }
      expect(foundZero).toBe(true);
    });
  });

  describe('closed ring', () => {
    it('produces same vertex count as open ring', () => {
      const open = rectRing(10, 6);
      const closed = closedRectRing(10, 6);
      const params = {
        roofShape: 'hipped',
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
        roofShape: 'hipped',
        roofHeight: 3,
        ridgeAngle: 0,
      } as const;

      const geomCCW = strategy.create({ outerRing: ccw, ...params });
      const geomCW = strategy.create({ outerRing: cw, ...params });

      expect(geomCW.getAttribute('position').array.length).toBe(
        geomCCW.getAttribute('position').array.length
      );
    });
  });

  describe('square footprint → pyramidal delegation', () => {
    it('returns non-empty geometry (delegates to PyramidalRoofStrategy)', () => {
      // 6×6 square: halfLength = halfWidth → halfLength <= halfWidth + 0.01 → pyramidal
      const ring = rectRing(6, 6);
      const geom = strategy.create({
        outerRing: ring,
        roofShape: 'hipped',
        roofHeight: 3,
        ridgeAngle: 0,
      });
      const pos = geom.getAttribute('position');
      expect(pos).toBeDefined();
      expect(pos.array.length).toBeGreaterThan(0);
    });
  });

  describe('L-shaped footprint', () => {
    it('produces geometry without crashing', () => {
      const ring = lShapeRing();
      const geom = strategy.create({
        outerRing: ring,
        roofShape: 'hipped',
        roofHeight: 4,
        ridgeAngle: 0,
      });
      const pos = geom.getAttribute('position');
      expect(pos).toBeDefined();
      expect(pos.array.length).toBe(expectedFloatCount(ring));
    });

    it('all heights are in [0, roofHeight] for L-shape', () => {
      const ring = lShapeRing();
      const roofHeight = 4;
      const geom = strategy.create({
        outerRing: ring,
        roofShape: 'hipped',
        roofHeight,
        ridgeAngle: 0,
      });
      const arr = geom.getAttribute('position').array as Float32Array;
      for (let i = 1; i < arr.length; i += 3) {
        expect(arr[i]!).toBeGreaterThanOrEqual(-1e-6);
        expect(arr[i]!).toBeLessThanOrEqual(roofHeight + 1e-6);
      }
    });
  });

  describe('edge cases', () => {
    it('roofHeight = 0 produces valid flat geometry', () => {
      const ring = rectRing(10, 6);
      const geom = strategy.create({
        outerRing: ring,
        roofShape: 'hipped',
        roofHeight: 0,
        ridgeAngle: 0,
      });
      const arr = geom.getAttribute('position').array as Float32Array;
      for (let i = 1; i < arr.length; i += 3) {
        expect(arr[i]).toBeCloseTo(0);
      }
    });

    it('degenerate polygon with fewer than 3 vertices returns empty geometry', () => {
      const ring: [number, number][] = [
        [0, 0],
        [5, 0],
      ];
      const geom = strategy.create({
        outerRing: ring,
        roofShape: 'hipped',
        roofHeight: 3,
        ridgeAngle: 0,
      });
      // count < 3 → return new BufferGeometry() with no attributes
      expect(geom.getAttribute('position')).toBeUndefined();
    });
  });
});
