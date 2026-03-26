import type { OBB } from './types';

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
 * Returns the 4 OBB corner positions in Three.js XZ space (Y=0) for a given
 * OBB and ridge angle. Corner order:
 *   [0]: +along, +across (C0)
 *   [1]: +along, -across (C1)
 *   [2]: -along, -across (C2)
 *   [3]: -along, +across (C3)
 *
 * Along-ridge Three.js XZ: (cos, -sin)
 * Across-ridge Three.js XZ: (-sin, -cos)
 */
export function getOBBCorners(
  obb: OBB,
  ridgeAngle: number
): [number, number, number][] {
  const cos = Math.cos(ridgeAngle);
  const sin = Math.sin(ridgeAngle);
  const cx = obb.center[0];
  const cz = -obb.center[1]; // Three.js Z = -Mercator Y
  const hL = obb.halfLength;
  const hW = obb.halfWidth;
  return [
    [cx + hL * cos - hW * sin, 0, cz - hL * sin - hW * cos], // C0: +along +across
    [cx + hL * cos + hW * sin, 0, cz - hL * sin + hW * cos], // C1: +along -across
    [cx - hL * cos + hW * sin, 0, cz + hL * sin + hW * cos], // C2: -along -across
    [cx - hL * cos - hW * sin, 0, cz + hL * sin - hW * cos], // C3: -along +across
  ];
}

/**
 * Returns the distance from the polygon centroid (origin) to the polygon
 * boundary in direction `theta` (radians, Mercator XY plane).
 * Ring vertices are centroid-relative: [mercX, mercY].
 * Falls back to OBB half-extent if no intersection is found (concave edge case).
 */
export function polygonExtentAtAngle(
  ring: [number, number][],
  theta: number
): number {
  const dx = Math.cos(theta);
  const dz = Math.sin(theta);
  let best = Infinity;
  for (let i = 0; i < ring.length; i++) {
    const [ax, ay] = ring[i]!;
    const [bx, by] = ring[(i + 1) % ring.length]!;
    const ex = bx - ax;
    const ey = by - ay;
    const denom = dx * ey - dz * ex;
    if (Math.abs(denom) < 1e-10) continue;
    const t = (ax * ey - ay * ex) / denom;
    const s = (ax * dz - ay * dx) / denom;
    if (t > 0 && s >= 0 && s <= 1) best = Math.min(best, t);
  }
  if (isFinite(best)) return best;
  // Fallback: OBB half-extent
  const obb = computeOBB(ring);
  const localTheta = theta - obb.angle;
  return Math.sqrt(
    Math.pow(obb.halfLength * Math.cos(localTheta), 2) +
      Math.pow(obb.halfWidth * Math.sin(localTheta), 2)
  );
}
