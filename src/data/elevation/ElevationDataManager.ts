import type { MercatorCoordinates } from '../../gis/types';
import type { TileCoordinates, ElevationDataTile } from './types';
import { elevationConfig } from '../../config';
import { ElevationDataTileLoader } from './ElevationDataTileLoader';

/**
 * Manages elevation data loading and caching for geographic regions.
 * Maintains a ring of tiles around the drone's current location and automatically
 * loads/unloads tiles as the drone moves.
 */
export class ElevationDataManager {
  private currentTileCenter: TileCoordinates | null = null;
  private tileCache: Map<string, ElevationDataTile> = new Map();
  private pendingLoads: Map<string, Promise<ElevationDataTile | null>> =
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

    const loadPromise = ElevationDataTileLoader.loadTileWithRetry(coordinates)
      .then((tile) => {
        this.loadingCount--;

        if (tile) {
          this.tileCache.set(tileKey, tile);
        }

        this.pendingLoads.delete(tileKey);

        // Try to load next queued tile
        this.processQueuedTiles();

        return tile;
      })
      .catch((error) => {
        this.loadingCount--;
        console.error(`Error loading tile ${tileKey}:`, error);
        this.pendingLoads.delete(tileKey);

        // Try to load next queued tile
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
   * Parses a tile key string back into coordinates.
   */
  private parseTileKey(key: string): [number, number, number] {
    const parts = key.split(':').map(Number);
    return [parts[0]!, parts[1]!, parts[2]!];
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
   * Cleans up resources and cancels pending tile loads.
   */
  dispose(): void {
    this.abortController.abort();
    this.tileCache.clear();
    this.pendingLoads.clear();
    this.loadingCount = 0;
  }
}
