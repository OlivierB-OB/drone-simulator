import {
  BufferGeometry,
  Float32BufferAttribute,
  ShapeUtils,
  Vector2,
} from 'three';
import type { IRoofGeometryStrategy, RoofParams } from './types';

export class SkillionRoofStrategy implements IRoofGeometryStrategy {
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
    let signedArea = 0;
    for (let i = 0; i < count; i++) {
      const j = (i + 1) % count;
      signedArea += ring[i]![0] * ring[j]![1] - ring[j]![0] * ring[i]![1];
    }
    const isCCW = signedArea > 0;

    // "+across" direction = high side of the slope
    // ridgeAngle is the along-ridge direction; across is perpendicular
    const acrossX = -Math.sin(params.ridgeAngle);
    const acrossY = Math.cos(params.ridgeAngle);

    // Project each vertex onto the across direction to compute per-vertex height
    let minProj = Infinity;
    let maxProj = -Infinity;
    const projections = new Float64Array(count);
    for (let i = 0; i < count; i++) {
      const proj = ring[i]![0] * acrossX + ring[i]![1] * acrossY;
      projections[i] = proj;
      if (proj < minProj) minProj = proj;
      if (proj > maxProj) maxProj = proj;
    }

    const projRange = maxProj - minProj;
    const heights = new Float64Array(count);
    for (let i = 0; i < count; i++) {
      heights[i] =
        projRange > 0 ? (h * (projections[i]! - minProj)) / projRange : 0;
    }

    // Triangulate top face using ShapeUtils.triangulateShape
    const contour: Vector2[] = [];
    for (let i = 0; i < count; i++) {
      contour.push(new Vector2(ring[i]![0], ring[i]![1]));
    }
    const triangles = ShapeUtils.triangulateShape(contour, []);

    // Count geometry: top face triangles + side wall quads (2 triangles each)
    const topTriCount = triangles.length;
    const sideTriCount = count * 2;
    const totalVertices = (topTriCount + sideTriCount) * 3;
    const positions = new Float32Array(totalVertices * 3);
    let o = 0;

    // Top face (non-indexed, flat normals)
    for (const tri of triangles) {
      // ShapeUtils.triangulateShape normalizes to CCW internally.
      // CCW Mercator triangles produce upward (+Y) normals in Three.js (Z=-Y mapping).
      const i0 = tri[0]!;
      const i1 = tri[1]!;
      const i2 = tri[2]!;

      // Three.js: X = mercX, Y = height, Z = -mercY
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

    // Side walls: fill gap between flat wall top (Y=0) and sloped roof
    for (let i = 0; i < count; i++) {
      const j = (i + 1) % count;

      // Vertex order depends on polygon orientation for outward-facing normals.
      // Z=-mercY reverses handedness: CCW Mercator → CW in Three.js, so
      // for CCW polygon, (i, j) order gives outward normals; for CW, (j, i).
      const a = isCCW ? i : j;
      const b = isCCW ? j : i;

      // Quad: two triangles
      // Triangle 1: (a at Y=0), (b at Y=0), (b at Y=heights[b])
      positions[o++] = ring[a]![0];
      positions[o++] = 0;
      positions[o++] = -ring[a]![1];
      positions[o++] = ring[b]![0];
      positions[o++] = 0;
      positions[o++] = -ring[b]![1];
      positions[o++] = ring[b]![0];
      positions[o++] = heights[b]!;
      positions[o++] = -ring[b]![1];

      // Triangle 2: (a at Y=0), (b at Y=heights[b]), (a at Y=heights[a])
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
