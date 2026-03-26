import { BufferGeometry, Float32BufferAttribute } from 'three';
import type { IRoofGeometryStrategy, RoofParams } from './types';
import { computeOBB } from './roofGeometryUtils';

/**
 * Sawtooth roof: N parallel skillion bays repeated across the building width.
 * Each bay has a slope face, a vertical face at the high edge, and two triangular end faces.
 *
 * N = clamp(floor(2*halfWidth / BAY_WIDTH_METERS), MIN_BAYS, MAX_BAYS)
 * 6 triangles per bay, 6N triangles total (non-indexed).
 */
export class SawtoothRoofStrategy implements IRoofGeometryStrategy {
  private readonly BAY_WIDTH_METERS = 5;
  private readonly MIN_BAYS = 2;
  private readonly MAX_BAYS = 20;

  create(params: RoofParams): BufferGeometry {
    const obb = computeOBB(params.outerRing);
    const h = params.roofHeight;
    const hL = obb.halfLength;
    const hW = obb.halfWidth;

    // Guard: degenerate thin building
    if (hW < 1e-3) return new BufferGeometry();

    const N = Math.min(
      this.MAX_BAYS,
      Math.max(this.MIN_BAYS, Math.floor((hW * 2) / this.BAY_WIDTH_METERS))
    );
    const bayWidth = (hW * 2) / N;

    const cos = Math.cos(params.ridgeAngle);
    const sin = Math.sin(params.ridgeAngle);

    // Along-ridge and across-ridge directions in Three.js XZ (X=mercX, Z=-mercY)
    const aLX = cos;
    const aLZ = -sin; // along-ridge
    const aCX = -sin;
    const aCZ = -cos; // across-ridge

    const cx = obb.center[0];
    const cz = -obb.center[1];

    // 6 triangles × 3 vertices × 3 floats per bay
    const positions = new Float32Array(6 * N * 9);
    let o = 0;

    type V3 = [number, number, number];
    const emitTri = (v0: V3, v1: V3, v2: V3): void => {
      positions[o++] = v0[0];
      positions[o++] = v0[1];
      positions[o++] = v0[2];
      positions[o++] = v1[0];
      positions[o++] = v1[1];
      positions[o++] = v1[2];
      positions[o++] = v2[0];
      positions[o++] = v2[1];
      positions[o++] = v2[2];
    };

    for (let i = 0; i < N; i++) {
      const a0 = -hW + i * bayWidth; // across scalar at low edge  (Y=0)
      const a1 = -hW + (i + 1) * bayWidth; // across scalar at high edge (Y=h)

      // Slope corners
      const PLL: V3 = [cx + a0 * aCX + -hL * aLX, 0, cz + a0 * aCZ + -hL * aLZ];
      const PLH: V3 = [cx + a0 * aCX + +hL * aLX, 0, cz + a0 * aCZ + +hL * aLZ];
      const PHL: V3 = [cx + a1 * aCX + -hL * aLX, h, cz + a1 * aCZ + -hL * aLZ];
      const PHH: V3 = [cx + a1 * aCX + +hL * aLX, h, cz + a1 * aCZ + +hL * aLZ];

      // Vertical face base corners (same XZ as PHL/PHH, Y=0)
      const VLL: V3 = [PHL[0], 0, PHL[2]];
      const VLH: V3 = [PHH[0], 0, PHH[2]];

      // Slope face (normal: upward + toward -across)
      emitTri(PLL, PLH, PHL);
      emitTri(PLH, PHH, PHL);

      // Vertical face (normal: toward +across)
      emitTri(PHL, PHH, VLL);
      emitTri(VLL, PHH, VLH);

      // End face at -halfLength (normal: toward -along)
      emitTri(PLL, PHL, VLL);

      // End face at +halfLength (normal: toward +along)
      emitTri(PLH, VLH, PHH);
    }

    const geom = new BufferGeometry();
    geom.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geom.computeVertexNormals();
    return geom;
  }
}
