import { BufferGeometry, SphereGeometry } from 'three';
import type { IRoofGeometryStrategy, RoofParams } from './types';
import { computeOBB, polygonExtentAtAngle } from './roofGeometryUtils';

export class DomeRoofStrategy implements IRoofGeometryStrategy {
  create(params: RoofParams): BufferGeometry {
    const ring = params.outerRing;
    const h = params.roofHeight;

    // Unit upper hemisphere: pole at Y=1, equator at Y=0
    // phiSegments=32, thetaSegments=16 for smooth silhouette on large domes
    const geom = new SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);

    // Per-vertex footprint-fitted displacement
    const pos = geom.attributes.position!;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i); // normalized height [0..1] on unit sphere
      const z = pos.getZ(i);

      const sinTheta = Math.sqrt(x * x + z * z);
      if (sinTheta < 0.001) {
        // Pole vertex: place at apex
        pos.setXYZ(i, 0, h, 0);
        continue;
      }

      // Direction from centroid in XZ plane → look up polygon extent in that direction
      const theta = Math.atan2(z, x);
      const extent = polygonExtentAtAngle(ring, theta);

      pos.setXYZ(i, extent * (x / sinTheta), h * y, extent * (z / sinTheta));
    }
    pos.needsUpdate = true;

    // Translate base center to OBB center (ring is centroid-relative)
    const obb = computeOBB(ring);
    geom.translate(obb.center[0], 0, -obb.center[1]);

    geom.computeVertexNormals();
    return geom;
  }
}
