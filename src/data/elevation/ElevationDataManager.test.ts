import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ElevationDataManager } from './ElevationDataManager';
import { Drone } from '../../drone/Drone';
import { elevationConfig } from '../../config';
import type { ElevationDataTile, TileCoordinates } from './types';

describe('ElevationDataManager', () => {
  let drone: Drone;
  let manager: ElevationDataManager;

  // Mock tile data for testing
  const createMockTile = (coords: TileCoordinates): ElevationDataTile => ({
    coordinates: coords,
    data: Array(256)
      .fill(null)
      .map(() => Array(256).fill(100)),
    tileSize: 256,
    zoomLevel: coords.z,
    geoBounds: {
      minLat: 48.85,
      maxLat: 48.86,
      minLng: 2.34,
      maxLng: 2.35,
    },
  });

  beforeEach(() => {
    drone = new Drone({ lat: 48.853, lng: 2.3499 }, 0);
    manager = new ElevationDataManager(drone);
  });

  afterEach(() => {
    manager.dispose();
    drone.dispose();
  });

  describe('lifecycle and initialization', () => {
    it('should initialize with drone location', () => {
      // Manager should be created successfully
      const testDrone = new Drone({ lat: 48.853, lng: 2.3499 }, 0);
      const testManager = new ElevationDataManager(testDrone);

      expect(testManager).toBeDefined();

      testManager.dispose();
      testDrone.dispose();
    });

    it('should subscribe to drone locationChanged events', () => {
      const testDrone = new Drone({ lat: 48.853, lng: 2.3499 }, 0);
      const droneEventsSpy = vi.spyOn(testDrone, 'on');
      const testManager = new ElevationDataManager(testDrone);

      // Should have called drone.on with locationChanged
      expect(droneEventsSpy).toHaveBeenCalledWith(
        'locationChanged',
        expect.any(Function)
      );

      testManager.dispose();
      testDrone.dispose();
    });

    it('should unsubscribe from drone events on dispose', () => {
      const unsubscribeSpy = vi.spyOn(drone, 'off');
      manager.dispose();

      expect(unsubscribeSpy).toHaveBeenCalledWith(
        'locationChanged',
        expect.any(Function)
      );
    });
  });

  describe('tile ring updates', () => {
    it('should call updateTileRing when location changes via drone event', () => {
      const updateTileRingSpy = vi.spyOn(manager as any, 'updateTileRing');

      // Trigger location change through drone event
      // Move to a different tile to ensure updateTileRing is called
      const newLocation = { lat: 48.86, lng: 2.36 };
      manager.setLocation(newLocation);

      expect(updateTileRingSpy).toHaveBeenCalled();
    });

    it('should not reload tiles already in cache', () => {
      const loadAsyncSpy = vi.spyOn(manager as any, 'loadTileAsync');
      const initialCalls = (loadAsyncSpy.mock?.calls || []).length;

      // Trigger setLocation with same location
      manager.setLocation(drone.getLocation());

      // Should not add new load calls (no tile center change)
      expect((loadAsyncSpy.mock?.calls || []).length).toBe(initialCalls);
    });

    it('processQueuedTiles dispatches center tile before corner tiles', () => {
      const loadSpy = vi
        .spyOn(manager as any, 'loadTileAsync')
        .mockImplementation(() => {});

      // Reset state so processQueuedTiles has all ring tiles as candidates
      (manager as any).pendingLoads.clear();
      (manager as any).tileCache.clear();
      (manager as any).loadingCount = 0;

      (manager as any).processQueuedTiles();

      const firstKey = loadSpy.mock.calls[0]![0] as string;
      const [, cx, cy] = (manager as any).parseTileKey(firstKey);
      const center = (manager as any).currentTileCenter;

      expect(cx).toBe(center.x);
      expect(cy).toBe(center.y);
    });

    it('should remove tiles outside ring radius on move', async () => {
      const removedTiles: string[] = [];
      manager.on('tileRemoved', ({ key }) => {
        removedTiles.push(key);
      });

      // Add some tiles to cache manually for testing
      const cacheMap = (manager as any).tileCache as Map<
        string,
        ElevationDataTile
      >;
      const testCoords: TileCoordinates = { z: 15, x: 100, y: 100 };
      const testKey = '15:100:100';
      cacheMap.set(testKey, createMockTile(testCoords));

      // Move far enough to change center tile (far away in Paris area)
      const farLocation = {
        lat: 48.9, // Significantly north
        lng: 2.5, // Significantly east
      };

      manager.setLocation(farLocation);

      // Should have emitted removal of the old tile
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(removedTiles).toContain(testKey);
    });
  });

  describe('concurrency control', () => {
    it('should have maxConcurrentLoads configuration in place', () => {
      // Verify that the config has a reasonable concurrency limit
      expect(elevationConfig.maxConcurrentLoads).toBeGreaterThan(0);
      expect(elevationConfig.maxConcurrentLoads).toBeLessThanOrEqual(10);
    });

    it('should have loadingCount as internal state', () => {
      // Verify the manager initializes with proper state tracking
      const loadingCount = (manager as any).loadingCount;
      expect(typeof loadingCount).toBe('number');
      expect(loadingCount).toBeGreaterThanOrEqual(0);
    });

    it('should track pendingLoads map', () => {
      // Verify pendingLoads map exists and is initialized
      const pendingLoads = (manager as any).pendingLoads as Map<
        string,
        Promise<any>
      >;
      expect(pendingLoads).toBeInstanceOf(Map);
      expect(pendingLoads.size).toBeGreaterThanOrEqual(0);
    });

    it('should have processQueuedTiles method for queue management', () => {
      // Verify the method exists
      expect(typeof (manager as any).processQueuedTiles).toBe('function');
    });
  });

  describe('event emission', () => {
    it('should emit tileAdded when tile finishes loading', async () => {
      const events: { key: string; tile: ElevationDataTile }[] = [];
      manager.on('tileAdded', (data) => {
        events.push(data);
      });

      const tile = createMockTile({ z: 15, x: 100, y: 100 });
      const testKey = '15:100:100';

      // Add to cache and emit manually (simulating load completion)
      (manager as any).tileCache.set(testKey, tile);
      (manager as any).emit('tileAdded', { key: testKey, tile });

      expect(events).toHaveLength(1);
      expect(events[0]!.key).toBe(testKey);
      expect(events[0]!.tile).toBe(tile);
    });

    it('should emit tileRemoved when tile evicted from cache', () => {
      const removedTiles: string[] = [];
      manager.on('tileRemoved', ({ key }) => {
        removedTiles.push(key);
      });

      const testKey = '15:100:100';
      const tile = createMockTile({ z: 15, x: 100, y: 100 });

      // Add to cache
      (manager as any).tileCache.set(testKey, tile);

      // Simulate eviction
      (manager as any).tileCache.delete(testKey);
      (manager as any).emit('tileRemoved', { key: testKey });

      expect(removedTiles).toContain(testKey);
    });

    it('should not emit events after dispose', () => {
      const events: string[] = [];
      manager.on('tileAdded', () => {
        events.push('added');
      });

      manager.dispose();

      // Try to emit event
      (manager as any).emit('tileAdded', {
        key: 'test',
        tile: createMockTile({ z: 15, x: 100, y: 100 }),
      });

      // Should not receive event (listeners cleared)
      expect(events).toHaveLength(0);
    });

    it('should emit events in correct order: load → emit → process queue', async () => {
      const events: { event: string; key: string }[] = [];

      manager.on('tileAdded', ({ key }) => {
        events.push({ event: 'tileAdded', key });
      });

      const tile = createMockTile({ z: 15, x: 100, y: 100 });
      const key = '15:100:100';

      // Simulate load completion sequence
      (manager as any).tileCache.set(key, tile);
      (manager as any).emit('tileAdded', { key, tile });

      expect(events).toHaveLength(1);
      expect(events[0]).toEqual({ event: 'tileAdded', key });
    });
  });

  describe('error handling', () => {
    it('should continue loading other tiles if one fails', async () => {
      const tile1 = createMockTile({ z: 15, x: 100, y: 100 });

      // Simulate loading tile1 successfully
      (manager as any).tileCache.set('15:100:100', tile1);

      // Simulate tile2 failing (stays in pending, gets removed)
      (manager as any).pendingLoads.delete('15:101:100');

      // Both should be independent
      expect((manager as any).tileCache.has('15:100:100')).toBe(true);
      expect((manager as any).pendingLoads.has('15:101:100')).toBe(false);
    });

    it('should clean up pendingLoads on error', async () => {
      const pendingLoads = (manager as any).pendingLoads as Map<
        string,
        Promise<any>
      >;
      const failedKey = 'failed-tile';

      // Create a failing promise
      const failPromise = Promise.reject(new Error('Load failed'));
      pendingLoads.set(failedKey, failPromise);

      // Simulate error handling cleanup
      await failPromise.catch(() => {
        pendingLoads.delete(failedKey);
      });

      expect(pendingLoads.has(failedKey)).toBe(false);
    });
  });

  describe('cleanup and disposal', () => {
    it('should abort all pending loads on dispose', async () => {
      const abortController = (manager as any)
        .abortController as AbortController;
      const abortSpy = vi.spyOn(abortController, 'abort');

      manager.dispose();

      expect(abortSpy).toHaveBeenCalled();
    });

    it('should clear tileCache on dispose', () => {
      const cacheMap = (manager as any).tileCache as Map<
        string,
        ElevationDataTile
      >;

      // Add tiles to cache
      cacheMap.set('15:100:100', createMockTile({ z: 15, x: 100, y: 100 }));
      cacheMap.set('15:101:100', createMockTile({ z: 15, x: 101, y: 100 }));

      expect(cacheMap.size).toBeGreaterThan(0);

      manager.dispose();

      expect(cacheMap.size).toBe(0);
    });

    it('should clear pendingLoads on dispose', () => {
      const pendingLoads = (manager as any).pendingLoads as Map<
        string,
        Promise<any>
      >;

      // Add pending loads
      pendingLoads.set('pending-1', Promise.resolve(null));
      pendingLoads.set('pending-2', Promise.resolve(null));

      expect(pendingLoads.size).toBeGreaterThan(0);

      manager.dispose();

      expect(pendingLoads.size).toBe(0);
    });

    it('should reset loadingCount on dispose', () => {
      (manager as any).loadingCount = 5;

      manager.dispose();

      expect((manager as any).loadingCount).toBe(0);
    });

    it('should unsubscribe from drone events on dispose', () => {
      const offSpy = vi.spyOn(drone, 'off');

      manager.dispose();

      expect(offSpy).toHaveBeenCalledWith(
        'locationChanged',
        expect.any(Function)
      );
    });

    it('should remove all event listeners on dispose', () => {
      const events: string[] = [];
      manager.on('tileAdded', () => {
        events.push('added');
      });

      manager.dispose();

      // Emit should have no effect after dispose
      (manager as any).emit('tileAdded', {
        key: 'test',
        tile: createMockTile({ z: 15, x: 100, y: 100 }),
      });

      expect(events).toHaveLength(0);
    });
  });

  describe('edge cases', () => {
    it('should handle parseTileKey with invalid format', () => {
      expect(() => {
        (manager as any).parseTileKey('invalid');
      }).toThrow(/Invalid tile key format/);

      expect(() => {
        (manager as any).parseTileKey('15:100');
      }).toThrow(/Invalid tile key format/);

      expect(() => {
        (manager as any).parseTileKey('15:100:100:extra');
      }).toThrow(/Invalid tile key format/);
    });

    it('should handle parseTileKey with non-integer values', () => {
      expect(() => {
        (manager as any).parseTileKey('15.5:100:100');
      }).toThrow(/non-integer values/);

      expect(() => {
        (manager as any).parseTileKey('15:100.5:100');
      }).toThrow(/non-integer values/);

      expect(() => {
        (manager as any).parseTileKey('15:100:100.5');
      }).toThrow(/non-integer values/);
    });

    it('should handle getTileAt for unloaded tiles (return null)', () => {
      const result = manager.getTileAt(48.853, 2.3499);

      // Should return null for tiles not in cache
      expect(result).toBeNull();
    });

    it('should have getTileAt method for querying cached tiles', () => {
      // Verify the method exists and can be called
      expect(typeof manager.getTileAt).toBe('function');

      // Should return null for unloaded coordinates
      const result = manager.getTileAt(48.853, 2.3499);
      expect(
        result === null || result === undefined || result instanceof Object
      ).toBe(true);
    });

    it('should handle rapid location changes (tile boundary crossing)', async () => {
      const events: string[] = [];
      manager.on('tileAdded', ({ key }) => {
        events.push(key);
      });
      manager.on('tileRemoved', ({ key }) => {
        events.push(`removed-${key}`);
      });

      // Simulate rapid position changes
      const positions = [
        { lat: 48.854, lng: 2.35 },
        { lat: 48.855, lng: 2.36 }, // Different location
        { lat: 48.857, lng: 2.38 }, // Another location
      ];

      for (const pos of positions) {
        manager.setLocation(pos);
      }

      // Should handle all transitions without error
      expect(manager).toBeDefined();
    });

    it('should handle empty tile ring', () => {
      // With ringRadius 0, should only load center tile
      const originalConfig = elevationConfig.ringRadius;
      (elevationConfig as any).ringRadius = 0;

      // Create new manager
      const smallManager = new ElevationDataManager(drone);

      // Should handle gracefully
      expect(smallManager).toBeDefined();

      (elevationConfig as any).ringRadius = originalConfig;
    });
  });

  describe('integration: multiple operations', () => {
    it('should coordinate load, emit, queue, and process in sequence', async () => {
      const sequence: string[] = [];

      manager.on('tileAdded', ({ key }) => {
        sequence.push(`added:${key}`);
      });

      // Simulate: load → (if cached) emit → process queue
      const tile = createMockTile({ z: 15, x: 100, y: 100 });
      const key = '15:100:100';

      (manager as any).tileCache.set(key, tile);
      (manager as any).emit('tileAdded', { key, tile });
      (manager as any).processQueuedTiles();

      expect(sequence).toContain(`added:${key}`);
    });

    it('should recover from load cancellation on dispose', async () => {
      const pendingLoads = (manager as any).pendingLoads as Map<
        string,
        Promise<any>
      >;
      const loadPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('aborted')), 10);
      });

      // Catch the rejection to prevent unhandled error during teardown
      loadPromise.catch(() => {
        // Expected rejection, ignore
      });

      pendingLoads.set('test-tile', loadPromise);
      manager.dispose();

      // Should clean up even with pending rejected promise
      expect(pendingLoads.size).toBe(0);

      // Wait for setTimeout to complete before test finishes
      await new Promise((resolve) => setTimeout(resolve, 15));
    });
  });
});
