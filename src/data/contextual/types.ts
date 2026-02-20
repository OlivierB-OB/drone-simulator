import type { TileCoordinates, MercatorBounds } from '../elevation/types';

/**
 * Geometry types for OSM features
 */
export type Geometry = Point | LineString | Polygon;

export interface Point {
  type: 'Point';
  coordinates: [number, number]; // [x, y] in Mercator
}

export interface LineString {
  type: 'LineString';
  coordinates: [number, number][]; // Array of [x, y] in Mercator
}

export interface Polygon {
  type: 'Polygon';
  coordinates: [number, number][][]; // Array of rings, each ring is array of [x, y]
}

/**
 * Color representation in hex format
 */
export type HexColor = string; // e.g., '#ff0000'

/**
 * Visual properties for buildings - focused on rendering: shape, size, levels, color
 */
export interface BuildingVisual {
  id: string;
  geometry: Polygon | Point | LineString; // Polygon for relations, Point for nodes, LineString for simple ways
  type: string; // Building category: residential, commercial, industrial, office, etc.
  height?: number; // meters above ground
  levelCount?: number; // number of floors
  color: HexColor; // Derived from building type
}

/**
 * Visual properties for roads - focused on rendering: shape, width, lanes, color
 */
export interface RoadVisual {
  id: string;
  geometry: LineString;
  type: string; // Road category: primary, secondary, residential, motorway, etc.
  widthCategory: 'large' | 'medium' | 'small'; // Derived from road type
  laneCount?: number; // Number of lanes if available
  color: HexColor; // Derived from road type
}

/**
 * Visual properties for railways - focused on rendering: shape, track count, type, color
 */
export interface RailwayVisual {
  id: string;
  geometry: LineString;
  type: string; // Railway category: rail, light_rail, tram, metro, etc.
  trackCount?: number; // Number of tracks/rails
  color: HexColor; // Derived from railway type
}

/**
 * Visual properties for water bodies - focused on rendering: shape, water type, color
 */
export interface WaterVisual {
  id: string;
  geometry: LineString | Polygon;
  type: string; // Water category: river, lake, canal, stream, wetland, reservoir, etc.
  isArea: boolean; // true for lakes/ponds/wetlands, false for rivers/streams/canals
  color: HexColor; // Blue variants derived from water type
}

/**
 * Visual properties for vegetation - focused on rendering: shape, vegetation type, height, color
 */
export interface VegetationVisual {
  id: string;
  geometry: LineString | Polygon | Point;
  type: string; // Vegetation category: forest, wood, scrub, grass, tree, hedge, etc.
  height?: number; // meters (for trees and tall vegetation)
  heightCategory: 'tall' | 'medium' | 'short'; // Normalized height
  color: HexColor; // Green variants derived from vegetation type
}

/**
 * Visual properties for airports - focused on rendering: location, type, color
 */
export interface AirportVisual {
  id: string;
  geometry: Point | Polygon | LineString; // Point for nodes, Polygon/LineString for ways/relations
  type: string; // Airport category: aerodrome, heliport, etc.
  color: HexColor; // Standard airport color
}

/**
 * Union of all visual feature types
 */
export type VisualFeature =
  | BuildingVisual
  | RoadVisual
  | RailwayVisual
  | WaterVisual
  | VegetationVisual
  | AirportVisual;

/**
 * Color palette mapping for different feature categories
 */
export interface ColorPalette {
  // Building colors by type
  buildings: Record<string, HexColor>;
  // Road colors by type
  roads: Record<string, HexColor>;
  // Railway colors by type
  railways: Record<string, HexColor>;
  // Water colors by type
  waters: Record<string, HexColor>;
  // Vegetation colors by type
  vegetation: Record<string, HexColor>;
  // Airport color
  airport: HexColor;
}

/**
 * Context data tile containing all visual OSM features for a tile
 */
export interface ContextDataTile {
  /** Position of this tile in the Web Mercator system */
  coordinates: TileCoordinates;

  /** Geographic bounds of this tile in Mercator coordinates (meters) */
  mercatorBounds: MercatorBounds;

  /** Zoom level of this tile */
  zoomLevel: number;

  /** All features grouped by type - only visual properties */
  features: {
    buildings: BuildingVisual[];
    roads: RoadVisual[];
    railways: RailwayVisual[];
    waters: WaterVisual[];
    airports: AirportVisual[];
    vegetation: VegetationVisual[];
  };

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
