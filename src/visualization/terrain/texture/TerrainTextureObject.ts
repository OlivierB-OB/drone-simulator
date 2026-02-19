import * as THREE from 'three';
import type { TileKey } from '../geometry/types';
import type { MercatorBounds } from '../../../gis/types';

/**
 * Container for a terrain tile's texture.
 * Wraps a Three.js Texture with metadata about which tile it belongs to.
 *
 * Similar to TerrainGeometryObject, this is a lightweight data container
 * that owns the texture resource and handles its lifecycle.
 */
export class TerrainTextureObject {
  constructor(
    private readonly tileKey: TileKey,
    private readonly texture: THREE.Texture,
    private readonly mercatorBounds: MercatorBounds
  ) {}

  /**
   * Get the tile identifier ("z:x:y" format)
   */
  getTileKey(): TileKey {
    return this.tileKey;
  }

  /**
   * Get the Three.js texture object
   */
  getTexture(): THREE.Texture {
    return this.texture;
  }

  /**
   * Get the Mercator coordinate bounds for this tile
   */
  getMercatorBounds(): MercatorBounds {
    return this.mercatorBounds;
  }

  /**
   * Clean up texture resource
   */
  dispose(): void {
    this.texture.dispose();
  }
}
