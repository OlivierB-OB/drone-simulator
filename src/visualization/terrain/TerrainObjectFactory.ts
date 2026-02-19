import { Mesh, MeshPhongMaterial, MeshBasicMaterial } from 'three';
import { debugConfig } from '../../config';
import { TerrainObject } from './TerrainObject';
import { TerrainGeometryObject } from './geometry/TerrainGeometryObject';
import type { TerrainTextureObject } from './texture/TerrainTextureObject';

/**
 * Factory for creating TerrainObject instances from TerrainGeometryObject.
 * Creates a Mesh with a new MeshPhongMaterial for each geometry.
 */
export class TerrainObjectFactory {
  constructor(
    private readonly meshConstructor: typeof Mesh = Mesh,
    private readonly materialConstructor: typeof MeshPhongMaterial = MeshPhongMaterial
  ) {}

  /**
   * Create a TerrainObject from a TerrainGeometryObject with optional texture.
   *
   * @param geometryObject - The geometry to create mesh from
   * @param textureObject - Optional texture object; if provided, texture is applied to material
   *
   * Creates a new mesh with a MeshPhongMaterial (or MeshBasicMaterial in debug mode).
   * If texture provided, applies it to the material's map property.
   * Positions the mesh at the tile's Mercator coordinates.
   */
  createTerrainObject(
    geometryObject: TerrainGeometryObject,
    textureObject?: TerrainTextureObject | null
  ): TerrainObject {
    const texture = textureObject?.getTexture();
    const material =
      debugConfig.useSimpleTerrainMaterial || !texture
        ? new MeshBasicMaterial({
            color: 0x111111,
            wireframe: true,
          })
        : new this.materialConstructor({
            map: texture,
          });

    const mesh = new this.meshConstructor(
      geometryObject.getGeometry(),
      material
    );

    // Position mesh at tile center in Mercator space
    // Negate Z-coordinate to match camera coordinate system (Mercator Y → -Z)
    const bounds = geometryObject.getMercatorBounds();
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerZ = (bounds.minY + bounds.maxY) / 2;
    mesh.position.set(centerX, 0, -centerZ);

    return new TerrainObject(geometryObject.getTileKey(), mesh);
  }
}
