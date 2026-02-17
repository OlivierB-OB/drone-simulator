import { BufferGeometry } from 'three';
import type { TileKey } from './types';

/**
 * Represents a single terrain geometry created from an elevation tile.
 * Holds a reference to the Three.js BufferGeometry and its associated tile identifier.
 */
export class TerrainGeometryObject {
  private readonly geometry: BufferGeometry;
  private readonly tileKey: TileKey;

  constructor(tileKey: TileKey, geometry: BufferGeometry) {
    this.tileKey = tileKey;
    this.geometry = geometry;
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
   * Clean up the geometry resources
   */
  dispose(): void {
    this.geometry.dispose();
  }
}
