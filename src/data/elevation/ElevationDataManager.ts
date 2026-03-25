import type { GeoCoordinates } from '../../gis/GeoCoordinates';
import { getTileCoordinatesFromGeo } from '../../gis/GeoCoordinates';
import type { TileCoordinates, ElevationDataTile } from './types';
import { elevationConfig } from '../../config';
import { ElevationDataTileLoader } from './ElevationDataTileLoader';
import {
  TileDataManager,
  type TileManagerConfig,
  type TileDataEvents,
} from '../shared/TileDataManager';
import type { Drone } from '../../drone/Drone';

export type ElevationDataEvents = TileDataEvents<ElevationDataTile>;

/**
 * Manages elevation data loading and caching for geographic regions.
 * Maintains a ring of tiles around the drone's current location and automatically
 * loads/unloads tiles as the drone moves.
 *
 * Emits `tileAdded` when a tile finishes loading and is cached.
 * Emits `tileRemoved` when a tile is evicted from the cache.
 */
export class ElevationDataManager extends TileDataManager<ElevationDataTile> {
  constructor(drone: Drone) {
    super(drone);
  }

  protected getConfig(): TileManagerConfig {
    return {
      zoomLevel: elevationConfig.zoomLevel,
      ringRadius: elevationConfig.ringRadius,
      maxConcurrentLoads: elevationConfig.maxConcurrentLoads,
    };
  }

  protected getTileCoordinates(
    loc: GeoCoordinates,
    zoom: number
  ): TileCoordinates {
    return getTileCoordinatesFromGeo(loc, zoom);
  }

  /**
   * Loads a tile asynchronously, respecting concurrent load limits.
   */
  protected loadTileAsync(tileKey: string): void {
    if (this.loadingCount >= this.getConfig().maxConcurrentLoads) {
      return;
    }

    const [z, x, y] = this.parseTileKey(tileKey);
    const coordinates: TileCoordinates = { z, x, y };

    this.loadingCount++;

    const loadPromise = ElevationDataTileLoader.loadTileWithCache(
      coordinates,
      elevationConfig.elevationEndpoint,
      3,
      this.abortController.signal
    )
      .then((tile) => {
        this.loadingCount--;

        if (tile && this.pendingLoads.has(tileKey)) {
          this.tileCache.set(tileKey, tile);
          this.emit('tileAdded', { key: tileKey, tile });
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
  protected processQueuedTiles(): void {
    const { maxConcurrentLoads, ringRadius, zoomLevel } = this.getConfig();

    if (this.loadingCount >= maxConcurrentLoads) {
      return;
    }

    if (!this.currentTileCenter) return;

    const center = this.currentTileCenter;

    const candidates: string[] = [];
    for (let dx = -ringRadius; dx <= ringRadius; dx++) {
      for (let dy = -ringRadius; dy <= ringRadius; dy++) {
        const key = this.getTileKey({
          z: zoomLevel,
          x: center.x + dx,
          y: center.y + dy,
        });
        if (!this.tileCache.has(key) && !this.pendingLoads.has(key)) {
          candidates.push(key);
        }
      }
    }
    candidates.sort((a, b) => {
      const [, ax, ay] = this.parseTileKey(a);
      const [, bx, by] = this.parseTileKey(b);
      return (
        (ax - center.x) ** 2 +
        (ay - center.y) ** 2 -
        ((bx - center.x) ** 2 + (by - center.y) ** 2)
      );
    });
    for (const key of candidates) {
      this.loadTileAsync(key);
      if (this.loadingCount >= maxConcurrentLoads) return;
    }
  }

  /**
   * Returns the elevation tile covering the given lat/lng, or null if not loaded.
   */
  getTileAt(lat: number, lng: number): ElevationDataTile | null {
    const coords = getTileCoordinatesFromGeo(
      { lat, lng },
      elevationConfig.zoomLevel
    );
    const key = `${coords.z}:${coords.x}:${coords.y}`;
    return this.tileCache.get(key) ?? null;
  }
}
