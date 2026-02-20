import type { ElevationDataTile } from '../../../data/elevation/types';
import { TerrainGeometryObject } from './TerrainGeometryObject';
import { TerrainGeometryFactory } from './TerrainGeometryFactory';
import type { TileKey } from './types';

/**
 * Manages a collection of TerrainGeometryObject instances that contain elevation tile geometry.
 * Creates and removes geometry on demand via targeted methods.
 * Does not manage scene or material creation.
 */
export class TerrainGeometryObjectManager {
  private readonly objects: Map<TileKey, TerrainGeometryObject>;
  private readonly factory: TerrainGeometryFactory;

  constructor(factory?: TerrainGeometryFactory) {
    this.objects = new Map();
    this.factory = factory ?? new TerrainGeometryFactory();
  }

  /**
   * Creates geometry for a specific elevation tile and stores it.
   */
  createGeometry(key: TileKey, tile: ElevationDataTile): TerrainGeometryObject {
    const geometry = this.factory.createGeometry(tile);
    const terrainGeometry = new TerrainGeometryObject(
      key,
      geometry,
      tile.mercatorBounds
    );
    this.objects.set(key, terrainGeometry);
    return terrainGeometry;
  }

  /**
   * Removes and disposes geometry for a specific tile.
   */
  removeGeometry(key: TileKey): void {
    const terrainGeometry = this.objects.get(key);
    if (terrainGeometry) {
      terrainGeometry.dispose();
      this.objects.delete(key);
    }
  }

  /**
   * Get a terrain geometry object by its tile key
   */
  getTerrainGeometryObject(
    tileKey: TileKey
  ): TerrainGeometryObject | undefined {
    return this.objects.get(tileKey);
  }

  /**
   * Get all managed terrain geometry objects
   */
  getAllGeometries(): TerrainGeometryObject[] {
    return Array.from(this.objects.values());
  }

  /**
   * Clean up all geometries and clear the collection
   */
  dispose(): void {
    for (const terrainGeometry of this.objects.values()) {
      terrainGeometry.dispose();
    }
    this.objects.clear();
  }
}
