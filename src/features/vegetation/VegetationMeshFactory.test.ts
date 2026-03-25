import { describe, it, expect, vi } from 'vitest';
import { InstancedMesh } from 'three';
import { VegetationMeshFactory } from './VegetationMeshFactory';
import type { VegetationVisual } from './types';
import type { ElevationSampler } from '../../visualization/mesh/util/ElevationSampler';
import type { GeoCoordinates } from '../../gis/GeoCoordinates';
import type { Point, Polygon } from 'geojson';

const ORIGIN: GeoCoordinates = { lat: 0, lng: 0 };

const mockElevation = {
  sampleAt: vi.fn().mockReturnValue(0),
} as unknown as ElevationSampler;

// ~111m × 111m polygon at equator — large enough to guarantee forest points
const POLYGON: Polygon = {
  type: 'Polygon',
  coordinates: [
    [
      [0, 0],
      [0.001, 0],
      [0.001, 0.001],
      [0, 0.001],
      [0, 0],
    ],
  ],
};

function makeTree(
  lng: number,
  lat: number,
  leafType?: 'broadleaved' | 'needleleaved'
): VegetationVisual {
  const geometry: Point = { type: 'Point', coordinates: [lng, lat] };
  return {
    id: `tree-${lng}-${lat}`,
    geometry,
    type: 'tree',
    height: 10,
    heightCategory: 'medium',
    color: '#2d6b1e',
    leafType,
  };
}

function makeForest(
  leafType?: 'broadleaved' | 'needleleaved'
): VegetationVisual {
  return {
    id: 'forest-1',
    geometry: POLYGON,
    type: 'forest',
    heightCategory: 'tall',
    color: '#2d6b1e',
    leafType,
  };
}

function buildFactory(): VegetationMeshFactory {
  return new VegetationMeshFactory(mockElevation);
}

describe('VegetationMeshFactory', () => {
  describe('empty input', () => {
    it('returns empty array for no vegetation', () => {
      const factory = buildFactory();
      expect(factory.create([], ORIGIN)).toEqual([]);
    });
  });

  describe('single trees (Point geometry)', () => {
    it('returns trunk + broadleaf canopy InstancedMesh for one broadleaf tree', () => {
      const factory = buildFactory();
      const result = factory.create([makeTree(1, 1, 'broadleaved')], ORIGIN);
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(InstancedMesh);
      expect(result[1]).toBeInstanceOf(InstancedMesh);
      expect((result[0] as InstancedMesh).count).toBe(1);
      expect((result[1] as InstancedMesh).count).toBe(1);
    });

    it('returns trunk + needle canopy for needleleaf tree', () => {
      const factory = buildFactory();
      const result = factory.create([makeTree(1, 1, 'needleleaved')], ORIGIN);
      expect(result).toHaveLength(2);
      expect((result[0] as InstancedMesh).count).toBe(1);
      expect((result[1] as InstancedMesh).count).toBe(1);
    });

    it('batches two broadleaf trees into count=2 (not 4 meshes)', () => {
      const factory = buildFactory();
      const result = factory.create(
        [makeTree(1, 1, 'broadleaved'), makeTree(2, 2, 'broadleaved')],
        ORIGIN
      );
      expect(result).toHaveLength(2); // trunk + canopy, not 4
      expect((result[0] as InstancedMesh).count).toBe(2);
      expect((result[1] as InstancedMesh).count).toBe(2);
    });

    it('batches broadleaf + needleleaf into trunk + 2 canopy meshes', () => {
      const factory = buildFactory();
      const result = factory.create(
        [makeTree(1, 1, 'broadleaved'), makeTree(2, 2, 'needleleaved')],
        ORIGIN
      );
      expect(result).toHaveLength(3); // trunk, broadleaf canopy, needle canopy
      expect((result[0] as InstancedMesh).count).toBe(2); // trunk: all trees
      expect((result[1] as InstancedMesh).count).toBe(1); // broadleaf
      expect((result[2] as InstancedMesh).count).toBe(1); // needle
    });
  });

  describe('forest (Polygon geometry)', () => {
    it('returns InstancedMesh objects with count > 0', () => {
      const factory = buildFactory();
      const result = factory.create([makeForest('broadleaved')], ORIGIN);
      expect(result.length).toBeGreaterThanOrEqual(2);
      for (const mesh of result) {
        expect(mesh).toBeInstanceOf(InstancedMesh);
        expect((mesh as InstancedMesh).count).toBeGreaterThan(0);
      }
    });

    it('batches two forests into the same mesh count as one, with double the instance count', () => {
      const factory = buildFactory();
      const single = factory.create([makeForest('broadleaved')], ORIGIN);
      const double = factory.create(
        [
          makeForest('broadleaved'),
          { ...makeForest('broadleaved'), id: 'forest-2' },
        ],
        ORIGIN
      );

      // Still 2 meshes (trunk + canopy), not 4
      expect(double.length).toBe(single.length);

      const singleTrunkCount = (single[0] as InstancedMesh).count;
      const doubleTrunkCount = (double[0] as InstancedMesh).count;
      expect(doubleTrunkCount).toBe(singleTrunkCount * 2);
    });
  });

  describe('mixed vegetation types', () => {
    it('returns tree + bush meshes for forest + scrub', () => {
      const scrub: VegetationVisual = {
        id: 'scrub-1',
        geometry: POLYGON,
        type: 'scrub',
        heightCategory: 'short',
        color: '#4a7a38',
      };
      const factory = buildFactory();
      const result = factory.create([makeForest('broadleaved'), scrub], ORIGIN);

      // trunk + canopy (trees) + bush
      expect(result.length).toBeGreaterThanOrEqual(3);
      for (const mesh of result) {
        expect(mesh).toBeInstanceOf(InstancedMesh);
      }
    });
  });

  describe('error handling', () => {
    it('skips unknown vegetation types without throwing', () => {
      const factory = buildFactory();
      const unknown: VegetationVisual = {
        id: 'unknown-1',
        geometry: { type: 'Point', coordinates: [0, 0] },
        type: 'unknown_type',
        heightCategory: 'medium',
        color: '#2d6b1e',
      };
      expect(() => factory.create([unknown], ORIGIN)).not.toThrow();
      expect(factory.create([unknown], ORIGIN)).toEqual([]);
    });

    it('processes remaining features when one fails', () => {
      const factory = buildFactory();
      const unknown: VegetationVisual = {
        id: 'unknown-1',
        geometry: { type: 'Point', coordinates: [0, 0] },
        type: 'unknown_type',
        heightCategory: 'medium',
        color: '#2d6b1e',
      };
      // unknown skipped, valid tree still processed
      const result = factory.create(
        [unknown, makeTree(1, 1, 'broadleaved')],
        ORIGIN
      );
      expect(result).toHaveLength(2);
      expect((result[0] as InstancedMesh).count).toBe(1);
    });
  });
});
