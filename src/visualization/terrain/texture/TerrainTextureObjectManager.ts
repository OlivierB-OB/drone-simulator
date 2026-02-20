import type { ContextDataTile } from '../../../data/contextual/types';
import type { ContextDataManager } from '../../../data/contextual/ContextDataManager';
import type { TerrainTextureObject } from './TerrainTextureObject';
import { TerrainTextureFactory } from './TerrainTextureFactory';
import { TypedEventEmitter } from '../../../core/TypedEventEmitter';
import type { TileKey } from '../geometry/types';

export type TerrainTextureObjectManagerEvents = {
  textureAdded: { key: TileKey; texture: TerrainTextureObject | null };
  textureRemoved: { key: TileKey };
};

/**
 * Manages a collection of TerrainTextureObject instances.
 * Listens to context data tile events and emits texture events.
 *
 * Stores null for tiles where context data is unavailable, allowing
 * graceful degradation to solid material without texture overlay.
 */
export class TerrainTextureObjectManager extends TypedEventEmitter<TerrainTextureObjectManagerEvents> {
  private readonly objects: Map<TileKey, TerrainTextureObject | null>;
  private readonly factory: TerrainTextureFactory;
  private readonly contextData: ContextDataManager;
  private onContextTileAdded:
    | ((data: { key: string; tile: ContextDataTile }) => void)
    | null = null;
  private onContextTileRemoved: ((data: { key: string }) => void) | null = null;

  constructor(
    contextData: ContextDataManager,
    factory?: TerrainTextureFactory
  ) {
    super();
    this.objects = new Map();
    this.contextData = contextData;
    this.factory = factory ?? new TerrainTextureFactory();

    this.onContextTileAdded = ({ key, tile }) => {
      const texture = this.createTexture(key as TileKey, tile);
      this.emit('textureAdded', { key: key as TileKey, texture });
    };

    this.onContextTileRemoved = ({ key }) => {
      this.removeTexture(key as TileKey);
      this.emit('textureRemoved', { key: key as TileKey });
    };

    this.contextData.on('tileAdded', this.onContextTileAdded);
    this.contextData.on('tileRemoved', this.onContextTileRemoved);
  }

  /**
   * Lifecycle hook for additional initialization if needed.
   */
  start(): void {
    // Event subscriptions now happen in constructor
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
    if (
      this.contextData &&
      this.onContextTileAdded &&
      this.onContextTileRemoved
    ) {
      this.contextData.off('tileAdded', this.onContextTileAdded);
      this.contextData.off('tileRemoved', this.onContextTileRemoved);
    }

    for (const textureObject of this.objects.values()) {
      if (textureObject) {
        textureObject.dispose();
      }
    }
    this.objects.clear();
    this.removeAllListeners();
  }
}
