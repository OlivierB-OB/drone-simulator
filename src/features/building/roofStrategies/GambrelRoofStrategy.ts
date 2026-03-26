import { BufferGeometry, Float32BufferAttribute } from 'three';
import type { IRoofGeometryStrategy, RoofParams } from './types';
import { computeOBB } from './roofGeometryUtils';

/**
 * Gambrel roof: barn-style, two slope zones per side of the ridge.
 * Each side has a steep lower section rising to a break line, then a
 * shallower upper section rising to the central ridge.
 *
 * 10 vertices, 14 triangles (non-indexed).
 */
export class GambrelRoofStrategy implements IRoofGeometryStrategy {
  private readonly BREAK_HEIGHT_FRACTION = 0.5;
  private readonly BREAK_WIDTH_FRACTION = 0.6;

  create(params: RoofParams): BufferGeometry {
    const obb = computeOBB(params.outerRing);
    const h = params.roofHeight;
    const bH = h * this.BREAK_HEIGHT_FRACTION;
    const bW = Math.min(
      obb.halfWidth * this.BREAK_WIDTH_FRACTION,
      obb.halfWidth - 0.01
    );

    const cos = Math.cos(params.ridgeAngle);
    const sin = Math.sin(params.ridgeAngle);
    const cx = obb.center[0];
    const cz = -obb.center[1]; // Three.js Z = -Mercator Y
    const hL = obb.halfLength;
    const hW = obb.halfWidth;

    // Along-ridge Three.js XZ: (cos, -sin)
    // Across-ridge Three.js XZ: (-sin, -cos)
    type V3 = [number, number, number];
    const C0: V3 = [cx + hL * cos - hW * sin, 0, cz - hL * sin - hW * cos]; // +along +across
    const C1: V3 = [cx + hL * cos + hW * sin, 0, cz - hL * sin + hW * cos]; // +along -across
    const C2: V3 = [cx - hL * cos + hW * sin, 0, cz + hL * sin + hW * cos]; // -along -across
    const C3: V3 = [cx - hL * cos - hW * sin, 0, cz + hL * sin - hW * cos]; // -along +across
    const K0: V3 = [cx + hL * cos - bW * sin, bH, cz - hL * sin - bW * cos]; // +along +break
    const K1: V3 = [cx + hL * cos + bW * sin, bH, cz - hL * sin + bW * cos]; // +along -break
    const K2: V3 = [cx - hL * cos + bW * sin, bH, cz + hL * sin + bW * cos]; // -along -break
    const K3: V3 = [cx - hL * cos - bW * sin, bH, cz + hL * sin - bW * cos]; // -along +break
    const R0: V3 = [cx + hL * cos, h, cz - hL * sin]; // ridge +along
    const R1: V3 = [cx - hL * cos, h, cz + hL * sin]; // ridge -along

    // 14 triangles × 3 vertices × 3 floats = 126
    const positions = new Float32Array(126);
    let o = 0;

    const pushTri = (a: V3, b: V3, c: V3): void => {
      positions[o++] = a[0];
      positions[o++] = a[1];
      positions[o++] = a[2];
      positions[o++] = b[0];
      positions[o++] = b[1];
      positions[o++] = b[2];
      positions[o++] = c[0];
      positions[o++] = c[1];
      positions[o++] = c[2];
    };

    // Lower slope +across (quad C3,C0,K0,K3)
    pushTri(K0, C0, C3);
    pushTri(K3, K0, C3);

    // Lower slope -across (quad C1,C2,K2,K1)
    pushTri(K2, C2, C1);
    pushTri(K1, K2, C1);

    // Upper slope +across (quad K3,K0,R0,R1)
    pushTri(R0, K0, K3);
    pushTri(R1, R0, K3);

    // Upper slope -across (quad K1,K2,R1,R0)
    pushTri(R1, K2, K1);
    pushTri(R0, R1, K1);

    // Gable end +along: pentagon C0,K0,R0,K1,C1 (fan from C0)
    pushTri(R0, K0, C0);
    pushTri(K1, R0, C0);
    pushTri(C1, K1, C0);

    // Gable end -along: pentagon C2,K2,R1,K3,C3 (fan from C2)
    pushTri(R1, K2, C2);
    pushTri(K3, R1, C2);
    pushTri(C3, K3, C2);

    const geom = new BufferGeometry();
    geom.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geom.computeVertexNormals();
    return geom;
  }
}
