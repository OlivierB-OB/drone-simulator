import * as THREE from 'three';
import type { ContextDataTile } from '../../../data/contextual/types';
import type { TileKey } from '../geometry/types';
import { TerrainTextureObject } from './TerrainTextureObject';
import { TerrainCanvasRenderer } from './TerrainCanvasRenderer';

/**
 * Factory for creating terrain textures from context data tiles.
 *
 * This factory:
 * 1. Receives context tile data (buildings, roads, water, vegetation, etc.)
 * 2. Renders the data onto a canvas using TerrainCanvasRenderer
 * 3. Converts the canvas to a Three.js texture
 * 4. Wraps it in a TerrainTextureObject with metadata
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
   * Create a texture from a context data tile.
   *
   * @param contextTile - The context data tile to render, or null if unavailable
   * @param tileKey - The tile identifier ("z:x:y" format)
   * @returns TerrainTextureObject if tile available, null if tile unavailable
   *
   * When contextTile is null (API pending, failed, or no data), returns null.
   * This signals TerrainObjectFactory to create a mesh with solid green material.
   */
  createTexture(
    contextTile: ContextDataTile | null,
    tileKey: TileKey
  ): TerrainTextureObject | null {
    // Graceful degradation: no texture overlay if context unavailable
    if (!contextTile) {
      return null;
    }

    // Create offscreen canvas for rendering
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;

    // Render features onto canvas
    this.canvasRenderer.renderTile(
      canvas,
      contextTile,
      contextTile.mercatorBounds
    );

    // Create Three.js texture from canvas
    const texture = new this.textureConstructor(canvas);

    // Configure texture properties for terrain rendering
    texture.magFilter = THREE.NearestFilter; // sharp pixels up close
    texture.minFilter = THREE.LinearMipmapLinearFilter; // smooth at distance
    texture.needsUpdate = true;

    // Wrap in TerrainTextureObject with metadata
    return new TerrainTextureObject(
      tileKey,
      texture,
      contextTile.mercatorBounds
    );
  }
}
