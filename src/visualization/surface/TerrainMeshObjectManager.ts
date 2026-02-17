import { ElevationDataManager } from '../../data/elevation/ElevationDataManager';
import { TerrainMeshObject } from './TerrainMeshObject';
import { TerrainMeshFactory } from './TerrainMeshFactory';
import type { TileKey } from './types';

/**
 * Manages a collection of TerrainMeshObject instances that contain elevation tile geometry.
 * Synchronizes geometry with the tiles loaded in ElevationDataManager.
 * Does not manage scene or material creation.
 */
export class TerrainMeshObjectManager {
  private readonly objects: Map<TileKey, TerrainMeshObject>;
  private readonly factory: TerrainMeshFactory;

  constructor(factory?: TerrainMeshFactory) {
    this.objects = new Map();
    this.factory = factory ?? new TerrainMeshFactory();
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
   *
   * @param elevationDataManager - The elevation data manager containing loaded tiles
   */
  refresh(elevationDataManager: ElevationDataManager): void {
    // Get current tiles from elevation data manager
    const currentTiles = elevationDataManager.getTileCache();
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
      const terrainMesh = this.objects.get(key);
      if (terrainMesh) {
        terrainMesh.dispose();
        this.objects.delete(key);
      }
    }

    // Add new geometry
    for (const key of tilesToAdd) {
      const tile = currentTiles.get(key);
      if (tile) {
        const geometry = this.factory.createGeometry(tile);
        const terrainMesh = new TerrainMeshObject(key, geometry);
        this.objects.set(key, terrainMesh);
      }
    }
  }

  /**
   * Get a terrain mesh object by its tile key
   *
   * @param tileKey - Tile identifier in "z:x:y" format
   * @returns The TerrainMeshObject if found, undefined otherwise
   */
  getTerrainMeshObject(tileKey: TileKey): TerrainMeshObject | undefined {
    return this.objects.get(tileKey);
  }

  /**
   * Get all managed terrain mesh objects
   *
   * @returns Array of all TerrainMeshObject instances
   */
  getAllMeshes(): TerrainMeshObject[] {
    return Array.from(this.objects.values());
  }

  /**
   * Clean up all meshes and clear the collection
   */
  dispose(): void {
    for (const terrainMesh of this.objects.values()) {
      terrainMesh.dispose();
    }
    this.objects.clear();
  }
}
