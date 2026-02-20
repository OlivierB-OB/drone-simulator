import { Mesh } from 'three';
import type { TileKey } from './geometry/types';

/**
 * Represents a single terrain mesh in the 3D scene.
 * Wraps a Three.js Mesh (geometry + material) with its associated tile identifier.
 */
export class TerrainObject {
  constructor(
    private readonly tileKey: TileKey,
    private readonly mesh: Mesh
  ) {}

  /**
   * Get the tile identifier (format: "z:x:y")
   */
  getTileKey(): TileKey {
    return this.tileKey;
  }

  /**
   * Get the underlying Three.js Mesh instance
   */
  getMesh(): Mesh {
    return this.mesh;
  }

  /**
   * Clean up the mesh resources (geometry and material)
   */
  dispose(): void {
    this.mesh.geometry.dispose();
    if (Array.isArray(this.mesh.material)) {
      this.mesh.material.forEach((material) => material.dispose());
    } else {
      this.mesh.material.dispose();
    }
  }
}
