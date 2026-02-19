import { Scene } from '../../3Dviewer/Scene';
import { TerrainObject } from './TerrainObject';
import { TerrainObjectFactory } from './TerrainObjectFactory';
import { TerrainGeometryObjectManager } from './geometry/TerrainGeometryObjectManager';
import type { TerrainTextureObjectManager } from './texture/TerrainTextureObjectManager';
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
  private readonly textureManager: TerrainTextureObjectManager | undefined;
  private readonly factory: TerrainObjectFactory;
  private readonly textureStateMap: Map<TileKey, boolean>;

  constructor(
    scene: Scene,
    geometryManager: TerrainGeometryObjectManager,
    textureManager?: TerrainTextureObjectManager,
    factory?: TerrainObjectFactory
  ) {
    this.scene = scene;
    this.geometryManager = geometryManager;
    this.textureManager = textureManager;
    this.factory = factory ?? new TerrainObjectFactory();
    this.objects = new Map();
    this.textureStateMap = new Map();
  }

  /**
   * Synchronize terrain objects with geometry and textures.
   *
   * This method:
   * 1. Refreshes geometry manager to sync with elevation data
   * 2. Refreshes texture manager to sync with context data
   * 3. Gets current geometry set from geometryManager
   * 4. Removes objects for geometries no longer in geometryManager
   * 5. Creates objects for new geometries (with optional textures)
   * 6. Recreates objects when textures become available for existing tiles
   * 7. Automatically adds/removes objects from the scene
   */
  refresh(): void {
    // First, refresh the geometry manager to sync with elevation data
    this.geometryManager.refresh();

    // Refresh texture manager if available
    if (this.textureManager) {
      this.textureManager.refresh();
    }

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
        this.textureStateMap.delete(key);
      }
    }

    // Add new objects to scene
    for (const key of tilesToAdd) {
      const geometryObject = this.geometryManager.getTerrainGeometryObject(key);
      if (geometryObject) {
        // Get optional texture for this tile
        const textureObject = this.textureManager?.getTerrainTextureObject(key);

        const terrainObject = this.factory.createTerrainObject(
          geometryObject,
          textureObject
        );
        this.objects.set(key, terrainObject);
        this.scene.add(terrainObject.getMesh());
        // Track whether this tile has a texture
        this.textureStateMap.set(
          key,
          textureObject !== null && textureObject !== undefined
        );
      }
    }

    // Check for texture upgrades on existing objects
    // If a tile was created without texture but now has one, recreate it
    if (this.textureManager) {
      for (const key of managedTileKeys) {
        if (!tilesToRemove.includes(key) && !tilesToAdd.includes(key)) {
          const hadTexture = this.textureStateMap.get(key) ?? false;
          const textureObject =
            this.textureManager.getTerrainTextureObject(key);
          const hasTexture =
            textureObject !== null && textureObject !== undefined;

          // Recreate object if texture became available
          if (!hadTexture && hasTexture) {
            const geometryObject =
              this.geometryManager.getTerrainGeometryObject(key);
            const terrainObject = this.objects.get(key);

            if (geometryObject && terrainObject) {
              // Remove old mesh from scene and dispose it
              this.scene.remove(terrainObject.getMesh());
              terrainObject.dispose();

              // Create new object with the newly available texture
              const newTerrainObject = this.factory.createTerrainObject(
                geometryObject,
                textureObject
              );
              this.objects.set(key, newTerrainObject);
              this.scene.add(newTerrainObject.getMesh());

              // Update texture state
              this.textureStateMap.set(key, true);
            }
          }
        }
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
    this.textureStateMap.clear();
  }
}
