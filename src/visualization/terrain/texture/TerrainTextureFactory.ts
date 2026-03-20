import * as THREE from 'three';
import type { ContextDataTile } from '../../../data/contextual/types';
import type { TileKey } from '../geometry/types';
import type { TileResource } from '../types';
import { TerrainCanvasRenderer } from './TerrainCanvasRenderer';
import { textureConfig } from '../../../config';

/**
 * Factory for creating terrain textures from context data tiles.
 *
 * This factory:
 * 1. Receives context tile data (buildings, roads, water, vegetation, etc.)
 * 2. Renders the data onto a canvas using TerrainCanvasRenderer
 * 3. Converts the canvas to a Three.js texture
 * 4. Returns a TileResource wrapping the texture with metadata
 *
 * Returns null when context data is unavailable, allowing graceful fallback
 * to solid green material without texture overlay.
 */
export class TerrainTextureFactory {
  constructor(
    private readonly canvasRenderer: TerrainCanvasRenderer = new TerrainCanvasRenderer(),
    private readonly textureConstructor: typeof THREE.CanvasTexture = THREE.CanvasTexture
  ) {}

  /**
   * Create a texture resource from a context data tile.
   *
   * @param contextTile - The context data tile to render, or null if unavailable
   * @param tileKey - The tile identifier ("z:x:y" format)
   * @returns TileResource<THREE.Texture> if tile available, null if tile unavailable
   *
   * When contextTile is null (API pending, failed, or no data), returns null.
   * This signals TerrainObjectFactory to create a mesh with solid green material.
   */
  createTexture(
    contextTile: ContextDataTile | null,
    tileKey: TileKey
  ): TileResource<THREE.Texture> | null {
    // Graceful degradation: no texture overlay if context unavailable
    if (!contextTile) {
      return null;
    }

    // Create offscreen canvas for rendering
    const canvas = document.createElement('canvas');
    canvas.width = textureConfig.groundCanvasSize;
    canvas.height = textureConfig.groundCanvasSize;

    // Render features onto canvas
    this.canvasRenderer.renderTile(canvas, contextTile, contextTile.geoBounds);

    // Create Three.js texture from canvas
    const texture = new this.textureConstructor(canvas);

    // Configure texture properties for terrain rendering
    texture.flipY = false; // Canvas Y=0 is north; V=0 must map to canvas top (no flip)
    texture.magFilter = THREE.NearestFilter; // sharp pixels up close
    texture.minFilter = THREE.LinearMipmapLinearFilter; // smooth at distance
    texture.needsUpdate = true;

    return {
      tileKey,
      resource: texture,
      bounds: contextTile.geoBounds,
      dispose: () => texture.dispose(),
    };
  }
}
