import type { ContextDataTile } from '../../../data/contextual/types';
import type { TerrainTextureObject } from './TerrainTextureObject';
import { TerrainTextureFactory } from './TerrainTextureFactory';
import type { TileKey } from '../geometry/types';

/**
 * Manages a collection of TerrainTextureObject instances.
 * Creates and removes textures on demand via targeted methods.
 *
 * Stores null for tiles where context data is unavailable, allowing
 * graceful degradation to solid material without texture overlay.
 */
export class TerrainTextureObjectManager {
  private readonly objects: Map<TileKey, TerrainTextureObject | null>;
  private readonly factory: TerrainTextureFactory;

  constructor(factory?: TerrainTextureFactory) {
    this.objects = new Map();
    this.factory = factory ?? new TerrainTextureFactory();
  }

  /**
   * Creates a texture for a tile using context data.
   * Returns null if context data is unavailable (graceful degradation).
   */
  createTexture(
    key: TileKey,
    contextTile: ContextDataTile | null
  ): TerrainTextureObject | null {
    const textureObject = this.factory.createTexture(contextTile, key);
    this.objects.set(key, textureObject);
    return textureObject;
  }

  /**
   * Removes and disposes texture for a specific tile.
   */
  removeTexture(key: TileKey): void {
    const textureObject = this.objects.get(key);
    if (textureObject) {
      textureObject.dispose();
    }
    this.objects.delete(key);
  }

  /**
   * Get a texture object by its tile key.
   */
  getTerrainTextureObject(
    tileKey: TileKey
  ): TerrainTextureObject | null | undefined {
    return this.objects.get(tileKey);
  }

  /**
   * Get all managed texture entries (including null entries for unavailable context)
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
