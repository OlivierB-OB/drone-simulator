import { BufferGeometry, Float32BufferAttribute } from 'three';
import type { IRoofGeometryStrategy, RoofParams } from './types';
import { computeOBB, getOBBCorners } from './roofGeometryUtils';

export class GabledRoofStrategy implements IRoofGeometryStrategy {
  create(params: RoofParams): BufferGeometry {
    const obb = computeOBB(params.outerRing);
    const corners = getOBBCorners(obb, params.ridgeAngle);
    const h = params.roofHeight;

    const cos = Math.cos(params.ridgeAngle);
    const sin = Math.sin(params.ridgeAngle);
    const cx = obb.center[0];
    const cz = -obb.center[1];
    const hL = obb.halfLength;

    // Ridge endpoints at center of across-axis, extending full length
    const r0x = cx + hL * cos;
    const r0z = cz + hL * -sin;
    const r1x = cx - hL * cos;
    const r1z = cz - hL * -sin;

    // 6 vertices: 4 base corners + 2 ridge points
    const positions = new Float32Array([
      corners[0]![0],
      0,
      corners[0]![2], // 0: C0 (+along +across)
      corners[1]![0],
      0,
      corners[1]![2], // 1: C1 (+along -across)
      corners[2]![0],
      0,
      corners[2]![2], // 2: C2 (-along -across)
      corners[3]![0],
      0,
      corners[3]![2], // 3: C3 (-along +across)
      r0x,
      h,
      r0z, // 4: R0 (+along end of ridge)
      r1x,
      h,
      r1z, // 5: R1 (-along end of ridge)
    ]);

    const indices = [
      // Left slope (outward normals)
      4, 0, 3, 5, 4, 3,
      // Right slope (outward normals)
      5, 2, 1, 4, 5, 1,
      // Gable end +along (outward normal)
      4, 1, 0,
      // Gable end -along (outward normal)
      5, 3, 2,
    ];

    const geom = new BufferGeometry();
    geom.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geom.setIndex(indices);
    geom.computeVertexNormals();
    return geom;
  }
}
