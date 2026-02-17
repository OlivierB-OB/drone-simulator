import { describe, it, expect, beforeEach } from 'vitest';
import { BufferGeometry } from 'three';
import { TerrainMeshFactory } from './TerrainMeshFactory';
import type { ElevationDataTile } from '../../data/elevation/types';

describe('TerrainMeshFactory', () => {
  let factory: TerrainMeshFactory;

  beforeEach(() => {
    factory = new TerrainMeshFactory();
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

    it('should handle terrain with elevation variation', () => {
      const data: number[][] = [];
      for (let y = 0; y < 256; y++) {
        data[y] = [];
        for (let x = 0; x < 256; x++) {
          // Create a simple gradient
          data[y][x] = (x + y) * 10;
        }
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

      // Verify Z values vary (not all flat)
      const positionArray = positions.array as Float32Array;
      const zValues = [];
      for (let i = 2; i < positionArray.length; i += 3) {
        zValues.push(positionArray[i]);
      }

      const minZ = Math.min(...zValues);
      const maxZ = Math.max(...zValues);
      expect(maxZ).toBeGreaterThan(minZ);
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
    data[y] = [];
    for (let x = 0; x < size; x++) {
      data[y][x] = elevation;
    }
  }
  return data;
}
