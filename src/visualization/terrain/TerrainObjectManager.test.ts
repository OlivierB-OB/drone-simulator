import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Mesh, BufferGeometry } from 'three';
import { TerrainObjectManager } from './TerrainObjectManager';
import { TerrainObjectFactory } from './TerrainObjectFactory';
import { TerrainGeometryObjectManager } from './geometry/TerrainGeometryObjectManager';
import { TerrainTextureObjectManager } from './texture/TerrainTextureObjectManager';
import { TerrainObject } from './TerrainObject';
import { Scene } from '../../3Dviewer/Scene';
import type { ElevationDataTile } from '../../data/elevation/types';
import type { ContextDataTile } from '../../data/contextual/types';
import type { ElevationDataManager } from '../../data/elevation/ElevationDataManager';

describe('TerrainObjectManager', () => {
  let manager: TerrainObjectManager;
  let mockScene: Scene;
  let mockGeometryManager: TerrainGeometryObjectManager;
  let mockTextureManager: TerrainTextureObjectManager;
  let mockFactory: TerrainObjectFactory;
  let mockElevationData: Partial<ElevationDataManager>;

  beforeEach(() => {
    mockScene = {
      add: vi.fn(),
      remove: vi.fn(),
    } as unknown as Scene;

    mockElevationData = {
      on: vi.fn(),
      off: vi.fn(),
    };

    const mockGeometryFactory = {
      createGeometry: vi.fn(() => new BufferGeometry()),
    } as any;
    mockGeometryManager = new TerrainGeometryObjectManager(
      mockElevationData as ElevationDataManager,
      mockGeometryFactory
    );

    mockTextureManager = {
      createTexture: vi.fn(() => null),
      removeTexture: vi.fn(),
      getTerrainTextureObject: vi.fn(() => undefined),
      dispose: vi.fn(),
    } as unknown as TerrainTextureObjectManager;

    mockFactory = new TerrainObjectFactory();

    manager = new TerrainObjectManager(
      mockScene,
      mockGeometryManager,
      mockTextureManager,
      mockFactory
    );
  });

  describe('constructor', () => {
    it('should initialize with empty objects map', () => {
      expect(manager.getAllObjects()).toEqual([]);
    });

    it('should create default factory if not provided', () => {
      const newManager = new TerrainObjectManager(
        mockScene,
        mockGeometryManager
      );
      expect(newManager).toBeDefined();
    });
  });

  describe('handleElevationTileAdded', () => {
    it('should add terrain object to scene', () => {
      const tile = createMockElevationTile('9:261:168');

      manager.handleElevationTileAdded('9:261:168', tile, null);

      expect(mockScene.add).toHaveBeenCalled();
      expect(manager.getAllObjects()).toHaveLength(1);
    });

    it('should create geometry via geometry manager', () => {
      const tile = createMockElevationTile('9:261:168');
      const createSpy = vi.spyOn(mockGeometryManager, 'createGeometry');

      manager.handleElevationTileAdded('9:261:168', tile, null);

      expect(createSpy).toHaveBeenCalledWith('9:261:168', tile);
    });

    it('should create texture via texture manager', () => {
      const elevTile = createMockElevationTile('9:261:168');
      const ctxTile = createMockContextTile('9:261:168');

      manager.handleElevationTileAdded('9:261:168', elevTile, ctxTile);

      expect(mockTextureManager.createTexture).toHaveBeenCalledWith(
        '9:261:168',
        ctxTile
      );
    });

    it('should pass mesh to scene.add()', () => {
      const tile = createMockElevationTile('9:261:168');

      manager.handleElevationTileAdded('9:261:168', tile, null);

      const addCalls = (mockScene.add as any).mock.calls;
      expect(addCalls.length).toBeGreaterThan(0);
      expect(addCalls[0][0]).toBeInstanceOf(Mesh);
    });

    it('should handle multiple tiles', () => {
      const tile1 = createMockElevationTile('9:261:168');
      const tile2 = createMockElevationTile('9:262:168');

      manager.handleElevationTileAdded('9:261:168', tile1, null);
      manager.handleElevationTileAdded('9:262:168', tile2, null);

      expect(manager.getAllObjects()).toHaveLength(2);
      expect(mockScene.add).toHaveBeenCalledTimes(2);
    });
  });

  describe('handleElevationTileRemoved', () => {
    it('should remove terrain object from scene', () => {
      const tile = createMockElevationTile('9:261:168');
      manager.handleElevationTileAdded('9:261:168', tile, null);
      vi.clearAllMocks();

      manager.handleElevationTileRemoved('9:261:168');

      expect(mockScene.remove).toHaveBeenCalled();
      expect(manager.getAllObjects()).toHaveLength(0);
    });

    it('should dispose terrain object', () => {
      const tile = createMockElevationTile('9:261:168');
      manager.handleElevationTileAdded('9:261:168', tile, null);
      const terrainObject = manager.getTerrainObject('9:261:168')!;
      const disposeSpy = vi.spyOn(terrainObject, 'dispose');

      manager.handleElevationTileRemoved('9:261:168');

      expect(disposeSpy).toHaveBeenCalled();
    });

    it('should remove geometry and texture', () => {
      const tile = createMockElevationTile('9:261:168');
      manager.handleElevationTileAdded('9:261:168', tile, null);
      const removeGeomSpy = vi.spyOn(mockGeometryManager, 'removeGeometry');

      manager.handleElevationTileRemoved('9:261:168');

      expect(removeGeomSpy).toHaveBeenCalledWith('9:261:168');
      expect(mockTextureManager.removeTexture).toHaveBeenCalledWith(
        '9:261:168'
      );
    });

    it('should handle removing non-existent tile gracefully', () => {
      expect(() =>
        manager.handleElevationTileRemoved('9:999:999')
      ).not.toThrow();
    });

    it('should only remove the specified tile', () => {
      const tile1 = createMockElevationTile('9:261:168');
      const tile2 = createMockElevationTile('9:262:168');
      manager.handleElevationTileAdded('9:261:168', tile1, null);
      manager.handleElevationTileAdded('9:262:168', tile2, null);

      manager.handleElevationTileRemoved('9:261:168');

      expect(manager.getAllObjects()).toHaveLength(1);
      expect(manager.getTerrainObject('9:262:168')).toBeDefined();
    });
  });

  describe('handleContextTileAdded', () => {
    it('should upgrade terrain object when texture becomes available', () => {
      const elevTile = createMockElevationTile('9:261:168');
      manager.handleElevationTileAdded('9:261:168', elevTile, null);
      vi.clearAllMocks();

      // Mock texture manager to return a non-null texture on second create
      (mockTextureManager.createTexture as any).mockReturnValue({
        getTexture: () => ({}),
        dispose: vi.fn(),
      });

      const ctxTile = createMockContextTile('9:261:168');
      manager.handleContextTileAdded('9:261:168', ctxTile);

      // Old mesh removed, new mesh added
      expect(mockScene.remove).toHaveBeenCalled();
      expect(mockScene.add).toHaveBeenCalled();
    });

    it('should not upgrade if terrain object already has texture', () => {
      // Create with texture
      (mockTextureManager.createTexture as any).mockReturnValue({
        getTexture: () => ({}),
        dispose: vi.fn(),
      });
      const elevTile = createMockElevationTile('9:261:168');
      const ctxTile = createMockContextTile('9:261:168');
      manager.handleElevationTileAdded('9:261:168', elevTile, ctxTile);
      vi.clearAllMocks();

      // Try to upgrade again
      manager.handleContextTileAdded('9:261:168', ctxTile);

      expect(mockScene.remove).not.toHaveBeenCalled();
      expect(mockScene.add).not.toHaveBeenCalled();
    });

    it('should no-op if terrain object does not exist', () => {
      const ctxTile = createMockContextTile('9:261:168');

      expect(() =>
        manager.handleContextTileAdded('9:261:168', ctxTile)
      ).not.toThrow();
      expect(mockScene.add).not.toHaveBeenCalled();
    });
  });

  describe('getTerrainObject', () => {
    it('should return the terrain object for a tile key', () => {
      const tile = createMockElevationTile('9:261:168');
      manager.handleElevationTileAdded('9:261:168', tile, null);

      const terrainObject = manager.getTerrainObject('9:261:168');

      expect(terrainObject).toBeDefined();
      expect(terrainObject).toBeInstanceOf(TerrainObject);
      expect(terrainObject?.getTileKey()).toBe('9:261:168');
    });

    it('should return undefined for non-existent tile key', () => {
      expect(manager.getTerrainObject('9:999:999')).toBeUndefined();
    });
  });

  describe('getAllObjects', () => {
    it('should return empty array when no objects', () => {
      expect(manager.getAllObjects()).toEqual([]);
    });

    it('should return all terrain objects', () => {
      const tile1 = createMockElevationTile('9:261:168');
      const tile2 = createMockElevationTile('9:262:168');
      manager.handleElevationTileAdded('9:261:168', tile1, null);
      manager.handleElevationTileAdded('9:262:168', tile2, null);

      const objects = manager.getAllObjects();

      expect(objects).toHaveLength(2);
      expect(objects).toEqual(
        expect.arrayContaining([
          expect.any(TerrainObject),
          expect.any(TerrainObject),
        ])
      );
    });
  });

  describe('dispose', () => {
    it('should dispose all terrain objects', () => {
      const tile1 = createMockElevationTile('9:261:168');
      const tile2 = createMockElevationTile('9:262:168');
      manager.handleElevationTileAdded('9:261:168', tile1, null);
      manager.handleElevationTileAdded('9:262:168', tile2, null);

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
      const tile1 = createMockElevationTile('9:261:168');
      const tile2 = createMockElevationTile('9:262:168');
      manager.handleElevationTileAdded('9:261:168', tile1, null);
      manager.handleElevationTileAdded('9:262:168', tile2, null);
      vi.clearAllMocks();

      manager.dispose();

      expect(mockScene.remove).toHaveBeenCalledTimes(2);
    });

    it('should clear the objects map', () => {
      const tile = createMockElevationTile('9:261:168');
      manager.handleElevationTileAdded('9:261:168', tile, null);
      expect(manager.getAllObjects()).toHaveLength(1);

      manager.dispose();
      expect(manager.getAllObjects()).toHaveLength(0);
    });

    it('should dispose geometry manager', () => {
      const disposeSpy = vi.spyOn(mockGeometryManager, 'dispose');

      manager.dispose();

      expect(disposeSpy).toHaveBeenCalled();
    });

    it('should dispose texture manager', () => {
      const disposeSpy = vi.spyOn(mockTextureManager, 'dispose');

      manager.dispose();

      expect(disposeSpy).toHaveBeenCalled();
    });
  });
});

function createMockElevationTile(tileKey: string): ElevationDataTile {
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

function createMockContextTile(tileKey: string): ContextDataTile {
  const parts = tileKey.split(':').map(Number);
  const z = parts[0]!;
  const x = parts[1]!;
  const y = parts[2]!;
  return {
    coordinates: { z, x, y },
    mercatorBounds: { minX: 0, maxX: 1000, minY: 0, maxY: 1000 },
    zoomLevel: z,
    features: {
      buildings: [],
      roads: [],
      railways: [],
      waters: [],
      airports: [],
      vegetation: [],
    },
    colorPalette: {} as any,
  };
}
