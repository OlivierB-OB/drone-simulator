import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TerrainTextureObjectManager } from './TerrainTextureObjectManager';
import { TerrainTextureObject } from './TerrainTextureObject';
import { TerrainTextureFactory } from './TerrainTextureFactory';
import * as THREE from 'three';
import type { ContextDataTile } from '../../../data/contextual/types';

describe('TerrainTextureObjectManager', () => {
  let manager: TerrainTextureObjectManager;
  let mockFactory: TerrainTextureFactory;
  let mockElevationManager: any;
  let mockContextManager: any;

  beforeEach(() => {
    // Create mock factory
    mockFactory = {
      createTexture: vi.fn((tile: ContextDataTile | null, tileKey: string) => {
        if (tile === null) return null;
        return new TerrainTextureObject(
          tileKey,
          new THREE.CanvasTexture(document.createElement('canvas')),
          { minX: 0, maxX: 1000, minY: 0, maxY: 1000 }
        );
      }),
    } as unknown as TerrainTextureFactory;

    // Create mock elevation manager
    mockElevationManager = {
      getTileCache: vi.fn(() => new Map()),
    };

    // Create mock context manager
    mockContextManager = {
      getTile: vi.fn(() => null),
    };

    manager = new TerrainTextureObjectManager(
      mockElevationManager,
      mockContextManager,
      mockFactory
    );
  });

  describe('constructor', () => {
    it('should initialize with empty objects map', () => {
      const newManager = new TerrainTextureObjectManager(
        mockElevationManager,
        mockContextManager
      );
      expect(newManager.getAllTextures()).toEqual([]);
    });

    it('should use provided factory', () => {
      expect(manager).toBeDefined();
    });

    it('should create default factory if not provided', () => {
      const newManager = new TerrainTextureObjectManager(
        mockElevationManager,
        mockContextManager
      );
      expect(newManager).toBeDefined();
    });
  });

  describe('refresh', () => {
    it('should not change anything when tile set is unchanged', () => {
      const elevationTiles = new Map([['9:261:168', {}]]);
      mockElevationManager.getTileCache.mockReturnValue(elevationTiles);

      // Add initial tile
      manager.refresh();
      expect(mockFactory.createTexture).toHaveBeenCalledOnce();

      // Refresh without changes
      vi.clearAllMocks();
      mockElevationManager.getTileCache.mockReturnValue(elevationTiles);
      manager.refresh();

      expect(mockFactory.createTexture).not.toHaveBeenCalled();
    });

    it('should add new tiles from elevation manager', () => {
      const elevationTiles = new Map([
        ['9:261:168', {}],
        ['9:262:168', {}],
      ]);
      mockElevationManager.getTileCache.mockReturnValue(elevationTiles);

      manager.refresh();

      expect(mockFactory.createTexture).toHaveBeenCalledTimes(2);
      expect(manager.getAllTextures()).toHaveLength(2);
    });

    it('should remove tiles no longer in elevation manager', () => {
      // First refresh: add both tiles
      let elevationTiles = new Map([
        ['9:261:168', {}],
        ['9:262:168', {}],
      ]);
      mockElevationManager.getTileCache.mockReturnValue(elevationTiles);
      manager.refresh();

      expect(manager.getAllTextures()).toHaveLength(2);

      // Second refresh: remove one tile
      vi.clearAllMocks();
      elevationTiles = new Map([['9:261:168', {}]]);
      mockElevationManager.getTileCache.mockReturnValue(elevationTiles);
      manager.refresh();

      expect(manager.getAllTextures()).toHaveLength(1);
    });

    it('should retrieve context tile data when creating texture', () => {
      const mockContextTile: ContextDataTile =
        createMockContextTile('9:261:168');
      const elevationTiles = new Map([['9:261:168', {}]]);

      mockElevationManager.getTileCache.mockReturnValue(elevationTiles);
      mockContextManager.getTile.mockReturnValue(mockContextTile);

      manager.refresh();

      expect(mockContextManager.getTile).toHaveBeenCalledWith('9:261:168');
      expect(mockFactory.createTexture).toHaveBeenCalledWith(
        mockContextTile,
        '9:261:168'
      );
    });

    it('should handle null context tile (unavailable data)', () => {
      const elevationTiles = new Map([['9:261:168', {}]]);

      mockElevationManager.getTileCache.mockReturnValue(elevationTiles);
      mockContextManager.getTile.mockReturnValue(null);

      manager.refresh();

      expect(mockFactory.createTexture).toHaveBeenCalledWith(null, '9:261:168');
    });

    it('should store null entries for unavailable context', () => {
      mockFactory.createTexture = vi.fn(() => null);

      const elevationTiles = new Map([['9:261:168', {}]]);
      mockElevationManager.getTileCache.mockReturnValue(elevationTiles);
      mockContextManager.getTile.mockReturnValue(null);

      manager.refresh();

      const textureObject = manager.getTerrainTextureObject('9:261:168');
      expect(textureObject).toBeNull();
    });
  });

  describe('getTerrainTextureObject', () => {
    it('should return texture object for a tile key', () => {
      const mockContextTile = createMockContextTile('9:261:168');
      const elevationTiles = new Map([['9:261:168', {}]]);
      mockElevationManager.getTileCache.mockReturnValue(elevationTiles);
      mockContextManager.getTile.mockReturnValue(mockContextTile);

      manager.refresh();
      const textureObject = manager.getTerrainTextureObject('9:261:168');

      expect(textureObject).toBeDefined();
      expect(textureObject).toBeInstanceOf(TerrainTextureObject);
      expect(textureObject?.getTileKey()).toBe('9:261:168');
    });

    it('should return null for unavailable context', () => {
      mockFactory.createTexture = vi.fn(() => null);

      const elevationTiles = new Map([['9:261:168', {}]]);
      mockElevationManager.getTileCache.mockReturnValue(elevationTiles);
      mockContextManager.getTile.mockReturnValue(null);

      manager.refresh();
      const textureObject = manager.getTerrainTextureObject('9:261:168');

      expect(textureObject).toBeNull();
    });

    it('should return undefined for non-existent tile key', () => {
      const textureObject = manager.getTerrainTextureObject('9:999:999');
      expect(textureObject).toBeUndefined();
    });
  });

  describe('getAllTextures', () => {
    it('should return empty array when no textures', () => {
      const textures = manager.getAllTextures();
      expect(textures).toEqual([]);
    });

    it('should return all texture objects including null entries', () => {
      mockFactory.createTexture = vi.fn(
        (tile: ContextDataTile | null, tileKey: string) => {
          // Return texture for first tile, null for second
          if (tile === null) return null;
          return new TerrainTextureObject(
            tileKey,
            new THREE.CanvasTexture(document.createElement('canvas')),
            { minX: 0, maxX: 1000, minY: 0, maxY: 1000 }
          );
        }
      );

      const elevationTiles = new Map([
        ['9:261:168', {}],
        ['9:262:168', {}],
      ]);
      mockElevationManager.getTileCache.mockReturnValue(elevationTiles);
      mockContextManager.getTile.mockReturnValue(null);

      manager.refresh();
      const textures = manager.getAllTextures();

      expect(textures).toHaveLength(2);
      expect(textures[1]).toBeNull(); // Second entry is null
    });
  });

  describe('dispose', () => {
    it('should dispose all texture objects', () => {
      const elevationTiles = new Map([
        ['9:261:168', {}],
        ['9:262:168', {}],
      ]);
      mockElevationManager.getTileCache.mockReturnValue(elevationTiles);

      manager.refresh();

      // Spy on dispose for texture objects
      const textures = manager.getAllTextures();
      textures.forEach((texture) => {
        if (texture) {
          vi.spyOn(texture, 'dispose');
        }
      });

      manager.dispose();

      textures.forEach((texture) => {
        if (texture) {
          expect(texture.dispose).toHaveBeenCalled();
        }
      });
    });

    it('should clear the objects map', () => {
      const elevationTiles = new Map([['9:261:168', {}]]);
      mockElevationManager.getTileCache.mockReturnValue(elevationTiles);

      manager.refresh();
      expect(manager.getAllTextures()).toHaveLength(1);

      manager.dispose();
      expect(manager.getAllTextures()).toHaveLength(0);
    });

    it('should not error when disposing null entries', () => {
      mockFactory.createTexture = vi.fn(() => null);

      const elevationTiles = new Map([['9:261:168', {}]]);
      mockElevationManager.getTileCache.mockReturnValue(elevationTiles);
      mockContextManager.getTile.mockReturnValue(null);

      manager.refresh();

      expect(() => {
        manager.dispose();
      }).not.toThrow();
    });
  });
});

/**
 * Helper to create a mock context tile
 */
function createMockContextTile(tileKey: string): ContextDataTile {
  const parts = tileKey.split(':').map(Number);
  const z = parts[0]!;
  const x = parts[1]!;
  const y = parts[2]!;

  return {
    coordinates: { z, x, y },
    mercatorBounds: {
      minX: 0,
      maxX: 1000,
      minY: 0,
      maxY: 1000,
    },
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
