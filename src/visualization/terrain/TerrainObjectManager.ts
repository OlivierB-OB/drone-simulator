import { ElevationDataManager } from '../../data/elevation/ElevationDataManager';
import { Scene } from '../../3Dviewer/Scene';
import { TerrainObject } from './TerrainObject';
import { TerrainObjectFactory } from './TerrainObjectFactory';
import { TerrainGeometryObjectManager } from './geometry/TerrainGeometryObjectManager';
import type { TileKey } from './geometry/types';

/**
 * Manages a collection of TerrainObject instances in the 3D scene.
 * Synchronizes scene objects with the geometry managed by TerrainGeometryObjectManager.
 *
 * This manager:
 * 1. Maintains a Map<TileKey, TerrainObject> of scene objects
 * 2. Automatically adds/removes objects from the Three.js scene
 * 3. Syncs with TerrainGeometryObjectManager via refresh()
 */
export class TerrainObjectManager {
  private readonly objects: Map<TileKey, TerrainObject>;
  private readonly scene: Scene;
  private readonly geometryManager: TerrainGeometryObjectManager;
  private readonly factory: TerrainObjectFactory;

  constructor(
    scene: Scene,
    geometryManager: TerrainGeometryObjectManager,
    factory?: TerrainObjectFactory
  ) {
    this.scene = scene;
    this.geometryManager = geometryManager;
    this.factory = factory ?? new TerrainObjectFactory();
    this.objects = new Map();
  }

  /**
   * Synchronize terrain objects with geometry in TerrainGeometryObjectManager.
   *
   * This method:
   * 1. Gets current geometry set from geometryManager
   * 2. Removes objects for geometries no longer in geometryManager
   * 3. Creates objects for new geometries in geometryManager
   * 4. Automatically adds/removes objects from the scene
   *
   * @param elevationDataManager - The elevation data manager (passed to geometryManager.refresh)
   */
  refresh(elevationDataManager: ElevationDataManager): void {
    // First, refresh the geometry manager to sync with elevation data
    this.geometryManager.refresh(elevationDataManager);

    // Get current geometries from geometry manager
    const currentGeometries = this.geometryManager.getAllGeometries();
    const currentTileKeys = new Set(
      currentGeometries.map((g) => g.getTileKey())
    );
    const managedTileKeys = new Set(this.objects.keys());

    // Find objects to remove (in managed but not in current geometry)
    const tilesToRemove: TileKey[] = [];
    for (const key of managedTileKeys) {
      if (!currentTileKeys.has(key)) {
        tilesToRemove.push(key);
      }
    }

    // Find objects to add (in current geometry but not in managed)
    const tilesToAdd: TileKey[] = [];
    for (const key of currentTileKeys) {
      if (!managedTileKeys.has(key)) {
        tilesToAdd.push(key);
      }
    }

    // Remove old objects from scene
    for (const key of tilesToRemove) {
      const terrainObject = this.objects.get(key);
      if (terrainObject) {
        this.scene.remove(terrainObject.getMesh());
        terrainObject.dispose();
        this.objects.delete(key);
      }
    }

    // Add new objects to scene
    for (const key of tilesToAdd) {
      const geometryObject = this.geometryManager.getTerrainGeometryObject(key);
      if (geometryObject) {
        const terrainObject = this.factory.createTerrainObject(geometryObject);
        this.objects.set(key, terrainObject);
        this.scene.add(terrainObject.getMesh());
      }
    }
  }

  /**
   * Get a terrain object by its tile key
   *
   * @param tileKey - Tile identifier in "z:x:y" format
   * @returns The TerrainObject if found, undefined otherwise
   */
  getTerrainObject(tileKey: TileKey): TerrainObject | undefined {
    return this.objects.get(tileKey);
  }

  /**
   * Get all managed terrain objects
   *
   * @returns Array of all TerrainObject instances
   */
  getAllObjects(): TerrainObject[] {
    return Array.from(this.objects.values());
  }

  /**
   * Clean up all objects, remove from scene, and clear the collection
   */
  dispose(): void {
    for (const terrainObject of this.objects.values()) {
      this.scene.remove(terrainObject.getMesh());
      terrainObject.dispose();
    }
    this.objects.clear();
  }
}
