import { BufferGeometry, BufferAttribute } from 'three';
import type { ElevationDataTile } from '../../../data/elevation/types';

/**
 * Factory for creating Three.js terrain geometry from elevation tiles.
 * Generates BufferGeometry with vertex normals for realistic lighting.
 */
export class TerrainGeometryFactory {
  /**
   * Create BufferGeometry from an elevation tile.
   *
   * Generates:
   * - BufferGeometry with position, index, and normal attributes
   *
   * @param elevationTile - The elevation data tile to convert
   * @returns A Three.js BufferGeometry
   */
  createGeometry(elevationTile: ElevationDataTile): BufferGeometry {
    return this.createBufferGeometry(elevationTile);
  }

  /**
   * Create a BufferGeometry from elevation data.
   * Generates vertex positions, indices, and normals.
   */
  private createBufferGeometry(
    elevationTile: ElevationDataTile
  ): BufferGeometry {
    const { data, tileSize, mercatorBounds } = elevationTile;
    const geometry = new BufferGeometry();

    // Calculate dimensions
    const width = mercatorBounds.maxX - mercatorBounds.minX;
    const height = mercatorBounds.maxY - mercatorBounds.minY;
    const cellWidth = width / (tileSize - 1);
    const cellHeight = height / (tileSize - 1);

    // Create vertices array (X, Y, Z coordinates)
    // Y-axis is vertical (elevation), Z-axis is tile Y coordinate
    const vertices: number[] = [];
    for (let y = 0; y < tileSize; y++) {
      for (let x = 0; x < tileSize; x++) {
        const posX = x * cellWidth - width / 2;
        const posY = data[y][x] ?? 0; // Elevation is vertical (Y-axis)
        const posZ = y * cellHeight - height / 2;

        vertices.push(posX, posY, posZ);
      }
    }

    // Create indices array (triangle indices)
    const indices: number[] = [];
    for (let y = 0; y < tileSize - 1; y++) {
      for (let x = 0; x < tileSize - 1; x++) {
        const a = y * tileSize + x;
        const b = y * tileSize + (x + 1);
        const c = (y + 1) * tileSize + x;
        const d = (y + 1) * tileSize + (x + 1);

        // First triangle (a, b, c)
        indices.push(a, c, b);
        // Second triangle (b, c, d)
        indices.push(b, c, d);
      }
    }

    // Set position and index attributes
    geometry.setAttribute(
      'position',
      new BufferAttribute(new Float32Array(vertices), 3)
    );
    geometry.setIndex(new BufferAttribute(new Uint32Array(indices), 1));

    // Create UV coordinates for texture mapping
    const uvs: number[] = [];
    for (let y = 0; y < tileSize; y++) {
      for (let x = 0; x < tileSize; x++) {
        uvs.push(x / (tileSize - 1), y / (tileSize - 1));
      }
    }
    geometry.setAttribute('uv', new BufferAttribute(new Float32Array(uvs), 2));

    // Calculate normals for lighting
    geometry.computeVertexNormals();

    return geometry;
  }
}
