import type { ElevationDataTile } from '../../../data/elevation/types';
import type { ElevationDataManager } from '../../../data/elevation/ElevationDataManager';
import { TerrainGeometryObject } from './TerrainGeometryObject';
import { TerrainGeometryFactory } from './TerrainGeometryFactory';
import { TileObjectManager } from '../../TileObjectManager';
import type { TileKey } from './types';

export type TerrainGeometryObjectManagerEvents = {
  geometryAdded: { key: TileKey; geometry: TerrainGeometryObject };
  geometryRemoved: { key: TileKey };
};

/**
 * Manages a collection of TerrainGeometryObject instances that contain elevation tile geometry.
 * Listens to elevation data tile events and emits geometry events.
 */
export class TerrainGeometryObjectManager extends TileObjectManager<
  ElevationDataTile,
  TerrainGeometryObject,
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
  ): TerrainGeometryObject {
    const geometry = this.factory.createGeometry(tile);
    return new TerrainGeometryObject(
      key as TileKey,
      geometry,
      tile.mercatorBounds
    );
  }

  protected override disposeObject(obj: TerrainGeometryObject): void {
    obj.dispose();
  }

  protected override onObjectAdded(
    key: string,
    obj: TerrainGeometryObject
  ): void {
    this.emit('geometryAdded', { key: key as TileKey, geometry: obj });
  }

  protected override onObjectRemoved(key: string): void {
    this.emit('geometryRemoved', { key: key as TileKey });
  }

  /**
   * Creates geometry for a specific elevation tile and stores it.
   * Does not emit events — event emission happens via the ElevationDataManager event handler.
   */
  createGeometry(key: TileKey, tile: ElevationDataTile): TerrainGeometryObject {
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
   * Get a terrain geometry object by its tile key.
   */
  getTerrainGeometryObject(
    tileKey: TileKey
  ): TerrainGeometryObject | undefined {
    return this.objects.get(tileKey);
  }
}
