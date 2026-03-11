import type { ContextDataTile } from '../../../data/contextual/types';
import type { ContextDataManager } from '../../../data/contextual/ContextDataManager';
import type { TerrainTextureObject } from './TerrainTextureObject';
import { TerrainTextureFactory } from './TerrainTextureFactory';
import { TileObjectManager } from '../../TileObjectManager';
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
export class TerrainTextureObjectManager extends TileObjectManager<
  ContextDataTile,
  TerrainTextureObject | null,
  TerrainTextureObjectManagerEvents
> {
  constructor(
    contextData: ContextDataManager,
    private readonly factory: TerrainTextureFactory = new TerrainTextureFactory()
  ) {
    super(contextData);
  }

  protected override createObject(
    key: string,
    tile: ContextDataTile
  ): TerrainTextureObject | null {
    return this.factory.createTexture(tile, key);
  }

  protected override disposeObject(obj: TerrainTextureObject | null): void {
    obj?.dispose();
  }

  protected override onObjectAdded(
    key: string,
    obj: TerrainTextureObject | null
  ): void {
    this.emit('textureAdded', { key: key as TileKey, texture: obj });
  }

  protected override onObjectRemoved(key: string): void {
    this.emit('textureRemoved', { key: key as TileKey });
  }

  /**
   * Creates a texture for a tile using context data.
   * Returns null if context data is unavailable (graceful degradation).
   * Does not emit events — event emission happens via the ContextDataManager event handler.
   */
  createTexture(
    key: TileKey,
    contextTile: ContextDataTile | null
  ): TerrainTextureObject | null {
    const obj = this.factory.createTexture(contextTile, key);
    this.objects.set(key, obj);
    return obj;
  }

  /**
   * Removes and disposes texture for a specific tile.
   * Does not emit events — event emission happens via the ContextDataManager event handler.
   */
  removeTexture(key: TileKey): void {
    const obj = this.objects.get(key);
    if (obj !== undefined) this.disposeObject(obj);
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
}
