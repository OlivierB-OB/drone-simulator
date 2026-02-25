import type {
  TileCoordinates,
  ElevationDataTile,
  MercatorBounds,
} from './types';
import type { MercatorCoordinates } from '../../gis/types';
import { ElevationTilePersistenceCache } from './ElevationTilePersistenceCache';
import { ElevationDataTileParser } from './ElevationDataTileParser';

/**
 * Factory for loading and parsing elevation data tiles from AWS Terrain Tiles.
 * Uses Terrarium format (PNG-encoded elevation with RGB channels).
 */
export class ElevationDataTileLoader {
  /**
   * Converts Mercator coordinates to Web Mercator tile coordinates at a given zoom level.
   * Web Mercator uses (0,0) at top-left, with x increasing right and y increasing down.
   *
   * @param location - Mercator coordinates in meters
   * @param zoomLevel - Web Mercator zoom level (0-28)
   * @returns Tile coordinates {z, x, y}
   */
  static getTileCoordinates(
    location: MercatorCoordinates,
    zoomLevel: number
  ): TileCoordinates {
    // Web Mercator projection parameters
    const EARTH_RADIUS = 6378137; // meters
    const MAX_EXTENT = EARTH_RADIUS * Math.PI; // bounds of Web Mercator

    // Normalize Mercator coordinates from [-MAX_EXTENT, MAX_EXTENT] to [0, 2^zoomLevel]
    const n = Math.pow(2, zoomLevel);
    const x = ((location.x + MAX_EXTENT) / (2 * MAX_EXTENT)) * n;
    const y = ((MAX_EXTENT - location.y) / (2 * MAX_EXTENT)) * n;

    return {
      z: zoomLevel,
      x: Math.floor(x),
      y: Math.floor(y),
    };
  }

  /**
   * Calculates the Mercator geographic bounds of a tile.
   * Returns bounds in meters within the Web Mercator projection.
   *
   * @param coordinates - Tile coordinates
   * @returns Mercator bounds in meters
   */
  static getTileMercatorBounds(coordinates: TileCoordinates): MercatorBounds {
    const EARTH_RADIUS = 6378137; // meters
    const MAX_EXTENT = EARTH_RADIUS * Math.PI;
    const n = Math.pow(2, coordinates.z);

    // Calculate bounds in normalized space [0, 1]
    const minNormX = coordinates.x / n;
    const maxNormX = (coordinates.x + 1) / n;
    const minNormY = coordinates.y / n;
    const maxNormY = (coordinates.y + 1) / n;

    // Convert to Mercator meters
    const minX = minNormX * 2 * MAX_EXTENT - MAX_EXTENT;
    const maxX = maxNormX * 2 * MAX_EXTENT - MAX_EXTENT;
    const minY = MAX_EXTENT - maxNormY * 2 * MAX_EXTENT;
    const maxY = MAX_EXTENT - minNormY * 2 * MAX_EXTENT;

    return { minX, maxX, minY, maxY };
  }

  /**
   * Loads a terrain tile from AWS Terrain Tiles (Mapbox Terrain RGB format).
   * PNG-encoded elevation: elevation = (R × 256 + G + B/256) - 32768 meters
   *
   * @param coordinates - Tile coordinates to load
   * @param endpoint - Base URL endpoint for elevation tiles (e.g., https://s3.amazonaws.com/elevation-tiles-prod/terrarium)
   * @param signal - Optional AbortSignal for cancellation
   * @returns Loaded elevation tile with raster data
   * @throws Error if tile cannot be loaded or parsed
   */
  static async loadTile(
    coordinates: TileCoordinates,
    endpoint: string,
    signal?: AbortSignal
  ): Promise<ElevationDataTile> {
    const { z, x, y } = coordinates;

    // Construct URL using the provided endpoint
    const url = `${endpoint}/${z}/${x}/${y}.png`;

    try {
      const response = await fetch(url, { signal });

      if (!response.ok) {
        throw new Error(`Failed to fetch tile: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Delegate PNG decoding and elevation extraction to parser
      const tileSize = 256;
      const data = await ElevationDataTileParser.parsePNG(uint8Array, tileSize);

      const mercatorBounds =
        ElevationDataTileLoader.getTileMercatorBounds(coordinates);

      return {
        coordinates,
        data,
        tileSize,
        zoomLevel: z,
        mercatorBounds,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error loading tile ${z}/${x}/${y}: ${error.message}`, {
          cause: error,
        });
      }
      throw error;
    }
  }

  /**
   * Attempts to load a tile with exponential backoff retry logic.
   * Returns null if all retry attempts fail.
   *
   * @param coordinates - Tile coordinates to load
   * @param endpoint - Base URL endpoint for elevation tiles
   * @param maxRetries - Maximum retry attempts (default: 3)
   * @param signal - Optional AbortSignal for cancellation
   * @returns Loaded tile or null if loading failed
   */
  static async loadTileWithRetry(
    coordinates: TileCoordinates,
    endpoint: string,
    maxRetries: number = 3,
    signal?: AbortSignal
  ): Promise<ElevationDataTile | null> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await ElevationDataTileLoader.loadTile(
          coordinates,
          endpoint,
          signal
        );
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Exponential backoff: wait 100ms * 2^attempt before retry
        if (attempt < maxRetries - 1) {
          const delayMs = 100 * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }

    console.warn(
      `Failed to load tile ${coordinates.z}/${coordinates.x}/${coordinates.y}: ${lastError?.message}`
    );
    return null;
  }

  /**
   * Loads a tile from persistent cache if available and not expired,
   * otherwise fetches from S3 with retry logic and stores in cache.
   *
   * @param coordinates - Tile coordinates to load
   * @param endpoint - Base URL endpoint for elevation tiles
   * @param maxRetries - Maximum retry attempts for network fetch (default: 3)
   * @param signal - Optional AbortSignal for cancellation
   * @returns Loaded tile or null if loading failed
   */
  static async loadTileWithCache(
    coordinates: TileCoordinates,
    endpoint: string,
    maxRetries: number = 3,
    signal?: AbortSignal
  ): Promise<ElevationDataTile | null> {
    const tileKey = `${coordinates.z}:${coordinates.x}:${coordinates.y}`;

    // Check persistent cache first (fast path)
    try {
      const cachedTile = await ElevationTilePersistenceCache.get(tileKey);
      if (cachedTile) {
        console.debug(`Cache hit for tile ${tileKey}`);
        return cachedTile;
      }
    } catch (error) {
      console.warn(
        'Persistent cache unavailable, falling back to network',
        error
      );
    }

    // Fetch from network with retries if not in cache
    const tile = await ElevationDataTileLoader.loadTileWithRetry(
      coordinates,
      endpoint,
      maxRetries,
      signal
    );

    // Cache successful tile for future sessions
    if (tile) {
      try {
        await ElevationTilePersistenceCache.set(tileKey, tile);
      } catch (error) {
        console.warn(`Failed to cache tile ${tileKey}:`, error);
        // Continue anyway - cache is optional enhancement, not critical path
      }
    }

    return tile;
  }
}
