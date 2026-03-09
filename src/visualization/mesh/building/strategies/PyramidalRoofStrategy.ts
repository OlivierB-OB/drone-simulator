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

    // Detect ring orientation via shoelace (signed area).
    // Positive = CCW (standard math), Negative = CW.
    // OSM ways have no enforced winding, so we must normalize.
    let signedArea = 0;
    for (let i = 0; i < count; i++) {
      const j = (i + 1) % count;
      signedArea += ring[i]![0] * ring[j]![1] - ring[j]![0] * ring[i]![1];
    }
    const isCCW = signedArea > 0;

    // 3 unique vertices per face (non-indexed → flat normals via computeVertexNormals)
    const positions = new Float32Array(count * 9);
    let o = 0;

    for (let i = 0; i < count; i++) {
      const j = (i + 1) % count;
      // Winding: (first, second, apex) gives outward normals.
      // Swap first/second when ring is CW to produce the same CCW triangle winding.
      const first = isCCW ? ring[i]! : ring[j]!;
      const second = isCCW ? ring[j]! : ring[i]!;

      // Three.js: X = mercX, Y = height, Z = -mercY
      // Apex at (0, h, 0) = centroid in local space (ring already centroid-relative)
      positions[o++] = first[0];
      positions[o++] = 0;
      positions[o++] = -first[1];
      positions[o++] = second[0];
      positions[o++] = 0;
      positions[o++] = -second[1];
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
