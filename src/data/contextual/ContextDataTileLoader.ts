import type { ContextDataTile } from './types';
import type { TileCoordinates, MercatorBounds } from '../elevation/types';
import { colorPalette } from '../../config';
import { ContextTilePersistenceCache } from './ContextTilePersistenceCache';
import { ContextDataTileParser } from './ContextDataTileParser';
import { getTileMercatorBounds, MAX_EXTENT } from '../../gis/webMercator';
import { loadWithPersistenceCache } from '../shared/tileLoaderUtils';

/**
 * Factory for loading and parsing context data tiles from OSM Overpass API.
 * Loads geospatial features (buildings, roads, railways, etc.) for a given tile.
 */
export class ContextDataTileLoader {
  /**
   * Converts Mercator meters to latitude/longitude (decimal degrees).
   * Required for Overpass API bbox parameter.
   */
  private static mercatorToLatLng(x: number, y: number): [number, number] {
    const lng = (x / MAX_EXTENT) * 180;
    const lat =
      (Math.atan(Math.sinh((Math.PI * y) / MAX_EXTENT)) * 180) / Math.PI;
    return [lat, lng];
  }

  /**
   * Generates an OverpassQL query string for a tile's bounding box.
   * Queries for buildings, roads, railways, waters, airports, vegetation, and land use.
   */
  private static generateOverpassQuery(bounds: MercatorBounds): string {
    // Convert bounds to lat/lng (south, west, north, east)
    const [minLat, minLng] = this.mercatorToLatLng(bounds.minX, bounds.minY);
    const [maxLat, maxLng] = this.mercatorToLatLng(bounds.maxX, bounds.maxY);

    // Ensure correct order: (south, west, north, east)
    const south = Math.min(minLat, maxLat);
    const west = Math.min(minLng, maxLng);
    const north = Math.max(minLat, maxLat);
    const east = Math.max(minLng, maxLng);

    const bbox = `${south},${west},${north},${east}`;

    // OverpassQL query combining multiple feature types
    return `[out:json][timeout:30];(
  node["building"](${bbox});
  way["building"](${bbox});
  relation["building"](${bbox});
  node["building:part"](${bbox});
  way["building:part"](${bbox});
  relation["building:part"](${bbox});
  way["highway"](${bbox});
  way["railway"](${bbox});
  way["waterway"](${bbox});
  node["waterway"](${bbox});
  way["natural"="water"](${bbox});
  relation["natural"="water"](${bbox});
  way["water"~"lake|pond|reservoir"](${bbox});
  way["natural"="wetland"](${bbox});
  way["natural"="coastline"](${bbox});
  way["landuse"="water"](${bbox});
  relation["landuse"="water"](${bbox});
  node["aeroway"="aerodrome"](${bbox});
  way["aeroway"="aerodrome"](${bbox});
  relation["aeroway"="aerodrome"](${bbox});
  way["aeroway"~"runway|taxiway|taxilane|apron|helipad"](${bbox});
  way["natural"~"forest|wood|scrub|heath"](${bbox});
  node["natural"~"tree|trees"](${bbox});
  way["natural"="tree_row"](${bbox});
  way["natural"~"sand|beach|dune|bare_rock|scree|mud|glacier|fell|tundra|grassland"](${bbox});
  way["landuse"~"farmland|meadow|orchard|vineyard|allotments|cemetery|construction|recreation_ground|residential|commercial|retail|industrial|military|plant_nursery|grass"](${bbox});
  way["leisure"~"park|garden"](${bbox});
  node["man_made"~"tower|chimney|mast|communications_tower|water_tower|silo|storage_tank|lighthouse|crane"](${bbox});
  way["man_made"~"tower|chimney|mast|communications_tower|water_tower|silo|storage_tank|lighthouse|crane"](${bbox});
  node["power"~"tower|pole"](${bbox});
  node["aerialway"="pylon"](${bbox});
  way["barrier"~"wall|city_wall|retaining_wall|hedge"](${bbox});
);
out;>;
out qt;`;
  }

  /**
   * Loads a context data tile from the Overpass API.
   * Parses the OSM response and groups features by type.
   *
   * @param coordinates - Tile coordinates to load
   * @param endpoint - Overpass API endpoint
   * @param timeout - Query timeout in milliseconds
   * @param signal - Optional AbortSignal for cancellation
   * @returns Loaded context tile
   * @throws Error if tile cannot be loaded or parsed
   */
  static async loadTile(
    coordinates: TileCoordinates,
    endpoint: string,
    timeout: number,
    signal?: AbortSignal
  ): Promise<ContextDataTile> {
    const bounds = getTileMercatorBounds(coordinates);
    const query = this.generateOverpassQuery(bounds);

    try {
      // Create an AbortController that combines external signal with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // If external signal is provided, abort controller when it signals
      const abortHandler = signal ? () => controller.abort() : null;
      if (signal && abortHandler) {
        signal.addEventListener('abort', abortHandler);
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        body: query,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        signal: controller.signal,
      });

      try {
        if (!response.ok) {
          // Check for rate limiting
          if (response.status === 429) {
            const error = new Error(
              `Overpass API rate limited (429): ${response.statusText}`
            );
            (error as Error & { statusCode: number }).statusCode = 429;
            throw error;
          }
          throw new Error(`Overpass API error: ${response.statusText}`);
        }

        const osmData = await response.json();

        // Parse OSM data and group features by type
        const features = ContextDataTileParser.parseOSMData(
          osmData,
          bounds,
          coordinates.z
        );

        return {
          coordinates,
          mercatorBounds: bounds,
          zoomLevel: coordinates.z,
          features,
          colorPalette,
        };
      } finally {
        clearTimeout(timeoutId);
        if (signal && abortHandler) {
          signal.removeEventListener('abort', abortHandler);
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(
          `Error loading tile ${coordinates.z}/${coordinates.x}/${coordinates.y}: ${error.message}`,
          {
            cause: error,
          }
        );
      }
      throw error;
    }
  }

  /**
   * Attempts to load a tile with exponential backoff retry logic.
   * Handles rate limiting (429) separately with longer backoff.
   * Returns null if all retry attempts fail.
   *
   * @param coordinates - Tile coordinates to load
   * @param endpoint - Overpass API endpoint
   * @param timeout - Query timeout in milliseconds
   * @param maxRetries - Maximum retry attempts (default: 3)
   * @param signal - Optional AbortSignal for cancellation
   * @returns Loaded tile or null if loading failed
   */
  static async loadTileWithRetry(
    coordinates: TileCoordinates,
    endpoint: string,
    timeout: number,
    maxRetries: number = 3,
    signal?: AbortSignal
  ): Promise<ContextDataTile | null> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await this.loadTile(coordinates, endpoint, timeout, signal);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const isRateLimit =
          (error as Error & { statusCode?: number }).statusCode === 429;

        // Skip retry if rate limited (better to fail than hammer server more)
        if (isRateLimit && attempt === 0) {
          // Only retry once for rate limits, with long backoff
          const delayMs = 1000; // Wait 1 second for rate limit
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        } else if (isRateLimit) {
          // Don't retry rate limit errors more than once
          break;
        }

        // Exponential backoff for other errors: wait 100ms * 2^attempt before retry
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
   * otherwise fetches from Overpass API with retries and caches the result.
   *
   * @param coordinates - Tile coordinates to load
   * @param endpoint - Overpass API endpoint
   * @param timeout - Query timeout in milliseconds
   * @param maxRetries - Maximum number of retry attempts (default: 3)
   * @param signal - Optional AbortSignal for cancellation
   * @returns Loaded context tile or null if load fails
   */
  static async loadTileWithCache(
    coordinates: TileCoordinates,
    endpoint: string,
    timeout: number,
    maxRetries: number = 3,
    signal?: AbortSignal
  ): Promise<ContextDataTile | null> {
    const tileKey = `${coordinates.z}:${coordinates.x}:${coordinates.y}`;

    return loadWithPersistenceCache(tileKey, ContextTilePersistenceCache, () =>
      this.loadTileWithRetry(coordinates, endpoint, timeout, maxRetries, signal)
    );
  }
}
