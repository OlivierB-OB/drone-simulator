import type { MercatorCoordinates } from '../../gis/types';
import type { TileCoordinates, ElevationDataTile } from './types';
import { elevationConfig } from '../../config';
import { ElevationDataTileLoader } from './ElevationDataTileLoader';
import { TypedEventEmitter } from '../../core/TypedEventEmitter';

export type ElevationDataEvents = {
  tileAdded: { key: string; tile: ElevationDataTile };
  tileRemoved: { key: string };
};

/**
 * Manages elevation data loading and caching for geographic regions.
 * Maintains a ring of tiles around the drone's current location and automatically
 * loads/unloads tiles as the drone moves.
 *
 * Emits `tileAdded` when a tile finishes loading and is cached.
 * Emits `tileRemoved` when a tile is evicted from the cache.
 * Call `start()` after wiring event handlers to begin initial tile loading.
 */
export class ElevationDataManager {
  private currentTileCenter: TileCoordinates | null = null;
  private tileCache: Map<string, ElevationDataTile> = new Map();
  private pendingLoads: Map<string, Promise<ElevationDataTile | null>> =
    new Map();
  private loadingCount: number = 0;
  private abortController: AbortController = new AbortController();
  private readonly emitter = new TypedEventEmitter<ElevationDataEvents>();
  private initialLocation: MercatorCoordinates;

  constructor(initialLocation: MercatorCoordinates) {
    this.initialLocation = initialLocation;
  }

  /**
   * Begins initial tile loading. Call after event handlers are wired.
   */
  start(): void {
    this.initializeTileRing(this.initialLocation);
  }

  on<K extends keyof ElevationDataEvents>(
    event: K,
    handler: (data: ElevationDataEvents[K]) => void
  ): void {
    this.emitter.on(event, handler);
  }

  off<K extends keyof ElevationDataEvents>(
    event: K,
    handler: (data: ElevationDataEvents[K]) => void
  ): void {
    this.emitter.off(event, handler);
  }

  /**
   * Updates the manager's location and loads/unloads tiles as needed.
   * Called each animation frame by AnimationLoop.
   */
  setLocation(location: MercatorCoordinates): void {
    const newTileCenter = ElevationDataTileLoader.getTileCoordinates(
      location,
      elevationConfig.zoomLevel
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
    const centerTile = ElevationDataTileLoader.getTileCoordinates(
      location,
      elevationConfig.zoomLevel
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
    const radius = elevationConfig.ringRadius;
    const z = elevationConfig.zoomLevel;

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
        this.pendingLoads.delete(key);
        this.emitter.emit('tileRemoved', { key });
      }
    }

    // Load new tiles that are missing
    for (const key of desiredTiles) {
      if (!this.tileCache.has(key) && !this.pendingLoads.has(key)) {
        this.loadTileAsync(key);
      }
    }
  }

  /**
   * Loads a tile asynchronously, respecting concurrent load limits.
   */
  private loadTileAsync(tileKey: string): void {
    // Don't start new loads if we're at the limit
    if (this.loadingCount >= elevationConfig.maxConcurrentLoads) {
      // Queue will be processed as other loads complete
      return;
    }

    const [z, x, y] = this.parseTileKey(tileKey);
    const coordinates: TileCoordinates = { z, x, y };

    this.loadingCount++;

    const loadPromise = ElevationDataTileLoader.loadTileWithCache(
      coordinates,
      3,
      this.abortController.signal
    )
      .then((tile) => {
        this.loadingCount--;

        if (tile && this.pendingLoads.has(tileKey)) {
          this.tileCache.set(tileKey, tile);
          this.emitter.emit('tileAdded', { key: tileKey, tile });
        }

        this.pendingLoads.delete(tileKey);
        this.processQueuedTiles();

        return tile;
      })
      .catch((error) => {
        this.loadingCount--;
        console.error(`Error loading tile ${tileKey}:`, error);
        this.pendingLoads.delete(tileKey);
        this.processQueuedTiles();

        return null;
      });

    this.pendingLoads.set(tileKey, loadPromise);
  }

  /**
   * Processes tiles waiting in the queue (respects concurrent load limit).
   */
  private processQueuedTiles(): void {
    if (this.loadingCount >= elevationConfig.maxConcurrentLoads) {
      return;
    }

    // Try to load more tiles if we're below the limit
    if (!this.currentTileCenter) return;

    const center = this.currentTileCenter;
    const radius = elevationConfig.ringRadius;
    const z = elevationConfig.zoomLevel;

    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        const x = center.x + dx;
        const y = center.y + dy;
        const key = this.getTileKey({ z, x, y });

        if (!this.tileCache.has(key) && !this.pendingLoads.has(key)) {
          this.loadTileAsync(key);

          if (this.loadingCount >= elevationConfig.maxConcurrentLoads) {
            return;
          }
        }
      }
    }
  }

  /**
   * Converts tile coordinates to a unique string key for caching.
   */
  private getTileKey(coordinates: TileCoordinates): string {
    return `${coordinates.z}:${coordinates.x}:${coordinates.y}`;
  }

  /**
   * Parses a tile key string back into coordinates with validation.
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
   * Checks if two tile coordinates are the same.
   */
  private isSameTile(
    tile1: TileCoordinates | null,
    tile2: TileCoordinates | null
  ): boolean {
    if (!tile1 || !tile2) return false;
    return tile1.z === tile2.z && tile1.x === tile2.x && tile1.y === tile2.y;
  }

  /**
   * Gets the current tile cache map.
   */
  getTileCache(): Map<string, ElevationDataTile> {
    return this.tileCache;
  }

  /**
   * Cleans up resources and cancels pending tile loads.
   */
  dispose(): void {
    this.abortController.abort();
    this.tileCache.clear();
    this.pendingLoads.clear();
    this.loadingCount = 0;
    this.emitter.removeAllListeners();
  }
}
