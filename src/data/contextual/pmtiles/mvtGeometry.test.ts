import { describe, it, expect } from 'vitest';
import { mvtToGeoGeometry } from './mvtGeometry';
import type { VectorTileFeature } from '@mapbox/vector-tile';

function mockFeature(
  type: 1 | 2 | 3,
  rawGeom: { x: number; y: number }[][],
  extent = 4096
): VectorTileFeature {
  return {
    type,
    extent,
    loadGeometry: () => rawGeom,
    properties: {},
  } as unknown as VectorTileFeature;
}

const bounds = { minLat: 300, maxLat: 400, minLng: 100, maxLng: 200 };

describe('mvtToGeoGeometry', () => {
  describe('Point (type 1)', () => {
    it('converts a point at tile origin to maxY corner', () => {
      const f = mockFeature(1, [[{ x: 0, y: 0 }]]);
      const geom = mvtToGeoGeometry(f, bounds);

      expect(geom).not.toBeNull();
      expect(geom!.type).toBe('Point');
      expect((geom as any).coordinates[0]).toBeCloseTo(100); // minX
      expect((geom as any).coordinates[1]).toBeCloseTo(400); // maxY
    });

    it('converts a point at tile center', () => {
      const f = mockFeature(1, [[{ x: 2048, y: 2048 }]]);
      const geom = mvtToGeoGeometry(f, bounds);

      expect(geom).not.toBeNull();
      expect((geom as any).coordinates[0]).toBeCloseTo(150); // midX
      expect((geom as any).coordinates[1]).toBeCloseTo(350); // midY
    });

    it('converts a point at tile max to minY corner', () => {
      const f = mockFeature(1, [[{ x: 4096, y: 4096 }]]);
      const geom = mvtToGeoGeometry(f, bounds);

      expect(geom).not.toBeNull();
      expect((geom as any).coordinates[0]).toBeCloseTo(200); // maxX
      expect((geom as any).coordinates[1]).toBeCloseTo(300); // minY
    });

    it('returns null for empty geometry', () => {
      const f = mockFeature(1, []);
      expect(mvtToGeoGeometry(f, bounds)).toBeNull();
    });
  });

  describe('LineString (type 2)', () => {
    it('converts a two-point line', () => {
      const f = mockFeature(2, [
        [
          { x: 0, y: 0 },
          { x: 4096, y: 4096 },
        ],
      ]);
      const geom = mvtToGeoGeometry(f, bounds);

      expect(geom).not.toBeNull();
      expect(geom!.type).toBe('LineString');
      const coords = (geom as any).coordinates;
      expect(coords).toHaveLength(2);
      expect(coords[0][0]).toBeCloseTo(100);
      expect(coords[0][1]).toBeCloseTo(400);
      expect(coords[1][0]).toBeCloseTo(200);
      expect(coords[1][1]).toBeCloseTo(300);
    });

    it('returns null for single-point line', () => {
      const f = mockFeature(2, [[{ x: 0, y: 0 }]]);
      expect(mvtToGeoGeometry(f, bounds)).toBeNull();
    });

    it('returns null for empty geometry', () => {
      const f = mockFeature(2, []);
      expect(mvtToGeoGeometry(f, bounds)).toBeNull();
    });
  });

  describe('Polygon (type 3)', () => {
    it('converts a square polygon', () => {
      const f = mockFeature(3, [
        [
          { x: 0, y: 0 },
          { x: 4096, y: 0 },
          { x: 4096, y: 4096 },
          { x: 0, y: 4096 },
          { x: 0, y: 0 },
        ],
      ]);
      const geom = mvtToGeoGeometry(f, bounds);

      expect(geom).not.toBeNull();
      expect(geom!.type).toBe('Polygon');
      const coords = (geom as any).coordinates;
      expect(coords).toHaveLength(1); // one ring
      expect(coords[0]).toHaveLength(5); // 4 corners + close
    });

    it('auto-closes unclosed rings', () => {
      const f = mockFeature(3, [
        [
          { x: 0, y: 0 },
          { x: 4096, y: 0 },
          { x: 4096, y: 4096 },
          { x: 0, y: 4096 },
          // not closed
        ],
      ]);
      const geom = mvtToGeoGeometry(f, bounds);

      expect(geom).not.toBeNull();
      const coords = (geom as any).coordinates[0];
      const first = coords[0];
      const last = coords[coords.length - 1];
      expect(first[0]).toBeCloseTo(last[0]);
      expect(first[1]).toBeCloseTo(last[1]);
    });

    it('returns null for degenerate ring (< 3 points)', () => {
      const f = mockFeature(3, [
        [
          { x: 0, y: 0 },
          { x: 4096, y: 0 },
        ],
      ]);
      expect(mvtToGeoGeometry(f, bounds)).toBeNull();
    });
  });

  describe('custom extent', () => {
    it('works with non-default extent', () => {
      const f = mockFeature(1, [[{ x: 256, y: 256 }]], 512);
      const geom = mvtToGeoGeometry(f, bounds);

      expect(geom).not.toBeNull();
      expect((geom as any).coordinates[0]).toBeCloseTo(150); // midX
      expect((geom as any).coordinates[1]).toBeCloseTo(350); // midY
    });
  });

  describe('unknown geometry type', () => {
    it('returns null for unsupported type', () => {
      const f = mockFeature(0 as any, []);
      expect(mvtToGeoGeometry(f, bounds)).toBeNull();
    });
  });
});
