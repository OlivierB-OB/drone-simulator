/**
 * Represents coordinates in Web Mercator projection
 */
export interface MercatorCoordinates {
  x: number;
  y: number;
}

/**
 * Converts Mercator coordinates to Three.js world space coordinates.
 *
 * Mercator to Three.js mapping:
 * - X: direct (East = +X)
 * - Y: elevation (Up = +Y)
 * - Z: negated Mercator Y (North = -Z, aligns with Three.js camera default)
 *
 * @param location - Mercator coordinates in meters
 * @param elevation - Altitude in meters above sea level
 * @returns Three.js position {x, y, z}
 */
export function mercatorToThreeJs(
  location: MercatorCoordinates,
  elevation: number
): { x: number; y: number; z: number } {
  return {
    x: location.x,
    y: elevation,
    z: -location.y,
  };
}
