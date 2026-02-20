import { describe, it, expect, beforeEach } from 'vitest';
import { BufferGeometry } from 'three';
import { TerrainGeometryFactory } from './TerrainGeometryFactory';
import type { ElevationDataTile } from '../../../data/elevation/types';

describe('TerrainGeometryFactory', () => {
  let factory: TerrainGeometryFactory;

  beforeEach(() => {
    factory = new TerrainGeometryFactory();
  });

  describe('createGeometry', () => {
    it('should create geometry from an elevation tile', () => {
      const tile: ElevationDataTile = {
        coordinates: { z: 9, x: 261, y: 168 },
        data: createFlatElevationData(256),
        tileSize: 256,
        zoomLevel: 9,
        mercatorBounds: {
          minX: 0,
          maxX: 1000,
          minY: 0,
          maxY: 1000,
        },
      };

      const geometry = factory.createGeometry(tile);

      expect(geometry).toBeDefined();
      expect(geometry).toBeInstanceOf(BufferGeometry);
    });

    it('should create geometry with correct vertex count', () => {
      const tile: ElevationDataTile = {
        coordinates: { z: 9, x: 261, y: 168 },
        data: createFlatElevationData(256),
        tileSize: 256,
        zoomLevel: 9,
        mercatorBounds: {
          minX: 0,
          maxX: 1000,
          minY: 0,
          maxY: 1000,
        },
      };

      const geometry = factory.createGeometry(tile);
      const positions = geometry.getAttribute('position');

      // 256×256 = 65,536 vertices
      expect(positions.count).toBe(256 * 256);
    });

    it('should create geometry with correct triangle count', () => {
      const tile: ElevationDataTile = {
        coordinates: { z: 9, x: 261, y: 168 },
        data: createFlatElevationData(256),
        tileSize: 256,
        zoomLevel: 9,
        mercatorBounds: {
          minX: 0,
          maxX: 1000,
          minY: 0,
          maxY: 1000,
        },
      };

      const geometry = factory.createGeometry(tile);
      const indices = geometry.getIndex();

      // (256-1)×(256-1) cells, 2 triangles per cell = 255×255×2 indices
      const expectedIndices = 255 * 255 * 2 * 3; // 3 indices per triangle
      expect(indices?.count).toBe(expectedIndices);
    });

    it('should generate normals for lighting', () => {
      const tile: ElevationDataTile = {
        coordinates: { z: 9, x: 261, y: 168 },
        data: createFlatElevationData(256),
        tileSize: 256,
        zoomLevel: 9,
        mercatorBounds: {
          minX: 0,
          maxX: 1000,
          minY: 0,
          maxY: 1000,
        },
      };

      const geometry = factory.createGeometry(tile);
      const normals = geometry.getAttribute('normal');

      expect(normals).toBeDefined();
      expect(normals.count).toBe(256 * 256);
    });

    it('should create geometry with UV coordinates', () => {
      const tile: ElevationDataTile = {
        coordinates: { z: 9, x: 261, y: 168 },
        data: createFlatElevationData(256),
        tileSize: 256,
        zoomLevel: 9,
        mercatorBounds: {
          minX: 0,
          maxX: 1000,
          minY: 0,
          maxY: 1000,
        },
      };

      const geometry = factory.createGeometry(tile);
      const uvs = geometry.getAttribute('uv');

      expect(uvs).toBeDefined();
      expect(uvs.itemSize).toBe(2); // U, V components
      expect(uvs.count).toBe(256 * 256); // One UV pair per vertex
    });

    it('should map UV coordinates from 0 to 1 across tile', () => {
      const tile: ElevationDataTile = {
        coordinates: { z: 9, x: 261, y: 168 },
        data: createFlatElevationData(256),
        tileSize: 256,
        zoomLevel: 9,
        mercatorBounds: {
          minX: 0,
          maxX: 1000,
          minY: 0,
          maxY: 1000,
        },
      };

      const geometry = factory.createGeometry(tile);
      const uvs = geometry.getAttribute('uv');
      const uvsArray = uvs.array as Float32Array;

      // Check corners: (0,0) should be at start, (1,1) at end
      // First vertex (0,0): indices 0, 1
      expect(uvsArray[0]).toBe(0); // U = 0
      expect(uvsArray[1]).toBe(0); // V = 0

      // Last vertex (255,255): indices at end
      const lastIndex = uvsArray.length - 2;
      expect(uvsArray[lastIndex]).toBe(1); // U = 1
      expect(uvsArray[lastIndex + 1]).toBe(1); // V = 1
    });

    it('should linearly interpolate UV coordinates across tile', () => {
      const tile: ElevationDataTile = {
        coordinates: { z: 9, x: 261, y: 168 },
        data: createFlatElevationData(256),
        tileSize: 256,
        zoomLevel: 9,
        mercatorBounds: {
          minX: 0,
          maxX: 1000,
          minY: 0,
          maxY: 1000,
        },
      };

      const geometry = factory.createGeometry(tile);
      const uvs = geometry.getAttribute('uv');
      const uvsArray = uvs.array as Float32Array;

      // Test middle vertex (128,128) = index 128*256 + 128 = 32896
      const middleIndex = (128 * 256 + 128) * 2;
      const expectedUV = 128 / 255;
      expect(uvsArray[middleIndex]).toBeCloseTo(expectedUV, 4); // U
      expect(uvsArray[middleIndex + 1]).toBeCloseTo(expectedUV, 4); // V
    });

    it('should handle terrain with elevation variation', () => {
      const data: number[][] = [];
      for (let y = 0; y < 256; y++) {
        const row: number[] = [];
        for (let x = 0; x < 256; x++) {
          // Create a simple gradient
          row[x] = (x + y) * 10;
        }
        data[y] = row;
      }

      const tile: ElevationDataTile = {
        coordinates: { z: 9, x: 261, y: 168 },
        data,
        tileSize: 256,
        zoomLevel: 9,
        mercatorBounds: {
          minX: 0,
          maxX: 1000,
          minY: 0,
          maxY: 1000,
        },
      };

      const geometry = factory.createGeometry(tile);
      const positions = geometry.getAttribute('position');

      // Verify Y values vary (elevation on Y-axis, not all flat)
      const positionArray = positions.array as Float32Array;
      const yValues: number[] = [];
      for (let i = 1; i < positionArray.length; i += 3) {
        yValues.push(positionArray[i]!);
      }

      if (yValues.length > 0) {
        const minY = Math.min(...yValues);
        const maxY = Math.max(...yValues);
        expect(maxY).toBeGreaterThan(minY);
      }
    });
  });

  describe('flat terrain edge case', () => {
    it('should handle flat terrain (all same elevation)', () => {
      const tile: ElevationDataTile = {
        coordinates: { z: 9, x: 261, y: 168 },
        data: createFlatElevationData(256, 100),
        tileSize: 256,
        zoomLevel: 9,
        mercatorBounds: {
          minX: 0,
          maxX: 1000,
          minY: 0,
          maxY: 1000,
        },
      };

      const geometry = factory.createGeometry(tile);

      expect(geometry).toBeDefined();
    });
  });
});

/**
 * Helper to create a flat elevation data grid
 */
function createFlatElevationData(
  size: number,
  elevation: number = 0
): number[][] {
  const data: number[][] = [];
  for (let y = 0; y < size; y++) {
    const row: number[] = [];
    for (let x = 0; x < size; x++) {
      row[x] = elevation;
    }
    data[y] = row;
  }
  return data;
}
