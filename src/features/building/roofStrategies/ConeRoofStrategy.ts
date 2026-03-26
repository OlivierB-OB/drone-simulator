import { BufferGeometry, ConeGeometry } from 'three';
import type { IRoofGeometryStrategy, RoofParams } from './types';
import { computeOBB, polygonExtentAtAngle } from './roofGeometryUtils';
import { PyramidalRoofStrategy } from './PyramidalRoofStrategy';

const CIRCULARITY_THRESHOLD = 1.2;

export class ConeRoofStrategy implements IRoofGeometryStrategy {
  create(params: RoofParams): BufferGeometry {
    const { outerRing: ring, roofHeight: h } = params;
    const obb = computeOBB(ring);

    // Case B: irregular/elongated footprint — delegate to pyramid
    if (obb.halfLength / obb.halfWidth >= CIRCULARITY_THRESHOLD) {
      return new PyramidalRoofStrategy().create(params);
    }

    // Case A: approximately circular — per-vertex angular fitting
    // ConeGeometry(1,1,64): apex at Y=+0.5, base at Y=-0.5
    const geom = new ConeGeometry(1, 1, 64, 1, true);
    // Shift so base is at Y=0, apex at Y=1
    geom.translate(0, 0.5, 0);

    const pos = geom.attributes.position!;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i); // 0=base, 1=apex after translate
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const sinTheta = Math.sqrt(x * x + z * z);

      if (sinTheta < 0.001) {
        // Apex vertex
        pos.setXYZ(i, obb.center[0], h, -obb.center[1]);
        continue;
      }

      const theta = Math.atan2(z, x);
      const rPoly = polygonExtentAtAngle(ring, theta);
      const rAtHeight = rPoly * (1 - y); // linear taper: full at base, zero at apex

      pos.setXYZ(
        i,
        rAtHeight * Math.cos(theta) + obb.center[0],
        y * h,
        rAtHeight * Math.sin(theta) - obb.center[1]
      );
    }

    pos.needsUpdate = true;
    geom.computeVertexNormals();
    return geom;
  }
}
