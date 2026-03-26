import {
  BufferGeometry,
  Float32BufferAttribute,
  ShapeUtils,
  Vector2,
} from 'three';
import type { IRoofGeometryStrategy, RoofParams } from './types';
import { computeOBB } from './roofGeometryUtils';

/**
 * Saltbox roof: asymmetric gabled roof with an offset ridge.
 * One slope is short and steep, the other is long and gentle.
 * The ridge is displaced toward +across by ridgeOffset = halfWidth * 0.3.
 *
 * Uses per-vertex height projection (same pattern as GabledRoofStrategy).
 */
export class SaltboxRoofStrategy implements IRoofGeometryStrategy {
  private readonly RIDGE_OFFSET_FRACTION = 0.3;

  create(params: RoofParams): BufferGeometry {
    const ring = params.outerRing;
    const h = params.roofHeight;
    const obb = computeOBB(ring);

    // --- Ring normalisation (mirrors GabledRoofStrategy) ---
    const isClosedRing =
      ring.length > 1 &&
      ring[0]![0] === ring[ring.length - 1]![0] &&
      ring[0]![1] === ring[ring.length - 1]![1];
    const count = isClosedRing ? ring.length - 1 : ring.length;

    // Winding detection via shoelace
    let signedArea = 0;
    for (let i = 0; i < count; i++) {
      const j = (i + 1) % count;
      signedArea += ring[i]![0] * ring[j]![1] - ring[j]![0] * ring[i]![1];
    }
    const isCCW = signedArea > 0;

    // --- Ridge offset ---
    // Clamp to at most 90% of halfWidth to avoid degenerate geometry
    const ridgeOffset = Math.min(
      obb.halfWidth * this.RIDGE_OFFSET_FRACTION,
      obb.halfWidth * 0.9
    );
    const halfWidthShort = obb.halfWidth - ridgeOffset; // steep side (+across)
    const halfWidthLong = obb.halfWidth + ridgeOffset; // gentle side (-across)

    // Across-ridge direction in Mercator XY
    const acrossX = -Math.sin(params.ridgeAngle);
    const acrossY = Math.cos(params.ridgeAngle);

    // --- Per-vertex heights ---
    // Project each vertex onto the across-ridge axis; height depends on which
    // side of the offset ridge it falls on.
    const heights = new Float64Array(count);
    for (let i = 0; i < count; i++) {
      const proj = ring[i]![0] * acrossX + ring[i]![1] * acrossY;
      if (proj >= ridgeOffset) {
        // +across side: short steep slope
        heights[i] = h * Math.max(0, 1 - (proj - ridgeOffset) / halfWidthShort);
      } else {
        // -across side: long gentle slope
        heights[i] = h * Math.max(0, 1 - (ridgeOffset - proj) / halfWidthLong);
      }
    }

    // --- Top face triangulation ---
    const contour: Vector2[] = [];
    for (let i = 0; i < count; i++) {
      contour.push(new Vector2(ring[i]![0], ring[i]![1]));
    }
    const triangles = ShapeUtils.triangulateShape(contour, []);

    // --- Allocate position buffer ---
    const topTriCount = triangles.length;
    const sideTriCount = count * 2;
    const positions = new Float32Array((topTriCount + sideTriCount) * 9);
    let o = 0;

    // Top face (Three.js: X=mercX, Y=height, Z=-mercY)
    for (const tri of triangles) {
      for (const vi of tri) {
        positions[o++] = ring[vi]![0];
        positions[o++] = heights[vi]!;
        positions[o++] = -ring[vi]![1];
      }
    }

    // Side walls (same winding convention as GabledRoofStrategy)
    for (let i = 0; i < count; i++) {
      const j = (i + 1) % count;
      const a = isCCW ? i : j;
      const b = isCCW ? j : i;

      // Triangle 1: base[a], base[b], roof[b]
      positions[o++] = ring[a]![0];
      positions[o++] = 0;
      positions[o++] = -ring[a]![1];
      positions[o++] = ring[b]![0];
      positions[o++] = 0;
      positions[o++] = -ring[b]![1];
      positions[o++] = ring[b]![0];
      positions[o++] = heights[b]!;
      positions[o++] = -ring[b]![1];

      // Triangle 2: base[a], roof[b], roof[a]
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
