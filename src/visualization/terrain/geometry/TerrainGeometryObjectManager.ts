import { ElevationDataManager } from '../../../data/elevation/ElevationDataManager';
import { TerrainGeometryObject } from './TerrainGeometryObject';
import { TerrainGeometryFactory } from './TerrainGeometryFactory';
import type { TileKey } from './types';

/**
 * Manages a collection of TerrainGeometryObject instances that contain elevation tile geometry.
 * Synchronizes geometry with the tiles loaded in ElevationDataManager.
 * Does not manage scene or material creation.
 */
export class TerrainGeometryObjectManager {
  private readonly objects: Map<TileKey, TerrainGeometryObject>;
  private readonly factory: TerrainGeometryFactory;
  private readonly elevationDataManager: ElevationDataManager;

  constructor(
    elevationDataManager: ElevationDataManager,
    factory?: TerrainGeometryFactory
  ) {
    this.objects = new Map();
    this.factory = factory ?? new TerrainGeometryFactory();
    this.elevationDataManager = elevationDataManager;
  }

  /**
   * Synchronize terrain geometry with tiles in ElevationDataManager.
   *
   * This method:
   * 1. Gets current tile set from elevationDataManager
   * 2. Removes geometry for tiles no longer in elevationDataManager
   * 3. Creates geometry for new tiles in elevationDataManager
   *
   * Note: Does not create meshes or modify the scene. The caller is responsible
   * for combining geometry with material and adding to the scene.
   */
  refresh(): void {
    // Get current tiles from elevation data manager
    const currentTiles = this.elevationDataManager.getTileCache();
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
      const terrainGeometry = this.objects.get(key);
      if (terrainGeometry) {
        terrainGeometry.dispose();
        this.objects.delete(key);
      }
    }

    // Add new geometry
    for (const key of tilesToAdd) {
      const tile = currentTiles.get(key);
      if (tile) {
        const geometry = this.factory.createGeometry(tile);
        const terrainGeometry = new TerrainGeometryObject(
          key,
          geometry,
          tile.mercatorBounds
        );
        this.objects.set(key, terrainGeometry);
      }
    }
  }

  /**
   * Get a terrain geometry object by its tile key
   *
   * @param tileKey - Tile identifier in "z:x:y" format
   * @returns The TerrainGeometryObject if found, undefined otherwise
   */
  getTerrainGeometryObject(
    tileKey: TileKey
  ): TerrainGeometryObject | undefined {
    return this.objects.get(tileKey);
  }

  /**
   * Get all managed terrain geometry objects
   *
   * @returns Array of all TerrainGeometryObject instances
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
