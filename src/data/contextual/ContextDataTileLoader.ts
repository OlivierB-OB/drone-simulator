import type {
  ContextDataTile,
  Building,
  Road,
  Railway,
  Water,
  Airport,
  Vegetation,
  LandUseArea,
  Point,
  LineString,
} from './types';
import type { TileCoordinates, MercatorBounds } from '../elevation/types';
import type { MercatorCoordinates } from '../../gis/types';

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
    return `[bbox:${bbox}];
(
  node["building"];
  way["building"];
  relation["building"];
  way["highway"];
  way["railway"];
  way["waterway"];
  node["waterway"];
  way["natural"="water"];
  relation["natural"="water"];
  way["water"~"lake|pond|reservoir"];
  way["natural"="wetland"];
  way["natural"="coastline"];
  way["landuse"="water"];
  relation["landuse"="water"];
  node["aeroway"="aerodrome"];
  way["aeroway"="aerodrome"];
  relation["aeroway"="aerodrome"];
  way["natural"~"forest|wood|scrub|grass|heath"];
  node["natural"~"tree|trees"];
  way["landuse"~"residential|industrial|agricultural|grass|sand|commercial"];
);
out geom;`;
  }

  /**
   * Loads a context data tile from the Overpass API.
   * Parses the OSM response and groups features by type.
   *
   * @param coordinates - Tile coordinates to load
   * @param endpoint - Overpass API endpoint
   * @param timeout - Query timeout in milliseconds
   * @returns Loaded context tile
   * @throws Error if tile cannot be loaded or parsed
   */
  static async loadTile(
    coordinates: TileCoordinates,
    endpoint: string,
    timeout: number
  ): Promise<ContextDataTile> {
    const bounds = this.getTileMercatorBounds(coordinates);
    const query = this.generateOverpassQuery(bounds);

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
          throw new Error(
            `Overpass API rate limited (429): ${response.statusText}`
          );
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
      landUse: [],
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
   * Processes a way element from OSM data.
   */
  private static processWay(
    element: Record<string, unknown>,
    nodeMap: Map<number, { lat: number; lng: number }>,
    bounds: MercatorBounds,
    zoomLevel: number,
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

    const lineGeometry: LineString = {
      type: 'LineString',
      coordinates,
    };

    // Classify feature by tags
    if (tags.building) {
      const building: Building = {
        id,
        geometry: lineGeometry,
        tags,
        name: tags.name,
        type: tags['building:type'] || tags.building,
        height: tags.height ? parseFloat(tags.height) : undefined,
        levels: tags['building:levels']
          ? parseInt(tags['building:levels'], 10)
          : undefined,
      };
      features.buildings.push(building);
    } else if (tags.highway) {
      const road: Road = {
        id,
        geometry: lineGeometry,
        tags,
        name: tags.name,
        type: tags.highway,
        maxSpeed: tags.maxspeed ? parseInt(tags.maxspeed, 10) : undefined,
        oneWay: tags.oneway === 'yes',
      };
      features.roads.push(road);
    } else if (tags.railway) {
      const railway: Railway = {
        id,
        geometry: lineGeometry,
        tags,
        name: tags.name,
        type: tags.railway,
        gauge: tags.gauge,
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
      // Detect if this is a closed water area (lake, pond, etc.)
      const firstCoord = coordinates[0];
      const lastCoord = coordinates[coordinates.length - 1];
      const isClosed =
        coordinates.length >= 2 &&
        firstCoord &&
        lastCoord &&
        firstCoord[0] === lastCoord[0] &&
        firstCoord[1] === lastCoord[1];

      // Determine water type from tags
      const waterType =
        tags.waterway ||
        tags.water ||
        tags['natural'] ||
        tags.landuse ||
        'water';

      const water: Water = {
        id,
        geometry: lineGeometry,
        tags,
        name: tags.name,
        type: waterType,
        area: isClosed ? true : undefined,
        isNatural:
          tags['natural'] === 'water'
            ? true
            : tags.landuse === 'water'
              ? false
              : undefined,
      };
      features.waters.push(water);
    } else if (tags.aeroway === 'aerodrome') {
      const airport: Airport = {
        id,
        geometry: lineGeometry,
        tags,
        name: tags.name || 'Unknown Airport',
        iata: tags['iata:code'],
        icao: tags['icao:code'],
        type: tags.aeroway,
      };
      features.airports.push(airport);
    } else if (tags.natural) {
      const vegetation: Vegetation = {
        id,
        geometry: lineGeometry,
        tags,
        name: tags.name,
        type: tags.natural,
        height: tags.height ? parseFloat(tags.height) : undefined,
      };
      features.vegetation.push(vegetation);
    } else if (tags.landuse) {
      const landUse: LandUseArea = {
        id,
        geometry: lineGeometry,
        tags,
        name: tags.name,
        type: tags.landuse,
      };
      features.landUse.push(landUse);
    }
  }

  /**
   * Processes a node element from OSM data.
   */
  private static processNode(
    element: Record<string, unknown>,
    nodeMap: Map<number, { lat: number; lng: number }>,
    bounds: MercatorBounds,
    zoomLevel: number,
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

    // Classify node features
    if (tags.aeroway === 'aerodrome') {
      const airport: Airport = {
        id,
        geometry: pointGeometry,
        tags,
        name: tags.name || 'Unknown Airport',
        iata: tags['iata:code'],
        icao: tags['icao:code'],
        type: tags.aeroway,
      };
      features.airports.push(airport);
    } else if (tags['natural'] === 'tree') {
      const vegetation: Vegetation = {
        id,
        geometry: pointGeometry,
        tags,
        name: tags.name,
        type: 'tree',
        height: tags.height ? parseFloat(tags.height) : undefined,
      };
      features.vegetation.push(vegetation);
    } else if (tags.building) {
      const building: Building = {
        id,
        geometry: pointGeometry,
        tags,
        name: tags.name,
        type: tags['building:type'] || tags.building,
        height: tags.height ? parseFloat(tags.height) : undefined,
        levels: tags['building:levels']
          ? parseInt(tags['building:levels'], 10)
          : undefined,
      };
      features.buildings.push(building);
    }
  }

  /**
   * Processes a relation element from OSM data.
   */
  private static processRelation(
    element: Record<string, unknown>,
    nodeMap: Map<number, { lat: number; lng: number }>,
    bounds: MercatorBounds,
    zoomLevel: number,
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

    // Classify based on tags
    if (tags.building) {
      const building: Building = {
        id,
        geometry: {
          type: 'Polygon',
          coordinates: [coordinates],
        },
        tags,
        name: tags.name,
        type: tags['building:type'] || tags.building,
        height: tags.height ? parseFloat(tags.height) : undefined,
        levels: tags['building:levels']
          ? parseInt(tags['building:levels'], 10)
          : undefined,
      };
      features.buildings.push(building);
    } else if (tags.aeroway === 'aerodrome') {
      const airport: Airport = {
        id,
        geometry: {
          type: 'Polygon',
          coordinates: [coordinates],
        },
        tags,
        name: tags.name || 'Unknown Airport',
        iata: tags['iata:code'],
        icao: tags['icao:code'],
        type: tags.aeroway,
      };
      features.airports.push(airport);
    } else if (
      tags['natural'] === 'water' ||
      tags['natural'] === 'wetland' ||
      tags.landuse === 'water'
    ) {
      // Water multipolygons (lakes, ponds, reservoirs, wetlands)
      const waterType = tags['natural'] || tags.landuse || 'water';
      const water: Water = {
        id,
        geometry: {
          type: 'Polygon',
          coordinates: [coordinates],
        },
        tags,
        name: tags.name,
        type: waterType,
        area: true, // Relations are always areal
        isNatural:
          tags['natural'] === 'water'
            ? true
            : tags.landuse === 'water'
              ? false
              : undefined,
      };
      features.waters.push(water);
    } else if (tags.landuse) {
      const landUse: LandUseArea = {
        id,
        geometry: {
          type: 'Polygon',
          coordinates: [coordinates],
        },
        tags,
        name: tags.name,
        type: tags.landuse,
      };
      features.landUse.push(landUse);
    } else if (tags.natural) {
      const vegetation: Vegetation = {
        id,
        geometry: {
          type: 'Polygon',
          coordinates: [coordinates],
        },
        tags,
        name: tags.name,
        type: tags.natural,
        height: tags.height ? parseFloat(tags.height) : undefined,
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
   * Returns null if all retry attempts fail.
   *
   * @param coordinates - Tile coordinates to load
   * @param endpoint - Overpass API endpoint
   * @param timeout - Query timeout in milliseconds
   * @param maxRetries - Maximum retry attempts (default: 3)
   * @returns Loaded tile or null if loading failed
   */
  static async loadTileWithRetry(
    coordinates: TileCoordinates,
    endpoint: string,
    timeout: number,
    maxRetries: number = 3
  ): Promise<ContextDataTile | null> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await this.loadTile(coordinates, endpoint, timeout);
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
      `Failed to load context tile ${coordinates.z}/${coordinates.x}/${coordinates.y}: ${lastError?.message}`
    );
    return null;
  }
}
