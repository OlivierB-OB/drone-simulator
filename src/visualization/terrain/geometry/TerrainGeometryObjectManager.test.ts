import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BufferGeometry } from 'three';
import { TerrainGeometryObjectManager } from './TerrainGeometryObjectManager';
import { TerrainGeometryObject } from './TerrainGeometryObject';
import { TerrainGeometryFactory } from './TerrainGeometryFactory';
import type { ElevationDataTile } from '../../../data/elevation/types';
import type { ElevationDataManager } from '../../../data/elevation/ElevationDataManager';

describe('TerrainGeometryObjectManager', () => {
  let manager: TerrainGeometryObjectManager;
  let mockElevationData: Partial<ElevationDataManager>;
  let mockFactory: TerrainGeometryFactory;

  beforeEach(() => {
    mockElevationData = {
      on: vi.fn(),
      off: vi.fn(),
    };

    mockFactory = {
      createGeometry: vi.fn(() => new BufferGeometry()),
    } as unknown as TerrainGeometryFactory;

    manager = new TerrainGeometryObjectManager(
      mockElevationData as ElevationDataManager,
      mockFactory
    );
  });

  describe('constructor', () => {
    it('should initialize with empty objects map', () => {
      const newManager = new TerrainGeometryObjectManager(
        mockElevationData as ElevationDataManager
      );
      expect(newManager.getAllGeometries()).toEqual([]);
    });

    it('should use provided factory', () => {
      expect(manager).toBeDefined();
    });

    it('should create default factory if not provided', () => {
      const newManager = new TerrainGeometryObjectManager(
        mockElevationData as ElevationDataManager
      );
      expect(newManager).toBeDefined();
    });
  });

  describe('createGeometry', () => {
    it('should create and store geometry for a tile', () => {
      const tile = createMockTile('9:261:168');

      const result = manager.createGeometry('9:261:168', tile);

      expect(result).toBeInstanceOf(TerrainGeometryObject);
      expect(result.getTileKey()).toBe('9:261:168');
      expect(manager.getAllGeometries()).toHaveLength(1);
    });

    it('should call factory.createGeometry with correct tile', () => {
      const tile = createMockTile('9:261:168');

      manager.createGeometry('9:261:168', tile);

      expect(mockFactory.createGeometry).toHaveBeenCalledWith(tile);
    });

    it('should create multiple geometries', () => {
      const tile1 = createMockTile('9:261:168');
      const tile2 = createMockTile('9:262:168');

      manager.createGeometry('9:261:168', tile1);
      manager.createGeometry('9:262:168', tile2);

      expect(mockFactory.createGeometry).toHaveBeenCalledTimes(2);
      expect(manager.getAllGeometries()).toHaveLength(2);
    });
  });

  describe('removeGeometry', () => {
    it('should remove and dispose geometry for a tile', () => {
      const tile = createMockTile('9:261:168');
      const geometry = manager.createGeometry('9:261:168', tile);
      const disposeSpy = vi.spyOn(geometry, 'dispose');

      manager.removeGeometry('9:261:168');

      expect(disposeSpy).toHaveBeenCalled();
      expect(manager.getAllGeometries()).toHaveLength(0);
    });

    it('should not error when removing non-existent tile', () => {
      expect(() => manager.removeGeometry('9:999:999')).not.toThrow();
    });

    it('should only remove the specified tile', () => {
      const tile1 = createMockTile('9:261:168');
      const tile2 = createMockTile('9:262:168');
      manager.createGeometry('9:261:168', tile1);
      manager.createGeometry('9:262:168', tile2);

      manager.removeGeometry('9:261:168');

      expect(manager.getAllGeometries()).toHaveLength(1);
      expect(manager.getTerrainGeometryObject('9:262:168')).toBeDefined();
    });
  });

  describe('getTerrainGeometryObject', () => {
    it('should return the terrain geometry object for a tile key', () => {
      const tile = createMockTile('9:261:168');
      manager.createGeometry('9:261:168', tile);

      const terrainGeometry = manager.getTerrainGeometryObject('9:261:168');

      expect(terrainGeometry).toBeDefined();
      expect(terrainGeometry).toBeInstanceOf(TerrainGeometryObject);
      expect(terrainGeometry?.getTileKey()).toBe('9:261:168');
    });

    it('should return undefined for non-existent tile key', () => {
      const terrainGeometry = manager.getTerrainGeometryObject('9:999:999');
      expect(terrainGeometry).toBeUndefined();
    });
  });

  describe('getAllGeometries', () => {
    it('should return empty array when no geometries', () => {
      expect(manager.getAllGeometries()).toEqual([]);
    });

    it('should return all geometry objects', () => {
      const tile1 = createMockTile('9:261:168');
      const tile2 = createMockTile('9:262:168');
      manager.createGeometry('9:261:168', tile1);
      manager.createGeometry('9:262:168', tile2);

      const geometries = manager.getAllGeometries();

      expect(geometries).toHaveLength(2);
      expect(geometries).toEqual(
        expect.arrayContaining([
          expect.any(TerrainGeometryObject),
          expect.any(TerrainGeometryObject),
        ])
      );
    });
  });

  describe('dispose', () => {
    it('should dispose all geometry objects', () => {
      const tile1 = createMockTile('9:261:168');
      const tile2 = createMockTile('9:262:168');
      manager.createGeometry('9:261:168', tile1);
      manager.createGeometry('9:262:168', tile2);

      const geometries = manager.getAllGeometries();
      geometries.forEach((geometry) => {
        vi.spyOn(geometry, 'dispose');
      });

      manager.dispose();

      geometries.forEach((geometry) => {
        expect(geometry.dispose).toHaveBeenCalled();
      });
    });

    it('should clear the objects map', () => {
      const tile = createMockTile('9:261:168');
      manager.createGeometry('9:261:168', tile);
      expect(manager.getAllGeometries()).toHaveLength(1);

      manager.dispose();
      expect(manager.getAllGeometries()).toHaveLength(0);
    });
  });
});

/**
 * Helper to create a mock elevation tile
 */
function createMockTile(tileKey: string): ElevationDataTile {
  const parts = tileKey.split(':').map(Number);
  const z = parts[0]!;
  const x = parts[1]!;
  const y = parts[2]!;
  return {
    coordinates: { z, x, y },
    data: Array(256)
      .fill(null)
      .map(() => Array(256).fill(100)),
    tileSize: 256,
    zoomLevel: z,
    mercatorBounds: {
      minX: 0,
      maxX: 1000,
      minY: 0,
      maxY: 1000,
    },
  };
}
