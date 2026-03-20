import type { ElevationDataTile } from '../../../data/elevation/types';
import type { ElevationDataManager } from '../../../data/elevation/ElevationDataManager';
import { TerrainGeometryFactory } from './TerrainGeometryFactory';
import { TileObjectManager } from '../../TileObjectManager';
import type { TileKey } from './types';
import type { TileResource } from '../types';
import type { BufferGeometry } from 'three';

export type TerrainGeometryObjectManagerEvents = {
  tileAdded: { key: TileKey; tile: TileResource<BufferGeometry> };
  tileRemoved: { key: TileKey };
};

/**
 * Manages a collection of terrain geometry resources created from elevation tiles.
 * Listens to elevation data tile events and emits geometry events.
 */
export class TerrainGeometryObjectManager extends TileObjectManager<
  ElevationDataTile,
  TileResource<BufferGeometry>,
  TerrainGeometryObjectManagerEvents
> {
  constructor(
    elevationData: ElevationDataManager,
    private readonly factory: TerrainGeometryFactory = new TerrainGeometryFactory()
  ) {
    super(elevationData);
  }

  protected override createObject(
    key: string,
    tile: ElevationDataTile
  ): TileResource<BufferGeometry> {
    const geometry = this.factory.createGeometry(tile);
    return {
      tileKey: key as TileKey,
      resource: geometry,
      bounds: tile.geoBounds,
      dispose: () => geometry.dispose(),
    };
  }

  protected override disposeObject(obj: TileResource<BufferGeometry>): void {
    obj.dispose();
  }

  protected override onObjectAdded(
    key: string,
    obj: TileResource<BufferGeometry>
  ): void {
    this.emit('tileAdded', { key: key as TileKey, tile: obj });
  }

  protected override onObjectRemoved(key: string): void {
    this.emit('tileRemoved', { key: key as TileKey });
  }

  /**
   * Creates geometry for a specific elevation tile and stores it.
   * Does not emit events — event emission happens via the ElevationDataManager event handler.
   */
  createGeometry(
    key: TileKey,
    tile: ElevationDataTile
  ): TileResource<BufferGeometry> {
    const obj = this.createObject(key, tile);
    this.objects.set(key, obj);
    return obj;
  }

  /**
   * Removes and disposes geometry for a specific tile.
   * Does not emit events — event emission happens via the ElevationDataManager event handler.
   */
  removeGeometry(key: TileKey): void {
    const obj = this.objects.get(key);
    if (obj !== undefined) this.disposeObject(obj);
    this.objects.delete(key);
  }

  /**
   * Get a terrain geometry resource by its tile key.
   */
  getTerrainGeometryObject(
    tileKey: TileKey
  ): TileResource<BufferGeometry> | undefined {
    return this.objects.get(tileKey);
  }
}
