import {
  BufferGeometry,
  Float32BufferAttribute,
  SphereGeometry,
  ConeGeometry,
} from 'three';

export interface OBB {
  center: [number, number]; // center in local Mercator coords
  halfLength: number; // half-extent along primary axis (longest edge direction)
  halfWidth: number; // half-extent perpendicular to primary axis
  angle: number; // angle of primary axis in radians from +X, CCW
}

export interface RoofParams {
  outerRing: [number, number][]; // local Mercator coords (relative to centroid)
  roofShape: string;
  roofHeight: number; // meters
  ridgeAngle: number; // radians in local Mercator XY plane
}

/**
 * Computes the oriented bounding box of a polygon ring by finding the
 * longest edge and projecting all vertices onto that axis.
 */
export function computeOBB(ring: [number, number][]): OBB {
  const count =
    ring.length > 0 &&
    ring[0]![0] === ring[ring.length - 1]![0] &&
    ring[0]![1] === ring[ring.length - 1]![1]
      ? ring.length - 1
      : ring.length;

  // Find longest edge to determine primary axis
  let longestSq = 0;
  let ax = 1;
  let ay = 0;
  for (let i = 0; i < count; i++) {
    const j = (i + 1) % count;
    const dx = ring[j]![0] - ring[i]![0];
    const dy = ring[j]![1] - ring[i]![1];
    const lenSq = dx * dx + dy * dy;
    if (lenSq > longestSq) {
      longestSq = lenSq;
      const len = Math.sqrt(lenSq);
      ax = dx / len;
      ay = dy / len;
    }
  }

  // Perpendicular axis
  const bx = -ay;
  const by = ax;

  // Project all vertices onto both axes
  let minA = Infinity,
    maxA = -Infinity;
  let minB = Infinity,
    maxB = -Infinity;
  for (let i = 0; i < count; i++) {
    const px = ring[i]![0];
    const py = ring[i]![1];
    const projA = px * ax + py * ay;
    const projB = px * bx + py * by;
    if (projA < minA) minA = projA;
    if (projA > maxA) maxA = projA;
    if (projB < minB) minB = projB;
    if (projB > maxB) maxB = projB;
  }

  const halfLength = (maxA - minA) / 2;
  const halfWidth = (maxB - minB) / 2;
  const centerA = (minA + maxA) / 2;
  const centerB = (minB + maxB) / 2;

  return {
    center: [centerA * ax + centerB * bx, centerA * ay + centerB * by],
    halfLength,
    halfWidth,
    angle: Math.atan2(ay, ax),
  };
}

/**
 * Resolves the ridge direction angle in local Mercator radians.
 *
 * Priority:
 * 1. roof:direction (compass degrees) → converted to local Mercator radians
 * 2. roof:orientation=across → OBB angle + 90°
 * 3. Default (along) → OBB angle
 */
export function resolveRidgeAngle(
  obbAngle: number,
  roofDirection?: number,
  roofOrientation?: 'along' | 'across'
): number {
  if (roofDirection !== undefined) {
    // Compass degrees (0=North, CW) → local Mercator radians (0=+X East, CCW)
    return Math.PI / 2 - (roofDirection * Math.PI) / 180;
  }
  if (roofOrientation === 'across') {
    return obbAngle + Math.PI / 2;
  }
  return obbAngle;
}

/**
 * Creates roof BufferGeometry for non-flat roof shapes.
 * Geometry is built in Three.js local space:
 *   X = local Mercator X offset from centroid
 *   Y = height above wall top (0 at base, roofHeight at apex)
 *   Z = -local Mercator Y offset from centroid
 */
export class RoofGeometryFactory {
  create(params: RoofParams): BufferGeometry | null {
    switch (params.roofShape) {
      case 'pyramidal':
        return this.createPyramidal(params);
      case 'cone':
        return this.createCone(params);
      case 'gabled':
        return this.createGabled(params);
      case 'hipped':
        return this.createHipped(params);
      case 'skillion':
        return this.createSkillion(params);
      case 'dome':
        return this.createDome(params);
      case 'onion':
        return this.createOnion(params);
      default:
        return null;
    }
  }

  /**
   * Computes OBB corners in Three.js local space (XZ plane).
   * Returns [C0, C1, C2, C3] going around the OBB.
   */
  private getOBBCorners(
    obb: OBB,
    ridgeAngle: number
  ): [number, number, number][] {
    const cos = Math.cos(ridgeAngle);
    const sin = Math.sin(ridgeAngle);

    // Along-ridge direction in Mercator: (cos, sin)
    // Across-ridge direction in Mercator: (-sin, cos)
    // Map to Three.js: threeX = mercX, threeZ = -mercY
    const alongX = cos;
    const alongZ = -sin;
    const acrossX = -sin;
    const acrossZ = -cos;

    const cx = obb.center[0];
    const cz = -obb.center[1];
    const hL = obb.halfLength;
    const hW = obb.halfWidth;

    return [
      [cx + hL * alongX + hW * acrossX, 0, cz + hL * alongZ + hW * acrossZ], // C0: +along +across
      [cx + hL * alongX - hW * acrossX, 0, cz + hL * alongZ - hW * acrossZ], // C1: +along -across
      [cx - hL * alongX - hW * acrossX, 0, cz - hL * alongZ - hW * acrossZ], // C2: -along -across
      [cx - hL * alongX + hW * acrossX, 0, cz - hL * alongZ + hW * acrossZ], // C3: -along +across
    ];
  }

  private createPyramidal(params: RoofParams): BufferGeometry {
    const obb = computeOBB(params.outerRing);
    const corners = this.getOBBCorners(obb, params.ridgeAngle);
    const cx = obb.center[0];
    const cz = -obb.center[1];
    const h = params.roofHeight;

    // 5 vertices: 4 base corners + 1 apex
    const positions = new Float32Array([
      // Base corners (Y=0)
      corners[0]![0],
      0,
      corners[0]![2],
      corners[1]![0],
      0,
      corners[1]![2],
      corners[2]![0],
      0,
      corners[2]![2],
      corners[3]![0],
      0,
      corners[3]![2],
      // Apex
      cx,
      h,
      cz,
    ]);

    // 4 triangular faces (CCW winding for outward normals)
    const indices = [
      0,
      1,
      4, // +along side
      1,
      2,
      4, // -across side
      2,
      3,
      4, // -along side
      3,
      0,
      4, // +across side
    ];

    const geom = new BufferGeometry();
    geom.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geom.setIndex(indices);
    geom.computeVertexNormals();
    return geom;
  }

  private createGabled(params: RoofParams): BufferGeometry {
    const obb = computeOBB(params.outerRing);
    const corners = this.getOBBCorners(obb, params.ridgeAngle);
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

    // Faces (CCW winding):
    // Left slope (C0-R0-R1-C3): facing +across
    // Right slope (C1-R0-R1-C2): facing -across
    // Gable end 1 (C0-C1-R0): +along end
    // Gable end 2 (C2-C3-R1): -along end
    const indices = [
      // Left slope (C3-C0-R0 and C3-R0-R1)
      3, 0, 4, 3, 4, 5,
      // Right slope (C1-C2-R1 and C1-R1-R0)
      1, 2, 5, 1, 5, 4,
      // Gable end +along (C0-C1-R0)
      0, 1, 4,
      // Gable end -along (C3-C2-R1) — reversed for outward normal
      2, 3, 5,
    ];

    const geom = new BufferGeometry();
    geom.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geom.setIndex(indices);
    geom.computeVertexNormals();
    return geom;
  }

  private createHipped(params: RoofParams): BufferGeometry {
    const obb = computeOBB(params.outerRing);
    const corners = this.getOBBCorners(obb, params.ridgeAngle);
    const h = params.roofHeight;

    const cos = Math.cos(params.ridgeAngle);
    const sin = Math.sin(params.ridgeAngle);
    const cx = obb.center[0];
    const cz = -obb.center[1];

    // Ridge inset: the ridge is shorter than the building length
    const ridgeInset = Math.min(obb.halfLength, obb.halfWidth);
    const ridgeHalfLength = obb.halfLength - ridgeInset;

    // Degenerate case: building is square or wider than long → pyramidal
    if (ridgeHalfLength <= 0.01) {
      return this.createPyramidal(params);
    }

    // Ridge endpoints
    const r0x = cx + ridgeHalfLength * cos;
    const r0z = cz + ridgeHalfLength * -sin;
    const r1x = cx - ridgeHalfLength * cos;
    const r1z = cz - ridgeHalfLength * -sin;

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
      r0z, // 4: R0
      r1x,
      h,
      r1z, // 5: R1
    ]);

    // Faces (CCW winding):
    // Long slope +across: C3-C0-R0-R1
    // Long slope -across: C1-C2-R1-R0
    // Hip end +along: C0-C1-R0
    // Hip end -along: C2-C3-R1
    const indices = [
      // Long slope +across
      3, 0, 4, 3, 4, 5,
      // Long slope -across
      1, 2, 5, 1, 5, 4,
      // Hip end +along
      0, 1, 4,
      // Hip end -along
      2, 3, 5,
    ];

    const geom = new BufferGeometry();
    geom.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geom.setIndex(indices);
    geom.computeVertexNormals();
    return geom;
  }

  private createSkillion(params: RoofParams): BufferGeometry {
    const obb = computeOBB(params.outerRing);
    const corners = this.getOBBCorners(obb, params.ridgeAngle);
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
      // Top sloped face
      0, 1, 2, 0, 2, 3,
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

  private createDome(params: RoofParams): BufferGeometry {
    const obb = computeOBB(params.outerRing);
    const hL = obb.halfLength;
    const hW = obb.halfWidth;
    const baseRadius = Math.min(hL, hW);

    // Upper hemisphere: thetaStart=0 (pole), thetaLength=PI/2 (to equator)
    const geom = new SphereGeometry(
      baseRadius,
      16,
      8,
      0,
      Math.PI * 2,
      0,
      Math.PI / 2
    );

    // Scale to fit the footprint OBB and desired height
    geom.scale(
      hL / baseRadius,
      params.roofHeight / baseRadius,
      hW / baseRadius
    );

    // Rotate to match ridge direction — dome is symmetric so only the
    // stretch matters, but we still need to align the OBB axes
    const cx = obb.center[0];
    const cz = -obb.center[1];

    // The OBB may be rotated. We need to rotate the dome geometry to match.
    // The SphereGeometry is axis-aligned. Rotate by the ridge angle around Y.
    geom.rotateY(-params.ridgeAngle);
    geom.translate(cx, 0, cz);

    return geom;
  }

  private createOnion(params: RoofParams): BufferGeometry {
    const obb = computeOBB(params.outerRing);
    const hL = obb.halfLength;
    const hW = obb.halfWidth;
    const baseRadius = Math.min(hL, hW);

    // Start from upper hemisphere
    const geom = new SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);

    // Modify vertices for onion profile: wider at ~30% height, narrows to point
    const pos = geom.attributes.position!;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i); // 0 at equator, 1 at pole (unit sphere)
      // Onion profile: bulge at lower portion, pinch at top
      const t = y; // [0, 1]
      const bulge = 1 + 0.35 * Math.sin(t * Math.PI);
      const taper = 1 - t * 0.2;
      const scale = taper * bulge;
      pos.setX(i, pos.getX(i) * scale);
      pos.setZ(i, pos.getZ(i) * scale);
    }
    pos.needsUpdate = true;

    // Scale to fit footprint and height
    geom.scale(hL / baseRadius, params.roofHeight, hW / baseRadius);

    geom.rotateY(-params.ridgeAngle);
    const cx = obb.center[0];
    const cz = -obb.center[1];
    geom.translate(cx, 0, cz);
    geom.computeVertexNormals();
    return geom;
  }

  private createCone(params: RoofParams): BufferGeometry {
    const obb = computeOBB(params.outerRing);
    const hL = obb.halfLength;
    const hW = obb.halfWidth;
    const baseRadius = Math.min(hL, hW);

    // Cone: open-ended (no base cap, wall extrusion cap covers it)
    const geom = new ConeGeometry(baseRadius, params.roofHeight, 16, 1, true);

    // ConeGeometry centers at origin; translate so base is at Y=0
    geom.translate(0, params.roofHeight / 2, 0);

    // Scale to fit elongated footprint
    geom.scale(hL / baseRadius, 1, hW / baseRadius);

    geom.rotateY(-params.ridgeAngle);
    const cx = obb.center[0];
    const cz = -obb.center[1];
    geom.translate(cx, 0, cz);
    return geom;
  }
}
