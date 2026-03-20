import type { GeoCoordinates } from '../../gis/GeoCoordinates';
import type { TileCoordinates } from '../elevation/types';
import { TypedEventEmitter } from '../../core/TypedEventEmitter';
import type { Drone } from '../../drone/Drone';

export type TileDataEvents<TileType> = {
  tileAdded: { key: string; tile: TileType };
  tileRemoved: { key: string };
};

export interface TileManagerConfig {
  zoomLevel: number;
  ringRadius: number;
  maxConcurrentLoads: number;
}

/**
 * Abstract base class for tile-based data managers.
 * Owns the ring management logic: setLocation, initializeTileRing, updateTileRing,
 * getTileKey, parseTileKey, isSameTile, and dispose.
 *
 * Subclasses implement data-specific loading via:
 * - getConfig()          — zoom/radius/concurrency settings
 * - getTileCoordinates() — Mercator → tile coordinate conversion
 * - loadTileAsync()      — how a single tile is fetched
 * - processQueuedTiles() — how the load queue is drained
 *
 * Optional hooks (no-op defaults):
 * - onDispose()          — extra cleanup before shared dispose
 * - onTileEvicted(key)   — per-key hook when a tile leaves the ring
 */
export abstract class TileDataManager<TileType> extends TypedEventEmitter<
  TileDataEvents<TileType>
> {
  protected currentTileCenter: TileCoordinates | null = null;
  protected tileCache: Map<string, TileType> = new Map();
  protected pendingLoads: Map<string, Promise<TileType | null>> = new Map();
  protected loadingCount: number = 0;
  protected abortController: AbortController = new AbortController();

  private readonly onDroneLocationChanged = (location: GeoCoordinates) => {
    this.setLocation(location);
  };

  constructor(private readonly drone: Drone) {
    super();
    this.drone.on('locationChanged', this.onDroneLocationChanged);
    this.initializeTileRing();
  }

  /**
   * Updates the manager's location and loads/unloads tiles as needed.
   */
  setLocation(location: GeoCoordinates): void {
    const { zoomLevel } = this.getConfig();
    const newTileCenter = this.getTileCoordinates(location, zoomLevel);

    if (!this.isSameTile(this.currentTileCenter, newTileCenter)) {
      this.currentTileCenter = newTileCenter;
      this.updateTileRing();
    }
  }

  /**
   * Cleans up resources: calls onDispose(), unsubscribes from drone, aborts
   * pending loads, clears all maps, and removes all event listeners.
   */
  dispose(): void {
    this.onDispose();
    this.drone.off('locationChanged', this.onDroneLocationChanged);
    this.abortController.abort();
    this.tileCache.clear();
    this.pendingLoads.clear();
    this.loadingCount = 0;
    this.removeAllListeners();
  }

  /** Converts tile coordinates to a unique string key. */
  protected getTileKey(coordinates: TileCoordinates): string {
    return `${coordinates.z}:${coordinates.x}:${coordinates.y}`;
  }

  /**
   * Parses a tile key string back into coordinates with validation.
   * @throws Error if key format is invalid or contains non-integer values
   */
  protected parseTileKey(key: string): [number, number, number] {
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

  /** Called at the start of dispose() before shared cleanup. Override to add extra cleanup. */
  protected onDispose(): void {}

  /**
   * Called for each key evicted from the ring (both from tileCache and from
   * pendingLoads-only entries). Override to filter subclass-specific queues.
   */
  protected onTileEvicted(_key: string): void {}

  protected abstract getConfig(): TileManagerConfig;
  protected abstract getTileCoordinates(
    loc: GeoCoordinates,
    zoom: number
  ): TileCoordinates;
  protected abstract loadTileAsync(key: string): void;
  protected abstract processQueuedTiles(): void;

  private initializeTileRing(): void {
    const { zoomLevel } = this.getConfig();
    this.currentTileCenter = this.getTileCoordinates(
      this.drone.getLocation(),
      zoomLevel
    );
    this.updateTileRing();
  }

  private isSameTile(
    a: TileCoordinates | null,
    b: TileCoordinates | null
  ): boolean {
    if (a === null || b === null) return a === b;
    return a.z === b.z && a.x === b.x && a.y === b.y;
  }

  private updateTileRing(): void {
    if (!this.currentTileCenter) return;

    const center = this.currentTileCenter;
    const { ringRadius, zoomLevel } = this.getConfig();

    const desiredTiles = new Set<string>();
    for (let dx = -ringRadius; dx <= ringRadius; dx++) {
      for (let dy = -ringRadius; dy <= ringRadius; dy++) {
        desiredTiles.add(
          this.getTileKey({ z: zoomLevel, x: center.x + dx, y: center.y + dy })
        );
      }
    }

    // Evict cached tiles outside the new ring
    for (const key of [...this.tileCache.keys()]) {
      if (!desiredTiles.has(key)) {
        this.tileCache.delete(key);
        this.pendingLoads.delete(key);
        this.onTileEvicted(key);
        this.emit('tileRemoved', { key });
      }
    }

    // Clean up pending (not-yet-cached) loads outside the new ring
    for (const key of [...this.pendingLoads.keys()]) {
      if (!desiredTiles.has(key)) {
        this.pendingLoads.delete(key);
        this.onTileEvicted(key);
      }
    }

    // Dispatch loads for tiles not yet present
    for (const key of desiredTiles) {
      if (!this.tileCache.has(key) && !this.pendingLoads.has(key)) {
        this.loadTileAsync(key);
      }
    }
  }
}
