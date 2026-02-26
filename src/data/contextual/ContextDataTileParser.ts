import type {
  ContextDataTile,
  BuildingVisual,
  RoadVisual,
  RailwayVisual,
  WaterVisual,
  VegetationVisual,
  AerowayVisual,
  LanduseVisual,
  Point,
  LineString,
  Polygon,
  HexColor,
} from './types';
import type { MercatorBounds } from '../elevation/types';
import {
  colorPalette,
  groundColors,
  roadSpec,
  surfaceColors,
  railwaySpec,
  waterwayWidths,
} from '../../config';

/**
 * Parser for OSM (OpenStreetMap) data tiles.
 * Converts raw Overpass API JSON responses into categorized visual features.
 * Focuses only on rendering-relevant attributes, ignoring non-visual data.
 */
export class ContextDataTileParser {
  private static readonly EARTH_RADIUS = 6378137; // meters
  private static readonly MAX_EXTENT =
    ContextDataTileParser.EARTH_RADIUS * Math.PI;

  private static readonly LANDUSE_TYPES = new Set([
    'grassland',
    'meadow',
    'park',
    'recreation_ground',
    'plant_nursery',
    'farmland',
    'orchard',
    'vineyard',
    'allotments',
    'cemetery',
    'construction',
    'residential',
    'commercial',
    'retail',
    'industrial',
    'military',
    'sand',
    'beach',
    'dune',
    'bare_rock',
    'scree',
    'mud',
    'glacier',
  ]);

  private static readonly NATURAL_LANDUSE_TYPES = new Set([
    'sand',
    'beach',
    'dune',
    'bare_rock',
    'scree',
    'mud',
    'glacier',
    'grassland',
    // fell and tundra are vegetation (groundColors.vegetation.fell/tundra = '#a0a070')
  ]);

  private static readonly AEROWAY_TYPES = new Set([
    'aerodrome',
    'runway',
    'taxiway',
    'taxilane',
    'apron',
    'helipad',
  ]);

  /**
   * Parses OSM JSON response data and groups features by type.
   * Only extracts visual properties; ignores non-rendering attributes.
   *
   * @param osmData - Raw Overpass API JSON response
   * @param bounds - Mercator bounds of the tile
   * @param zoomLevel - Web Mercator zoom level
   * @returns Features grouped by type (buildings, roads, railways, waters, airports, vegetation, landuse)
   */
  static parseOSMData(
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
      landuse: [],
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
   * Gets color for a building type
   */
  private static getColorForBuilding(buildingType: string): HexColor {
    const typeNormalized = buildingType.toLowerCase();
    const colors = colorPalette.buildings as Record<string, HexColor>;
    return (colors[typeNormalized] || colors.default) as HexColor;
  }

  /**
   * Gets pixel width for a road type
   */
  private static getRoadWidthPx(type: string): number {
    return (
      roadSpec[type.toLowerCase()]?.widthPx ?? roadSpec['default']?.widthPx ?? 2
    );
  }

  /**
   * Gets color for a road type
   */
  private static getColorForRoad(roadType: string): HexColor {
    return (
      roadSpec[roadType.toLowerCase()]?.color ??
      roadSpec['default']?.color ??
      '#c8c0b8'
    );
  }

  /**
   * Gets surface-override color if a known surface tag is present
   */
  private static getRoadSurfaceColor(surface?: string): HexColor | undefined {
    if (!surface) return undefined;
    return surfaceColors[surface.toLowerCase()];
  }

  /**
   * Gets railway rendering spec (widthPx, dash, color) for a railway type
   */
  private static getRailwaySpec(type: string): {
    widthPx: number;
    dash: number[];
    color: HexColor;
  } {
    return (
      railwaySpec[type.toLowerCase()] ??
      railwaySpec['default'] ?? { widthPx: 1.5, dash: [3, 2], color: '#888878' }
    );
  }

  /**
   * Gets track count from gauge or defaults to 1
   */
  private static getTrackCount(gauge?: string): number {
    if (!gauge) return 1;
    return 1;
  }

  /**
   * Gets color and width for a water feature
   */
  private static getWaterColorAndWidth(
    waterType: string,
    isArea: boolean
  ): { color: HexColor; widthPx: number } {
    if (waterType === 'wetland') {
      return { color: groundColors.water.wetland, widthPx: 0 };
    }
    if (isArea) {
      return { color: groundColors.water.body, widthPx: 0 };
    }
    const widthPx =
      waterwayWidths[waterType.toLowerCase()] ??
      waterwayWidths['default'] ??
      1.5;
    // dam and weir use concrete/earth color; all others use water line blue
    const waterColors = groundColors.water as Record<
      string,
      string | undefined
    >;
    const color =
      waterColors[waterType.toLowerCase()] ?? groundColors.water.line;
    return { color, widthPx };
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
    const map = groundColors.vegetation as Record<string, string | undefined>;
    return map[typeNormalized] ?? groundColors.vegetation.default;
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

    // Skip underground/tunnel features
    if (
      tags.tunnel === 'yes' ||
      tags.location === 'underground' ||
      (tags.level !== undefined && parseInt(tags.level, 10) < 0)
    ) {
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
      const highwayType = tags.highway.toLowerCase();
      const road: RoadVisual = {
        id,
        geometry: lineGeometry,
        type: tags.highway,
        widthPx: this.getRoadWidthPx(highwayType),
        laneCount: tags.lanes ? parseInt(tags.lanes, 10) : undefined,
        color: this.getColorForRoad(highwayType),
        surfaceColor: this.getRoadSurfaceColor(tags.surface),
      };
      features.roads.push(road);
    } else if (tags.railway) {
      const railwayType = tags.railway.toLowerCase();
      const spec = this.getRailwaySpec(railwayType);
      const railway: RailwayVisual = {
        id,
        geometry: lineGeometry,
        type: railwayType,
        trackCount: this.getTrackCount(tags.gauge),
        widthPx: spec.widthPx,
        dash: spec.dash,
        color: spec.color,
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
      const waterType: string =
        tags.waterway ||
        tags.water ||
        tags['natural'] ||
        tags.landuse ||
        'water';

      const isArea = isClosed;
      const { color, widthPx } = this.getWaterColorAndWidth(waterType, isArea);
      const water: WaterVisual = {
        id,
        geometry: isArea ? polygonGeometry! : lineGeometry,
        type: waterType,
        isArea,
        widthPx,
        color,
      };
      features.waters.push(water);
    } else if (tags.aeroway && this.AEROWAY_TYPES.has(tags.aeroway)) {
      const aerowayType = tags.aeroway;
      const aerowayColors = groundColors.aeroways as Record<
        string,
        string | undefined
      >;
      const aerowayLineWidths: Record<string, number> = {
        runway: 3,
        taxiway: 2,
        taxilane: 1.5,
      };
      const aeroway: AerowayVisual = {
        id,
        geometry: polygonGeometry ?? lineGeometry,
        type: aerowayType,
        color: aerowayColors[aerowayType] ?? groundColors.aeroways.aerodrome,
        widthPx: aerowayLineWidths[aerowayType],
      };
      features.airports.push(aeroway);
    } else if (tags.landuse === 'forest') {
      // §5.4: landuse=forest is vegetation (same color as natural=wood)
      if (!polygonGeometry) return;
      const vegetation: VegetationVisual = {
        id,
        geometry: polygonGeometry,
        type: 'forest',
        height: undefined,
        heightCategory: 'tall',
        color: this.getColorForVegetation('forest'),
      };
      features.vegetation.push(vegetation);
    } else if (
      (tags.landuse && this.LANDUSE_TYPES.has(tags.landuse)) ||
      tags.leisure === 'park'
    ) {
      if (!polygonGeometry) return;
      const luType =
        tags.leisure === 'park' ? 'park' : (tags.landuse ?? 'other');
      const landuseColors = groundColors.landuse as Record<
        string,
        string | undefined
      >;
      const landuse: LanduseVisual = {
        id,
        geometry: polygonGeometry,
        type: luType,
        color: landuseColors[luType] ?? groundColors.default,
      };
      features.landuse.push(landuse);
    } else if (tags.natural && this.NATURAL_LANDUSE_TYPES.has(tags.natural)) {
      // Natural surface types rendered as landuse areas
      if (!polygonGeometry) return;
      const naturalType = tags.natural;
      const landuseColors = groundColors.landuse as Record<
        string,
        string | undefined
      >;
      const landuse: LanduseVisual = {
        id,
        geometry: polygonGeometry,
        type: naturalType,
        color: landuseColors[naturalType] ?? groundColors.default,
      };
      features.landuse.push(landuse);
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
      const airport: AerowayVisual = {
        id,
        geometry: pointGeometry,
        type: 'aerodrome',
        color: groundColors.aeroways.aerodrome,
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
      const airport: AerowayVisual = {
        id,
        geometry: polygonGeometry,
        type: 'aerodrome',
        color: groundColors.aeroways.aerodrome,
      };
      features.airports.push(airport);
    } else if (
      tags['natural'] === 'water' ||
      tags['natural'] === 'wetland' ||
      tags.landuse === 'water'
    ) {
      // Water multipolygons (lakes, ponds, reservoirs, wetlands)
      const waterType: string = tags['natural'] || tags.landuse || 'water';
      const { color, widthPx } = this.getWaterColorAndWidth(waterType, true);
      const water: WaterVisual = {
        id,
        geometry: polygonGeometry,
        type: waterType,
        isArea: true,
        widthPx,
        color,
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
}
