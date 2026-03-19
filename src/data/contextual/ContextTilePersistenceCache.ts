import type { ContextDataTile } from './types';
import { TilePersistenceCache } from '../shared/TilePersistenceCache';

const _cache = new TilePersistenceCache<ContextDataTile>({
  dbName: 'drone-simulator-context',
  dbVersion: 5,
  storeName: 'contextTiles',
  clearOnUpgrade: true, // Wipe on upgrade to clear stale color/structure data
});

/**
 * Local persistence cache for context tiles using IndexedDB.
 * Caches successfully loaded tiles for 24 hours to avoid redundant PMTiles fetches.
 * Gracefully degrades if IndexedDB unavailable (private mode, old browser).
 */
export const ContextTilePersistenceCache = {
  initialize: () => _cache.initialize(),
  get: (key: string) => _cache.get(key),
  set: (key: string, tile: ContextDataTile) => _cache.set(key, tile),
  delete: (key: string) => _cache.delete(key),
  cleanupExpired: () => _cache.cleanupExpired(),
  isAvailable: () => _cache.isAvailable(),
} as const;
