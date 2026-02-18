import type { MercatorCoordinates } from '../../gis/types';
import type { TileCoordinates } from '../elevation/types';
import type { ContextDataTile } from './types';
import { contextDataConfig } from '../../config';
import { ContextDataTileLoader } from './ContextDataTileLoader';

/**
 * Manages context data (OSM features) loading and caching.
 * Maintains a ring of tiles around the drone's current location and automatically
 * loads/unloads tiles as the drone moves. Uses OSM Overpass API for data.
 */
export class ContextDataManager {
  private currentTileCenter: TileCoordinates | null = null;
  private tileCache: Map<string, ContextDataTile> = new Map();
  private pendingLoads: Map<string, Promise<ContextDataTile | null>> =
    new Map();
  private loadingCount: number = 0;
  private abortController: AbortController = new AbortController();

  constructor(initialLocation: MercatorCoordinates) {
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
        this.pendingLoads.delete(key);
      }
    }

    // Load tiles that are needed but not yet loaded
    for (const key of desiredTiles) {
      if (!this.tileCache.has(key) && !this.pendingLoads.has(key)) {
        this.loadTileAsync(key);
      }
    }
  }

  /**
   * Loads a tile asynchronously, respecting concurrency limits.
   * Queues the tile if max concurrent loads is reached.
   */
  private loadTileAsync(key: string): void {
    if (this.pendingLoads.has(key)) {
      return; // Already pending
    }

    const [z, x, y] = this.parseTileKey(key);
    const coordinates = { z, x, y };

    // Check if we can load now or need to queue
    if (this.loadingCount < contextDataConfig.maxConcurrentLoads) {
      this.startLoad(key, coordinates);
    } else {
      // Queue for later when a slot opens
      const promise = new Promise<ContextDataTile | null>((resolve) => {
        // Try periodically until slot opens
        const interval = setInterval(async () => {
          if (this.loadingCount < contextDataConfig.maxConcurrentLoads) {
            clearInterval(interval);
            const tile = await this.startLoad(key, coordinates);
            resolve(tile);
          }
        }, 100);

        // Give up after 30 seconds
        setTimeout(() => {
          clearInterval(interval);
          resolve(null);
        }, 30000);
      });

      this.pendingLoads.set(key, promise);
    }
  }

  /**
   * Starts loading a tile immediately.
   */
  private async startLoad(
    key: string,
    coordinates: TileCoordinates
  ): Promise<ContextDataTile | null> {
    this.loadingCount++;

    const tile = await ContextDataTileLoader.loadTileWithRetry(
      coordinates,
      contextDataConfig.overpassEndpoint,
      contextDataConfig.queryTimeout
    );

    this.loadingCount--;

    if (tile) {
      this.tileCache.set(key, tile);
    }

    this.pendingLoads.delete(key);
    this.processQueuedTiles();

    return tile;
  }

  /**
   * Processes any queued tiles that couldn't load due to concurrency limits.
   */
  private processQueuedTiles(): void {
    // This is called automatically when a load completes
    // No explicit queuing needed - loadTileAsync handles it
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
    this.pendingLoads.clear();
    this.loadingCount = 0;
  }
}
