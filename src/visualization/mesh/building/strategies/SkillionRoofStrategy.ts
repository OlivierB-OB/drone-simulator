import { BufferGeometry, Float32BufferAttribute } from 'three';
import type { IRoofGeometryStrategy, RoofParams } from './types';
import { computeOBB, getOBBCorners } from './roofGeometryUtils';

export class SkillionRoofStrategy implements IRoofGeometryStrategy {
  create(params: RoofParams): BufferGeometry {
    const obb = computeOBB(params.outerRing);
    const corners = getOBBCorners(obb, params.ridgeAngle);
    const h = params.roofHeight;

    // Skillion: one side high (+across), opposite side low (-across)
    // C0,C3 are +across → at height h
    // C1,C2 are -across → at height 0
    // Add duplicate vertices for the side walls
    const positions = new Float32Array([
      // Top face vertices
      corners[0]![0],
      h,
      corners[0]![2], // 0: C0 high
      corners[1]![0],
      0,
      corners[1]![2], // 1: C1 low
      corners[2]![0],
      0,
      corners[2]![2], // 2: C2 low
      corners[3]![0],
      h,
      corners[3]![2], // 3: C3 high
      // Side wall +along: triangle C0(0) - C0(h) - C1(0)
      corners[0]![0],
      0,
      corners[0]![2], // 4: C0 low (duplicate at Y=0)
      // Side wall -along: triangle C3(0) - C2(0) - C3(h)
      corners[3]![0],
      0,
      corners[3]![2], // 5: C3 low (duplicate at Y=0)
    ]);

    const indices = [
      // Top sloped face (outward normals)
      2, 1, 0, 3, 2, 0,
      // Side wall +along end: triangle from low eave to high edge
      4, 0, 1,
      // Side wall -along end: triangle from low eave to high edge
      2, 3, 5,
    ];

    const geom = new BufferGeometry();
    geom.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geom.setIndex(indices);
    geom.computeVertexNormals();
    return geom;
  }
}
