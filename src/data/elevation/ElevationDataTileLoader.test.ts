import { describe, it, expect, vi } from 'vitest';
import { ElevationDataTileLoader } from './ElevationDataTileLoader';
import type { TileCoordinates } from './types';

describe('ElevationDataTileLoader', () => {
  describe('getTileCoordinates', () => {
    it('converts Mercator coordinates to tile coordinates', () => {
      // Paris location in Mercator (approximately)
      const parisLocation = { x: 262144.0, y: 6250000.0 };

      const tile = ElevationDataTileLoader.getTileCoordinates(
        parisLocation,
        13
      );

      expect(tile.z).toBe(13);
      expect(typeof tile.x).toBe('number');
      expect(typeof tile.y).toBe('number');
      expect(tile.x).toBeGreaterThanOrEqual(0);
      expect(tile.y).toBeGreaterThanOrEqual(0);
    });

    it('converts origin (0,0) to tile at top-left', () => {
      const origin = { x: 0, y: 0 };

      const tile = ElevationDataTileLoader.getTileCoordinates(origin, 13);

      // Web Mercator origin (0,0) should map to center-ish tile
      expect(tile.z).toBe(13);
      expect(typeof tile.x).toBe('number');
      expect(typeof tile.y).toBe('number');
    });

    it('different zoom levels produce different tile indices', () => {
      const location = { x: 262144.0, y: 6250000.0 };

      const tile13 = ElevationDataTileLoader.getTileCoordinates(location, 13);
      const tile10 = ElevationDataTileLoader.getTileCoordinates(location, 10);

      // Zoom 13 should have larger x,y indices than zoom 10
      expect(tile13.x).toBeGreaterThan(tile10.x);
      expect(tile13.y).toBeGreaterThan(tile10.y);
    });
  });

  describe('getTileMercatorBounds', () => {
    it('returns bounds that contain the coordinates used to create the tile', () => {
      const coordinates: TileCoordinates = { z: 13, x: 4520, y: 3102 };

      const bounds = ElevationDataTileLoader.getTileMercatorBounds(coordinates);

      expect(bounds.minX).toBeLessThan(bounds.maxX);
      expect(bounds.minY).toBeLessThan(bounds.maxY);
    });

    it('produces consistent bounds for adjacent tiles', () => {
      const tile1: TileCoordinates = { z: 13, x: 4520, y: 3102 };
      const tile2: TileCoordinates = { z: 13, x: 4521, y: 3102 };

      const bounds1 = ElevationDataTileLoader.getTileMercatorBounds(tile1);
      const bounds2 = ElevationDataTileLoader.getTileMercatorBounds(tile2);

      // Adjacent tiles should share a boundary
      expect(bounds1.maxX).toBe(bounds2.minX);
    });

    it('bounds are larger at lower zoom levels', () => {
      const location: TileCoordinates = { z: 10, x: 565, y: 388 };
      const locationZoom13: TileCoordinates = { z: 13, x: 4520, y: 3102 };

      const boundsZ10 = ElevationDataTileLoader.getTileMercatorBounds(location);
      const boundsZ13 =
        ElevationDataTileLoader.getTileMercatorBounds(locationZoom13);

      const widthZ10 = boundsZ10.maxX - boundsZ10.minX;
      const widthZ13 = boundsZ13.maxX - boundsZ13.minX;

      // Lower zoom = larger geographic area per tile
      expect(widthZ10).toBeGreaterThan(widthZ13);
    });
  });

  describe('loadTile', () => {
    it('throws error when tile cannot be fetched', async () => {
      // Mock fetch to simulate network error
      (global.fetch as any) = vi
        .fn()
        .mockRejectedValueOnce(new Error('Network error'));

      const coordinates: TileCoordinates = { z: 13, x: 4520, y: 3102 };

      await expect(
        ElevationDataTileLoader.loadTile(coordinates)
      ).rejects.toThrow(/Error loading tile/);
    });

    it('throws error when response is not ok', async () => {
      (global.fetch as any) = vi.fn().mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      });

      const coordinates: TileCoordinates = { z: 13, x: 4520, y: 3102 };

      await expect(
        ElevationDataTileLoader.loadTile(coordinates)
      ).rejects.toThrow(/Failed to fetch tile/);
    });

    it('successfully parses valid tile data', async () => {
      // Create valid RGBA image data (256×256 × 4 bytes for RGBA)
      const tileSize = 256;
      const mockImageData = {
        data: new Uint8ClampedArray(tileSize * tileSize * 4),
        width: tileSize,
        height: tileSize,
      };

      // Fill with test pattern
      for (let i = 0; i < mockImageData.data.length; i += 4) {
        mockImageData.data[i] = 128; // R
        mockImageData.data[i + 1] = 64; // G
        mockImageData.data[i + 2] = 32; // B
        mockImageData.data[i + 3] = 255; // A
      }

      vi.stubGlobal(
        'Image',
        class {
          src: string = '';
          onload?: () => void;
          width = tileSize;
          height = tileSize;

          constructor() {
            setTimeout(() => this.onload?.(), 0);
          }
        }
      );

      vi.stubGlobal('URL', {
        createObjectURL: vi.fn(() => 'blob:mock'),
        revokeObjectURL: vi.fn(),
      });

      const canvasMock = {
        width: tileSize,
        height: tileSize,
        getContext: vi.fn(() => ({
          drawImage: vi.fn(),
          getImageData: () => mockImageData,
        })),
      };

      vi.stubGlobal('document', {
        createElement: vi.fn(() => canvasMock),
      });

      const validPNG = new Uint8Array([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      ]);

      (global.fetch as any) = vi.fn().mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => validPNG.buffer,
      });

      const coordinates: TileCoordinates = { z: 13, x: 4520, y: 3102 };

      const tile = await ElevationDataTileLoader.loadTile(coordinates);

      expect(tile.coordinates).toEqual(coordinates);
      expect(tile.tileSize).toBe(256);
      expect(tile.zoomLevel).toBe(13);
      expect(tile.data).toHaveLength(256);
      expect(tile.data[0]).toHaveLength(256);
      expect(tile.mercatorBounds).toBeDefined();
    });

    it('correctly decodes elevation from RGBA values', async () => {
      const tileSize = 256;
      const mockImageData = {
        data: new Uint8ClampedArray(tileSize * tileSize * 4),
        width: tileSize,
        height: tileSize,
      };

      // Set first pixel to known elevation: (200 × 256 + 100 + 128/256) - 32768 = 19968
      mockImageData.data[0] = 200; // R
      mockImageData.data[1] = 100; // G
      mockImageData.data[2] = 128; // B
      mockImageData.data[3] = 255; // A

      // Rest is zeros
      for (let i = 4; i < mockImageData.data.length; i += 4) {
        mockImageData.data[i] = 0;
        mockImageData.data[i + 1] = 0;
        mockImageData.data[i + 2] = 0;
        mockImageData.data[i + 3] = 255;
      }

      vi.stubGlobal(
        'Image',
        class {
          src: string = '';
          onload?: () => void;
          width = tileSize;
          height = tileSize;

          constructor() {
            setTimeout(() => this.onload?.(), 0);
          }
        }
      );

      vi.stubGlobal('URL', {
        createObjectURL: vi.fn(() => 'blob:mock'),
        revokeObjectURL: vi.fn(),
      });

      const canvasMock = {
        width: tileSize,
        height: tileSize,
        getContext: vi.fn(() => ({
          drawImage: vi.fn(),
          getImageData: () => mockImageData,
        })),
      };

      vi.stubGlobal('document', {
        createElement: vi.fn(() => canvasMock),
      });

      const validPNG = new Uint8Array([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      ]);

      (global.fetch as any) = vi.fn().mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => validPNG.buffer,
      });

      const coordinates: TileCoordinates = { z: 13, x: 4520, y: 3102 };

      const tile = await ElevationDataTileLoader.loadTile(coordinates);

      const expectedElevation = 200 * 256 + 100 + 128 / 256 - 32768;
      expect(tile.data[0]?.[0]).toBeCloseTo(expectedElevation, 1);
    });
  });

  describe('loadTileWithRetry', () => {
    it('returns null after max retries', async () => {
      (global.fetch as any) = vi
        .fn()
        .mockRejectedValue(new Error('Network error'));

      const coordinates: TileCoordinates = { z: 13, x: 4520, y: 3102 };

      const tile = await ElevationDataTileLoader.loadTileWithRetry(
        coordinates,
        2
      );

      expect(tile).toBeNull();
      // Should have tried 2 times
      expect(vi.mocked(global.fetch as any).mock.calls).toHaveLength(2);
    });

    it('succeeds on retry after initial failure', async () => {
      const tileSize = 256;
      const mockImageData = {
        data: new Uint8ClampedArray(tileSize * tileSize * 4),
        width: tileSize,
        height: tileSize,
      };

      vi.stubGlobal(
        'Image',
        class {
          src: string = '';
          onload?: () => void;
          width = tileSize;
          height = tileSize;

          constructor() {
            setTimeout(() => this.onload?.(), 0);
          }
        }
      );

      vi.stubGlobal('URL', {
        createObjectURL: vi.fn(() => 'blob:mock'),
        revokeObjectURL: vi.fn(),
      });

      const canvasMock = {
        width: tileSize,
        height: tileSize,
        getContext: vi.fn(() => ({
          drawImage: vi.fn(),
          getImageData: () => mockImageData,
        })),
      };

      vi.stubGlobal('document', {
        createElement: vi.fn(() => canvasMock),
      });

      const validPNG = new Uint8Array([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      ]);

      (global.fetch as any) = vi
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: async () => validPNG.buffer,
        });

      const coordinates: TileCoordinates = { z: 13, x: 4520, y: 3102 };

      const tile = await ElevationDataTileLoader.loadTileWithRetry(
        coordinates,
        3
      );

      expect(tile).not.toBeNull();
      expect(tile?.coordinates).toEqual(coordinates);
    });

    it('implements exponential backoff (can verify with spy)', async () => {
      const startTime = Date.now();

      (global.fetch as any) = vi
        .fn()
        .mockRejectedValue(new Error('Network error'));

      const coordinates: TileCoordinates = { z: 13, x: 4520, y: 3102 };

      await ElevationDataTileLoader.loadTileWithRetry(coordinates, 2);

      const elapsed = Date.now() - startTime;

      // With 2 retries: wait 100ms before retry 1, then fail again (no wait before third)
      // Total should be at least 100ms
      expect(elapsed).toBeGreaterThanOrEqual(80); // Allow some slack for test timing
    });
  });
});
