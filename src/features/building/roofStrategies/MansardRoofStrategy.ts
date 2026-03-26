import { BufferGeometry, Float32BufferAttribute } from 'three';
import type { IRoofGeometryStrategy, OBB, RoofParams } from './types';
import { computeOBB, getOBBCorners } from './roofGeometryUtils';
import { PyramidalRoofStrategy } from './PyramidalRoofStrategy';

/**
 * Mansard roof: four-sided, each side has two slopes (steep lower + shallow upper).
 * The four-sided analog of a gambrel. Common on Haussmann-era Parisian buildings.
 *
 * Three OBB rings at progressive heights (base, break, top).
 * 12 vertices (indexed), 18 triangles (54 indices).
 */
export class MansardRoofStrategy implements IRoofGeometryStrategy {
  private readonly BREAK_HEIGHT_FRACTION = 0.6; // steep section = 60% of total height
  private readonly BREAK_INSET_FRACTION = 0.4; // break ring inset = 40% of halfWidth
  private readonly TOP_INSET_FRACTION = 0.15; // top ring additional inset = 15% of halfWidth

  create(params: RoofParams): BufferGeometry {
    const obb = computeOBB(params.outerRing);
    const h = params.roofHeight;
    const breakH = h * this.BREAK_HEIGHT_FRACTION;
    const breakInset = obb.halfWidth * this.BREAK_INSET_FRACTION;
    const topInset = obb.halfWidth * this.TOP_INSET_FRACTION;

    // Guard: if break inset collapses the OBB, fall back to pyramidal
    if (breakInset >= Math.min(obb.halfLength, obb.halfWidth)) {
      return new PyramidalRoofStrategy().create(params);
    }

    // Level 0: base ring at Y=0
    const corners0 = getOBBCorners(obb, params.ridgeAngle);

    // Level 1: break ring at Y=breakH (inset on all sides)
    const obb1: OBB = {
      center: obb.center,
      halfLength: obb.halfLength - breakInset,
      halfWidth: obb.halfWidth - breakInset,
      angle: obb.angle,
    };
    const corners1 = getOBBCorners(obb1, params.ridgeAngle);

    // Level 2: top ring at Y=h (further inset)
    const obb2: OBB = {
      center: obb.center,
      halfLength: Math.max(obb.halfLength - breakInset - topInset, 0.01),
      halfWidth: Math.max(obb.halfWidth - breakInset - topInset, 0.01),
      angle: obb.angle,
    };
    const corners2 = getOBBCorners(obb2, params.ridgeAngle);

    // 12 vertices: 4 base (idx 0–3) + 4 break (idx 4–7) + 4 top (idx 8–11)
    const positions = new Float32Array([
      corners0[0]![0],
      0,
      corners0[0]![2], // 0:  C0
      corners0[1]![0],
      0,
      corners0[1]![2], // 1:  C1
      corners0[2]![0],
      0,
      corners0[2]![2], // 2:  C2
      corners0[3]![0],
      0,
      corners0[3]![2], // 3:  C3
      corners1[0]![0],
      breakH,
      corners1[0]![2], // 4:  B0
      corners1[1]![0],
      breakH,
      corners1[1]![2], // 5:  B1
      corners1[2]![0],
      breakH,
      corners1[2]![2], // 6:  B2
      corners1[3]![0],
      breakH,
      corners1[3]![2], // 7:  B3
      corners2[0]![0],
      h,
      corners2[0]![2], // 8:  T0
      corners2[1]![0],
      h,
      corners2[1]![2], // 9:  T1
      corners2[2]![0],
      h,
      corners2[2]![2], // 10: T2
      corners2[3]![0],
      h,
      corners2[3]![2], // 11: T3
    ]);

    const indices = [
      // Lower steep faces (4 quads × 2 triangles = 8 triangles)
      0,
      3,
      7,
      0,
      7,
      4, // +across lower: C0,C3,B3,B0
      2,
      1,
      5,
      2,
      5,
      6, // -across lower: C2,C1,B1,B2
      1,
      0,
      4,
      1,
      4,
      5, // +along lower:  C1,C0,B0,B1
      3,
      2,
      6,
      3,
      6,
      7, // -along lower:  C3,C2,B2,B3
      // Upper shallow faces (4 quads × 2 triangles = 8 triangles)
      4,
      7,
      11,
      4,
      11,
      8, // +across upper: B0,B3,T3,T0
      6,
      5,
      9,
      6,
      9,
      10, // -across upper: B2,B1,T1,T2
      5,
      4,
      8,
      5,
      8,
      9, // +along upper:  B1,B0,T0,T1
      7,
      6,
      10,
      7,
      10,
      11, // -along upper:  B3,B2,T2,T3
      // Top flat face (1 quad × 2 triangles = 2 triangles)
      8,
      11,
      10,
      8,
      10,
      9, // T0,T3,T2 and T0,T2,T1
    ];

    const geom = new BufferGeometry();
    geom.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geom.setIndex(indices);
    geom.computeVertexNormals();
    return geom;
  }
}
