import type {
  TileCoordinates,
  ElevationDataTile,
  MercatorBounds,
} from './types';
import type { MercatorCoordinates } from '../../gis/types';
import { ElevationTilePersistenceCache } from './ElevationTilePersistenceCache';

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
   * @param signal - Optional AbortSignal for cancellation
   * @returns Loaded elevation tile with raster data
   * @throws Error if tile cannot be loaded or parsed
   */
  static async loadTile(
    coordinates: TileCoordinates,
    signal?: AbortSignal
  ): Promise<ElevationDataTile> {
    const { z, x, y } = coordinates;

    // AWS Terrain Tiles - Terrarium format (free, no API key required)
    // Using S3 endpoint with Terrarium RGB encoding
    const url = `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${x}/${y}.png`;

    try {
      const response = await fetch(url, { signal });

      if (!response.ok) {
        throw new Error(`Failed to fetch tile: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Decode PNG image to extract RGB pixel data
      const imageData = await ElevationDataTileLoader.decodePNG(uint8Array);

      if (!imageData) {
        throw new Error('Failed to decode PNG image');
      }

      // Validate decoded image dimensions
      const tileSize = 256;
      if (imageData.width !== tileSize || imageData.height !== tileSize) {
        throw new Error(
          `Invalid tile dimensions: expected 256×256, got ${imageData.width}×${imageData.height}`
        );
      }

      // Decode elevation values from RGB pixels
      const data: number[][] = [];
      let pixelIndex = 0;

      for (let row = 0; row < tileSize; row++) {
        const rowData: number[] = [];

        for (let col = 0; col < tileSize; col++) {
          // Extract RGB values (skip alpha channel if present)
          const r = imageData.data[pixelIndex++] ?? 0;
          const g = imageData.data[pixelIndex++] ?? 0;
          const b = imageData.data[pixelIndex++] ?? 0;

          // Skip alpha channel if present (RGBA format)
          if (imageData.data.length === tileSize * tileSize * 4) {
            pixelIndex++;
          }

          // Decode elevation from Terrarium RGB encoding
          // elevation = (R × 256 + G + B/256) - 32768
          const elevation = r * 256 + g + b / 256 - 32768;

          rowData.push(elevation);
        }

        data.push(rowData);
      }

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
   * Decodes a PNG image using the HTML5 Canvas API.
   * Works in browser environments and returns ImageData with RGBA channels.
   *
   * @param pngData - PNG file as Uint8Array
   * @returns ImageData with pixel data or null if decoding fails
   */
  private static async decodePNG(pngData: Uint8Array): Promise<{
    data: Uint8ClampedArray;
    width: number;
    height: number;
  } | null> {
    try {
      // Create a blob from the PNG data
      const blob = new Blob([new Uint8Array(pngData)], { type: 'image/png' });
      const url = URL.createObjectURL(blob);

      return new Promise((resolve) => {
        const image = new Image();

        image.onload = () => {
          // Create canvas and draw image
          const canvas = document.createElement('canvas');
          canvas.width = image.width;
          canvas.height = image.height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            URL.revokeObjectURL(url);
            resolve(null);
            return;
          }

          ctx.drawImage(image, 0, 0);

          // Extract pixel data
          const imageData = ctx.getImageData(0, 0, image.width, image.height);
          URL.revokeObjectURL(url);

          resolve({
            data: imageData.data,
            width: image.width,
            height: image.height,
          });
        };

        image.onerror = () => {
          URL.revokeObjectURL(url);
          resolve(null);
        };

        image.src = url;
      });
    } catch {
      return null;
    }
  }

  /**
   * Attempts to load a tile with exponential backoff retry logic.
   * Returns null if all retry attempts fail.
   *
   * @param coordinates - Tile coordinates to load
   * @param maxRetries - Maximum retry attempts (default: 3)
   * @param signal - Optional AbortSignal for cancellation
   * @returns Loaded tile or null if loading failed
   */
  static async loadTileWithRetry(
    coordinates: TileCoordinates,
    maxRetries: number = 3,
    signal?: AbortSignal
  ): Promise<ElevationDataTile | null> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await ElevationDataTileLoader.loadTile(coordinates, signal);
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
   * @param maxRetries - Maximum retry attempts for network fetch (default: 3)
   * @param signal - Optional AbortSignal for cancellation
   * @returns Loaded tile or null if loading failed
   */
  static async loadTileWithCache(
    coordinates: TileCoordinates,
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
