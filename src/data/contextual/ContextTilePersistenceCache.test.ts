import { describe, it, expect } from 'vitest';
import { ContextTilePersistenceCache } from './ContextTilePersistenceCache';
import type { ContextDataTile } from './types';

/**
 * Smoke tests for ContextTilePersistenceCache.
 * Full behavior is tested in TilePersistenceCache.test.ts.
 * These tests verify the delegation plumbing in the typed wrapper.
 */

const sampleTile = (): ContextDataTile => ({
  coordinates: { z: 15, x: 10, y: 20 },
  geoBounds: { minLat: 48.85, maxLat: 48.86, minLng: 2.34, maxLng: 2.35 },
  zoomLevel: 15,
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
});

describe('ContextTilePersistenceCache', () => {
  it('initialize resolves', async () => {
    await expect(
      ContextTilePersistenceCache.initialize()
    ).resolves.not.toThrow();
  });

  it('get returns null (no IndexedDB in test env)', async () => {
    await ContextTilePersistenceCache.initialize();
    expect(await ContextTilePersistenceCache.get('15:10:20')).toBeNull();
  });

  it('set does not throw', async () => {
    await ContextTilePersistenceCache.initialize();
    await expect(
      ContextTilePersistenceCache.set('15:10:20', sampleTile())
    ).resolves.not.toThrow();
  });

  it('delete does not throw', async () => {
    await ContextTilePersistenceCache.initialize();
    await expect(
      ContextTilePersistenceCache.delete('15:10:20')
    ).resolves.not.toThrow();
  });

  it('isAvailable returns a boolean', async () => {
    await ContextTilePersistenceCache.initialize();
    expect(typeof ContextTilePersistenceCache.isAvailable()).toBe('boolean');
  });
});
