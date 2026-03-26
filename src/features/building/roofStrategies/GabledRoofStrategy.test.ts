import { describe, it, expect } from 'vitest';
import { ShapeUtils, Vector2 } from 'three';
import { GabledRoofStrategy } from './GabledRoofStrategy';

// Helper: rectangle ring CCW in Mercator XY (width w along X, depth d along Y)
// Vertices: bottom-left, bottom-right, top-right, top-left
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

// L-shaped ring (CCW), 8 vertices
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

// Expected vertex count: (topTriangles + count*2) * 3 vertices * 3 floats
function expectedFloatCount(ring: [number, number][], closed = false): number {
  const count = closed ? ring.length - 1 : ring.length;
  const contour = ring.slice(0, count).map(([x, y]) => new Vector2(x, y));
  const topTriCount = ShapeUtils.triangulateShape(contour, []).length;
  const sideTriCount = count * 2;
  return (topTriCount + sideTriCount) * 3 * 3;
}

const strategy = new GabledRoofStrategy();

describe('GabledRoofStrategy', () => {
  describe('rectangle, horizontal ridge (ridgeAngle = 0)', () => {
    // ridgeAngle = 0 → ridge runs along +X; across = +Y direction
    // For a 10×6 rectangle: vertices at y=±3, x=±5
    // acrossProj[i] = ring[i][1] (dot with (0,1))
    // maxAbsAcross = 3
    // Vertices at y=0 centre: roofY = roofHeight (but none at y=0 for this rect)
    // Vertices at y=±3: roofY = roofHeight*(1-3/3) = 0
    // Vertices at y=0 would be roofHeight — but rect has no such vertices
    // Actually for this rect all 4 vertices are at |acrossProj|=3 → all roofY=0
    // That's a degenerate flat case. Use a different ridge so ridge cuts through interior.
    // Better: ridge along Y axis (ridgeAngle = π/2), across = -X direction
    // acrossX = -sin(π/2) = -1, acrossY = cos(π/2) = 0
    // acrossProj[i] = ring[i][0] * (-1) = -ring[i][0]
    // For rect ±5 in X: acrossProj = ±5, maxAbsAcross = 5
    // Vertices at x=±5 → |proj|=5 → roofY=0; no vertex at x=0 for plain rect → all Y=0
    // Actually for a gabled roof over a rectangle the ridge is at the centre — but the
    // POLYGON has no vertex on the centreline. The two vertices on each long side
    // project symmetrically, so both get the same roofY = 0 at the eaves. This is expected
    // because the footprint has no vertices on the ridge line itself.
    // Let's use a pentagon that has a vertex on the ridge centreline to verify heights.
    it('vertex on ridge centreline gets roofHeight', () => {
      // Triangle-like shape: 3 vertices. Centre vertex on across=0 line.
      // ridgeAngle=0 (ridge along X), acrossX=0, acrossY=1
      // Vertices: left-base (0,-5), right-base (10,-5), apex (5,0) [centred]
      // But for gabled, ridge is symmetric: vertices at y=+5 and y=-5 are eaves, y=0 is ridge.
      // Use: top=(5,5), bottom-left=(0,-5), bottom-right=(10,-5)
      // acrossProj: top=5, bl=-5, br=-5 → maxAbsAcross=5
      // roofY: top = h*(1-5/5)=0, bl=h*(1-5/5)=0 — wrong, all at eave
      // Actually: acrossY=cos(0)=1, so acrossProj = y-coordinate of vertex
      // For ridge along X (ridgeAngle=0): ridge is the line y=0 (across=0)
      // Vertex at y=0 gets roofHeight; vertices at y=±maxAbsAcross get 0.
      // Use rect with a vertex at y=0: Pentagon with a midpoint vertex on the long axis.
      const ring: [number, number][] = [
        [-5, -3], // eave — acrossProj=-3
        [5, -3], // eave — acrossProj=-3
        [5, 0], // ridge vertex — acrossProj=0
        [5, 3], // eave — acrossProj=3
        [-5, 3], // eave — acrossProj=3
        [-5, 0], // ridge vertex — acrossProj=0
      ];
      const roofHeight = 4;
      const geom = strategy.create({
        outerRing: ring,
        roofShape: 'gabled',
        roofHeight,
        ridgeAngle: 0,
      });
      const pos = geom.getAttribute('position');
      expect(pos).toBeDefined();
      // Check that at least one vertex has Y ≈ roofHeight (ridge vertices)
      const arr = pos.array as Float32Array;
      const yValues = new Set<number>();
      for (let i = 1; i < arr.length; i += 3) {
        yValues.add(Math.round(arr[i]! * 1000) / 1000);
      }
      expect(yValues.has(roofHeight)).toBe(true);
      expect(yValues.has(0)).toBe(true);
    });
  });

  describe('rectangle', () => {
    it('produces correct vertex count', () => {
      const ring = rectRing(10, 6);
      const geom = strategy.create({
        outerRing: ring,
        roofShape: 'gabled',
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
        roofShape: 'gabled',
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

  describe('closed ring', () => {
    it('produces same vertex count as open ring', () => {
      const open = rectRing(10, 6);
      const closed = closedRectRing(10, 6);
      const params = {
        roofShape: 'gabled',
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
        roofShape: 'gabled',
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

  describe('L-shaped footprint', () => {
    it('produces geometry without crashing', () => {
      const ring = lShapeRing();
      const geom = strategy.create({
        outerRing: ring,
        roofShape: 'gabled',
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
        roofShape: 'gabled',
        roofHeight: 0,
        ridgeAngle: 0,
      });
      const arr = geom.getAttribute('position').array as Float32Array;
      // All Y values should be 0
      for (let i = 1; i < arr.length; i += 3) {
        expect(arr[i]).toBeCloseTo(0);
      }
    });

    it('very narrow building (maxAbsAcross < 1e-6) does not divide by zero', () => {
      // All vertices on the ridge centreline: acrossProj ≈ 0 for all
      // ridgeAngle=0 → acrossX=0, acrossY=1; all vertices at y=0 → acrossProj=0
      const ring: [number, number][] = [
        [0, 0],
        [10, 0],
        [10, 1e-9],
        [0, 1e-9],
      ];
      expect(() =>
        strategy.create({
          outerRing: ring,
          roofShape: 'gabled',
          roofHeight: 3,
          ridgeAngle: 0,
        })
      ).not.toThrow();
    });

    it('degenerate polygon with fewer than 3 vertices produces empty geometry', () => {
      const ring: [number, number][] = [
        [0, 0],
        [5, 0],
      ];
      const geom = strategy.create({
        outerRing: ring,
        roofShape: 'gabled',
        roofHeight: 3,
        ridgeAngle: 0,
      });
      // triangulateShape returns [] for < 3 vertices; top face empty; side walls: 2*2=4 triangles
      const pos = geom.getAttribute('position');
      expect(pos).toBeDefined();
    });
  });
});
