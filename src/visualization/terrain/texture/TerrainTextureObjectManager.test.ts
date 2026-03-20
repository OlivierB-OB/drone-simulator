import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TerrainTextureObjectManager } from './TerrainTextureObjectManager';
import { TerrainTextureFactory } from './TerrainTextureFactory';
import * as THREE from 'three';
import type { TileResource } from '../types';
import type { ContextDataTile } from '../../../data/contextual/types';
import type { ContextDataManager } from '../../../data/contextual/ContextDataManager';

function makeTextureResource(tileKey: string): TileResource<THREE.Texture> {
  const texture = new THREE.CanvasTexture(document.createElement('canvas'));
  return {
    tileKey,
    resource: texture,
    bounds: { minLat: 48.85, maxLat: 48.86, minLng: 2.34, maxLng: 2.35 },
    dispose: vi.fn(),
  };
}

describe('TerrainTextureObjectManager', () => {
  let manager: TerrainTextureObjectManager;
  let mockContextData: Partial<ContextDataManager>;
  let mockFactory: TerrainTextureFactory;

  beforeEach(() => {
    mockContextData = {
      on: vi.fn(),
      off: vi.fn(),
    };

    mockFactory = {
      createTexture: vi.fn((tile: ContextDataTile | null, tileKey: string) => {
        if (tile === null) return null;
        return makeTextureResource(tileKey);
      }),
    } as unknown as TerrainTextureFactory;

    manager = new TerrainTextureObjectManager(
      mockContextData as ContextDataManager,
      mockFactory
    );
  });

  describe('constructor', () => {
    it('should use provided factory', () => {
      expect(manager).toBeDefined();
    });
  });

  describe('createTexture', () => {
    it('should create and store texture resource for a tile', () => {
      const contextTile = createMockContextTile('9:261:168');

      const result = manager.createTexture('9:261:168', contextTile);

      expect(result?.tileKey).toBe('9:261:168');
      expect(result?.resource).toBeInstanceOf(THREE.Texture);
      expect(manager.getTerrainTextureObject('9:261:168')).toBe(result);
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

      const textureResource = manager.getTerrainTextureObject('9:261:168');
      expect(textureResource).toBeNull();
    });

    it('should create multiple textures', () => {
      const tile1 = createMockContextTile('9:261:168');
      const tile2 = createMockContextTile('9:262:168');

      manager.createTexture('9:261:168', tile1);
      manager.createTexture('9:262:168', tile2);

      expect(manager.getTerrainTextureObject('9:261:168')).toBeDefined();
      expect(manager.getTerrainTextureObject('9:262:168')).toBeDefined();
    });
  });

  describe('removeTexture', () => {
    it('should remove and dispose texture for a tile', () => {
      const contextTile = createMockContextTile('9:261:168');
      manager.createTexture('9:261:168', contextTile);
      const textureResource = manager.getTerrainTextureObject('9:261:168')!;
      const disposeSpy = vi.spyOn(textureResource!, 'dispose');

      manager.removeTexture('9:261:168');

      expect(disposeSpy).toHaveBeenCalled();
      expect(manager.getTerrainTextureObject('9:261:168')).toBeUndefined();
    });

    it('should not error when removing non-existent tile', () => {
      expect(() => manager.removeTexture('9:999:999')).not.toThrow();
    });

    it('should not error when removing null entry', () => {
      mockFactory.createTexture = vi.fn(() => null);
      manager.createTexture('9:261:168', null);

      expect(() => manager.removeTexture('9:261:168')).not.toThrow();
      expect(manager.getTerrainTextureObject('9:261:168')).toBeUndefined();
    });
  });

  describe('getTerrainTextureObject', () => {
    it('should return texture resource for a tile key', () => {
      const contextTile = createMockContextTile('9:261:168');
      manager.createTexture('9:261:168', contextTile);

      const textureResource = manager.getTerrainTextureObject('9:261:168');

      expect(textureResource).toBeDefined();
      expect(textureResource?.tileKey).toBe('9:261:168');
      expect(textureResource?.resource).toBeInstanceOf(THREE.Texture);
    });

    it('should return null for unavailable context', () => {
      mockFactory.createTexture = vi.fn(() => null);
      manager.createTexture('9:261:168', null);

      const textureResource = manager.getTerrainTextureObject('9:261:168');
      expect(textureResource).toBeNull();
    });

    it('should return undefined for non-existent tile key', () => {
      const textureResource = manager.getTerrainTextureObject('9:999:999');
      expect(textureResource).toBeUndefined();
    });
  });

  describe('tileAdded event', () => {
    function getRegisteredTileAddedHandler() {
      const calls = (mockContextData.on as ReturnType<typeof vi.fn>).mock.calls;
      const call = calls.find((c: unknown[]) => c[0] === 'tileAdded');
      return call?.[1] as
        | ((data: { key: string; tile: unknown }) => void)
        | undefined;
    }

    it('should emit tileAdded when data source produces a non-null texture', () => {
      const events: { key: string }[] = [];
      manager.on('tileAdded', (e) => events.push(e));

      const contextTile = createMockContextTile('9:261:168');
      getRegisteredTileAddedHandler()?.({
        key: '9:261:168',
        tile: contextTile,
      });

      expect(events).toHaveLength(1);
      expect(events[0]?.key).toBe('9:261:168');
    });

    it('should NOT emit tileAdded when data source produces a null texture', () => {
      mockFactory.createTexture = vi.fn(() => null);
      const events: unknown[] = [];
      manager.on('tileAdded', (e) => events.push(e));

      const contextTile = createMockContextTile('9:261:168');
      getRegisteredTileAddedHandler()?.({
        key: '9:261:168',
        tile: contextTile,
      });

      expect(events).toHaveLength(0);
    });
  });

  describe('dispose', () => {
    it('should dispose all texture resources', () => {
      const tile1 = createMockContextTile('9:261:168');
      const tile2 = createMockContextTile('9:262:168');
      const texture1 = manager.createTexture('9:261:168', tile1)!;
      const texture2 = manager.createTexture('9:262:168', tile2)!;

      const spy1 = vi.spyOn(texture1, 'dispose');
      const spy2 = vi.spyOn(texture2, 'dispose');

      manager.dispose();

      expect(spy1).toHaveBeenCalled();
      expect(spy2).toHaveBeenCalled();
    });

    it('should clear the objects map', () => {
      const contextTile = createMockContextTile('9:261:168');
      manager.createTexture('9:261:168', contextTile);
      expect(manager.getTerrainTextureObject('9:261:168')).toBeDefined();

      manager.dispose();
      expect(manager.getTerrainTextureObject('9:261:168')).toBeUndefined();
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
    geoBounds: {
      minLat: 48.85,
      maxLat: 48.86,
      minLng: 2.34,
      maxLng: 2.35,
    },
    zoomLevel: z,
    features: {
      buildings: [],
      roads: [],
      railways: [],
      waters: [],
      airports: [],
      vegetation: [],
      landuse: [],
      structures: [],
      barriers: [],
    },
    colorPalette: {} as any,
  };
}
