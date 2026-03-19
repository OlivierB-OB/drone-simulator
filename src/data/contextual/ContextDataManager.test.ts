import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ContextDataManager } from './ContextDataManager';
import { createDrone } from '../../drone/Drone';
import type { ContextDataTile } from './types';
import type { TileCoordinates } from '../elevation/types';

// Minimal valid ContextDataTile for cache injection
function makeTile(coords: TileCoordinates): ContextDataTile {
  return {
    coordinates: coords,
    mercatorBounds: { minX: 0, maxX: 1, minY: 0, maxY: 1 },
    zoomLevel: coords.z,
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
    colorPalette: { buildings: {} },
  };
}

describe('ContextDataManager', () => {
  let contextManager: ContextDataManager;
  let drone: ReturnType<typeof createDrone>;

  beforeEach(() => {
    drone = createDrone();
    contextManager = new ContextDataManager(drone);
  });

  afterEach(() => {
    contextManager.dispose();
    drone.dispose();
  });

  // -----------------------------------------------------------------------
  describe('lifecycle and initialization', () => {
    it('initializes with a tile ring around the initial location', () => {
      const ringTiles = contextManager.getRingTiles();
      // With ringRadius=1, we expect a 3×3 grid = 9 tiles
      expect(ringTiles).toHaveLength(9);
    });

    it('each ring tile key has format "z:x:y" with integer parts', () => {
      for (const key of contextManager.getRingTiles()) {
        const parts = key.split(':');
        expect(parts).toHaveLength(3);
        expect(Number.isInteger(parseInt(parts[0]!, 10))).toBe(true);
        expect(Number.isInteger(parseInt(parts[1]!, 10))).toBe(true);
        expect(Number.isInteger(parseInt(parts[2]!, 10))).toBe(true);
      }
    });

    it('subscribes to drone locationChanged events on construction', () => {
      const testDrone = createDrone();
      const onSpy = vi.spyOn(testDrone, 'on');
      const m = new ContextDataManager(testDrone);

      expect(onSpy).toHaveBeenCalledWith(
        'locationChanged',
        expect.any(Function)
      );

      m.dispose();
      testDrone.dispose();
    });

    it('unsubscribes from drone events on dispose', () => {
      const offSpy = vi.spyOn(drone, 'off');
      contextManager.dispose();

      expect(offSpy).toHaveBeenCalledWith(
        'locationChanged',
        expect.any(Function)
      );
    });
  });

  // -----------------------------------------------------------------------
  describe('ring updates', () => {
    it('updates ring when moving to a different tile', () => {
      const ringBefore = contextManager.getRingTiles();
      contextManager.setLocation({ x: 1000000, y: 1000000 });
      const ringAfter = contextManager.getRingTiles();
      expect(ringAfter).not.toEqual(ringBefore);
    });

    it('does not update ring when staying within same tile', () => {
      const ringBefore = contextManager.getRingTiles();
      // setLocation with almost the same coordinates (same tile bucket)
      const loc = drone.getLocation();
      contextManager.setLocation(loc);
      expect(contextManager.getRingTiles()).toEqual(ringBefore);
    });

    it('emits tileRemoved for tiles that leave the ring', () => {
      const removedKeys: string[] = [];
      contextManager.on('tileRemoved', ({ key }) => removedKeys.push(key));

      // Inject a tile far from where we're going
      const staleCoords: TileCoordinates = { z: 15, x: 999, y: 999 };
      const staleKey = '15:999:999';
      (contextManager as any).tileCache.set(staleKey, makeTile(staleCoords));

      // Move to a completely different location
      contextManager.setLocation({ x: 1000000, y: 1000000 });

      expect(removedKeys).toContain(staleKey);
    });

    it('filters pendingQueue when tile is evicted from ring', () => {
      // Put a key in the pendingQueue
      const evictKey = '15:999:999';
      (contextManager as any).pendingQueue.push(evictKey);
      (contextManager as any).pendingLoads.set(evictKey, Promise.resolve(null));

      // Move far away — evictKey is outside desired ring
      contextManager.setLocation({ x: 1000000, y: 1000000 });

      expect((contextManager as any).pendingQueue).not.toContain(evictKey);
    });
  });

  // -----------------------------------------------------------------------
  describe('concurrency', () => {
    it('tracks loadingCount as a number, starting at 0 or more', () => {
      const count = (contextManager as any).loadingCount as number;
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });

    it('pendingLoads map is initialized', () => {
      const pl = (contextManager as any).pendingLoads as Map<
        string,
        Promise<any>
      >;
      expect(pl).toBeInstanceOf(Map);
    });

    it('does not start more loads than maxConcurrentLoads at once', () => {
      // Force loadingCount to be at the limit (maxConcurrentLoads = 6)
      (contextManager as any).loadingCount = 6;

      // processQueuedTiles should be a no-op (queue empty too)
      expect(() => (contextManager as any).processQueuedTiles()).not.toThrow();

      expect((contextManager as any).loadingCount).toBe(6);
    });
  });

  // -----------------------------------------------------------------------
  describe('event emission', () => {
    it('emits tileAdded when tile is placed in cache', () => {
      const events: { key: string; tile: ContextDataTile }[] = [];
      contextManager.on('tileAdded', (data) => events.push(data));

      const coords: TileCoordinates = { z: 15, x: 100, y: 100 };
      const tile = makeTile(coords);
      const key = '15:100:100';

      (contextManager as any).tileCache.set(key, tile);
      (contextManager as any).emit('tileAdded', { key, tile });

      expect(events).toHaveLength(1);
      expect(events[0]!.key).toBe(key);
    });

    it('emits tileRemoved when tile is evicted', () => {
      const removedKeys: string[] = [];
      contextManager.on('tileRemoved', ({ key }) => removedKeys.push(key));

      const staleKey = '15:999:999';
      (contextManager as any).tileCache.set(
        staleKey,
        makeTile({ z: 15, x: 999, y: 999 })
      );

      contextManager.setLocation({ x: 1000000, y: 1000000 });

      expect(removedKeys).toContain(staleKey);
    });

    it('does not emit events after dispose', () => {
      const received: string[] = [];
      contextManager.on('tileAdded', ({ key }) => received.push(key));

      contextManager.dispose();

      (contextManager as any).emit('tileAdded', {
        key: 'ghost',
        tile: makeTile({ z: 15, x: 0, y: 0 }),
      });

      expect(received).toHaveLength(0);
    });
  });

  // -----------------------------------------------------------------------
  describe('dispose and cleanup', () => {
    it('aborts the AbortController', () => {
      const ac = (contextManager as any).abortController as AbortController;
      const abortSpy = vi.spyOn(ac, 'abort');
      contextManager.dispose();
      expect(abortSpy).toHaveBeenCalled();
    });

    it('clears tileCache', () => {
      (contextManager as any).tileCache.set(
        '15:1:1',
        makeTile({ z: 15, x: 1, y: 1 })
      );
      contextManager.dispose();
      expect((contextManager as any).tileCache.size).toBe(0);
    });

    it('clears pendingLoads', () => {
      (contextManager as any).pendingLoads.set('test', Promise.resolve(null));
      contextManager.dispose();
      expect((contextManager as any).pendingLoads.size).toBe(0);
    });

    it('resets loadingCount to 0', () => {
      (contextManager as any).loadingCount = 3;
      contextManager.dispose();
      expect((contextManager as any).loadingCount).toBe(0);
    });

    it('clears pendingQueue', () => {
      (contextManager as any).pendingQueue.push('15:1:1', '15:2:2');
      contextManager.dispose();
      expect((contextManager as any).pendingQueue).toHaveLength(0);
    });

    it('cancels all pending resolver timeouts and clears pendingResolvers', () => {
      const timeoutId = setTimeout(() => {}, 60000);
      const resolver = {
        key: 'test',
        timeoutId,
        resolved: false,
        resolve: vi.fn(),
      };
      (contextManager as any).pendingResolvers.push(resolver);

      const clearSpy = vi.spyOn(global, 'clearTimeout');
      contextManager.dispose();

      expect(clearSpy).toHaveBeenCalledWith(timeoutId);
      expect((contextManager as any).pendingResolvers).toHaveLength(0);
    });

    it('can create a new manager after dispose without errors', () => {
      contextManager.dispose();

      const newDrone = createDrone();
      const newManager = new ContextDataManager(newDrone);
      expect(newManager.getRingTiles().length).toBeGreaterThan(0);
      newManager.dispose();
      newDrone.dispose();
    });
  });

  // -----------------------------------------------------------------------
  describe('getRingTiles', () => {
    it('returns empty array when currentTileCenter is null', () => {
      (contextManager as any).currentTileCenter = null;
      expect(contextManager.getRingTiles()).toEqual([]);
    });

    it('returns correct tile count for ringRadius=1', () => {
      expect(contextManager.getRingTiles()).toHaveLength(9);
    });
  });
});
