import type { MercatorCoordinates } from '../../gis/types';
import type { TileCoordinates } from '../elevation/types';
import type { ContextDataTile } from './types';
import { contextDataConfig } from '../../config';
import { ContextDataTileLoader } from './ContextDataTileLoader';
import { OverpassStatusManager } from './OverpassStatusManager';

/**
 * Manages context data (OSM features) loading and caching.
 * Maintains a ring of tiles around the drone's current location and automatically
 * loads/unloads tiles as the drone moves. Uses OSM Overpass API for data.
 */
export class ContextDataManager {
  private currentTileCenter: TileCoordinates | null = null;
  private tileCache: Map<string, ContextDataTile> = new Map();
  private pendingQueue: string[] = [];
  private loadPromises: Map<string, Promise<ContextDataTile | null>> = new Map();
  private loadingCount: number = 0;
  private abortController: AbortController = new AbortController();
  private lastRequestTime: number = 0;
  private readonly throttleDelayMs: number = 200;
  private statusManager: OverpassStatusManager | null = null;

  constructor(initialLocation: MercatorCoordinates) {
    // Initialize status manager if enabled
    if (contextDataConfig.statusCheckEnabled) {
      this.statusManager = new OverpassStatusManager(
        contextDataConfig.statusEndpoint,
        contextDataConfig.statusCheckIntervalMs,
        contextDataConfig.statusCheckTimeoutMs,
        contextDataConfig.statusCacheTtlMs
      );
    }

    this.initializeTileRing(initialLocation);
  }

  /**
   * Updates the manager's location and loads/unloads tiles as needed.
   * Called each animation frame by AnimationLoop.
   */
  setLocation(location: MercatorCoordinates): void {
    const newTileCenter = ContextDataTileLoader.getTileCoordinates(
      location,
      contextDataConfig.zoomLevel
    );

    // Only update tiles if we've moved to a new tile
    if (!this.isSameTile(this.currentTileCenter, newTileCenter)) {
      this.currentTileCenter = newTileCenter;
      this.updateTileRing();
    }
  }

  /**
   * Initializes the tile ring around the initial location.
   */
  private initializeTileRing(location: MercatorCoordinates): void {
    const centerTile = ContextDataTileLoader.getTileCoordinates(
      location,
      contextDataConfig.zoomLevel
    );

    this.currentTileCenter = centerTile;
    this.updateTileRing();
  }

  /**
   * Updates which tiles are loaded based on the current tile center.
   * Loads new tiles at ring edges and unloads tiles outside the ring.
   */
  private updateTileRing(): void {
    if (!this.currentTileCenter) return;

    const center = this.currentTileCenter;
    const radius = contextDataConfig.ringRadius;
    const z = contextDataConfig.zoomLevel;

    // Generate set of tiles that should be loaded
    const desiredTiles = new Set<string>();

    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        const x = center.x + dx;
        const y = center.y + dy;
        const key = this.getTileKey({ z, x, y });
        desiredTiles.add(key);
      }
    }

    // Unload tiles that are no longer needed
    for (const [key] of this.tileCache.entries()) {
      if (!desiredTiles.has(key)) {
        this.tileCache.delete(key);
        this.loadPromises.delete(key);
      }
    }

    // Load tiles that are needed but not yet loaded
    for (const key of desiredTiles) {
      if (!this.tileCache.has(key) && !this.loadPromises.has(key)) {
        this.loadTileAsync(key);
      }
    }
  }

  /**
   * Loads a tile asynchronously, respecting concurrency limits and request throttling.
   * Queues the tile if max concurrent loads is reached or throttle delay hasn't passed.
   * Returns a promise that resolves when the tile is loaded or the load fails.
   */
  private loadTileAsync(key: string): Promise<ContextDataTile | null> {
    if (this.loadPromises.has(key)) {
      return this.loadPromises.get(key)!;
    }

    const [z, x, y] = this.parseTileKey(key);
    const coordinates = { z, x, y };

    const promise = new Promise<ContextDataTile | null>((resolve) => {
      // Check if we can load now (both concurrency and throttle constraints)
      if (
        this.loadingCount < contextDataConfig.maxConcurrentLoads &&
        Date.now() - this.lastRequestTime >= this.throttleDelayMs
      ) {
        this.startLoad(key, coordinates).then(resolve);
      } else {
        // Queue for later when slot opens and throttle allows
        this.pendingQueue.push(key);

        // Poll the cache to detect when the tile is loaded
        const pollInterval = setInterval(() => {
          const tile = this.tileCache.get(key);
          if (tile) {
            clearInterval(pollInterval);
            resolve(tile);
          }
        }, 100);

        // Give up after 30 seconds
        setTimeout(() => {
          clearInterval(pollInterval);
          resolve(null);
        }, 30000);
      }
    });

    this.loadPromises.set(key, promise);
    this.processQueuedTiles();
    return promise;
  }

  /**
   * Starts loading a tile immediately.
   */
  private async startLoad(
    key: string,
    coordinates: TileCoordinates
  ): Promise<ContextDataTile | null> {
    this.loadingCount++;
    this.lastRequestTime = Date.now();

    const tile = await ContextDataTileLoader.loadTileWithRetry(
      coordinates,
      contextDataConfig.overpassEndpoint,
      contextDataConfig.queryTimeout,
      3,
      this.statusManager ?? undefined
    );

    this.loadingCount--;

    if (tile) {
      this.tileCache.set(key, tile);
    }

    this.loadPromises.delete(key);
    this.processQueuedTiles();

    return tile;
  }

  /**
   * Processes the next tile in the pending queue if constraints allow.
   * Called automatically when a load completes.
   * Only starts one tile at a time to prevent thundering herd.
   */
  private processQueuedTiles(): void {
    if (this.pendingQueue.length === 0) {
      return;
    }

    // Check if we can start another load
    if (
      this.loadingCount < contextDataConfig.maxConcurrentLoads &&
      Date.now() - this.lastRequestTime >= this.throttleDelayMs
    ) {
      const key = this.pendingQueue.shift();
      if (key) {
        const [z, x, y] = this.parseTileKey(key);
        const coordinates = { z, x, y };
        this.startLoad(key, coordinates);
      }
    }
  }

  /**
   * Checks if two tile coordinates represent the same tile.
   */
  private isSameTile(
    a: TileCoordinates | null,
    b: TileCoordinates | null
  ): boolean {
    if (a === null || b === null) return a === b;
    return a.z === b.z && a.x === b.x && a.y === b.y;
  }

  /**
   * Converts tile coordinates to a unique string key.
   */
  private getTileKey(coordinates: TileCoordinates): string {
    return `${coordinates.z}:${coordinates.x}:${coordinates.y}`;
  }

  /**
   * Parses a tile key string into coordinates.
   */
  private parseTileKey(key: string): [number, number, number] {
    const parts = key.split(':').map(Number);
    return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
  }

  /**
   * Gets a cached tile by key, or null if not loaded.
   */
  getTile(key: string): ContextDataTile | null {
    return this.tileCache.get(key) || null;
  }

  /**
   * Gets the tile cache Map
   */
  getTileCache(): Map<string, ContextDataTile> {
    return this.tileCache;
  }

  /**
   * Gets all loaded tiles.
   */
  getAllTiles(): ContextDataTile[] {
    return Array.from(this.tileCache.values());
  }

  /**
   * Gets tiles currently in the ring (loaded or pending).
   */
  getRingTiles(): string[] {
    if (!this.currentTileCenter) return [];

    const tiles: string[] = [];
    const center = this.currentTileCenter;
    const radius = contextDataConfig.ringRadius;
    const z = contextDataConfig.zoomLevel;

    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        const x = center.x + dx;
        const y = center.y + dy;
        const key = this.getTileKey({ z, x, y });
        tiles.push(key);
      }
    }

    return tiles;
  }

  /**
   * Aborts pending requests and clears all cached data.
   */
  dispose(): void {
    this.abortController.abort();
    this.tileCache.clear();
    this.pendingQueue = [];
    this.loadPromises.clear();
    this.loadingCount = 0;
    this.statusManager?.dispose();
  }
}
