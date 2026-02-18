import { Mesh, MeshPhongMaterial, MeshBasicMaterial } from 'three';
import { debugConfig } from '../../config';
import type { ContextGeometry } from './geometry/ContextGeometryObject';

/**
 * Factory for creating Three.js Mesh instances from context geometries.
 * Creates Mesh with MeshPhongMaterial for each geometry, using the feature's color.
 */
export class ContextObjectFactory {
  constructor(
    private readonly meshConstructor: typeof Mesh = Mesh,
    private readonly materialConstructor: typeof MeshPhongMaterial = MeshPhongMaterial
  ) {}

  /**
   * Create a Mesh from a context geometry.
   * Uses the feature's color and applies appropriate material properties.
   */
  createMesh(contextGeometry: ContextGeometry): Mesh {
    // Parse hex color string to Three.js color value
    const colorValue = parseInt(contextGeometry.color.replace('#', ''), 16);

    const material = debugConfig.useSimpleTerrainMaterial
      ? new MeshBasicMaterial({
          color: colorValue,
          wireframe: true,
        })
      : new this.materialConstructor({
          color: colorValue,
          specular: 0x555555,
          shininess: 50,
          flatShading: false,
        });

    const mesh = new this.meshConstructor(contextGeometry.geometry, material);

    // Store feature type and ID for debugging/identification
    (mesh as Record<string, unknown>).__featureType = contextGeometry.type;
    (mesh as Record<string, unknown>).__featureId = contextGeometry.id;

    return mesh;
  }
}
