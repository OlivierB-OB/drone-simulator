import { ContextDataManager } from '../../../data/contextual/ContextDataManager';
import type { ContextDataTile } from '../../../data/contextual/types';
import {
  ContextGeometryObject,
  type ContextGeometry,
} from './ContextGeometryObject';
import { ContextGeometryFactory } from './ContextGeometryFactory';
import type { TileKey } from '../../terrain/geometry/types';

/**
 * Manages a collection of ContextGeometryObject instances that contain OSM feature geometries.
 * Synchronizes geometry with the tiles loaded in ContextDataManager.
 * Does not manage scene or material creation.
 */
export class ContextGeometryObjectManager {
  private readonly objects: Map<TileKey, ContextGeometryObject>;
  private readonly factory: ContextGeometryFactory;
  private readonly contextDataManager: ContextDataManager;

  constructor(
    contextDataManager: ContextDataManager,
    factory?: ContextGeometryFactory
  ) {
    this.objects = new Map();
    this.factory = factory ?? new ContextGeometryFactory();
    this.contextDataManager = contextDataManager;
  }

  /**
   * Synchronize context geometry with tiles in ContextDataManager.
   *
   * This method:
   * 1. Gets current tile set from contextDataManager
   * 2. Removes geometry for tiles no longer in contextDataManager
   * 3. Creates geometry for new tiles in contextDataManager
   *
   * Note: Does not create meshes or modify the scene.
   */
  refresh(): void {
    // Get current tiles from context data manager
    const currentTiles = this.contextDataManager.getTileCache();
    const currentTileKeys = new Set(currentTiles.keys());
    const managedTileKeys = new Set(this.objects.keys());

    // Find tiles to remove (in managed but not in current)
    const tilesToRemove: TileKey[] = [];
    for (const key of managedTileKeys) {
      if (!currentTileKeys.has(key)) {
        tilesToRemove.push(key);
      }
    }

    // Find tiles to add (in current but not in managed)
    const tilesToAdd: TileKey[] = [];
    for (const key of currentTileKeys) {
      if (!managedTileKeys.has(key)) {
        tilesToAdd.push(key);
      }
    }

    // Remove old geometry
    for (const key of tilesToRemove) {
      const contextGeometry = this.objects.get(key);
      if (contextGeometry) {
        contextGeometry.dispose();
        this.objects.delete(key);
      }
    }

    // Add new geometry
    for (const key of tilesToAdd) {
      const tile = currentTiles.get(key);
      if (tile) {
        const geometries = this.createGeometriesFromTile(tile);
        const contextGeometryObject = new ContextGeometryObject(
          key,
          geometries,
          tile.mercatorBounds
        );
        this.objects.set(key, contextGeometryObject);
      }
    }
  }

  /**
   * Get a context geometry object by its tile key
   */
  getContextGeometryObject(
    tileKey: TileKey
  ): ContextGeometryObject | undefined {
    return this.objects.get(tileKey);
  }

  /**
   * Get all managed context geometry objects
   */
  getAllGeometries(): ContextGeometryObject[] {
    return Array.from(this.objects.values());
  }

  /**
   * Clean up all geometries and clear the collection
   */
  dispose(): void {
    for (const contextGeometry of this.objects.values()) {
      contextGeometry.dispose();
    }
    this.objects.clear();
  }

  /**
   * Create geometries from a context data tile
   * Processes all feature types (buildings, roads, railways, water, vegetation, airports)
   */
  private createGeometriesFromTile(tile: ContextDataTile): ContextGeometry[] {
    const geometries: ContextGeometry[] = [];
    const { features, mercatorBounds } = tile;

    // Process buildings (Polygon or Point)
    for (const building of features.buildings) {
      if (building.geometry.type === 'Polygon') {
        const geometry = this.factory.createPolygonGeometry(
          building.geometry,
          mercatorBounds
        );
        geometries.push({
          type: 'building',
          geometry,
          color: building.color,
          id: building.id,
        });
      }
    }

    // Process roads (LineString only)
    for (const road of features.roads) {
      if (road.geometry.type === 'LineString') {
        const geometry = this.factory.createLineStringGeometry(
          road.geometry,
          mercatorBounds,
          road
        );
        geometries.push({
          type: 'road',
          geometry,
          color: road.color,
          id: road.id,
        });
      }
    }

    // Process railways (LineString only)
    for (const railway of features.railways) {
      if (railway.geometry.type === 'LineString') {
        const geometry = this.factory.createLineStringGeometry(
          railway.geometry,
          mercatorBounds,
          railway
        );
        geometries.push({
          type: 'railway',
          geometry,
          color: railway.color,
          id: railway.id,
        });
      }
    }

    // Process water (LineString or Polygon)
    for (const water of features.waters) {
      let geometry;
      if (water.geometry.type === 'LineString') {
        geometry = this.factory.createLineStringGeometry(
          water.geometry,
          mercatorBounds,
          water
        );
      } else if (water.geometry.type === 'Polygon') {
        geometry = this.factory.createPolygonGeometry(
          water.geometry,
          mercatorBounds
        );
      } else {
        continue;
      }
      geometries.push({
        type: 'water',
        geometry,
        color: water.color,
        id: water.id,
      });
    }

    // Process vegetation (Polygon or LineString)
    for (const veg of features.vegetation) {
      let geometry;
      if (veg.geometry.type === 'Polygon') {
        geometry = this.factory.createPolygonGeometry(
          veg.geometry,
          mercatorBounds
        );
      } else if (veg.geometry.type === 'LineString') {
        geometry = this.factory.createLineStringGeometry(
          veg.geometry,
          mercatorBounds,
          veg
        );
      } else {
        continue;
      }
      geometries.push({
        type: 'vegetation',
        geometry,
        color: veg.color,
        id: veg.id,
      });
    }

    // Process airports (Point, Polygon, or LineString)
    for (const airport of features.airports) {
      let geometry;
      if (airport.geometry.type === 'Polygon') {
        geometry = this.factory.createPolygonGeometry(
          airport.geometry,
          mercatorBounds
        );
      } else if (airport.geometry.type === 'LineString') {
        geometry = this.factory.createLineStringGeometry(
          airport.geometry,
          mercatorBounds,
          airport
        );
      } else {
        continue; // Skip Point geometries
      }
      geometries.push({
        type: 'airport',
        geometry,
        color: airport.color,
        id: airport.id,
      });
    }

    return geometries;
  }
}
