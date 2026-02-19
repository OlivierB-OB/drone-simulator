import type { ElevationDataManager } from '../../../data/elevation/ElevationDataManager';
import type { ContextDataManager } from '../../../data/contextual/ContextDataManager';
import type { TerrainTextureObject } from './TerrainTextureObject';
import { TerrainTextureFactory } from './TerrainTextureFactory';
import type { TileKey } from '../geometry/types';

/**
 * Manages a collection of TerrainTextureObject instances.
 * Synchronizes textures with tiles loaded in both ElevationDataManager and ContextDataManager.
 *
 * This manager:
 * 1. Mirrors the tile set from elevation data (knows which tiles to manage)
 * 2. For each elevation tile, retrieves context data (may be null/pending)
 * 3. Creates textures via factory (returns null if context unavailable)
 * 4. Stores textures for retrieval by TerrainObjectManager
 * 5. Handles lifecycle: disposal when tiles unload
 *
 * Returns null for tiles where context is unavailable, allowing graceful
 * degradation to solid green material without texture overlay.
 */
export class TerrainTextureObjectManager {
  private readonly objects: Map<TileKey, TerrainTextureObject | null>;
  private readonly factory: TerrainTextureFactory;
  private readonly elevationDataManager: ElevationDataManager;
  private readonly contextDataManager: ContextDataManager;

  constructor(
    elevationDataManager: ElevationDataManager,
    contextDataManager: ContextDataManager,
    factory?: TerrainTextureFactory
  ) {
    this.objects = new Map();
    this.elevationDataManager = elevationDataManager;
    this.contextDataManager = contextDataManager;
    this.factory = factory ?? new TerrainTextureFactory(contextDataManager);
  }

  /**
   * Synchronize textures with elevation tiles and context data.
   *
   * This method:
   * 1. Gets current tile set from elevationDataManager (source of truth for which tiles exist)
   * 2. Removes textures for tiles no longer in elevationDataManager
   * 3. Creates textures for new tiles in elevationDataManager
   * 4. For each tile, retrieves context data (may be null) and creates texture
   * 5. Stores null entries for tiles with unavailable context (graceful degradation)
   */
  refresh(): void {
    // Get current tiles from elevation data manager (source of truth)
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

    // Remove old textures from collection
    for (const key of tilesToRemove) {
      const textureObject = this.objects.get(key);
      if (textureObject) {
        textureObject.dispose();
      }
      this.objects.delete(key);
    }

    // Add new textures to collection
    for (const key of tilesToAdd) {
      // Get context tile if available (may be null if API pending/failed)
      const contextTile = this.contextDataManager.getTile(key);

      // Create texture (returns null if context unavailable)
      const textureObject = this.factory.createTexture(contextTile, key);

      // Store result (texture object or null for graceful degradation)
      this.objects.set(key, textureObject);
    }
  }

  /**
   * Get a texture object by its tile key.
   *
   * @param tileKey - Tile identifier in "z:x:y" format
   * @returns TerrainTextureObject if texture created, null if context unavailable,
   *          undefined if tile key not managed
   */
  getTerrainTextureObject(
    tileKey: TileKey
  ): TerrainTextureObject | null | undefined {
    return this.objects.get(tileKey);
  }

  /**
   * Get all managed texture entries (including null entries for unavailable context)
   *
   * @returns Array of TerrainTextureObject or null entries
   */
  getAllTextures(): (TerrainTextureObject | null)[] {
    return Array.from(this.objects.values());
  }

  /**
   * Clean up all textures, dispose resources, and clear the collection
   */
  dispose(): void {
    for (const textureObject of this.objects.values()) {
      if (textureObject) {
        textureObject.dispose();
      }
    }
    this.objects.clear();
  }
}
