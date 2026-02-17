import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Mesh, BufferGeometry } from 'three';
import { TerrainObjectManager } from './TerrainObjectManager';
import { TerrainObjectFactory } from './TerrainObjectFactory';
import { TerrainGeometryObjectManager } from './geometry/TerrainGeometryObjectManager';
import { TerrainObject } from './TerrainObject';
import { Scene } from '../../3Dviewer/Scene';
import type { ElevationDataTile } from '../../data/elevation/types';

describe('TerrainObjectManager', () => {
  let manager: TerrainObjectManager;
  let mockScene: Scene;
  let mockGeometryManager: TerrainGeometryObjectManager;
  let mockFactory: TerrainObjectFactory;
  let mockElevationManager: any;

  beforeEach(() => {
    // Create mock scene
    mockScene = {
      add: vi.fn(),
      remove: vi.fn(),
    } as unknown as Scene;

    // Create real geometry manager with mock factory
    const mockGeometryFactory = {
      createGeometry: vi.fn(() => new BufferGeometry()),
    } as any;
    mockGeometryManager = new TerrainGeometryObjectManager(mockGeometryFactory);

    // Create real factory (will use real constructors)
    mockFactory = new TerrainObjectFactory();

    // Create mock elevation manager
    mockElevationManager = {
      getTileCache: vi.fn(() => new Map()),
    };

    manager = new TerrainObjectManager(
      mockScene,
      mockGeometryManager,
      mockFactory
    );
  });

  describe('constructor', () => {
    it('should initialize with empty objects map', () => {
      expect(manager.getAllObjects()).toEqual([]);
    });

    it('should accept injected factory', () => {
      const customFactory = new TerrainObjectFactory();
      const newManager = new TerrainObjectManager(
        mockScene,
        mockGeometryManager,
        customFactory
      );
      expect(newManager).toBeDefined();
    });

    it('should create default factory if not provided', () => {
      const newManager = new TerrainObjectManager(
        mockScene,
        mockGeometryManager
      );
      expect(newManager).toBeDefined();
    });
  });

  describe('refresh', () => {
    it('should add new terrain objects to scene', () => {
      const tile = createMockTile('9:261:168');
      const tiles = new Map([['9:261:168', tile]]);
      mockElevationManager.getTileCache.mockReturnValue(tiles);

      manager.refresh(mockElevationManager);

      expect(mockScene.add).toHaveBeenCalled();
      expect(manager.getAllObjects()).toHaveLength(1);
    });

    it('should remove terrain objects from scene', () => {
      const tile1 = createMockTile('9:261:168');
      const tile2 = createMockTile('9:262:168');

      // First refresh: add both tiles
      let tiles = new Map([
        ['9:261:168', tile1],
        ['9:262:168', tile2],
      ]);
      mockElevationManager.getTileCache.mockReturnValue(tiles);
      manager.refresh(mockElevationManager);

      expect(manager.getAllObjects()).toHaveLength(2);

      // Second refresh: remove one tile
      vi.clearAllMocks();
      tiles = new Map([['9:261:168', tile1]]);
      mockElevationManager.getTileCache.mockReturnValue(tiles);
      manager.refresh(mockElevationManager);

      expect(mockScene.remove).toHaveBeenCalled();
      expect(manager.getAllObjects()).toHaveLength(1);
    });

    it('should not change anything when tile set is unchanged', () => {
      const tile = createMockTile('9:261:168');
      const tiles = new Map([['9:261:168', tile]]);
      mockElevationManager.getTileCache.mockReturnValue(tiles);

      // First refresh
      manager.refresh(mockElevationManager);
      expect(mockScene.add).toHaveBeenCalledTimes(1);

      // Second refresh without changes
      vi.clearAllMocks();
      mockElevationManager.getTileCache.mockReturnValue(tiles);
      manager.refresh(mockElevationManager);

      expect(mockScene.add).not.toHaveBeenCalled();
      expect(mockScene.remove).not.toHaveBeenCalled();
    });

    it('should add and remove objects in single refresh', () => {
      const tile1 = createMockTile('9:261:168');
      const tile2 = createMockTile('9:262:168');
      const tile3 = createMockTile('9:263:168');

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

      expect(mockScene.add).toHaveBeenCalledOnce(); // tile 3
      expect(mockScene.remove).toHaveBeenCalledOnce(); // tile 2
      expect(manager.getAllObjects()).toHaveLength(2);
    });

    it('should pass mesh to scene.add()', () => {
      const tile = createMockTile('9:261:168');
      const tiles = new Map([['9:261:168', tile]]);
      mockElevationManager.getTileCache.mockReturnValue(tiles);

      manager.refresh(mockElevationManager);

      const addCalls = (mockScene.add as any).mock.calls;
      expect(addCalls.length).toBeGreaterThan(0);
      expect(addCalls[0][0]).toBeInstanceOf(Mesh);
    });

    it('should pass mesh to scene.remove()', () => {
      const tile1 = createMockTile('9:261:168');
      const tile2 = createMockTile('9:262:168');

      // Add two tiles
      let tiles = new Map([
        ['9:261:168', tile1],
        ['9:262:168', tile2],
      ]);
      mockElevationManager.getTileCache.mockReturnValue(tiles);
      manager.refresh(mockElevationManager);

      // Remove one tile
      vi.clearAllMocks();
      tiles = new Map([['9:261:168', tile1]]);
      mockElevationManager.getTileCache.mockReturnValue(tiles);
      manager.refresh(mockElevationManager);

      const removeCalls = (mockScene.remove as any).mock.calls;
      expect(removeCalls.length).toBeGreaterThan(0);
      expect(removeCalls[0][0]).toBeInstanceOf(Mesh);
    });
  });

  describe('getTerrainObject', () => {
    it('should return the terrain object for a tile key', () => {
      const tile = createMockTile('9:261:168');
      const tiles = new Map([['9:261:168', tile]]);
      mockElevationManager.getTileCache.mockReturnValue(tiles);

      manager.refresh(mockElevationManager);
      const terrainObject = manager.getTerrainObject('9:261:168');

      expect(terrainObject).toBeDefined();
      expect(terrainObject).toBeInstanceOf(TerrainObject);
      expect(terrainObject?.getTileKey()).toBe('9:261:168');
    });

    it('should return undefined for non-existent tile key', () => {
      const terrainObject = manager.getTerrainObject('9:999:999');
      expect(terrainObject).toBeUndefined();
    });
  });

  describe('getAllObjects', () => {
    it('should return empty array when no objects', () => {
      const objects = manager.getAllObjects();
      expect(objects).toEqual([]);
    });

    it('should return all terrain objects', () => {
      const tile1 = createMockTile('9:261:168');
      const tile2 = createMockTile('9:262:168');
      const tiles = new Map([
        ['9:261:168', tile1],
        ['9:262:168', tile2],
      ]);
      mockElevationManager.getTileCache.mockReturnValue(tiles);

      manager.refresh(mockElevationManager);
      const objects = manager.getAllObjects();

      expect(objects).toHaveLength(2);
      expect(objects).toEqual(
        expect.arrayContaining([
          expect.any(TerrainObject),
          expect.any(TerrainObject),
        ])
      );
    });

    it('should return updated list after refresh', () => {
      const tile1 = createMockTile('9:261:168');
      let tiles = new Map([['9:261:168', tile1]]);
      mockElevationManager.getTileCache.mockReturnValue(tiles);

      manager.refresh(mockElevationManager);
      expect(manager.getAllObjects()).toHaveLength(1);

      const tile2 = createMockTile('9:262:168');
      tiles = new Map([
        ['9:261:168', tile1],
        ['9:262:168', tile2],
      ]);
      mockElevationManager.getTileCache.mockReturnValue(tiles);

      manager.refresh(mockElevationManager);
      expect(manager.getAllObjects()).toHaveLength(2);
    });
  });

  describe('dispose', () => {
    it('should dispose all terrain objects', () => {
      const tile1 = createMockTile('9:261:168');
      const tile2 = createMockTile('9:262:168');
      const tiles = new Map([
        ['9:261:168', tile1],
        ['9:262:168', tile2],
      ]);
      mockElevationManager.getTileCache.mockReturnValue(tiles);

      manager.refresh(mockElevationManager);

      // Spy on dispose for terrain objects
      const objects = manager.getAllObjects();
      objects.forEach((obj) => {
        vi.spyOn(obj, 'dispose');
      });

      manager.dispose();

      objects.forEach((obj) => {
        expect(obj.dispose).toHaveBeenCalled();
      });
    });

    it('should remove all objects from scene', () => {
      const tile1 = createMockTile('9:261:168');
      const tile2 = createMockTile('9:262:168');
      const tiles = new Map([
        ['9:261:168', tile1],
        ['9:262:168', tile2],
      ]);
      mockElevationManager.getTileCache.mockReturnValue(tiles);

      manager.refresh(mockElevationManager);
      vi.clearAllMocks();

      manager.dispose();

      expect(mockScene.remove).toHaveBeenCalledTimes(2);
    });

    it('should clear the objects map', () => {
      const tile = createMockTile('9:261:168');
      const tiles = new Map([['9:261:168', tile]]);
      mockElevationManager.getTileCache.mockReturnValue(tiles);

      manager.refresh(mockElevationManager);
      expect(manager.getAllObjects()).toHaveLength(1);

      manager.dispose();
      expect(manager.getAllObjects()).toHaveLength(0);
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
