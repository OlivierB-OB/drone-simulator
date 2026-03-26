import { describe, it, expect } from 'vitest';
import {
  computeOBB,
  resolveRidgeAngle,
  RoofGeometryFactory,
} from './RoofGeometryFactory';

// Helper: axis-aligned rectangle (10 wide × 20 long, centered at origin)
const rectangle: [number, number][] = [
  [10, 5],
  [-10, 5],
  [-10, -5],
  [10, -5],
  [10, 5], // closing point
];

// Helper: square (10 × 10)
const square: [number, number][] = [
  [5, 5],
  [-5, 5],
  [-5, -5],
  [5, -5],
  [5, 5],
];

describe('computeOBB', () => {
  it('returns correct half-extents for axis-aligned rectangle', () => {
    const obb = computeOBB(rectangle);
    expect(obb.halfLength).toBeCloseTo(10, 1);
    expect(obb.halfWidth).toBeCloseTo(5, 1);
  });

  it('returns center near origin for centered polygon', () => {
    const obb = computeOBB(rectangle);
    expect(obb.center[0]).toBeCloseTo(0, 1);
    expect(obb.center[1]).toBeCloseTo(0, 1);
  });

  it('returns equal half-extents for square', () => {
    const obb = computeOBB(square);
    expect(obb.halfLength).toBeCloseTo(obb.halfWidth, 1);
  });

  it('halfLength is longest edge direction for a 45° rotated rectangle', () => {
    // 20×10 rectangle rotated 45°
    const cos = Math.cos(Math.PI / 4);
    const sin = Math.sin(Math.PI / 4);
    const rotRect: [number, number][] = [
      [10 * cos - 5 * sin, 10 * sin + 5 * cos],
      [-10 * cos - 5 * sin, -10 * sin + 5 * cos],
      [-10 * cos + 5 * sin, -10 * sin - 5 * cos],
      [10 * cos + 5 * sin, 10 * sin - 5 * cos],
      [10 * cos - 5 * sin, 10 * sin + 5 * cos],
    ];
    const obb = computeOBB(rotRect);
    expect(obb.halfLength).toBeCloseTo(10, 0);
    expect(obb.halfWidth).toBeCloseTo(5, 0);
    // Angle may differ by PI (edge direction is ambiguous)
    const angleDiff = Math.abs(
      (((obb.angle - Math.PI / 4 + Math.PI) % Math.PI) + Math.PI) % Math.PI
    );
    expect(Math.min(angleDiff, Math.PI - angleDiff)).toBeCloseTo(0, 1);
  });

  it('handles polygon without closing point', () => {
    const open: [number, number][] = [
      [10, 5],
      [-10, 5],
      [-10, -5],
      [10, -5],
    ];
    const obb = computeOBB(open);
    expect(obb.halfLength).toBeCloseTo(10, 1);
    expect(obb.halfWidth).toBeCloseTo(5, 1);
  });
});

describe('resolveRidgeAngle', () => {
  it('returns OBB angle by default (along orientation)', () => {
    const result = resolveRidgeAngle(0.5, undefined, undefined);
    expect(result).toBe(0.5);
  });

  it('returns OBB angle for explicit along orientation', () => {
    const result = resolveRidgeAngle(0.5, undefined, 'along');
    expect(result).toBe(0.5);
  });

  it('adds 90° for across orientation', () => {
    const result = resolveRidgeAngle(0.5, undefined, 'across');
    expect(result).toBeCloseTo(0.5 + Math.PI / 2, 5);
  });

  it('uses roof:direction over orientation when both present', () => {
    // roof:direction=0 (North) → PI/2 radians from +X
    const result = resolveRidgeAngle(0.5, 0, 'across');
    expect(result).toBeCloseTo(Math.PI / 2, 5);
  });

  it('converts compass 90° East to 0 radians (along +X)', () => {
    const result = resolveRidgeAngle(0, 90);
    expect(result).toBeCloseTo(0, 5);
  });

  it('converts compass 180° South to -PI/2', () => {
    const result = resolveRidgeAngle(0, 180);
    expect(result).toBeCloseTo(-Math.PI / 2, 5);
  });
});

describe('RoofGeometryFactory', () => {
  const factory = new RoofGeometryFactory();

  const baseParams = {
    outerRing: rectangle,
    roofHeight: 5,
    ridgeAngle: 0,
  };

  it('returns null for flat shape', () => {
    const geom = factory.create({ ...baseParams, roofShape: 'flat' });
    expect(geom).toBeNull();
  });

  it('returns null for unknown shape', () => {
    const geom = factory.create({ ...baseParams, roofShape: 'unknown' });
    expect(geom).toBeNull();
  });

  describe('pyramidal', () => {
    it('creates geometry with correct vertex count for rectangle (4 edges → 12 vertices)', () => {
      const geom = factory.create({ ...baseParams, roofShape: 'pyramidal' });
      expect(geom).not.toBeNull();
      // 3 vertices per face × 4 edges = 12 (non-indexed, flat normals)
      expect(geom!.attributes.position!.count).toBe(12);
    });

    it('has apex at roofHeight', () => {
      const geom = factory.create({ ...baseParams, roofShape: 'pyramidal' });
      const pos = geom!.attributes.position!;
      let maxY = -Infinity;
      for (let i = 0; i < pos.count; i++) {
        maxY = Math.max(maxY, pos.getY(i));
      }
      expect(maxY).toBeCloseTo(5, 1);
    });

    it('has base at Y=0', () => {
      const geom = factory.create({ ...baseParams, roofShape: 'pyramidal' });
      const pos = geom!.attributes.position!;
      let minY = Infinity;
      for (let i = 0; i < pos.count; i++) {
        minY = Math.min(minY, pos.getY(i));
      }
      expect(minY).toBeCloseTo(0, 5);
    });

    it('triangle footprint → 3 faces (9 vertices)', () => {
      const triangle: [number, number][] = [
        [0, 5],
        [-5, -5],
        [5, -5],
        [0, 5], // closing point
      ];
      const geom = factory.create({
        ...baseParams,
        outerRing: triangle,
        roofShape: 'pyramidal',
      });
      expect(geom!.attributes.position!.count).toBe(9);
    });

    it('pentagon footprint → 5 faces (15 vertices)', () => {
      const pentagon: [number, number][] = Array.from({ length: 6 }, (_, i) => {
        const angle = (i * 2 * Math.PI) / 5;
        return [Math.cos(angle) * 5, Math.sin(angle) * 5] as [number, number];
      });
      pentagon[5] = pentagon[0]!; // close the ring
      const geom = factory.create({
        ...baseParams,
        outerRing: pentagon,
        roofShape: 'pyramidal',
      });
      expect(geom!.attributes.position!.count).toBe(15);
    });

    it('is non-indexed geometry (flat normals)', () => {
      const geom = factory.create({ ...baseParams, roofShape: 'pyramidal' });
      expect(geom!.index).toBeNull();
    });

    it('apex vertex per face at Y=roofHeight and XZ≈0', () => {
      const geom = factory.create({ ...baseParams, roofShape: 'pyramidal' });
      const pos = geom!.attributes.position!;
      // Every 3rd vertex (index 2, 5, 8, 11) is the apex
      for (let face = 0; face < 4; face++) {
        const apexIdx = face * 3 + 2;
        expect(pos.getY(apexIdx)).toBeCloseTo(5, 5);
        expect(pos.getX(apexIdx)).toBeCloseTo(0, 5);
        expect(pos.getZ(apexIdx)).toBeCloseTo(0, 5);
      }
    });

    it('all face normals have positive Y component (slope upward outward)', () => {
      const geom = factory.create({ ...baseParams, roofShape: 'pyramidal' });
      geom!.computeVertexNormals();
      const normals = geom!.attributes.normal!;
      for (let i = 0; i < normals.count; i++) {
        expect(normals.getY(i)).toBeGreaterThan(0);
      }
    });

    it('CW ring: all face normals still have positive Y (normals outward regardless of winding)', () => {
      // Clockwise version of the rectangle (reversed vertex order)
      const cwRectangle: [number, number][] = [
        [10, -5],
        [-10, -5],
        [-10, 5],
        [10, 5],
        [10, -5], // closing point
      ];
      const geom = factory.create({
        ...baseParams,
        outerRing: cwRectangle,
        roofShape: 'pyramidal',
      });
      geom!.computeVertexNormals();
      const normals = geom!.attributes.normal!;
      for (let i = 0; i < normals.count; i++) {
        expect(normals.getY(i)).toBeGreaterThan(0);
      }
    });
  });

  describe('gabled', () => {
    it('creates non-indexed geometry with correct vertex count', () => {
      // rectangle: 4 unique vertices → 2 top triangles + 8 side triangles = 10 × 3 = 30 vertices
      const geom = factory.create({ ...baseParams, roofShape: 'gabled' });
      expect(geom).not.toBeNull();
      expect(geom!.index).toBeNull();
      expect(geom!.attributes.position!.count).toBe(30);
    });

    it('all heights are in [0, roofHeight]', () => {
      const geom = factory.create({ ...baseParams, roofShape: 'gabled' });
      const pos = geom!.attributes.position!;
      for (let i = 0; i < pos.count; i++) {
        expect(pos.getY(i)).toBeGreaterThanOrEqual(-1e-6);
        expect(pos.getY(i)).toBeLessThanOrEqual(5 + 1e-6);
      }
    });

    it('has upward-facing faces (top surface normals have positive Y)', () => {
      const geom = factory.create({ ...baseParams, roofShape: 'gabled' });
      geom!.computeVertexNormals();
      const normals = geom!.attributes.normal!;
      let foundUpward = false;
      for (let i = 0; i < normals.count; i++) {
        if (normals.getY(i) > 0.5) {
          foundUpward = true;
          break;
        }
      }
      expect(foundUpward).toBe(true);
    });

    it('ridge vertex normals have positive Y (slopes face outward)', () => {
      const geom = factory.create({ ...baseParams, roofShape: 'gabled' });
      geom!.computeVertexNormals();
      const normals = geom!.attributes.normal!;
      // Vertices 4 and 5 are ridge points shared only by slope faces → Y must be > 0
      expect(normals.getY(4)).toBeGreaterThan(0);
      expect(normals.getY(5)).toBeGreaterThan(0);
    });
  });

  describe('hipped', () => {
    it('creates non-indexed geometry with correct vertex count for elongated rectangle', () => {
      // rectangle: 4 unique vertices → 2 top triangles + 8 side triangles = 10 × 3 = 30 vertices
      const geom = factory.create({ ...baseParams, roofShape: 'hipped' });
      expect(geom).not.toBeNull();
      expect(geom!.index).toBeNull();
      expect(geom!.attributes.position!.count).toBe(30);
    });

    it('degenerates to pyramidal for square footprint', () => {
      const geom = factory.create({
        ...baseParams,
        outerRing: square,
        roofShape: 'hipped',
      });
      expect(geom).not.toBeNull();
      // Pyramidal: 4 edges × 3 vertices = 12 (non-indexed, flat normals)
      expect(geom!.attributes.position!.count).toBe(12);
    });

    it('ridge vertex normals have positive Y (slopes face outward)', () => {
      const geom = factory.create({ ...baseParams, roofShape: 'hipped' });
      geom!.computeVertexNormals();
      const normals = geom!.attributes.normal!;
      // Vertices 4 and 5 are ridge points → Y must be > 0
      expect(normals.getY(4)).toBeGreaterThan(0);
      expect(normals.getY(5)).toBeGreaterThan(0);
    });
  });

  describe('skillion', () => {
    it('creates geometry', () => {
      const geom = factory.create({ ...baseParams, roofShape: 'skillion' });
      expect(geom).not.toBeNull();
    });

    it('has vertices at both Y=0 and Y=roofHeight', () => {
      const geom = factory.create({ ...baseParams, roofShape: 'skillion' });
      const pos = geom!.attributes.position!;
      let minY = Infinity;
      let maxY = -Infinity;
      for (let i = 0; i < pos.count; i++) {
        minY = Math.min(minY, pos.getY(i));
        maxY = Math.max(maxY, pos.getY(i));
      }
      expect(minY).toBeCloseTo(0, 5);
      expect(maxY).toBeCloseTo(5, 1);
    });

    it('high-side vertices match +across direction for ridgeAngle=π/2', () => {
      // ridgeAngle=π/2: across = (-sin(π/2), cos(π/2)) = (-1, 0) → West is high
      const geom = factory.create({
        ...baseParams,
        ridgeAngle: Math.PI / 2,
        roofShape: 'skillion',
      });
      const pos = geom!.attributes.position!;
      // Vertices at max Y (roofHeight) should have negative X (West = +across)
      let foundHigh = false;
      for (let i = 0; i < pos.count; i++) {
        if (Math.abs(pos.getY(i) - 5) < 0.01) {
          expect(pos.getX(i)).toBeLessThanOrEqual(0); // High side = West
          foundHigh = true;
        }
      }
      expect(foundHigh).toBe(true);
    });

    it('has at least one upward-facing face (top surface)', () => {
      const geom = factory.create({ ...baseParams, roofShape: 'skillion' });
      const pos = geom!.attributes.position!;
      // Non-indexed: every 3 vertices = 1 triangle. Check face normals via cross product.
      let foundUpwardFace = false;
      for (let t = 0; t < pos.count; t += 3) {
        const ax = pos.getX(t + 1) - pos.getX(t);
        const az = pos.getZ(t + 1) - pos.getZ(t);
        const bx = pos.getX(t + 2) - pos.getX(t);
        const bz = pos.getZ(t + 2) - pos.getZ(t);
        const ny = az * bx - ax * bz;
        if (ny > 0.01) {
          foundUpwardFace = true;
          break;
        }
      }
      expect(foundUpwardFace).toBe(true);
    });

    it('is non-indexed geometry (flat normals)', () => {
      const geom = factory.create({ ...baseParams, roofShape: 'skillion' });
      expect(geom!.index).toBeNull();
    });

    it('CW ring: still has upward-facing face', () => {
      const cwRectangle: [number, number][] = [
        [10, -5],
        [-10, -5],
        [-10, 5],
        [10, 5],
        [10, -5],
      ];
      const geom = factory.create({
        ...baseParams,
        outerRing: cwRectangle,
        roofShape: 'skillion',
      });
      const pos = geom!.attributes.position!;
      let foundUpwardFace = false;
      for (let t = 0; t < pos.count; t += 3) {
        const ax = pos.getX(t + 1) - pos.getX(t);
        const az = pos.getZ(t + 1) - pos.getZ(t);
        const bx = pos.getX(t + 2) - pos.getX(t);
        const bz = pos.getZ(t + 2) - pos.getZ(t);
        const ny = az * bx - ax * bz;
        if (ny > 0.01) {
          foundUpwardFace = true;
          break;
        }
      }
      expect(foundUpwardFace).toBe(true);
    });
  });

  describe('butterfly', () => {
    it('creates non-indexed geometry with correct vertex count', () => {
      // rectangle: 4 unique vertices → 2 top triangles + 8 side triangles = 10 × 3 = 30 vertices
      const geom = factory.create({ ...baseParams, roofShape: 'butterfly' });
      expect(geom).not.toBeNull();
      expect(geom!.index).toBeNull();
      expect(geom!.attributes.position!.count).toBe(30);
    });

    it('all heights are in [0, roofHeight]', () => {
      const geom = factory.create({ ...baseParams, roofShape: 'butterfly' });
      const pos = geom!.attributes.position!;
      for (let i = 0; i < pos.count; i++) {
        expect(pos.getY(i)).toBeGreaterThanOrEqual(-1e-6);
        expect(pos.getY(i)).toBeLessThanOrEqual(5 + 1e-6);
      }
    });

    it('has vertices at both Y=0 (valley base) and Y=roofHeight (eaves)', () => {
      // rectangle vertices at y=±5; ridgeAngle=0 → acrossProj = y-coord
      // maxAbsAcross=5; all 4 ring vertices at |proj|=5 → heights=roofHeight
      // Side wall base vertices are always at Y=0
      const geom = factory.create({ ...baseParams, roofShape: 'butterfly' });
      const pos = geom!.attributes.position!;
      let minY = Infinity;
      let maxY = -Infinity;
      for (let i = 0; i < pos.count; i++) {
        minY = Math.min(minY, pos.getY(i));
        maxY = Math.max(maxY, pos.getY(i));
      }
      expect(minY).toBeCloseTo(0, 5);
      expect(maxY).toBeCloseTo(5, 1);
    });

    it('has at least one upward-facing face (top surface)', () => {
      const geom = factory.create({ ...baseParams, roofShape: 'butterfly' });
      const pos = geom!.attributes.position!;
      let foundUpwardFace = false;
      for (let t = 0; t < pos.count; t += 3) {
        const ax = pos.getX(t + 1) - pos.getX(t);
        const az = pos.getZ(t + 1) - pos.getZ(t);
        const bx = pos.getX(t + 2) - pos.getX(t);
        const bz = pos.getZ(t + 2) - pos.getZ(t);
        const ny = az * bx - ax * bz;
        if (ny > 0.01) {
          foundUpwardFace = true;
          break;
        }
      }
      expect(foundUpwardFace).toBe(true);
    });
  });

  describe('dome', () => {
    it('creates geometry with multiple vertices', () => {
      const geom = factory.create({ ...baseParams, roofShape: 'dome' });
      expect(geom).not.toBeNull();
      expect(geom!.attributes.position!.count).toBeGreaterThan(10);
    });

    it('has apex near roofHeight', () => {
      const geom = factory.create({ ...baseParams, roofShape: 'dome' });
      const pos = geom!.attributes.position!;
      let maxY = -Infinity;
      for (let i = 0; i < pos.count; i++) {
        maxY = Math.max(maxY, pos.getY(i));
      }
      expect(maxY).toBeCloseTo(5, 0.5);
    });
  });

  describe('onion', () => {
    it('creates geometry with multiple vertices', () => {
      const geom = factory.create({ ...baseParams, roofShape: 'onion' });
      expect(geom).not.toBeNull();
      expect(geom!.attributes.position!.count).toBeGreaterThan(10);
    });
  });

  describe('cone', () => {
    it('creates geometry', () => {
      const geom = factory.create({ ...baseParams, roofShape: 'cone' });
      expect(geom).not.toBeNull();
      expect(geom!.attributes.position!.count).toBeGreaterThan(5);
    });

    it('has apex at roofHeight', () => {
      const geom = factory.create({ ...baseParams, roofShape: 'cone' });
      const pos = geom!.attributes.position!;
      let maxY = -Infinity;
      for (let i = 0; i < pos.count; i++) {
        maxY = Math.max(maxY, pos.getY(i));
      }
      expect(maxY).toBeCloseTo(5, 0.5);
    });

    it('has base at Y=0', () => {
      const geom = factory.create({ ...baseParams, roofShape: 'cone' });
      const pos = geom!.attributes.position!;
      let minY = Infinity;
      for (let i = 0; i < pos.count; i++) {
        minY = Math.min(minY, pos.getY(i));
      }
      expect(minY).toBeCloseTo(0, 5);
    });

    it('elongated rectangle (eccentricity > 1.2) delegates to pyramidal (12 vertices)', () => {
      // 20×5 rectangle: eccentricity = 10/2.5 = 4 → Case B → Pyramidal → 4 edges × 3 = 12
      const elongated: [number, number][] = [
        [10, 2.5],
        [-10, 2.5],
        [-10, -2.5],
        [10, -2.5],
        [10, 2.5],
      ];
      const geom = factory.create({
        ...baseParams,
        outerRing: elongated,
        roofShape: 'cone',
      });
      expect(geom!.attributes.position!.count).toBe(12);
    });
  });

  describe('crosspitched', () => {
    it('creates non-indexed geometry with correct vertex count', () => {
      // rectangle (4 unique verts, closed ring): 2 top + 8 side = 10 × 3 = 30 vertices
      const geom = factory.create({ ...baseParams, roofShape: 'crosspitched' });
      expect(geom).not.toBeNull();
      expect(geom!.index).toBeNull();
      expect(geom!.attributes.position!.count).toBe(30);
    });

    it('all heights are in [0, roofHeight]', () => {
      const geom = factory.create({ ...baseParams, roofShape: 'crosspitched' });
      const pos = geom!.attributes.position!;
      for (let i = 0; i < pos.count; i++) {
        expect(pos.getY(i)).toBeGreaterThanOrEqual(-1e-6);
        expect(pos.getY(i)).toBeLessThanOrEqual(5 + 1e-6);
      }
    });

    it('has at least one upward-facing face (top surface)', () => {
      const geom = factory.create({ ...baseParams, roofShape: 'crosspitched' });
      const pos = geom!.attributes.position!;
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

  describe('gambrel', () => {
    it('creates non-indexed geometry (126 floats = 14 triangles)', () => {
      const geom = factory.create({ ...baseParams, roofShape: 'gambrel' });
      expect(geom).not.toBeNull();
      expect(geom!.index).toBeNull();
      expect(geom!.attributes.position!.count).toBe(42); // 126/3
    });

    it('all heights are in [0, roofHeight]', () => {
      const geom = factory.create({ ...baseParams, roofShape: 'gambrel' });
      const pos = geom!.attributes.position!;
      for (let i = 0; i < pos.count; i++) {
        expect(pos.getY(i)).toBeGreaterThanOrEqual(-1e-6);
        expect(pos.getY(i)).toBeLessThanOrEqual(5 + 1e-6);
      }
    });

    it('has 3 distinct Y levels', () => {
      const geom = factory.create({ ...baseParams, roofShape: 'gambrel' });
      const pos = geom!.attributes.position!;
      const ys = new Set<number>();
      for (let i = 0; i < pos.count; i++) {
        ys.add(Math.round(pos.getY(i) * 1000) / 1000);
      }
      expect(ys.size).toBe(3);
    });
  });

  describe('half-hipped', () => {
    it('creates indexed geometry with 10 vertices and 42 indices', () => {
      const geom = factory.create({ ...baseParams, roofShape: 'half-hipped' });
      expect(geom).not.toBeNull();
      expect(geom!.index).not.toBeNull();
      expect(geom!.attributes.position!.count).toBe(10);
      expect(geom!.index!.count).toBe(42);
    });

    it('apex is at Y=roofHeight', () => {
      const geom = factory.create({ ...baseParams, roofShape: 'half-hipped' });
      const pos = geom!.attributes.position!;
      let maxY = -Infinity;
      for (let i = 0; i < pos.count; i++) maxY = Math.max(maxY, pos.getY(i));
      expect(maxY).toBeCloseTo(5, 5);
    });

    it('half_hipped key also works', () => {
      const geom = factory.create({ ...baseParams, roofShape: 'half_hipped' });
      expect(geom).not.toBeNull();
    });
  });

  describe('mansard', () => {
    it('creates indexed geometry with 12 vertices and 54 indices', () => {
      const geom = factory.create({ ...baseParams, roofShape: 'mansard' });
      expect(geom).not.toBeNull();
      expect(geom!.index).not.toBeNull();
      expect(geom!.attributes.position!.count).toBe(12);
      expect(geom!.index!.count).toBe(54);
    });

    it('has 3 distinct Y levels', () => {
      const geom = factory.create({ ...baseParams, roofShape: 'mansard' });
      const pos = geom!.attributes.position!;
      const ys = new Set<number>();
      for (let i = 0; i < pos.count; i++) {
        ys.add(Math.round(pos.getY(i) * 100) / 100);
      }
      expect(ys.size).toBe(3);
    });
  });

  describe('round', () => {
    it('creates non-indexed geometry', () => {
      const geom = factory.create({ ...baseParams, roofShape: 'round' });
      expect(geom).not.toBeNull();
      expect(geom!.index).toBeNull();
      expect(geom!.attributes.position!.count).toBeGreaterThan(10);
    });

    it('has crown at roofHeight and eaves at Y=0', () => {
      const geom = factory.create({ ...baseParams, roofShape: 'round' });
      const pos = geom!.attributes.position!;
      let minY = Infinity;
      let maxY = -Infinity;
      for (let i = 0; i < pos.count; i++) {
        minY = Math.min(minY, pos.getY(i));
        maxY = Math.max(maxY, pos.getY(i));
      }
      expect(minY).toBeCloseTo(0, 5);
      expect(maxY).toBeCloseTo(5, 1);
    });
  });

  describe('saltbox', () => {
    it('creates non-indexed geometry', () => {
      const geom = factory.create({ ...baseParams, roofShape: 'saltbox' });
      expect(geom).not.toBeNull();
      expect(geom!.index).toBeNull();
    });

    it('base is at Y=0', () => {
      // Side wall base vertices are always at Y=0. The ridge sits between ring vertices
      // for a plain rectangle, so maxY is 0 — the ridge height is only reached when a
      // ring vertex lands at proj=ridgeOffset (tested in SaltboxRoofStrategy.test.ts).
      const geom = factory.create({ ...baseParams, roofShape: 'saltbox' });
      const pos = geom!.attributes.position!;
      let minY = Infinity;
      for (let i = 0; i < pos.count; i++) minY = Math.min(minY, pos.getY(i));
      expect(minY).toBeCloseTo(0, 5);
    });
  });

  describe('sawtooth', () => {
    it('creates non-indexed geometry', () => {
      const geom = factory.create({ ...baseParams, roofShape: 'sawtooth' });
      expect(geom).not.toBeNull();
      expect(geom!.index).toBeNull();
    });

    it('has crown at roofHeight and eaves at Y=0', () => {
      const geom = factory.create({ ...baseParams, roofShape: 'sawtooth' });
      const pos = geom!.attributes.position!;
      let minY = Infinity;
      let maxY = -Infinity;
      for (let i = 0; i < pos.count; i++) {
        minY = Math.min(minY, pos.getY(i));
        maxY = Math.max(maxY, pos.getY(i));
      }
      expect(minY).toBeCloseTo(0, 5);
      expect(maxY).toBeCloseTo(5, 5);
    });

    it('N bays scale with building width (N=2 for halfWidth=5)', () => {
      // rectangle halfWidth=5, BAY_WIDTH=5 → N=max(2,floor(10/5))=2 → 2*6*3=36 vertices
      const geom = factory.create({ ...baseParams, roofShape: 'sawtooth' });
      expect(geom!.attributes.position!.count).toBe(36);
    });
  });
});
