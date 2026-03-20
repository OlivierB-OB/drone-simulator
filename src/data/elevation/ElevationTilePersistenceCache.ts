import type { ElevationDataTile } from './types';
import { TilePersistenceCache } from '../shared/TilePersistenceCache';

const _cache = new TilePersistenceCache<ElevationDataTile>({
  dbName: 'drone-simulator-elevation',
  dbVersion: 2,
  storeName: 'elevationTiles',
  clearOnUpgrade: false, // Preserve cache across schema versions
});

/**
 * Local persistence cache for elevation tiles using IndexedDB.
 * Caches successfully loaded tiles for 24 hours to avoid redundant S3 fetches.
 * Gracefully degrades if IndexedDB unavailable (private mode, old browser).
 */
export const ElevationTilePersistenceCache = {
  initialize: () => _cache.initialize(),
  get: (key: string) => _cache.get(key),
  set: (key: string, tile: ElevationDataTile) => _cache.set(key, tile),
  delete: (key: string) => _cache.delete(key),
  cleanupExpired: () => _cache.cleanupExpired(),
  isAvailable: () => _cache.isAvailable(),
} as const;
