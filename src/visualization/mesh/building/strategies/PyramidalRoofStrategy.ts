import { BufferGeometry, Float32BufferAttribute } from 'three';
import type { IRoofGeometryStrategy, RoofParams } from './types';

export class PyramidalRoofStrategy implements IRoofGeometryStrategy {
  create(params: RoofParams): BufferGeometry {
    const ring = params.outerRing;
    const h = params.roofHeight;

    // Detect closed ring (last point == first point)
    const isClosedRing =
      ring.length > 1 &&
      ring[0]![0] === ring[ring.length - 1]![0] &&
      ring[0]![1] === ring[ring.length - 1]![1];
    const count = isClosedRing ? ring.length - 1 : ring.length;

    // 3 unique vertices per face (non-indexed → flat normals via computeVertexNormals)
    const positions = new Float32Array(count * 9);
    let o = 0;

    for (let i = 0; i < count; i++) {
      const j = (i + 1) % count;
      const [ax, ay] = ring[i]!;
      const [bx, by] = ring[j]!;

      // Winding: (ring[i], ring[j], apex) gives outward normals for CCW Mercator ring
      // Three.js: X = mercX, Y = height, Z = -mercY
      // Apex at (0, h, 0) = centroid in local space (ring already centroid-relative)
      positions[o++] = ax;
      positions[o++] = 0;
      positions[o++] = -ay;
      positions[o++] = bx;
      positions[o++] = 0;
      positions[o++] = -by;
      positions[o++] = 0;
      positions[o++] = h;
      positions[o++] = 0;
    }

    const geom = new BufferGeometry();
    geom.setAttribute('position', new Float32BufferAttribute(positions, 3));
    // No setIndex() → each 3 positions is one triangle → flat normals per face
    geom.computeVertexNormals();
    return geom;
  }
}
