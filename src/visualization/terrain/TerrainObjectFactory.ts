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
   * Positions the mesh at the tile's Mercator coordinates.
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

    // Position mesh at tile center in Mercator space
    const bounds = geometryObject.getMercatorBounds();
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerZ = (bounds.minY + bounds.maxY) / 2;
    mesh.position.set(centerX, 0, centerZ);

    return new TerrainObject(geometryObject.getTileKey(), mesh);
  }
}
