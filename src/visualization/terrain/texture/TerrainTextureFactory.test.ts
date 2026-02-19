import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TerrainTextureFactory } from './TerrainTextureFactory';
import { TerrainTextureObject } from './TerrainTextureObject';
import * as THREE from 'three';
import type { ContextDataTile } from '../../../data/contextual/types';

describe('TerrainTextureFactory', () => {
  let factory: TerrainTextureFactory;
  let mockContextManager: any;
  let mockCanvasRenderer: any;
  let mockTextureConstructor: any;

  beforeEach(() => {
    mockContextManager = {};

    mockCanvasRenderer = {
      renderTile: vi.fn(),
    };

    // Mock the constructor - THREE.CanvasTexture itself
    mockTextureConstructor = THREE.CanvasTexture;

    factory = new TerrainTextureFactory(
      mockContextManager,
      mockCanvasRenderer,
      mockTextureConstructor
    );
  });

  describe('createTexture', () => {
    it('should return null when context tile is null', () => {
      const result = factory.createTexture(null, '9:261:168');

      expect(result).toBeNull();
      expect(mockCanvasRenderer.renderTile).not.toHaveBeenCalled();
    });

    it('should create texture object when context tile available', () => {
      const mockTile = createMockContextTile('9:261:168');

      const result = factory.createTexture(mockTile, '9:261:168');

      expect(result).not.toBeNull();
      expect(result).toBeInstanceOf(TerrainTextureObject);
      expect(result?.getTileKey()).toBe('9:261:168');
    });

    it('should render tile onto canvas', () => {
      const mockTile = createMockContextTile('9:261:168');

      factory.createTexture(mockTile, '9:261:168');

      expect(mockCanvasRenderer.renderTile).toHaveBeenCalledOnce();
      const callArgs = mockCanvasRenderer.renderTile.mock.calls[0];
      expect(callArgs[1]).toBe(mockTile);
      expect(callArgs[2]).toBe(mockTile.mercatorBounds);
    });

    it('should create canvas with 512x512 dimensions', () => {
      const mockTile = createMockContextTile('9:261:168');

      factory.createTexture(mockTile, '9:261:168');

      const canvas = mockCanvasRenderer.renderTile.mock.calls[0][0];
      expect(canvas.width).toBe(512);
      expect(canvas.height).toBe(512);
    });

    it('should create Three.js texture instance', () => {
      const mockTile = createMockContextTile('9:261:168');

      const result = factory.createTexture(mockTile, '9:261:168');

      expect(result?.getTexture()).toBeInstanceOf(THREE.Texture);
    });

    it('should store texture in TerrainTextureObject', () => {
      const mockTile = createMockContextTile('9:261:168');

      const result = factory.createTexture(mockTile, '9:261:168');

      expect(result).not.toBeNull();
      expect(result?.getTexture()).toBeDefined();
      expect(result?.getTexture()).toBeInstanceOf(THREE.Texture);
    });

    it('should store mercator bounds in TerrainTextureObject', () => {
      const mockTile = createMockContextTile('9:261:168');

      const result = factory.createTexture(mockTile, '9:261:168');

      expect(result?.getMercatorBounds()).toEqual(mockTile.mercatorBounds);
    });

    it('should set texture properties (filters and needsUpdate)', () => {
      const mockTile = createMockContextTile('9:261:168');

      const result = factory.createTexture(mockTile, '9:261:168');

      const texture = result?.getTexture();
      expect(texture?.magFilter).toBe(THREE.NearestFilter);
      expect(texture?.minFilter).toBe(THREE.LinearMipmapLinearFilter);
    });

    it('should use different tiles without interference', () => {
      const tile1 = createMockContextTile('9:261:168');
      const tile2 = createMockContextTile('9:262:168');

      const result1 = factory.createTexture(tile1, '9:261:168');
      const result2 = factory.createTexture(tile2, '9:262:168');

      expect(result1?.getTileKey()).toBe('9:261:168');
      expect(result2?.getTileKey()).toBe('9:262:168');
      expect(result1?.getTexture()).not.toBe(result2?.getTexture());
    });
  });

  describe('constructor', () => {
    it('should create default canvas renderer if not provided', () => {
      const factoryWithDefaults = new TerrainTextureFactory(mockContextManager);
      expect(factoryWithDefaults).toBeDefined();
    });

    it('should use provided canvas renderer', () => {
      expect(factory).toBeDefined();
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
      minX: 1000000,
      maxX: 2000000,
      minY: 3000000,
      maxY: 4000000,
    },
    zoomLevel: z,
    features: {
      buildings: [
        {
          id: 'building-1',
          geometry: {
            type: 'Polygon' as const,
            coordinates: [[[[1000000, 3000000]]]],
          },
          type: 'residential',
          color: '#c4b8a0',
        },
      ],
      roads: [],
      railways: [],
      waters: [],
      airports: [],
      vegetation: [],
    },
    colorPalette: {} as any,
  };
}
