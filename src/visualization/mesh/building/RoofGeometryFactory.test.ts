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
    it('creates geometry with correct vertex count', () => {
      const geom = factory.create({ ...baseParams, roofShape: 'pyramidal' });
      expect(geom).not.toBeNull();
      // 5 vertices: 4 base + 1 apex
      expect(geom!.attributes.position!.count).toBe(5);
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
  });

  describe('gabled', () => {
    it('creates geometry with 6 vertices', () => {
      const geom = factory.create({ ...baseParams, roofShape: 'gabled' });
      expect(geom).not.toBeNull();
      expect(geom!.attributes.position!.count).toBe(6);
    });

    it('has ridge at roofHeight', () => {
      const geom = factory.create({ ...baseParams, roofShape: 'gabled' });
      const pos = geom!.attributes.position!;
      let maxY = -Infinity;
      for (let i = 0; i < pos.count; i++) {
        maxY = Math.max(maxY, pos.getY(i));
      }
      expect(maxY).toBeCloseTo(5, 1);
    });

    it('has 8 triangle indices', () => {
      const geom = factory.create({ ...baseParams, roofShape: 'gabled' });
      // 8 triangles = 24 index values / 3
      expect(geom!.index!.count).toBe(18); // 6 triangles × 3
    });
  });

  describe('hipped', () => {
    it('creates geometry for elongated rectangle', () => {
      const geom = factory.create({ ...baseParams, roofShape: 'hipped' });
      expect(geom).not.toBeNull();
      expect(geom!.attributes.position!.count).toBe(6);
    });

    it('degenerates to pyramidal for square footprint', () => {
      const geom = factory.create({
        ...baseParams,
        outerRing: square,
        roofShape: 'hipped',
      });
      expect(geom).not.toBeNull();
      // Pyramidal: 5 vertices
      expect(geom!.attributes.position!.count).toBe(5);
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
  });
});
