import type { ContextDataTile, ContextDataTileCached } from './types';

/**
 * Local persistence cache for context tiles using IndexedDB.
 * Caches successfully loaded tiles for 24 hours to avoid redundant Overpass API fetches.
 * Gracefully degrades if IndexedDB unavailable (private mode, old browser).
 */
export class ContextTilePersistenceCache {
  private static db: IDBDatabase | null = null;
  private static initPromise: Promise<void> | null = null;
  private static readonly DB_NAME = 'drone-simulator-context';
  private static readonly DB_VERSION = 1;
  private static readonly STORE_NAME = 'contextTiles';
  private static readonly TTL_HOURS = 24;
  private static readonly TTL_MS =
    ContextTilePersistenceCache.TTL_HOURS * 60 * 60 * 1000;

  private constructor() {
    // Static class - no instances
  }

  /**
   * Initialize IndexedDB with schema creation and expired tile cleanup.
   * Safe to call multiple times; subsequent calls return cached promise.
   */
  static async initialize(): Promise<void> {
    // Return existing promise if already initializing
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._performInitialization();
    return this.initPromise;
  }

  private static async _performInitialization(): Promise<void> {
    try {
      // Check if IndexedDB is available
      if (!this._isIndexedDBAvailable()) {
        console.warn(
          'IndexedDB not available; persistent context tile cache disabled'
        );
        return;
      }

      // Open database (creates if doesn't exist)
      this.db = await this._openDatabase();

      // Clean up expired tiles from previous sessions
      const deletedCount = await this.cleanupExpired();
      if (deletedCount > 0) {
        console.debug(
          `Cleaned up ${deletedCount} expired context tiles from cache`
        );
      }
    } catch (error) {
      console.warn('Failed to initialize context persistence cache:', error);
      this.db = null;
      // Continue without cache - it's optional
    }
  }

  /**
   * Retrieve a tile from persistent cache if it exists and is not expired.
   * Returns null if tile not found, expired, or cache unavailable.
   */
  static async get(key: string): Promise<ContextDataTile | null> {
    if (!this.db) {
      return null;
    }

    try {
      const entry = await this._getEntry(key);

      if (!entry) {
        return null;
      }

      // Check if tile has expired
      const cachedEntry = entry as ContextDataTileCached;
      if (cachedEntry.expiresAt < Date.now()) {
        // Delete expired tile
        await this.delete(key);
        return null;
      }

      return cachedEntry as ContextDataTile;
    } catch (error) {
      console.warn(`Error retrieving context tile ${key} from cache:`, error);
      return null;
    }
  }

  /**
   * Store a tile in persistent cache with 24-hour TTL.
   * Silently fails if cache unavailable (non-critical operation).
   */
  static async set(key: string, tile: ContextDataTile): Promise<void> {
    if (!this.db) {
      return;
    }

    try {
      const now = Date.now();
      const entry: ContextDataTileCached = {
        ...tile,
        key,
        storedAt: now,
        expiresAt: now + this.TTL_MS,
      };

      await this._putEntry(entry);
    } catch (error) {
      console.warn(`Error caching context tile ${key}:`, error);
      // Continue without caching - this is optional
    }
  }

  /**
   * Delete a tile from persistent cache.
   */
  static async delete(key: string): Promise<void> {
    if (!this.db) {
      return;
    }

    try {
      await this._deleteEntry(key);
    } catch (error) {
      console.warn(`Error deleting context tile ${key} from cache:`, error);
    }
  }

  /**
   * Clean up all expired tiles from cache.
   * Returns count of deleted tiles.
   */
  static async cleanupExpired(): Promise<number> {
    if (!this.db) {
      return 0;
    }

    try {
      const now = Date.now();
      let deletedCount = 0;

      // Use index to efficiently query expired tiles
      const index = this.db
        .transaction(this.STORE_NAME, 'readonly')
        .objectStore(this.STORE_NAME)
        .index('expiresAt');

      const expiredRange = IDBKeyRange.upperBound(now);
      const expiredKeys: string[] = [];

      // Collect expired keys
      await new Promise<void>((resolve, reject) => {
        const request = index.openCursor(expiredRange);

        request.onsuccess = () => {
          const cursor = request.result;
          if (cursor) {
            expiredKeys.push(cursor.primaryKey as string);
            cursor.continue();
          } else {
            resolve();
          }
        };

        request.onerror = () => reject(request.error);
      });

      // Delete expired entries
      for (const key of expiredKeys) {
        await this._deleteEntry(key);
        deletedCount++;
      }

      return deletedCount;
    } catch (error) {
      console.warn('Error cleaning up expired context tiles:', error);
      return 0;
    }
  }

  /**
   * Check if IndexedDB is available in this browser/context.
   */
  static isAvailable(): boolean {
    return this.db !== null && this._isIndexedDBAvailable();
  }

  // ===== Private Helper Methods =====

  private static _isIndexedDBAvailable(): boolean {
    try {
      const indexedDB = window.indexedDB;
      return indexedDB !== undefined && indexedDB !== null;
    } catch {
      return false; // Private mode, very old browser, etc.
    }
  }

  private static _openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;

        // Create store if it doesn't exist
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, {
            keyPath: 'key',
          });

          // Create index on expiresAt for efficient cleanup queries
          store.createIndex('expiresAt', 'expiresAt', { unique: false });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  private static _getEntry(key: string): Promise<unknown> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(this.STORE_NAME, 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  private static _putEntry(entry: unknown): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(this.STORE_NAME, 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.put(entry);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  private static _deleteEntry(key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(this.STORE_NAME, 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.delete(key);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }
}
