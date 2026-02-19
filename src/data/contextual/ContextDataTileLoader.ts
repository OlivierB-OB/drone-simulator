import type {
  ContextDataTile,
  BuildingVisual,
  RoadVisual,
  RailwayVisual,
  WaterVisual,
  VegetationVisual,
  AirportVisual,
  Point,
  LineString,
  Polygon,
  HexColor,
} from './types';
import type { TileCoordinates, MercatorBounds } from '../elevation/types';
import type { MercatorCoordinates } from '../../gis/types';
import { colorPalette } from '../../config';
import type { OverpassStatusManager } from './OverpassStatusManager';
import { ContextTilePersistenceCache } from './ContextTilePersistenceCache';

/**
 * Factory for loading and parsing context data tiles from OSM Overpass API.
 * Loads geospatial features (buildings, roads, railways, etc.) for a given tile.
 */
export class ContextDataTileLoader {
  private static readonly EARTH_RADIUS = 6378137; // meters
  private static readonly MAX_EXTENT =
    ContextDataTileLoader.EARTH_RADIUS * Math.PI;

  /**
   * Converts Mercator coordinates to Web Mercator tile coordinates.
   * Reuses the same logic as ElevationDataTileLoader.
   *
   * @param location - Mercator coordinates in meters
   * @param zoomLevel - Web Mercator zoom level (0-28)
   * @returns Tile coordinates {z, x, y}
   */
  static getTileCoordinates(
    location: MercatorCoordinates,
    zoomLevel: number
  ): TileCoordinates {
    const n = Math.pow(2, zoomLevel);
    const x = ((location.x + this.MAX_EXTENT) / (2 * this.MAX_EXTENT)) * n;
    const y = ((this.MAX_EXTENT - location.y) / (2 * this.MAX_EXTENT)) * n;

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
    const n = Math.pow(2, coordinates.z);

    const minNormX = coordinates.x / n;
    const maxNormX = (coordinates.x + 1) / n;
    const minNormY = coordinates.y / n;
    const maxNormY = (coordinates.y + 1) / n;

    const minX = minNormX * 2 * this.MAX_EXTENT - this.MAX_EXTENT;
    const maxX = maxNormX * 2 * this.MAX_EXTENT - this.MAX_EXTENT;
    const minY = this.MAX_EXTENT - maxNormY * 2 * this.MAX_EXTENT;
    const maxY = this.MAX_EXTENT - minNormY * 2 * this.MAX_EXTENT;

    return { minX, maxX, minY, maxY };
  }

  /**
   * Converts Mercator meters to latitude/longitude (decimal degrees).
   * Required for Overpass API bbox parameter.
   */
  private static mercatorToLatLng(x: number, y: number): [number, number] {
    const lng = (x / this.MAX_EXTENT) * 180;
    const lat =
      (Math.atan(Math.sinh((Math.PI * y) / this.MAX_EXTENT)) * 180) / Math.PI;
    return [lat, lng];
  }

  /**
   * Converts latitude/longitude (decimal degrees) to Mercator meters.
   * Used when parsing OSM node coordinates.
   */
  private static latLngToMercator(lat: number, lng: number): [number, number] {
    const x = (lng / 180) * this.MAX_EXTENT;
    const y =
      (Math.log(Math.tan((Math.PI * (90 + lat)) / 360)) / Math.PI) *
      this.MAX_EXTENT;
    return [x, y];
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
  way["natural"~"forest|wood|scrub|grass|heath"](${bbox});
  node["natural"~"tree|trees"](${bbox});
  way["landuse"~"residential|industrial|agricultural|grass|sand|commercial"](${bbox});
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
   * @param statusManager - Optional OverpassStatusManager for respecting API rate limits
   * @returns Loaded context tile
   * @throws Error if tile cannot be loaded or parsed
   */
  static async loadTile(
    coordinates: TileCoordinates,
    endpoint: string,
    timeout: number,
    statusManager?: OverpassStatusManager
  ): Promise<ContextDataTile> {
    const bounds = this.getTileMercatorBounds(coordinates);
    const query = this.generateOverpassQuery(bounds);

    // If status manager is available, wait for next available slot
    if (statusManager) {
      const nextSlot = await statusManager.getNextAvailableSlot();
      if (nextSlot) {
        const now = new Date();
        const waitMs = nextSlot.getTime() - now.getTime();
        if (waitMs > 0) {
          console.debug(
            `[ContextDataTileLoader] Waiting ${waitMs}ms for Overpass API slot`
          );
          await new Promise((resolve) => setTimeout(resolve, waitMs));
        }
      }
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        body: query,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        signal: AbortSignal.timeout(timeout),
      });

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
      const features = this.parseOSMData(osmData, bounds, coordinates.z);

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
          {
            cause: error,
          }
        );
      }
      throw error;
    }
  }

  /**
   * Parses OSM JSON response data and groups features by type.
   * Only extracts visual properties; ignores non-rendering attributes.
   */
  private static parseOSMData(
    osmData: Record<string, unknown>,
    bounds: MercatorBounds,
    zoomLevel: number
  ): ContextDataTile['features'] {
    const features: ContextDataTile['features'] = {
      buildings: [],
      roads: [],
      railways: [],
      waters: [],
      airports: [],
      vegetation: [],
    };

    if (!Array.isArray(osmData.elements)) {
      return features;
    }

    // Build node map for coordinate lookup
    const nodeMap = new Map<number, { lat: number; lng: number }>();
    const osm_elements = osmData.elements as Array<Record<string, unknown>>;

    for (const element of osm_elements) {
      if (element.type === 'node' && typeof element.id === 'number') {
        const id = element.id;
        const lat = element.lat as number;
        const lng = element.lon as number;
        nodeMap.set(id, { lat, lng });
      }
    }

    // Process ways and relations
    for (const element of osm_elements) {
      if (element.type === 'way') {
        this.processWay(element, nodeMap, bounds, zoomLevel, features);
      } else if (element.type === 'node' && element.tags) {
        this.processNode(element, nodeMap, bounds, zoomLevel, features);
      } else if (element.type === 'relation') {
        this.processRelation(element, nodeMap, bounds, zoomLevel, features);
      }
    }

    return features;
  }

  /**
   * Gets color for a building type
   */
  private static getColorForBuilding(buildingType: string): HexColor {
    const typeNormalized = buildingType.toLowerCase();
    const colors = colorPalette.buildings as Record<string, HexColor>;
    return colors[typeNormalized] || colors.default;
  }

  /**
   * Gets width category for a road type
   */
  private static getRoadWidthCategory(
    roadType: string
  ): 'large' | 'medium' | 'small' {
    const type = roadType.toLowerCase();
    if (['motorway', 'trunk', 'primary'].includes(type)) return 'large';
    if (['secondary', 'tertiary'].includes(type)) return 'medium';
    return 'small';
  }

  /**
   * Gets color for a road type
   */
  private static getColorForRoad(roadType: string): HexColor {
    const typeNormalized = roadType.toLowerCase();
    const colors = colorPalette.roads as Record<string, HexColor>;
    return colors[typeNormalized] || colors.default;
  }

  /**
   * Gets color for a railway type
   */
  private static getColorForRailway(railwayType: string): HexColor {
    const typeNormalized = railwayType.toLowerCase();
    const colors = colorPalette.railways as Record<string, HexColor>;
    return colors[typeNormalized] || colors.default;
  }

  /**
   * Gets track count from gauge or defaults to 1
   */
  private static getTrackCount(gauge?: string): number {
    if (!gauge) return 1;
    // Standard gauge (1435mm) typically has 1-2 tracks per line
    // Narrow gauge might have different properties, default to 1
    return 1;
  }

  /**
   * Gets color for a water type
   */
  private static getColorForWater(waterType: string): HexColor {
    const typeNormalized = waterType.toLowerCase();
    const colors = colorPalette.waters as Record<string, HexColor>;
    return colors[typeNormalized] || colors.default;
  }

  /**
   * Gets height category from numeric height
   */
  private static getHeightCategory(
    height?: number
  ): 'tall' | 'medium' | 'short' {
    if (!height) return 'medium';
    if (height > 20) return 'tall';
    if (height > 5) return 'medium';
    return 'short';
  }

  /**
   * Gets color for vegetation type
   */
  private static getColorForVegetation(vegType: string): HexColor {
    const typeNormalized = vegType.toLowerCase();
    const colors = colorPalette.vegetation as Record<string, HexColor>;
    return colors[typeNormalized] || colors.default;
  }

  /**
   * Processes a way element from OSM data.
   * Extracts only visual properties, ignores non-rendering attributes.
   */
  private static processWay(
    element: Record<string, unknown>,
    nodeMap: Map<number, { lat: number; lng: number }>,
    _bounds: MercatorBounds,
    _zoomLevel: number,
    features: ContextDataTile['features']
  ): void {
    const id = String(element.id);
    const tags = (element.tags as Record<string, string>) || {};
    const nodes = (element.nodes as number[]) || [];
    const geometry = element.geometry as
      | Array<{ lat: number; lon: number }>
      | undefined;

    if (!tags || Object.keys(tags).length === 0) {
      return;
    }

    // Build geometry from nodes or geometry array
    const coordinates = this.buildLineStringCoordinates(
      nodes,
      geometry,
      nodeMap
    );

    if (coordinates.length === 0) {
      return;
    }

    // Detect closed ring (first coord == last coord) for polygon features
    const firstCoord = coordinates[0];
    const lastCoord = coordinates[coordinates.length - 1];
    const isClosed: boolean =
      coordinates.length >= 3 &&
      !!firstCoord &&
      !!lastCoord &&
      firstCoord[0] === lastCoord[0] &&
      firstCoord[1] === lastCoord[1];

    const lineGeometry: LineString = {
      type: 'LineString',
      coordinates,
    };

    const polygonGeometry: Polygon | null = isClosed
      ? { type: 'Polygon', coordinates: [coordinates] }
      : null;

    // Classify feature by tags and extract only visual properties
    if (tags.building) {
      // Filter: require height OR levels for visual rendering
      const height = tags.height ? parseFloat(tags.height) : undefined;
      const levels = tags['building:levels']
        ? parseInt(tags['building:levels'], 10)
        : undefined;

      if (height !== undefined || levels !== undefined) {
        const buildingType = tags['building:type'] || tags.building || 'other';
        const building: BuildingVisual = {
          id,
          geometry: polygonGeometry ?? lineGeometry,
          type: buildingType,
          height,
          levelCount: levels,
          color: this.getColorForBuilding(buildingType),
        };
        features.buildings.push(building);
      }
    } else if (tags.highway) {
      // Filter: skip footways, paths (no visual distinction)
      const highwayType = tags.highway.toLowerCase();
      if (!['footway', 'path'].includes(highwayType)) {
        const lanes = tags.lanes ? parseInt(tags.lanes, 10) : undefined;
        const road: RoadVisual = {
          id,
          geometry: lineGeometry,
          type: tags.highway,
          widthCategory: this.getRoadWidthCategory(tags.highway),
          laneCount: lanes,
          color: this.getColorForRoad(tags.highway),
        };
        features.roads.push(road);
      }
    } else if (tags.railway) {
      const railwayType = tags.railway || 'rail';
      const railway: RailwayVisual = {
        id,
        geometry: lineGeometry,
        type: railwayType,
        trackCount: this.getTrackCount(tags.gauge),
        color: this.getColorForRailway(railwayType),
      };
      features.railways.push(railway);
    } else if (
      tags.waterway ||
      tags['natural'] === 'water' ||
      tags['natural'] === 'wetland' ||
      tags['natural'] === 'coastline' ||
      tags.water ||
      tags.landuse === 'water'
    ) {
      // Determine water type from tags (always has a default)
      const waterType: string =
        tags.waterway ||
        tags.water ||
        tags['natural'] ||
        tags.landuse ||
        'water';

      const water: WaterVisual = {
        id,
        geometry: isClosed ? polygonGeometry! : lineGeometry,
        type: waterType,
        isArea: isClosed,
        color: this.getColorForWater(waterType),
      };
      features.waters.push(water);
    } else if (tags.aeroway === 'aerodrome') {
      const airportType: string = tags.aeroway || 'aerodrome';
      const airport: AirportVisual = {
        id,
        geometry: isClosed ? polygonGeometry! : lineGeometry,
        type: airportType,
        color: colorPalette.airport,
      };
      features.airports.push(airport);
    } else if (tags.natural) {
      const vegType: string = tags.natural || 'vegetation';
      const height = tags.height ? parseFloat(tags.height) : undefined;
      const vegetation: VegetationVisual = {
        id,
        geometry: isClosed ? polygonGeometry! : lineGeometry,
        type: vegType,
        height,
        heightCategory: this.getHeightCategory(height),
        color: this.getColorForVegetation(vegType),
      };
      features.vegetation.push(vegetation);
    }
  }

  /**
   * Processes a node element from OSM data.
   * Extracts only visual properties, ignores non-rendering attributes.
   */
  private static processNode(
    element: Record<string, unknown>,
    _nodeMap: Map<number, { lat: number; lng: number }>,
    _bounds: MercatorBounds,
    _zoomLevel: number,
    features: ContextDataTile['features']
  ): void {
    const id = String(element.id);
    const tags = (element.tags as Record<string, string>) || {};
    const lat = element.lat as number;
    const lng = element.lon as number;

    if (!tags || Object.keys(tags).length === 0) {
      return;
    }

    const [x, y] = this.latLngToMercator(lat, lng);
    const pointGeometry: Point = {
      type: 'Point',
      coordinates: [x, y],
    };

    // Classify node features and extract only visual properties
    if (tags.aeroway === 'aerodrome') {
      const airport: AirportVisual = {
        id,
        geometry: pointGeometry,
        type: tags.aeroway || 'aerodrome',
        color: colorPalette.airport,
      };
      features.airports.push(airport);
    } else if (tags['natural'] === 'tree') {
      const height = tags.height ? parseFloat(tags.height) : undefined;
      const vegetation: VegetationVisual = {
        id,
        geometry: pointGeometry,
        type: 'tree',
        height,
        heightCategory: this.getHeightCategory(height),
        color: this.getColorForVegetation('tree'),
      };
      features.vegetation.push(vegetation);
    } else if (tags.building) {
      // Filter: require height OR levels for visual rendering
      const height = tags.height ? parseFloat(tags.height) : undefined;
      const levels = tags['building:levels']
        ? parseInt(tags['building:levels'], 10)
        : undefined;

      if (height !== undefined || levels !== undefined) {
        const buildingType = tags['building:type'] || tags.building || 'other';
        const building: BuildingVisual = {
          id,
          geometry: pointGeometry,
          type: buildingType,
          height,
          levelCount: levels,
          color: this.getColorForBuilding(buildingType),
        };
        features.buildings.push(building);
      }
    }
  }

  /**
   * Processes a relation element from OSM data.
   * Extracts only visual properties, ignores non-rendering attributes.
   */
  private static processRelation(
    element: Record<string, unknown>,
    _nodeMap: Map<number, { lat: number; lng: number }>,
    _bounds: MercatorBounds,
    _zoomLevel: number,
    features: ContextDataTile['features']
  ): void {
    const id = String(element.id);
    const tags = (element.tags as Record<string, string>) || {};
    const geometry = element.geometry as
      | Array<{ lat: number; lon: number }>
      | undefined;

    if (!tags || Object.keys(tags).length === 0) {
      return;
    }

    // Build geometry from geometry array or members
    let coordinates: [number, number][] = [];

    if (geometry && Array.isArray(geometry)) {
      coordinates = geometry.map(({ lat, lon }) =>
        this.latLngToMercator(lat as number, lon as number)
      );
    }

    if (coordinates.length === 0) {
      return;
    }

    // For polygons, close the ring if needed
    const firstCoord = coordinates[0];
    const lastCoord = coordinates[coordinates.length - 1];
    if (
      firstCoord &&
      lastCoord &&
      (firstCoord[0] !== lastCoord[0] || firstCoord[1] !== lastCoord[1])
    ) {
      coordinates.push(firstCoord);
    }

    const polygonGeometry: Polygon = {
      type: 'Polygon',
      coordinates: [coordinates],
    };

    // Classify based on tags and extract only visual properties
    if (tags.building) {
      // Filter: require height OR levels for visual rendering
      const height = tags.height ? parseFloat(tags.height) : undefined;
      const levels = tags['building:levels']
        ? parseInt(tags['building:levels'], 10)
        : undefined;

      if (height !== undefined || levels !== undefined) {
        const buildingType = tags['building:type'] || tags.building || 'other';
        const building: BuildingVisual = {
          id,
          geometry: polygonGeometry,
          type: buildingType,
          height,
          levelCount: levels,
          color: this.getColorForBuilding(buildingType),
        };
        features.buildings.push(building);
      }
    } else if (tags.aeroway === 'aerodrome') {
      const airportType: string = tags.aeroway || 'aerodrome';
      const airport: AirportVisual = {
        id,
        geometry: polygonGeometry,
        type: airportType,
        color: colorPalette.airport,
      };
      features.airports.push(airport);
    } else if (
      tags['natural'] === 'water' ||
      tags['natural'] === 'wetland' ||
      tags.landuse === 'water'
    ) {
      // Water multipolygons (lakes, ponds, reservoirs, wetlands)
      const waterType: string = tags['natural'] || tags.landuse || 'water';
      const water: WaterVisual = {
        id,
        geometry: polygonGeometry,
        type: waterType,
        isArea: true, // Relations are always areal
        color: this.getColorForWater(waterType),
      };
      features.waters.push(water);
    } else if (tags.natural) {
      const vegType: string = tags.natural || 'vegetation';
      const height = tags.height ? parseFloat(tags.height) : undefined;
      const vegetation: VegetationVisual = {
        id,
        geometry: polygonGeometry,
        type: vegType,
        height,
        heightCategory: this.getHeightCategory(height),
        color: this.getColorForVegetation(vegType),
      };
      features.vegetation.push(vegetation);
    }
  }

  /**
   * Builds a LineString from way nodes or geometry array.
   */
  private static buildLineStringCoordinates(
    nodes: number[],
    geometry: Array<{ lat: number; lon: number }> | undefined,
    nodeMap: Map<number, { lat: number; lng: number }>
  ): [number, number][] {
    const coordinates: [number, number][] = [];

    // Prefer geometry array if available (more efficient)
    if (geometry && Array.isArray(geometry)) {
      for (const { lat, lon } of geometry) {
        coordinates.push(this.latLngToMercator(lat as number, lon as number));
      }
    } else {
      // Fall back to node IDs
      for (const nodeId of nodes) {
        const node = nodeMap.get(nodeId);
        if (node) {
          coordinates.push(this.latLngToMercator(node.lat, node.lng));
        }
      }
    }

    return coordinates;
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
   * @param statusManager - Optional OverpassStatusManager for respecting API rate limits
   * @returns Loaded tile or null if loading failed
   */
  static async loadTileWithRetry(
    coordinates: TileCoordinates,
    endpoint: string,
    timeout: number,
    maxRetries: number = 3,
    statusManager?: OverpassStatusManager
  ): Promise<ContextDataTile | null> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await this.loadTile(
          coordinates,
          endpoint,
          timeout,
          statusManager
        );
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
   * @param statusManager - Optional OverpassStatusManager for respecting API rate limits
   * @returns Loaded context tile or null if load fails
   */
  static async loadTileWithCache(
    coordinates: TileCoordinates,
    endpoint: string,
    timeout: number,
    maxRetries: number = 3,
    statusManager?: OverpassStatusManager
  ): Promise<ContextDataTile | null> {
    const tileKey = `${coordinates.z}:${coordinates.x}:${coordinates.y}`;

    // Try to get from persistent cache first
    const cachedTile = await ContextTilePersistenceCache.get(tileKey);
    if (cachedTile) {
      return cachedTile;
    }

    // Cache miss: load from Overpass API with retry logic
    const tile = await this.loadTileWithRetry(
      coordinates,
      endpoint,
      timeout,
      maxRetries,
      statusManager
    );
    if (tile) {
      // Store in persistent cache for future use
      await ContextTilePersistenceCache.set(tileKey, tile);
    }

    return tile;
  }
}
