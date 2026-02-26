/**
 * Polygon geometry utilities for OSM data interpretation.
 */

/**
 * Ray-casting point-in-polygon test.
 * Works for both open rings (first !== last) and closed rings (first === last).
 */
export function pointInPolygon(
  point: [number, number],
  ring: [number, number][]
): boolean {
  const [px, py] = point;
  const n = ring.length;
  let inside = false;

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const [xi, yi] = ring[i]!;
    const [xj, yj] = ring[j]!;
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }

  return inside;
}

/**
 * Arithmetic mean of ring vertices.
 * Excludes the closing duplicate point if present (first === last).
 */
export function ringCentroid(ring: [number, number][]): [number, number] {
  const last = ring[ring.length - 1]!;
  const first = ring[0]!;
  const isClosed = first[0] === last[0] && first[1] === last[1];
  const count = isClosed ? ring.length - 1 : ring.length;

  let sumX = 0;
  let sumY = 0;
  for (let i = 0; i < count; i++) {
    sumX += ring[i]![0];
    sumY += ring[i]![1];
  }

  return [sumX / count, sumY / count];
}
