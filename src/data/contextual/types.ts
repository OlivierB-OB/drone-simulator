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
  minHeight?: number; // meters above ground (min_height tag — for building parts)
  levelCount?: number; // number of floors
  minLevelCount?: number; // number of floors at base (building:min_level tag)
  color: HexColor; // Wall color: building:colour → building:material → type default
  roofColor?: HexColor; // Roof color: roof:colour → roof:material → shape default
  roofShape?: string; // flat | gabled | hipped | pyramidal | dome | onion | cone | skillion
  roofHeight?: number; // roof height in meters (roof:height tag)
  roofDirection?: number; // roof ridge direction in degrees
  isPart?: boolean; // true when building:part=yes
}

/**
 * Visual properties for roads - focused on rendering: shape, width, lanes, color
 */
export interface RoadVisual {
  id: string;
  geometry: LineString;
  type: string; // Road category: primary, secondary, residential, motorway, etc.
  widthMeters: number; // Real-world width in meters derived from road type
  laneCount?: number; // Number of lanes if available
  color: HexColor; // Derived from road type
  surfaceColor?: HexColor; // Override color from surface tag (asphalt, concrete, etc.)
  treeLined?: 'both' | 'left' | 'right' | 'yes'; // tree_lined tag
  bridge?: boolean; // bridge=yes
  layer?: number; // layer tag
}

/**
 * Visual properties for railways - focused on rendering: shape, track count, type, color
 */
export interface RailwayVisual {
  id: string;
  geometry: LineString;
  type: string; // Railway category: rail, light_rail, tram, metro, etc.
  trackCount?: number; // Number of tracks/rails
  widthMeters: number; // Real-world width in meters derived from railway type
  dash: number[]; // Line dash pattern [dashLen, gapLen]
  color: HexColor; // Derived from railway type
  bridge?: boolean; // bridge=yes
  layer?: number; // layer tag
}

/**
 * Visual properties for water bodies - focused on rendering: shape, water type, color
 */
export interface WaterVisual {
  id: string;
  geometry: LineString | Polygon;
  type: string; // Water category: river, lake, canal, stream, wetland, reservoir, etc.
  isArea: boolean; // true for lakes/ponds/wetlands, false for rivers/streams/canals
  widthMeters: number; // Real-world width in meters for waterway lines; 0 for polygon bodies
  color: HexColor; // Blue variants derived from water type
}

/**
 * Visual properties for vegetation - focused on rendering: shape, vegetation type, height, color
 */
export interface VegetationVisual {
  id: string;
  geometry: LineString | Polygon | Point;
  type: string; // Vegetation category: forest, wood, scrub, grass, tree, tree_row, hedge, etc.
  height?: number; // meters (for trees and tall vegetation)
  heightCategory: 'tall' | 'medium' | 'short'; // Normalized height
  color: HexColor; // Green variants derived from vegetation type
  leafType?: 'broadleaved' | 'needleleaved'; // leaf_type tag — affects 3D canopy shape
  leafCycle?: 'evergreen' | 'deciduous'; // leaf_cycle tag — affects 3D canopy color range
  crownDiameter?: number; // diameter_crown tag in meters
  trunkCircumference?: number; // circumference tag in meters
}

/**
 * Visual properties for landuse/landcover areas - filled ground surface regions
 */
export interface LanduseVisual {
  id: string;
  geometry: Polygon;
  type: string; // farmland, meadow, park, residential, commercial, etc.
  color: HexColor;
}

/**
 * Visual properties for aeroways - focused on rendering: location, type, color
 */
export interface AerowayVisual {
  id: string;
  geometry: Point | Polygon | LineString; // Point for nodes, Polygon/LineString for ways/relations
  type: string; // aerodrome, runway, taxiway, taxilane, apron, helipad
  color: HexColor;
  widthMeters?: number; // Real-world width in meters for LineString aeroways (runway: 45, taxiway: 23, taxilane: 12)
}

/** @deprecated Use AerowayVisual */
export type AirportVisual = AerowayVisual;

/**
 * Visual properties for man-made structures rendered as 3D meshes
 */
export interface StructureVisual {
  id: string;
  geometry: Point | Polygon;
  type: string; // tower|chimney|mast|communications_tower|water_tower|silo|storage_tank|lighthouse|crane|power_tower|power_pole|aerialway_pylon
  height?: number; // meters
  diameter?: number; // meters (storage_tank, silo)
  color: HexColor;
}

/**
 * Visual properties for barriers rendered as 3D extruded segments
 */
export interface BarrierVisual {
  id: string;
  geometry: LineString;
  type: string; // wall|city_wall|retaining_wall|hedge
  height?: number; // meters (overrides type default)
  width: number; // mesh width in meters
  color: HexColor;
  material?: string; // material tag for color override
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
  | AerowayVisual
  | LanduseVisual
  | StructureVisual
  | BarrierVisual;

/**
 * Color palette mapping for different feature categories
 */
export interface ColorPalette {
  // Building colors by type (roads/waters/vegetation now use groundColors from config)
  buildings: Record<string, HexColor>;
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
    landuse: LanduseVisual[];
    structures: StructureVisual[];
    barriers: BarrierVisual[];
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
