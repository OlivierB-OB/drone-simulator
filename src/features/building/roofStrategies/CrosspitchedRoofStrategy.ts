import {
  BufferGeometry,
  Float32BufferAttribute,
  ShapeUtils,
  Vector2,
} from 'three';
import type { IRoofGeometryStrategy, RoofParams } from './types';
import { computeOBB } from './roofGeometryUtils';

export class CrosspitchedRoofStrategy implements IRoofGeometryStrategy {
  create(params: RoofParams): BufferGeometry {
    const ring = params.outerRing;
    const h = params.roofHeight;
    const obb = computeOBB(ring);

    // Equal-pitch half-width: both ridges use the shorter OBB dimension.
    const hW = Math.min(obb.halfLength, obb.halfWidth);
    if (hW < 1e-6) {
      return new BufferGeometry();
    }

    // --- Normalise ring ---
    const isClosedRing =
      ring.length > 1 &&
      ring[0]![0] === ring[ring.length - 1]![0] &&
      ring[0]![1] === ring[ring.length - 1]![1];
    const count = isClosedRing ? ring.length - 1 : ring.length;

    // Detect ring orientation via shoelace (signed area).
    let signedArea = 0;
    for (let i = 0; i < count; i++) {
      const j = (i + 1) % count;
      signedArea += ring[i]![0] * ring[j]![1] - ring[j]![0] * ring[i]![1];
    }
    const isCCW = signedArea > 0;

    // --- Two perpendicular ridge axes ---
    // angle1: primary ridge (along OBB long axis by default)
    // angle2: secondary ridge, perpendicular
    const angle1 = params.ridgeAngle;
    const angle2 = params.ridgeAngle + Math.PI / 2;

    // Across-ridge unit vectors in Mercator XY
    const across1X = -Math.sin(angle1);
    const across1Y = Math.cos(angle1);
    const across2X = -Math.sin(angle2);
    const across2Y = Math.cos(angle2);

    // --- Per-vertex height: upper envelope of two gabled profiles ---
    const heights = new Float64Array(count);
    for (let i = 0; i < count; i++) {
      const p1 = ring[i]![0] * across1X + ring[i]![1] * across1Y;
      const p2 = ring[i]![0] * across2X + ring[i]![1] * across2Y;
      const h1 = h * Math.max(0, 1 - Math.abs(p1) / hW);
      const h2 = h * Math.max(0, 1 - Math.abs(p2) / hW);
      heights[i] = Math.max(h1, h2);
    }

    // --- Triangulate top face ---
    const contour: Vector2[] = [];
    for (let i = 0; i < count; i++) {
      contour.push(new Vector2(ring[i]![0], ring[i]![1]));
    }
    const triangles = ShapeUtils.triangulateShape(contour, []);

    const topTriCount = triangles.length;
    const sideTriCount = count * 2;
    const positions = new Float32Array((topTriCount + sideTriCount) * 3 * 3);
    let o = 0;

    // Top face: X = mercX, Y = height, Z = -mercY
    for (const tri of triangles) {
      const i0 = tri[0]!;
      const i1 = tri[1]!;
      const i2 = tri[2]!;
      positions[o++] = ring[i0]![0];
      positions[o++] = heights[i0]!;
      positions[o++] = -ring[i0]![1];
      positions[o++] = ring[i1]![0];
      positions[o++] = heights[i1]!;
      positions[o++] = -ring[i1]![1];
      positions[o++] = ring[i2]![0];
      positions[o++] = heights[i2]!;
      positions[o++] = -ring[i2]![1];
    }

    // Side walls: fill gap between flat wall top (Y=0) and sloped surface.
    // Z=-mercY reverses handedness; swap (a,b) for CW polygons to keep outward normals.
    for (let i = 0; i < count; i++) {
      const j = (i + 1) % count;
      const a = isCCW ? i : j;
      const b = isCCW ? j : i;

      // Triangle 1: base[a] → base[b] → roof[b]
      positions[o++] = ring[a]![0];
      positions[o++] = 0;
      positions[o++] = -ring[a]![1];
      positions[o++] = ring[b]![0];
      positions[o++] = 0;
      positions[o++] = -ring[b]![1];
      positions[o++] = ring[b]![0];
      positions[o++] = heights[b]!;
      positions[o++] = -ring[b]![1];

      // Triangle 2: base[a] → roof[b] → roof[a]
      positions[o++] = ring[a]![0];
      positions[o++] = 0;
      positions[o++] = -ring[a]![1];
      positions[o++] = ring[b]![0];
      positions[o++] = heights[b]!;
      positions[o++] = -ring[b]![1];
      positions[o++] = ring[a]![0];
      positions[o++] = heights[a]!;
      positions[o++] = -ring[a]![1];
    }

    const geom = new BufferGeometry();
    geom.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geom.computeVertexNormals();
    return geom;
  }
}
