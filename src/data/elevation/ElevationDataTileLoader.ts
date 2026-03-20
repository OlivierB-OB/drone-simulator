import type { TileCoordinates, ElevationDataTile } from './types';
import { ElevationTilePersistenceCache } from './ElevationTilePersistenceCache';
import { ElevationDataTileParser } from './ElevationDataTileParser';
import { getTileGeoBounds } from '../../gis/GeoCoordinates';
import { loadWithPersistenceCache } from '../shared/tileLoaderUtils';

/**
 * Factory for loading and parsing elevation data tiles from AWS Terrain Tiles.
 * Uses Terrarium format (PNG-encoded elevation with RGB channels).
 */
export class ElevationDataTileLoader {
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

      const geoBounds = getTileGeoBounds(coordinates);

      return {
        coordinates,
        data,
        tileSize,
        zoomLevel: z,
        geoBounds,
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

    return loadWithPersistenceCache(
      tileKey,
      ElevationTilePersistenceCache,
      () =>
        ElevationDataTileLoader.loadTileWithRetry(
          coordinates,
          endpoint,
          maxRetries,
          signal
        )
    );
  }
}
