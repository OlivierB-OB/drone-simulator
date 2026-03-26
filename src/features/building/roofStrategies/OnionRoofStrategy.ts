import { BufferGeometry, SphereGeometry } from 'three';
import type { IRoofGeometryStrategy, RoofParams } from './types';
import { computeOBB, polygonExtentAtAngle } from './roofGeometryUtils';

export class OnionRoofStrategy implements IRoofGeometryStrategy {
  create(params: RoofParams): BufferGeometry {
    const ring = params.outerRing;
    const h = params.roofHeight;

    // Unit upper hemisphere: pole at Y=1, equator at Y=0
    // 32×16 segments for smooth bulge silhouette
    const geom = new SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);

    // Per-vertex: apply onion bulge profile then fit to actual polygon footprint
    const pos = geom.attributes.position!;
    for (let i = 0; i < pos.count; i++) {
      const xUnit = pos.getX(i);
      const y = pos.getY(i); // normalized height [0..1] on unit sphere
      const zUnit = pos.getZ(i);

      const sinPhi = Math.sqrt(xUnit * xUnit + zUnit * zUnit); // horizontal radius on unit sphere
      if (sinPhi < 0.001) {
        // Pole vertex: place at apex
        pos.setXYZ(i, 0, h, 0);
        continue;
      }

      const theta = Math.atan2(zUnit, xUnit);
      const bulge = 1 + 0.35 * Math.sin(y * Math.PI);
      const taper = 1 - y * 0.2;
      const extent = polygonExtentAtAngle(ring, theta);
      const finalR = extent * taper * bulge * sinPhi;

      pos.setXYZ(i, Math.cos(theta) * finalR, y * h, Math.sin(theta) * finalR);
    }
    pos.needsUpdate = true;

    // Translate base center to OBB center (ring is centroid-relative)
    const obb = computeOBB(ring);
    geom.translate(obb.center[0], 0, -obb.center[1]);

    geom.computeVertexNormals();
    return geom;
  }
}
