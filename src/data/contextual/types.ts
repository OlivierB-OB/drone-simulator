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
 * Base feature type with common properties
 */
export interface BaseFeature {
  id: string; // OSM id (node/way/relation id)
  geometry: Geometry;
  tags: Record<string, string>; // Raw OSM tags
}

/**
 * Building feature
 */
export interface Building extends BaseFeature {
  name?: string;
  type?: string; // residential, commercial, industrial, etc.
  height?: number; // meters, if available
  levels?: number; // number of levels, if available
}

/**
 * Road/highway feature
 */
export interface Road extends BaseFeature {
  name?: string;
  type: string; // primary, secondary, residential, service, etc.
  maxSpeed?: number; // km/h, if available
  oneWay?: boolean;
}

/**
 * Railway feature
 */
export interface Railway extends BaseFeature {
  name?: string;
  type: string; // rail, metro, light_rail, tram, etc.
  gauge?: string; // mm, if available
}

/**
 * Water feature (rivers, lakes, reservoirs, etc.)
 */
export interface Water extends BaseFeature {
  name?: string;
  type: string; // river, lake, reservoir, canal, stream, wetland, etc.
  area?: boolean; // true if closed water area (lake, pond), undefined for linear (river)
  isNatural?: boolean; // true if natural=water, false if landuse=water
}

/**
 * Airport feature
 */
export interface Airport extends BaseFeature {
  name: string;
  iata?: string; // IATA code
  icao?: string; // ICAO code
  type?: string; // aerodrome, heliport, etc.
}

/**
 * Vegetation feature (forests, grass, scrub, individual trees)
 */
export interface Vegetation extends BaseFeature {
  name?: string;
  type: string; // forest, wood, scrub, grass, hedge, etc.
  height?: number; // meters, if available (usually for trees)
}

/**
 * Land use area (residential, industrial, agricultural, grass, sand, etc.)
 */
export interface LandUseArea extends BaseFeature {
  name?: string;
  type: string; // residential, industrial, agricultural, grass, sand, commercial, etc.
}

/**
 * Union of all feature types
 */
export type Feature =
  | Building
  | Road
  | Railway
  | Water
  | Airport
  | Vegetation
  | LandUseArea;

/**
 * Context data tile containing all OSM features for a tile
 */
export interface ContextDataTile {
  /** Position of this tile in the Web Mercator system */
  coordinates: TileCoordinates;

  /** Geographic bounds of this tile in Mercator coordinates (meters) */
  mercatorBounds: MercatorBounds;

  /** Zoom level of this tile */
  zoomLevel: number;

  /** All features grouped by type */
  features: {
    buildings: Building[];
    roads: Road[];
    railways: Railway[];
    waters: Water[];
    airports: Airport[];
    vegetation: Vegetation[];
    landUse: LandUseArea[];
  };
}
