import type { ContextDataTile } from './types';
import type { TileCoordinates } from '../elevation/types';
import { colorPalette } from '../../config';
import { ContextTilePersistenceCache } from './ContextTilePersistenceCache';
import { getTileGeoBounds } from '../../gis/GeoCoordinates';
import { loadWithPersistenceCache } from '../shared/tileLoaderUtils';
import { OvertureParser } from './pmtiles/OvertureParser';
import type { PMTilesReader, ArchiveGroup } from './pmtiles/PMTilesReader';
import type { ModulesFeatures } from '../../features/registrationTypes';
import type { GeoBounds } from '../elevation/types';
import { filterFeaturesByBounds } from './pmtiles/featureBoundsFilter';
import { featureRegistry } from '../../features/registry';

/**
 * Factory for loading and parsing context data tiles from Overture Maps PMTiles.
 * Loads geospatial features (buildings, roads, railways, etc.) for a given tile.
 *
 * When the requested zoom exceeds the PMTiles maxZoom (overzoom), fetches the
 * parent tile, fans out features to all zoom-N sub-tiles, and pre-populates the
 * persistence cache for all siblings. An in-flight deduplication map ensures
 * each parent tile is fetched only once across concurrent requests.
 */
export class ContextDataTileLoader {
  // Deduplicates concurrent requests for the same parent tile during overzoom fan-out.
  // Key format: "z:x:y" of the parent tile.
  private static readonly parentFetches = new Map<
    string,
    Promise<ContextDataTile[]>
  >();

  /**
   * Loads a context data tile from Overture Maps PMTiles archives.
   * Handles overzoom transparently via parent fetch + fan-out caching.
   */
  static async loadTile(
    coordinates: TileCoordinates,
    reader: PMTilesReader,
    signal?: AbortSignal
  ): Promise<ContextDataTile> {
    if (signal?.aborted) {
      throw new Error('Aborted');
    }

    const effectiveZ = await reader.getEffectiveDataZoom();

    if (coordinates.z <= effectiveZ) {
      return this.loadTileDirect(coordinates, reader);
    }

    return this.loadTileWithOverzoom(coordinates, reader, effectiveZ);
  }

  private static parseAndMergeGroups(
    groups: ArchiveGroup[],
    clampBounds: GeoBounds
  ): ModulesFeatures {
    const merged = featureRegistry.modulesFeaturesFactory();
    for (const { tile, fetchCoords } of groups) {
      const bounds = getTileGeoBounds(fetchCoords);
      const parsed = OvertureParser.parse(tile, bounds, fetchCoords);
      for (const key of Object.keys(parsed) as (keyof ModulesFeatures)[]) {
        const src = parsed[key] as unknown[];
        const dst = merged[key] as unknown[];
        dst.push(...src);
      }
    }
    return filterFeaturesByBounds(merged, clampBounds);
  }

  private static async loadTileDirect(
    coordinates: TileCoordinates,
    reader: PMTilesReader
  ): Promise<ContextDataTile> {
    const bounds = getTileGeoBounds(coordinates);
    const { groups } = await reader.getTile(coordinates);
    const features = this.parseAndMergeGroups(groups, bounds);
    return {
      coordinates,
      geoBounds: bounds,
      zoomLevel: coordinates.z,
      features,
      colorPalette,
    };
  }

  private static async loadTileWithOverzoom(
    coordinates: TileCoordinates,
    reader: PMTilesReader,
    effectiveZ: number
  ): Promise<ContextDataTile> {
    const dz = coordinates.z - effectiveZ;
    const parentCoords: TileCoordinates = {
      z: effectiveZ,
      x: coordinates.x >> dz,
      y: coordinates.y >> dz,
    };
    const parentKey = `${parentCoords.z}:${parentCoords.x}:${parentCoords.y}`;
    const requestedKey = `${coordinates.z}:${coordinates.x}:${coordinates.y}`;

    let parentPromise = this.parentFetches.get(parentKey);
    if (!parentPromise) {
      parentPromise = this.fetchAndFanOut(
        parentCoords,
        coordinates.z,
        reader
      ).finally(() => this.parentFetches.delete(parentKey));
      this.parentFetches.set(parentKey, parentPromise);
    }

    const subTiles = await parentPromise;
    return (
      subTiles.find(
        (t) =>
          `${t.coordinates.z}:${t.coordinates.x}:${t.coordinates.y}` ===
          requestedKey
      ) ?? this.emptyTile(coordinates)
    );
  }

  /**
   * Fetches the parent tile and fans out features to all zoom-N sub-tiles.
   * Writes each sub-tile to the persistence cache (fire-and-forget).
   */
  private static async fetchAndFanOut(
    parentCoords: TileCoordinates,
    targetZ: number,
    reader: PMTilesReader
  ): Promise<ContextDataTile[]> {
    const parentBounds = getTileGeoBounds(parentCoords);
    const { groups } = await reader.getTile(parentCoords);
    const allFeatures = this.parseAndMergeGroups(groups, parentBounds);

    const dz = targetZ - parentCoords.z;
    const subCount = 1 << dz;
    const baseX = parentCoords.x << dz;
    const baseY = parentCoords.y << dz;

    const subTiles: ContextDataTile[] = [];
    for (let dy = 0; dy < subCount; dy++) {
      for (let dx = 0; dx < subCount; dx++) {
        const subCoords: TileCoordinates = {
          z: targetZ,
          x: baseX + dx,
          y: baseY + dy,
        };
        const subBounds = getTileGeoBounds(subCoords);
        const subFeatures = filterFeaturesByBounds(allFeatures, subBounds);
        const subTile: ContextDataTile = {
          coordinates: subCoords,
          geoBounds: subBounds,
          zoomLevel: targetZ,
          features: subFeatures,
          colorPalette,
        };
        subTiles.push(subTile);
        // Pre-populate siblings in cache (fire-and-forget)
        const subKey = `${subCoords.z}:${subCoords.x}:${subCoords.y}`;
        ContextTilePersistenceCache.set(subKey, subTile).catch(() => {});
      }
    }
    return subTiles;
  }

  private static emptyTile(coordinates: TileCoordinates): ContextDataTile {
    return {
      coordinates,
      geoBounds: getTileGeoBounds(coordinates),
      zoomLevel: coordinates.z,
      features: featureRegistry.modulesFeaturesFactory(),
      colorPalette,
    };
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
