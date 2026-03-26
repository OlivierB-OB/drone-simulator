import { BufferGeometry, Float32BufferAttribute } from 'three';
import type { IRoofGeometryStrategy, RoofParams } from './types';
import { computeOBB, getOBBCorners } from './roofGeometryUtils';
import { GabledRoofStrategy } from './GabledRoofStrategy';
import { HippedRoofStrategy } from './HippedRoofStrategy';

/**
 * Half-hipped (jerkinhead) roof: gabled with small hip triangles clipping the
 * top portion of each gable end.
 *
 * 10 vertices (indexed), 14 triangles (42 indices).
 */
export class HalfHippedRoofStrategy implements IRoofGeometryStrategy {
  private readonly HIP_FRACTION = 0.3; // top 30% of gable end is hipped

  create(params: RoofParams): BufferGeometry {
    if (this.HIP_FRACTION <= 0) return new GabledRoofStrategy().create(params);
    if (this.HIP_FRACTION >= 1) return new HippedRoofStrategy().create(params);

    const obb = computeOBB(params.outerRing);
    const corners = getOBBCorners(obb, params.ridgeAngle);
    const h = params.roofHeight;
    const hipH = h * this.HIP_FRACTION;

    const cos = Math.cos(params.ridgeAngle);
    const sin = Math.sin(params.ridgeAngle);
    const cx = obb.center[0];
    const cz = -obb.center[1]; // Three.js Z = -Mercator Y
    const hL = obb.halfLength;

    // Ridge endpoints at full length (same as GabledRoofStrategy)
    const r0x = cx + hL * cos;
    const r0z = cz - hL * sin;
    const r1x = cx - hL * cos;
    const r1z = cz + hL * sin;

    // 10 vertices:
    //   0–3: base corners C0,C1,C2,C3 at Y=0
    //   4–5: ridge endpoints R0,R1 at Y=h
    //   6–9: hip points HP0,HP1,HP2,HP3 at Y=hipH (same XZ as C0–C3)
    const positions = new Float32Array([
      corners[0]![0],
      0,
      corners[0]![2], // 0: C0  +along +across
      corners[1]![0],
      0,
      corners[1]![2], // 1: C1  +along -across
      corners[2]![0],
      0,
      corners[2]![2], // 2: C2  -along -across
      corners[3]![0],
      0,
      corners[3]![2], // 3: C3  -along +across
      r0x,
      h,
      r0z, // 4: R0  ridge +along end
      r1x,
      h,
      r1z, // 5: R1  ridge -along end
      corners[0]![0],
      hipH,
      corners[0]![2], // 6: HP0 above C0
      corners[1]![0],
      hipH,
      corners[1]![2], // 7: HP1 above C1
      corners[2]![0],
      hipH,
      corners[2]![2], // 8: HP2 above C2
      corners[3]![0],
      hipH,
      corners[3]![2], // 9: HP3 above C3
    ]);

    const indices = [
      // Long slope +across (hexagonal outline, 4 triangles)
      6, 0, 3, 9, 6, 3, 4, 6, 9, 5, 4, 9,
      // Long slope -across (hexagonal outline, 4 triangles)
      8, 2, 1, 7, 8, 1, 5, 8, 7, 4, 5, 7,
      // Hip triangle +along end (1 triangle)
      6, 7, 4,
      // Hip triangle -along end (1 triangle)
      8, 9, 5,
      // Vertical gable +along end (2 triangles)
      6, 0, 1, 7, 6, 1,
      // Vertical gable -along end (2 triangles)
      9, 3, 2, 8, 9, 2,
    ];

    const geom = new BufferGeometry();
    geom.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geom.setIndex(indices);
    geom.computeVertexNormals();
    return geom;
  }
}
