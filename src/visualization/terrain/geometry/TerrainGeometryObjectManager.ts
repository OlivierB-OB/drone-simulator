import type { ElevationDataTile } from '../../../data/elevation/types';
import type { ElevationDataManager } from '../../../data/elevation/ElevationDataManager';
import { TerrainGeometryObject } from './TerrainGeometryObject';
import { TerrainGeometryFactory } from './TerrainGeometryFactory';
import { TypedEventEmitter } from '../../../core/TypedEventEmitter';
import type { TileKey } from './types';

export type TerrainGeometryObjectManagerEvents = {
  geometryAdded: { key: TileKey; geometry: TerrainGeometryObject };
  geometryRemoved: { key: TileKey };
};

/**
 * Manages a collection of TerrainGeometryObject instances that contain elevation tile geometry.
 * Listens to elevation data tile events and emits geometry events.
 */
export class TerrainGeometryObjectManager extends TypedEventEmitter<TerrainGeometryObjectManagerEvents> {
  private readonly objects = new Map<TileKey, TerrainGeometryObject>();
  private onElevationTileAdded = ({
    key,
    tile,
  }: {
    key: string;
    tile: ElevationDataTile;
  }) => {
    const geometry = this.createGeometry(key as TileKey, tile);
    this.emit('geometryAdded', { key: key as TileKey, geometry });
  };
  private onElevationTileRemoved = ({ key }: { key: string }) => {
    this.removeGeometry(key as TileKey);
    this.emit('geometryRemoved', { key: key as TileKey });
  };

  constructor(
    private readonly elevationData: ElevationDataManager,
    private readonly factory: TerrainGeometryFactory = new TerrainGeometryFactory()
  ) {
    super();
    this.elevationData.on('tileAdded', this.onElevationTileAdded);
    this.elevationData.on('tileRemoved', this.onElevationTileRemoved);
  }

  /**
   * Creates geometry for a specific elevation tile and stores it.
   */
  createGeometry(key: TileKey, tile: ElevationDataTile): TerrainGeometryObject {
    const geometry = this.factory.createGeometry(tile);
    const terrainGeometry = new TerrainGeometryObject(
      key,
      geometry,
      tile.mercatorBounds
    );
    this.objects.set(key, terrainGeometry);
    return terrainGeometry;
  }

  /**
   * Removes and disposes geometry for a specific tile.
   */
  removeGeometry(key: TileKey): void {
    const terrainGeometry = this.objects.get(key);
    if (terrainGeometry) {
      terrainGeometry.dispose();
      this.objects.delete(key);
    }
  }

  /**
   * Get a terrain geometry object by its tile key
   */
  getTerrainGeometryObject(
    tileKey: TileKey
  ): TerrainGeometryObject | undefined {
    return this.objects.get(tileKey);
  }

  /**
   * Clean up all geometries and clear the collection
   */
  dispose(): void {
    this.elevationData.off('tileAdded', this.onElevationTileAdded);
    this.elevationData.off('tileRemoved', this.onElevationTileRemoved);

    for (const terrainGeometry of this.objects.values()) {
      terrainGeometry.dispose();
    }
    this.objects.clear();
    this.removeAllListeners();
  }
}
