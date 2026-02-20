import type { MercatorCoordinates } from '../../gis/types';
import type { TileCoordinates } from '../elevation/types';
import type { ContextDataTile } from './types';
import { contextDataConfig } from '../../config';
import { ContextDataTileLoader } from './ContextDataTileLoader';
import { OverpassStatusManager } from './OverpassStatusManager';
import { TypedEventEmitter } from '../../core/TypedEventEmitter';
import type { Drone } from '../../drone/Drone';

export type ContextDataEvents = {
  tileAdded: { key: string; tile: ContextDataTile };
  tileRemoved: { key: string };
};

/**
 * Manages context data (OSM features) loading and caching.
 * Maintains a ring of tiles around the drone's current location and automatically
 * loads/unloads tiles as the drone moves. Uses OSM Overpass API for data.
 *
 * Emits `tileAdded` when a tile finishes loading and is cached.
 * Emits `tileRemoved` when a tile is evicted from the cache.
 */
export class ContextDataManager extends TypedEventEmitter<ContextDataEvents> {
  private currentTileCenter: TileCoordinates | null = null;
  private tileCache: Map<string, ContextDataTile> = new Map();
  private pendingQueue: string[] = [];
  private loadPromises: Map<string, Promise<ContextDataTile | null>> =
    new Map();
  private loadingCount: number = 0;
  private abortController: AbortController = new AbortController();
  private statusManager: OverpassStatusManager | null = null;
  private pendingResolvers: Array<{
    key: string;
    timeoutId: ReturnType<typeof setTimeout>;
    resolved: boolean;
    resolve: (tile: ContextDataTile | null) => void;
  }> = [];
  private onDroneLocationChanged = (location: MercatorCoordinates) => {
    this.setLocation(location);
  };

  constructor(private readonly drone: Drone) {
    super();

    // Initialize status manager if enabled
    if (contextDataConfig.statusCheckEnabled) {
      this.statusManager = new OverpassStatusManager();
    }

    drone.on('locationChanged', this.onDroneLocationChanged);
    this.initializeTileRing(drone.getLocation());
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
        this.emit('tileRemoved', { key });
      }
    }

    // Remove queued tiles that are no longer in the desired set
    this.pendingQueue = this.pendingQueue.filter((key) =>
      desiredTiles.has(key)
    );

    // Load tiles that are needed but not yet loaded
    for (const key of desiredTiles) {
      if (!this.tileCache.has(key) && !this.loadPromises.has(key)) {
        this.loadTileAsync(key);
      }
    }
  }

  /**
   * Loads a tile asynchronously, respecting concurrency limits.
   * Queues the tile if max concurrent loads is reached.
   * Throttling is delegated to ContextDataTileLoader and OverpassStatusManager.
   * Returns a promise that resolves when the tile is loaded or the load fails.
   */
  private loadTileAsync(key: string): Promise<ContextDataTile | null> {
    if (this.loadPromises.has(key)) {
      return this.loadPromises.get(key)!;
    }

    const [z, x, y] = this.parseTileKey(key);
    const coordinates = { z, x, y };

    const promise = new Promise<ContextDataTile | null>((resolve) => {
      // Check if we can load now (concurrency constraint only)
      if (this.loadingCount < contextDataConfig.maxConcurrentLoads) {
        this.startLoad(key, coordinates).then(resolve);
      } else {
        // Queue for later when a load slot opens
        this.pendingQueue.push(key);

        // Set up resolver with timeout and resolved guard
        const resolver: (typeof this.pendingResolvers)[number] = {
          key,
          resolved: false,
          timeoutId: setTimeout(() => {
            if (resolver.resolved) return;
            resolver.resolved = true;
            const idx = this.pendingResolvers.indexOf(resolver);
            if (idx >= 0) this.pendingResolvers.splice(idx, 1);
            resolve(null);
          }, contextDataConfig.queryTimeout),
          resolve: (tile: ContextDataTile | null) => {
            if (resolver.resolved) return;
            resolver.resolved = true;
            clearTimeout(resolver.timeoutId);
            resolve(tile);
          },
        };

        this.pendingResolvers.push(resolver);
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

    try {
      const tile = await ContextDataTileLoader.loadTileWithCache(
        coordinates,
        contextDataConfig.overpassEndpoint,
        contextDataConfig.queryTimeout,
        3,
        this.statusManager ?? undefined,
        this.abortController.signal
      );

      if (tile && this.loadPromises.has(key)) {
        this.tileCache.set(key, tile);
        this.emit('tileAdded', { key, tile });

        // Notify any pending resolvers waiting for this tile
        const resolverIndex = this.pendingResolvers.findIndex(
          (r) => r.key === key
        );
        if (resolverIndex >= 0) {
          const resolver = this.pendingResolvers[resolverIndex]!;
          this.pendingResolvers.splice(resolverIndex, 1);
          resolver.resolve(tile);
        }
      }

      return tile;
    } finally {
      this.loadingCount--;
      this.loadPromises.delete(key);
      this.processQueuedTiles();
    }
  }

  /**
   * Processes the next tile in the pending queue if concurrency allows.
   * Called automatically when a load completes.
   * Only starts one tile at a time to prevent thundering herd.
   * Throttling is delegated to ContextDataTileLoader and OverpassStatusManager.
   */
  private processQueuedTiles(): void {
    if (this.pendingQueue.length === 0) {
      return;
    }

    // Check if we can start another load (concurrency constraint only)
    if (this.loadingCount < contextDataConfig.maxConcurrentLoads) {
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
   * Parses a tile key string into coordinates with validation.
   * @throws Error if key format is invalid or contains non-integer values
   */
  private parseTileKey(key: string): [number, number, number] {
    const parts = key.split(':');
    if (parts.length !== 3) {
      throw new Error(`Invalid tile key format: "${key}". Expected "z:x:y".`);
    }

    const z = Number(parts[0]);
    const x = Number(parts[1]);
    const y = Number(parts[2]);

    if (!Number.isInteger(z) || !Number.isInteger(x) || !Number.isInteger(y)) {
      throw new Error(
        `Tile key contains non-integer values: "${key}". Got z=${z}, x=${x}, y=${y}.`
      );
    }

    return [z, x, y];
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
    this.drone.off('locationChanged', this.onDroneLocationChanged);
    this.abortController.abort();
    this.tileCache.clear();
    this.pendingQueue = [];
    this.loadPromises.clear();
    for (const resolver of this.pendingResolvers) {
      clearTimeout(resolver.timeoutId);
    }
    this.pendingResolvers = [];
    this.loadingCount = 0;
    this.statusManager?.dispose();
    this.removeAllListeners();
  }
}
