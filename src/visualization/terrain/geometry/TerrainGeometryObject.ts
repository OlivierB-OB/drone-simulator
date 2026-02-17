import { BufferGeometry } from 'three';
import type { TileKey } from './types';
import type { MercatorBounds } from '../../../data/elevation/types';

/**
 * Represents a single terrain geometry created from an elevation tile.
 * Holds a reference to the Three.js BufferGeometry and its associated tile identifier.
 */
export class TerrainGeometryObject {
  private readonly geometry: BufferGeometry;
  private readonly tileKey: TileKey;
  private readonly mercatorBounds: MercatorBounds;

  constructor(
    tileKey: TileKey,
    geometry: BufferGeometry,
    mercatorBounds: MercatorBounds
  ) {
    this.tileKey = tileKey;
    this.geometry = geometry;
    this.mercatorBounds = mercatorBounds;
  }

  /**
   * Get the tile identifier (format: "z:x:y")
   */
  getTileKey(): TileKey {
    return this.tileKey;
  }

  /**
   * Get the underlying Three.js BufferGeometry instance
   */
  getGeometry(): BufferGeometry {
    return this.geometry;
  }

  /**
   * Get the Mercator bounds of this terrain tile
   */
  getMercatorBounds(): MercatorBounds {
    return this.mercatorBounds;
  }

  /**
   * Clean up the geometry resources
   */
  dispose(): void {
    this.geometry.dispose();
  }
}
