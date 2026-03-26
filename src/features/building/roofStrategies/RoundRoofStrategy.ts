import { BufferGeometry, Float32BufferAttribute } from 'three';
import type { IRoofGeometryStrategy, RoofParams } from './types';
import { computeOBB } from './roofGeometryUtils';

/**
 * Round (barrel vault) roof: semi-cylindrical surface extruded along the ridge axis.
 * Cross-section is a semi-ellipse: across(phi) = halfWidth*cos(phi), height(phi) = roofHeight*sin(phi).
 *
 * N=24 arc segments → N curved strip quads + 2 semicircular end caps = 4N triangles (non-indexed).
 */
export class RoundRoofStrategy implements IRoofGeometryStrategy {
  private readonly ARC_SEGMENTS = 24;

  create(params: RoofParams): BufferGeometry {
    const obb = computeOBB(params.outerRing);
    const h = params.roofHeight;
    const N = this.ARC_SEGMENTS;

    // If wider than long, swap axes so the barrel always spans the longer dimension
    let hL = obb.halfLength;
    let hW = obb.halfWidth;
    let ridgeAngle = params.ridgeAngle;
    if (hW > hL) {
      [hL, hW] = [hW, hL];
      ridgeAngle += Math.PI / 2;
    }

    // Direction vectors in Three.js XZ (Mercator: X→X, Y→-Z)
    const cosA = Math.cos(ridgeAngle);
    const sinA = Math.sin(ridgeAngle);
    const aX = cosA;
    const aZ = -sinA; // along-ridge
    const cX = -sinA;
    const cZ = -cosA; // across-ridge

    // OBB center in Three.js
    const cx = obb.center[0];
    const cz = -obb.center[1];

    // Precompute arc sample points (phi ∈ [0, π], N+1 points)
    const arcAcross = new Float64Array(N + 1); // across-ridge offset
    const arcHeight = new Float64Array(N + 1); // Y height
    for (let i = 0; i <= N; i++) {
      const phi = (i / N) * Math.PI;
      arcAcross[i] = hW * Math.cos(phi); // +hW at phi=0, -hW at phi=π
      arcHeight[i] = h * Math.sin(phi); // 0 at eaves, h at crown (phi=π/2)
    }

    // Helpers: Three.js position for arc sample i at along-ridge parameter t (±1)
    const vx = (i: number, t: number): number =>
      cx + t * hL * aX + arcAcross[i]! * cX;
    const vy = (i: number): number => arcHeight[i]!;
    const vz = (i: number, t: number): number =>
      cz + t * hL * aZ + arcAcross[i]! * cZ;

    // Buffer: N curved strip quads (2 tri each) + 2 end cap fans (N tri each) = N*4 triangles
    const positions = new Float32Array(N * 4 * 3 * 3);
    let o = 0;

    const push = (x: number, y: number, z: number): void => {
      positions[o++] = x;
      positions[o++] = y;
      positions[o++] = z;
    };

    // --- Curved strip ---
    // Quad corners: A(i,-1) B(i,+1) C(i+1,+1) D(i+1,-1)
    // Outward-normal CCW winding (viewed from outside cylinder): [A,C,B] and [A,D,C]
    for (let i = 0; i < N; i++) {
      // Triangle 1: A, C, B
      push(vx(i, -1), vy(i), vz(i, -1));
      push(vx(i + 1, +1), vy(i + 1), vz(i + 1, +1));
      push(vx(i, +1), vy(i), vz(i, +1));
      // Triangle 2: A, D, C
      push(vx(i, -1), vy(i), vz(i, -1));
      push(vx(i + 1, -1), vy(i + 1), vz(i + 1, -1));
      push(vx(i + 1, +1), vy(i + 1), vz(i + 1, +1));
    }

    // --- Far end cap (t=+1), fan from crown toward +along direction ---
    // Fan: [center, arc[i], arc[i+1]] — CCW when viewed from +along (outside)
    const farCx = cx + hL * aX; // crown at phi=π/2: arcAcross=0
    const farCy = h;
    const farCz = cz + hL * aZ;
    for (let i = 0; i < N; i++) {
      push(farCx, farCy, farCz);
      push(vx(i, +1), vy(i), vz(i, +1));
      push(vx(i + 1, +1), vy(i + 1), vz(i + 1, +1));
    }

    // --- Near end cap (t=-1), fan from crown toward -along direction ---
    // Fan: [center, arc[i+1], arc[i]] — CCW when viewed from -along (outside)
    const nearCx = cx - hL * aX;
    const nearCy = h;
    const nearCz = cz - hL * aZ;
    for (let i = 0; i < N; i++) {
      push(nearCx, nearCy, nearCz);
      push(vx(i + 1, -1), vy(i + 1), vz(i + 1, -1));
      push(vx(i, -1), vy(i), vz(i, -1));
    }

    const geom = new BufferGeometry();
    geom.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geom.computeVertexNormals();
    return geom;
  }
}
