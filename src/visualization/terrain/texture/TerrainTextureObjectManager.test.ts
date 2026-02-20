import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TerrainTextureObjectManager } from './TerrainTextureObjectManager';
import { TerrainTextureObject } from './TerrainTextureObject';
import { TerrainTextureFactory } from './TerrainTextureFactory';
import * as THREE from 'three';
import type { ContextDataTile } from '../../../data/contextual/types';

describe('TerrainTextureObjectManager', () => {
  let manager: TerrainTextureObjectManager;
  let mockFactory: TerrainTextureFactory;

  beforeEach(() => {
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

    manager = new TerrainTextureObjectManager(mockFactory);
  });

  describe('constructor', () => {
    it('should initialize with empty objects map', () => {
      const newManager = new TerrainTextureObjectManager();
      expect(newManager.getAllTextures()).toEqual([]);
    });

    it('should use provided factory', () => {
      expect(manager).toBeDefined();
    });
  });

  describe('createTexture', () => {
    it('should create and store texture for a tile', () => {
      const contextTile = createMockContextTile('9:261:168');

      const result = manager.createTexture('9:261:168', contextTile);

      expect(result).toBeInstanceOf(TerrainTextureObject);
      expect(result?.getTileKey()).toBe('9:261:168');
      expect(manager.getAllTextures()).toHaveLength(1);
    });

    it('should call factory.createTexture with correct args', () => {
      const contextTile = createMockContextTile('9:261:168');

      manager.createTexture('9:261:168', contextTile);

      expect(mockFactory.createTexture).toHaveBeenCalledWith(
        contextTile,
        '9:261:168'
      );
    });

    it('should handle null context tile (unavailable data)', () => {
      manager.createTexture('9:261:168', null);

      expect(mockFactory.createTexture).toHaveBeenCalledWith(null, '9:261:168');
    });

    it('should store null entries for unavailable context', () => {
      mockFactory.createTexture = vi.fn(() => null);

      manager.createTexture('9:261:168', null);

      const textureObject = manager.getTerrainTextureObject('9:261:168');
      expect(textureObject).toBeNull();
    });

    it('should create multiple textures', () => {
      const tile1 = createMockContextTile('9:261:168');
      const tile2 = createMockContextTile('9:262:168');

      manager.createTexture('9:261:168', tile1);
      manager.createTexture('9:262:168', tile2);

      expect(manager.getAllTextures()).toHaveLength(2);
    });
  });

  describe('removeTexture', () => {
    it('should remove and dispose texture for a tile', () => {
      const contextTile = createMockContextTile('9:261:168');
      manager.createTexture('9:261:168', contextTile);
      const textureObj = manager.getTerrainTextureObject('9:261:168')!;
      const disposeSpy = vi.spyOn(textureObj, 'dispose');

      manager.removeTexture('9:261:168');

      expect(disposeSpy).toHaveBeenCalled();
      expect(manager.getAllTextures()).toHaveLength(0);
    });

    it('should not error when removing non-existent tile', () => {
      expect(() => manager.removeTexture('9:999:999')).not.toThrow();
    });

    it('should not error when removing null entry', () => {
      mockFactory.createTexture = vi.fn(() => null);
      manager.createTexture('9:261:168', null);

      expect(() => manager.removeTexture('9:261:168')).not.toThrow();
      expect(manager.getAllTextures()).toHaveLength(0);
    });
  });

  describe('getTerrainTextureObject', () => {
    it('should return texture object for a tile key', () => {
      const contextTile = createMockContextTile('9:261:168');
      manager.createTexture('9:261:168', contextTile);

      const textureObject = manager.getTerrainTextureObject('9:261:168');

      expect(textureObject).toBeDefined();
      expect(textureObject).toBeInstanceOf(TerrainTextureObject);
      expect(textureObject?.getTileKey()).toBe('9:261:168');
    });

    it('should return null for unavailable context', () => {
      mockFactory.createTexture = vi.fn(() => null);
      manager.createTexture('9:261:168', null);

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
      expect(manager.getAllTextures()).toEqual([]);
    });

    it('should return all texture objects including null entries', () => {
      const contextTile = createMockContextTile('9:261:168');
      manager.createTexture('9:261:168', contextTile);

      // Second tile has no context
      mockFactory.createTexture = vi.fn(() => null);
      manager.createTexture('9:262:168', null);

      const textures = manager.getAllTextures();
      expect(textures).toHaveLength(2);
    });
  });

  describe('dispose', () => {
    it('should dispose all texture objects', () => {
      const tile1 = createMockContextTile('9:261:168');
      const tile2 = createMockContextTile('9:262:168');
      manager.createTexture('9:261:168', tile1);
      manager.createTexture('9:262:168', tile2);

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
      const contextTile = createMockContextTile('9:261:168');
      manager.createTexture('9:261:168', contextTile);
      expect(manager.getAllTextures()).toHaveLength(1);

      manager.dispose();
      expect(manager.getAllTextures()).toHaveLength(0);
    });

    it('should not error when disposing null entries', () => {
      mockFactory.createTexture = vi.fn(() => null);
      manager.createTexture('9:261:168', null);

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
