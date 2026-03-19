import type { VectorTileLayer } from '@mapbox/vector-tile';
import type { DecodedTile } from './PMTilesReader';
import type { MercatorBounds, TileCoordinates } from '../../elevation/types';
import type { ModulesFeatures } from '../../../features/registrationTypes';
import { mvtToMercatorGeometry } from './mvtGeometry';
import { classifyOvertureBuilding } from '../../../features/building/overtureClassify';
import { classifyOvertureRoad } from '../../../features/road/overtureClassify';
import { classifyOvertureRailway } from '../../../features/railway/overtureClassify';
import { classifyOvertureWater } from '../../../features/water/overtureClassify';
import { classifyOvertureAeroway } from '../../../features/aeroway/overtureClassify';
import { classifyOvertureLanduse } from '../../../features/landuse/overtureClassify';
import { classifyOvertureVegetation } from '../../../features/vegetation/overtureClassify';
import { featureRegistry } from '../../../features/registry';
import '../../../features/registration';
import type { LineString, Polygon } from 'geojson';

const RAIL_CLASSES = new Set([
  'rail',
  'narrow_gauge',
  'light_rail',
  'tram',
  'metro',
  'monorail',
  'funicular',
  'disused',
  'abandoned',
]);

/**
 * Parses decoded MVT layers from Overture Maps PMTiles into ModulesFeatures.
 * Routes each MVT layer to the appropriate classify function by layer name.
 */
export class OvertureParser {
  static parse(
    layers: DecodedTile,
    bounds: MercatorBounds,
    _coordinates: TileCoordinates
  ): ModulesFeatures {
    const features = featureRegistry.modulesFeaturesFactory();

    for (const [layerName, layer] of layers) {
      this.processLayer(layerName, layer, bounds, features);
    }

    featureRegistry.runPostProcessing(features);
    return features;
  }

  private static processLayer(
    layerName: string,
    layer: VectorTileLayer,
    bounds: MercatorBounds,
    features: ModulesFeatures
  ): void {
    switch (layerName) {
      case 'building':
        this.processBuildings(layer, bounds, features, false);
        break;
      case 'building_part':
        this.processBuildings(layer, bounds, features, true);
        break;
      case 'segment':
        this.processTransportSegments(layer, bounds, features);
        break;
      case 'land_use':
        this.processLandUse(layer, bounds, features);
        break;
      case 'land':
        this.processLand(layer, bounds, features);
        break;
      case 'land_cover':
        this.processLandCover(layer, bounds, features);
        break;
      case 'infrastructure':
        this.processInfrastructure(layer, bounds, features);
        break;
      case 'water':
        this.processWater(layer, bounds, features);
        break;
    }
  }

  private static processBuildings(
    layer: VectorTileLayer,
    bounds: MercatorBounds,
    features: ModulesFeatures,
    isPart: boolean
  ): void {
    for (let i = 0; i < layer.length; i++) {
      const f = layer.feature(i);
      const geometry = mvtToMercatorGeometry(f, bounds);
      if (!geometry) continue;
      const props = f.properties;
      const id = String(props.id ?? `building-${i}`);
      features.buildings.push(
        classifyOvertureBuilding(id, props, geometry, isPart)
      );
    }
  }

  private static processTransportSegments(
    layer: VectorTileLayer,
    bounds: MercatorBounds,
    features: ModulesFeatures
  ): void {
    for (let i = 0; i < layer.length; i++) {
      const f = layer.feature(i);
      const geometry = mvtToMercatorGeometry(f, bounds);
      if (!geometry || geometry.type !== 'LineString') continue;
      const props = f.properties;
      const id = String(props.id ?? `segment-${i}`);
      const segClass = (props.class as string) ?? '';

      if (RAIL_CLASSES.has(segClass)) {
        features.railways.push(
          classifyOvertureRailway(id, props, geometry as LineString)
        );
      } else {
        features.roads.push(
          classifyOvertureRoad(id, props, geometry as LineString)
        );
      }
    }
  }

  private static processLandUse(
    layer: VectorTileLayer,
    bounds: MercatorBounds,
    features: ModulesFeatures
  ): void {
    for (let i = 0; i < layer.length; i++) {
      const f = layer.feature(i);
      const geometry = mvtToMercatorGeometry(f, bounds);
      if (!geometry || geometry.type !== 'Polygon') continue;
      const props = f.properties;
      const id = String(props.id ?? `landuse-${i}`);
      features.landuse.push(
        classifyOvertureLanduse(id, props, geometry as Polygon)
      );
    }
  }

  private static processLand(
    layer: VectorTileLayer,
    bounds: MercatorBounds,
    features: ModulesFeatures
  ): void {
    for (let i = 0; i < layer.length; i++) {
      const f = layer.feature(i);
      const geometry = mvtToMercatorGeometry(f, bounds);
      if (!geometry) continue;
      const props = f.properties;
      const id = String(props.id ?? `land-${i}`);
      const subtype = props.subtype as string | undefined;

      // Route by subtype: vegetation-like subtypes go to vegetation, rest to landuse
      if (
        subtype === 'forest' ||
        subtype === 'wood' ||
        subtype === 'scrub' ||
        subtype === 'heath'
      ) {
        features.vegetation.push(
          classifyOvertureVegetation(id, props, geometry)
        );
      } else if (geometry.type === 'Polygon') {
        features.landuse.push(
          classifyOvertureLanduse(id, props, geometry as Polygon)
        );
      }
    }
  }

  private static processLandCover(
    layer: VectorTileLayer,
    bounds: MercatorBounds,
    features: ModulesFeatures
  ): void {
    for (let i = 0; i < layer.length; i++) {
      const f = layer.feature(i);
      const geometry = mvtToMercatorGeometry(f, bounds);
      if (!geometry) continue;
      const props = f.properties;
      const id = String(props.id ?? `landcover-${i}`);
      features.vegetation.push(classifyOvertureVegetation(id, props, geometry));
    }
  }

  private static processInfrastructure(
    layer: VectorTileLayer,
    bounds: MercatorBounds,
    features: ModulesFeatures
  ): void {
    for (let i = 0; i < layer.length; i++) {
      const f = layer.feature(i);
      const geometry = mvtToMercatorGeometry(f, bounds);
      if (!geometry) continue;
      const props = f.properties;
      const id = String(props.id ?? `infra-${i}`);
      const infraClass = (props.class as string) ?? '';

      // Only aeroway-related infrastructure
      if (
        infraClass === 'aerodrome' ||
        infraClass === 'runway' ||
        infraClass === 'taxiway' ||
        infraClass === 'taxilane' ||
        infraClass === 'apron' ||
        infraClass === 'helipad'
      ) {
        features.airports.push(classifyOvertureAeroway(id, props, geometry));
      }
    }
  }

  private static processWater(
    layer: VectorTileLayer,
    bounds: MercatorBounds,
    features: ModulesFeatures
  ): void {
    for (let i = 0; i < layer.length; i++) {
      const f = layer.feature(i);
      const geometry = mvtToMercatorGeometry(f, bounds);
      if (!geometry) continue;
      if (geometry.type !== 'Polygon' && geometry.type !== 'LineString')
        continue;
      const props = f.properties;
      const id = String(props.id ?? `water-${i}`);
      features.waters.push(
        classifyOvertureWater(id, props, geometry as Polygon | LineString)
      );
    }
  }
}
