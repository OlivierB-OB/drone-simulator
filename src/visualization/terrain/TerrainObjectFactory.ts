import { Mesh, MeshPhongMaterial } from 'three';
import { TerrainObject } from './TerrainObject';
import { TerrainGeometryObject } from './geometry/TerrainGeometryObject';

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
   * Create a TerrainObject from a TerrainGeometryObject.
   * Creates a new mesh with a MeshPhongMaterial and wraps it in a TerrainObject.
   */
  createTerrainObject(geometryObject: TerrainGeometryObject): TerrainObject {
    const material = new this.materialConstructor({
      color: 0x2d5016,
      specular: 0x101010,
      shininess: 100,
      flatShading: false,
    });

    const mesh = new this.meshConstructor(
      geometryObject.getGeometry(),
      material
    );
    return new TerrainObject(geometryObject.getTileKey(), mesh);
  }
}
