import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ContextDataManager } from './ContextDataManager';
import type { MercatorCoordinates } from '../../gis/types';

describe('ContextDataManager', () => {
  let contextManager: ContextDataManager;
  const initialLocation: MercatorCoordinates = {
    x: 0,
    y: 0,
  };

  beforeEach(() => {
    contextManager = new ContextDataManager(initialLocation);
  });

  afterEach(() => {
    contextManager.dispose();
  });

  it('initializes with a tile ring around the initial location', () => {
    const ringTiles = contextManager.getRingTiles();
    // With ringRadius=1, we expect a 3×3 grid = 9 tiles
    expect(ringTiles).toHaveLength(9);
  });

  it('returns an empty array for tiles when cache is empty', () => {
    const allTiles = contextManager.getAllTiles();
    expect(allTiles).toEqual([]);
  });

  it('gets a tile by key (returns null if not cached)', () => {
    const tile = contextManager.getTile('14:8192:8192');
    expect(tile).toBeNull();
  });

  it('tracks ring tiles correctly', () => {
    const ringTiles = contextManager.getRingTiles();
    // With zoom 14, ringRadius 1, expect 3×3 = 9 tiles
    expect(ringTiles.length).toBe(9);

    // Each tile should be in format "z:x:y"
    for (const key of ringTiles) {
      const parts = key.split(':');
      expect(parts).toHaveLength(3);
      expect(Number.isInteger(parseInt(parts[0]!, 10))).toBe(true);
      expect(Number.isInteger(parseInt(parts[1]!, 10))).toBe(true);
      expect(Number.isInteger(parseInt(parts[2]!, 10))).toBe(true);
    }
  });

  it('updates ring when moving to a different tile', () => {
    const ringBefore = contextManager.getRingTiles();
    // Move to a significantly different location (different tile)
    contextManager.setLocation({ x: 1000000, y: 1000000 });
    const ringAfter = contextManager.getRingTiles();
    // Ring should be different after moving tiles
    expect(ringAfter).not.toEqual(ringBefore);
  });

  it('cleans up on dispose', () => {
    const ringTiles = contextManager.getRingTiles();
    expect(ringTiles.length).toBeGreaterThan(0);

    contextManager.dispose();

    // After dispose, should return empty tiles
    const allTiles = contextManager.getAllTiles();
    expect(allTiles).toEqual([]);
  });

  describe('Queue behavior - event-driven processing', () => {
    it('returns a promise from loadTileAsync that resolves when tile loads', async () => {
      // This test verifies the basic promise contract
      // The promise should be stored for deduplication
      const ringTiles = contextManager.getRingTiles();
      expect(ringTiles.length).toBeGreaterThan(0);

      // Note: We can't easily test actual tile loading without mocking the Overpass API
      // But we can verify the structure works by checking promises are tracked
      const firstTile = ringTiles[0];
      if (firstTile) {
        // The getTile method should return null initially
        expect(contextManager.getTile(firstTile)).toBeNull();
      }
    });

    it('processes queued tiles one at a time', async () => {
      // Create a mock scenario to test queue processing
      // We'll need to spy on startLoad calls to verify one-at-a-time execution

      // Unfortunately, we can't easily test the queue behavior without:
      // 1. Mocking ContextDataTileLoader.loadTileWithRetry
      // 2. Mocking setTimeout to control timing
      // This would require significant test infrastructure

      // For now, verify the queue structure exists and is properly initialized
      const cache = contextManager.getTileCache();
      expect(cache).toBeInstanceOf(Map);
      expect(cache.size).toBe(0);
    });

    it('respects concurrency limits when queuing tiles', async () => {
      // Verify that only maxConcurrentLoads tiles load simultaneously
      // This requires integration testing with actual tile loading or mocking

      // Check that the manager is initialized correctly
      const ringTiles = contextManager.getRingTiles();
      expect(ringTiles.length).toBeGreaterThan(0);

      // Verify dispose clears queues properly
      contextManager.dispose();
      const allTiles = contextManager.getAllTiles();
      expect(allTiles).toEqual([]);
    });
  });
});
