import type { GeoCoordinates } from '../../gis/GeoCoordinates';
import { getTileCoordinatesFromGeo } from '../../gis/GeoCoordinates';
import type { TileCoordinates } from '../elevation/types';
import type { ContextDataTile } from './types';
import { contextDataConfig } from '../../config';
import { ContextDataTileLoader } from './ContextDataTileLoader';
import {
  TileDataManager,
  type TileManagerConfig,
  type TileDataEvents,
} from '../shared/TileDataManager';
import type { Drone } from '../../drone/Drone';
import { PMTilesReader } from './pmtiles/PMTilesReader';

export type ContextDataEvents = TileDataEvents<ContextDataTile>;

type PendingResolver = {
  key: string;
  timeoutId: ReturnType<typeof setTimeout>;
  resolved: boolean;
  resolve: (tile: ContextDataTile | null) => void;
};

/**
 * Manages context data (Overture Maps features) loading and caching.
 * Maintains a ring of tiles around the drone's current location and automatically
 * loads/unloads tiles as the drone moves. Uses Overture Maps PMTiles for data.
 *
 * Emits `tileAdded` when a tile finishes loading and is cached.
 * Emits `tileRemoved` when a tile is evicted from the cache.
 *
 * NOTE: `declare` is used for fields that are accessed during super() (via abstract
 * method dispatch). `declare` emits no JS, so the values survive the super() call
 * without being reset by the class-field initializer under useDefineForClassFields.
 */
export class ContextDataManager extends TileDataManager<ContextDataTile> {
  // `declare` + `??=` pattern: no JS emitted for these fields, so values
  // set during super() (via loadTileAsync → processQueuedTiles) are preserved.
  declare private pendingQueue: string[];
  declare private pendingResolvers: PendingResolver[];

  declare private pmtilesReader: PMTilesReader;

  constructor(drone: Drone) {
    super(drone);
  }

  private getReader(): PMTilesReader {
    this.pmtilesReader ??= new PMTilesReader({
      baseUrl: contextDataConfig.overtureBaseUrl,
      version: contextDataConfig.overtureVersion,
      themes: contextDataConfig.overtureThemes,
    });
    return this.pmtilesReader;
  }

  protected getConfig(): TileManagerConfig {
    return {
      zoomLevel: contextDataConfig.zoomLevel,
      ringRadius: contextDataConfig.ringRadius,
      maxConcurrentLoads: contextDataConfig.maxConcurrentLoads,
    };
  }

  protected getTileCoordinates(
    loc: GeoCoordinates,
    zoom: number
  ): TileCoordinates {
    return getTileCoordinatesFromGeo(loc, zoom);
  }

  protected override onTileEvicted(key: string): void {
    const q = this.pendingQueue;
    if (q) this.pendingQueue = q.filter((k) => k !== key);
  }

  protected override onDispose(): void {
    this.pendingQueue = [];
    for (const resolver of this.pendingResolvers ?? []) {
      clearTimeout(resolver.timeoutId);
    }
    this.pendingResolvers = [];
    this.pmtilesReader?.dispose();
  }

  /**
   * Loads a tile asynchronously, respecting concurrency limits.
   * Queues the tile if max concurrent loads is reached.
   */
  protected loadTileAsync(key: string): void {
    this.pendingQueue ??= [];
    this.pendingResolvers ??= [];

    if (this.pendingLoads.has(key)) {
      return;
    }

    const [z, x, y] = this.parseTileKey(key);
    const coordinates = { z, x, y };

    const promise = new Promise<ContextDataTile | null>((resolve) => {
      if (this.loadingCount < contextDataConfig.maxConcurrentLoads) {
        this.startLoad(key, coordinates).then(resolve);
      } else {
        this.pendingQueue.push(key);

        const resolver: PendingResolver = {
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

    this.pendingLoads.set(key, promise);
    this.processQueuedTiles();
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
        this.getReader(),
        3,
        this.abortController.signal
      );

      if (tile && this.pendingLoads.has(key)) {
        this.tileCache.set(key, tile);
        this.emit('tileAdded', { key, tile });

        const resolverIndex = (this.pendingResolvers ?? []).findIndex(
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
      this.pendingLoads.delete(key);
      this.processQueuedTiles();
    }
  }

  /**
   * Processes the next tile in the pending queue if concurrency allows.
   * Only starts one tile at a time to prevent thundering herd.
   */
  protected processQueuedTiles(): void {
    this.pendingQueue ??= [];

    if (this.pendingQueue.length === 0) {
      return;
    }

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
   * Gets tiles currently in the ring (loaded or pending).
   */
  getRingTiles(): string[] {
    if (!this.currentTileCenter) return [];

    const tiles: string[] = [];
    const center = this.currentTileCenter;
    const { ringRadius, zoomLevel } = this.getConfig();

    for (let dx = -ringRadius; dx <= ringRadius; dx++) {
      for (let dy = -ringRadius; dy <= ringRadius; dy++) {
        tiles.push(
          this.getTileKey({ z: zoomLevel, x: center.x + dx, y: center.y + dy })
        );
      }
    }

    return tiles;
  }
}
