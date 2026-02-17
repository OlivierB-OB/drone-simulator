/**
 * Represents a tile's position in the Web Mercator tile coordinate system.
 * @property z - Zoom level (0-28, higher = more detail)
 * @property x - Tile column index
 * @property y - Tile row index
 */
export interface TileCoordinates {
  z: number;
  x: number;
  y: number;
}

/**
 * Mercator coordinate bounds (rectangle in meters)
 */
export interface MercatorBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/**
 * A single elevation data tile containing raster elevation values and metadata.
 * Each tile represents a 256×256 grid of elevation samples.
 */
export interface ElevationDataTile {
  /** Position of this tile in the Web Mercator system */
  coordinates: TileCoordinates;

  /** 2D array of elevation values in meters [row][column] */
  data: number[][];

  /** Size of the raster grid (typically 256×256) */
  tileSize: number;

  /** Zoom level of this tile */
  zoomLevel: number;

  /** Geographic bounds of this tile in Mercator coordinates (meters) */
  mercatorBounds: MercatorBounds;
}

/**
 * Configuration for the tile ring management system
 */
export interface TileRingConfig {
  /** Number of tiles in each direction from center (e.g., 3 = 7×7 grid) */
  ringRadius: number;

  /** Maximum number of concurrent tile downloads */
  maxConcurrentLoads: number;
}
