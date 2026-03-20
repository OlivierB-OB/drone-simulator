import { describe, it, expect } from 'vitest';
import { ElevationTilePersistenceCache } from './ElevationTilePersistenceCache';
import type { ElevationDataTile } from './types';

/**
 * Smoke tests for ElevationTilePersistenceCache.
 * Full behavior is tested in TilePersistenceCache.test.ts.
 * These tests verify the delegation plumbing in the typed wrapper.
 */

const sampleTile = (): ElevationDataTile => ({
  coordinates: { z: 15, x: 10, y: 20 },
  data: Array.from({ length: 4 }, () => [100, 200, 300, 400]),
  tileSize: 4,
  zoomLevel: 15,
  geoBounds: { minLat: 48.85, maxLat: 48.86, minLng: 2.34, maxLng: 2.35 },
});

describe('ElevationTilePersistenceCache', () => {
  it('initialize resolves', async () => {
    await expect(
      ElevationTilePersistenceCache.initialize()
    ).resolves.not.toThrow();
  });

  it('get returns null (no IndexedDB in test env)', async () => {
    await ElevationTilePersistenceCache.initialize();
    expect(await ElevationTilePersistenceCache.get('15:10:20')).toBeNull();
  });

  it('set does not throw', async () => {
    await ElevationTilePersistenceCache.initialize();
    await expect(
      ElevationTilePersistenceCache.set('15:10:20', sampleTile())
    ).resolves.not.toThrow();
  });

  it('delete does not throw', async () => {
    await ElevationTilePersistenceCache.initialize();
    await expect(
      ElevationTilePersistenceCache.delete('15:10:20')
    ).resolves.not.toThrow();
  });

  it('isAvailable returns a boolean', async () => {
    await ElevationTilePersistenceCache.initialize();
    expect(typeof ElevationTilePersistenceCache.isAvailable()).toBe('boolean');
  });
});
