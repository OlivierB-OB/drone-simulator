import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BufferGeometry } from 'three';
import { TerrainMeshObjectManager } from './TerrainMeshObjectManager';
import { TerrainMeshObject } from './TerrainMeshObject';
import { TerrainMeshFactory } from './TerrainMeshFactory';
import type { ElevationDataTile } from '../../data/elevation/types';

describe('TerrainMeshObjectManager', () => {
  let manager: TerrainMeshObjectManager;
  let mockFactory: TerrainMeshFactory;
  let mockElevationManager: any;

  beforeEach(() => {
    // Create mock factory
    mockFactory = {
      createGeometry: vi.fn(() => new BufferGeometry()),
    } as unknown as TerrainMeshFactory;

    // Create mock elevation manager
    mockElevationManager = {
      getTileCache: vi.fn(() => new Map()),
    };

    manager = new TerrainMeshObjectManager(mockFactory);
  });

  describe('constructor', () => {
    it('should initialize with empty objects map', () => {
      const newManager = new TerrainMeshObjectManager();
      expect(newManager.getAllMeshes()).toEqual([]);
    });

    it('should use provided factory', () => {
      expect(manager).toBeDefined();
    });

    it('should create default factory if not provided', () => {
      const newManager = new TerrainMeshObjectManager();
      expect(newManager).toBeDefined();
    });
  });

  describe('refresh', () => {
    it('should not change anything when tile set is unchanged', () => {
      const tile1: ElevationDataTile = createMockTile('9:261:168');
      const tiles = new Map([['9:261:168', tile1]]);
      mockElevationManager.getTileCache.mockReturnValue(tiles);

      // Add initial tile
      manager.refresh(mockElevationManager);
      expect(mockFactory.createGeometry).toHaveBeenCalledOnce();

      // Refresh without changes
      vi.clearAllMocks();
      mockElevationManager.getTileCache.mockReturnValue(tiles);
      manager.refresh(mockElevationManager);

      expect(mockFactory.createGeometry).not.toHaveBeenCalled();
    });

    it('should add new tiles from elevation manager', () => {
      const tile1: ElevationDataTile = createMockTile('9:261:168');
      const tile2: ElevationDataTile = createMockTile('9:262:168');
      const tiles = new Map([
        ['9:261:168', tile1],
        ['9:262:168', tile2],
      ]);
      mockElevationManager.getTileCache.mockReturnValue(tiles);

      manager.refresh(mockElevationManager);

      expect(mockFactory.createGeometry).toHaveBeenCalledTimes(2);
      expect(manager.getAllMeshes()).toHaveLength(2);
    });

    it('should remove tiles no longer in elevation manager', () => {
      const tile1: ElevationDataTile = createMockTile('9:261:168');
      const tile2: ElevationDataTile = createMockTile('9:262:168');

      // First refresh: add both tiles
      let tiles = new Map([
        ['9:261:168', tile1],
        ['9:262:168', tile2],
      ]);
      mockElevationManager.getTileCache.mockReturnValue(tiles);
      manager.refresh(mockElevationManager);

      expect(manager.getAllMeshes()).toHaveLength(2);

      // Second refresh: remove one tile
      vi.clearAllMocks();
      tiles = new Map([['9:261:168', tile1]]);
      mockElevationManager.getTileCache.mockReturnValue(tiles);
      manager.refresh(mockElevationManager);

      expect(manager.getAllMeshes()).toHaveLength(1);
    });

    it('should add and remove tiles in single refresh', () => {
      const tile1: ElevationDataTile = createMockTile('9:261:168');
      const tile2: ElevationDataTile = createMockTile('9:262:168');
      const tile3: ElevationDataTile = createMockTile('9:263:168');

      // First refresh: add tiles 1 and 2
      let tiles = new Map([
        ['9:261:168', tile1],
        ['9:262:168', tile2],
      ]);
      mockElevationManager.getTileCache.mockReturnValue(tiles);
      manager.refresh(mockElevationManager);

      // Second refresh: keep tile 1, remove tile 2, add tile 3
      vi.clearAllMocks();
      tiles = new Map([
        ['9:261:168', tile1],
        ['9:263:168', tile3],
      ]);
      mockElevationManager.getTileCache.mockReturnValue(tiles);
      manager.refresh(mockElevationManager);

      expect(mockFactory.createGeometry).toHaveBeenCalledOnce(); // tile 3
      expect(manager.getAllMeshes()).toHaveLength(2);
    });

    it('should call factory.createGeometry with correct tile', () => {
      const tile: ElevationDataTile = createMockTile('9:261:168');
      const tiles = new Map([['9:261:168', tile]]);
      mockElevationManager.getTileCache.mockReturnValue(tiles);

      manager.refresh(mockElevationManager);

      expect(mockFactory.createGeometry).toHaveBeenCalledWith(tile);
    });
  });

  describe('getTerrainMeshObject', () => {
    it('should return the terrain mesh object for a tile key', () => {
      const tile: ElevationDataTile = createMockTile('9:261:168');
      const tiles = new Map([['9:261:168', tile]]);
      mockElevationManager.getTileCache.mockReturnValue(tiles);

      manager.refresh(mockElevationManager);
      const terrainMesh = manager.getTerrainMeshObject('9:261:168');

      expect(terrainMesh).toBeDefined();
      expect(terrainMesh).toBeInstanceOf(TerrainMeshObject);
      expect(terrainMesh?.getTileKey()).toBe('9:261:168');
    });

    it('should return undefined for non-existent tile key', () => {
      const terrainMesh = manager.getTerrainMeshObject('9:999:999');
      expect(terrainMesh).toBeUndefined();
    });
  });

  describe('getAllMeshes', () => {
    it('should return empty array when no meshes', () => {
      const meshes = manager.getAllMeshes();
      expect(meshes).toEqual([]);
    });

    it('should return all surface mesh objects', () => {
      const tile1: ElevationDataTile = createMockTile('9:261:168');
      const tile2: ElevationDataTile = createMockTile('9:262:168');
      const tiles = new Map([
        ['9:261:168', tile1],
        ['9:262:168', tile2],
      ]);
      mockElevationManager.getTileCache.mockReturnValue(tiles);

      manager.refresh(mockElevationManager);
      const meshes = manager.getAllMeshes();

      expect(meshes).toHaveLength(2);
      expect(meshes).toEqual(
        expect.arrayContaining([
          expect.any(TerrainMeshObject),
          expect.any(TerrainMeshObject),
        ])
      );
    });

    it('should return updated list after refresh', () => {
      const tile1: ElevationDataTile = createMockTile('9:261:168');
      let tiles = new Map([['9:261:168', tile1]]);
      mockElevationManager.getTileCache.mockReturnValue(tiles);

      manager.refresh(mockElevationManager);
      expect(manager.getAllMeshes()).toHaveLength(1);

      const tile2: ElevationDataTile = createMockTile('9:262:168');
      tiles = new Map([
        ['9:261:168', tile1],
        ['9:262:168', tile2],
      ]);
      mockElevationManager.getTileCache.mockReturnValue(tiles);

      manager.refresh(mockElevationManager);
      expect(manager.getAllMeshes()).toHaveLength(2);
    });
  });

  describe('dispose', () => {
    it('should dispose all surface mesh objects', () => {
      const tile1: ElevationDataTile = createMockTile('9:261:168');
      const tile2: ElevationDataTile = createMockTile('9:262:168');
      const tiles = new Map([
        ['9:261:168', tile1],
        ['9:262:168', tile2],
      ]);
      mockElevationManager.getTileCache.mockReturnValue(tiles);

      manager.refresh(mockElevationManager);

      // Spy on dispose for surface meshes
      const meshes = manager.getAllMeshes();
      meshes.forEach((mesh) => {
        vi.spyOn(mesh, 'dispose');
      });

      manager.dispose();

      meshes.forEach((mesh) => {
        expect(mesh.dispose).toHaveBeenCalled();
      });
    });

    it('should clear the objects map', () => {
      const tile: ElevationDataTile = createMockTile('9:261:168');
      const tiles = new Map([['9:261:168', tile]]);
      mockElevationManager.getTileCache.mockReturnValue(tiles);

      manager.refresh(mockElevationManager);
      expect(manager.getAllMeshes()).toHaveLength(1);

      manager.dispose();
      expect(manager.getAllMeshes()).toHaveLength(0);
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
