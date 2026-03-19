import type { ContextDataTile } from './types';
import type { TileCoordinates } from '../elevation/types';
import { colorPalette } from '../../config';
import { ContextTilePersistenceCache } from './ContextTilePersistenceCache';
import { getTileMercatorBounds } from '../../gis/webMercator';
import { loadWithPersistenceCache } from '../shared/tileLoaderUtils';
import { OvertureParser } from './pmtiles/OvertureParser';
import type { PMTilesReader } from './pmtiles/PMTilesReader';

/**
 * Factory for loading and parsing context data tiles from Overture Maps PMTiles.
 * Loads geospatial features (buildings, roads, railways, etc.) for a given tile.
 */
export class ContextDataTileLoader {
  /**
   * Loads a context data tile from Overture Maps PMTiles archives.
   * Decodes MVT layers and classifies features by type.
   */
  static async loadTile(
    coordinates: TileCoordinates,
    reader: PMTilesReader,
    signal?: AbortSignal
  ): Promise<ContextDataTile> {
    if (signal?.aborted) {
      throw new Error('Aborted');
    }

    const bounds = getTileMercatorBounds(coordinates);

    try {
      const layers = await reader.getTile(
        coordinates.z,
        coordinates.x,
        coordinates.y
      );

      const features = OvertureParser.parse(layers, bounds, coordinates);

      return {
        coordinates,
        mercatorBounds: bounds,
        zoomLevel: coordinates.z,
        features,
        colorPalette,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(
          `Error loading tile ${coordinates.z}/${coordinates.x}/${coordinates.y}: ${error.message}`,
          { cause: error }
        );
      }
      throw error;
    }
  }

  /**
   * Attempts to load a tile with basic retry logic.
   * Returns null if all retry attempts fail.
   */
  static async loadTileWithRetry(
    coordinates: TileCoordinates,
    reader: PMTilesReader,
    maxRetries: number = 3,
    signal?: AbortSignal
  ): Promise<ContextDataTile | null> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await this.loadTile(coordinates, reader, signal);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < maxRetries - 1) {
          const delayMs = 100 * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }

    console.warn(
      `Failed to load context tile ${coordinates.z}/${coordinates.x}/${coordinates.y}: ${lastError?.message}`
    );
    return null;
  }

  /**
   * Loads a context data tile from the persistence cache if available,
   * otherwise fetches from PMTiles and caches the result.
   */
  static async loadTileWithCache(
    coordinates: TileCoordinates,
    reader: PMTilesReader,
    maxRetries: number = 3,
    signal?: AbortSignal
  ): Promise<ContextDataTile | null> {
    const tileKey = `${coordinates.z}:${coordinates.x}:${coordinates.y}`;

    return loadWithPersistenceCache(tileKey, ContextTilePersistenceCache, () =>
      this.loadTileWithRetry(coordinates, reader, maxRetries, signal)
    );
  }
}
