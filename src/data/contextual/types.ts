import type { ModulesFeatures } from '../../features/registrationTypes';
import type { ColorPalette } from '../../features/sharedTypes';
import type { TileCoordinates, GeoBounds } from '../elevation/types';

/**
 * Context data tile containing all visual OSM features for a tile
 */
export interface ContextDataTile {
  /** Position of this tile in the Web Mercator system */
  coordinates: TileCoordinates;

  /** Geographic bounds of this tile in degrees */
  geoBounds: GeoBounds;

  /** Zoom level of this tile */
  zoomLevel: number;

  /** All features grouped by type - only visual properties */
  features: ModulesFeatures;

  /** Color palette for this tile's features */
  colorPalette: ColorPalette;
}

/**
 * Context data tile with cache metadata (used internally by ContextTilePersistenceCache)
 */
export interface ContextDataTileCached extends ContextDataTile {
  /** Cache key for this tile */
  key: string;

  /** Timestamp when tile was stored in cache */
  storedAt: number;

  /** Timestamp when tile expires from cache */
  expiresAt: number;
}
